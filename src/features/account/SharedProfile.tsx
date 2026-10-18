import React, { useEffect, useState } from 'react';
import { M3Button } from '../../components/material/core';
import { useAccount } from './AccountProvider';
import { profileContext } from './profile';
import { navigatePreview } from '../access/navigation';

export function SharedProfile({ layer }: { layer: 'medassist' | 'adr' }) {
  const { profile, ready, error } = useAccount();
  const [expanded, setExpanded] = useState(false);
  useEffect(() => setExpanded(false), [profile?.user_id]);
  const context = profile && profileContext(profile, layer);
  if (!ready || error || !context) return null;
  return <aside className="account-shared" aria-label="Confirmed profile context">
    <p>Saved profile available · age {context.age ?? 'unknown'} · version {context.revision}</p>
    <p>Your current answers stay separate. This preview does not send your profile to AI or add it to a report.</p>
    <M3Button variant="text" onClick={() => setExpanded(v => !v)}>{expanded ? 'Hide background' : 'Review saved background'}</M3Button>
    <M3Button variant="text" onClick={() => navigatePreview('/account/profile')}>Edit profile</M3Button>
    {expanded && <dl>{Object.entries(context).filter(([k]) => !['source', 'revision', 'age'].includes(k)).map(([key, value]) => <div key={key}><dt>{key.replaceAll('_', ' ')}</dt><dd>{value ?? 'Unknown'}</dd></div>)}</dl>}
  </aside>;
}
