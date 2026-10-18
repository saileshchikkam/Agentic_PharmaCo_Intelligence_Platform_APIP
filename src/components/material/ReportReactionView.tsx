import React, { useEffect, useRef, useState } from 'react';
import { M3Button, M3Card, M3Checkbox, M3TextField } from './core';
import type { AdrDraft } from '../../features/adr/draftStorage';
import { loadAdrDrafts, saveAdrDrafts } from '../../features/adr/draftStorage';

const copy = {
  en: {
    badge: 'Fictional evaluation only',
    title: 'Create a fictional ADR draft',
    draftsTitle: 'Your fictional drafts',
    draftsIntro: 'Open a saved draft or start another fictional case.',
    sharedStorage: 'Drafts are saved in this browser profile. These preview drafts are not separated by account and anyone using this browser profile may see them. Do not enter real patient information.',
    newDraft: 'New fictional draft',
    openDraft: 'Open draft',
    deleteDraft: 'Delete',
    deleteDraftLabel: 'Delete draft',
    noSavedDrafts: 'No saved drafts',
    noSavedDraftsDescription: 'Drafts you save in this browser will appear here.',
    confirmDeleteTitle: 'Delete this saved draft?',
    confirmDeleteDescription: 'This fictional draft will be removed from this browser. This action cannot be undone.',
    cancelDelete: 'Cancel',
    confirmDelete: 'Delete draft',
    deleted: 'The fictional draft was deleted from this browser.',
    deleteError: 'The browser could not update the saved drafts. The draft was not deleted.',
    savedDrafts: 'Saved drafts',
    draftNumber: 'Draft',
    needsReview: 'Needs your review',
    userConfirmed: 'Confirmed by you · not professionally reviewed',
    backToDrafts: 'Your drafts',
    discardChanges: 'Discard unsaved changes and return to your drafts?',
    leaveChanges: 'Leave this draft? Unsaved changes will be lost.',
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
} satisfies Record<'en', Record<string, string>>;

type DraftStep = 'list' | 'edit' | 'review';

interface Props {
  renderNavigation?: (onBack: () => void, label: string) => React.ReactNode;
  onExit?: () => void;
  initialDrafts?: AdrDraft[];
  onSaveDraft?: (draft: AdrDraft, expectedRevision: number | null) => Promise<AdrDraft>;
  onDeleteDraft?: (draft: AdrDraft) => Promise<void>;
  headerContext?: React.ReactNode;
}

export const ReportReactionView: React.FC<Props> = ({ renderNavigation, onExit, initialDrafts, onSaveDraft, onDeleteDraft, headerContext }) => {
  const accountMode = !!onSaveDraft;
  const [initial] = useState(() => initialDrafts ? { drafts: initialDrafts, error: false } : loadAdrDrafts());
  const existingDraft = initial.drafts.length === 1 ? initial.drafts[0] : null;
  const [drafts, setDrafts] = useState<AdrDraft[]>(initial.drafts);
  const [canReturnToList, setCanReturnToList] = useState(accountMode || initial.drafts.length > 0);
  const [step, setStep] = useState<DraftStep>(accountMode || initial.drafts.length > 0 ? 'list' : 'edit');
  const language = 'en' as const;
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
  const [draftPendingDeletion, setDraftPendingDeletion] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const pendingId = useRef(existingDraft?.id ?? crypto.randomUUID());
  const alive = useRef(true);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
  const heading = useRef<HTMLHeadingElement>(null);
  const deleteDialog = useRef<HTMLDialogElement>(null);
  const text = accountMode ? { ...copy.en,
    draftsTitle: 'Your ADR drafts',
    sharedStorage: 'These fictional drafts are saved to your local account on this computer. Other APIP accounts cannot access them. They are not submitted or professionally reviewed.',
    notice: 'Use fictional details only. Saving stores this draft in your local account; nothing is submitted to a hospital, regulator or AI provider.',
    confirmDeleteDescription: 'This fictional draft will be removed from your local account. This cannot be undone.',
    noSavedDraftsDescription: 'Drafts saved to your account will appear here.',
    loaded: 'Your saved account draft is open.', saved: 'Draft saved to your local account. It was not submitted.',
    deleted: 'The fictional draft was deleted from your local account.',
    savingError: 'Not saved. Your edits are still here. Check your connection; if another tab changed the draft, copy your edits before reopening it.',
    deleteError: 'Deletion failed or the draft changed in another tab. Nothing was removed from this list.',
  } : copy[language];

  useEffect(() => { window.scrollTo({ top: 0, behavior: 'auto' }); heading.current?.focus({ preventScroll: true }); }, [step]);
  useEffect(() => {
    if (!hasUnsavedChanges && !busy) return;
    const guard = (event: Event) => { if (busy || !window.confirm(text.leaveChanges)) event.preventDefault(); };
    const unloading = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ''; };
    window.addEventListener('apip:before-navigate', guard);
    window.addEventListener('beforeunload', unloading);
    return () => { window.removeEventListener('apip:before-navigate', guard); window.removeEventListener('beforeunload', unloading); };
  }, [hasUnsavedChanges, busy, text.leaveChanges]);

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
    if (busy) return;
    setStep('edit');
    setConfirmationChecked(false);
    setMessage(null);
    setStorageError(false);
  };

  const openDraft = (draft: AdrDraft) => {
    if (busy) return;
    pendingId.current = draft.id;
    setSavedDraft(draft);
    setCanReturnToList(true);
    setMedicineName(draft.statements.medicineName ?? '');
    setDose(draft.statements.dose ?? '');
    setReaction(draft.statements.reaction);
    setOnset(draft.statements.onset ?? '');
    setConfirmationChecked(draft.status === 'user-confirmed');
    setHasUnsavedChanges(false);
    setMessage(text.loaded);
    setStorageError(false);
    setStep(draft.status === 'user-confirmed' ? 'review' : 'edit');
  };

  const startNewDraft = () => {
    if (busy) return;
    pendingId.current = crypto.randomUUID();
    setSavedDraft(null);
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
    if (busy) return;
    if (hasUnsavedChanges && !window.confirm(text.discardChanges)) return;
    setHasUnsavedChanges(false);
    setMessage(null);
    setStorageError(false);
    setStep('list');
  };

  const requestDraftDeletion = (draft: AdrDraft) => {
    if (busy) return;
    setMessage(null);
    setStorageError(false);
    setDraftPendingDeletion(draft.id);
    deleteDialog.current?.showModal();
  };

  const finishDraftDeletion = async () => {
    if (!draftPendingDeletion || busy) return;
    const target = drafts.find(draft => draft.id === draftPendingDeletion);
    if (!target) return;
    const nextDrafts = drafts.filter(draft => draft.id !== target.id);
    setBusy(true);
    try {
      if (onDeleteDraft) await onDeleteDraft(target); else saveAdrDrafts(nextDrafts);
      if (!alive.current) return;
      setDrafts(nextDrafts); setMessage(text.deleted); setStorageError(false);
      deleteDialog.current?.close(); setDraftPendingDeletion(null);
      requestAnimationFrame(() => (document.querySelector<HTMLElement>('.adr-draft-open') ?? document.getElementById('adr-new-draft'))?.focus());
    } catch {
      if (!alive.current) return;
      setStorageError(true); setMessage(text.deleteError);
    } finally { if (alive.current) setBusy(false); }
  };

  const cancelDraftDeletion = () => {
    if (busy) return;
    const previousDraftId = draftPendingDeletion;
    deleteDialog.current?.close();
    setDraftPendingDeletion(null);
    if (previousDraftId) {
      window.requestAnimationFrame(() => document.getElementById(`adr-delete-${previousDraftId}`)?.focus());
    }
  };

  const persistDraft = async (status: 'draft' | 'user-confirmed') => {
    if (busy || (status === 'user-confirmed' && !confirmationChecked)) return;
    setBusy(true);
    const timestamp = new Date().toISOString();
    let draft: AdrDraft = { schemaVersion: 2, id: savedDraft?.id ?? pendingId.current,
      language, status, confirmedAt: status === 'user-confirmed' ? timestamp : null,
      revision: (savedDraft?.revision ?? 0) + 1, createdAt: savedDraft?.createdAt ?? timestamp, updatedAt: timestamp,
      statements: { source: 'reporter', medicineName: medicineName.trim() ? medicineName : null,
        dose: dose.trim() ? dose : null, reaction, onset: onset.trim() ? onset : null } };
    try {
      if (onSaveDraft) draft = await onSaveDraft(draft, savedDraft?.revision ?? null);
      if (!alive.current) return;
      const nextDrafts = drafts.some(item => item.id === draft.id)
        ? drafts.map(item => item.id === draft.id ? draft : item) : [...drafts, draft];
      if (!onSaveDraft) saveAdrDrafts(nextDrafts);
      setDrafts(nextDrafts); setSavedDraft(draft); setCanReturnToList(true);
      setHasUnsavedChanges(false); setStorageError(false);
      setMessage(status === 'draft' ? 'Unfinished fictional draft saved to your account. Review and confirm it later.' : text.saved);
    } catch {
      if (!alive.current) return;
      setStorageError(true); setMessage(text.savingError);
    } finally { if (alive.current) setBusy(false); }
  };
  const confirmAndSave = () => void persistDraft('user-confirmed');

  const reviewRows = [
    [text.medicine, medicineName.trim() ? medicineName : text.unknown],
    [text.dose, dose.trim() ? dose : text.unknown],
    [text.timing, onset.trim() ? onset : text.unknown],
    [text.reaction, reaction.trim() ? reaction : text.unknown],
  ];

  const back = step === 'review' ? editDetails : step === 'edit' && canReturnToList ? showDrafts : onExit;
  const backLabel = step === 'review' ? text.backToDetails : step === 'edit' && canReturnToList ? text.backToDrafts : 'Back to previous page';

  return (<>
    {renderNavigation && back && renderNavigation(() => { if (!busy) back(); }, backLabel)}
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

      {headerContext}

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
          <M3Button id="adr-new-draft" type="button" variant="filled" leadingIcon="add" onClick={startNewDraft}>{text.newDraft}</M3Button>
        </div>
        <ul className="space-y-3">
          {drafts.length === 0 && <li>
            <M3Card variant="filled" className="adr-empty-drafts" role="status">
              <span className="material-symbols-outlined" aria-hidden="true">folder_open</span>
              <div><h3 className="m3-title-medium">{text.noSavedDrafts}</h3><p className="m3-body-medium">{text.noSavedDraftsDescription}</p></div>
            </M3Card>
          </li>}
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
              <div className="flex flex-wrap items-center gap-2">
                <M3Button id={`adr-open-${draft.id}`} className="adr-draft-open" type="button" variant="outlined" trailingIcon="arrow_forward" onClick={() => openDraft(draft)}>{text.openDraft}</M3Button>
                <M3Button id={`adr-delete-${draft.id}`} type="button" variant="text" leadingIcon="delete" ariaLabel={`${text.deleteDraftLabel} ${index + 1}`} onClick={() => requestDraftDeletion(draft)}>{text.deleteDraft}</M3Button>
              </div>
            </M3Card>
          </li>)}
        </ul>
        <dialog ref={deleteDialog} className="adr-delete-dialog" aria-labelledby="adr-delete-title" aria-describedby="adr-delete-description"
          onCancel={(event) => { event.preventDefault(); cancelDraftDeletion(); }}>
          <div className="adr-delete-dialog-icon" aria-hidden="true"><span className="material-symbols-outlined">delete</span></div>
          <h2 id="adr-delete-title">{text.confirmDeleteTitle}</h2>
          <p id="adr-delete-description">{text.confirmDeleteDescription}</p>
          {storageError && message && <p className="adr-delete-error" role="alert">{message}</p>}
          <div className="adr-delete-dialog-actions">
            <M3Button type="button" variant="text" disabled={busy} onClick={cancelDraftDeletion}>{text.cancelDelete}</M3Button>
            <M3Button type="button" variant="filled" leadingIcon="delete" loading={busy} onClick={() => void finishDraftDeletion()}>{text.confirmDelete}</M3Button>
          </div>
        </dialog>
      </div> : step === 'edit' ? <form onSubmit={handleReview} className="space-y-6">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <M3TextField disabled={busy} id="adr-draft-medicine" label={text.medicine} value={medicineName}
            onChange={(event) => { setMedicineName(event.target.value); setMessage(null); setHasUnsavedChanges(true); }}
            supportingText={text.medicineHelp} maxLength={200} />
          <M3TextField disabled={busy} id="adr-draft-dose" label={text.dose} value={dose}
            onChange={(event) => { setDose(event.target.value); setMessage(null); setHasUnsavedChanges(true); }}
            supportingText={text.doseHelp} maxLength={200} />
          <M3TextField disabled={busy} id="adr-draft-onset" label={text.timing} value={onset}
            onChange={(event) => { setOnset(event.target.value); setMessage(null); setHasUnsavedChanges(true); }}
            supportingText={text.timingHelp} maxLength={200} />
        </div>

        <M3TextField disabled={busy} id="adr-draft-reaction" label={text.reaction} type="textarea" rows={5}
          required value={reaction}
          onChange={(event) => { setReaction(event.target.value); setMessage(null); setHasUnsavedChanges(true); }}
          supportingText={text.reactionHelp} maxLength={4000} />

        <div className="flex flex-wrap items-center gap-4">
          <M3Button type="submit" variant="filled" trailingIcon="arrow_forward" disabled={busy || !reaction.trim()}>
            {text.review}
          </M3Button>
          {accountMode && <M3Button variant="outlined" loading={busy} onClick={() => void persistDraft('draft')}>Save unfinished draft</M3Button>}
          {!renderNavigation && canReturnToList && <M3Button type="button" variant="text" leadingIcon="arrow_back" onClick={showDrafts}>{text.backToDrafts}</M3Button>}
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

        <M3Checkbox disabled={busy} id="adr-draft-confirm" checked={confirmationChecked} onChange={setConfirmationChecked}
          label={text.confirmLabel} />
        <div className="flex flex-wrap items-center gap-3">
          {!renderNavigation && <M3Button type="button" variant="outlined" leadingIcon="arrow_back" onClick={editDetails}>{text.backToDetails}</M3Button>}
          <M3Button type="button" variant="filled" leadingIcon="check" loading={busy} disabled={!confirmationChecked || (!hasUnsavedChanges && savedDraft?.status === 'user-confirmed')} onClick={confirmAndSave}>
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
  </>);
};
