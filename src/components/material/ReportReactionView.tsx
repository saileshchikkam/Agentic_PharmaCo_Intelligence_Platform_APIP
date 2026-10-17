import React, { useState } from 'react';
import { M3Button, M3Card, M3Select, M3TextField } from './core';
import {
  AdrDraft,
  AdrDraftLanguage,
  loadAdrDraft,
  saveAdrDraft,
} from '../../features/adr/draftStorage';

const copy = {
  en: {
    badge: 'Fictional evaluation only',
    preview: 'Saved draft preview',
    title: 'Create a fictional ADR draft',
    intro: 'This first workflow is for fictional software evaluation. Your words are saved in this browser only.',
    notice: 'Do not enter real patient information. This draft is not sent to a hospital, reviewer, or government programme.',
    language: 'Draft language',
    medicine: 'Medicine name',
    medicineHelp: 'Leave blank if unknown. We will keep it unknown.',
    dose: 'Dose or how it was taken',
    doseHelp: 'Optional. Leave blank if unknown.',
    reaction: 'What happened?',
    reactionHelp: 'Describe only what the fictional reporter experienced. Do not add a diagnosis.',
    timing: 'When did it start?',
    timingHelp: 'Optional. Leave blank if unknown.',
    save: 'Save draft in this browser',
    saved: 'Draft saved in this browser.',
    loaded: 'Your saved fictional draft was restored from this browser.',
    savingError: 'The browser could not save this draft. Check available browser storage and try again.',
    loadError: 'The saved draft could not be read. Start a new fictional draft and save it again.',
    revision: 'Saved draft revision',
    unknown: 'Not provided (unknown)',
  },
  te: {
    badge: 'కల్పిత పరీక్ష కోసం మాత్రమే',
    preview: 'సేవ్ చేసిన ముసాయిదా ప్రివ్యూ',
    title: 'కల్పిత ADR ముసాయిదా సృష్టించండి',
    intro: 'ఈ ప్రారంభ వర్క్‌ఫ్లో కల్పిత సాఫ్ట్‌వేర్ పరీక్ష కోసం మాత్రమే. మీ వివరాలు ఈ బ్రౌజర్‌లో మాత్రమే సేవ్ అవుతాయి.',
    notice: 'నిజమైన రోగి వివరాలను నమోదు చేయవద్దు. ఈ ముసాయిదా ఆసుపత్రికి, సమీక్షకుడికి లేదా ప్రభుత్వ కార్యక్రమానికి పంపబడదు.',
    language: 'ముసాయిదా భాష',
    medicine: 'మందు పేరు',
    medicineHelp: 'తెలియకపోతే ఖాళీగా ఉంచండి. తెలియదనే స్థితి అలాగే ఉంటుంది.',
    dose: 'మోతాదు లేదా తీసుకున్న విధానం',
    doseHelp: 'ఐచ్ఛికం. తెలియకపోతే ఖాళీగా ఉంచండి.',
    reaction: 'ఏమి జరిగింది?',
    reactionHelp: 'కల్పిత నివేదకుడు అనుభవించిన విషయాన్ని మాత్రమే వివరించండి. నిర్ధారణను జోడించవద్దు.',
    timing: 'ఇది ఎప్పుడు ప్రారంభమైంది?',
    timingHelp: 'ఐచ్ఛికం. తెలియకపోతే ఖాళీగా ఉంచండి.',
    save: 'ఈ బ్రౌజర్‌లో ముసాయిదా సేవ్ చేయండి',
    saved: 'ముసాయిదా ఈ బ్రౌజర్‌లో సేవ్ అయింది.',
    loaded: 'ఈ బ్రౌజర్‌లో సేవ్ చేసిన కల్పిత ముసాయిదా తిరిగి తెరవబడింది.',
    savingError: 'బ్రౌజర్ ఈ ముసాయిదాను సేవ్ చేయలేకపోయింది. బ్రౌజర్ నిల్వను తనిఖీ చేసి మళ్లీ ప్రయత్నించండి.',
    loadError: 'సేవ్ చేసిన ముసాయిదాను చదవలేకపోయాం. కొత్త కల్పిత ముసాయిదా ప్రారంభించి మళ్లీ సేవ్ చేయండి.',
    revision: 'సేవ్ చేసిన ముసాయిదా సంచిక',
    unknown: 'ఇవ్వలేదు (తెలియదు)',
  },
} satisfies Record<AdrDraftLanguage, Record<string, string>>;

export const ReportReactionView: React.FC = () => {
  const [initialDraft] = useState(() => loadAdrDraft());
  const [language, setLanguage] = useState<AdrDraftLanguage>(initialDraft.draft?.language ?? 'en');
  const [medicineName, setMedicineName] = useState(initialDraft.draft?.statements.medicineName ?? '');
  const [dose, setDose] = useState(initialDraft.draft?.statements.dose ?? '');
  const [reaction, setReaction] = useState(initialDraft.draft?.statements.reaction ?? '');
  const [onset, setOnset] = useState(initialDraft.draft?.statements.onset ?? '');
  const [savedDraft, setSavedDraft] = useState<AdrDraft | null>(initialDraft.draft);
  const [message, setMessage] = useState<string | null>(
    initialDraft.error ? copy.en.loadError : initialDraft.draft ? copy[initialDraft.draft.language].loaded : null,
  );
  const [storageError, setStorageError] = useState(initialDraft.error);
  const text = copy[language];

  const handleSave = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!reaction.trim()) return;

    const timestamp = new Date().toISOString();
    const draft: AdrDraft = {
      schemaVersion: 1,
      id: savedDraft?.id ?? crypto.randomUUID(),
      language,
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
      saveAdrDraft(draft);
      setSavedDraft(draft);
      setStorageError(false);
      setMessage(copy[language].saved);
    } catch {
      setStorageError(true);
      setMessage(copy[language].savingError);
    }
  };

  return (
    <section id="adr-draft-view" className="mx-auto max-w-4xl space-y-6" aria-labelledby="adr-draft-title">
      <header className="space-y-2">
        <span className="m3-label-large inline-flex rounded-full bg-[var(--md-sys-color-secondary-container)] px-3 py-1 text-[var(--md-sys-color-on-secondary-container)]">
          {text.badge}
        </span>
        <h1 id="adr-draft-title" tabIndex={-1} className="m3-headline-small font-normal text-[var(--md-sys-color-on-surface)]">
          {text.title}
        </h1>
        <p className="m3-body-medium text-[var(--md-sys-color-on-surface-variant)]">{text.intro}</p>
      </header>

      <M3Card variant="filled" className="flex items-start gap-3" role="note">
        <span className="material-symbols-outlined mt-0.5 text-[var(--md-sys-color-primary)]" aria-hidden="true">info</span>
        <p className="m3-body-medium text-[var(--md-sys-color-on-surface-variant)]">{text.notice}</p>
      </M3Card>

      <form onSubmit={handleSave} className="space-y-6">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <M3Select
            id="adr-draft-language"
            label={text.language}
            value={language}
            onChange={(value) => setLanguage(value as AdrDraftLanguage)}
            options={[
              { value: 'en', label: 'English' },
              { value: 'te', label: 'తెలుగు' },
            ]}
          />

          <M3TextField
            id="adr-draft-medicine"
            label={text.medicine}
            value={medicineName}
            onChange={(event) => setMedicineName(event.target.value)}
            supportingText={text.medicineHelp}
            maxLength={200}
          />
          <M3TextField
            id="adr-draft-dose"
            label={text.dose}
            value={dose}
            onChange={(event) => setDose(event.target.value)}
            supportingText={text.doseHelp}
            maxLength={200}
          />
          <M3TextField
            id="adr-draft-onset"
            label={text.timing}
            value={onset}
            onChange={(event) => setOnset(event.target.value)}
            supportingText={text.timingHelp}
            maxLength={200}
          />
        </div>

        <M3TextField
          id="adr-draft-reaction"
          label={text.reaction}
          type="textarea"
          rows={5}
          required
          value={reaction}
          onChange={(event) => setReaction(event.target.value)}
          supportingText={text.reactionHelp}
          maxLength={4000}
        />

        <div className="flex flex-wrap items-center gap-4">
          <M3Button type="submit" variant="filled" leadingIcon="save" disabled={!reaction.trim()}>
            {text.save}
          </M3Button>
          {savedDraft && (
            <span className="m3-body-small text-[var(--md-sys-color-on-surface-variant)]">
              {text.revision}: {savedDraft.revision}
            </span>
          )}
        </div>
      </form>

      {message && (
        <p
          className="m3-body-medium rounded-xl bg-[var(--md-sys-color-surface-container)] p-4 text-[var(--md-sys-color-on-surface)]"
          role={storageError ? 'alert' : 'status'}
          aria-live={storageError ? 'assertive' : 'polite'}
        >
          {message}
        </p>
      )}

      {savedDraft && (
        <M3Card variant="outlined" className="space-y-3" ariaLabelledBy="adr-draft-preview-title">
          <h2 id="adr-draft-preview-title" className="m3-title-large">{text.preview}</h2>
          <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div><dt className="m3-label-medium">{text.medicine}</dt><dd className="m3-body-medium">{savedDraft.statements.medicineName ?? text.unknown}</dd></div>
            <div><dt className="m3-label-medium">{text.dose}</dt><dd className="m3-body-medium">{savedDraft.statements.dose ?? text.unknown}</dd></div>
            <div><dt className="m3-label-medium">{text.timing}</dt><dd className="m3-body-medium">{savedDraft.statements.onset ?? text.unknown}</dd></div>
            <div><dt className="m3-label-medium">{text.reaction}</dt><dd className="m3-body-medium whitespace-pre-wrap">{savedDraft.statements.reaction}</dd></div>
          </dl>
        </M3Card>
      )}
    </section>
  );
};
