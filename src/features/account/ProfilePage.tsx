import React, { useEffect, useState } from 'react';
import { M3Button, M3Checkbox, M3TextField } from '../../components/material/core';
import { accountClient } from './client';
import { useAccount } from './AccountProvider';
import { emptyProfile, historyFields, ProfileInput, validateProfile } from './profile';
import { navigatePreview } from '../access/navigation';
import './account.css';

const labels = { conditions: 'Current or previous medical conditions', surgeries: 'Previous surgeries', medicines: 'Current medicines', allergies: 'Known allergies', history_notes: 'Anything else you want to share' };
export function ProfilePage() {
  const { user, profile, ready, error, reload } = useAccount();
  const [form, setForm] = useState<ProfileInput>(emptyProfile);
  const [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [dirty, setDirty] = useState(false);
  useEffect(() => { setForm(profile ?? emptyProfile()); setConfirmed(false); setDirty(false); }, [profile, user?.id]);
  useEffect(() => {
    if (!dirty) return;
    const leaving = (e: Event) => { if (!window.confirm('Leave and discard unsaved profile changes?')) e.preventDefault(); };
    const unloading = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('apip:before-navigate', leaving); window.addEventListener('beforeunload', unloading);
    return () => { window.removeEventListener('apip:before-navigate', leaving); window.removeEventListener('beforeunload', unloading); };
  }, [dirty]);
  const edit = <K extends keyof ProfileInput>(key: K, value: ProfileInput[K]) => { setForm(v => ({ ...v, [key]: value })); setConfirmed(false); setDirty(true); setNotice(''); };
  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!accountClient || !user || !ready || error) return;
    const invalid = validateProfile(form);
    if (invalid || !confirmed) { setNotice(invalid ?? 'Confirm that you have reviewed these details.'); return; }
    setBusy(true);
    // Whitelist fields; never write fetched ownership/revision fields back as user input.
    const payload = { ...emptyProfile(), ...Object.fromEntries(Object.keys(emptyProfile()).map(k => [k, form[k as keyof ProfileInput]])) };
    try {
      const query = profile
        ? accountClient.from('patient_profiles').update(payload).eq('user_id', user.id).eq('revision', profile.revision)
        : accountClient.from('patient_profiles').insert({ ...payload, user_id: user.id });
      const result = await query.select().maybeSingle();
      if (result.error || !result.data) { setNotice('Not saved. Your profile may have changed elsewhere, or the database is unavailable. Copy unsaved edits before reloading.'); return; }
      setDirty(false); setNotice('Profile saved to your account.'); reload();
    } catch { setNotice('Not saved. Check your connection and retry.'); }
    finally { setBusy(false); }
  };
  const remove = async () => {
    if (!accountClient || !user || !profile || !confirm('Delete your saved health profile? Your login will remain.')) return;
    setBusy(true);
    try {
      const result = await accountClient.from('patient_profiles').delete().eq('user_id', user.id).eq('revision', profile.revision).select('user_id');
      if (result.error || !result.data?.length) setNotice('Deletion failed or the profile changed. Reload before retrying.');
      else { setDirty(false); reload(); }
    } catch { setNotice('Deletion failed. Please retry.'); }
    finally { setBusy(false); }
  };
  return <section className="account-profile" aria-labelledby="access-title">
    <p className="access-eyebrow">Your APIP account</p><h1 id="access-title" tabIndex={-1}>Your personal health profile</h1>
    <p>Tell us once, review it anytime. Medical history is optional. Blank answers stay unknown.</p>
    <p className="account-notice">Development testing only: use fictional details. AI does not diagnose conditions or silently change this profile.</p>
    {!user && <p role="status">{accountClient ? 'Sign in before saving. This layout preview keeps edits only on this page.' : 'Database not connected. This layout preview cannot save or upload your information.'}</p>}
    {error && <p role="alert">{error} <M3Button variant="text" onClick={reload}>Retry loading</M3Button></p>}
    {!ready && <p role="status">Loading your account…</p>}
    <form className="account-profile-form" onSubmit={save} noValidate>
      <fieldset disabled={busy || !ready || !!error}><legend>Basic details</legend>
        <M3Checkbox checked={form.relationship === 'caregiver'} onChange={v => edit('relationship', v ? 'caregiver' : 'self')} label="I am completing this profile as a parent or caregiver" />
        <div className="account-grid">
          <M3TextField label="Full name" supportingText="The person receiving care." value={form.display_name} maxLength={100} required onChange={e => edit('display_name', e.target.value)} />
          <M3TextField label="Date of birth" value={form.birth_date} maxLength={10} required supportingText="YYYY-MM-DD. Used to calculate current age." onChange={e => edit('birth_date', e.target.value)} />
        </div>
      </fieldset>
      <fieldset disabled={busy || !ready || !!error}><legend>Health history · optional</legend>
        <p>Include only what you want to share. These are your statements, not verified medical conclusions.</p>
        <div className="account-grid">{historyFields.map(field => <M3TextField key={field} label={labels[field]} type="textarea" rows={3} value={form[field] ?? ''} maxLength={2000} onChange={e => edit(field, e.target.value.trim() ? e.target.value : null)} />)}</div>
      </fieldset>
      <fieldset disabled={busy || !ready || !!error}><legend>Choose where your profile is available</legend>
        <M3Checkbox checked={form.share_medassist} onChange={v => edit('share_medassist', v)} label="Make my confirmed profile available in MedAssist" />
        <M3Checkbox checked={form.share_adr} onChange={v => edit('share_adr', v)} label="Make my confirmed profile available in ADR reporting" />
        <p>These choices do not permit model training, external AI processing or sharing with hospitals. You can change them anytime.</p>
        <M3Checkbox checked={confirmed} onChange={setConfirmed} label="I reviewed these details and agree to store them in my account" />
      </fieldset>
      <div className="account-actions"><M3Button type="submit" loading={busy} disabled={!user || !accountClient || !ready || !!error}>Save profile</M3Button>
        {profile && <M3Button variant="text" disabled={busy} onClick={() => void remove()}>Delete health profile</M3Button>}
        {!user && <M3Button variant="text" onClick={() => navigatePreview('/sign-in/patient')}>Go to sign in</M3Button>}
        {profile && !dirty && <M3Button variant="outlined" onClick={() => { const task = sessionStorage.getItem('apip.account.continue'); sessionStorage.removeItem('apip.account.continue'); navigatePreview(task === 'medassist' || task === 'adr-report' ? `/preview/${task}` : '/patient/home'); }}>Continue</M3Button>}
      </div>
      {notice && <p role="status">{notice}</p>}
    </form>
  </section>;
}
