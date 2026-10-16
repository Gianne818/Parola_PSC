'use client';

import { lazy, Suspense, useEffect, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';

// Do not statically import the provider: its dependencies initialize Supabase.
let liveApplicationLoadedInBrowser = false;
const LiveApplication = lazy(() => {
  if (typeof window !== 'undefined') liveApplicationLoadedInBrowser = true;
  return import('./LiveApplication');
});

function FreshDemoDocument() {
  // Unmounting a provider alone does not destroy a previously loaded SDK's
  // refresh timers. Discard that document before mounting any demo controls.
  useEffect(() => { window.location.reload(); }, []);
  return <p role="status">Opening the isolated frontend demo…</p>;
}

export default function ApplicationBoundary({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const path = pathname?.replace(/\/$/, '') || '/';
  // Fail closed while the router is unavailable. Demo routes have no app context.
  if (pathname == null) return null;
  if (path === '/register' || path === '/login' || path === '/demo/advisory-preferences') {
    if (liveApplicationLoadedInBrowser) return <FreshDemoDocument />;
    return <>{children}</>;
  }
  return <Suspense fallback={<p role="status">Loading application…</p>}>
    <LiveApplication>{children}</LiveApplication>
  </Suspense>;
}
