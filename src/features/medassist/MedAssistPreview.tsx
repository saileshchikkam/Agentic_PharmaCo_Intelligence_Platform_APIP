import React, { useEffect, useRef, useState } from 'react';
import { M3Button, M3Checkbox, M3Chip, M3TextField } from '../../components/material/core';
import { emptyAnswers, hospitalSearchUrl, labels, prompts, readSuggestions, steps } from './flow';
import type { Answers, Field, Language } from './flow';
import { copy } from './copy';
import './medassist.css';

export function MedAssistPreview({ onOpenAdr, onExit, renderNavigation }: {
  onOpenAdr: () => void; onExit: () => void;
  renderNavigation: (onBack: () => void, label: string) => React.ReactNode;
}) {
  const [language, setLanguage] = useState<Language>('en');
  const [answers, setAnswers] = useState<Answers>(emptyAnswers);
  const [index, setIndex] = useState(0);
  const [review, setReview] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const [consent, setConsent] = useState(false);
  const [suggestions, setSuggestions] = useState<ReturnType<typeof readSuggestions>>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [resetOpen, setResetOpen] = useState(false);
  const [resetVersion, setResetVersion] = useState(0);
  const [location, setLocation] = useState('');
  const [locating, setLocating] = useState(false);
  const [locationStatus, setLocationStatus] = useState('');
  const request = useRef<AbortController | null>(null);
  const generation = useRef(0);
  const geoGeneration = useRef(0);
  const log = useRef<HTMLDivElement>(null);
  const opening = useRef(true);
  const t = copy[language];
  const field = steps[index];
  const mapUrl = hospitalSearchUrl(location);
  const hasAnswers = !!draft || Object.values(answers).some((value) => value !== null);

  useEffect(() => () => { generation.current++; geoGeneration.current++; request.current?.abort(); }, []);
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      if (opening.current) {
        opening.current = false;
        document.getElementById('medassist-title')?.focus({ preventScroll: true });
        window.scrollTo({ top: 0, behavior: 'auto' });
        return;
      }
      document.getElementById(review ? 'medassist-review-title' : 'medassist-message')?.focus({ preventScroll: true });
      if (log.current) log.current.scrollTop = log.current.scrollHeight;
    });
    return () => cancelAnimationFrame(frame);
  }, [index, review, resetVersion]);
  useEffect(() => {
    if (!hasAnswers) return;
    const guard = (event: Event) => { if (!window.confirm(t.leave)) event.preventDefault(); };
    const unload = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ''; };
    window.addEventListener('apip:before-navigate', guard);
    window.addEventListener('beforeunload', unload);
    return () => { window.removeEventListener('apip:before-navigate', guard); window.removeEventListener('beforeunload', unload); };
  }, [hasAnswers, t.leave]);

  const cancel = () => { generation.current++; request.current?.abort(); setBusy(false); };
  const clearAi = () => { cancel(); setSuggestions(null); setConfirmed(false); setError(''); setConsent(false); };
  const answer = (value: string | null) => {
    clearAi(); setAnswers((current) => ({ ...current, [field]: value })); setDraft('');
    if (editing || index === steps.length - 1) { setReview(true); setEditing(false); }
    else setIndex(index + 1);
  };
  const edit = (item: Field) => {
    clearAi(); setIndex(steps.indexOf(item)); setDraft(answers[item] ?? ''); setEditing(true); setReview(false);
  };
  const reset = () => {
    opening.current = true;
    clearAi(); setAnswers(emptyAnswers()); setIndex(0); setReview(false); setEditing(false); setDraft(''); setResetOpen(false);
    setResetVersion((version) => version + 1);
  };
  const back = () => {
    if (review) { edit('changes'); return; }
    if (!editing && index === 0) { onExit(); return; }
    if (draft.trim() && draft !== answers[field] && !window.confirm(t.discard)) return;
    setDraft('');
    if (editing) { setReview(true); setEditing(false); }
    else { setIndex(index - 1); setDraft(answers[steps[index - 1]] ?? ''); }
  };
  const analyse = async () => {
    if (!consent || busy) return;
    const id = ++generation.current;
    const controller = new AbortController();
    request.current = controller;
    const timer = setTimeout(() => controller.abort(), 65000);
    setBusy(true); setError(''); setSuggestions(null); setConfirmed(false);
    try {
      const response = await fetch('/api/medassist/structure', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: controller.signal,
        body: JSON.stringify({ fictionalOnly: true, language, answers }),
      });
      const data = await response.json();
      if (id !== generation.current) return;
      if (!response.ok) {
        const code = data.error?.code;
        setError(code === 'LOCAL_ONLY' ? t.localOnly : ['MODEL_BUSY', 'RATE_LIMITED'].includes(code) ? t.limited
          : code === 'INVALID_MODEL_OUTPUT' ? t.invalid : t.failure);
        return;
      }
      const accepted = readSuggestions(data, answers);
      if (!accepted) { setError(t.invalid); return; }
      setSuggestions(accepted);
    } catch { if (id === generation.current) setError(t.failure); }
    finally { clearTimeout(timer); if (id === generation.current) setBusy(false); }
  };
  const locate = () => {
    const id = ++geoGeneration.current;
    if (!navigator.geolocation) { setLocationStatus(t.locationFailed); return; }
    setLocating(true); setLocationStatus('');
    navigator.geolocation.getCurrentPosition((position) => {
      if (id !== geoGeneration.current) return;
      setLocation(`${position.coords.latitude.toFixed(3)},${position.coords.longitude.toFixed(3)}`);
      setLocationStatus(t.locationReady); setLocating(false);
    }, () => {
      if (id !== geoGeneration.current) return;
      setLocationStatus(t.locationFailed); setLocating(false);
    }, { enableHighAccuracy: false, timeout: 10000, maximumAge: 0 });
  };

  const backLabel = language === 'en' ? (review ? 'Back to the last question' : editing ? 'Back to review' : 'Previous question or page')
    : (review ? 'చివరి ప్రశ్నకు తిరిగి వెళ్ళు' : editing ? 'సమీక్షకు తిరిగి వెళ్ళు' : 'మునుపటి ప్రశ్న లేదా పేజీ');
  return <>{renderNavigation(back, backLabel)}
  <section className="medassist-preview" lang={language} aria-labelledby="medassist-title">
    <div className="medassist-preview-topline">
      <a href="#medassist-care" className="access-text-link" onClick={(event) => {
        event.preventDefault(); document.getElementById('medassist-care')?.focus(); document.getElementById('medassist-care')?.scrollIntoView({ block: 'start' });
      }}>{t.care}<span className="material-symbols-outlined" aria-hidden="true">location_on</span></a>
      <div className="medassist-language" role="group" aria-label={t.language}>
        <span>{t.language}</span>
        <M3Chip type="filter" label="English" selected={language === 'en'} disabled={busy} onClick={() => setLanguage('en')} />
        <M3Chip type="filter" label="తెలుగు" selected={language === 'te'} disabled={busy} onClick={() => setLanguage('te')} />
      </div>
    </div>
    <header className="medassist-heading">
      <span className="medassist-preview-badge">{t.badge}</span><p className="access-eyebrow">MedAssist AI</p>
      <h1 id="medassist-title" tabIndex={-1}>{t.title}</h1><p>{t.intro}</p>
    </header>
    <div className="medassist-preview-notice" role="note"><span className="material-symbols-outlined" aria-hidden="true">info</span><p>{t.notice}</p></div>

    {!review && <>
      <div ref={log} className="medassist-conversation" role="log" aria-label={language === 'en' ? 'Symptom conversation' : 'లక్షణాల సంభాషణ'}>
        <p className="medassist-empty-hint">{t.welcome}</p>
        {steps.slice(0, index).map((item) => <React.Fragment key={item}>
          <div className="medassist-message medassist-message-assistant"><p>{prompts[language][item]}</p></div>
          <div className="medassist-message medassist-message-patient"><p>{answers[item] ?? t.unknownValue}</p></div>
        </React.Fragment>)}
        <div className="medassist-message medassist-message-assistant"><p>{prompts[language][field]}</p></div>
      </div>
      <form className="medassist-composer" onSubmit={(event) => { event.preventDefault(); if (draft.trim()) answer(draft); }}>
        <p className="medassist-step">{index + 1} / {steps.length} · {labels[language][field]}</p>
        <M3TextField id="medassist-message" label={t.answer} type="textarea" rows={3} value={draft} maxLength={1200}
          onChange={(event) => setDraft(event.target.value)} />
        <div className="medassist-composer-footer"><span>{t.helper}</span><div className="medassist-actions">
          {index > 0 && <M3Button variant="text" onClick={() => answer(null)}>{t.unknown}</M3Button>}
          <M3Button type="submit" trailingIcon="arrow_forward" disabled={!draft.trim()}>{editing || index === 3 ? t.reviewAction : t.next}</M3Button>
        </div></div>
      </form>
    </>}

    {review && <section className="medassist-review" aria-labelledby="medassist-review-title">
      <h2 id="medassist-review-title" tabIndex={-1}>{t.review}</h2><p>{t.reviewIntro}</p>
      <dl className="medassist-summary">{steps.map((item) => <div key={item}>
        <dt>{labels[language][item]}</dt><dd>{answers[item] ?? t.unknownValue}</dd>
        <M3Button variant="text" ariaLabel={`${t.edit}: ${labels[language][item]}`} disabled={busy} onClick={() => edit(item)}>{t.edit}</M3Button>
      </div>)}</dl>
      <div className="medassist-ai-controls">
        <M3Checkbox id="medassist-fictional-consent" label={t.consent} checked={consent} disabled={busy} onChange={setConsent} />
        <div className="medassist-actions"><M3Button variant="tonal" disabled={!consent || busy} leadingIcon="auto_awesome" onClick={analyse}>{t.suggest}</M3Button>
          {busy && <M3Button variant="text" onClick={cancel}>{t.cancel}</M3Button>}</div>
        <p role="status" className="medassist-status">{busy ? t.busy : ''}</p>
        {error && <p role="alert" className="medassist-error">{error}</p>}
      </div>
      {suggestions && <section className="medassist-suggestions" aria-labelledby="medassist-suggestions-title">
        <h3 id="medassist-suggestions-title">{t.suggestions}</h3><p>{confirmed ? t.confirmed : t.unconfirmed}</p>
        <dl>{steps.map((item) => <div key={item}><dt>{labels[language][item]}</dt><dd>{suggestions.quotes[item] ?? t.unknownValue}</dd></div>)}</dl>
        <p className="medassist-model">{t.model}: {suggestions.model}</p>
        {!confirmed && <M3Button variant="outlined" leadingIcon="check" onClick={() => setConfirmed(true)}>{t.confirm}</M3Button>}
      </section>}
      <div className="medassist-assessment"><span className="material-symbols-outlined" aria-hidden="true">pending</span><div><h3>{t.assessment}</h3><p>{t.assessmentDetail}</p></div></div>
    </section>}

    <section id="medassist-care" className="medassist-care" tabIndex={-1} aria-labelledby="medassist-care-title">
      <h2 id="medassist-care-title">{t.care}</h2><p>{t.careIntro}</p>
      <M3TextField id="medassist-location" label={t.locality} value={location} maxLength={180} onChange={(event) => {
        geoGeneration.current++; setLocating(false); setLocation(event.target.value); setLocationStatus('');
      }} />
      <div className="medassist-actions"><M3Button variant="text" leadingIcon="my_location" disabled={locating} onClick={locate}>{locating ? t.locating : t.locate}</M3Button>
        {location && <M3Button variant="text" onClick={() => { geoGeneration.current++; setLocation(''); setLocationStatus(''); setLocating(false); }}>{t.clear}</M3Button>}</div>
      <p role="status" className="medassist-status">{locationStatus}</p>
      {mapUrl && <a className="medassist-maps-link" href={mapUrl} target="_blank" rel="noopener noreferrer" referrerPolicy="no-referrer">{t.maps}<span className="material-symbols-outlined" aria-hidden="true">open_in_new</span></a>}
      <p className="medassist-privacy">{t.mapsPrivacy}</p>
    </section>
    {hasAnswers && <div className="medassist-reset"><M3Button variant="text" leadingIcon="add_comment" onClick={() => setResetOpen(true)}>{t.restart}</M3Button>
      {resetOpen && <div className="medassist-reset-confirm" role="alert"><p>{t.resetPrompt}</p><div className="medassist-actions"><M3Button variant="text" onClick={() => setResetOpen(false)}>{t.cancel}</M3Button><M3Button variant="outlined" onClick={reset}>{t.resetConfirm}</M3Button></div></div>}</div>}
    <aside className="medassist-adr-link"><div><h2>{t.report}</h2><p>{t.reportIntro}</p></div><M3Button variant="outlined" trailingIcon="arrow_forward" onClick={onOpenAdr}>{t.openAdr}</M3Button></aside>
  </section></>;
}
