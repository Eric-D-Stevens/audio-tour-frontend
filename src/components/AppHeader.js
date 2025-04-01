import React, { useState, useContext } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Modal,
  SafeAreaView,
  ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../../App';

const AppHeader = ({ navigation, title }) => {
  const { user, handleLogout } = useContext(AuthContext);
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
    <View style={styles.header}>
      <Text style={styles.headerTitle}>{title || 'TensorTours'}</Text>
      
      <View style={styles.headerRight}>
        <TouchableOpacity 
          style={styles.iconButton}
          onPress={toggleMenu}
        >
          <Ionicons name="menu" size={24} color="#333" />
        </TouchableOpacity>
      </View>
      
      {/* Hamburger Menu Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={menuVisible}
        onRequestClose={closeMenu}
      >
        <SafeAreaView style={styles.menuContainer}>
          <View style={styles.menuHeader}>
            <TouchableOpacity onPress={closeMenu}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
            <Text style={styles.menuTitle}>Menu</Text>
            <View style={styles.placeholder} />
          </View>
          
          <ScrollView style={styles.menuContent}>
            <View style={styles.userSection}>
              <View style={styles.userIcon}>
                <Ionicons name="person" size={32} color="#FFF" />
              </View>
              <Text style={styles.userName}>{user ? user.username : 'Guest'}</Text>
            </View>
            
            <View style={styles.menuItems}>
              <TouchableOpacity 
                style={styles.menuItem}
                onPress={() => handleNavigate('Map')}
              >
                <Ionicons name="map-outline" size={20} color="#333" />
                <Text style={styles.menuItemText}>Map</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.menuItem}
                onPress={() => handleNavigate('Audio')}
              >
                <Ionicons name="headset-outline" size={20} color="#333" />
                <Text style={styles.menuItemText}>Audio Tours</Text>
              </TouchableOpacity>
              
              <View style={styles.divider} />
              
              {user ? (
                <TouchableOpacity 
                  style={styles.menuItem}
                  onPress={() => {
                    closeMenu();
                    handleLogout();
                  }}
                >
                  <Ionicons name="log-out-outline" size={20} color="#FF5722" />
                  <Text style={[styles.menuItemText, { color: '#FF5722' }]}>Logout</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity 
                  style={styles.menuItem}
                  onPress={() => {
                    closeMenu();
                    navigation.navigate('Auth');
                  }}
                >
                  <Ionicons name="log-in-outline" size={20} color="#FF5722" />
                  <Text style={[styles.menuItemText, { color: '#FF5722' }]}>Sign In</Text>
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
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: 'white',
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
