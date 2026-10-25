import { readNavigationRequest, type NavigationRequest } from '../medassist-intelligence/governance';
import { hospitalSearchUrl } from '../medassist/flow';

export function mapsSearch(location: string, emergency: boolean): string | null {
  const ordinary = hospitalSearchUrl(location);
  if (!ordinary) return null;
  const url = new URL(ordinary);
  if (emergency) url.searchParams.set('query', `hospital emergency departments near ${location.trim()}`);
  return url.toString();
}
export type SearchHandoff = { schema_version: 'medassist.navigation-handoff.v1'; status: 'search_handoff';
  provider: 'google_maps'; url: string; facilities: []; verified_facility_provider: false;
  availability: 'unknown'; suitability: 'not_verified'; network_status: 'external_search_not_checked'; includes_symptoms: false };
export function navigationHandoff(raw: unknown, emergency: boolean, now = Date.now()): SearchHandoff | null {
  const request = readNavigationRequest(raw, now);
  if (!request || request.consent.expires_at > now+120000) return null;
  const location = `${request.location.latitude.toFixed(3)},${request.location.longitude.toFixed(3)}`;
  return { schema_version: 'medassist.navigation-handoff.v1', status: 'search_handoff', provider: 'google_maps',
    url: mapsSearch(location, emergency)!, facilities: [], verified_facility_provider: false,
    availability: 'unknown', suitability: 'not_verified', network_status: 'external_search_not_checked', includes_symptoms: false };
}

export function requestLocation(geolocation: Pick<Geolocation, 'getCurrentPosition'> | undefined,
  now = Date.now): Promise<NavigationRequest> {
  return new Promise((resolve, reject) => {
    if (!geolocation) { reject(Error('LOCATION_UNAVAILABLE')); return; }
    geolocation.getCurrentPosition(position => {
      const { latitude, longitude, accuracy } = position.coords;
      if (!Number.isFinite(accuracy) || accuracy < 0 || !Number.isFinite(position.timestamp)
        || now()-position.timestamp > 60000 || position.timestamp > now()+10000) { reject(Error('LOCATION_UNAVAILABLE')); return; }
      const request = readNavigationRequest({ schema_version: 'medassist.navigation-request.v1',
        consent: { granted: true, purpose: 'nearby_hospital_search', expires_at: now()+60000 },
        location: { latitude: Number(latitude.toFixed(3)), longitude: Number(longitude.toFixed(3)) } }, now());
      if (!request) reject(Error('LOCATION_UNAVAILABLE')); else resolve(request);
    }, error => reject(Error(error.code === 1 ? 'LOCATION_PERMISSION_DENIED' : 'LOCATION_UNAVAILABLE')),
    { enableHighAccuracy: false, maximumAge: 0, timeout: 10000 });
  });
}

/** Only an explicitly consented location reaches the local backend; no transcript fields. */
export async function prepareNavigation(request: NavigationRequest, emergency: boolean, signal: AbortSignal,
  fetchImpl = fetch): Promise<SearchHandoff> {
  const expected = navigationHandoff(request, emergency);
  if (!expected) throw Error('LOCATION_CONSENT_EXPIRED_OR_INVALID');
  const response = await fetchImpl(`/api/research/medassist/navigation/${emergency ? 'emergency' : 'hospital'}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'omit', cache: 'no-store',
    signal, body: JSON.stringify(request) });
  if (!response.ok) throw Error('NAVIGATION_UNAVAILABLE');
  const raw: unknown = await response.json();
  if (!raw || JSON.stringify(raw) !== JSON.stringify(expected) || signal.aborted) throw Error('INVALID_NAVIGATION_HANDOFF');
  return expected;
}
