'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import styles from './registration-demo.module.css';

const CODE = '012345';
const ACCOUNTS = [
  { id: 'demo-fisher-01', name: 'Sample Fisher One' },
  { id: 'demo-fisher-02', name: 'Sample Fisher Two' },
] as const;
const PORTS = ['Sample Harbor A', 'Sample Harbor B'];
type Consent = 'agree' | 'decline' | '';
type Snapshot = { account: string; port: string; consent: Exclude<Consent, ''> };
type Screen = 'account' | 'code' | 'details' | 'saved' | 'settings';

// Intentionally independent of AppContext, authentication SDKs and all services.
// No token, auth flag, cookie, browser storage or network-backed persistence.
export default function RegistrationDemo({ initialMode = 'register' }: { initialMode?: 'register' | 'login' }) {
  const [mode, setMode] = useState(initialMode);
  const [screen, setScreen] = useState<Screen>('account');
  const [account, setAccount] = useState<string>(ACCOUNTS[0].id);
  const [code, setCode] = useState('');
  const [port, setPort] = useState('');
  const [consent, setConsent] = useState<Consent>('');
  const [saved, setSaved] = useState<Snapshot | null>(null);
  const [failSave, setFailSave] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const heading = useRef<HTMLHeadingElement>(null);
  const codeInput = useRef<HTMLInputElement>(null);
  const portInput = useRef<HTMLSelectElement>(null);
  const consentInput = useRef<HTMLInputElement>(null);
  useEffect(() => { heading.current?.focus(); }, [screen, mode]);

  const restart = (nextMode = mode) => {
    setMode(nextMode); setScreen('account'); setAccount(ACCOUNTS[0].id);
    setCode(''); setPort(''); setConsent(''); setSaved(null);
    setFailSave(false); setError(''); setNotice('Demo reset. All sample choices were discarded.');
    heading.current?.focus();
  };
  const show = (next: Screen) => { setScreen(next); setError(''); setNotice(''); };
  const save = () => {
    setNotice('');
    if (!port) { setError('Choose a sample port. Nothing has been saved.'); portInput.current?.focus(); return; }
    if (!consent) { setError('Choose agree or decline for the sample consent.'); consentInput.current?.focus(); return; }
    if (failSave) { setError('Simulated save failure. Your sample choices remain here; no save was made.'); return; }
    setSaved({ account, port, consent }); show('saved');
    setNotice('Simulated save complete in memory only. No account or consent record was created.');
  };
  const name = ACCOUNTS.find(item => item.id === account)!.name;
  const title = screen === 'account' ? (mode === 'login' ? 'Demo sign-in' : 'Demo registration')
    : screen === 'code' ? 'Simulate verification'
    : screen === 'details' ? 'Sample registration details'
    : screen === 'settings' ? 'Demo consent settings' : 'Sample saved in memory';
  const describedBy = `demo-instructions${error ? ' demo-error' : ''}`;

  return <main className={styles.page} lang="en" aria-labelledby="demo-title">
    <div className={styles.content}>
      <aside className={styles.banner} aria-label="Demonstration limits">
        <strong>PAROLA · FRONTEND DEMO ONLY</strong>
        <p>No real verification, sign-in, SMS or database saves. Use the synthetic accounts below. Do not enter personal details.</p>
        <p>Choices last only while this demo is open. Reload or reset discards everything. No protected backend data is available.</p>
      </aside>
      <nav className={styles.actions} aria-label="Demo screens">
        <button type="button" onClick={() => restart('register')}>Registration demo</button>
        <button type="button" onClick={() => restart('login')}>Sign-in demo</button>
      </nav>
      <h1 id="demo-title" ref={heading} tabIndex={-1}>{title}</h1>
      <p id="demo-instructions">{screen === 'account' ? 'Select a synthetic account. This demonstration cannot sign you into Parola.'
        : screen === 'code' ? 'Enter the displayed demo code. It is a local UI exercise and does not verify a phone.'
        : screen === 'details' ? 'The name, ports and consent text are examples. Neither consent choice enrolls anyone.'
        : screen === 'settings' ? 'Change or withdraw sample consent in memory. No real permission changes.'
        : 'This is a simulated result, not a registered or authenticated account.'}</p>

      {screen === 'account' && <form onSubmit={(event: FormEvent) => { event.preventDefault(); show('code'); setNotice('Demo code displayed. No code was requested or sent.'); }}>
        <label htmlFor="demo-account">Synthetic account</label>
        <select id="demo-account" value={account} onChange={event => setAccount(event.target.value)}>
          {ACCOUNTS.map(item => <option key={item.id} value={item.id}>{item.name} ({item.id})</option>)}
        </select>
        <button className={styles.primary} type="submit">Show demo code</button>
      </form>}

      {screen === 'code' && <>
        <p>Synthetic account: <strong>{name}</strong></p>
        <p>Displayed demo verification code: <strong className={styles.code}>{CODE}</strong></p>
        <form noValidate onSubmit={(event: FormEvent) => {
          event.preventDefault();
          if (code !== CODE) { setNotice(''); setError('Use the displayed demo code 012345. No real verification was attempted.'); codeInput.current?.focus(); return; }
          show('details'); setNotice('Verification simulated. No phone was verified and no authentication session exists.');
        }}>
          <label htmlFor="demo-code">Demo verification code</label>
          <input ref={codeInput} id="demo-code" type="text" inputMode="numeric" autoComplete="off" maxLength={6} value={code} aria-invalid={!!error || undefined} aria-describedby={describedBy} onChange={event => { setCode(event.target.value.replace(/\D/g, '').slice(0, 6)); setError(''); }} />
          <button className={styles.primary} type="submit">Simulate verification</button>
          <button type="button" onClick={() => { setCode(''); setError(''); setNotice('Same demo code displayed again: 012345. No resend or SMS request occurred.'); }}>Show demo code again</button>
        </form>
      </>}

      {(screen === 'details' || screen === 'settings') && <form noValidate onSubmit={event => { event.preventDefault(); save(); }}>
        <p>Synthetic account: <strong>{name}</strong> ({account})</p>
        {screen === 'details' ? <>
          <label htmlFor="demo-port">Sample home port</label>
          <select ref={portInput} id="demo-port" value={port} aria-describedby={describedBy} onChange={event => { setPort(event.target.value); setError(''); }}>
            <option value="">Choose a sample port</option>
            {PORTS.map(item => <option key={item}>{item}</option>)}
          </select>
        </> : <p>Sample port: {saved?.port}</p>}
        <fieldset aria-describedby="demo-consent-text demo-instructions demo-error">
          <legend>Sample messaging consent</legend>
          <p id="demo-consent-text">Example text · demo-v1: allow sample advisory messages in this demonstration. This is not Parola&apos;s live consent policy. No messages will be sent.</p>
          <label className={styles.choice}><input ref={consentInput} type="radio" name="demo-consent" value="agree" checked={consent === 'agree'} onChange={() => { setConsent('agree'); setError(''); }} />Agree in demo only</label>
          <label className={styles.choice}><input type="radio" name="demo-consent" value="decline" checked={consent === 'decline'} onChange={() => { setConsent('decline'); setError(''); }} />Decline in demo only</label>
        </fieldset>
        <label className={styles.choice}><input type="checkbox" checked={failSave} onChange={event => { setFailSave(event.target.checked); setError(''); }} />Simulate a save failure</label>
        <button className={styles.primary} type="submit">{screen === 'settings' ? 'Simulate saving consent' : 'Simulate saving registration'}</button>
        {screen === 'settings' && <>
          <p>Saved sample choice: {saved?.consent === 'agree' ? 'agreed in demo' : 'declined in demo'}. Changes above remain a draft until simulated saving.</p>
          <button type="button" onClick={() => {
            if (failSave) { setNotice(''); setError('Simulated withdrawal failure. The saved sample choice is unchanged.'); return; }
            setConsent('decline'); setSaved({ account, port, consent: 'decline' }); setError('');
            setNotice('Sample consent withdrawn in memory only. No real consent record was changed.');
          }}>Simulate withdrawing consent</button>
          <button type="button" onClick={() => { setConsent(saved!.consent); show('saved'); }}>Cancel sample changes</button>
        </>}
      </form>}

      {screen === 'saved' && saved && <section aria-label="Simulated result">
        <dl><dt>Synthetic account</dt><dd>{name} ({saved.account})</dd><dt>Sample port</dt><dd>{saved.port}</dd><dt>Sample consent</dt><dd>{saved.consent === 'agree' ? 'Agreed in demo only' : 'Declined in demo only'}</dd></dl>
        <p>No backend profile, verified phone, messaging enrollment, schedule or delivery exists from this demo. The dashboard, protected settings, maps and live reports are outside this demonstration.</p>
        <button className={styles.primary} type="button" onClick={() => show('settings')}>Open demo consent settings</button>
      </section>}

      <p role="status" aria-atomic="true">{notice}</p>
      <p id="demo-error" role="alert" aria-atomic="true" className={error ? styles.error : undefined}>{error}</p>
      {screen !== 'account' && <button type="button" onClick={() => restart()}>Reset demo and discard sample</button>}
      <footer>English demo copy. Assisted access is disabled. Real OTP registration is retained separately for later integration and is not available from this demo.</footer>
    </div>
  </main>;
}
