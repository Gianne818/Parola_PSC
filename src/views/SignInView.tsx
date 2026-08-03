import React, { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Anchor } from 'lucide-react';
import { useAppState } from '../context/AppStateContext';
import { translations } from '../utils/translations';

interface WaterRipple {
  id: number;
  x: number;
  y: number;
}

export const SignInView: React.FC = () => {
  const navigate = useNavigate();
  const { language, setUser } = useAppState();
  const t = translations[language];

  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [ripples, setRipples] = useState<WaterRipple[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  const spawnRipple = (x: number, y: number) => {
    const id = Date.now() + Math.random();
    setRipples(prev => [...prev, { id, x, y }]);
    setTimeout(() => setRipples(prev => prev.filter(r => r.id !== id)), 2400);
  };

  const handlePageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('form, a, button, input, label')) return;
    const rect = containerRef.current!.getBoundingClientRect();
    spawnRipple(e.clientX - rect.left, e.clientY - rect.top);
  };

  const handleButtonClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const containerRect = containerRef.current!.getBoundingClientRect();
    spawnRipple(rect.left + rect.width / 2 - containerRect.left, rect.top + rect.height / 2 - containerRect.top);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (phone && password) {
      setUser({ name: 'Juan Dela Cruz', phoneNumber: phone, isRegistered: true, isOnboarded: false });
      setTimeout(() => navigate('/onboarding'), 500);
    }
  };

  return (
    <div
      ref={containerRef}
      onClick={handlePageClick}
      className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden select-none"
      style={{ background: '#0f2027' }}
    >
      {/* Animated fluid ocean blobs */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)' }} />
        <div className="absolute rounded-full opacity-40" style={{ width: '70vw', height: '70vw', top: '-20%', left: '-15%', background: 'radial-gradient(circle, rgba(13,148,136,0.8) 0%, transparent 70%)', animation: 'blob1 18s ease-in-out infinite', filter: 'blur(48px)' }} />
        <div className="absolute rounded-full opacity-30" style={{ width: '55vw', height: '55vw', bottom: '-10%', right: '-10%', background: 'radial-gradient(circle, rgba(6,182,212,0.7) 0%, transparent 70%)', animation: 'blob2 22s ease-in-out infinite', filter: 'blur(56px)' }} />
        <div className="absolute rounded-full opacity-25" style={{ width: '40vw', height: '40vw', top: '30%', right: '5%', background: 'radial-gradient(circle, rgba(99,102,241,0.6) 0%, transparent 70%)', animation: 'blob3 26s ease-in-out infinite', filter: 'blur(50px)' }} />
        <div className="absolute rounded-full opacity-20" style={{ width: '45vw', height: '45vw', bottom: '5%', left: '10%', background: 'radial-gradient(circle, rgba(16,185,129,0.6) 0%, transparent 70%)', animation: 'blob4 20s ease-in-out infinite', filter: 'blur(60px)' }} />
      </div>

      {/* Soft water disturbance ripples */}
      {ripples.map(r => (
        <div
          key={r.id}
          className="absolute pointer-events-none z-10"
          style={{ left: r.x, top: r.y }}
        >
          {/* Each ripple = 3 expanding soft gradient discs, staggered */}
          {[
            { delay: '0s',    size: 900, color: 'rgba(103,232,249,0.55)', blur: 6 },
            { delay: '0.3s',  size: 720, color: 'rgba(6,182,212,0.40)',   blur: 4 },
            { delay: '0.6s',  size: 540, color: 'rgba(34,211,238,0.28)',  blur: 2 },
          ].map((ring, i) => (
            <div
              key={i}
              className="absolute rounded-full"
              style={{
                width: `${ring.size}px`,
                height: `${ring.size}px`,
                background: `radial-gradient(circle, ${ring.color} 0%, ${ring.color.replace(/,[\.\d]+\)$/, ',0.06)')} 50%, transparent 72%)`,
                filter: `blur(${ring.blur}px)`,
                transform: 'translate(-50%, -50%) scale(0)',
                animation: `waterRipple 2.6s ${ring.delay} cubic-bezier(0, 0.5, 0.3, 1) forwards`,
              }}
            />
          ))}
        </div>
      ))}

      {/* Card */}
      <div className="w-full max-w-sm z-20 relative">
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-2xl">
          <div className="flex flex-col items-center mb-8">
            <div className="w-20 h-20 rounded-[2rem] flex items-center justify-center shadow-lg mb-6"
              style={{ background: 'linear-gradient(135deg, #0d9488, #0891b2)' }}>
              <Anchor className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-black tracking-widest text-white mb-1 drop-shadow">PAROLA</h1>
            <p className="text-cyan-300 text-xs font-semibold uppercase tracking-widest">{t.loginPrompt}</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-cyan-200/80 uppercase tracking-widest ml-1">{t.phoneNumber}</label>
              <input type="tel" required value={phone} onChange={e => setPhone(e.target.value)} placeholder="+63 900 000 0000"
                className="w-full px-5 py-3 rounded-full bg-white/12 border border-white/20 text-white placeholder:text-white/35 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all text-sm" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-cyan-200/80 uppercase tracking-widest ml-1">{t.password}</label>
              <input type="password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••"
                className="w-full px-5 py-3 rounded-full bg-white/12 border border-white/20 text-white placeholder:text-white/35 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all text-sm" />
            </div>
            <button type="submit" onClick={handleButtonClick}
              className="w-full py-3.5 mt-4 rounded-full font-bold text-sm text-white transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.97] shadow-xl"
              style={{ background: 'linear-gradient(135deg, #0d9488, #0891b2)', boxShadow: '0 8px 30px rgba(13,148,136,0.4)' }}>
              {t.signIn}
            </button>
          </form>

          <p className="text-center mt-6 text-xs text-white/55 font-medium">
            {t.noAccount}{' '}
            <Link to="/register" className="text-cyan-300 font-bold hover:text-cyan-200 hover:underline transition-colors">{t.register}</Link>
          </p>
        </div>
      </div>
    </div>
  );
};
