import logger from '../utils/logger';

/**
 * Tour Data Prefetch Cache
 * 
 * LRU cache (~100 items) that prefetches tour data in the background
 * after points are loaded on the map. On cache miss, automatically
 * retries all previously missed items.
 * 
 * Usage:
 *   - After points load: tourCache.prefill(placeIds, tourType, fetchFn)
 *   - Before API call:   const cached = tourCache.get(placeId, tourType)
 *   - After on-demand:   tourCache.set(placeId, tourType, data)
 */

type FetchFn = (placeId: string, tourType: string) => Promise<any>;

interface CacheEntry {
  status: 'hit' | 'miss';
  data: any | null;
  lastAccessed: number;
  lastAttempt: number;
}

const CACHE_KEY_SEP = '||';
const MAX_SIZE = 500;
const RETRY_DEBOUNCE_MS = 500;
const RETRY_STAGGER_MS = 200;
const RETRY_COOLDOWN_MS = 30_000; // Don't retry a miss more than once per 30s

class TourCache {
  private cache: Map<string, CacheEntry> = new Map();
  private fetchFn: FetchFn | null = null;
  private retryTimeout: ReturnType<typeof setTimeout> | null = null;

  private makeKey(placeId: string, tourType: string): string {
    return `${placeId}${CACHE_KEY_SEP}${tourType}`;
  }

  private parseKey(key: string): { placeId: string; tourType: string } {
    const [placeId, tourType] = key.split(CACHE_KEY_SEP);
    return { placeId, tourType };
  }

  /**
   * Get a cached tour response. Returns the data or null.
   * On miss, triggers a background retry of ALL missed items.
   */
  get(placeId: string, tourType: string): any | null {
    const key = this.makeKey(placeId, tourType);
    const entry = this.cache.get(key);

    if (!entry) {
      logger.debug(`TourCache.get: NO ENTRY for ${placeId} [${tourType}]`);
      return null;
    }

    if (entry.status === 'miss') {
      logger.debug(`TourCache.get: MISS (not yet generated) for ${placeId} [${tourType}] — triggering retry of all misses`);
      // Trigger background retry of all misses
      this.retryMisses();
      return null;
    }

    // LRU: move to end of Map by re-inserting
    this.cache.delete(key);
    this.cache.set(key, { ...entry, lastAccessed: Date.now() });
    const stats = this.getStats();
    logger.debug(`TourCache.get: HIT for ${placeId} [${tourType}] — cache: ${stats.hits} hits, ${stats.misses} misses, ${stats.total} total`);
    return entry.data;
  }

  /**
   * Store a successful tour response in the cache.
   */
  set(placeId: string, tourType: string, data: any): void {
    const key = this.makeKey(placeId, tourType);

    // If already exists, delete first so re-insert moves to end (LRU)
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }

    this.cache.set(key, {
      status: 'hit',
      data,
      lastAccessed: Date.now(),
      lastAttempt: Date.now(),
    });

    const stats = this.getStats();
    logger.debug(`TourCache.set: stored ${placeId} [${tourType}] — cache: ${stats.hits} hits, ${stats.misses} misses, ${stats.total} total`);
    this.evict();
  }

  /**
   * Record a miss (tour not generated yet / fetch failed).
   */
  recordMiss(placeId: string, tourType: string): void {
    const key = this.makeKey(placeId, tourType);

    // Don't overwrite a hit with a miss
    const existing = this.cache.get(key);
    if (existing && existing.status === 'hit') {
      return;
    }

    if (this.cache.has(key)) {
      this.cache.delete(key);
    }

    this.cache.set(key, {
      status: 'miss',
      data: null,
      lastAccessed: Date.now(),
      lastAttempt: Date.now(),
    });

    const stats = this.getStats();
    logger.debug(`TourCache.recordMiss: ${placeId} [${tourType}] — cache: ${stats.hits} hits, ${stats.misses} misses, ${stats.total} total`);
    this.evict();
  }

  /**
   * Prefill the cache by kicking off background fetches for a list of place IDs.
   * Skips items already cached as hits. Also retries existing misses.
   * Stores the fetchFn for future retry use.
   */
  prefill(
    placeIds: string[],
    tourType: string,
    fetchFn: FetchFn
  ): void {
    // Store fetchFn for retryMisses
    this.fetchFn = fetchFn;

    const toFetch: string[] = [];

    for (const placeId of placeIds) {
      if (!placeId) continue;
      const key = this.makeKey(placeId, tourType);
      const existing = this.cache.get(key);

      if (existing && existing.status === 'hit') {
        // Already have good data, skip
        continue;
      }

      toFetch.push(placeId);
    }

    if (toFetch.length === 0) {
      logger.debug(`TourCache: prefill skipped, all ${placeIds.length} items already cached`);
      return;
    }

    logger.debug(`TourCache: prefilling ${toFetch.length} items (${placeIds.length - toFetch.length} already cached)`);

    // Fire staggered background fetches
    toFetch.forEach((placeId, i) => {
      setTimeout(async () => {
        try {
          const data = await fetchFn(placeId, tourType);
          this.set(placeId, tourType, data);
          logger.debug(`TourCache: prefill hit for ${placeId}`);
        } catch (err) {
          this.recordMiss(placeId, tourType);
          logger.debug(`TourCache: prefill miss for ${placeId}`);
        }
      }, i * RETRY_STAGGER_MS);
    });
  }

  /**
   * Retry all missed items in the cache. Debounced so rapid
   * cache misses (e.g. tapping multiple markers) only trigger one pass.
   */
  private retryMisses(): void {
    if (!this.fetchFn) return;
    if (this.retryTimeout) return; // Already scheduled

    this.retryTimeout = setTimeout(() => {
      this.retryTimeout = null;

      if (!this.fetchFn) return;

      const now = Date.now();
      const misses: { placeId: string; tourType: string }[] = [];
      let skippedCooldown = 0;
      for (const [key, entry] of this.cache.entries()) {
        if (entry.status === 'miss') {
          if (now - entry.lastAttempt < RETRY_COOLDOWN_MS) {
            skippedCooldown++;
            continue; // Too soon to retry this one
          }
          misses.push(this.parseKey(key));
        }
      }

      if (misses.length === 0) {
        if (skippedCooldown > 0) {
          logger.debug(`TourCache: ${skippedCooldown} misses on cooldown, skipping retry`);
        }
        return;
      }

      logger.debug(`TourCache: retrying ${misses.length} missed items (${skippedCooldown} on cooldown)`);

      const fn = this.fetchFn;
      misses.forEach((miss, i) => {
        setTimeout(async () => {
          try {
            const data = await fn(miss.placeId, miss.tourType);
            this.set(miss.placeId, miss.tourType, data);
            logger.debug(`TourCache: retry succeeded for ${miss.placeId}`);
          } catch {
            // Still a miss — leave it, will retry on next cache miss
          }
        }, i * RETRY_STAGGER_MS);
      });
    }, RETRY_DEBOUNCE_MS);
  }

  /**
   * Evict oldest-accessed entries when cache exceeds max size.
   */
  private evict(): void {
    while (this.cache.size > MAX_SIZE) {
      // Map iterator returns entries in insertion order.
      // Since we re-insert on access, the first entry is the LRU.
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) {
        this.cache.delete(firstKey);
        logger.debug(`TourCache: evicted LRU entry`);
      } else {
        break;
      }
    }
  }

  /**
   * Clear the entire cache (e.g. on logout or tour type change).
   */
  clear(): void {
    this.cache.clear();
    this.fetchFn = null;
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
      this.retryTimeout = null;
    }
    logger.debug('TourCache: cleared');
  }

  /**
   * Get cache stats for debugging.
   */
  getStats(): { total: number; hits: number; misses: number } {
    let hits = 0;
    let misses = 0;
    for (const entry of this.cache.values()) {
      if (entry.status === 'hit') hits++;
      else misses++;
    }
    return { total: this.cache.size, hits, misses };
  }
}

export const tourCache = new TourCache();
export default tourCache;
