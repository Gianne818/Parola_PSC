import type {Metadata} from 'next';
import './globals.css'; // Global styles
import { AppProvider } from '../context/AppContext';
import ToastContainer from '../components/ui/ToastContainer';

export const metadata: Metadata = {
  title: 'Parola - Philippine Maritime Safety Beacon',
  description: 'SMS-first marine safety beacon providing real-time sea condition advisories, automated port safety holds, and pelagic hotspot intelligence for municipal fisherfolk.',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning className="antialiased">
        <AppProvider>
          {children}
          <ToastContainer />
        </AppProvider>
      </body>
    </html>
  );
}

