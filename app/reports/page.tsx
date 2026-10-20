'use client';

import AuthLayout from '@/components/layouts/AuthLayout';
import CatchReporting from '@/components/reports/CatchReporting';
import { useApp } from '@/context/AppContext';

export default function ReportsPage() {
  const { isInitialized, isAuthenticated, userProfile } = useApp();
  return <AuthLayout variant="application">
    {isInitialized && isAuthenticated && <CatchReporting key={userProfile.id} actorId={userProfile.id ?? ''} actorName={userProfile.vesselName || 'Your account'} headingAs="h2" />}
  </AuthLayout>;
}
