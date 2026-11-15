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
}

export default function HospitalNavigation({ emergency, navigationContract }: HospitalNavigationProps) {
  const [place, setPlace] = useState('');
  const [coordinates, setCoordinates] = useState<NavigationRequest | null>(null);
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  const [url, setUrl] = useState<string | null>(null);
  const [discoveryResponse, setDiscoveryResponse] = useState<FacilityDiscoveryResponse | null>(null);
  const [filterVerifiedOnly, setFilterVerifiedOnly] = useState(false);

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
            ? 'Location permission was denied. You can enter a city or area instead. Emergency help does not require location permission.'
            : 'Location is unavailable or timed out. Enter a city or area instead.',
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
    setStatus('Discovering symptom-matched healthcare facilities…');

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
      manual_locality: coordinates ? undefined : (place.trim() || 'Central City'),
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
      setStatus(`Discovered ${result.facilities.length} suitable healthcare facilities matching required service.`);
    } catch {
      if (version === generation.current) {
        setStatus('Facility discovery could not be completed. You can use the generic Google Maps link below or seek immediate local assistance.');
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

  const displayedFacilities: DiscoveredFacility[] = (discoveryResponse?.facilities ?? []).filter(fac => {
    if (filterVerifiedOnly) {
      return fac.capability_verification_status === 'verified_registry';
    }
    return true;
  });

  return (
    <details open={emergency || undefined} className="conversation-navigation">
      <summary>{emergency ? '🚨 Emergency Healthcare Navigation' : '🏥 Symptom-Matched Care Facility Discovery'}</summary>

      {emergency && (
        <div className="emergency-call-banner">
          <strong>🚨 IMMEDIATE CRITICAL EMERGENCY ACTION REQUIRED</strong>
          <p>If you or someone nearby is experiencing a life-threatening medical emergency, call emergency services immediately.</p>
          <div className="conversation-actions">
            <a href="tel:112" className="emergency-call-btn">Call Emergency (112)</a>
            <a href="tel:108" className="emergency-call-btn">Call Ambulance (108)</a>
          </div>
          <small>Do not delay for maps navigation or online searches in a real emergency.</small>
        </div>
      )}

      <p>
        {emergency
          ? 'Discover nearest 24x7 Emergency Departments and Trauma Centers. No patient identity or symptom text is sent.'
          : 'Find nearby healthcare facilities matched to your required service without commercial bias.'}
      </p>

      <M3TextField
        id="conversation-navigation-location"
        label="City, area or approximate coordinates"
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

      <div className="conversation-actions">
        <M3Button variant="outlined" onClick={() => void locate()} disabled={busy}>Use my location</M3Button>
        <M3Button variant="outlined" onClick={() => void discoverFacilities()} disabled={busy || (!place.trim() && !coordinates)}>
          {busy ? 'Discovering…' : 'Discover suitable care'}
        </M3Button>
        <M3Button variant="text" onClick={() => void prepareDirectLink()} disabled={busy || (!place.trim() && !coordinates)}>
          Open generic Maps search
        </M3Button>
        <M3Button variant="text" onClick={clear}>Clear</M3Button>
      </div>

      <p role="status">{status}</p>

      {url && (
        <p>
          <a href={url} target="_blank" rel="noopener noreferrer" referrerPolicy="no-referrer">
            Open generic Google Maps search in new tab ↗
          </a>
        </p>
      )}

      {discoveryResponse && (
        <div className="facility-discovery-container">
          <div className={`facility-provider-banner ${discoveryResponse.provider_status === 'live_api_active' ? 'live-api' : 'simulated'}`}>
            <strong>Provider:</strong> {discoveryResponse.provider_status === 'live_api_active' ? 'Live Google Maps Platform' : 'Simulated Research Fixtures (Pending Google Maps API Key)'}
            {' · '}
            <span>Service: {discoveryResponse.searched_service}</span>
            {' · '}
            <span>Acuity: {discoveryResponse.urgency_level.toUpperCase()}</span>
          </div>

          <div className="facility-filter-actions">
            <M3Button
              variant={filterVerifiedOnly ? 'outlined' : 'text'}
              onClick={() => setFilterVerifiedOnly(v => !v)}
            >
              {filterVerifiedOnly ? '✓ Showing Verified Registry Only' : 'Show Verified Registry Only'}
            </M3Button>
            <span style={{ fontSize: '11px', color: 'var(--md-sys-color-on-surface-variant)' }}>
              ({displayedFacilities.length} of {discoveryResponse.facilities.length} facilities)
            </span>
          </div>

          <div className="facility-cards-list">
            {displayedFacilities.map(fac => (
              <div key={fac.facility_id} className="facility-card">
                <div className="facility-card-header">
                  <h4 className="facility-title">{fac.name}</h4>
                  <div className="facility-badge-group">
                    <span className="facility-badge">{fac.facility_category_display}</span>
                    <span className={`facility-badge ${fac.capability_verification_status === 'verified_registry' ? 'verified' : 'provisional'}`}>
                      {fac.capability_verification_status === 'verified_registry' ? 'Verified Registry' : 'Provisional Match'}
                    </span>
                    {fac.emergency_capable && (
                      <span className="facility-badge emergency">24x7 ER</span>
                    )}
                  </div>
                </div>

                <div className="facility-meta-row">
                  {fac.distance_text && (
                    <span><strong>Distance:</strong> {fac.distance_text}</span>
                  )}
                  {fac.travel_duration_text && (
                    <span><strong>Drive Time:</strong> {fac.travel_duration_text}</span>
                  )}
                  <span><strong>Hours:</strong> {fac.is_24x7 ? '24x7 Emergency' : fac.opening_hours_text || 'See listing'}</span>
                </div>

                <p className="facility-address">{fac.address}</p>

                {fac.ranking_reasons.length > 0 && (
                  <p className="facility-reason-list">
                    ✓ {fac.ranking_reasons.join(' · ')}
                  </p>
                )}

                <div className="facility-action-buttons">
                  <a
                    href={fac.maps_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    referrerPolicy="no-referrer"
                    style={{ textDecoration: 'none' }}
                  >
                    <M3Button variant="outlined">Open in Maps</M3Button>
                  </a>
                  <a
                    href={fac.directions_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    referrerPolicy="no-referrer"
                    style={{ textDecoration: 'none' }}
                  >
                    <M3Button variant="outlined">Get Directions</M3Button>
                  </a>
                  {fac.phone_number && (
                    <a href={`tel:${fac.phone_number}`} style={{ textDecoration: 'none' }}>
                      <M3Button variant="tonal">Call {fac.phone_number}</M3Button>
                    </a>
                  )}
                </div>
              </div>
            ))}

            {displayedFacilities.length === 0 && (
              <p style={{ fontStyle: 'italic', color: 'var(--md-sys-color-on-surface-variant)' }}>
                No facilities matched the current filter.
              </p>
            )}
          </div>

          <details style={{ fontSize: '11px', color: 'var(--md-sys-color-on-surface-variant)', marginTop: '8px' }}>
            <summary>Demonstrator Disclaimers & Governance ({discoveryResponse.disclaimers.length})</summary>
            <ul>
              {discoveryResponse.disclaimers.map((d, idx) => (
                <li key={idx}>{d}</li>
              ))}
            </ul>
          </details>
        </div>
      )}
    </details>
  );
}
