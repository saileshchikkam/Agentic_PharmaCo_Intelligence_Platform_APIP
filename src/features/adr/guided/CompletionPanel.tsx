import type { MdDialog } from '@material/web/dialog/dialog';
import { navigatePreview } from '../../access/navigation';
import { useEffect, useRef, useState } from 'react';
import { guidedAccountHeaders } from '../../account/client';
import { M3Button } from '../../../components/material/core';
import type { patientCompleteness } from './completeness';

type Result = ReturnType<typeof patientCompleteness> & {
  available: boolean;
  finalization: { revision: number; finalized_at: string } | null;
};

export function CompletionPanel({
  owner,
  id,
  revision,
  correct,
  onFinalized,
  blocked = false,
}: {
  owner: string;
  id: string;
  revision: number;
  correct: (key: string) => void;
  onFinalized?: (value: boolean) => void;
  blocked?: boolean;
}) {
  const dialog = useRef<MdDialog>(null);
  const key = useRef(crypto.randomUUID());
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    setResult(null);
    setError('');
    void (async () => {
      try {
        const response = await fetch(`/api/account/adr-guided/${id}/completeness`, {
          headers: await guidedAccountHeaders(owner),
          cache: 'no-store',
          signal: controller.signal,
        });
        if (!response.ok) throw Error('Readiness could not be checked. Reload your saved report.');
        const r = await response.json();
        if (r.revision !== revision) throw Error('The saved report changed. Reload before checking readiness.');
        if (!controller.signal.aborted) {
          setResult(r);
          onFinalized?.(!!r.finalization);
        }
      } catch (e) {
        if (!controller.signal.aborted) setError((e as Error).message);
      }
    })();
    return () => controller.abort();
  }, [owner, id, revision]);

  const totalRequired = result ? result.completedRequired.length + result.missingRequired.length : 0;
  const missingItems = result ? [...result.missingRequired, ...result.invalidValues] : [];

  return (
    <section className="adr-completion-panel" aria-label="Report completion">
      <div className="adr-completion-header">
        <div className="adr-completion-title-wrap">
          <span className="material-symbols-outlined adr-completion-icon" aria-hidden="true">
            {result?.finalization ? 'lock' : result?.ready ? 'task_alt' : 'assignment'}
          </span>
          <h2>Prepare your report for finalization</h2>
        </div>
        {result && (
          <div
            className={`adr-completion-status-pill ${
              result.finalization ? 'finalized' : result.ready ? 'ready' : 'incomplete'
            }`}
          >
            <span className="material-symbols-outlined" aria-hidden="true">
              {result.finalization ? 'lock' : result.ready ? 'check_circle' : 'pending'}
            </span>
            <span>
              {result.finalization
                ? `Finalized · Revision ${result.finalization.revision}`
                : `${result.completedRequired.length} of ${totalRequired} required items complete`}
            </span>
          </div>
        )}
      </div>

      {error ? (
        <p className="adr-error" role="alert">{error}</p>
      ) : !result ? (
        <p className="adr-completion-loading" role="status">Checking the saved revision…</p>
      ) : (
        <>
          <div className="adr-completion-checklist-area">
            {missingItems.length > 0 ? (
              <div className="adr-completion-grid" role="list" aria-label="Required items needing review">
                {missingItems.map((x, i) => (
                  <div key={x.key + i} className="adr-completion-item missing" role="listitem">
                    <span className="material-symbols-outlined adr-item-icon" aria-hidden="true">
                      error_outline
                    </span>
                    <div className="adr-item-content">
                      <span className="adr-item-label" title={x.label}>{x.label}</span>
                      <M3Button variant="text" onClick={() => correct(x.key)}>
                        Review step {x.step + 1}
                      </M3Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="adr-completion-all-ready" role="status">
                <span className="material-symbols-outlined" aria-hidden="true">check_circle</span>
                <span>All {totalRequired} required items are complete. Your report is ready to finalize.</span>
              </div>
            )}

            {result.completedRequired.length > 0 && (
              <details className="adr-completion-completed-details">
                <summary>
                  <span>
                    View {result.completedRequired.length} completed required {result.completedRequired.length === 1 ? 'item' : 'items'}
                  </span>
                </summary>
                <div className="adr-completion-grid adr-completion-grid-completed">
                  {result.completedRequired.map((x) => (
                    <div key={x.key} className="adr-completion-item completed">
                      <span className="material-symbols-outlined adr-item-icon" aria-hidden="true">
                        check_circle
                      </span>
                      <div className="adr-item-content">
                        <span className="adr-item-label" title={x.label}>{x.label}</span>
                        <M3Button variant="text" onClick={() => correct(x.key)}>
                          Review step {x.step + 1}
                        </M3Button>
                      </div>
                    </div>
                  ))}
                </div>
              </details>
            )}
          </div>

          <p className="adr-completion-helper">
            {result.finalization
              ? 'This saved revision is finalized. Sharing is a separate consent action.'
              : result.ready
              ? 'Required information is present. This is still an editable, unshared draft.'
              : 'Complete the required information above. Optional unknown answers do not all need to become known.'}
          </p>
        </>
      )}

      <div className="adr-completion-actions">
        <div className="adr-completion-action-buttons">
          {result?.finalization ? (
            <>
              <span className="adr-finalized-notice" role="status">
                <span className="material-symbols-outlined" aria-hidden="true">lock</span>
                FINALIZED · saved revision {result.finalization.revision}. Patient-authored content is locked.
              </span>
              <M3Button
                variant="outlined"
                onClick={() => {
                  navigatePreview(`/patient/adr/cases/${id}`);
                }}
              >
                Send for specialist review
              </M3Button>
            </>
          ) : (
            <M3Button
              variant="filled"
              disabled={!result?.ready || !result.available || busy || blocked}
              onClick={() => dialog.current?.show()}
            >
              Finalize report
            </M3Button>
          )}
        </div>
        <p className="adr-completion-sharing-note">
          {blocked
            ? 'Save or discard the current answer before finalizing.'
            : result?.available
            ? 'Finalization does not share your report.'
            : 'Finalization is not enabled in this environment. Your saved draft is preserved.'}
          {result?.finalization &&
            ' Choose the recipient and explicitly confirm disclosure on the report page. No automatic regulatory submission.'}
        </p>
      </div>

      <md-dialog ref={dialog} aria-labelledby="finalize-title">
        <div slot="headline" id="finalize-title">
          Finalize this saved report?
        </div>
        <div slot="content">
          <p>
            Revision {revision} will become read-only. Future corrections require a separately controlled follow-up; it
            cannot be overwritten. This does not share or submit the report.
          </p>
          {error && <p role="alert">{error}</p>}
        </div>
        <div slot="actions">
          <M3Button disabled={busy} onClick={() => dialog.current?.close()}>
            Cancel
          </M3Button>
          <M3Button
            disabled={busy || blocked}
            onClick={async () => {
              setBusy(true);
              setError('');
              try {
                const response = await fetch(`/api/account/adr-guided/${id}/finalize`, {
                  method: 'POST',
                  headers: {
                    ...(await guidedAccountHeaders(owner)),
                    'Content-Type': 'application/json',
                    'Idempotency-Key': key.current,
                  },
                  signal: AbortSignal.timeout(15000),
                  body: JSON.stringify({ expectedRevision: revision, confirmed: true }),
                });
                const body = await response.json();
                if (!response.ok) throw Error(body.error ?? 'Finalization failed');
                setResult((r) => (r ? { ...r, finalization: body.finalization } : r));
                onFinalized?.(true);
                dialog.current?.close();
              } catch (e) {
                setError((e as Error).message);
              } finally {
                setBusy(false);
              }
            }}
          >
            Confirm finalization
          </M3Button>
        </div>
      </md-dialog>
    </section>
  );
}
