import React, { useEffect, useRef, useState } from 'react';
import type { MdTabs } from '@material/web/tabs/tabs';
import { M3Button, M3Checkbox, M3TextField } from '../../components/material/core';
import { Appearance } from '../../design-system/appearance';
import './access.css';

export type AccessRole = 'patient' | 'specialist' | 'developer';
export type PreviewRoute = { screen: 'home' } | { screen: 'patient-home' } | { screen: 'sign-in'; role: AccessRole } | { screen: 'developer-reference' };

const roles: AccessRole[] = ['patient', 'specialist', 'developer'];
const roleCopy = {
  patient: { label: 'Patient', icon: 'person', title: 'Your experience matters.', description: 'A space for your health questions and medicine experiences.', account: 'your personal APIP space' },
  specialist: { label: 'Specialist', icon: 'clinical_notes', title: 'A shared view of medicine safety.', description: 'For pharmacovigilance specialists reviewing reported medicine experiences.', account: 'the specialist workspace' },
  developer: { label: 'Developer', icon: 'code', title: 'Thoughtfully built. Together.', description: 'The design reference for building a clear, consistent APIP experience.', account: 'the developer reference' },
};

export function readPreviewRoute(): PreviewRoute {
  if (window.location.hash === '#/developer-reference') return { screen: 'developer-reference' };
  if (window.location.hash === '#/patient/home') return { screen: 'patient-home' };
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
    {role === 'patient' && <div className="access-developer-preview">
      <a href="#/patient/home" className="access-text-link">Preview the patient home <span aria-hidden="true">↗</span></a>
      <p>Open the interface preview directly; no account or sign-in is created.</p>
    </div>}
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
  const [homeMessage, setHomeMessage] = useState('');
  const helpDialog = useRef<HTMLDialogElement>(null);
  const isSignIn = route.screen === 'sign-in';
  const isPatientHome = route.screen === 'patient-home';
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
    document.getElementById('access-title')?.focus({ preventScroll: true });
  }, [route.screen]);
  const closeSettings = () => { setSettingsOpen(false); document.getElementById('access-settings-button')?.focus(); };
  useEffect(() => {
    if (!settingsOpen) return;
    let disposed = false;
    const button = document.getElementById('access-accent-blue') as (HTMLElement & { updateComplete: Promise<boolean> }) | null;
    void button?.updateComplete.then(() => { if (!disposed) button.focus(); });
    return () => { disposed = true; };
  }, [settingsOpen]);

  return <div className="access-app">
    <a href="#access-main" className="access-skip-link" onClick={(event) => {
      event.preventDefault();
      document.getElementById('access-main')?.focus();
    }}>Skip to main content</a>
    <header className={`access-header ${settingsOpen ? 'access-header-settings-open' : ''}`} onKeyDown={(event) => {
      if (settingsOpen && event.key === 'Escape') { event.preventDefault(); closeSettings(); }
    }}>
      <a className="access-home-link" href="#/" aria-label="APIP home"><Brand /></a>
      <div className="access-header-actions">
        {settingsOpen && <div id="access-appearance-settings" className="access-header-preferences" role="group" aria-label="Appearance settings">
          <span className="access-appearance-label">Appearance</span>
          <div className="access-accent-options" role="group" aria-label="Highlight colour">
            {(['blue', 'black', 'green'] as const).map((accent) => <md-icon-button key={accent} id={`access-accent-${accent}`}
              aria-label={`${accent[0].toUpperCase()}${accent.slice(1)} highlight`} toggle selected={appearance.accent === accent || undefined}
              onClick={() => setAppearance((value) => ({ ...value, accent }))}>
              <span className={`access-accent-dot access-accent-${accent}`} aria-hidden="true">
                {appearance.accent === accent && <span className="material-symbols-outlined">check</span>}
              </span>
            </md-icon-button>)}
          </div>
          <md-icon-button aria-label="Dark mode" toggle selected={appearance.isDark || undefined}
            onClick={() => setAppearance((value) => ({ ...value, isDark: !value.isDark }))}>
            <md-icon><span className="material-symbols-outlined">{appearance.isDark ? 'dark_mode' : 'light_mode'}</span></md-icon>
          </md-icon-button>
          <span className="access-preference-status" role="status">{preferencesSaved ? 'Appearance saved in this browser.' : 'Appearance applies to this visit only.'}</span>
        </div>}
        <md-icon-button id="access-settings-button" aria-label={settingsOpen ? 'Close appearance settings' : 'Appearance settings'} aria-expanded={settingsOpen}
          aria-controls={settingsOpen ? 'access-appearance-settings' : undefined} onClick={() => settingsOpen ? closeSettings() : setSettingsOpen(true)}>
          <md-icon><span className="material-symbols-outlined">{settingsOpen ? 'close' : 'settings'}</span></md-icon>
        </md-icon-button>
        {isPatientHome && !settingsOpen && <><span className="access-preview-badge"><span aria-hidden="true">●</span> Preview</span>
          <md-icon-button aria-label="Help with patient home" onClick={() => helpDialog.current?.showModal()}>
            <md-icon><span className="material-symbols-outlined">help</span></md-icon>
          </md-icon-button></>}
        {!isSignIn && !isPatientHome && !settingsOpen && <M3Button variant="filled" onClick={() => { window.location.hash = '/sign-in/patient'; }}>Log in</M3Button>}
      </div>
    </header>

    <main id="access-main" tabIndex={-1} className={`access-main ${isSignIn ? 'access-main-sign-in' : ''}`}>
      {route.screen === 'home' && <section className="access-welcome" aria-labelledby="access-title">
        <div className="access-welcome-symbol" aria-hidden="true"><span className="material-symbols-outlined">health_and_safety</span></div>
        <p className="access-eyebrow">Agentic Pharma Co-intelligence Platform</p>
        <h1 id="access-title" tabIndex={-1}>Your experience.<br /><span>Better understood.</span></h1>
        <p className="access-welcome-copy">A simpler space for health questions, medicine experiences,<br className="access-desktop-break" /> and the people who review them.</p>
        <M3Button variant="filled" trailingIcon="arrow_forward" onClick={() => { window.location.hash = '/sign-in/patient'; }}>Sign in to APIP</M3Button>
        <div className="access-welcome-links"><a href="#/sign-in/patient">For patients</a><span aria-hidden="true">·</span><a href="#/sign-in/specialist">For specialists</a></div>
      </section>}

      {isPatientHome && <section className="patient-home" aria-labelledby="access-title">
        <div className="patient-home-heading">
          <p className="access-eyebrow">Your health, your next step</p>
          <h1 id="access-title" tabIndex={-1}>How can we help today?</h1>
          <p>Choose a place to start. You can report a medicine experience directly, whenever you need to.</p>
        </div>
        <div className="patient-task-grid">
          <article className="patient-task-card patient-medassist-card">
            <div className="patient-task-icon"><span className="material-symbols-outlined" aria-hidden="true">forum</span></div>
            <div className="patient-task-copy">
              <p className="patient-task-kicker">QUESTIONS AND NEXT STEPS</p>
              <h2>MedAssist AI</h2>
              <p>Talk through a health question, organize what you are experiencing, and explore sensible next steps.</p>
              <ul><li>Share symptoms in your own words</li><li>Get help organizing what to discuss with a professional</li><li>Continue to a medicine report whenever you choose</li></ul>
              <p className="patient-task-note"><span className="material-symbols-outlined" aria-hidden="true">info</span> Assistant guidance is a planned preview; it does not diagnose or replace professional care.</p>
            </div>
            <M3Button variant="outlined" trailingIcon="arrow_forward" onClick={() => setHomeMessage('MedAssist is a planned preview. Its conversation and reviewed guidance will be designed in a later step; no health details were entered or sent.')}>Explore MedAssist</M3Button>
          </article>
          <article className="patient-task-card patient-report-card">
            <div className="patient-task-icon"><span className="material-symbols-outlined" aria-hidden="true">description</span></div>
            <div className="patient-task-copy">
              <p className="patient-task-kicker">MEDICINE EXPERIENCE</p>
              <h2>Report a side effect</h2>
              <p>Tell us about a suspected unwanted effect after taking a medicine. You do not need to use MedAssist first.</p>
              <ul><li>Answer short, guided questions in your own words</li><li>Leave details unknown when you are unsure</li><li>Review the information before any next step</li></ul>
              <p className="patient-task-note"><span className="material-symbols-outlined" aria-hidden="true">shield</span> This preview does not save or send reports. Use fictional details only.</p>
            </div>
            <M3Button variant="filled" trailingIcon="arrow_forward" onClick={() => setHomeMessage('The guided ADR reporting screen is the next design step. No report was started, saved, or sent.')}>Start an ADR report</M3Button>
          </article>
        </div>
        {homeMessage && <div className="patient-home-message" role="status"><span>{homeMessage}</span>
          <md-icon-button aria-label="Dismiss message" onClick={() => setHomeMessage('')}><md-icon><span className="material-symbols-outlined">close</span></md-icon></md-icon-button>
        </div>}
        <dialog ref={helpDialog} className="patient-help-dialog" aria-labelledby="patient-help-title">
          <div className="patient-help-heading"><span className="material-symbols-outlined" aria-hidden="true">help</span><h2 id="patient-help-title">Choosing where to start</h2></div>
          <p>MedAssist is for health questions and organizing possible next steps. ADR reporting is for documenting a suspected unwanted effect linked to a medicine. You can report directly at any time.</p>
          <p>This is an interface preview, not a medical service. Do not enter real patient information.</p>
          <div className="patient-help-actions"><M3Button variant="text" onClick={() => helpDialog.current?.close()}>Close</M3Button></div>
        </dialog>
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
