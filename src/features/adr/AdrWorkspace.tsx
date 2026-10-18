import React, { useEffect, useState } from 'react';
import { M3Button } from '../../components/material/core';
import { ReportReactionView } from '../../components/material/ReportReactionView';
import { accountClient } from '../account/client';
import { useAccount } from '../account/AccountProvider';
import { SharedProfile } from '../account/SharedProfile';
import { navigatePreview } from '../access/navigation';
import type { AdrDraft } from './draftStorage';

interface Props {
  renderNavigation: (onBack: () => void, label: string) => React.ReactNode;
  onExit: () => void;
}
export function AdrWorkspace(props: Props) {
  const account = useAccount();
  return <AccountDrafts key={account.user?.id ?? 'signed-out'} {...props} />;
}
function AccountDrafts({ renderNavigation, onExit }: Props) {
  const { user, ready, error } = useAccount();
  const [browserDemo, setBrowserDemo] = useState(false);
  const [drafts, setDrafts] = useState<AdrDraft[] | null>(null);
  const [failure, setFailure] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const repository = accountClient?.drafts;
  useEffect(() => {
    if (!user || !ready || !repository || browserDemo) return;
    let cancelled = false;
    setDrafts(null); setFailure(false);
    void repository.load(user.id).then(result => { if (!cancelled) setDrafts(result); }, () => { if (!cancelled) setFailure(true); });
    return () => { cancelled = true; };
  }, [user?.id, ready, repository, browserDemo, attempt]);
  if (browserDemo) return <ReportReactionView headerContext={<>
    <p className="access-notice" role="note">Separate browser demo · shared browser storage, not account records. Existing demos are not imported into any account.</p>
    <M3Button variant="text" onClick={() => { if (window.dispatchEvent(new Event('apip:before-navigate', { cancelable: true }))) setBrowserDemo(false); }}>Return to account drafts</M3Button>
  </>} renderNavigation={renderNavigation} onExit={onExit} />;
  if (!ready || error || !user || !repository || !drafts) return <>
    {renderNavigation(onExit, 'Back to previous page')}
    <section className="mx-auto max-w-4xl space-y-5" aria-labelledby="adr-draft-title">
      <h1 id="adr-draft-title" className="m3-headline-small">Your ADR drafts</h1>
      {!ready ? <p role="status">Checking your account…</p> : error ? <p role="alert">{error}</p>
        : !user ? <p>Sign in to save and reopen your own fictional ADR drafts.</p>
        : !repository ? <p>ADR account storage is available in local development. This selected provider is not connected for ADR drafts.</p>
        : failure ? <p role="alert">Your drafts could not be loaded. No browser-storage fallback was used.</p> : <p role="status">Loading your account drafts…</p>}
      {!user && ready && <M3Button onClick={() => navigatePreview('/sign-in/patient?continue=adr-report')}>Sign in for account drafts</M3Button>}
      {failure && <M3Button variant="outlined" onClick={() => setAttempt(v => v + 1)}>Retry loading</M3Button>}
      <M3Button variant="text" onClick={() => setBrowserDemo(true)}>Open separate browser demo</M3Button>
    </section>
  </>;
  return <>
    <ReportReactionView headerContext={<SharedProfile layer="adr" />} initialDrafts={drafts} onSaveDraft={(draft, revision) => repository.save(user.id, draft, revision)}
      onDeleteDraft={draft => repository.remove(user.id, draft)} renderNavigation={renderNavigation} onExit={onExit} />
  </>;
}
