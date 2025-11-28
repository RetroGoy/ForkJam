import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.forkjam.app',
  appName: 'ForkJam',
  webDir: '.next',    

  server: {
    url: 'http://192.168.1.12:3000',
    cleartext: true,
  },

  ios: {
    contentInset: 'always',
    allowsLinkPreview: false,
  },

  android: {
    allowMixedContent: true,
    useLegacyBridge: false,
  },

  plugins: {
    SplashScreen: {
      launchShowDuration: 0,
    },
  },
};

export default config;