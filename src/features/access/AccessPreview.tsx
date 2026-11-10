import { LandingBody, LandingFooter } from './LandingV2';
import { APIPAuthDialog } from '../account/APIPAuthDialog';
import { ProfilePage } from '../account/ProfilePage';
import { SharedProfile } from '../account/SharedProfile';
import { useAccount } from '../account/AccountProvider';
import React, { useEffect, useRef, useState } from 'react';
import { M3Button } from '../../components/material/core';
import { Appearance } from '../../design-system/appearance';
import { goBackPreview, navigatePreview } from './navigation';
import { PageNavigation, PreviewFooter, PreviewHeader } from './PreviewLayout';

const AdrWorkspace = React.lazy(() => import('../adr/guided/GuidedWorkspace')
  .then((module) => ({ default: module.GuidedWorkspace })));
const SpecialistWorkspace = React.lazy(()=>import('../specialist/SpecialistWorkspace').then(module=>({default:module.SpecialistWorkspace})));
const CaseWorkspace = React.lazy(() => import('../adr/cases/CaseWorkspace').then(module=>({default:module.CaseWorkspace})));
const MedAssistPreview = React.lazy(() => import('../medassist/MedAssistPreview')
  .then((module) => ({ default: module.MedAssistPreview })));
const MedAssistConversation = import.meta.env.DEV ? React.lazy(() => import('../medassist-conversation/MedAssistConversation')) : null;

export type AccessRole = 'patient' | 'specialist';
export type PatientTask = 'medassist' | 'adr-report';
export type PreviewRoute =
  | { screen: 'specialist'; admin?: boolean; id?: string; view?: 'entry' | 'profile' | 'home' | 'reviews' }
  | { screen: 'home' }
  | { screen: 'profile' }
  | { screen: 'patient-home' }
  | { screen: 'adr-cases'; id?: string; revision?: number; history?: boolean }
  | { screen: 'adr-preview'; caseId?: string }
  | { screen: 'medassist-preview' }
  | { screen: 'medassist-conversation' }
  | { screen: 'sign-in'; role: AccessRole; requestedTask?: PatientTask; creating?: boolean; forgotPassword?: boolean; resetPassword?: boolean }
  | { screen: 'developer-reference' };

const roles: AccessRole[] = ['patient', 'specialist'];

export function readPreviewRoute(): PreviewRoute {
  const [path, query] = window.location.hash.slice(1).split('?');
  if (path === '/account/profile') return { screen: 'profile' };
  if (path === '/developer-reference') return { screen: 'developer-reference' };
  if (path === '/specialist') return { screen: 'specialist', view: 'entry' };
  const specialistView = /^\/specialist\/(profile|home|reviews)$/.exec(path);
  if (specialistView) return { screen: 'specialist', view: specialistView[1] as 'profile'|'home'|'reviews' };
  const identityAdmin = /^\/admin\/specialist-applications(?:\/([0-9a-f-]{36}))?$/.exec(path);
  if (identityAdmin) return { screen: 'specialist', admin: true, id: identityAdmin[1] };
  if (path === '/patient/home') return { screen: 'patient-home' };
  const cases = /^\/patient\/adr\/cases(?:\/([0-9a-f-]{36})(?:\/(history)|\/revisions\/([1-9][0-9]{0,2}))?)?$/i.exec(path);
  if (cases) return { screen: 'adr-cases', id: cases[1], history: !!cases[2], revision: cases[3] ? Number(cases[3]) : undefined };
  if (path === '/preview/adr-report') {
    const id = new URLSearchParams(query).get('case');
    return { screen: 'adr-preview', ...(/^[0-9a-f-]{36}$/i.test(id ?? '') ? { caseId: id! } : {}) };
  }
  if (path === '/preview/medassist') return { screen: 'medassist-preview' };
  if (path === '/reset-password') return { screen: 'sign-in', role: 'patient', resetPassword: true };
  if (path.startsWith('/forgot-password')) {
    const rolePart = path.replace(/^\/forgot-password\/?/, '');
    const validRole = roles.includes(rolePart as AccessRole) ? (rolePart as AccessRole) : 'patient';
    return { screen: 'sign-in', role: validRole, forgotPassword: true };
  }
  if (import.meta.env.DEV && path === '/preview/medassist-conversation') return { screen: 'medassist-conversation' };
  const signup = path.startsWith('/sign-up/');
  const role = path.replace(signup ? '/sign-up/' : '/sign-in/', '');
  if (roles.includes(role as AccessRole) && (path.startsWith('/sign-in/') || signup)) {
    const requestedTask = new URLSearchParams(query).get('continue');
    return {
      screen: 'sign-in', role: role as AccessRole, creating: signup || new URLSearchParams(query).has('signup'),
      ...(requestedTask === 'medassist' || requestedTask === 'adr-report' ? { requestedTask: requestedTask as PatientTask } : {}),
    };
  }
  return { screen: 'home' };
}

interface Props {
  route: PreviewRoute;
  appearance: Appearance;
  setAppearance: React.Dispatch<React.SetStateAction<Appearance>>;
  preferencesSaved: boolean;
}

export function AccessPreview({ route, appearance, setAppearance, preferencesSaved }: Props) {
  const account = useAccount();
  const openTask = (task: PatientTask) => navigatePreview(account.user ? `/preview/${task}` : `/sign-in/patient?continue=${task}`);
  const [homeMessage, setHomeMessage] = useState('');
  const helpDialog = useRef<HTMLDialogElement>(null);
  const isSignIn = route.screen === 'sign-in';
  const isPatientHome = route.screen === 'patient-home';
  const backFallback = route.screen === 'adr-cases'
    ? route.revision || route.history ? `/patient/adr/cases/${route.id}` : route.id ? '/patient/adr/cases' : '/patient/home'
    : route.screen === 'sign-in'
    ? route.requestedTask ? '/patient/home' : '/'
    : route.screen === 'adr-preview' || route.screen === 'medassist-preview' ? '/patient/home' : '/';

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
    document.getElementById(route.screen === 'adr-preview' ? 'adr-draft-title' : route.screen === 'medassist-preview' ? 'medassist-title' : route.screen === 'medassist-conversation' ? 'medassist-conversation-title' : 'access-title')?.focus({ preventScroll: true });
  }, [route.screen]);

  const protectedRoute = isPatientHome || route.screen === 'medassist-preview' || route.screen === 'adr-cases'
    || (route.screen === 'adr-preview' && !!route.caseId);
  useEffect(() => {
    if (protectedRoute && account.ready && !account.user) {
      if (route.screen === 'adr-cases' || route.screen === 'adr-preview') {
        sessionStorage.setItem('apip.account.return', window.location.hash.slice(1));
      }
      navigatePreview('/sign-in/patient', { replace: true });
    }
  }, [protectedRoute, account.ready, account.user]);

  return <div className={`access-app ${route.screen === 'medassist-conversation' ? 'access-app-conversation' : ''}`}>
    <a href="#access-main" className="access-skip-link" onClick={(event) => {
      event.preventDefault();
      document.getElementById('access-main')?.focus();
    }}>Skip to main content</a>
    <PreviewHeader screen={route.screen} appearance={appearance} setAppearance={setAppearance}
      preferencesSaved={preferencesSaved} onHelp={isPatientHome ? () => helpDialog.current?.showModal() : undefined} />

    <main id="access-main" tabIndex={-1} className={`access-main ${route.screen === 'medassist-conversation' ? 'access-main-conversation' : ''}`}>
      <div className="access-page-shell">
      {route.screen !== 'adr-preview' && route.screen !== 'medassist-preview' && <PageNavigation onBack={route.screen === 'home' || isSignIn ? undefined : () => goBackPreview(backFallback)} />}
      {(route.screen === 'home' || isSignIn || (protectedRoute && !account.user)) && <LandingBody signedIn={Boolean(account.user)} />}

      {protectedRoute && !account.ready && (
        <div className="access-loading-shell" role="status" aria-live="polite">
          <p className="m3-body-medium">Checking your account…</p>
        </div>
      )}

      {isPatientHome && account.user && <section className="patient-home" aria-labelledby="access-title">
        <div className="patient-home-heading">
          <p className="access-eyebrow">Your health, your next step</p>
          <h1 id="access-title" tabIndex={-1}>Your APIP dashboard</h1>
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
            {import.meta.env.DEV && <M3Button variant="text" onClick={() => navigatePreview('/preview/medassist-conversation')}>Try fictional adaptive conversation</M3Button>}
          </article>
          <article className="patient-task-card patient-report-card">
            <div className="patient-task-icon"><span className="material-symbols-outlined" aria-hidden="true">description</span></div>
            <div className="patient-task-copy">
              <p className="patient-task-kicker">MEDICINE EXPERIENCE</p>
              <h2>Report a side effect</h2>
              <p>Tell us about a suspected unwanted effect after taking a medicine. You do not need to use MedAssist first.</p>
              <ul><li>Answer short, guided questions in your own words</li><li>Leave details unknown when you are unsure</li><li>Review the information before any next step</li></ul>
              <p className="patient-task-note"><span className="material-symbols-outlined" aria-hidden="true">shield</span> Use fictional details. Your draft is saved to your account. Exporting does not submit it.</p>
            </div>
            <M3Button variant="filled" trailingIcon="arrow_forward" onClick={() => openTask('adr-report')}>Start an ADR report</M3Button>
            <M3Button variant="outlined" onClick={()=>navigatePreview('/patient/adr/cases')}>My ADR Reports</M3Button>
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

      {/* Material Design 3 Web Horizontal Authentication Dialog */}
      <APIPAuthDialog
        open={isSignIn || (protectedRoute && !account.user)}
        onClose={() => goBackPreview(backFallback)}
        initialRole={route.screen === 'sign-in' ? route.role : 'patient'}
        initialMode={
          route.screen === 'sign-in'
            ? route.resetPassword
              ? 'reset'
              : route.forgotPassword
              ? 'forgot'
              : route.creating
              ? 'signup'
              : 'signin'
            : 'signin'
        }
        requestedTask={route.screen === 'sign-in' ? route.requestedTask : undefined}
      />

      {route.screen === 'medassist-conversation' && MedAssistConversation && <React.Suspense fallback={<p role="status">Opening fictional MedAssist…</p>}><MedAssistConversation /></React.Suspense>}
      {route.screen==='specialist'&&<React.Suspense fallback={<p role="status">Opening identity workspace…</p>}><SpecialistWorkspace admin={route.admin} id={route.id} view={route.view}/></React.Suspense>}
      {route.screen === 'profile' && <ProfilePage key={account.user?.id ?? 'preview'} />}
      {route.screen === 'adr-cases' && account.user && <React.Suspense fallback={<p role="status">Opening your reports…</p>}>
        <CaseWorkspace key={account.user.id} owner={account.user.id} id={route.id} revision={route.revision} history={route.history}/>
      </React.Suspense>}
      {route.screen === 'adr-preview' && <section className="adr-preview-page" aria-label="Fictional ADR intake preview">
        <React.Suspense fallback={<><PageNavigation onBack={() => goBackPreview(backFallback)} /><p className="access-form-intro" role="status">Opening the fictional intake preview…</p></>}>
          <AdrWorkspace key={`${account.user?.id}/${route.caseId??'start'}`} initialCaseId={route.caseId} renderNavigation={(onBack, backLabel) => <PageNavigation onBack={onBack} backLabel={backLabel} />}
            onExit={() => navigatePreview(route.caseId?`/patient/adr/cases/${route.caseId}`:'/patient/home')} />
        </React.Suspense>
      </section>}
      {route.screen === 'medassist-preview' && <React.Suspense fallback={<><PageNavigation onBack={() => goBackPreview(backFallback)} /><p role="status">Opening the MedAssist preview…</p></>}>
        <SharedProfile layer="medassist" /><MedAssistPreview key={account.user?.id} onOpenAdr={() => navigatePreview('/preview/adr-report')} onExit={() => goBackPreview(backFallback)}
          renderNavigation={(onBack, label) => <PageNavigation onBack={onBack} backLabel={label} />} />
      </React.Suspense>}
      </div>
    </main>

    {route.screen === 'home' || isSignIn ? <LandingFooter signedIn={Boolean(account.user)} /> : <PreviewFooter />}
  </div>;
}
