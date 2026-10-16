import React, { useEffect, useRef, useState } from 'react';
import type { MdTabs } from '@material/web/tabs/tabs';
import { M3Button, M3Checkbox, M3TextField } from '../../components/material/core';
import { AppearanceSettings } from '../../components/material/AppearanceSettings';
import { Appearance } from '../../design-system/appearance';
import './access.css';

export type AccessRole = 'patient' | 'specialist' | 'developer';
export type PreviewRoute = { screen: 'home' } | { screen: 'sign-in'; role: AccessRole } | { screen: 'developer-reference' };

const roles: AccessRole[] = ['patient', 'specialist', 'developer'];
const roleCopy = {
  patient: { label: 'Patient', icon: 'person', title: 'Your experience matters.', description: 'A space for your health questions and medicine experiences.', account: 'your personal APIP space' },
  specialist: { label: 'Specialist', icon: 'clinical_notes', title: 'A shared view of medicine safety.', description: 'For pharmacovigilance specialists reviewing reported medicine experiences.', account: 'the specialist workspace' },
  developer: { label: 'Developer', icon: 'code', title: 'Thoughtfully built. Together.', description: 'The design reference for building a clear, consistent APIP experience.', account: 'the developer reference' },
};

export function readPreviewRoute(): PreviewRoute {
  if (window.location.hash === '#/developer-reference') return { screen: 'developer-reference' };
  const role = window.location.hash.replace('#/sign-in/', '');
  if (roles.includes(role as AccessRole) && window.location.hash.startsWith('#/sign-in/')) {
    return { screen: 'sign-in', role: role as AccessRole };
  }
  return { screen: 'home' };
}

function Brand({ large = false }: { large?: boolean }) {
  return <span className={`access-brand ${large ? 'access-brand-large' : ''}`}>
    <svg viewBox="0 0 40 40" fill="none" aria-hidden="true">
      <rect x="4" y="14" width="32" height="12" rx="6" fill="currentColor" opacity=".7" />
      <rect x="14" y="4" width="12" height="32" rx="6" fill="currentColor" />
      <circle cx="20" cy="20" r="3" fill="var(--md-sys-color-surface)" />
    </svg><span>APIP</span>
  </span>;
}

function RoleTabs({ role, onChange }: { role: AccessRole; onChange: (role: AccessRole) => void }) {
  const ref = useRef<MdTabs>(null);
  useEffect(() => {
    const tabs = ref.current;
    if (!tabs) return;
    let disposed = false;
    void tabs.updateComplete.then(() => { if (!disposed) tabs.activeTabIndex = roles.indexOf(role); });
    const handleChange = () => { const next = roles[tabs.activeTabIndex]; if (next) onChange(next); };
    tabs.addEventListener('change', handleChange);
    return () => { disposed = true; tabs.removeEventListener('change', handleChange); };
  }, [role, onChange]);
  return <md-tabs ref={ref} aria-label="Sign-in workspace" className="access-role-tabs">
    {roles.map((item) => <md-primary-tab key={item} active={item === role || undefined}>
      {roleCopy[item].label}
    </md-primary-tab>)}
  </md-tabs>;
}

function SignInForm({ role }: { role: AccessRole }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({ email: false, password: false });
  const [notice, setNotice] = useState('');

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const nextErrors = { email: !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()), password: !password.trim() };
    setErrors(nextErrors);
    if (nextErrors.email || nextErrors.password) {
      document.getElementById(nextErrors.email ? 'access-email' : 'access-password')?.focus();
      return;
    }
    setPassword('');
    setShowPassword(false);
    setNotice('This is a design preview. Sign-in will be connected later. Nothing was sent and no account was accessed.');
  };

  return <form onSubmit={submit} autoComplete="off" noValidate className="access-form" aria-label={`${roleCopy[role].label} sign-in`}>
    <p className="access-form-intro">Continue to {roleCopy[role].account}.</p>
    <M3TextField id="access-email" label="Email address" type="email" autoComplete="off" value={email}
      required onChange={(event) => { setEmail(event.target.value); setErrors((old) => ({ ...old, email: false })); setNotice(''); }}
      error={errors.email} errorText="Enter an email address, such as name@example.com." />
    <M3TextField id="access-password" label="Password" type={showPassword ? 'text' : 'password'} autoComplete="off" value={password}
      required onChange={(event) => { setPassword(event.target.value); setErrors((old) => ({ ...old, password: false })); setNotice(''); }}
      error={errors.password} errorText="Enter a sample password for this preview." />
    <M3Checkbox id="access-show-password" checked={showPassword} onChange={setShowPassword} label="Show password" />
    <div className="access-preview-note"><span className="material-symbols-outlined" aria-hidden="true">info</span>
      <p>Design preview. Use sample details only.<br />Authentication will be added later.</p>
    </div>
    <div className="access-form-actions"><a href="#/" className="access-text-link">Back to APIP</a>
      <M3Button type="submit" variant="filled">Sign in</M3Button>
    </div>
    {notice && <p role="status" className="access-notice">{notice}</p>}
    {role === 'developer' && <div className="access-developer-preview">
      <a href="#/developer-reference" className="access-text-link">Open developer reference preview <span aria-hidden="true">↗</span></a>
      <p>Intended for Sailesh. This local preview has no access restriction yet.</p>
    </div>}
  </form>;
}

interface Props {
  route: PreviewRoute;
  appearance: Appearance;
  setAppearance: React.Dispatch<React.SetStateAction<Appearance>>;
  preferencesSaved: boolean;
}

export function AccessPreview({ route, appearance, setAppearance, preferencesSaved }: Props) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const isSignIn = route.screen === 'sign-in';
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
    document.getElementById('access-title')?.focus({ preventScroll: true });
  }, [route.screen]);
  const closeSettings = () => { setSettingsOpen(false); document.getElementById('access-settings-button')?.focus(); };

  return <div className="access-app">
    <a href="#access-main" className="access-skip-link" onClick={(event) => {
      event.preventDefault();
      document.getElementById('access-main')?.focus();
    }}>Skip to main content</a>
    <header className="access-header">
      <a className="access-home-link" href="#/" aria-label="APIP home"><Brand /></a>
      <div className="access-header-actions">
        <md-icon-button id="access-settings-button" aria-label="Appearance settings" aria-expanded={settingsOpen}
          aria-controls={settingsOpen ? 'appearance-settings' : undefined} onClick={() => setSettingsOpen((open) => !open)}>
          <md-icon><span className="material-symbols-outlined">settings</span></md-icon>
        </md-icon-button>
        {!isSignIn && <M3Button variant="filled" onClick={() => { window.location.hash = '/sign-in/patient'; }}>Sign in</M3Button>}
      </div>
    </header>
    {settingsOpen && <AppearanceSettings value={appearance} onChange={setAppearance} saved={preferencesSaved} onClose={closeSettings} />}

    <main id="access-main" tabIndex={-1} className={`access-main ${isSignIn ? 'access-main-sign-in' : ''}`}>
      {route.screen === 'home' && <section className="access-welcome" aria-labelledby="access-title">
        <div className="access-welcome-symbol" aria-hidden="true"><span className="material-symbols-outlined">health_and_safety</span></div>
        <p className="access-eyebrow">Agentic Pharma Co-intelligence Platform</p>
        <h1 id="access-title" tabIndex={-1}>Your experience.<br /><span>Better understood.</span></h1>
        <p className="access-welcome-copy">A simpler space for health questions, medicine experiences,<br className="access-desktop-break" /> and the people who review them.</p>
        <M3Button variant="filled" onClick={() => { window.location.hash = '/sign-in/patient'; }}>Sign in to APIP <span className="material-symbols-outlined access-inline-icon" aria-hidden="true">arrow_forward</span></M3Button>
        <div className="access-welcome-links"><a href="#/sign-in/patient">For patients</a><span aria-hidden="true">·</span><a href="#/sign-in/specialist">For specialists</a></div>
      </section>}

      {route.screen === 'sign-in' && <section className="access-sign-in-surface" aria-labelledby="access-title">
        <div className="access-sign-in-lead">
          <Brand large />
          <h1 id="access-title" tabIndex={-1}>Sign in</h1>
          <p className="access-lead-subtitle">{roleCopy[route.role].title}</p>
          <div className="access-workspace-label"><span className="material-symbols-outlined" aria-hidden="true">{roleCopy[route.role].icon}</span><span>{roleCopy[route.role].label} workspace</span></div>
          <p className="access-lead-description">{roleCopy[route.role].description}</p>
        </div>
        <div className="access-sign-in-fields">
          <RoleTabs role={route.role} onChange={(role) => { window.location.hash = `/sign-in/${role}`; }} />
          <SignInForm key={route.role} role={route.role} />
        </div>
      </section>}
    </main>

    <footer className="access-footer"><span>APIP <span aria-hidden="true">·</span> Interface preview</span>
      <a href="#/sign-in/developer">Developer sign-in</a>
    </footer>
  </div>;
}
