import React, { useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Map, Droplets, LogOut, UserCircle, Settings, Anchor, Bell } from 'lucide-react';
import { useAppState } from '../context/AppStateContext';
import { translations } from '../utils/translations';
import { FloatingLanguageSelector } from './FloatingLanguageSelector';

/** Full-screen ocean blob background – used in dark mode */
const OceanBackground: React.FC = () => (
  <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden" aria-hidden>
    {/* Deep ocean base */}
    <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)' }} />
    {/* Blob 1 – large teal */}
    <div className="absolute rounded-full opacity-40" style={{
      width: '70vw', height: '70vw', top: '-20%', left: '-15%',
      background: 'radial-gradient(circle, rgba(13,148,136,0.8) 0%, transparent 70%)',
      animation: 'blob1 18s ease-in-out infinite', filter: 'blur(48px)'
    }} />
    {/* Blob 2 – cyan */}
    <div className="absolute rounded-full opacity-30" style={{
      width: '55vw', height: '55vw', bottom: '-10%', right: '-10%',
      background: 'radial-gradient(circle, rgba(6,182,212,0.7) 0%, transparent 70%)',
      animation: 'blob2 22s ease-in-out infinite', filter: 'blur(56px)'
    }} />
    {/* Blob 3 – indigo */}
    <div className="absolute rounded-full opacity-25" style={{
      width: '40vw', height: '40vw', top: '30%', right: '5%',
      background: 'radial-gradient(circle, rgba(99,102,241,0.6) 0%, transparent 70%)',
      animation: 'blob3 26s ease-in-out infinite', filter: 'blur(50px)'
    }} />
    {/* Blob 4 – seafoam */}
    <div className="absolute rounded-full opacity-20" style={{
      width: '45vw', height: '45vw', bottom: '5%', left: '10%',
      background: 'radial-gradient(circle, rgba(16,185,129,0.6) 0%, transparent 70%)',
      animation: 'blob4 20s ease-in-out infinite', filter: 'blur(60px)'
    }} />
  </div>
);

export const Layout: React.FC = () => {
  const { user, setUser, language, notifications, settings } = useAppState();
  const navigate = useNavigate();
  const location = useLocation();
  const t = translations[language] as any;
  const isDark = settings.darkMode;

  // Apply / remove dark-mode class on the root <html> element
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark-mode');
    } else {
      document.documentElement.classList.remove('dark-mode');
    }
  }, [isDark]);

  const handleLogout = () => {
    setUser(null);
    navigate('/login');
  };

  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';
  const isOnboardingPage = location.pathname === '/onboarding';

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const navItems = [
    { path: '/dashboard',     label: t.dashboard || 'Dashboard', icon: Map },
    { path: '/fuel',          label: t.fuelPool   || 'Fuel Pool', icon: Droplets },
    { path: '/notifications', label: 'Notifications', icon: Bell, badgeCount: unreadCount },
    { path: '/profile',       label: 'Profile',   icon: UserCircle },
    { path: '/settings',      label: 'Settings',  icon: Settings },
  ];

  return (
    <div className={`min-h-screen flex flex-col md:flex-row relative ${isDark ? 'text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      {/* Ocean background renders behind everything in dark mode */}
      {isDark && !isAuthPage && !isOnboardingPage && <OceanBackground />}

      {isAuthPage && <FloatingLanguageSelector />}

      {/* Side Nav for Desktop (md and up) */}
      {!isAuthPage && !isOnboardingPage && (
        <aside className={`hidden md:flex md:w-64 h-screen sticky top-0 flex-col justify-between shrink-0 z-30 border-r ${
          isDark ? 'border-white/10 bg-ocean-sidebar' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <div className="flex flex-col">
            {/* Brand */}
            <div className={`p-6 border-b flex items-center gap-3 ${isDark ? 'border-white/10' : 'border-slate-100'}`}>
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-md shadow-teal-600/20"
                style={{ background: 'linear-gradient(135deg,#0d9488,#0891b2)' }}>
                <Anchor className="w-5 h-5" />
              </div>
              <div>
                <h1 className={`text-xl font-black tracking-wider ${isDark ? 'text-teal-300' : 'text-teal-600'}`}>PAROLA</h1>
                <p className={`text-[10px] font-bold uppercase tracking-widest ${isDark ? 'text-slate-400' : 'text-slate-400'}`}>Fisheries System</p>
              </div>
            </div>

            {/* Nav Links */}
            <nav className="p-4 space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <button
                    key={item.path}
                    onClick={() => navigate(item.path)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl font-semibold text-sm transition-all cursor-pointer ${
                      isActive
                        ? isDark
                          ? 'bg-teal-600/25 text-teal-300'
                          : 'bg-teal-50 text-teal-700 shadow-sm'
                        : isDark
                          ? 'text-slate-300 hover:bg-white/8 hover:text-white'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`w-5 h-5 ${isActive ? (isDark ? 'text-teal-300' : 'text-teal-600') : (isDark ? 'text-slate-400' : 'text-slate-400')}`} />
                      <span>{item.label}</span>
                    </div>
                    {(item.badgeCount ?? 0) > 0 && (
                      <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0">
                        {item.badgeCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Profile footer */}
          {user && (
            <div className={`p-4 border-t m-4 rounded-2xl ${isDark ? 'border-white/10 bg-white/5' : 'border-slate-100 bg-slate-50/50'}`}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-teal-600/20 flex items-center justify-center text-teal-400 font-bold border border-teal-500/20">
                  {user.name.charAt(0)}
                </div>
                <div className="overflow-hidden">
                  <p className={`text-sm font-bold truncate ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>{user.name}</p>
                  <p className={`text-[10px] font-mono truncate ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{user.phoneNumber}</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className={`w-full flex items-center justify-center gap-2 py-2 px-4 rounded-full border text-xs font-bold transition-all cursor-pointer ${
                  isDark
                    ? 'border-white/10 text-slate-300 hover:text-red-300 hover:bg-red-500/10 hover:border-red-500/20'
                    : 'border-slate-200 bg-white text-slate-600 hover:text-red-600 hover:bg-red-50 hover:border-red-100'
                }`}
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>{t.logout || 'Logout'}</span>
              </button>
            </div>
          )}
        </aside>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 relative z-10">
        {/* Mobile Header */}
        {!isAuthPage && !isOnboardingPage && (
          <header className={`md:hidden p-4 sticky top-0 z-40 border-b flex justify-between items-center ${
            isDark ? 'bg-slate-900/70 backdrop-blur-xl border-white/10' : 'bg-white border-slate-200 shadow-sm'
          }`}>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white shadow-sm"
                style={{ background: 'linear-gradient(135deg,#0d9488,#0891b2)' }}>
                <Anchor className="w-4 h-4" />
              </div>
              <h1 className={`text-lg font-black tracking-wider ${isDark ? 'text-teal-300' : 'text-teal-600'}`}>PAROLA</h1>
            </div>
            <button onClick={handleLogout} className={`p-2 ${isDark ? 'text-slate-300 hover:text-red-300' : 'text-slate-500 hover:text-slate-900'}`}>
              <LogOut className="w-5 h-5" />
            </button>
          </header>
        )}

        <main className="flex-1 flex flex-col relative w-full h-full pb-20 md:pb-0">
          <Outlet />
        </main>
      </div>

      {/* Bottom Nav for Mobile */}
      {!isAuthPage && !isOnboardingPage && (
        <nav className={`md:hidden fixed bottom-0 left-0 right-0 z-50 border-t pb-safe ${
          isDark
            ? 'bg-slate-900/75 backdrop-blur-xl border-white/10'
            : 'bg-white/95 backdrop-blur-md border-slate-200 shadow-[0_-4px_10px_-1px_rgba(0,0,0,0.05)]'
        }`}>
          <div className="flex justify-around items-center py-2 px-1 max-w-md mx-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition-all cursor-pointer ${
                    isActive
                      ? isDark ? 'text-teal-300' : 'text-teal-600'
                      : isDark ? 'text-slate-400 hover:text-teal-300' : 'text-slate-500 hover:text-teal-600'
                  }`}
                >
                  <div className="relative">
                    <Icon className="w-5 h-5" />
                    {(item.badgeCount ?? 0) > 0 && (
                      <span className="absolute -top-1 -right-1.5 w-4 h-4 bg-red-500 text-white text-[8px] font-bold flex items-center justify-center rounded-full border border-white">
                        {item.badgeCount}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] font-bold tracking-tight">{item.label}</span>
                </button>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
};
