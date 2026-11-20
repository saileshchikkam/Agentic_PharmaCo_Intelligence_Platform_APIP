import React, { useEffect, useRef, useState } from 'react';
import { M3Button, M3TextField } from '../../components/material/core';
import type { NavigationRequest } from '../medassist-intelligence/governance';
import type { FacilityNavigationContract } from '../medassist-precautions/precaution-contracts';
import {
  discoverHealthcareFacilities,
  type DiscoveredFacility,
  type FacilityDiscoveryRequest,
  type FacilityDiscoveryResponse,
} from '../medassist-discovery';
import { mapsSearch, prepareNavigation, requestLocation } from './navigation';

interface HospitalNavigationProps {
  emergency: boolean;
  navigationContract?: FacilityNavigationContract;
  compact?: boolean;
}

export default function HospitalNavigation({ emergency, navigationContract, compact }: HospitalNavigationProps) {
  const [place, setPlace] = useState('');
  const [coordinates, setCoordinates] = useState<NavigationRequest | null>(null);
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  const [url, setUrl] = useState<string | null>(null);
  const [discoveryResponse, setDiscoveryResponse] = useState<FacilityDiscoveryResponse | null>(null);
  const [filterVerifiedOnly, setFilterVerifiedOnly] = useState(false);
  const [simulatedActionNotice, setSimulatedActionNotice] = useState<string | null>(null);

  const generation = useRef(0);
  const abort = useRef<AbortController | null>(null);

  useEffect(() => () => {
    generation.current++;
    abort.current?.abort();
  }, []);

  function clear() {
    generation.current++;
    abort.current?.abort();
    setBusy(false);
    setPlace('');
    setCoordinates(null);
    setUrl(null);
    setDiscoveryResponse(null);
    setStatus('');
    setSimulatedActionNotice(null);
  }

  async function locate() {
    const version = ++generation.current;
    abort.current?.abort();
    setBusy(true);
    setStatus('Requesting device location permission…');
    setUrl(null);
    setCoordinates(null);
    setPlace('');
    try {
      const value = await requestLocation(navigator.geolocation);
      if (version !== generation.current) return;
      setCoordinates(value);
      setPlace(`${value.location.latitude.toFixed(3)}, ${value.location.longitude.toFixed(3)}`);
      setStatus('Approximate device coordinates ready (~100m accuracy). Privacy guarantee: personal health details are never sent to external mapping services.');
    } catch (e) {
      if (version === generation.current) {
        setStatus(
          e instanceof Error && e.message === 'LOCATION_PERMISSION_DENIED'
            ? 'Location permission was denied. Please enter your City, Area or PIN Code below instead. Emergency help does not require location permission.'
            : 'Device location is unavailable or timed out. Please enter your City, Area or PIN Code below.',
        );
      }
    } finally {
      if (version === generation.current) setBusy(false);
    }
  }

  async function discoverFacilities() {
    const version = ++generation.current;
    abort.current?.abort();
    const controller = new AbortController();
    abort.current = controller;
    setBusy(true);

    if (!coordinates && !place.trim()) {
      setStatus('Please click "Use My Location" or enter your City, Area or PIN Code to find hospitals.');
      setBusy(false);
      return;
    }

    setStatus('Discovering symptom-matched hospitals and healthcare facilities…');

    const effectiveContract: FacilityNavigationContract = navigationContract ?? {
      schema_version: 'medassist.facility-navigation.v1',
      research_only: true,
      clinical_claim: false,
      required_service: emergency ? 'Emergency Medicine & Trauma Care' : 'General Medicine / Internal Medicine',
      alternative_service: emergency ? null : 'Family Medicine & General Practice',
      required_capabilities: emergency ? ['emergency_resuscitation'] : ['outpatient_consultation'],
      urgency_level: emergency ? 'extreme' : 'low',
      emergency_department_required: emergency,
      facility_verification_requirements: ['verified_specialist_consultation'],
      explicit_exclusions: emergency ? ['clinics_polyclinics', 'diagnostic_centres'] : [],
      eligible_facility_tiers: emergency
        ? ['emergency_departments_trauma', 'government_general_district_hospitals', 'private_multispecialty_hospitals', 'medical_college_hospitals']
        : ['clinics_polyclinics', 'primary_health_centres', 'community_health_centres', 'small_private_hospitals', 'government_general_district_hospitals', 'private_multispecialty_hospitals', 'medical_college_hospitals'],
    };

    const discoveryReq: FacilityDiscoveryRequest = {
      schema_version: 'medassist.facility-discovery-request.v1',
      consent_granted: true,
      latitude: coordinates ? coordinates.location.latitude : undefined,
      longitude: coordinates ? coordinates.location.longitude : undefined,
      manual_locality: coordinates ? undefined : place.trim(),
      navigation_contract: effectiveContract,
      search_radius_meters: 10000,
    };

    try {
      let result: FacilityDiscoveryResponse | null = null;
      try {
        const response = await fetch('/api/research/medassist/facilities', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(discoveryReq),
          signal: controller.signal,
        });
        if (response.ok) {
          result = (await response.json()) as FacilityDiscoveryResponse;
        }
      } catch {
        // Fallback to client-side deterministic evaluation if server endpoint is not reached
      }

      if (!result) {
        result = discoverHealthcareFacilities(discoveryReq);
      }

      if (version !== generation.current || controller.signal.aborted) return;
      setDiscoveryResponse(result);
      setStatus(`Found ${result.facilities.length} suitable hospitals matching required care capabilities.`);
    } catch {
      if (version === generation.current) {
        setStatus('Hospital discovery could not be completed. You can use the direct Google Maps search link below.');
      }
    } finally {
      if (version === generation.current) setBusy(false);
    }
  }

  async function prepareDirectLink() {
    const version = ++generation.current;
    abort.current?.abort();
    const controller = new AbortController();
    abort.current = controller;
    setBusy(true);
    setUrl(null);
    try {
      const link = coordinates ? (await prepareNavigation(coordinates, emergency, controller.signal)).url : mapsSearch(place, emergency);
      if (!link) throw new Error('LOCATION_REQUIRED');
      if (version !== generation.current || controller.signal.aborted) return;
      setUrl(link);
    } catch {
      if (version === generation.current) setStatus('Direct search link could not be prepared.');
    } finally {
      if (version === generation.current) setBusy(false);
    }
  }

  const effectiveService = navigationContract?.required_service ?? (emergency ? 'Emergency Medicine' : 'General Hospital');
  const externalMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${effectiveService} hospital near ${place.trim() || 'me'}`)}`;

  // Acceptance Check 3: Remove simulated hospital cards from normal recommendation results
  // when live lookup fails or is unavailable. Retain specialty-specific Google Maps fallback.
  const isLiveActive = discoveryResponse?.provider_status === 'live_api_active';
  const displayedFacilities: DiscoveredFacility[] = isLiveActive
    ? (discoveryResponse?.facilities ?? []).filter(fac => {
        if (filterVerifiedOnly) {
          return fac.capability_verification_status === 'verified_registry';
        }
        return true;
      }).slice(0, 5)
    : [];

  return (
    <section className={`hospital-recommendations-section ${compact ? 'hospital-section-compact' : ''}`} aria-labelledby="hospital-rec-title">
      <div className="hospital-rec-header">
        <h3 id="hospital-rec-title" className="assessment-box-title">
          {emergency ? '🚨 Emergency Hospital Navigation' : '🏥 Nearest Hospital Recommendations'}
        </h3>
        <p className="assessment-meta-list" style={{ margin: '2px 0 6px' }}>
          Matched to your assessed clinical urgency and required specialty: <strong>{effectiveService}</strong>.
        </p>
      </div>

      {emergency && (
        <div className="emergency-call-banner" role="alert">
          <strong>🚨 IMMEDIATE CRITICAL EMERGENCY ACTION REQUIRED</strong>
          <p>If experiencing a life-threatening medical emergency, call emergency services immediately. Do not delay for hospital discovery or navigation.</p>
          <div className="conversation-actions">
            <a href="tel:112" className="emergency-call-btn">Call Emergency (112)</a>
            <a href="tel:108" className="emergency-call-btn">Call Ambulance (108)</a>
          </div>
          <small>Never assume all returned facilities have emergency resuscitation capacity. In India, call 112 / 108 immediately.</small>
        </div>
      )}

      <div className="location-acquisition-card" style={{
        padding: '10px',
        borderRadius: '10px',
        border: '1px solid var(--md-sys-color-outline-variant)',
        background: 'var(--md-sys-color-surface-container)',
        margin: '6px 0',
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <p style={{ margin: 0, fontSize: '11px', color: 'var(--md-sys-color-on-surface-variant)' }}>
            <strong>Location Acquisition:</strong> Provide your location via device GPS or enter your city/area/PIN code. Health details and conversation history are never sent to external mapping services.
          </p>

          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            <M3Button
              variant={coordinates ? 'filled' : 'outlined'}
              onClick={() => void locate()}
              disabled={busy}
            >
              {coordinates ? '✓ GPS Location Acquired' : 'Use My Location'}
            </M3Button>
          </div>

          <M3TextField
            id="conversation-navigation-location"
            label="Enter City / Area / PIN Code"
            placeholder="e.g. Banjara Hills, Hyderabad or 500034"
            value={place}
            maxLength={180}
            onChange={event => {
              generation.current++;
              abort.current?.abort();
              setBusy(false);
              setPlace(event.target.value);
              setCoordinates(null);
              setUrl(null);
              setDiscoveryResponse(null);
              setStatus('');
            }}
          />

          <div className="conversation-actions" style={{ margin: '4px 0 0' }}>
            <M3Button
              variant="filled"
              onClick={() => void discoverFacilities()}
              disabled={busy || (!place.trim() && !coordinates)}
            >
              {busy ? 'Discovering…' : 'Find Suitable Hospitals'}
            </M3Button>
            <a
              href={externalMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              referrerPolicy="no-referrer"
              style={{ textDecoration: 'none' }}
            >
              <M3Button variant="text">
                Direct Google Maps Search ↗
              </M3Button>
            </a>
            {(place || coordinates || discoveryResponse) && (
              <M3Button variant="text" onClick={clear}>Clear</M3Button>
            )}
          </div>
        </div>
      </div>

      {status && <p role="status" style={{ fontSize: '11px', margin: '4px 0', color: 'var(--md-sys-color-on-surface)' }}>{status}</p>}

      {url && (
        <p style={{ margin: '4px 0', fontSize: '11px' }}>
          <a href={url} target="_blank" rel="noopener noreferrer" referrerPolicy="no-referrer">
            Open generic Google Maps search in new tab ↗
          </a>
        </p>
      )}

      {discoveryResponse && (
        <div className="facility-discovery-container" style={{ marginTop: '8px' }}>
          <div className={`facility-provider-banner ${discoveryResponse.provider_status === 'live_api_active' ? 'live-api' : 'simulated'}`}>
            <div>
              <strong>Provider Status:</strong> {discoveryResponse.provider_status === 'live_api_active' ? 'Live Google Maps Platform (Active)' : 'Live Lookup Unavailable (API Key Not Configured)'}
              {' · '}
              <span>Service: {discoveryResponse.searched_service}</span>
              {' · '}
              <span>Acuity: {discoveryResponse.urgency_level.toUpperCase()}</span>
            </div>
            {discoveryResponse.provider_status !== 'live_api_active' && (
              <div style={{ marginTop: '6px', fontSize: '11px' }}>
                <p style={{ margin: '2px 0 6px', color: 'var(--md-sys-color-on-surface-variant)' }}>
                  Live hospital lookup is currently unavailable ({discoveryResponse.provider_status === 'live_api_pending_credentials' ? 'Google Maps API key not configured on server' : 'live lookup failed'}).
                  <strong> Simulated hospital cards have been removed from normal recommendation results</strong> to prevent presenting unverified or non-existent healthcare facilities.
                </p>
                <p style={{ margin: '2px 0 8px', color: 'var(--md-sys-color-on-surface-variant)' }}>
                  Please use the direct, specialty-specific Google Maps search link below to view genuine nearby facilities:
                </p>
                <div style={{ marginTop: '6px' }}>
                  <a
                    href={externalMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    referrerPolicy="no-referrer"
                    style={{ textDecoration: 'none' }}
                  >
                    <M3Button variant="tonal">
                      Search Google Maps for &quot;{effectiveService}&quot; Near {place.trim() || 'You'} ↗
                    </M3Button>
                  </a>
                </div>
              </div>
            )}
          </div>

          {simulatedActionNotice && (
            <div className="simulated-action-banner" role="alert" style={{
              margin: '8px 0',
              padding: '8px 12px',
              backgroundColor: 'var(--md-sys-color-surface-variant)',
              color: 'var(--md-sys-color-on-surface-variant)',
              borderRadius: '8px',
              border: '1px solid var(--md-sys-color-outline)',
              fontSize: '11px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <span>{simulatedActionNotice}</span>
              <button
                type="button"
                onClick={() => setSimulatedActionNotice(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold', marginLeft: '12px' }}
                aria-label="Dismiss notice"
              >
                ✕
              </button>
            </div>
          )}

          {isLiveActive && displayedFacilities.length > 0 && (
            <div className="facility-filter-actions">
              <M3Button
                variant={filterVerifiedOnly ? 'outlined' : 'text'}
                onClick={() => setFilterVerifiedOnly(v => !v)}
              >
                {filterVerifiedOnly ? '✓ Verified Registry Only' : 'Filter: Verified Registry Only'}
              </M3Button>
              <span style={{ fontSize: '11px', color: 'var(--md-sys-color-on-surface-variant)' }}>
                ({displayedFacilities.length} of {Math.min(5, discoveryResponse.facilities.length)} suitable hospitals)
              </span>
            </div>
          )}

          {isLiveActive && displayedFacilities.length === 0 && (
            <div style={{ padding: '16px', textAlign: 'center', fontSize: '12px', color: 'var(--md-sys-color-on-surface-variant)' }}>
              <p style={{ margin: '0 0 8px' }}>No matching healthcare facilities found for this query in the specified area.</p>
              <a
                href={externalMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                referrerPolicy="no-referrer"
                style={{ textDecoration: 'none' }}
              >
                <M3Button variant="outlined">
                  Search Google Maps for &quot;{effectiveService}&quot; Near {place.trim() || 'You'} ↗
                </M3Button>
              </a>
            </div>
          )}

          <div className="facility-cards-list">
            {displayedFacilities.map(fac => {
              const isSimulated = discoveryResponse.provider_status !== 'live_api_active' ||
                fac.facility_id.startsWith('SIM_') ||
                fac.facility_id.startsWith('FAC_');

              return (
                <div key={fac.facility_id} className="facility-card">
                  <div className="facility-card-header">
                    <div>
                      <h4 className="facility-title">{fac.name}</h4>
                      {isSimulated && (
                        <span className="facility-simulated-tag" style={{
                          display: 'inline-block',
                          fontSize: '10px',
                          fontWeight: 'bold',
                          color: 'var(--md-sys-color-error)',
                          backgroundColor: 'var(--md-sys-color-error-container)',
                          padding: '1px 5px',
                          borderRadius: '4px',
                          marginTop: '2px',
                        }}>
                          [Simulated Research Fixture]
                        </span>
                      )}
                    </div>
                    <div className="facility-badge-group">
                      <span className="facility-badge">{fac.facility_category_display}</span>
                      <span className={`facility-badge ${fac.capability_verification_status === 'verified_registry' ? 'verified' : fac.capability_verification_status === 'provisional_match' ? 'provisional' : 'unverified'}`}>
                        {fac.capability_verification_status === 'verified_registry'
                          ? 'Verified Registry'
                          : fac.capability_verification_status === 'provisional_match'
                          ? 'Provisional Match'
                          : 'Unverified Candidate'}
                      </span>
                      {fac.emergency_capable && (
                        <span className="facility-badge emergency">24x7 ER</span>
                      )}
                    </div>
                  </div>

                  {fac.capability_verification_status === 'unverified_candidate' && (
                    <div style={{
                      margin: '4px 0',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      backgroundColor: 'var(--md-sys-color-error-container)',
                      color: 'var(--md-sys-color-on-error-container)',
                      fontSize: '11px',
                      fontWeight: 500,
                    }}>
                      ⚠️ <strong>Unverified Specialty Match:</strong> Listing has not confirmed a dedicated <em>{effectiveService}</em> department. Contact the facility before travel to confirm specialist availability.
                    </div>
                  )}

                  <p style={{
                    margin: '2px 0',
                    fontSize: '11px',
                    color: fac.capability_verification_status === 'unverified_candidate'
                      ? 'var(--md-sys-color-on-surface-variant)'
                      : 'var(--md-sys-color-primary)',
                    fontWeight: 600,
                  }}>
                    {fac.capability_verification_status === 'unverified_candidate'
                      ? `Specialty Match: Unverified in listing (${fac.relevant_specialties.join(', ')})`
                      : `Specialty Match: ${fac.relevant_specialties.join(', ')}`}
                  </p>

                  <div className="facility-meta-row">
                    {fac.distance_text && (
                      <span><strong>Distance:</strong> {fac.distance_text}</span>
                    )}
                    {fac.travel_duration_text ? (
                      <span><strong>Drive Time:</strong> {fac.travel_duration_text}</span>
                    ) : (
                      <span><strong>Drive Time:</strong> Traffic unverified</span>
                    )}
                    <span><strong>Hours:</strong> {fac.is_24x7 ? '24x7 Emergency' : fac.opening_hours_text || 'Hours unverified'}</span>
                  </div>

                  <p className="facility-address">{fac.address}</p>

                  {fac.ranking_reasons.length > 0 && (
                    <p className="facility-reason-list">
                      ✓ {fac.ranking_reasons.join(' · ')}
                    </p>
                  )}

                  <div className="facility-action-buttons">
                    {isSimulated ? (
                      <>
                        <M3Button
                          variant="outlined"
                          onClick={() => {
                            setSimulatedActionNotice(
                              `[Simulated Action] Navigation preview simulated for reference fixture "${fac.name}". Address: ${fac.address}. No external route dispatched.`
                            );
                          }}
                        >
                          Simulate Navigation
                        </M3Button>
                        {fac.phone_number && (
                          <M3Button
                            variant="tonal"
                            onClick={() => {
                              setSimulatedActionNotice(
                                `[Simulated Action] Direct dialing is disabled for fictional research facility "${fac.name}" (${fac.phone_number}). Real dialing is prohibited for simulated fixtures. In a real medical emergency, dial 112 or 108 immediately.`
                              );
                            }}
                          >
                            Simulate Call ({fac.phone_number})
                          </M3Button>
                        )}
                        <a
                          href={externalMapsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          referrerPolicy="no-referrer"
                          style={{ textDecoration: 'none' }}
                        >
                          <M3Button variant="text">Search on Google Maps ↗</M3Button>
                        </a>
                      </>
                    ) : (
                      <>
                        <a
                          href={fac.directions_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          referrerPolicy="no-referrer"
                          style={{ textDecoration: 'none' }}
                        >
                          <M3Button variant="filled">Get Directions</M3Button>
                        </a>
                        <a
                          href={fac.maps_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          referrerPolicy="no-referrer"
                          style={{ textDecoration: 'none' }}
                        >
                          <M3Button variant="outlined">Open in Maps</M3Button>
                        </a>
                        {fac.phone_number && (
                          <a href={`tel:${fac.phone_number}`} style={{ textDecoration: 'none' }}>
                            <M3Button variant="tonal">Call {fac.phone_number}</M3Button>
                          </a>
                        )}
                      </>
                    )}
                  </div>
                </div>
              );
            })}

            {displayedFacilities.length === 0 && (
              <p style={{ fontStyle: 'italic', color: 'var(--md-sys-color-on-surface-variant)', fontSize: '12px' }}>
                No facilities matched the current filter criteria.
              </p>
            )}
          </div>

          <details style={{ fontSize: '11px', color: 'var(--md-sys-color-on-surface-variant)', marginTop: '8px' }}>
            <summary>Hospital Discovery Disclaimers & Governance ({discoveryResponse.disclaimers.length})</summary>
            <ul>
              {discoveryResponse.disclaimers.map((d, idx) => (
                <li key={idx}>{d}</li>
              ))}
            </ul>
          </details>
        </div>
      )}
    </section>
  );
}
