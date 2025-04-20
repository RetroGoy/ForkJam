import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Header } from '@/components/layout/Header';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'DRUIDE 500 - Collaborative Music Platform',
  description: 'A retro-futuristic music collaboration platform for building tree-like musical compositions',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <style>
          {`
            @keyframes gridPulse {
              0% { opacity: 0.1; }
              50% { opacity: 0.3; }
              100% { opacity: 0.1; }
            }
            
            .bg-grid-pattern {
              background-size: 50px 50px;
              background-image: 
                linear-gradient(to right, rgba(128, 90, 0, 0.1) 1px, transparent 1px),
                linear-gradient(to bottom, rgba(128, 90, 0, 0.1) 1px, transparent 1px);
              animation: gridPulse 5s infinite;
            }
          `}
        </style>
      </head>
      <body className={`${inter.className} bg-gray-900 text-gray-100`}>
        <div className="flex flex-col h-screen overflow-hidden">
          <Header />
          <main className="flex-1 overflow-hidden">{children}</main>
        </div>
      </body>
    </html>
  );
}