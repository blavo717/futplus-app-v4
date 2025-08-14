import React, { useEffect, useContext } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Linking } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import RootNavigator from './src/navigation/RootNavigator';
import { Colors } from './src/constants/colors';
import { linking } from './src/navigation/linking';

// Ensure web browser sessions complete properly
WebBrowser.maybeCompleteAuthSession();

// Create a wrapper component to handle deep links with auth context
const AppContent: React.FC = () => {
  const { handleEmailVerificationDeepLink, refreshAuth } = useAuth();

  useEffect(() => {
    // Handle deep links when app is opened from background
    const handleDeepLink = async (url: string) => {
      console.log('Deep link received:', url);
      
      // Handle email verification deep link
      if (url.includes('futplus://email-verified')) {
        console.log('Email verification deep link detected');
        
        try {
          // Force refresh auth state to check if email is now verified
          await refreshAuth();
          
          // Handle the verification through auth context
          const verified = await handleEmailVerificationDeepLink();
          
          if (verified) {
            console.log('Email verification successful via deep link');
          } else {
            console.log('Email verification pending or failed');
          }
        } catch (error) {
          console.error('Error handling email verification deep link:', error);
        }
      } else if (url.includes('futplus://auth-callback')) {
        // Handle Google OAuth callback
        console.log('Google OAuth callback detected');
        // The actual handling is done in authService.signInWithGoogle
        // This is just for logging purposes
      }
    };

    // Listen for deep links
    const subscription = Linking.addEventListener('url', (event) => {
      handleDeepLink(event.url);
    });

    // Check initial URL when app is opened
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLink(url);
      }
    });

    return () => {
      subscription?.remove();
    };
  }, [handleEmailVerificationDeepLink, refreshAuth]);

  return <RootNavigator />;
};

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <NavigationContainer linking={linking}>
          <StatusBar style="light" backgroundColor={Colors.primary} />
          <AppContent />
        </NavigationContainer>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
