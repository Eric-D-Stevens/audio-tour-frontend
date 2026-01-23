import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts';

const PrivacyPolicyScreen = ({ navigation }) => {
  const { colors, isDark } = useTheme();

  const dynamicStyles = {
    container: { flex: 1, backgroundColor: colors.background },
    header: { borderBottomColor: colors.border },
    headerTitle: { color: colors.text },
    content: { padding: 16, backgroundColor: colors.background },
    lastUpdated: { color: colors.text },
    sectionTitle: { color: colors.primary },
    paragraph: { color: colors.text },
    bulletItem: { color: colors.text },
    contactInfo: { color: colors.text },
  };

  return (
    <SafeAreaView style={[styles.container, dynamicStyles.container]}>
      <View style={[styles.header, dynamicStyles.header]}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, dynamicStyles.headerTitle]}>Privacy Policy</Text>
      </View>
      
      <ScrollView style={[styles.content, dynamicStyles.content]}>
        <Text style={[styles.lastUpdated, dynamicStyles.lastUpdated]}>Last Updated: April 24, 2025</Text>
        
        <Text style={[styles.sectionTitle, dynamicStyles.sectionTitle]}>Introduction</Text>
        <Text style={[styles.paragraph, dynamicStyles.paragraph]}>
          Welcome to TensorTours. We respect your privacy and are committed to protecting your personal data. 
          This Privacy Policy explains how we collect, use, disclose, and safeguard your information when 
          you use our TensorTours mobile application.
        </Text>
        
        <Text style={[styles.paragraph, dynamicStyles.paragraph]}>
          Please read this Privacy Policy carefully. If you do not agree with the terms of this Privacy Policy, 
          please do not access or use the Application.
        </Text>
        
        <Text style={[styles.sectionTitle, dynamicStyles.sectionTitle]}>Who We Are</Text>
        <Text style={[styles.paragraph, dynamicStyles.paragraph]}>
          TensorTours is an AI-powered audio tour application that provides personalized, location-based 
          audio guides for travelers. Our application is available on iOS and Android devices.
        </Text>
        
        <Text style={[styles.sectionTitle, dynamicStyles.sectionTitle]}>Information We Collect</Text>
        
        <Text style={[styles.subSectionTitle, { color: colors.text }]}>Information You Provide to Us</Text>
        <Text style={[styles.bulletItem, dynamicStyles.bulletItem]}>• Account Information: When you register for an account, we collect your name, email address, and password.</Text>
        <Text style={[styles.bulletItem, dynamicStyles.bulletItem]}>• User Preferences: Your selected tour preferences including duration, categories (History, Art, Culture, Food & Drink, Architecture, Nature), and other customization options.</Text>
        <Text style={[styles.bulletItem, dynamicStyles.bulletItem]}>• User-Generated Content: Any feedback, ratings, or comments you provide within the application.</Text>
        
        <Text style={[styles.subSectionTitle, { color: colors.text }]}>Information We Collect Automatically</Text>
        <Text style={[styles.bulletItem, dynamicStyles.bulletItem]}>• Location Data: With your permission, we collect precise location data to provide you with relevant audio tours for nearby points of interest. This is a core functionality of our service.</Text>
        <Text style={[styles.bulletItem, dynamicStyles.bulletItem]}>• Device Information: Information about your mobile device including device model, operating system, unique device identifiers, IP address, mobile network information, and mobile operating system.</Text>
        <Text style={[styles.bulletItem, dynamicStyles.bulletItem]}>• Usage Data: Information about how you use our Application, including tour history, duration of use, features accessed, and interaction with content.</Text>
        <Text style={[styles.bulletItem, dynamicStyles.bulletItem]}>• Diagnostic Data: Crash reports and performance data to help us improve the Application.</Text>
        
        <Text style={[styles.sectionTitle, dynamicStyles.sectionTitle]}>How We Use Your Information</Text>
        <Text style={[styles.paragraph, dynamicStyles.paragraph]}>We use the information we collect to:</Text>
        <Text style={[styles.bulletItem, dynamicStyles.bulletItem]}>• Provide, maintain, and improve the TensorTours application</Text>
        <Text style={[styles.bulletItem, dynamicStyles.bulletItem]}>• Generate personalized audio tour content based on your location and preferences</Text>
        <Text style={[styles.bulletItem, dynamicStyles.bulletItem]}>• Authenticate users and manage user accounts</Text>
        <Text style={[styles.bulletItem, dynamicStyles.bulletItem]}>• Process and respond to user inquiries and requests</Text>
        <Text style={[styles.bulletItem, dynamicStyles.bulletItem]}>• Analyze usage patterns to enhance user experience</Text>
        <Text style={[styles.bulletItem, dynamicStyles.bulletItem]}>• Debug and fix issues in the Application</Text>
        <Text style={[styles.bulletItem, dynamicStyles.bulletItem]}>• Comply with legal obligations</Text>
        
        <Text style={[styles.sectionTitle, dynamicStyles.sectionTitle]}>Third-Party Services</Text>
        <Text style={[styles.paragraph, dynamicStyles.paragraph]}>
          TensorTours uses the following third-party services:
        </Text>
        <Text style={[styles.bulletItem, dynamicStyles.bulletItem]}>• Google Places API: We use Google Places API to retrieve photos and information about points of interest. Information about your location may be shared with Google to provide this service.</Text>
        <Text style={[styles.bulletItem, dynamicStyles.bulletItem]}>• Amazon Web Services (AWS): We use AWS services, including Amazon Cognito for authentication and other AWS services for hosting our backend infrastructure.</Text>
        <Text style={[styles.bulletItem, dynamicStyles.bulletItem]}>• Analytics Providers: We may use analytics providers to help us understand how users interact with our Application.</Text>
        
        <Text style={[styles.paragraph, dynamicStyles.paragraph]}>
          Each of these third parties has their own privacy policies addressing how they use such information.
        </Text>
        
        <Text style={[styles.sectionTitle, dynamicStyles.sectionTitle]}>Children's Privacy</Text>
        <Text style={[styles.paragraph, dynamicStyles.paragraph]}>
          The Application is intended for a general audience and is not directed to children under the age of 13. 
          We do not knowingly collect personally identifiable information from children under 13, 
          and we do not ask for age information from our users.
        </Text>
        <Text style={[styles.paragraph, dynamicStyles.paragraph]}>
          Please note that we collect the same information from all users regardless of age, as we do not 
          have the technical means to differentiate between users under 13 and other users. Therefore, 
          parents and guardians should monitor their children's use of our Application and supervise their interactions.
        </Text>
        <Text style={[styles.paragraph, dynamicStyles.paragraph]}>
          If we learn that we have inadvertently collected personal information from a child under 13, 
          we will take steps to delete that information as soon as possible. If you are a parent or guardian 
          and you believe that your child has provided us with personal information, please contact us at 
          the email address provided below.
        </Text>
        
        <Text style={[styles.sectionTitle, dynamicStyles.sectionTitle]}>Contact Us</Text>
        <Text style={[styles.paragraph, dynamicStyles.paragraph]}>
          If you have questions or concerns about this Privacy Policy, please contact us at:
        </Text>
        <Text style={[styles.contactInfo, dynamicStyles.contactInfo]}>Email: e.stevens@tensorworks.co</Text>
        <Text style={[styles.contactInfo, dynamicStyles.contactInfo]}>TensorWorks</Text>
        
        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 12,
    color: '#333',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  lastUpdated: {
    fontStyle: 'italic',
    color: '#666',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF5722',
    marginTop: 24,
    marginBottom: 8,
  },
  subSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  paragraph: {
    fontSize: 14,
    lineHeight: 20,
    color: '#333',
    marginBottom: 12,
  },
  bulletItem: {
    fontSize: 14,
    lineHeight: 20,
    color: '#333',
    marginBottom: 8,
    paddingLeft: 16,
  },
  contactInfo: {
    fontSize: 14,
    lineHeight: 20,
    color: '#333',
    fontWeight: '500',
  },
  bottomPadding: {
    height: 40,
  },
});

export default PrivacyPolicyScreen;
