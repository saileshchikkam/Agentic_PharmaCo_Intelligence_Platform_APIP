import { useRef, useState, type ReactNode } from 'react';
import { ArrowDown, ArrowRight, ArrowUpRight, AudioLines, BookOpen, ClipboardList, FileText, Fingerprint, LockKeyhole, Menu, Moon, ScanLine, Sparkles, Sun, X } from 'lucide-react';
import { M3Button } from '../../components/material/core';
import type { Appearance } from '../../design-system/appearance';
import { followPreviewLink } from './navigation';
import './signal.css';

const steps = [
  { label: 'Describe', title: 'It starts with your words.', text: 'Tell us what you noticed after taking a medicine.', icon: AudioLines },
  { label: 'Structure', title: 'The details take shape.', text: 'Check the medicine, experience and timing before saving.', icon: ClipboardList },
  { label: 'Consent', title: 'You decide what moves forward.', text: 'Choose a recipient and the exact saved version to share.', icon: Fingerprint },
  { label: 'Review', title: 'A person reads the report.', text: 'An authorized specialist can view the shared version and its original PvPI form.', icon: ScanLine },
];

const sections = [
  ['journey', 'How it works'],
  ['roles', 'For you'],
  ['platform', 'Platform'],
  ['privacy', 'Privacy'],
] as const;

function RouteLink({ path, children, className = '' }: { path: string; children: ReactNode; className?: string }) {
  return <a className={className} href={'#' + path} onClick={event => followPreviewLink(event, path)}>{children}</a>;
}

function SignalGraphic({ step }: { step: number }) {
  return <svg className="signal-orbit" viewBox="0 0 600 510" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
    <defs>
      <pattern id="signal-grid" width="28" height="28" patternUnits="userSpaceOnUse">
        <path d="M28 0H0V28" fill="none" stroke="#729dda" strokeOpacity=".13" />
      </pattern>
      <radialGradient id="signal-halo"><stop stopColor="#215ac2" stopOpacity=".52" /><stop offset="1" stopColor="#101c3a" stopOpacity="0" /></radialGradient>
      <linearGradient id="signal-wire"><stop stopColor="#2b4a86" /><stop offset=".58" stopColor="#89dcff" /><stop offset="1" stopColor="#4669c7" /></linearGradient>
    </defs>
    <path fill="url(#signal-grid)" d="M0 0H600V510H0z" />
    <ellipse fill="url(#signal-halo)" cx="308" cy="246" rx="299" ry="245" />
    <g fill="none" stroke="#709fe8" strokeOpacity=".26">
      <ellipse cx="301" cy="246" rx="243" ry="151" transform="rotate(-28 301 246)" />
      <ellipse cx="301" cy="246" rx="209" ry="122" transform="rotate(-28 301 246)" />
      <ellipse cx="301" cy="246" rx="254" ry="89" transform="rotate(25 301 246)" strokeDasharray="3 6" />
      <circle cx="301" cy="246" r="185" strokeDasharray="1 8" />
    </g>
    <path d="M0 344H74Q91 344 103 331L155 277Q168 264 190 264H361Q385 264 405 243L472 175Q482 165 504 165H600" fill="none" stroke="url(#signal-wire)" strokeWidth="2" />
    <path key={step} className="signal-pulse" d="M0 344H74Q91 344 103 331L155 277Q168 264 190 264H361Q385 264 405 243L472 175Q482 165 504 165H600" fill="none" stroke="#d0f5ff" strokeWidth="3" pathLength="100" />
    <g fill="#a7dfff"><circle cx="77" cy="344" r="4" /><circle cx="504" cy="165" r="4" /><circle cx="135" cy="128" r="3" /><circle cx="469" cy="368" r="3" /></g>
    <g stroke="#7a9ac7" strokeOpacity=".66"><path d="M44 62h14m-7-7v14M547 410h14m-7-7v14M46 427h14m-7-7v14" /></g>
  </svg>;
}

function StageSample({ step }: { step: number }) {
  if (step === 0) return <blockquote>“I noticed a rash after taking my evening dose.”</blockquote>;
  if (step === 1) return <dl><div><dt>Experience</dt><dd>Rash</dd></div><div><dt>Timing</dt><dd>After evening dose</dd></div></dl>;
  if (step === 2) return <dl><div><dt>Report version</dt><dd>02 · Saved</dd></div><div><dt>Future access</dt><dd>Patient controlled</dd></div></dl>;
  return <dl><div><dt>Shared version</dt><dd>02 · Read only</dd></div><div><dt>Document</dt><dd>Original PvPI form</dd></div></dl>;
}

export function SignalLanding({ appearance, toggleTheme, signedIn }: {
  appearance: Appearance;
  toggleTheme: () => void;
  signedIn: boolean;
}) {
  const [step, setStep] = useState(0);
  const [role, setRole] = useState<'patient' | 'specialist'>('patient');
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);
  const patient = signedIn ? '/patient/home' : '/sign-in/patient';
  const specialist = signedIn ? '/specialist' : '/sign-in/specialist';
  const medassist = signedIn ? '/preview/medassist' : '/sign-in/patient?continue=medassist';
  const activeStep = steps[step];
  const StepIcon = activeStep.icon;

  function visitSection(id: string) {
    setMenuOpen(false);
    const target = document.getElementById(id);
    target?.focus({ preventScroll: true });
    target?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
  }

  const modules = [
    { name: 'ADR Reporting', status: 'Fictional preview', description: 'Turn a medicine experience into a report you can check and save.', icon: FileText, path: '/preview/adr-report', action: 'Explore reporting' },
    { name: 'MedAssist', status: 'Experimental', description: 'Explore symptom interviews and severity research in a fictional setting.', icon: AudioLines, path: medassist, action: 'Open MedAssist' },
    { name: 'Consented Sharing', status: 'Hosted acceptance pending', description: 'Choose a recipient and a specific version of your report.', icon: Fingerprint, detail: 'The consent flow records the recipient and saved version you select. Later edits require separate sharing.' },
    { name: 'Specialist Review', status: 'Guided workspace upcoming', description: 'View assigned, consented reports and their original PvPI forms.', icon: ScanLine, path: specialist, action: 'Open specialist portal' },
    { name: 'Evidence Intelligence', status: 'Planned', description: 'Explore patterns in reports through future evidence dashboards.', icon: BookOpen, detail: 'Planned dashboards will help researchers inspect reports and source material. Patterns in reporting do not establish incidence or causality.' },
    { name: 'AI Research Tools', status: 'Planned', description: 'Find relevant sources with a research assistant that shows its evidence.', icon: Sparkles, detail: 'Planned tools include retrieval from approved sources and narrowly scoped research assistance with human review.' },
  ];

  return <div className="signal-site" data-theme={appearance.isDark ? 'dark' : 'light'}>
    <a className="signal-skip" href="#signal-main" onClick={event => { event.preventDefault(); visitSection('signal-main'); }}>Skip to content</a>
    <header className="signal-nav" onKeyDown={event => {
      if (event.key === 'Escape' && menuOpen) { setMenuOpen(false); menuButton.current?.focus(); }
    }}>
      <div className="signal-shell signal-nav-inner">
        <button className="signal-brand" onClick={() => visitSection('signal-main')} aria-label="APIP Signal, back to top">
          <span className="signal-brand-mark"><AudioLines size={20} aria-hidden="true" /></span> APIP <span className="signal-brand-tag">SIGNAL</span>
        </button>
        <nav aria-label="Main navigation" className="signal-desktop-nav">
          {sections.map(([id, label]) => <button key={id} onClick={() => visitSection(id)}>{label}</button>)}
        </nav>
        <div className="signal-nav-actions">
          <button className="signal-icon-button" aria-label={appearance.isDark ? 'Switch to light theme' : 'Switch to dark theme'} onClick={toggleTheme}>
            {appearance.isDark ? <Sun size={20} aria-hidden="true" /> : <Moon size={19} aria-hidden="true" />}
          </button>
          <RouteLink path={patient} className="signal-nav-entry">{signedIn ? 'Dashboard' : 'Sign in'} <ArrowUpRight size={15} aria-hidden="true" /></RouteLink>
          <button ref={menuButton} className="signal-icon-button signal-menu-button" aria-label={menuOpen ? 'Close menu' : 'Open menu'} aria-expanded={menuOpen} aria-controls="signal-menu" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X size={21} aria-hidden="true" /> : <Menu size={21} aria-hidden="true" />}
          </button>
        </div>
      </div>
      {menuOpen && <nav id="signal-menu" className="signal-mobile-menu" aria-label="Mobile navigation">
        {sections.map(([id, label]) => <button key={id} onClick={() => visitSection(id)}>{label}<ArrowRight size={18} aria-hidden="true" /></button>)}
        <RouteLink path={patient}>Patient entry <ArrowUpRight size={18} aria-hidden="true" /></RouteLink>
        <RouteLink path={specialist}>Specialist portal <ArrowUpRight size={18} aria-hidden="true" /></RouteLink>
      </nav>}
    </header>

    <main id="signal-main" tabIndex={-1}>
      <section className="signal-shell signal-hero" aria-labelledby="access-title">
        <div className="signal-hero-copy">
          <p className="signal-kicker"><span /> A better way to report medicine experiences</p>
          <h1 id="access-title" tabIndex={-1}>Your experience.<br /><em>A clearer picture.</em></h1>
          <p className="signal-lede">Describe what happened. Build a structured report. Stay in control of what you share.</p>
          <div className="signal-actions">
            <RouteLink path={patient} className="signal-button signal-primary">Explore as patient <ArrowUpRight size={18} aria-hidden="true" /></RouteLink>
            <RouteLink path={specialist} className="signal-button signal-secondary">Enter specialist portal <ArrowRight size={18} aria-hidden="true" /></RouteLink>
          </div>
          <p className="signal-hero-note"><LockKeyhole size={14} aria-hidden="true" /> Fictional research prototype</p>
        </div>
        <figure className="signal-visual" aria-label="Interactive fictional report journey">
          <SignalGraphic step={step} />
          <figcaption className="signal-visual-caption"><span><i /> THE SIGNAL</span><span>FICTIONAL CASE / 01</span></figcaption>
          <div className="signal-coordinate">REPORT PATH<br />01 — 04</div>
          <span className="sr-only" role="status">{activeStep.label}. {activeStep.text}</span>
          <div className="signal-ticket" key={step}>
            <div className="signal-ticket-top"><StepIcon size={21} aria-hidden="true" /><span>0{step + 1} / {activeStep.label}</span></div>
            <StageSample step={step} />
          </div>
          <div className="signal-step-control" role="group" aria-label="Report journey stages">
            {steps.map((item, index) => <button key={item.label} aria-pressed={index === step} onClick={() => setStep(index)}><span>0{index + 1}</span>{item.label}</button>)}
          </div>
        </figure>
        <button className="signal-scroll" onClick={() => visitSection('journey')}><ArrowDown size={15} aria-hidden="true" /> Follow the signal</button>
      </section>

      <section className="signal-band" aria-labelledby="journey">
        <div className="signal-shell signal-section">
          <p className="signal-kicker"><span /> 01 / The journey</p>
          <h2 id="journey" tabIndex={-1}>From a moment <em>to a report.</em></h2>
          <div className="signal-story">
            {steps.map(({ label, title, text, icon: Icon }, index) => <article key={label} className="signal-story-card">
              <div className="signal-story-index"><span>0{index + 1}</span><Icon size={24} aria-hidden="true" /></div>
              <h3>{title}</h3><p>{text}</p>
              <div className="signal-story-sample"><StageSample step={index} /></div>
            </article>)}
          </div>
        </div>
      </section>

      <section className="signal-shell signal-section signal-role" aria-labelledby="roles">
        <div>
          <p className="signal-kicker"><span /> 02 / Your workspace</p>
          <h2 id="roles" tabIndex={-1}>Two perspectives.<br /><em>One clear report.</em></h2>
          <div className="signal-segments" role="group" aria-label="Explore by role">
            <button aria-pressed={role === 'patient'} onClick={() => setRole('patient')}>Patient</button>
            <button aria-pressed={role === 'specialist'} onClick={() => setRole('specialist')}>Specialist</button>
          </div>
        </div>
        <div className="signal-role-panel" key={role} data-role={role}>
          <span className="signal-role-icon">{role === 'patient' ? <FileText aria-hidden="true" /> : <ScanLine aria-hidden="true" />}</span>
          <p className="signal-kicker">{role === 'patient' ? 'Your experience' : 'Authorized review'}</p>
          <h3>{role === 'patient' ? 'Put it into words.' : 'See what was shared.'}</h3>
          <p>{role === 'patient' ? 'Organize what happened, check the report and decide whether to share it. You can withdraw future access.' : 'Professional approval and patient consent determine which reports you can view. Review the exact shared version and preview the original PvPI form.'}</p>
          {role === 'specialist' && <p className="signal-role-status">Guided review is upcoming. Hosted sharing acceptance is pending.</p>}
          <RouteLink className="signal-text-link" path={role === 'patient' ? '/preview/adr-report' : specialist}>{role === 'patient' ? 'Explore fictional reporting' : 'Enter specialist portal'} <ArrowUpRight size={18} aria-hidden="true" /></RouteLink>
        </div>
      </section>

      <section className="signal-band" aria-labelledby="platform">
        <div className="signal-shell signal-section">
          <p className="signal-kicker"><span /> 03 / The platform</p>
          <h2 id="platform" tabIndex={-1}>Tools for a clearer <em>signal.</em></h2>
          <div className="signal-modules">
            {modules.map(({ name, status, description, icon: Icon, ...module }, index) => <article key={name} className={'signal-module signal-module-' + index}>
              <div className="signal-module-meta"><span>{status}</span><span>0{index + 1}</span></div>
              <div className="signal-module-art" aria-hidden="true"><Icon size={index === 0 ? 90 : 60} strokeWidth={1} /></div>
              <h3>{name}</h3><p>{description}</p>
              {module.path ? <RouteLink className="signal-text-link" path={module.path}>{module.action} <ArrowUpRight size={16} aria-hidden="true" /></RouteLink> :
                <details><summary>Explore the capability</summary><p>{module.detail}</p></details>}
            </article>)}
          </div>
        </div>
      </section>

      <section className="signal-shell signal-section signal-trust" aria-labelledby="privacy">
        <div>
          <p className="signal-kicker"><span /> 04 / Privacy and limits</p>
          <h2 id="privacy" tabIndex={-1}>Your report.<br /><em>Your decision.</em></h2>
          <p className="signal-lede">A fictional research prototype. For clinical or emergency care, use an appropriate healthcare service.</p>
        </div>
        <div className="signal-trust-list">
          <details open><summary>Choose exactly what to share</summary><p>Consent names the specialist and the saved report version. Changes you make later stay outside that permission.</p></details>
          <details><summary>Withdraw future access</summary><p>Withdrawal prevents future authorized access. A copy or PDF already delivered remains with its recipient.</p></details>
          <details><summary>Keep people in charge</summary><p>Specialists need approval and an assigned, consented report. People review the information and make their own decisions. The prototype does not submit reports to regulators.</p></details>
        </div>
      </section>
    </main>
    <footer className="signal-footer">
      <div className="signal-shell signal-footer-inner">
        <div><p className="signal-footer-brand"><AudioLines size={22} aria-hidden="true" /> APIP SIGNAL</p><p>Agentic Pharma Co-Intelligence Platform<br />Fictional research prototype</p></div>
        <nav aria-label="Footer navigation"><RouteLink path={patient}>Patient entry</RouteLink><RouteLink path={specialist}>Specialist portal</RouteLink><button onClick={() => visitSection('privacy')}>Privacy and limits</button></nav>
        <M3Button variant="outlined" onClick={() => visitSection('signal-main')}>Back to top ↑</M3Button>
      </div>
    </footer>
  </div>;
}
