import React, { useState, useContext } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Modal,
  SafeAreaView,
  ScrollView,
  Image,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext, useTheme } from '../contexts';

const AppHeader = ({ navigation, title }) => {
  const { colors, isDark } = useTheme();
  const authContext = useContext(AuthContext);
  const { user, handleLogout } = authContext;
  const [menuVisible, setMenuVisible] = useState(false);
  
  const toggleMenu = () => {
    setMenuVisible(!menuVisible);
  };
  
  const closeMenu = () => {
    setMenuVisible(false);
  };
  
  const handleNavigate = (screen) => {
    closeMenu();
    navigation.navigate(screen);
  };
  
  return (
    <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
      <View style={styles.headerLeft}>
        <Image 
          source={require('../../assets/header-icon.png')} 
          style={styles.logoImage} 
        />
        <Text style={[styles.headerTitle, { color: colors.primary }]}>{title || 'TensorTours'}</Text>
      </View>
      
      <View style={styles.headerRight}>
        <TouchableOpacity 
          style={styles.iconButton}
          onPress={toggleMenu}
        >
          <Ionicons name="menu" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>
      
      {/* Hamburger Menu Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={menuVisible}
        onRequestClose={closeMenu}
      >
        <SafeAreaView style={[styles.menuContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.menuHeader, { borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={closeMenu}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.menuTitle, { color: colors.text }]}>Menu</Text>
            <View style={styles.placeholder} />
          </View>
          
          <ScrollView style={styles.menuContent}>
            <View style={[styles.userSection, { borderBottomColor: colors.border }]}>
              <View style={[styles.userIcon, { backgroundColor: colors.primary }]}>
                <Ionicons name="person" size={32} color="#FFF" />
              </View>
              <Text style={[styles.userName, { color: colors.text }]}>{user ? user.username : 'Guest'}</Text>
            </View>
            
            <View style={styles.menuItems}>
              <TouchableOpacity 
                style={styles.menuItem}
                onPress={() => handleNavigate(user ? 'Map' : 'GuestMap')}
              >
                <Ionicons name="map-outline" size={20} color={colors.text} />
                <Text style={[styles.menuItemText, { color: colors.text }]}>Map</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.menuItem}
                onPress={() => handleNavigate('About')}
              >
                <Ionicons name="information-circle-outline" size={20} color={colors.text} />
                <Text style={[styles.menuItemText, { color: colors.text }]}>About</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.menuItem}
                onPress={() => handleNavigate('Contact')}
              >
                <Ionicons name="mail-outline" size={20} color={colors.text} />
                <Text style={[styles.menuItemText, { color: colors.text }]}>Contact Us</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.menuItem}
                onPress={() => handleNavigate('Support')}
              >
                <Ionicons name="help-circle-outline" size={20} color={colors.text} />
                <Text style={[styles.menuItemText, { color: colors.text }]}>Support</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.menuItem}
                onPress={() => handleNavigate('Privacy')}
              >
                <Ionicons name="shield-outline" size={20} color={colors.text} />
                <Text style={[styles.menuItemText, { color: colors.text }]}>Privacy</Text>
              </TouchableOpacity>
              
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              
              {user ? (
                <>
                  <TouchableOpacity 
                    style={styles.menuItem}
                    onPress={async () => {
                      closeMenu();
                      await handleLogout();
                      // Force navigation to Auth screen after logout
                      navigation.reset({
                        index: 0,
                        routes: [{ name: 'Auth' }]
                      });
                    }}
                  >
                    <Ionicons name="log-out-outline" size={20} color={colors.primary} />
                    <Text style={[styles.menuItemText, { color: colors.primary }]}>Logout</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.menuItem}
                    onPress={() => {
                      closeMenu();
                      Alert.alert(
                        'Delete Account',
                        'Are you sure you want to delete your account? This action cannot be undone.',
                        [
                          {
                            text: 'Cancel',
                            style: 'cancel'
                          },
                          {
                            text: 'Delete Account',
                            style: 'destructive',
                            onPress: async () => {
                              try {
                                // Show a loading indicator
                                Alert.alert('Deleting Account', 'Please wait...');
                                await authContext.deleteAccount();
                                Alert.alert(
                                  'Account Deleted',
                                  'Your account has been successfully deleted.',
                                  [{ text: 'OK' }]
                                );
                                // Will automatically navigate to Auth screen due to isAuthenticated state change
                              } catch (error) {
                                Alert.alert(
                                  'Error',
                                  error.message || 'Failed to delete account. Please try again later.',
                                  [{ text: 'OK' }]
                                );
                              }
                            }
                          }
                        ]
                      );
                    }}
                  >
                    <Ionicons name="trash-outline" size={20} color={colors.error} />
                    <Text style={[styles.menuItemText, { color: colors.error }]}>Delete Account</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <TouchableOpacity 
                  style={styles.menuItem}
                  onPress={() => {
                    closeMenu();
                    navigation.navigate('Auth');
                  }}
                >
                  <Ionicons name="log-in-outline" size={20} color={colors.primary} />
                  <Text style={[styles.menuItemText, { color: colors.primary }]}>Sign In</Text>
                </TouchableOpacity>
              )}
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: 'white',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoImage: {
    width: 30,
    height: 30,
    resizeMode: 'contain',
    borderRadius: 6,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FF5722',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    padding: 5,
  },
  menuContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  menuHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  menuTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  placeholder: {
    width: 24,
  },
  menuContent: {
    flex: 1,
  },
  userSection: {
    padding: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  userIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FF5722',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  menuItems: {
    padding: 15,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
  },
  menuItemText: {
    fontSize: 16,
    marginLeft: 15,
    color: '#333',
  },
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 10,
  },
});

export default AppHeader;
