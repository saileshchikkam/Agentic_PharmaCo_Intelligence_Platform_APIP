import {ResearchDisclaimerTicker} from './ResearchDisclaimerTicker';
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
const DeveloperArchive=React.lazy(()=>import('../specialist/DeveloperArchive').then(module=>({default:module.DeveloperArchive})));
const MedAssistPreview = React.lazy(() => import('../medassist/MedAssistPreview')
  .then((module) => ({ default: module.MedAssistPreview })));
const MedAssistConversation = React.lazy(() => import('../medassist-conversation/MedAssistConversation'));

export type AccessRole = 'patient' | 'specialist';
export type PatientTask = 'medassist' | 'adr-report';
export type PreviewRoute =
  | {screen:'developer-archive'}
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
  if (typeof window !== 'undefined' && window.location.pathname !== '/' && window.location.pathname !== '/index.html' && !window.location.hash) {
    const target = `${window.location.pathname}${window.location.search}`;
    window.history.replaceState({ apipPreview: true, apipDepth: 0 }, '', `/#${target}`);
  }
  const [rawPath, query] = window.location.hash.slice(1).split('?');
  const path = rawPath.length > 1 ? rawPath.replace(/\/+$/, '') : rawPath;
  if (path === '/account/profile') return { screen: 'profile' };
  if(path==='/internal/completed-adr')return {screen:'developer-archive'};
  const review=/^\/specialist\/reviews\/([0-9a-f-]{36})$/i.exec(path);
  if(review)return {screen:'specialist',view:'reviews',id:review[1]};
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
  if (path === '/preview/medassist' || path === '/preview/medassist-conversation') return { screen: 'medassist-conversation' };
  if (path === '/preview/medassist-legacy') return { screen: 'medassist-preview' };
  if (path === '/reset-password') return { screen: 'sign-in', role: 'patient', resetPassword: true };
  if (path.startsWith('/forgot-password')) {
    const rolePart = path.replace(/^\/forgot-password\/?/, '');
    const validRole = roles.includes(rolePart as AccessRole) ? (rolePart as AccessRole) : 'patient';
    return { screen: 'sign-in', role: validRole, forgotPassword: true };
  }
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
  const lastRole = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('apip.last.role') : null;
  const roleDefault = account.portal === 'specialist' ? '/specialist/home' : '/patient/home';
  const backFallback = route.screen==='specialist'&&route.view==='reviews'&&route.id?'/specialist/reviews':route.screen === 'adr-cases'
    ? route.revision || route.history ? `/patient/adr/cases/${route.id}` : route.id ? '/patient/adr/cases' : roleDefault
    : route.screen === 'sign-in'
    ? route.requestedTask ? '/patient/home' : '/'
    : route.screen === 'adr-preview' || route.screen === 'medassist-preview' || route.screen === 'medassist-conversation' ? roleDefault : '/';

  useEffect(() => {
    if(!account.user||!account.portalReady)return;
    if(account.portal==='patient'&&route.screen==='specialist')navigatePreview('/patient/home',{replace:true});
    if(account.portal==='specialist'&&route.screen==='patient-home')navigatePreview('/specialist/home',{replace:true});
  },[account.user?.id,account.portal,account.portalReady,route.screen,route.screen==='specialist'?route.view:undefined]);
  useEffect(() => {
    if (route.screen === 'specialist' && (route.view === 'home' || route.view === 'reviews' || route.admin)) {
      try { sessionStorage.setItem('apip.last.role', 'specialist'); } catch {}
    } else if (route.screen === 'patient-home') {
      try { sessionStorage.setItem('apip.last.role', 'patient'); } catch {}
    }
  }, [route.screen, route.screen === 'specialist' ? route.view : undefined, route.screen === 'specialist' ? route.admin : undefined]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
    document.getElementById(route.screen === 'adr-preview' ? 'adr-draft-title' : route.screen === 'medassist-preview' ? 'medassist-title' : route.screen === 'medassist-conversation' ? 'medassist-conversation-title' : 'access-title')?.focus({ preventScroll: true });
  }, [route.screen]);

  const protectedRoute = isPatientHome || route.screen === 'medassist-preview' || route.screen === 'adr-cases' || route.screen==='developer-archive'
    || (route.screen === 'adr-preview' && !!route.caseId);
  useEffect(() => {
    if (protectedRoute && account.ready && !account.user) {
      if (route.screen === 'adr-cases' || route.screen === 'adr-preview' || route.screen === 'medassist-preview' || route.screen === 'medassist-conversation') {
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
    <PreviewHeader screen={route.screen==='developer-archive'?'developer-reference':route.screen} appearance={appearance} setAppearance={setAppearance}
      preferencesSaved={preferencesSaved} onHelp={isPatientHome ? () => helpDialog.current?.showModal() : undefined} />

    <ResearchDisclaimerTicker />
    <main id="access-main" tabIndex={-1} className={`access-main ${route.screen !== 'home' && !isSignIn && account.user ? 'access-main-internal' : ''} ${route.screen === 'medassist-conversation' ? 'access-main-conversation' : ''}`}>
      <div id="access-back-navigation" className="access-back-row" />
      <div className="access-page-shell">
      {route.screen !== 'adr-preview' && route.screen !== 'medassist-preview' && <PageNavigation onBack={route.screen === 'home' || isSignIn ? undefined : () => goBackPreview(backFallback)} />}
      {(route.screen === 'home' || isSignIn || (protectedRoute && !account.user)) && <LandingBody signedIn={Boolean(account.user)} />}

      {account.user && account.portalReady && account.portal==='unknown' && <div className="access-loading-shell" role="alert"><h2>Account workspace unavailable</h2><p>Your account needs a verified patient or specialist role before a workspace can open. Contact the development administrator.</p></div>}
      {protectedRoute && !account.ready && (
        <div className="access-loading-shell" role="status" aria-live="polite">
          <p className="m3-body-medium">Checking your account…</p>
        </div>
      )}

      {isPatientHome && account.user && account.portal==='patient' && <section className="patient-home" aria-labelledby="access-title">
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
      {route.screen==='specialist'&&account.portalReady&&account.portal==='specialist'&&<React.Suspense fallback={<p role="status">Opening identity workspace…</p>}><SpecialistWorkspace key={account.user?.id ?? 'guest'} admin={route.admin} id={route.id} view={route.view}/></React.Suspense>}
      {route.screen === 'profile' && <ProfilePage key={account.user?.id ?? 'preview'} />}
      {route.screen==='developer-archive'&&account.user&&<React.Suspense fallback={<p role="status">Checking private archive access…</p>}><DeveloperArchive key={account.user.id}/></React.Suspense>}
      {route.screen === 'adr-cases' && account.user && <React.Suspense fallback={<p role="status">Opening your reports…</p>}>
        <CaseWorkspace key={account.user.id} owner={account.user.id} id={route.id} revision={route.revision} history={route.history}/>
      </React.Suspense>}
      {route.screen === 'adr-preview' && <section className="adr-preview-page" aria-label="Fictional ADR intake preview">
        <React.Suspense fallback={<><PageNavigation onBack={() => goBackPreview(backFallback)} /><p className="access-form-intro" role="status">Opening the fictional intake preview…</p></>}>
          <AdrWorkspace key={`${account.user?.id}/${route.caseId??'start'}`} initialCaseId={route.caseId} renderNavigation={(onBack, backLabel) => <PageNavigation onBack={onBack} backLabel={backLabel} />}
            onExit={() => navigatePreview(route.caseId?`/patient/adr/cases/${route.caseId}`:roleDefault)} />
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
