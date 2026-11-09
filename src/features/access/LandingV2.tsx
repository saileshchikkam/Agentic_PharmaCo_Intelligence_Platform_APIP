import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { MdTabs } from '@material/web/tabs/tabs';
import { M3Button } from '../../components/material/core';
import { followPreviewLink } from './navigation';
import { Brand } from './PreviewLayout';
import { useDiscreetDeveloperAccess } from './discreetDeveloperAccess';
import './landing-v2.css';

const stages = [
  { name: 'Describe', icon: 'edit_note', title: 'Start with what you noticed', text: 'Write about the experience in your own words.', rows: [] },
  { name: 'Organize', icon: 'fact_check', title: 'Check the details', text: 'Put your experience into fields you can review and correct.', rows: [['Experience', 'Itchy rash'], ['Timing', 'After evening dose'], ['Medicine', 'Unknown']] },
  { name: 'Control', icon: 'lock', title: 'Decide what to share', text: 'Choose a specialist and the exact saved version they can access.', rows: [['Saved report', 'Version 2'], ['Recipient', 'Selected specialist'], ['Sharing', 'Requires your consent']] },
  { name: 'Review', icon: 'assignment_ind', title: 'Share for human review', text: 'An authorized specialist can view the report and original PvPI form.', rows: [['Authorized view', 'Version 2'], ['Document', 'Original PvPI form'], ['Access', 'Read only']] },
];

function Icon({ name }: { name: string }) {
  return <span className="material-symbols-outlined" aria-hidden="true">{name}</span>;
}

function Entry({ path, kind = 'text', children }: { path: string; kind?: 'text' | 'outlined' | 'filled'; children: ReactNode }) {
  const Button = kind === 'filled' ? 'md-filled-button' : kind === 'outlined' ? 'md-outlined-button' : 'md-text-button';
  return <Button href={'#' + path} onClick={(event: React.MouseEvent<HTMLAnchorElement>) => followPreviewLink(event, path)}>{children}</Button>;
}

function Tabs({ id, label, items, active, select }: {
  id: string; label: string; items: string[]; active: number; select: (index: number) => void;
}) {
  const ref = useRef<MdTabs>(null);
  useEffect(() => {
    const tabs = ref.current;
    if (!tabs) return;
    const change = () => {
      if (tabs.activeTabIndex >= 0 && tabs.activeTabIndex < items.length) select(tabs.activeTabIndex);
    };
    tabs.addEventListener('change', change);
    return () => tabs.removeEventListener('change', change);
  }, [items.length, select]);
  return <md-tabs ref={ref} role="tablist" aria-label={label} className="landing-tabs">
    {items.map((item, index) => <md-secondary-tab key={item} id={id + '-' + index} role="tab" aria-selected={active === index}
      aria-controls={id + '-panel'} active={active === index || undefined}>{item}</md-secondary-tab>)}
  </md-tabs>;
}

function jump(event: React.MouseEvent<HTMLAnchorElement>, id: string) {
  if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return;
  event.preventDefault();
  const target = document.getElementById(id);
  target?.focus({ preventScroll: true });
  target?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
}

function paths(signedIn: boolean) {
  return {
    patient: signedIn ? '/patient/home' : '/sign-in/patient',
    specialist: signedIn ? '/specialist' : '/sign-in/specialist',
    medAssist: signedIn ? '/preview/medassist' : '/sign-in/patient?continue=medassist',
  };
}

export function LandingBody({ signedIn }: { signedIn: boolean }) {
  const [stage, setStage] = useState(0);
  const [audience, setAudience] = useState(0);
  const { patient, specialist, medAssist } = paths(signedIn);
  const selected = stages[stage];
  const modules = [
    { name: 'ADR reporting', icon: 'description', status: 'Fictional preview', text: 'Turn a medicine experience into a report you can check and save.', path: '/preview/adr-report', action: 'Try fictional reporting', tone: 'primary' },
    { name: 'MedAssist research', icon: 'chat', status: 'Experimental', text: 'Explore guided symptom interviews and severity research. Research use only.', path: medAssist, action: 'Explore MedAssist research', tone: 'secondary' },
    { name: 'Consent-based sharing', icon: 'lock', status: 'Prototype', text: 'Choose a recipient and an exact saved report version. Later edits stay outside that permission.' },
    { name: 'Specialist review', icon: 'assignment_ind', status: 'Authorized prototype', text: 'View assigned, consented reports and the original PvPI form. Guided review is planned.', path: specialist, action: 'Open specialist workspace' },
    { name: 'Evidence intelligence', icon: 'insights', status: 'Planned', text: 'Explore report patterns and inspect the source evidence. Counts alone cannot establish risk or cause.' },
    { name: 'Grounded AI research', icon: 'manage_search', status: 'Planned', text: 'Find relevant research sources with traceable references and human review.' },
  ];

  return <div className="landing-v2">
    <section className="landing-hero" aria-labelledby="access-title">
      <div className="landing-intro">
        <p className="landing-label m3-label-large"><Icon name="health_and_safety" /> APIP research prototype</p>
        <h1 id="access-title" tabIndex={-1} className="m3-display-large">Your health experience, <span>made clearer.</span></h1>
        <p className="m3-body-large">Explore symptoms, organize medicine experiences and choose what to share.</p>
        <div className="landing-actions">
          <Entry kind="filled" path={patient}>Explore as patient</Entry>
          <Entry kind="outlined" path={specialist}>Enter specialist portal</Entry>
        </div>
        <a href="#landing-platform" className="landing-jump m3-label-large" onClick={event => jump(event, 'landing-platform')}>Explore the platform <Icon name="arrow_downward" /></a>
      </div>
      <section className="landing-demo" aria-labelledby="landing-demo-title">
        <div className="landing-demo-header">
          <div className="landing-icon"><Icon name="description" /></div>
          <div><p className="m3-label-medium">Interactive fictional example</p><h2 id="landing-demo-title" tabIndex={-1} className="m3-title-large">From experience to report</h2></div>
        </div>
        <Tabs id="landing-steps" label="Report walkthrough" items={stages.map(item => item.name)} active={stage} select={setStage} />
        <div id="landing-steps-panel" className="landing-demo-body" role="tabpanel" aria-labelledby={'landing-steps-' + stage} tabIndex={0}>
          <div className="landing-transition" key={stage}>
            <p className="landing-label m3-label-medium"><Icon name={selected.icon} /> Step {stage + 1} of {stages.length}</p>
            <h3 className="m3-title-large">{selected.title}</h3>
            <p className="m3-body-medium">{selected.text}</p>
            <div className="landing-sample">
              {selected.rows.length ? <dl>{selected.rows.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
                : <blockquote className="m3-body-large">“I noticed an itchy rash after taking my evening dose.”</blockquote>}
            </div>
          </div>
        </div>
        <div className="landing-demo-actions">
          <md-linear-progress value={(stage + 1) / stages.length} aria-label={'Walkthrough step ' + (stage + 1) + ' of ' + stages.length} />
          <M3Button variant="text" trailingIcon="arrow_forward" onClick={() => setStage((stage + 1) % stages.length)}>{stage === stages.length - 1 ? 'Start again' : 'Next step'}</M3Button>
        </div>
      </section>
    </section>

    <section className="landing-section" aria-labelledby="landing-platform">
      <p className="landing-label m3-label-large">Explore APIP</p>
      <h2 id="landing-platform" tabIndex={-1} className="m3-headline-large">Tools for reporting and research</h2>
      <div className="landing-cards">
        {modules.map(item => <article className="landing-card" key={item.name} data-tone={item.tone}>
          <div className="landing-card-meta"><div className="landing-icon"><Icon name={item.icon} /></div><span className="landing-badge m3-label-medium">{item.status}</span></div>
          <h3 className="m3-title-large">{item.name}</h3><p className="m3-body-medium">{item.text}</p>
          {item.path && <div className="landing-card-action"><Entry path={item.path}>{item.action}</Entry></div>}
        </article>)}
      </div>
    </section>

    <section className="landing-section landing-split" aria-labelledby="landing-journeys">
      <div><p className="landing-label m3-label-large">Patient and specialist journeys</p><h2 id="landing-journeys" className="m3-headline-large">Find your place in APIP</h2></div>
      <div className="landing-journey-card">
        <Tabs id="landing-roles" label="Choose a journey" items={['Patient', 'Specialist']} active={audience} select={setAudience} />
        <div id="landing-roles-panel" className="landing-journey-panel" role="tabpanel" aria-labelledby={'landing-roles-' + audience} tabIndex={0}>
          <div className="landing-transition" key={audience}>
            <div className="landing-icon"><Icon name={audience === 0 ? 'person' : 'clinical_notes'} /></div>
            <h3 className="m3-title-large">{audience === 0 ? 'Make a report at your own pace' : 'Review the version the patient shared'}</h3>
            <p className="m3-body-medium">{audience === 0 ? 'Describe what happened, check the details, and decide whether to share your saved report.' : 'Professional approval and patient consent determine which assigned reports you can open. Review the consented version and its original PvPI form.'}</p>
            <Entry kind="outlined" path={audience === 0 ? patient : specialist}>{audience === 0 ? 'Open patient workspace' : 'Enter specialist portal'}</Entry>
          </div>
        </div>
      </div>
    </section>

    <section className="landing-section landing-split" aria-labelledby="landing-privacy">
      <div><div className="landing-icon"><Icon name="shield_lock" /></div><h2 id="landing-privacy" tabIndex={-1} className="m3-headline-large">Sharing stays in your hands</h2><p className="m3-body-medium">Use fictional information in this research prototype.</p></div>
      <div className="landing-disclosures">
        <details open><summary className="m3-title-medium">What am I sharing?</summary><p className="m3-body-medium">Consent applies to the recipient and saved version you select. New edits require a new sharing decision.</p></details>
        <details><summary className="m3-title-medium">What happens if I withdraw access?</summary><p className="m3-body-medium">Withdrawal prevents future authorized access. PDF copies already delivered cannot be recalled.</p></details>
        <details><summary className="m3-title-medium">Who reviews my report?</summary><p className="m3-body-medium">Authorized specialists review assigned, consented reports. People remain responsible for review decisions.</p></details>
      </div>
    </section>
  </div>;
}

export function LandingFooter({ signedIn }: { signedIn: boolean }) {
  const { patient, specialist } = paths(signedIn);
  const { handleBrandClick } = useDiscreetDeveloperAccess();

  return <footer className="landing-footer">
    <div className="landing-footer-content">
      <div>
        <a
          href="#/"
          onClick={(event) => {
            handleBrandClick(event);
            jump(event, 'access-title');
          }}
          aria-label="APIP, back to top"
        >
          <Brand />
        </a>
        <p className="m3-body-medium">Agentic Pharma Co-Intelligence Platform</p>
        <p className="m3-body-small">Research prototype</p>
      </div>
      <nav aria-label="Workspaces">
        <p className="m3-title-medium">Workspaces</p>
        <Entry path={patient}>Patient workspace</Entry>
        <Entry path={specialist}>Specialist portal</Entry>
        {!signedIn && <Entry path="/sign-up/patient">Create patient account</Entry>}
      </nav>
      <nav aria-label="About APIP">
        <p className="m3-title-medium">About APIP</p>
        <a href="#landing-demo-title" onClick={event => jump(event, 'landing-demo-title')}>Report walkthrough</a>
        <a href="#landing-platform" onClick={event => jump(event, 'landing-platform')}>Platform capabilities</a>
        <a href="#landing-privacy" onClick={event => jump(event, 'landing-privacy')}>Privacy and trust</a>
      </nav>
      <p className="landing-footer-note m3-body-small">APIP is an AI-assisted research platform and is not a substitute for professional medical advice, diagnosis, or treatment. Reports are not automatically submitted to PvPI.</p>
    </div>
  </footer>;
}
