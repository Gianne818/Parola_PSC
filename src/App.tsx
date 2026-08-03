import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { SignInView } from './views/SignInView';
import { RegisterView } from './views/RegisterView';
import { OnboardingView } from './views/OnboardingView';
import { DashboardView } from './views/DashboardView';
import { FuelOrderingView } from './views/FuelOrderingView';
import { ProfileView } from './views/ProfileView';
import { SettingsView } from './views/SettingsView';
import { NotificationsView } from './views/NotificationsView';
import { useAppState } from './context/AppStateContext';

const ProtectedRoute: React.FC<{ children: React.ReactNode, requireOnboarding?: boolean }> = ({ children, requireOnboarding = false }) => {
  const { user } = useAppState();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requireOnboarding && !user.isOnboarded) {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
};

function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="login" element={<SignInView />} />
          <Route path="register" element={<RegisterView />} />
          
          <Route 
            path="onboarding" 
            element={
              <ProtectedRoute>
                <OnboardingView />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="dashboard" 
            element={
              <ProtectedRoute requireOnboarding>
                <DashboardView />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="fuel" 
            element={
              <ProtectedRoute requireOnboarding>
                <FuelOrderingView />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="notifications" 
            element={
              <ProtectedRoute requireOnboarding>
                <NotificationsView />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="profile" 
            element={
              <ProtectedRoute requireOnboarding>
                <ProfileView />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="settings" 
            element={
              <ProtectedRoute requireOnboarding>
                <SettingsView />
              </ProtectedRoute>
            } 
          />

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
