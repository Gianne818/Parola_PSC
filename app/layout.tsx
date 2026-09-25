import type { Metadata } from 'next';
import { Inter_Tight, Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import { AppProvider } from '../context/AppContext';
import ToastContainer from '../components/ui/ToastContainer';

const interTight = Inter_Tight({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
});

const sans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Parola - Philippine Maritime Safety Beacon',
  description: 'SMS-first marine safety beacon providing real-time sea condition advisories, automated port safety holds, and pelagic hotspot intelligence for municipal fisherfolk.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${interTight.variable} ${sans.variable}`}>
      <head>
        {/* Preconnect and fallback for General Sans */}
        <link rel="stylesheet" href="https://api.fontshare.com/v2/css?f[]=general-sans@300,400,500,600,700,900&display=swap" />
      </head>
      <body suppressHydrationWarning className="antialiased">
        <AppProvider>
          {children}
          <ToastContainer />
        </AppProvider>
      </body>
    </html>
  );
}


