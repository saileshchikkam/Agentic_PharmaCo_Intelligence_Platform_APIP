import { ClipboardList, FileCheck2, FileText, MessageSquareText } from 'lucide-react';
import { useState } from 'react';
import { M3Button } from '../../../components/material/core';

export type SavedReport = { id: string; revision: number; updatedAt: string };

const steps = [
  { icon: MessageSquareText, title: 'Describe', detail: 'Tell us what you noticed in your own words.' },
  { icon: ClipboardList, title: 'Organize', detail: 'Answer guided questions about the reaction and medicines.' },
  { icon: FileCheck2, title: 'Review', detail: 'Check and correct your confirmed answers.' },
  { icon: FileText, title: 'Prepare', detail: 'Generate an editable PvPI form for your records.' },
];

const dateFormat = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' });

interface Props {
  drafts: SavedReport[] | null;
  busy: boolean;
  loadFailed: boolean;
  start: () => void;
  resume: (id: string) => void;
  retry: () => void;
}

export function AdrLanding({ drafts, busy, loadFailed, start, resume, retry }: Props) {
  const [paused, setPaused] = useState(false);
  return <>
    <section className="adr-landing-hero" aria-labelledby="adr-landing-title">
      <div>
        <p className="adr-eyebrow">APIP · RESEARCH PREVIEW</p>
        <h1 id="adr-landing-title">Report a suspected side effect</h1>
        <p>Go from a medicine experience to a reviewed report, one question at a time.</p>
        <div className="adr-actions">
          <M3Button disabled={busy} onClick={start}>Start New Report</M3Button>
        </div>
        <p className="adr-landing-note">Use fictional details only. You can save your progress and return from this local account.</p>
      </div>
      <section className="adr-process" aria-labelledby="adr-process-title">
        <h2 id="adr-process-title">How reporting works</h2>
        <ol className="adr-process-steps" data-paused={paused}>
          {steps.map(({ icon: Icon, title, detail }) => <li key={title}>
            <Icon size={22} aria-hidden="true" />
            <strong>{title}</strong>
            <span>{detail}</span>
          </li>)}
        </ol>
        <div className="adr-motion-control">
          <M3Button variant="text" onClick={() => setPaused(value => !value)}>
            {paused ? 'Resume animation' : 'Pause animation'}
          </M3Button>
        </div>
      </section>
    </section>

    <section className="adr-saved" aria-labelledby="adr-saved-title" aria-busy={busy && !drafts}>
      <h2 id="adr-saved-title">Saved reports</h2>
      {drafts === null && (loadFailed
        ? <div className="adr-saved-empty"><p>Your saved reports couldn’t be loaded.</p><M3Button variant="outlined" disabled={busy} onClick={retry}>Try again</M3Button></div>
        : <p role="status">Loading saved reports…</p>)}
      {drafts?.length === 0 && <div className="adr-saved-empty">
        <h3>No saved reports yet</h3>
        <p>Start a fictional report above. You can save your answers before finishing and resume here later.</p>
      </div>}
      {!!drafts?.length && <ul className="adr-draft-grid">
        {drafts.map(draft => <li key={draft.id} className="adr-draft-card">
          <h3>Draft {draft.id.slice(0, 8)}</h3>
          <dl>
            <div><dt>Last updated</dt><dd><time dateTime={draft.updatedAt}>{dateFormat.format(new Date(draft.updatedAt))}</time></dd></div>
            <div><dt>Saved revision</dt><dd>{draft.revision}</dd></div>
          </dl>
          <M3Button variant="outlined" disabled={busy} ariaLabel={`Resume draft ${draft.id.slice(0, 8)}`} onClick={() => resume(draft.id)}>Resume</M3Button>
        </li>)}
      </ul>}
    </section>

    <section className="adr-landing-info" aria-labelledby="adr-review-info">
      <h2 id="adr-review-info">Review before downloading</h2>
      <p>You decide which answers to confirm. APIP prepares an editable PvPI Version 1.4 PDF from your confirmed details for you to review and download.</p>
    </section>
  </>;
}
