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
  backgroundColor: '#121417', // charbon derrière la webview (safe areas) -> plus de bandes blanches

  server: {
    // App déployée en HTTPS -> contexte sécurisé (getUserMedia/micro OK) et
    // joignable partout (Wi-Fi + cellulaire), sur simulateur ET iPhone physique.
    // Pour développer en local : remplacer temporairement par
    //   url: 'http://localhost:3000', cleartext: true
    // (et remettre l'exception ATS DEV dans Info.plist).
    url: 'https://forkjam.app',
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
    // Écran de lancement : logo ForkJam sur charbon pendant le chargement
    // de la webview (au lieu d'un écran noir).
    SplashScreen: {
      launchShowDuration: 2500,
      launchAutoHide: true,
      backgroundColor: "#121417",
      showSpinner: false,
    },
  },
};

export default config;
