'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { ArrowLeft, ChevronDown, Globe } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { ParolaLogo } from '@/components/ui/ParolaLogo';
import type { MascotOutcome } from '@/components/ui/GalunggongMascot';
import { AUTH_COPY, AUTH_LANGUAGES, type AuthLanguage } from './auth-copy';
import PhoneAuthFlow from './PhoneAuthFlow';
import styles from './auth.module.css';

const GalunggongMascot = dynamic(() => import('@/components/ui/GalunggongMascot'), {
  ssr: false,
});

function CoastalScene({ mobile = false, showMascot, focusedField, outcome }: {
  mobile?: boolean;
  showMascot: boolean;
  focusedField: 'phone' | 'password' | null;
  outcome: MascotOutcome | null;
}) {
  return (
    <div className={mobile ? styles.mobileArtwork : styles.artwork} aria-hidden="true">
      <div className={styles.sceneFrame}>
        <Image
          src="/images/auth-bg.jpeg"
          alt=""
          fill
          sizes={mobile ? '(max-width: 480px) calc(100vw - 48px), 400px' : '(min-width: 960px) max(55vw, 180vh), 1px'}
          loading={mobile ? 'lazy' : 'eager'}
        />
        {showMascot && (
          <div className={styles.mascot}>
            <GalunggongMascot
              isTypingEmail={focusedField === 'phone'}
              isTypingPassword={focusedField === 'password'}
              outcome={outcome}
              className="w-full h-full"
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default function AuthPage({ mode }: { mode: 'login' | 'register' }) {
  const { language, changeLanguage } = useApp();
  const copy = AUTH_COPY[language] ?? AUTH_COPY.en;
  const [mascotScene, setMascotScene] = useState<'desktop' | 'mobile' | null>(null);
  useEffect(() => {
    const desktop = window.matchMedia('(min-width: 960px) and (orientation: landscape)');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setMascotScene(reducedMotion.matches ? null : desktop.matches ? 'desktop' : 'mobile');
    update();
    desktop.addEventListener('change', update); reducedMotion.addEventListener('change', update);
    return () => { desktop.removeEventListener('change', update); reducedMotion.removeEventListener('change', update); };
  }, []);
  return <div className={styles.page} lang={language === 'tl' ? 'fil' : language}>
    <div className={styles.layout}>
      <aside className={styles.coast} aria-label="Parola">
        <CoastalScene showMascot={mascotScene === 'desktop'} focusedField={null} outcome={null} />
        <Link href="/" className={styles.brand} aria-label="Parola"><ParolaLogo iconOnly className="h-9 w-9" /><span>Parola</span></Link>
        <p className={styles.sceneCaption}>{copy.sceneCaption}</p>
      </aside>
      <main className={styles.panel}>
        <header className={styles.topbar}>
          <Link href="/" className={styles.home}><ArrowLeft size={15} aria-hidden="true" />{copy.home}</Link>
          <div className={styles.language}>
            <Globe size={15} aria-hidden="true" /><label htmlFor="auth-language" className={styles.visuallyHidden}>{copy.language}</label>
            <select id="auth-language" value={language} onChange={event => changeLanguage(event.target.value as AuthLanguage)}>{AUTH_LANGUAGES.map(item => <option value={item.code} key={item.code} lang={item.code}>{item.name}</option>)}</select>
            <ChevronDown size={13} aria-hidden="true" />
          </div>
        </header>
        <div className={styles.content}>
          <div className={styles.mobileBrand}>
            <CoastalScene mobile showMascot={mascotScene === 'mobile'} focusedField={null} outcome={null} />
            <Link href="/" className={styles.brand} aria-label="Parola"><ParolaLogo iconOnly className="h-9 w-9" /><span>Parola</span></Link>
          </div>
          <PhoneAuthFlow mode={mode} />
          <p className={styles.switch}>{mode === 'register' ? copy.haveAccount : copy.noAccount}<Link href={mode === 'register' ? '/login' : '/register'}>{mode === 'register' ? copy.signIn : copy.createAccount}</Link></p>
        </div>
        <footer className={styles.footer}><Link href="/guide">{copy.guide}</Link><span aria-hidden="true">·</span><Link href="/about">{copy.about}</Link></footer>
      </main>
    </div>
  </div>;
}
