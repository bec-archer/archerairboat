import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AuthProvider } from '@/lib/auth';
import SwRegister from '@/components/SwRegister';

export const metadata: Metadata = {
  title: 'Archer Airboat Tours',
  description: 'Booking calendar for Archer Airboat Tours',
  manifest: '/manifest.json',
  robots: { index: false, follow: false }, // operator app: never index
  appleWebApp: { capable: true, statusBarStyle: 'default', title: 'Archer' },
};

export const viewport: Viewport = {
  themeColor: '#0b2536',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>{children}</AuthProvider>
        <SwRegister />
      </body>
    </html>
  );
}
