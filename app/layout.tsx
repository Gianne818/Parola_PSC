import type {Metadata} from 'next';
import './globals.css'; // Global styles
import { AppProvider } from '../context/AppContext';
import ToastContainer from '../components/ui/ToastContainer';

export const metadata: Metadata = {
  title: 'Parola - Fishermen Lighthouse Beacon',
  description: 'Filipino fishermen co-op digital beacon providing safety geofencing, fuel discounting pools, marine forecasting, and hotspots maps.',
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

