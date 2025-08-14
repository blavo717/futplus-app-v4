import { LinkingOptions } from '@react-navigation/native';

export const linking: LinkingOptions<{}> = {
  prefixes: ['futplus://'],
  config: {
    screens: {
      // Handle email verification deep link
      emailVerified: 'email-verified',
      resetPassword: 'reset-password',
      authCallback: 'auth-callback',
    },
  },
};