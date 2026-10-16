'use client';

import type { ReactNode } from 'react';
import { AppProvider } from '@/context/AppContext';
import ToastContainer from '@/components/ui/ToastContainer';

// Kept behind ApplicationBoundary's lazy import, outside the registration demo.
export default function LiveApplication({ children }: { children: ReactNode }) {
  return <AppProvider>{children}<ToastContainer /></AppProvider>;
}
