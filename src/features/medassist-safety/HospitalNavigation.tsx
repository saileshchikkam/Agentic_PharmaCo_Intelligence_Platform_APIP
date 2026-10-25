import React, { useEffect, useRef, useState } from 'react';
import { M3Button, M3TextField } from '../../components/material/core';
import type { NavigationRequest } from '../medassist-intelligence/governance';
import { mapsSearch, prepareNavigation, requestLocation } from './navigation';

/** Existing Maps search capability, with fresh explicit location consent and no fabricated facilities. */
export default function HospitalNavigation({ emergency }: { emergency: boolean }) {
  const [place, setPlace] = useState('');
  const [coordinates, setCoordinates] = useState<NavigationRequest | null>(null);
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  const [url, setUrl] = useState<string | null>(null);
  const generation = useRef(0);
  const abort = useRef<AbortController | null>(null);
  useEffect(() => () => { generation.current++; abort.current?.abort(); }, []);
  function clear() {
    generation.current++; abort.current?.abort(); setBusy(false); setPlace(''); setCoordinates(null); setUrl(null); setStatus('');
  }
  async function locate() {
    const version = ++generation.current;
    abort.current?.abort(); setBusy(true); setStatus('Requesting location permission…'); setUrl(null); setCoordinates(null); setPlace('');
    try {
      const value = await requestLocation(navigator.geolocation);
      if (version !== generation.current) return;
      setCoordinates(value); setPlace(`${value.location.latitude.toFixed(3)},${value.location.longitude.toFixed(3)}`);
      setStatus('Approximate device coordinates ready. They are not independently verified. Prepare a search to send only these coordinates to the local backend; Maps receives them only if you open its link.');
    } catch (e) {
      if (version === generation.current) setStatus(e instanceof Error && e.message === 'LOCATION_PERMISSION_DENIED'
        ? 'Location permission was denied. You can enter a city or area instead. Emergency help does not need location permission.'
        : 'Location is unavailable or timed out. Enter a city or area instead.');
    } finally { if (version === generation.current) setBusy(false); }
  }
  async function prepare() {
    const version = ++generation.current;
    abort.current?.abort(); const controller = new AbortController(); abort.current = controller;
    const timer = setTimeout(() => controller.abort(), 8000);
    setBusy(true); setUrl(null); setStatus('');
    try {
      const link = coordinates ? (await prepareNavigation(coordinates, emergency, controller.signal)).url : mapsSearch(place, emergency);
      if (!link) throw Error('LOCATION_REQUIRED');
      if (version !== generation.current || controller.signal.aborted) return;
      setUrl(link); setStatus('Search link ready. APIP has no verified facility results, services, distances, travel times or availability.');
    } catch {
      if (version === generation.current) setStatus('Search could not be prepared: location consent may have expired, the network may be unavailable, or provider information is missing. Retry, enter a city/area, or open Maps separately. Do not wait for navigation in a real emergency.');
    } finally { clearTimeout(timer); if (version === generation.current) setBusy(false); }
  }
  return <details open={emergency || undefined} className="conversation-navigation">
    <summary>{emergency ? 'Emergency-care search (external Maps)' : 'Find hospitals (external Maps)'}</summary>
    <p>Optional: use device location or enter a city/area. Only location enters the search; symptoms and answers are never included. No location is stored.</p>
    <M3TextField id="conversation-navigation-location" label="City, area or approximate coordinates" value={place} maxLength={180}
      onChange={event => { generation.current++; abort.current?.abort(); setBusy(false); setPlace(event.target.value); setCoordinates(null); setUrl(null); setStatus(''); }} />
    <div className="conversation-actions">
      <M3Button variant="outlined" onClick={() => void locate()} disabled={busy}>Use my location</M3Button>
      <M3Button variant="outlined" onClick={() => void prepare()} disabled={busy || !place.trim()}>Prepare Maps search</M3Button>
      <M3Button variant="text" onClick={clear}>Clear location</M3Button>
    </div>
    <p role="status">{status}</p>
    {url && <a href={url} target="_blank" rel="noopener noreferrer" referrerPolicy="no-referrer">Open Maps search</a>}
    <p>Maps may be offline or return no results. A search result is not a verified emergency facility or recommendation. Contact emergency services for help choosing care; this demo cannot dispatch an ambulance.</p>
  </details>;
}
