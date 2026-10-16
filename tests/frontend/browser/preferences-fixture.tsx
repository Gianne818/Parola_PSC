import React, { useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import ApplicationBoundary from '@/components/application/ApplicationBoundary';
import PreferencesPage from '@/app/demo/advisory-preferences/page';

// Actual route and boundary, no API/Auth/context mocks or successful transports.
Object.assign(window, { demoPath: '/demo/advisory-preferences' });
function Fixture() {
  useEffect(() => { Object.assign(window, { fixture: {} }); }, []);
  return <ApplicationBoundary><PreferencesPage /></ApplicationBoundary>;
}
createRoot(document.getElementById('root')!).render(<Fixture />);
