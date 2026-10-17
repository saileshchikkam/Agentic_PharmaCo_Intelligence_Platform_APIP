import React, { useEffect, useRef, useState } from 'react';
import { M3Button, M3Card, M3Checkbox, M3Select, M3TextField } from './core';
import type { AdrDraft, AdrDraftLanguage } from '../../features/adr/draftStorage';
import { loadAdrDrafts, saveAdrDrafts } from '../../features/adr/draftStorage';

const copy = {
  en: {
    badge: 'Fictional evaluation only',
    title: 'Create a fictional ADR draft',
    draftsTitle: 'Your fictional drafts',
    draftsIntro: 'Open a saved draft or start another fictional case.',
    sharedStorage: 'Drafts are saved in this browser profile. Sign-in is only a preview, so drafts are not separated by account and anyone using this browser profile may see them. Do not enter real patient information.',
    newDraft: 'New fictional draft',
    openDraft: 'Open draft',
    savedDrafts: 'Saved drafts',
    draftNumber: 'Draft',
    needsReview: 'Needs your review',
    userConfirmed: 'Confirmed by you · not professionally reviewed',
    backToDrafts: 'Your drafts',
    discardChanges: 'Discard unsaved changes and return to your drafts?',
    backToDetails: 'Back to details',
    reviewTitle: 'Review your draft',
    intro: 'This short preview helps organise a fictional medicine experience. Your words stay separate from any professional assessment.',
    reviewIntro: 'Check that this summary matches what you entered. Unknown details remain unknown.',
    notice: 'Do not enter real patient information. This is a software preview; nothing is sent and no clinical review is provided.',
    language: 'Draft language',
    medicine: 'Medicine name',
    medicineHelp: 'Optional. Leave blank if unknown.',
    dose: 'Dose or how it was taken',
    doseHelp: 'Optional. Leave blank if unknown.',
    reaction: 'What happened?',
    reactionHelp: 'Describe only what the fictional reporter experienced. Do not add a diagnosis.',
    timing: 'When did it start?',
    timingHelp: 'Optional. Leave blank if unknown.',
    review: 'Review draft',
    reporterOrigin: 'Your words',
    unknown: 'Not provided (unknown)',
    confirmLabel: 'I checked this summary and confirm that it reflects only the fictional details I entered.',
    confirmSave: 'Confirm and save draft',
    confirmed: 'You confirmed this summary. It has not been reviewed by a professional.',
    saved: 'Your fictional draft was saved in this browser only. It was not submitted.',
    loaded: 'Your saved fictional draft was restored from this browser.',
    savingError: 'The browser could not save this draft. Check available browser storage and try again.',
    loadError: 'The saved draft could not be read. Start a new fictional draft and save it again.',
    revision: 'Saved draft revision',
    stepDetails: 'Step 1 of 2 · Add details',
    stepReview: 'Step 2 of 2 · Review and confirm',
  },
  te: {
    badge: 'కల్పిత పరీక్ష కోసం మాత్రమే',
    title: 'కల్పిత ADR ముసాయిదా సృష్టించండి',
    draftsTitle: 'మీ కల్పిత ముసాయిదాలు',
    draftsIntro: 'సేవ్ చేసిన ముసాయిదాను తెరవండి లేదా మరొక కల్పిత కేసును ప్రారంభించండి.',
    sharedStorage: 'ముసాయిదాలు ఈ బ్రౌజర్ ప్రొఫైల్‌లో సేవ్ అవుతాయి. సైన్-ఇన్ ఇంకా ప్రివ్యూ మాత్రమే కాబట్టి, ఖాతాల వారీగా వేరు కావు; ఈ బ్రౌజర్‌ను ఉపయోగించే ఇతరులు కూడా వీటిని చూడవచ్చు. నిజమైన రోగి వివరాలను నమోదు చేయవద్దు.',
    newDraft: 'కొత్త కల్పిత ముసాయిదా',
    openDraft: 'ముసాయిదా తెరవండి',
    savedDrafts: 'సేవ్ చేసిన ముసాయిదాలు',
    draftNumber: 'ముసాయిదా',
    needsReview: 'మీ సమీక్ష అవసరం',
    userConfirmed: 'మీరు నిర్ధారించారు · నిపుణుడు సమీక్షించలేదు',
    backToDrafts: 'మీ ముసాయిదాలు',
    discardChanges: 'సేవ్ చేయని మార్పులను వదిలి మీ ముసాయిదాలకు తిరిగి వెళ్లాలా?',
    backToDetails: 'వివరాలకు తిరిగి వెళ్లండి',
    reviewTitle: 'మీ ముసాయిదాను సమీక్షించండి',
    intro: 'ఈ చిన్న ప్రివ్యూ కల్పిత మందు అనుభవాన్ని క్రమబద్ధం చేయడానికి సహాయపడుతుంది. మీ వివరాలు వృత్తిపరమైన అంచనా నుండి వేరుగా ఉంటాయి.',
    reviewIntro: 'ఈ సారాంశం మీరు నమోదు చేసిన వివరాలతో సరిపోతుందో చూడండి. తెలియని వివరాలు అలాగే తెలియనివిగా ఉంటాయి.',
    notice: 'నిజమైన రోగి వివరాలను నమోదు చేయవద్దు. ఇది సాఫ్ట్‌వేర్ ప్రివ్యూ మాత్రమే; ఏదీ పంపబడదు, వైద్య సమీక్ష కూడా లేదు.',
    language: 'ముసాయిదా భాష',
    medicine: 'మందు పేరు',
    medicineHelp: 'ఐచ్ఛికం. తెలియకపోతే ఖాళీగా ఉంచండి.',
    dose: 'మోతాదు లేదా తీసుకున్న విధానం',
    doseHelp: 'ఐచ్ఛికం. తెలియకపోతే ఖాళీగా ఉంచండి.',
    reaction: 'ఏమి జరిగింది?',
    reactionHelp: 'కల్పిత నివేదకుడు అనుభవించిన విషయాన్ని మాత్రమే వివరించండి. నిర్ధారణను జోడించవద్దు.',
    timing: 'ఇది ఎప్పుడు ప్రారంభమైంది?',
    timingHelp: 'ఐచ్ఛికం. తెలియకపోతే ఖాళీగా ఉంచండి.',
    review: 'ముసాయిదాను సమీక్షించండి',
    reporterOrigin: 'మీరు తెలిపిన వివరాలు',
    unknown: 'ఇవ్వలేదు (తెలియదు)',
    confirmLabel: 'ఈ సారాంశాన్ని పరిశీలించాను. నేను నమోదు చేసిన కల్పిత వివరాలనే ఇది చూపిస్తుందని నిర్ధారిస్తున్నాను.',
    confirmSave: 'నిర్ధారించి ముసాయిదాను సేవ్ చేయండి',
    confirmed: 'మీరు ఈ సారాంశాన్ని నిర్ధారించారు. దీనిని నిపుణుడు సమీక్షించలేదు.',
    saved: 'మీ కల్పిత ముసాయిదా ఈ బ్రౌజర్‌లో మాత్రమే సేవ్ అయింది. ఇది సమర్పించబడలేదు.',
    loaded: 'ఈ బ్రౌజర్‌లో సేవ్ చేసిన కల్పిత ముసాయిదా తిరిగి తెరవబడింది.',
    savingError: 'బ్రౌజర్ ఈ ముసాయిదాను సేవ్ చేయలేకపోయింది. బ్రౌజర్ నిల్వను తనిఖీ చేసి మళ్లీ ప్రయత్నించండి.',
    loadError: 'సేవ్ చేసిన ముసాయిదాను చదవలేకపోయాం. కొత్త కల్పిత ముసాయిదా ప్రారంభించి మళ్లీ సేవ్ చేయండి.',
    revision: 'సేవ్ చేసిన ముసాయిదా సంచిక',
    stepDetails: 'దశ 1 / 2 · వివరాలు నమోదు చేయండి',
    stepReview: 'దశ 2 / 2 · సమీక్షించి నిర్ధారించండి',
  },
} satisfies Record<AdrDraftLanguage, Record<string, string>>;

type DraftStep = 'list' | 'edit' | 'review';

export const ReportReactionView: React.FC = () => {
  const [initial] = useState(() => loadAdrDrafts());
  const existingDraft = initial.drafts.length === 1 ? initial.drafts[0] : null;
  const [drafts, setDrafts] = useState<AdrDraft[]>(initial.drafts);
  const [canReturnToList, setCanReturnToList] = useState(initial.drafts.length > 0);
  const [step, setStep] = useState<DraftStep>(initial.drafts.length > 0 ? 'list' : 'edit');
  const [language, setLanguage] = useState<AdrDraftLanguage>(existingDraft?.language ?? 'en');
  const [medicineName, setMedicineName] = useState(existingDraft?.statements.medicineName ?? '');
  const [dose, setDose] = useState(existingDraft?.statements.dose ?? '');
  const [reaction, setReaction] = useState(existingDraft?.statements.reaction ?? '');
  const [onset, setOnset] = useState(existingDraft?.statements.onset ?? '');
  const [confirmationChecked, setConfirmationChecked] = useState(existingDraft?.status === 'user-confirmed');
  const [savedDraft, setSavedDraft] = useState<AdrDraft | null>(existingDraft);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [message, setMessage] = useState<string | null>(
    initial.error ? copy.en.loadError : null,
  );
  const [storageError, setStorageError] = useState(initial.error);
  const heading = useRef<HTMLHeadingElement>(null);
  const text = copy[language];

  useEffect(() => { heading.current?.focus({ preventScroll: true }); }, [step]);

  const handleReview = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!reaction.trim()) {
      document.getElementById('adr-draft-reaction')?.focus();
      return;
    }
    setMessage(null);
    setStorageError(false);
    setConfirmationChecked(false);
    setStep('review');
  };

  const editDetails = () => {
    setStep('edit');
    setConfirmationChecked(false);
    setMessage(null);
    setStorageError(false);
  };

  const openDraft = (draft: AdrDraft) => {
    setSavedDraft(draft);
    setCanReturnToList(true);
    setLanguage(draft.language);
    setMedicineName(draft.statements.medicineName ?? '');
    setDose(draft.statements.dose ?? '');
    setReaction(draft.statements.reaction);
    setOnset(draft.statements.onset ?? '');
    setConfirmationChecked(draft.status === 'user-confirmed');
    setHasUnsavedChanges(false);
    setMessage(copy[draft.language].loaded);
    setStorageError(false);
    setStep(draft.status === 'user-confirmed' ? 'review' : 'edit');
  };

  const startNewDraft = () => {
    setSavedDraft(null);
    setLanguage('en');
    setMedicineName('');
    setDose('');
    setReaction('');
    setOnset('');
    setConfirmationChecked(false);
    setHasUnsavedChanges(false);
    setMessage(null);
    setStorageError(false);
    setStep('edit');
  };

  const showDrafts = () => {
    if (hasUnsavedChanges && !window.confirm(text.discardChanges)) return;
    setMessage(null);
    setStorageError(false);
    setStep('list');
  };

  const confirmAndSave = () => {
    if (!confirmationChecked) return;
    const timestamp = new Date().toISOString();
    const draft: AdrDraft = {
      schemaVersion: 2,
      id: savedDraft?.id ?? crypto.randomUUID(),
      language,
      status: 'user-confirmed',
      confirmedAt: timestamp,
      revision: (savedDraft?.revision ?? 0) + 1,
      createdAt: savedDraft?.createdAt ?? timestamp,
      updatedAt: timestamp,
      statements: {
        source: 'reporter',
        medicineName: medicineName.trim() || null,
        dose: dose.trim() || null,
        reaction: reaction.trim(),
        onset: onset.trim() || null,
      },
    };

    try {
      const existingIndex = drafts.findIndex((item) => item.id === draft.id);
      const nextDrafts = existingIndex === -1
        ? [...drafts, draft]
        : drafts.map((item) => item.id === draft.id ? draft : item);
      saveAdrDrafts(nextDrafts);
      setDrafts(nextDrafts);
      setSavedDraft(draft);
      setCanReturnToList(true);
      setHasUnsavedChanges(false);
      setStorageError(false);
      setMessage(copy[language].saved);
    } catch {
      setStorageError(true);
      setMessage(copy[language].savingError);
    }
  };

  const reviewRows = [
    [text.medicine, medicineName.trim() || text.unknown],
    [text.dose, dose.trim() || text.unknown],
    [text.timing, onset.trim() || text.unknown],
    [text.reaction, reaction.trim() || text.unknown],
  ];

  return (
    <section id="adr-draft-view" className="mx-auto max-w-4xl space-y-6" aria-labelledby="adr-draft-title">
      <header className="space-y-2">
        <span className="m3-label-large inline-flex rounded-full bg-[var(--md-sys-color-secondary-container)] px-3 py-1 text-[var(--md-sys-color-on-secondary-container)]">
          {text.badge}
        </span>
        <h1 id="adr-draft-title" ref={heading} tabIndex={-1} className="m3-headline-small font-normal text-[var(--md-sys-color-on-surface)]">
          {step === 'list' ? text.draftsTitle : step === 'edit' ? text.title : text.reviewTitle}
        </h1>
        <p className="m3-body-medium text-[var(--md-sys-color-on-surface-variant)]">
          {step === 'list' ? text.draftsIntro : step === 'edit' ? text.intro : text.reviewIntro}
        </p>
      </header>

      {step !== 'list' && <div className="adr-draft-progress">
        <span className="m3-label-medium">{step === 'edit' ? text.stepDetails : text.stepReview}</span>
        <md-linear-progress value={step === 'edit' ? 0.5 : 1} aria-label={step === 'edit' ? text.stepDetails : text.stepReview}></md-linear-progress>
      </div>}

      <M3Card variant="filled" className="flex items-start gap-3" role="note">
        <span className="material-symbols-outlined mt-0.5 text-[var(--md-sys-color-primary)]" aria-hidden="true">info</span>
        <p className="m3-body-medium text-[var(--md-sys-color-on-surface-variant)]">{text.notice}</p>
      </M3Card>

      {step === 'list' ? <div className="space-y-4" aria-label={text.draftsTitle}>
        <M3Card variant="filled" className="flex items-start gap-3" role="note">
          <span className="material-symbols-outlined mt-0.5 text-[var(--md-sys-color-primary)]" aria-hidden="true">info</span>
          <p className="m3-body-medium text-[var(--md-sys-color-on-surface-variant)]">{text.sharedStorage}</p>
        </M3Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="m3-title-large">{text.savedDrafts}</h2>
          <M3Button type="button" variant="filled" leadingIcon="add" onClick={startNewDraft}>{text.newDraft}</M3Button>
        </div>
        <ul className="space-y-3">
          {drafts.map((draft, index) => <li key={draft.id}>
            <M3Card variant="outlined" className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <h3 className="m3-title-medium">{text.draftNumber} {index + 1}</h3>
                <p className="m3-body-medium text-[var(--md-sys-color-on-surface-variant)]">
                  {draft.status === 'user-confirmed' ? text.userConfirmed : text.needsReview}
                </p>
                <p className="m3-body-small text-[var(--md-sys-color-on-surface-variant)]">
                  {draft.statements.medicineName ?? text.unknown} · {draft.updatedAt.slice(0, 10)}
                </p>
              </div>
              <M3Button type="button" variant="outlined" trailingIcon="arrow_forward" onClick={() => openDraft(draft)}>{text.openDraft}</M3Button>
            </M3Card>
          </li>)}
        </ul>
      </div> : step === 'edit' ? <form onSubmit={handleReview} className="space-y-6">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <M3Select id="adr-draft-language" label={text.language} value={language}
            onChange={(value) => {
              if (value === 'en' || value === 'te') setLanguage(value);
              setMessage(null);
              setHasUnsavedChanges(true);
            }}
            options={[{ value: 'en', label: 'English' }, { value: 'te', label: 'తెలుగు' }]} />
          <M3TextField id="adr-draft-medicine" label={text.medicine} value={medicineName}
            onChange={(event) => { setMedicineName(event.target.value); setMessage(null); setHasUnsavedChanges(true); }}
            supportingText={text.medicineHelp} maxLength={200} />
          <M3TextField id="adr-draft-dose" label={text.dose} value={dose}
            onChange={(event) => { setDose(event.target.value); setMessage(null); setHasUnsavedChanges(true); }}
            supportingText={text.doseHelp} maxLength={200} />
          <M3TextField id="adr-draft-onset" label={text.timing} value={onset}
            onChange={(event) => { setOnset(event.target.value); setMessage(null); setHasUnsavedChanges(true); }}
            supportingText={text.timingHelp} maxLength={200} />
        </div>

        <M3TextField id="adr-draft-reaction" label={text.reaction} type="textarea" rows={5}
          required value={reaction}
          onChange={(event) => { setReaction(event.target.value); setMessage(null); setHasUnsavedChanges(true); }}
          supportingText={text.reactionHelp} maxLength={4000} />

        <div className="flex flex-wrap items-center gap-4">
          <M3Button type="submit" variant="filled" trailingIcon="arrow_forward" disabled={!reaction.trim()}>
            {text.review}
          </M3Button>
          {canReturnToList && <M3Button type="button" variant="text" leadingIcon="arrow_back" onClick={showDrafts}>{text.backToDrafts}</M3Button>}
          {savedDraft && <span className="m3-body-small text-[var(--md-sys-color-on-surface-variant)]">
            {text.revision}: {savedDraft.revision}
          </span>}
        </div>
      </form> : <div className="space-y-5">
        <M3Card variant="outlined" className="space-y-4" ariaLabelledBy="adr-draft-review-heading">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 id="adr-draft-review-heading" className="m3-title-large">{text.reviewTitle}</h2>
              <p className="m3-body-small mt-1 text-[var(--md-sys-color-on-surface-variant)]">{text.reporterOrigin}</p>
            </div>
            {savedDraft && <span className="m3-label-small text-[var(--md-sys-color-on-surface-variant)]">
              {text.revision}: {savedDraft.revision}
            </span>}
          </div>
          <dl className="adr-review-rows">
            {reviewRows.map(([label, value]) => <div key={label} className="adr-review-row">
              <dt className="m3-label-medium">{label}</dt>
              <dd className="m3-body-medium whitespace-pre-wrap">{value}</dd>
            </div>)}
          </dl>
        </M3Card>

        {savedDraft?.status === 'user-confirmed' && !hasUnsavedChanges && <p className="m3-body-small rounded-xl bg-[var(--md-sys-color-surface-container)] p-4 text-[var(--md-sys-color-on-surface-variant)]" role="note">
          {text.confirmed}
        </p>}

        <M3Checkbox id="adr-draft-confirm" checked={confirmationChecked} onChange={setConfirmationChecked}
          label={text.confirmLabel} />
        <div className="flex flex-wrap items-center gap-3">
          <M3Button type="button" variant="outlined" leadingIcon="arrow_back" onClick={editDetails}>{text.backToDetails}</M3Button>
          <M3Button type="button" variant="filled" leadingIcon="check" disabled={!confirmationChecked} onClick={confirmAndSave}>
            {text.confirmSave}
          </M3Button>
        </div>
        {savedDraft?.status === 'user-confirmed' && !hasUnsavedChanges && <div className="flex flex-wrap gap-3">
          <M3Button type="button" variant="text" leadingIcon="folder_open" onClick={showDrafts}>{text.backToDrafts}</M3Button>
          <M3Button type="button" variant="tonal" leadingIcon="add" onClick={startNewDraft}>{text.newDraft}</M3Button>
        </div>}
      </div>}

      {message && <p className="m3-body-medium rounded-xl bg-[var(--md-sys-color-surface-container)] p-4 text-[var(--md-sys-color-on-surface)]"
        role={storageError ? 'alert' : 'status'} aria-live={storageError ? 'assertive' : 'polite'}>
        {message}
      </p>}
    </section>
  );
};
