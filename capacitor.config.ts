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
    // SIMULATEUR iOS : localhost = contexte sécurisé -> getUserMedia (micro) OK,
    // et le simulateur partage le loopback du Mac. Requiert `npm run dev` (-p 3000).
    //
    // TÉLÉPHONE PHYSIQUE : localhost = le tel lui-même. Il faudrait l'IP LAN du Mac
    // (ex. http://192.168.1.7:3000, même Wi-Fi) MAIS l'IP en http n'est PAS un
    // contexte sécurisé -> le micro serait bloqué. Pour un vrai device : déployer
    // en https (Vercel) et mettre server.url = https://<ton-domaine>.
    url: 'http://localhost:3000',
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
