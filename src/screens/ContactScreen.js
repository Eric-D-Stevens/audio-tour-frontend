import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import AppHeader from '../components/AppHeader';
import { useTheme } from '../contexts';

const ContactScreen = ({ navigation }) => {
  const { colors, isDark } = useTheme();

  const dynamicStyles = {
    container: { flex: 1, backgroundColor: colors.background },
    heading: { fontSize: 24, fontWeight: 'bold', color: colors.primary, marginBottom: 15 },
    subheading: { fontSize: 18, fontWeight: 'bold', color: colors.text, marginTop: 20, marginBottom: 10 },
    paragraph: { fontSize: 16, lineHeight: 24, color: colors.textSecondary, marginBottom: 15 },
    contactCard: {
      backgroundColor: colors.card,
      borderRadius: 10,
      padding: 20,
      marginVertical: 15,
      shadowColor: colors.shadowColor,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDark ? 0.3 : 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    contactLabel: { fontSize: 16, fontWeight: 'bold', color: colors.text, marginBottom: 5 },
    contactValue: { fontSize: 16, color: colors.textSecondary, lineHeight: 22 },
    divider: { height: 1, backgroundColor: colors.divider, marginVertical: 10 },
    footerText: { fontSize: 16, color: colors.textMuted, fontStyle: 'italic' },
  };

  const handleEmailPress = () => {
    Linking.openURL('mailto:e.stevens@tensorworks.co');
  };

  const handleWebsitePress = () => {
    Linking.openURL('https://eric-d-stevens.github.io/tensortours-app-site/');
  };

  return (
    <SafeAreaView style={dynamicStyles.container}>
      <StatusBar style={isDark ? 'light' : 'dark'} backgroundColor={colors.background} />
      <AppHeader navigation={navigation} title="Contact Us" />
      <ScrollView style={styles.content}>
        <Text style={dynamicStyles.heading}>Get in Touch</Text>
        
        <Text style={dynamicStyles.paragraph}>
          We'd love to hear from you! Whether you have a question about our services,
          need technical support, or want to share your feedback, our team is here to help.
        </Text>
        
        <View style={dynamicStyles.contactCard}>
          <View style={styles.contactItem}>
            <Ionicons name="mail-outline" size={24} color={colors.primary} />
            <View style={styles.contactTextContainer}>
              <Text style={dynamicStyles.contactLabel}>Email Us</Text>
              <TouchableOpacity onPress={handleEmailPress}>
                <Text style={dynamicStyles.contactValue}>e.stevens@tensorworks.co</Text>
              </TouchableOpacity>
            </View>
          </View>
          
          <View style={dynamicStyles.divider} />
          
          <View style={styles.contactItem}>
            <Ionicons name="globe-outline" size={24} color={colors.primary} />
            <View style={styles.contactTextContainer}>
              <Text style={dynamicStyles.contactLabel}>Website</Text>
              <TouchableOpacity onPress={handleWebsitePress}>
                <Text style={[dynamicStyles.contactValue, { textDecorationLine: 'underline' }]}>TensorTours Website</Text>
              </TouchableOpacity>
            </View>
          </View>
          
          <View style={dynamicStyles.divider} />
          
          <View style={styles.contactItem}>
            <Ionicons name="location-outline" size={24} color={colors.primary} />
            <View style={styles.contactTextContainer}>
              <Text style={dynamicStyles.contactValue}>Portland, OR 97201</Text>
            </View>
          </View>
        </View>
        
        <Text style={dynamicStyles.subheading}>Support Hours</Text>
        <Text style={dynamicStyles.paragraph}>
          Our support team is available Monday through Friday, 9:00 AM to 5:00 PM Pacific Time.
          We strive to respond to all inquiries within 24 hours during business days.
        </Text>
        
        <Text style={dynamicStyles.subheading}>Feedback</Text>
        <Text style={dynamicStyles.paragraph}>
          Your feedback helps us improve! We're constantly working to make TensorTours better,
          and we value your suggestions and comments.
        </Text>
        
        <View style={styles.footer}>
          <Text style={dynamicStyles.footerText}>
            Thank you for using TensorTours!
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  heading: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF5722',
    marginBottom: 15,
  },
  subheading: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
    marginBottom: 10,
  },
  paragraph: {
    fontSize: 16,
    lineHeight: 24,
    color: '#444',
    marginBottom: 15,
  },
  contactCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    marginVertical: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 10,
  },
  contactTextContainer: {
    marginLeft: 15,
    flex: 1,
  },
  contactLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  contactValue: {
    fontSize: 16,
    color: '#444',
    lineHeight: 22,
  },
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 10,
  },
  footer: {
    marginTop: 30,
    marginBottom: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 16,
    color: '#777',
    fontStyle: 'italic',
  },
});

export default ContactScreen;
