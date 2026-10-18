import { AccountSignIn } from '../account/AccountSignIn';
import { ProfilePage } from '../account/ProfilePage';
import { SharedProfile } from '../account/SharedProfile';
import { useAccount } from '../account/AccountProvider';
import React, { useEffect, useRef, useState } from 'react';
import type { MdTabs } from '@material/web/tabs/tabs';
import { M3Button, M3Checkbox, M3TextField } from '../../components/material/core';
import { Appearance } from '../../design-system/appearance';
import { followPreviewLink, goBackPreview, navigatePreview } from './navigation';
import { Brand, PageNavigation, PreviewHeader } from './PreviewLayout';

const ReportReactionView = React.lazy(() => import('../../components/material/ReportReactionView')
  .then((module) => ({ default: module.ReportReactionView })));
const MedAssistPreview = React.lazy(() => import('../medassist/MedAssistPreview')
  .then((module) => ({ default: module.MedAssistPreview })));

export type AccessRole = 'patient' | 'specialist' | 'developer';
export type PatientTask = 'medassist' | 'adr-report';
export type PreviewRoute = { screen: 'home' } | { screen: 'profile' } | { screen: 'patient-home' } | { screen: 'adr-preview' } | { screen: 'medassist-preview' } | { screen: 'sign-in'; role: AccessRole; requestedTask?: PatientTask } | { screen: 'developer-reference' };

const roles: AccessRole[] = ['patient', 'specialist', 'developer'];
const roleCopy = {
  patient: { label: 'Patient', icon: 'person', title: 'Your experience matters.', description: 'A space for your health questions and medicine experiences.', account: 'your personal APIP space' },
  specialist: { label: 'Specialist', icon: 'clinical_notes', title: 'A shared view of medicine safety.', description: 'For pharmacovigilance specialists reviewing reported medicine experiences.', account: 'the specialist workspace' },
  developer: { label: 'Developer', icon: 'code', title: 'Thoughtfully built. Together.', description: 'The design reference for building a clear, consistent APIP experience.', account: 'the developer reference' },
};

export function readPreviewRoute(): PreviewRoute {
  const [path, query] = window.location.hash.slice(1).split('?');
  if (path === '/account/profile') return { screen: 'profile' };
  if (path === '/developer-reference') return { screen: 'developer-reference' };
  if (path === '/patient/home') return { screen: 'patient-home' };
  if (path === '/preview/adr-report') return { screen: 'adr-preview' };
  if (path === '/preview/medassist') return { screen: 'medassist-preview' };
  const role = path.replace('/sign-in/', '');
  if (roles.includes(role as AccessRole) && path.startsWith('/sign-in/')) {
    const requestedTask = new URLSearchParams(query).get('continue');
    return {
      screen: 'sign-in', role: role as AccessRole,
      ...(requestedTask === 'medassist' || requestedTask === 'adr-report' ? { requestedTask } : {}),
    };
  }
  return { screen: 'home' };
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

function SignInForm({ role, requestedTask }: { role: AccessRole; requestedTask?: PatientTask }) {
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
    <p className="access-form-intro">{requestedTask
      ? `Sign in to continue to ${requestedTask === 'medassist' ? 'MedAssist AI' : 'ADR reporting'}.`
      : `Continue to ${roleCopy[role].account}.`}</p>
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
    <div className="access-form-actions">
      <M3Button type="submit" variant="filled">Sign in</M3Button>
    </div>
    {notice && <p role="status" className="access-notice">{notice}</p>}
    {role === 'patient' && <div className="access-developer-preview">
      <a href="#/patient/home" className="access-text-link" onClick={(event) => followPreviewLink(event, '/patient/home')}>Preview the patient home <span aria-hidden="true">↗</span></a>
      <p>Open the interface preview directly; no account or sign-in is created.</p>
    </div>}
    {role === 'patient' && requestedTask === 'adr-report' && <div className="access-developer-preview">
      <a href="#/preview/adr-report" className="access-text-link" onClick={(event) => followPreviewLink(event, '/preview/adr-report')}>Preview the fictional ADR intake <span aria-hidden="true">↗</span></a>
      <p>Design review only. Use fictional details; this preview stores a draft in this browser and sends nothing.</p>
    </div>}
    {role === 'patient' && requestedTask === 'medassist' && <div className="access-developer-preview">
      <a href="#/preview/medassist" className="access-text-link" onClick={(event) => followPreviewLink(event, '/preview/medassist')}>Preview the MedAssist conversation <span aria-hidden="true">↗</span></a>
      <p>Fictional symptom conversation with optional local AI phrase selection. Clinical urgency assessment is not enabled.</p>
    </div>}
    {role === 'developer' && <div className="access-developer-preview">
      <a href="#/developer-reference" className="access-text-link" onClick={(event) => followPreviewLink(event, '/developer-reference')}>Open developer reference preview <span aria-hidden="true">↗</span></a>
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
  const account = useAccount();
  const openTask = (task: PatientTask) => navigatePreview(account.user && account.profile ? `/preview/${task}` : `/sign-in/patient?continue=${task}`);
  const [homeMessage, setHomeMessage] = useState('');
  const helpDialog = useRef<HTMLDialogElement>(null);
  const isSignIn = route.screen === 'sign-in';
  const isPatientHome = route.screen === 'patient-home';
  const backFallback = route.screen === 'sign-in'
    ? route.requestedTask ? '/patient/home' : '/'
    : route.screen === 'adr-preview' || route.screen === 'medassist-preview' ? '/patient/home' : '/';
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
    document.getElementById(route.screen === 'adr-preview' ? 'adr-draft-title' : route.screen === 'medassist-preview' ? 'medassist-title' : 'access-title')?.focus({ preventScroll: true });
  }, [route.screen]);

  return <div className="access-app">
    <a href="#access-main" className="access-skip-link" onClick={(event) => {
      event.preventDefault();
      document.getElementById('access-main')?.focus();
    }}>Skip to main content</a>
    <PreviewHeader screen={route.screen} appearance={appearance} setAppearance={setAppearance}
      preferencesSaved={preferencesSaved} onHelp={isPatientHome ? () => helpDialog.current?.showModal() : undefined} />

    <main id="access-main" tabIndex={-1} className={`access-main ${isSignIn ? 'access-main-sign-in' : ''}`}>
      <div className="access-page-shell">
      {route.screen !== 'adr-preview' && route.screen !== 'medassist-preview' && <PageNavigation onBack={route.screen === 'home' ? undefined : () => goBackPreview(backFallback)} />}
      {route.screen === 'home' && <section className="access-welcome" aria-labelledby="access-title">
        <div className="access-welcome-symbol" aria-hidden="true"><span className="material-symbols-outlined">health_and_safety</span></div>
        <p className="access-eyebrow">Agentic Pharma Co-intelligence Platform</p>
        <h1 id="access-title" tabIndex={-1}>Your experience.<br /><span>Better understood.</span></h1>
        <p className="access-welcome-copy">A simpler space for health questions, medicine experiences,<br className="access-desktop-break" /> and the people who review them.</p>
        <M3Button variant="filled" trailingIcon="arrow_forward" onClick={() => navigatePreview('/sign-in/patient')}>Sign in to APIP</M3Button>
        <div className="access-welcome-links"><a href="#/patient/home" onClick={(event) => followPreviewLink(event, '/patient/home')}>For patients</a><span aria-hidden="true">·</span><a href="#/sign-in/specialist" onClick={(event) => followPreviewLink(event, '/sign-in/specialist')}>For specialists</a></div>
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
            <M3Button variant="outlined" trailingIcon="arrow_forward" onClick={() => openTask('medassist')}>Explore MedAssist</M3Button>
          </article>
          <article className="patient-task-card patient-report-card">
            <div className="patient-task-icon"><span className="material-symbols-outlined" aria-hidden="true">description</span></div>
            <div className="patient-task-copy">
              <p className="patient-task-kicker">MEDICINE EXPERIENCE</p>
              <h2>Report a side effect</h2>
              <p>Tell us about a suspected unwanted effect after taking a medicine. You do not need to use MedAssist first.</p>
              <ul><li>Answer short, guided questions in your own words</li><li>Leave details unknown when you are unsure</li><li>Review the information before any next step</li></ul>
              <p className="patient-task-note"><span className="material-symbols-outlined" aria-hidden="true">shield</span> The intake preview uses fictional details, saves only in this browser, and sends nothing.</p>
            </div>
            <M3Button variant="filled" trailingIcon="arrow_forward" onClick={() => openTask('adr-report')}>Start an ADR report</M3Button>
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
          <RoleTabs role={route.role} onChange={(role) => navigatePreview(`/sign-in/${role}`)} />
          {route.role !== 'patient' && route.requestedTask && <p className="access-requested-task" role="status">
            Your choice is carried into this preview. Sign-in is not connected yet, so no account can be verified or task opened.
          </p>}
          {route.role === 'patient' ? <AccountSignIn requestedTask={route.requestedTask} /> : <SignInForm key={`${route.role}-${route.requestedTask ?? ''}`} role={route.role} requestedTask={route.requestedTask} />}
        </div>
      </section>}

      {route.screen === 'profile' && <ProfilePage key={account.user?.id ?? 'preview'} />}
      {route.screen === 'adr-preview' && <section className="adr-preview-page" aria-label="Fictional ADR intake preview">
        <React.Suspense fallback={<><PageNavigation onBack={() => goBackPreview(backFallback)} /><p className="access-form-intro" role="status">Opening the fictional intake preview…</p></>}>
          <SharedProfile layer="adr" /><ReportReactionView renderNavigation={(onBack, backLabel) => <PageNavigation onBack={onBack} backLabel={backLabel} />}
            onExit={() => goBackPreview(backFallback)} />
        </React.Suspense>
      </section>}
      {route.screen === 'medassist-preview' && <React.Suspense fallback={<><PageNavigation onBack={() => goBackPreview(backFallback)} /><p role="status">Opening the MedAssist preview…</p></>}>
        <SharedProfile layer="medassist" /><MedAssistPreview onOpenAdr={() => navigatePreview('/preview/adr-report')} onExit={() => goBackPreview(backFallback)}
          renderNavigation={(onBack, label) => <PageNavigation onBack={onBack} backLabel={label} />} />
      </React.Suspense>}
      </div>
    </main>

    <footer className="access-footer"><span>APIP <span aria-hidden="true">·</span> Interface preview</span>
      <a href="#/sign-in/developer" onClick={(event) => followPreviewLink(event, '/sign-in/developer')}>Developer sign-in</a>
    </footer>
  </div>;
}
