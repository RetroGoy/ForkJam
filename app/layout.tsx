import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "react-hot-toast";
import { ThemeProvider } from "next-themes";
import { RootSearchProvider } from "@/components/search/RootSearchContext";
import { UnifiedLayout } from "@/components/layout/UnifiedLayout";
import { AudioProvider } from "@/components/audio/AudioProvider";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const inter = Inter({ subsets: ["latin"] });

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

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          const c = (cookieStore as any).get?.(name);
          return c?.value;
        },
        set: async (name: string, value: string, options: any) => {
          (await cookies()).set(name, value, options);
        },
        remove: async (name: string, options: any) => {
          (await cookies()).set(name, "", { ...options });
        },
      },
    }
  );

  const {
    data: { session },
  } = await supabase.auth.getSession();

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} bg-black min-h-dvh overflow-y-auto text-neutral-100`}>
        <AudioProvider>
        <RootSearchProvider>
          <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
            <UnifiedLayout session={session}>{children}</UnifiedLayout>
            <Toaster position="top-center" />
          </ThemeProvider>
        </RootSearchProvider>
        </AudioProvider>
      </body>
    </html>
  );
}