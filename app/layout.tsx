// app/layout.tsx
import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from 'react-hot-toast';
import { ThemeProvider } from "next-themes";
import { Footer } from '@/components/Footer'; // <-- TU AJOUTES ÇA

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'ForkJam — Collaborative Music Platform',
  description:
    'ForkJam est une plateforme musicale collaborative où chaque idée devient un nœud dans un graphe musical interactif.',
  icons: {
    icon: '/icons/favicon.ico',   
    shortcut: '/icons/favicon.ico',  
  },
  metadataBase: new URL("https://forkjam.app"),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className + " bg-black text-neutral-100 overflow-hidden no-scrollbar"}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={true}
          disableTransitionOnChange
        >
          <div className="flex min-h-screen flex-col">
            {/* --- CONTENU PRINCIPAL (ton UI ForkJam) --- */}
            <main className="flex-1">
              {children}
            </main>

            {/* --- FOOTER SEO MINIMAL --- */}
            <Footer />
          </div>

          {/* --- TOASTER --- */}
          <Toaster
            position="top-center"
            toastOptions={{ duration: 4000 }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}