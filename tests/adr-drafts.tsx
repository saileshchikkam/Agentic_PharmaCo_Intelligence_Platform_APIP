import React, { useRef } from 'react';
import { createRoot } from 'react-dom/client';
import '../src/design-system/material-web-imports';
import '../src/index.css';
import '../src/features/access/access.css';
import { ReportReactionView } from '../src/components/material/ReportReactionView';
import type { AdrDraft } from '../src/features/adr/draftStorage';

/** Fictional, page-memory UI fixture only. Real account/database behavior has separate HTTP tests. */
function Fixture() {
  const store = useRef<AdrDraft[]>([]);
  const failNext = useRef(false);
  return <div className="access-app"><main className="access-page-shell" style={{ paddingBlock: 24 }}>
    <p>UI regression fixture · no account or database connection</p>
    <button onClick={() => { failNext.current = true; }}>Fail next save</button>
    <ReportReactionView initialDrafts={[]} renderNavigation={(back, label) => <button onClick={back} aria-label={label}>Back</button>}
      onSaveDraft={async (draft, revision) => {
        await new Promise(resolve => setTimeout(resolve, 250));
        if (failNext.current) { failNext.current = false; throw new Error('Fixture failure'); }
        const existing = store.current.find(item => item.id === draft.id);
        if ((existing?.revision ?? null) !== revision) throw new Error('Fixture conflict');
        const saved = { ...draft, revision: (revision ?? 0) + 1 };
        store.current = [...store.current.filter(item => item.id !== saved.id), saved];
        return structuredClone(saved);
      }}
      onDeleteDraft={async draft => { store.current = store.current.filter(item => item.id !== draft.id); }} />
  </main></div>;
}
createRoot(document.getElementById('root')!).render(<Fixture />);
