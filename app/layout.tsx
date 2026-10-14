import type { Metadata } from 'next';
import { Inter_Tight, Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import { AppProvider } from '../context/AppContext';
import ToastContainer from '../components/ui/ToastContainer';

const interTight = Inter_Tight({
  subsets: ['latin'],
  variable: '--font-parola-display',
  display: 'swap',
});

const sans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-parola-body',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Parola - Philippine Maritime Safety Beacon',
  description: 'SMS-first marine safety beacon providing real-time sea condition advisories, automated port safety holds, and pelagic hotspot intelligence for municipal fisherfolk.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${interTight.variable} ${sans.variable}`}>
      <body suppressHydrationWarning className="antialiased">
        <AppProvider>
          {children}
          <ToastContainer />
        </AppProvider>
      </body>
    </html>
  );
}


