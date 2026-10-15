'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, Check, ChevronDown, Eye, EyeOff, Globe, Info, LoaderCircle, Anchor } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { ParolaLogo } from '@/components/ui/ParolaLogo';
import type { MascotOutcome } from '@/components/ui/GalunggongMascot';
import { AUTH_COPY, AUTH_LANGUAGES, type AuthLanguage } from './auth-copy';
import { canEnterPhilippineMobile, isValidPhilippineMobile } from '@/lib/philippine-mobile';
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

type FieldErrors = { phone?: 'phoneInvalid'; password?: 'passwordRequired' | 'passwordInvalid'; code?: 'codeInvalid' };
type AuthErrorKey = 'loginFailed' | 'registerFailed' | 'wrongPassword' | 'accountMissing' | 'duplicateAccount';
type FormError = { key: AuthErrorKey } | { message: string } | null;
const DEMO_CODE = '482910';
const AUTH_ERROR_KEYS: Record<string, AuthErrorKey> = {
  'Incorrect password. Please try again.': 'wrongPassword',
  'Account not found for this phone number. Please register first.': 'accountMissing',
  'An account with this phone number already exists. Please sign in instead.': 'duplicateAccount',
  'Login failed.': 'loginFailed',
};

function authError(message: string | undefined, fallback: AuthErrorKey): FormError {
  if (!message) return { key: fallback };
  const key = AUTH_ERROR_KEYS[message];
  return key ? { key } : { message };
}

export default function AuthPage({ mode }: { mode: 'login' | 'register' }) {
  const router = useRouter();
  const { isInitialized, isAuthenticated, userProfile, logout, language, changeLanguage, login, register } = useApp();
  const copy = AUTH_COPY[language] ?? AUTH_COPY.en;
  const isRegistration = mode === 'register';
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<FormError>(null);
  const [busy, setBusy] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [step, setStep] = useState<'account' | 'verify'>('account');
  const [code, setCode] = useState('');
  const [focusedField, setFocusedField] = useState<'phone' | 'password' | null>(null);
  const [mascotScene, setMascotScene] = useState<'desktop' | 'mobile' | null>(null);
  const [outcome, setOutcome] = useState<MascotOutcome | null>(null);
  const phoneRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const codeRef = useRef<HTMLInputElement>(null);
  const previousStep = useRef(step);
  const submitPending = useRef(false);
  const showSession = isInitialized && isAuthenticated && !leaving;

  // Mount one canvas in the visible scene, and honor reduced-motion preferences.
  useEffect(() => {
    const desktop = window.matchMedia('(min-width: 960px) and (orientation: landscape)');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setMascotScene(reducedMotion.matches ? null : desktop.matches ? 'desktop' : 'mobile');
    update();
    desktop.addEventListener('change', update);
    reducedMotion.addEventListener('change', update);
    return () => {
      desktop.removeEventListener('change', update);
      reducedMotion.removeEventListener('change', update);
    };
  }, []);

  useEffect(() => {
    if (step === 'verify') codeRef.current?.focus();
    else if (previousStep.current === 'verify') phoneRef.current?.focus();
    previousStep.current = step;
  }, [step]);

  const clearError = (field: keyof FieldErrors) => {
    setFieldErrors((previous) => ({ ...previous, [field]: undefined }));
    setFormError(null);
  };

  const reactToOutcome = (kind: MascotOutcome['kind']) => {
    setOutcome((previous) => ({ id: (previous?.id ?? 0) + 1, kind }));
  };

  const handleAccountSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitPending.current || leaving) return;
    const errors: FieldErrors = {};
    if (!isValidPhilippineMobile(phone)) errors.phone = 'phoneInvalid';
    if (!password) errors.password = 'passwordRequired';
    else if (isRegistration && (password.length < 6 || password.length > 128)) errors.password = 'passwordInvalid';
    setFieldErrors(errors);
    setFormError(null);
    if (errors.phone || errors.password) {
      reactToOutcome('failure');
      (errors.phone ? phoneRef : passwordRef).current?.focus();
      return;
    }
    if (isRegistration) {
      reactToOutcome('success');
      setCode('');
      setStep('verify');
      return;
    }
    submitPending.current = true;
    setBusy(true);
    try {
      const result = await login(phone.trim(), password);
      if (result.ok) {
        reactToOutcome('success');
        setLeaving(true);
        router.push('/dashboard');
      } else {
        reactToOutcome('failure');
        setFormError(authError(result.error, 'loginFailed'));
      }
    } catch {
      reactToOutcome('failure');
      setFormError({ key: 'loginFailed' });
    } finally {
      submitPending.current = false;
      setBusy(false);
    }
  };

  const handleVerificationSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitPending.current || leaving) return;
    setFormError(null);
    // This is the existing preview flow, not verification of phone ownership.
    if (!/^\d{6}$/.test(code)) {
      reactToOutcome('failure');
      setFieldErrors({ code: 'codeInvalid' });
      codeRef.current?.focus();
      return;
    }
    submitPending.current = true;
    setBusy(true);
    setLeaving(true);
    try {
      const result = await register({
        phone: phone.trim(), vesselName: phone.trim(),
        licenseNo: `FL-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      }, password);
      if (result.ok) {
        reactToOutcome('success');
        sessionStorage.setItem('just-registered', 'true');
        router.push('/onboarding');
      } else {
        reactToOutcome('failure');
        setLeaving(false);
        setFormError(authError(result.error, 'registerFailed'));
      }
    } catch {
      reactToOutcome('failure');
      setLeaving(false);
      setFormError({ key: 'registerFailed' });
    } finally {
      submitPending.current = false;
      setBusy(false);
    }
  };

  const editAccount = () => {
    setStep('account'); setCode(''); setFieldErrors({}); setFormError(null);
  };
  const isVerification = isRegistration && step === 'verify';
  const pending = busy || leaving;
  const errorMessage = formError ? ('key' in formError ? copy[formError.key] : formError.message) : null;

  return (
    <div className={styles.page} lang={language}>
      <div className={styles.layout}>
        <aside className={styles.coast} aria-label="Parola">
          <CoastalScene showMascot={mascotScene === 'desktop'} focusedField={focusedField} outcome={outcome} />
          <Link href="/" className={styles.brand} aria-label="Parola">
            <ParolaLogo iconOnly className="h-9 w-9" /><span>Parola</span>
          </Link>
          <p className={styles.sceneCaption}>{copy.sceneCaption}</p>
        </aside>

        <main className={styles.panel}>
          <header className={styles.topbar}>
            <Link href="/" className={styles.home}><ArrowLeft size={15} aria-hidden="true" />{copy.home}</Link>
            <div className={styles.language}>
              <Globe size={15} aria-hidden="true" />
              <label htmlFor="auth-language" className={styles.visuallyHidden}>{copy.language}</label>
              <select id="auth-language" value={language} onChange={(event) => changeLanguage(event.target.value as AuthLanguage)}>
                {AUTH_LANGUAGES.map((item) => <option value={item.code} key={item.code} lang={item.code}>{item.name}</option>)}
              </select>
              <ChevronDown size={13} aria-hidden="true" />
            </div>
          </header>
          <div className={styles.content}>
            <div className={styles.mobileBrand}>
              <CoastalScene mobile showMascot={mascotScene === 'mobile'} focusedField={focusedField} outcome={outcome} />
              <Link href="/" className={styles.brand} aria-label="Parola"><ParolaLogo iconOnly className="h-9 w-9" /><span>Parola</span></Link>
            </div>
            {showSession ? (
              <section aria-labelledby="auth-title">
                <div className={styles.sessionIcon}><Anchor size={23} aria-hidden="true" /></div>
                <div className={styles.heading}><h1 id="auth-title">{copy.sessionTitle}</h1><p>{copy.sessionDescription}</p></div>
                <strong className={styles.sessionPhone}>{userProfile?.phone}</strong>
                <Link className={styles.primary} href="/dashboard">{copy.dashboard}<ArrowRight size={17} aria-hidden="true" /></Link>
                <button className={styles.textButton} type="button" onClick={() => { logout(); editAccount(); setPassword(''); }}>{copy.switchAccount}</button>
              </section>
            ) : (
              <>
                {isRegistration && <ol className={styles.steps} aria-label={copy.stepsLabel}>
                  {[copy.accountStep, copy.verifyStep, copy.portStep].map((label, index) => (
                    <li key={index} aria-current={index === (isVerification ? 1 : 0) ? 'step' : undefined} className={isVerification && index === 0 ? styles.complete : undefined}>
                      <span className={styles.stepNumber}>{isVerification && index === 0 ? <Check size={12} aria-hidden="true" /> : index + 1}</span><span>{label}</span>
                    </li>
                  ))}
                </ol>}
                <div key={step} className={isVerification ? styles.verification : undefined}>
                <div className={styles.heading}>
                  <h1 id="auth-title">{isVerification ? copy.verifyTitle : isRegistration ? copy.registerTitle : copy.loginTitle}</h1>
                  <p>{isVerification ? copy.verifyDescription : isRegistration ? copy.registerDescription : copy.loginDescription}</p>
                </div>
                {isVerification ? (
                  <form className={styles.form} onSubmit={handleVerificationSubmit} noValidate aria-labelledby="auth-title" aria-busy={pending}>
                    <div className={styles.demoNote}><Info size={16} aria-hidden="true" /><div><strong>{copy.demoLabel}</strong>{copy.demoNotice}<code className={styles.demoCode}>{DEMO_CODE}</code></div></div>
                    <div className={styles.field}>
                      <label className={styles.label} htmlFor="auth-code">{copy.code}</label>
                      <input ref={codeRef} id="auth-code" name="code" className={`${styles.input} ${styles.codeInput}`} type="text" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={code} disabled={pending} aria-invalid={!!fieldErrors.code} aria-describedby={fieldErrors.code ? 'code-hint code-error' : 'code-hint'} onChange={(event) => { setCode(event.target.value.replace(/\D/g, '').slice(0, 6)); clearError('code'); }} />
                      <p id="code-hint" className={styles.hint}>{copy.codeHint}</p>
                      {fieldErrors.code && <p id="code-error" className={styles.fieldError} role="alert">{copy[fieldErrors.code]}</p>}
                    </div>
                    {errorMessage && <p className={styles.formError} role="alert">{errorMessage}</p>}
                    <button className={styles.primary} type="submit" disabled={pending}>
                      {pending ? <LoaderCircle className={styles.spinner} size={17} aria-hidden="true" /> : <ArrowRight size={17} aria-hidden="true" />}
                      <span aria-live="polite">{pending ? copy.verifying : copy.createAccount}</span>
                    </button>
                    <p className={styles.hint}>{copy.nextPort}</p>
                    <button className={styles.textButton} type="button" disabled={pending} onClick={editAccount}><ArrowLeft size={14} aria-hidden="true" />{copy.changeDetails}</button>
                  </form>
                ) : (
                  <form className={styles.form} onSubmit={handleAccountSubmit} noValidate aria-labelledby="auth-title" aria-busy={pending}>
                    <div className={styles.field}>
                      <label className={styles.label} htmlFor="auth-phone">{copy.phone}</label>
                      <input ref={phoneRef} id="auth-phone" name="phone" className={styles.input} type="tel" inputMode="tel" autoComplete={isRegistration ? 'tel' : 'username'} placeholder="09123456789" value={phone} disabled={pending} required aria-invalid={!!fieldErrors.phone} aria-describedby={fieldErrors.phone ? 'phone-hint phone-error' : 'phone-hint'} onFocus={() => setFocusedField('phone')} onBlur={() => setFocusedField(null)} onChange={(event) => { if (canEnterPhilippineMobile(event.target.value)) { setPhone(event.target.value); clearError('phone'); } }} />
                      <p id="phone-hint" className={styles.hint}>{isRegistration ? copy.registerPhoneHint : copy.phoneHint}</p>
                      {fieldErrors.phone && <p id="phone-error" className={styles.fieldError} role="alert">{copy[fieldErrors.phone]}</p>}
                    </div>
                    <div className={styles.field}>
                      <label className={styles.label} htmlFor="auth-password">{copy.password}</label>
                      <div className={styles.inputWrap}>
                        <input ref={passwordRef} id="auth-password" name="password" className={`${styles.input} ${styles.passwordInput}`} type={showPassword ? 'text' : 'password'} autoComplete={isRegistration ? 'new-password' : 'current-password'} value={password} disabled={pending} required aria-invalid={!!fieldErrors.password} aria-describedby={[isRegistration ? 'password-hint' : '', fieldErrors.password ? 'password-error' : ''].filter(Boolean).join(' ') || undefined} onFocus={() => setFocusedField('password')} onBlur={() => setFocusedField(null)} onChange={(event) => { setPassword(event.target.value); clearError('password'); }} />
                        <button className={styles.eye} type="button" aria-label={showPassword ? copy.hidePassword : copy.showPassword} aria-pressed={showPassword} onClick={() => setShowPassword((value) => !value)}>{showPassword ? <EyeOff size={19} aria-hidden="true" /> : <Eye size={19} aria-hidden="true" />}</button>
                      </div>
                      {isRegistration && <p id="password-hint" className={styles.hint}>{copy.passwordHint}</p>}
                      {fieldErrors.password && <p id="password-error" className={styles.fieldError} role="alert">{copy[fieldErrors.password]}</p>}
                    </div>
                    {isRegistration && <div className={styles.demoNote}><Info size={16} aria-hidden="true" /><div><strong>{copy.demoLabel}</strong>{copy.demoNotice}</div></div>}
                    {errorMessage && <p className={styles.formError} role="alert">{errorMessage}</p>}
                    <button className={styles.primary} type="submit" disabled={pending}>
                      <span aria-live="polite">{pending ? copy.signingIn : isRegistration ? copy.continue : copy.signIn}</span>
                      {pending ? <LoaderCircle className={styles.spinner} size={17} aria-hidden="true" /> : <ArrowRight size={17} aria-hidden="true" />}
                    </button>
                  </form>
                )}
                </div>
                <p className={styles.switch}>{isRegistration ? copy.haveAccount : copy.noAccount}<Link href={isRegistration ? '/login' : '/register'}>{isRegistration ? copy.signIn : copy.createAccount}</Link></p>
                {!isVerification && <p className={styles.portContext}><Anchor size={15} aria-hidden="true" /><span>{copy.homePortContext}</span></p>}
              </>
            )}
          </div>
          <footer className={styles.footer}><Link href="/guide">{copy.guide}</Link><span aria-hidden="true">·</span><Link href="/about">{copy.about}</Link></footer>
        </main>
      </div>
    </div>
  );
}
