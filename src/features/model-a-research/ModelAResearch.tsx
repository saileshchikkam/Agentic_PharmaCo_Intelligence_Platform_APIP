import React, { useEffect, useRef, useState } from 'react';
import { M3Button, M3Checkbox, M3Select } from '../../components/material/core';
import { type Answer, type DemoResult, type Fixtures, type InterviewRequest, type Scalar, readDemoResult, readFixtures, statuses } from './contracts';
import { appendAnswer, endInterview, exportEvidence } from './flow';
import './research.css';

const api = '/api/research/model-a';

export default function ModelAResearch() {
  const [fixtures, setFixtures] = useState<Fixtures | null>(null);
  const [request, setRequest] = useState<InterviewRequest | null>(null);
  const [result, setResult] = useState<DemoResult | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [selected, setSelected] = useState<number[]>([]);
  const [filter, setFilter] = useState('all');
  const [availabilityVersion, setAvailabilityVersion] = useState(0);
  const controller = useRef<AbortController | null>(null);
  const generation = useRef(0);
  const inFlight = useRef(false);
  const heading = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const abort = new AbortController();
    setError('');
    fetch(`${api}/fixtures`, { signal: abort.signal, credentials: 'omit', cache: 'no-store' })
      .then(async response => {
        if (!response.ok) throw new Error();
        const accepted = readFixtures(await response.json());
        if (!accepted) throw new Error();
        setFixtures(accepted);
      }).catch(() => { if (!abort.signal.aborted) setError('Local research demo unavailable. Start the verified adapter and explicitly enable the development proxy.'); });
    return () => { abort.abort(); generation.current++; controller.current?.abort(); };
  }, [availabilityVersion]);
  useEffect(() => { if (result) heading.current?.focus({ preventScroll: true }); }, [result]);
  useEffect(() => {
    if (!request?.answers.length) return;
    const unload = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ''; };
    window.addEventListener('beforeunload', unload);
    return () => window.removeEventListener('beforeunload', unload);
  }, [request?.answers.length]);

  async function send(next: InterviewRequest) {
    if (inFlight.current) return;
    inFlight.current = true;
    const version = ++generation.current;
    const abort = new AbortController(); controller.current = abort;
    const timer = setTimeout(() => abort.abort(), 17000);
    setBusy(true); setError('');
    try {
      const response = await fetch(`${api}/interview`, { method: 'POST', headers: { 'Content-Type': 'application/json' },
        credentials: 'omit', cache: 'no-store', signal: abort.signal, body: JSON.stringify(next) });
      if (!response.ok) throw new Error();
      const accepted = readDemoResult(await response.json());
      if (!accepted) throw new Error();
      if (version !== generation.current) return;
      if (!accepted.handoff) {
        setError('This input was not accepted. Previous accepted evidence is unchanged; no clinical assessment was produced. Reset to an authored fixture.');
        return;
      }
      setResult(accepted); setSelected([]); setRequest(next);
    } catch {
      if (version === generation.current) setError('The local request could not complete. Accepted evidence is unchanged. Retry the action or reset; no clinical fallback is used.');
    } finally {
      clearTimeout(timer);
      if (version === generation.current) { inFlight.current = false; setBusy(false); }
    }
  }
  function answer(state: Answer['state'], value: Answer['value']) {
    if (!request || !result) return;
    try { void send(appendAnswer(request, result, state, value)); }
    catch { setError('Unsupported answer or no pending question. No evidence was changed.'); }
  }
  function reset() {
    generation.current++; controller.current?.abort(); inFlight.current = false;
    setBusy(false); setRequest(null); setResult(null); setSelected([]); setError(''); setFilter('all');
  }
  function download() {
    if (!result) return;
    const url = URL.createObjectURL(new Blob([exportEvidence(result)], { type: 'application/json' }));
    const link = document.createElement('a'); link.href = url; link.download = 'fictional-model-a-evidence.v1.json'; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  const question = result?.selection.question;
  const handoff = result?.handoff;
  const count = result?.selection.state?.questions_answered ?? 0;
  const finished = result?.selection.status === 'abstained';
  const items = handoff?.items.filter(item => filter === 'all' || item.status === filter) ?? [];
  return <main className="model-a-research" lang="en">
    <header className="model-a-header">
      <div><p className="model-a-eyebrow">APIP / developer research</p><h1>MedAssist question lab</h1></div>
      <div><a href="#/preview/medassist-conversation">Open simple MedAssist conversation</a><br/><a href="#/">Exit research demo</a></div>
    </header>
    <aside className="model-a-notice" aria-label="Research limitations">
      <strong>Fictional research only · Model B not enabled</strong>
      <p>Use the authored software fixtures. Model A selects synthetic evidence questions; their wording is not clinically reviewed for patient use. No diagnosis, severity, triage, treatment or home-care assessment is provided.</p>
      <p>Nothing is saved to an account. Reload clears this interview. Export contains only the accepted fictional coded evidence.</p>
    </aside>
    {error && <p role="alert" className="model-a-error">{error}</p>}
    {!fixtures && error && <M3Button variant="outlined" onClick={() => setAvailabilityVersion(version => version + 1)}>Retry local availability</M3Button>}
    {!request && !result && <section aria-labelledby="fixture-title">
      <h2 id="fixture-title">Start a software fixture</h2><p>No patient records or labels are used. Context and initial evidence are structured, explicitly disclosed fixture values.</p>
      <div className="model-a-actions">{fixtures?.fixtures.map(fixture => <M3Button key={fixture.fixture_id} variant="outlined" disabled={busy}
        onClick={() => void send(fixture.request)}>{fixture.label}</M3Button>)}</div>
      {!fixtures && !error && <p role="status">Checking local model availability…</p>}
    </section>}
    {result && <div className="model-a-columns">
      <section className="model-a-question" aria-labelledby="question-title" aria-busy={busy}>
        <p className="model-a-eyebrow">{count} of 20 follow-up questions answered</p>
        <md-linear-progress value={count / 20} aria-label={`${count} of 20 questions answered`} />
        <h2 id="question-title" ref={heading} tabIndex={-1}>{finished ? 'Questioning stopped' : question?.question_en}</h2>
        {finished ? <p>Reason: {result.selection.reason?.replaceAll('_', ' ')}. Stopping is a research workflow state, not a statement about medical safety.</p>
          : question && <>
            <p>Question {question.evidence_id} · {question.data_type === 'B' ? 'explicit boolean answer' : question.data_type === 'C' ? 'one typed value' : 'a typed set of values'}</p>
            <div className="model-a-actions">
              {question.data_type === 'B' && <><M3Button disabled={busy} onClick={() => answer('confirmed', true)}>Positive · true</M3Button>
                <M3Button variant="outlined" disabled={busy} onClick={() => answer('confirmed', false)}>Negative · false</M3Button></>}
              {question.data_type === 'C' && question.possible_values.map((value, index) => <M3Button key={index} variant="outlined" disabled={busy}
                onClick={() => answer('confirmed', value)}>{JSON.stringify(value)}</M3Button>)}
            </div>
            {question.data_type === 'M' && <fieldset disabled={busy} aria-disabled={busy}>
              <legend>Select explicit encoded values; none selected means an explicit empty set.</legend>
              {question.possible_values.map((value, index) => <M3Checkbox key={index} id={`research-option-${index}`} checked={selected.includes(index)} disabled={busy}
                onChange={checked => setSelected(current => checked ? [...current.filter(i => i !== index), index] : current.filter(i => i !== index))}
                label={JSON.stringify(value)} />)}
              <M3Button disabled={busy} onClick={() => answer('confirmed', selected.map(index => question.possible_values[index]) as Scalar[])}>Confirm set ({selected.length})</M3Button>
            </fieldset>}
            <div className="model-a-actions model-a-secondary">
              <M3Button variant="tonal" disabled={busy} onClick={() => answer('unknown', null)}>UNKNOWN · no value</M3Button>
              <M3Button variant="text" disabled={busy} onClick={() => answer('contradiction', null)}>Declare conflicting answer and stop</M3Button>
            </div>
          </>}
        <p role="status">{busy ? 'Waiting for the verified local ranker…' : question ? 'This pending question is not yet observed evidence.' : 'No further question is selected.'}</p>
        <div className="model-a-actions">
          {request && !finished && <M3Button variant="outlined" disabled={busy} onClick={() => void send(endInterview(request))}>End interview</M3Button>}
          <M3Button variant="text" onClick={reset}>Reset fictional interview</M3Button>
        </div>
      </section>
      <details className="model-a-evidence"><summary>Developer evidence inspector</summary><section aria-labelledby="evidence-title">
        <h2 id="evidence-title">Accepted evidence</h2>
        <p>Contract: model-a-to-b.evidence.v1. Model B: not enabled. Human clinical review: not performed.</p>
        {handoff && <><p>Source context: age {handoff.context.age}, source SEX {handoff.context.source_sex}. Initial evidence: {handoff.initial_evidence_id}.</p>
          <dl className="model-a-counts">{statuses.map(status => <div key={status}><dt>{status.replaceAll('_', ' ')}</dt><dd>{handoff.items.filter(item => item.status === status).length}</dd></div>)}</dl>
          <M3Button variant="outlined" disabled={busy} onClick={download}>Export accepted evidence JSON</M3Button>
          <div className="model-a-filter"><M3Select label="Evidence state filter" value={filter} onChange={setFilter}
            options={[{ value: 'all', label: 'All states' }, ...statuses.map(status => ({ value: status, label: status.replaceAll('_', ' ') }))]} /></div>
          <div className="model-a-table" tabIndex={0} role="region" aria-label="Evidence and provenance">
            <table><thead><tr><th scope="col">Evidence</th><th scope="col">State / value</th><th scope="col">Provenance</th></tr></thead>
              <tbody>{items.map(item => <tr key={item.evidence_id}><th scope="row">{item.evidence_id}</th>
                <td>{item.status.replaceAll('_', ' ')}<br/><code>{JSON.stringify(item.value)}</code></td>
                <td>{item.provenance.source.replaceAll('_', ' ')}{item.provenance.turn !== null && ` · turn ${item.provenance.turn}`}</td></tr>)}</tbody></table>
          </div></>}
      </section></details>
    </div>}
  </main>;
}
