import { CapacitorConfig } from '@capacitor/cli';

/**
 * ForkJam — wrapper natif Capacitor.
 *
 * L'app Next.js est rendue côté serveur (auth Supabase SSR) : elle ne peut pas
 * être exportée en statique. La webview charge donc le serveur via `server.url`.
 *
 * DEV  : pointer sur le serveur Next en réseau local (LAN) — voir ci-dessous.
 *        Le simulateur iOS accepte aussi http://localhost:3000.
 * PROD : remplacer server.url par l'URL déployée (https://…) et retirer cleartext.
 */
const config: CapacitorConfig = {
  appId: 'com.forkjam.app',
  appName: 'ForkJam',
  webDir: 'capacitor-shell', // placeholder ; le contenu réel vient de server.url

  server: {
    // IP LAN du Mac + port fixe du `npm run dev` (voir script dev = next dev -p 3000).
    // Le tel/simulateur doit être sur le même réseau Wi-Fi.
    url: 'http://192.168.1.7:3000',
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
