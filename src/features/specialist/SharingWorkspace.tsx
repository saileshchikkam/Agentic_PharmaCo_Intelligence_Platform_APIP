import { FormPage } from '../adr/guided/LiveFormPreview';
import { navigatePreview } from '../access/navigation';
import { useEffect, useRef, useState } from 'react';
import { M3Button, M3Checkbox, M3Select, M3Radio } from '../../components/material/core';
import { useAccount } from '../account/AccountProvider';
import { guidedAccountHeaders } from '../account/client';

export async function sharingRequest(
  owner: string,
  path: string,
  body?: unknown,
  key?: string,
  signal?: AbortSignal
) {
  let headers: Record<string, string>;
  try {
    headers = {
      ...(await guidedAccountHeaders(owner)),
      ...(key ? { 'Idempotency-Key': key } : {}),
    };
  } catch (e) {
    const code = e instanceof Error && e.message ? e.message : 'SIGN_IN_REQUIRED';
    throw Object.assign(
      new Error(
        code === 'SIGN_IN_REQUIRED'
          ? 'Your session has ended. Please sign in again.'
          : `Sharing request failed (${code}). Refresh and retry.`
      ),
      { code }
    );
  }
  const r = await fetch(
    (import.meta.env.VITE_APIP_SHARING_FIXTURE === '1' ? '/api/account/sharing-fixture' : '/api/sharing') + path,
    {
      method: body === undefined ? 'GET' : 'POST',
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      cache: 'no-store',
      signal,
    }
  );
  if (!r.ok) {
    const value = await r.json().catch(() => ({}));
    const rawErr = typeof value.error === 'string' ? value.error : undefined;
    const code =
      rawErr === 'SIGN_IN_REQUIRED' || r.status === 401
        ? 'SIGN_IN_REQUIRED'
        : rawErr === 'FORBIDDEN' || r.status === 403
          ? 'FORBIDDEN'
          : rawErr;
    throw Object.assign(
      new Error(
        code === 'SIGN_IN_REQUIRED'
          ? 'Your session has ended. Please sign in again.'
          : rawErr === 'SHARING_NOT_ENABLED'
          ? 'Secure sharing is awaiting database activation. Your report remains private.'
          : rawErr === 'POOL_MIGRATION_REQUIRED' || rawErr === 'POOL_SQLITE_FORBIDDEN_IN_CLOUD'
          ? 'Shared specialist review queue requires a pending database migration. Direct specialist assignments remain active.'
          : rawErr === 'NOT_FOUND'
          ? 'This assignment is unavailable or access has ended.'
          : rawErr === 'INTAKE_INCOMPLETE'
          ? 'Complete the required reporting questions before sharing.'
          : rawErr === 'CONFLICT_OF_INTEREST'
          ? 'Self-assignment is prohibited. You cannot claim your own reported case.'
          : rawErr === 'ACTIVE_ASSIGNMENT_CONFLICT'
          ? 'This case was claimed by another reviewer or is no longer available in the queue.'
          : code === 'FORBIDDEN'
          ? 'Access restricted. Current active specialist authorization is required.'
          : rawErr === 'PDF_TEMPLATE_MISSING' ||
              rawErr === 'TEMPLATE_CHANGED' ||
              rawErr === 'PDF_RUNTIME_UNAVAILABLE' ||
              rawErr === 'PDF_RUNTIME_DEPENDENCIES_MISSING'
          ? 'Official ADR PDF preview is unavailable in this environment.'
          : `Sharing request failed (${String(rawErr ?? r.status)}). Refresh and retry.`
      ),
      { code }
    );
  }
  return r;
}

export function PatientSharing({
  owner,
  caseId,
  revision,
}: {
  owner: string;
  caseId: string;
  revision: number;
}) {
  const { invalidateSession } = useAccount();
  const [open, setOpen] = useState(false);
  const [sharingType, setSharingType] = useState<'pool' | 'direct'>('pool');
  const [directory, setDirectory] = useState<any[]>([]);
  const [disclosure, setDisclosure] = useState<any>(null);
  const [requests, setRequests] = useState<any[]>([]);
  const [recipient, setRecipient] = useState('');
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const command = useRef<{ body: string; key: string }>();

  useEffect(() => {
    setConsent(false);
    setDisclosure(null);
    setRecipient('');
    setRequests([]);
  }, [owner, caseId, revision]);

  async function load() {
    setError('');
    setBusy(true);
    try {
      const [d, p, r] = await Promise.all([
        sharingRequest(owner, '/directory').then(r => r.json()),
        sharingRequest(owner, '/disclosure', { caseId, revision }).then(r => r.json()),
        sharingRequest(owner, '/requests').then(r => r.json()),
      ]);
      setDirectory(d.specialists ?? []);
      setDisclosure(p.disclosure);
      setRequests((r.requests ?? []).filter((x: any) => x.caseId === caseId));
    } catch (e) {
      if ((e as { code?: string }).code === 'SIGN_IN_REQUIRED') void invalidateSession(owner);
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function mutate(path: string, body: unknown) {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError('');
    const fingerprint = JSON.stringify([path, body]);
    if (command.current?.body !== fingerprint)
      command.current = { body: fingerprint, key: crypto.randomUUID() };
    try {
      await sharingRequest(owner, path, body, command.current.key);
      command.current = undefined;
      setConsent(false);
      await load();
    } catch (e) {
      if ((e as { code?: string }).code === 'SIGN_IN_REQUIRED') void invalidateSession(owner);
      setError((e as Error).message);
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }

  return (
    <section className="specialist-profile" aria-label="Patient-controlled sharing">
      {import.meta.env.VITE_APIP_SHARING_FIXTURE === '1' && (
        <p role="note">Disposable sharing fixture · fictional accounts only</p>
      )}
      <h2>Request a specialist review</h2>
      <p>
        Share only this saved revision. This is an internal APIP review request, not government
        submission.
      </p>
      <M3Button
        variant="outlined"
        onClick={() => {
          setOpen(true);
          void load();
        }}
        disabled={busy}
      >
        Share revision {revision}
      </M3Button>

      {open && (
        <>
          {error && <p role="alert">{error}</p>}
          {busy && <p role="status">Checking saved revision and permissions…</p>}
          {disclosure && (
            <>
              <p>
                Case {caseId.slice(0, 8)} · saved revision {revision}
              </p>

              <div style={{ margin: '16px 0' }}>
                <h3>Sharing Destination</h3>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <M3Radio
                      name="sharingDestination"
                      value="pool"
                      checked={sharingType === 'pool'}
                      onChange={() => {
                        setSharingType('pool');
                        setConsent(false);
                      }}
                      disabled={busy}
                    />
                    <span>Approved Specialist Review Pool (Recommended)</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <M3Radio
                      name="sharingDestination"
                      value="direct"
                      checked={sharingType === 'direct'}
                      onChange={() => {
                        setSharingType('direct');
                        setConsent(false);
                      }}
                      disabled={busy}
                    />
                    <span>Specific Specialist</span>
                  </label>
                </div>
              </div>

              {sharingType === 'direct' ? (
                <>
                  <M3Select
                    label="Specialist recipient"
                    value={recipient}
                    options={[
                      { value: '', label: 'Select a specialist' },
                      ...directory.map(d => ({
                        value: d.id,
                        label: `${d.name} · ${d.category} · ${d.organization}`,
                      })),
                    ]}
                    onChange={v => {
                      setRecipient(v);
                      setConsent(false);
                    }}
                    disabled={busy}
                  />
                  <p>Only currently approved, opted-in specialists are listed.</p>
                </>
              ) : (
                <p>
                  Your case will be placed in the shared specialist review queue. Any approved, active
                  specialist can see limited non-identifying metadata (reaction summary, suspect medicine,
                  and date), but only one specialist can claim it for full review.
                </p>
              )}

              <h3>Information visible to the reviewing specialist</h3>
              <dl>
                {disclosure.fields.map((f: any) => (
                  <div key={f.key}>
                    <dt>
                      {f.label}
                      {f.personal ? ' — personal/contact information' : ''}
                    </dt>
                    <dd>{f.state === 'unknown' ? 'Unknown' : f.value}</dd>
                  </div>
                ))}
              </dl>

              <h3>Your original reporting statements</h3>
              {disclosure.statements.map((s: string, i: number) => (
                <p key={i}>{s}</p>
              ))}
              {disclosure.warnings.map((w: string) => (
                <p key={w}>{w}</p>
              ))}
              <p>{disclosure.pdfNotice}</p>
              <p>Withdrawal blocks future access. New edits remain private until you explicitly share them again.</p>

              {sharingType === 'pool' ? (
                <>
                  <M3Checkbox
                    label={
                      'I consent to share case ' +
                      caseId.slice(0, 8) +
                      ', revision ' +
                      revision +
                      ' with the approved specialist review pool for internal ADR review, with limited queue metadata visible to approved specialists until claimed by a single reviewer, and that withdrawal will restrict future access.'
                    }
                    checked={consent}
                    onChange={setConsent}
                    disabled={busy}
                  />
                  <M3Button
                    disabled={busy || !consent}
                    onClick={() =>
                      void mutate('/requests', {
                        caseId,
                        revision,
                        target: 'pool',
                        consent: true,
                        policyVersion: 'phase3c-c1-v1',
                        digest: disclosure.digest,
                      })
                    }
                  >
                    Confirm pool sharing request
                  </M3Button>
                </>
              ) : (
                <>
                  <M3Checkbox
                    label={
                      'I consent to share case ' +
                      caseId.slice(0, 8) +
                      ', revision ' +
                      revision +
                      ' with ' +
                      (directory.find(d => d.id === recipient)?.name || 'the selected specialist') +
                      ' for internal ADR review, including the personal/contact details shown above and the original-form PDF preview.'
                    }
                    checked={consent}
                    onChange={setConsent}
                    disabled={busy || !recipient}
                  />
                  <M3Button
                    disabled={busy || !consent || !recipient}
                    onClick={() =>
                      void mutate('/requests', {
                        caseId,
                        revision,
                        specialist: recipient,
                        consent: true,
                        policyVersion: 'phase3c-b-v1',
                        digest: disclosure.digest,
                      })
                    }
                  >
                    Confirm sharing request
                  </M3Button>
                </>
              )}
            </>
          )}

          {requests.map(r => (
            <article key={r.id}>
              <h3>
                Review request · revision {r.revision} ·{' '}
                {r.target === 'pool'
                  ? `Specialist Review Pool (${r.state === 'pending_claim' ? 'Awaiting Claim' : r.state})`
                  : `Direct Assignment (${r.state})`}
              </h3>
              <p role="status">{['active','pending_claim','claimed'].includes(r.state)?'Forwarded for specialist review.':r.state}</p>
              {(r.state === 'active' || r.state === 'pending_claim' || r.state === 'claimed') && (
                <M3Button
                  variant="outlined"
                  disabled={busy}
                  onClick={() =>
                    void mutate('/requests/' + r.id + '/withdraw', {
                      expectedVersion: r.version,
                    })
                  }
                >
                  Withdraw future access
                </M3Button>
              )}
            </article>
          ))}
        </>
      )}
    </section>
  );
}

export function SharingInbox({ owner }: { owner: string }) {
  const { invalidateSession } = useAccount();
  const [activeTab, setActiveTab] = useState<'queue' | 'assigned'>('queue');
  const [queue, setQueue] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [error, setError] = useState('');
  const [pdf, setPdf] = useState('');
  const [optIn, setOptIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingQueue, setLoadingQueue] = useState(true);
  const [poolUnavailable, setPoolUnavailable] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);
  const [busy, setBusy] = useState(false);
  const latest = useRef(0);

  function handleInboxError(e: unknown) {
    const code = (e as { code?: string }).code;
    if (code === 'SIGN_IN_REQUIRED') {
      setQueue([]);
      setItems([]);
      setSelected(null);
      setPdf('');
      void invalidateSession(owner);
    } else if (code === 'FORBIDDEN') {
      setAccessDenied(true);
      setQueue([]);
      setItems([]);
      setSelected(null);
      setPdf('');
    }
    setError((e as Error).message);
  }

  async function loadAssigned(signal?: AbortSignal) {
    try {
      const res = await sharingRequest(owner, '/inbox', undefined, undefined, signal);
      const data = await res.json();
      setItems(data.requests ?? []);
    } catch (e) {
      if (!signal?.aborted) handleInboxError(e);
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }

  async function loadQueue(signal?: AbortSignal) {
    try {
      const res = await sharingRequest(owner, '/queue', undefined, undefined, signal);
      const data = await res.json();
      setPoolUnavailable(false);
      setQueue(data.queue ?? []);
    } catch (e) {
      if (signal?.aborted) return;
      const msg = (e as Error).message;
      if (msg.includes('pending database migration')) {
        setPoolUnavailable(true);
        setQueue([]);
        setActiveTab(prev => (prev === 'queue' ? 'assigned' : prev));
      } else {
        handleInboxError(e);
      }
    } finally {
      if (!signal?.aborted) setLoadingQueue(false);
    }
  }

  useEffect(() => {
    if (accessDenied) return;
    const controller = new AbortController();
    void sharingRequest(owner, '/directory/me', undefined, undefined, controller.signal)
      .then(r => r.json())
      .then(v => setOptIn(v.optedIn))
      .catch(e => {
        if (!controller.signal.aborted && (e as { code?: string }).code === 'SIGN_IN_REQUIRED') {
          void invalidateSession(owner);
        }
      });

    void loadAssigned(controller.signal);
    if (!poolUnavailable) void loadQueue(controller.signal);

    // C1-D: Polling interval (10 seconds) for synchronizing queue state
    const timer = setInterval(() => {
      if (!poolUnavailable) void loadQueue();
      void loadAssigned();
    }, 10000);

    return () => {
      controller.abort();
      clearInterval(timer);
    };
  }, [owner, poolUnavailable, accessDenied]);

  useEffect(() => {
    return () => {
      if (pdf) URL.revokeObjectURL(pdf);
    };
  }, [pdf]);

  async function open(id: string, preview = false) {
    const seq = ++latest.current;
    setError('');
    try {
      const r = await sharingRequest(owner, '/inbox/' + id + (preview ? '/preview' : ''), preview ? {} : undefined);
      if (seq !== latest.current) return;
      if (preview) setPdf(URL.createObjectURL(await r.blob()));
      else {
        setPdf('');
        setSelected(await r.json());
      }
    } catch (e) {
      setPdf('');
      setSelected(null);
      handleInboxError(e);
    }
  }

  async function claimCase(id: string) {
    setError('');
    setBusy(true);
    try {
      await sharingRequest(owner, '/queue/' + id + '/claim', {}, crypto.randomUUID());
      await Promise.all([loadQueue(), loadAssigned()]);
      setActiveTab('assigned');
    } catch (e) {
      handleInboxError(e);
      if ((e as { code?: string }).code !== 'SIGN_IN_REQUIRED' && (e as { code?: string }).code !== 'FORBIDDEN') {
        void loadQueue();
      }
    } finally {
      setBusy(false);
    }
  }

  async function releaseCase(id: string, expectedVersion: number) {
    setError('');
    setBusy(true);
    try {
      await sharingRequest(
        owner,
        '/queue/' + id + '/release',
        { expectedVersion },
        crypto.randomUUID()
      );
      setSelected(null);
      setPdf('');
      await Promise.all([loadQueue(), loadAssigned()]);
    } catch (e) {
      handleInboxError(e);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="specialist-workspace">
      <M3Button variant="text" onClick={() => navigatePreview('/specialist/home')}>
        Back to specialist workspace
      </M3Button>
      <h1>Specialist ADR Review Workspace</h1>
      {import.meta.env.VITE_APIP_SHARING_FIXTURE === '1' && (
        <p role="note">Disposable sharing fixture · fictional accounts only</p>
      )}
      <p>
        Review patient ADR cases consented for specialist analysis. Case assignments require current, active
        professional authorization.
      </p>

      {error && <p role="alert" style={{ color: 'var(--md-sys-color-error, #ba1a1a)', margin: '12px 0' }}>{error}</p>}

      <details style={{ marginBottom: '16px' }}>
        <summary>Specialist directory participation</summary>
        <p>
          Opt in to disclose your professional name, category and organization to authenticated patients. This grants
          no patient access by itself.
        </p>
        <M3Checkbox label="Include me in the specialist directory" checked={optIn} onChange={setOptIn} />
        <M3Button
          onClick={() =>
            void sharingRequest(owner, '/directory', { optedIn: optIn }, crypto.randomUUID()).catch(handleInboxError)
          }
        >
          Save directory preference
        </M3Button>
      </details>

      <div
        className="specialist-nav"
        role="tablist"
        aria-label="Review workspace sections"
        style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}
      >
        <M3Button
          variant={activeTab === 'queue' ? 'filled' : 'outlined'}
          onClick={() => setActiveTab('queue')}
        >
          Available Review Queue ({queue.length})
        </M3Button>
        <M3Button
          variant={activeTab === 'assigned' ? 'filled' : 'outlined'}
          onClick={() => setActiveTab('assigned')}
        >
          My Assigned Reviews ({items.length})
        </M3Button>
      </div>

      {activeTab === 'queue' ? (
        <div aria-label="Available Patient Review Queue">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2>Available Patient Review Queue</h2>
            <M3Button
              variant="text"
              onClick={() => {
                setLoadingQueue(true);
                void loadQueue();
              }}
              disabled={busy}
            >
              Refresh queue
            </M3Button>
          </div>
          <p>
            Patients have explicitly consented these saved revisions for pool review. Minimal safe metadata is
            displayed. Full report contents unlock once claimed.
          </p>

          {loadingQueue ? (
            <p role="status">Loading available review queue…</p>
          ) : poolUnavailable ? (
            <p role="note">
              Shared specialist review queue requires a pending database migration. Direct specialist assignments in
              My Assigned Reviews remain active.
            </p>
          ) : !queue.length ? (
            <p>No patient reports are currently awaiting claim in the shared pool.</p>
          ) : (
            queue.map(q => (
              <article
                className="specialist-profile"
                key={q.id}
                style={{ marginBottom: '16px', padding: '16px', border: '1px solid var(--md-sys-color-outline-variant, #cac4d0)', borderRadius: '12px' }}
              >
                <h3>Case {q.caseRef}</h3>
                <p>
                  Saved revision {q.revision} · Consented {new Date(q.createdAt).toLocaleDateString()}
                </p>
                <p>
                  <strong>Reported reaction:</strong> {q.safeMetadata.reactionSnippet}
                </p>
                <p>
                  <strong>Suspect medicine:</strong> {q.safeMetadata.suspectMedicineClass}
                </p>
                <p className="specialist-card-detail" style={{ fontSize: '0.875rem', opacity: 0.8 }}>
                  Full patient identification and contact details remain private until a review is claimed.
                </p>
                <div className="specialist-actions" style={{ marginTop: '12px' }}>
                  <M3Button disabled={busy} onClick={() => void claimCase(q.id)}>
                    Claim case for review
                  </M3Button>
                </div>
              </article>
            ))
          )}
        </div>
      ) : (
        <div aria-label="My Assigned Reviews">
          <h2>My Assigned Reviews</h2>
          {loading ? (
            <p role="status">Loading authorized assignments…</p>
          ) : !items.length && !error ? (
            <p>No active assignments. Claim cases from the available review queue or accept direct referrals.</p>
          ) : (
            items.map(r => (
              <article className="specialist-profile" key={r.id} style={{ marginBottom: '16px' }}>
                <h2>Case {r.caseId.slice(0, 8)}</h2>
                <p>
                  Saved revision {r.revision} · {r.state} · Assigned{' '}
                  {new Date(r.assignedAt).toLocaleDateString()}
                </p>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <M3Button variant="outlined" onClick={() => void open(r.id)}>
                    Open assigned revision
                  </M3Button>
                  <M3Button
                    variant="text"
                    disabled={busy}
                    onClick={() => void releaseCase(r.id, r.version)}
                  >
                    Release case back to queue
                  </M3Button>
                  <M3Button
                    variant="text"
                    onClick={() =>
                      void sharingRequest(
                        owner,
                        '/inbox/' + r.id + '/decline',
                        { expectedVersion: r.version },
                        crypto.randomUUID()
                      )
                        .then(() => {
                          setItems(old => old.filter(x => x.id !== r.id));
                          setSelected(null);
                          setPdf('');
                        })
                        .catch(e => setError(e.message))
                    }
                  >
                    Decline assignment
                  </M3Button>
                </div>
              </article>
            ))
          )}

          {selected && (
            <article style={{ marginTop: '24px' }}>
              <h2>Consented revision {selected.revision}</h2>
              <dl>
                {selected.disclosure.fields.map((f: any) => (
                  <div key={f.key}>
                    <dt>{f.label}</dt>
                    <dd>{f.state === 'unknown' ? 'Unknown' : f.value}</dd>
                  </div>
                ))}
              </dl>
              <p>{selected.disclosure.pdfNotice}</p>
              <M3Button onClick={() => void open(selected.id, true)}>Preview authorized PvPI form</M3Button>
              {pdf && (
                <div className="adr-live-form">
                  <FormPage url={pdf} />
                  <details>
                    <summary>View all original form pages</summary>
                    <iframe
                      title="Consented original PvPI revision"
                      src={pdf}
                      style={{ width: '100%', height: '75vh', border: 0 }}
                    />
                  </details>
                </div>
              )}
            </article>
          )}
        </div>
      )}
    </section>
  );
}

export function AssignmentCount({ owner }: { owner: string }) {
  const [count, setCount] = useState<number | null>(null);
  useEffect(() => {
    const c = new AbortController();
    sharingRequest(owner, '/count', undefined, undefined, c.signal)
      .then(r => r.json())
      .then(v => setCount(v.count))
      .catch(() => {});
    return () => c.abort();
  }, [owner]);
  return count === null ? null : <span>{count} active assigned reports</span>;
}
