import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import ApplicationBoundary from '@/components/application/ApplicationBoundary';
import RegisterPage from '@/app/register/page';
import LoginPage from '@/app/login/page';

// Use the actual public route components and application boundary. No auth/API
// mocks: live transport modules must remain outside the eagerly loaded graph.
function Fixture() {
  const [mode, setMode] = useState<'register' | 'login'>('register');
  useEffect(() => {
    Object.assign(window, { demoPath: `/${mode}`, fixture: { setMode } });
  }, [mode]);
  return <ApplicationBoundary>{mode === 'register' ? <RegisterPage /> : <LoginPage />}</ApplicationBoundary>;
}
createRoot(document.getElementById('root')!).render(<Fixture />);
