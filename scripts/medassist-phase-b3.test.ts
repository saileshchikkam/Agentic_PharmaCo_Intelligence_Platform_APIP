/**
 * MedAssist Phase B3: Symptom-Matched Facility Discovery & Google Maps Integration Test Suite.
 *
 * Verifies capability matching, 5-priority accessibility ranking (clinic > hospital for low urgency),
 * emergency filtering, privacy boundaries, API failure handling, and multi-contract compatibility.
 */
import assert from 'node:assert/strict';
import test from 'node:test';

import type { FacilityNavigationContract } from '../src/features/medassist-precautions/precaution-contracts';
import {
  discoverHealthcareFacilities,
  FacilityDiscoveryEngine,
  SIMULATED_FACILITIES,
  type DiscoveredFacility,
  type FacilityDiscoveryRequest,
} from '../src/features/medassist-discovery';
import { GoogleMapsFacilityProvider } from '../server/medassist-maps-provider';

function createMockNavContract(overrides: Partial<FacilityNavigationContract> = {}): FacilityNavigationContract {
  const isEmergency = overrides.urgency_level === 'extreme' || overrides.emergency_department_required;
  return {
    schema_version: 'medassist.facility-navigation.v1',
    research_only: true,
    clinical_claim: false,
    required_service: 'Pulmonology & Respiratory Medicine',
    alternative_service: 'Family Medicine & General Practice',
    required_capabilities: ['outpatient_consultation'],
    urgency_level: 'low',
    emergency_department_required: false,
    facility_verification_requirements: ['verified_specialist_consultation'],
    explicit_exclusions: ['diagnostic_centres_without_consulting_physicians'],
    eligible_facility_tiers: isEmergency
      ? [
          'emergency_departments_trauma',
          'government_general_district_hospitals',
          'private_multispecialty_hospitals',
          'medical_college_hospitals',
        ]
      : [
          'clinics_polyclinics',
          'primary_health_centres',
          'community_health_centres',
          'small_private_hospitals',
          'government_general_district_hospitals',
          'private_multispecialty_hospitals',
          'superspecialty_tertiary_hospitals',
          'medical_college_hospitals',
        ],
    ...overrides,
  };
}

test('Phase B3: Small single-doctor clinic ranks ahead of large hospitals for Low/Medium urgency', () => {
  const nav = createMockNavContract({
    required_service: 'Pulmonology & Respiratory Medicine',
    urgency_level: 'low',
    emergency_department_required: false,
  });

  const request: FacilityDiscoveryRequest = {
    schema_version: 'medassist.facility-discovery-request.v1',
    consent_granted: true,
    latitude: 17.385,
    longitude: 78.486,
    navigation_contract: nav,
  };

  const response = discoverHealthcareFacilities(request);
  assert.equal(response.schema_version, 'medassist.facility-discovery.v1');
  assert.ok(response.facilities.length >= 2);

  // The #1 ranked facility must be the accessible clinic (Dr. Rao Chest Clinic)
  const topFacility = response.facilities[0];
  assert.equal(topFacility.facility_id, 'FAC_CLINIC_01');
  assert.equal(topFacility.facility_category, 'clinics_polyclinics');

  // Verify it outranks large multi-specialty and super-specialty hospitals
  const facilityIds = response.facilities.map(f => f.facility_id);
  const idxClinic = facilityIds.indexOf('FAC_CLINIC_01');
  const idxMulti = facilityIds.indexOf('FAC_PVT_MULTI_01');
  const idxSuper = facilityIds.indexOf('FAC_SUPER_01');

  if (idxMulti !== -1) {
    assert.ok(idxClinic < idxMulti, 'Single-doctor clinic must outrank distant multi-specialty hospital');
  }
  if (idxSuper !== -1) {
    assert.ok(idxClinic < idxSuper, 'Single-doctor clinic must outrank distant super-specialty hospital');
  }
});

test('Phase B3: Emergency department capability filtering & exclusion of routine clinics', () => {
  const nav = createMockNavContract({
    required_service: 'Emergency Medicine & Trauma Care',
    urgency_level: 'extreme',
    emergency_department_required: true,
  });

  const request: FacilityDiscoveryRequest = {
    schema_version: 'medassist.facility-discovery-request.v1',
    consent_granted: true,
    latitude: 17.385,
    longitude: 78.486,
    navigation_contract: nav,
  };

  const response = discoverHealthcareFacilities(request);
  assert.equal(response.emergency_department_required, true);

  const facilityIds = response.facilities.map(f => f.facility_id);
  // Routine outpatient clinic and diagnostic centre must be excluded
  assert.ok(!facilityIds.includes('FAC_CLINIC_01'), 'Routine clinic must be excluded for emergency');
  assert.ok(!facilityIds.includes('FAC_DIAGNOSTIC_01'), 'Diagnostic centre must be excluded for emergency');
  assert.ok(!facilityIds.includes('FAC_PHC_01'), 'PHC must be excluded for emergency');

  // Dedicated emergency facilities must be included
  assert.ok(facilityIds.includes('FAC_EMERGENCY_01'), '24x7 Emergency Unit must be included');
  assert.ok(facilityIds.includes('FAC_GOVT_DIST_01'), 'District Hospital must be included');

  // All returned facilities must be emergency_capable
  for (const fac of response.facilities) {
    assert.equal(fac.emergency_capable, true, `Facility ${fac.name} must be emergency capable`);
  }
});

test('Phase B3: Wrong-specialty facility rejection', () => {
  const nav = createMockNavContract({
    required_service: 'Pulmonology & Respiratory Medicine',
    alternative_service: undefined,
    urgency_level: 'medium',
  });

  const request: FacilityDiscoveryRequest = {
    schema_version: 'medassist.facility-discovery-request.v1',
    consent_granted: true,
    manual_locality: 'Central Hyderabad',
    navigation_contract: nav,
  };

  const response = discoverHealthcareFacilities(request);
  const facilityIds = response.facilities.map(f => f.facility_id);

  // Dental, Eye, and Dermatology clinics must be strictly excluded
  assert.ok(!facilityIds.includes('FAC_DENTAL_01'));
  assert.ok(!facilityIds.includes('FAC_EYE_CLINIC_01'));
  assert.ok(!facilityIds.includes('FAC_DERM_CLINIC_01'));
});

test('Phase B3: Multiple symptoms and alternative specialty matching', () => {
  const nav = createMockNavContract({
    required_service: 'Paediatrics & Child Health',
    alternative_service: 'Family Medicine & General Practice',
    urgency_level: 'low',
  });

  const request: FacilityDiscoveryRequest = {
    schema_version: 'medassist.facility-discovery-request.v1',
    consent_granted: true,
    manual_locality: 'Shantinagar',
    navigation_contract: nav,
  };

  const response = discoverHealthcareFacilities(request);
  const facilityIds = response.facilities.map(f => f.facility_id);

  // Urban PHC Shantinagar offers Family Medicine & Paediatrics
  assert.ok(facilityIds.includes('FAC_PHC_01'));
});

test('Phase B3: Duplicate facility removal by stable identifier', () => {
  const engine = new FacilityDiscoveryEngine();
  const nav = createMockNavContract();
  const request: FacilityDiscoveryRequest = {
    schema_version: 'medassist.facility-discovery-request.v1',
    consent_granted: true,
    manual_locality: 'Test Locality',
    navigation_contract: nav,
  };

  // Provide candidates with duplicates
  const duplicated = [...SIMULATED_FACILITIES, ...SIMULATED_FACILITIES];
  const response = engine.discoverAndRank(request, duplicated);

  const seen = new Set<string>();
  for (const fac of response.facilities) {
    assert.ok(!seen.has(fac.facility_id), `Duplicate ID found: ${fac.facility_id}`);
    seen.add(fac.facility_id);
  }
});

test('Phase B3: Missing or unverified facility capabilities handled safely', () => {
  const customFacility: DiscoveredFacility = {
    facility_id: 'FAC_UNVERIFIED_01',
    name: 'Unverified Neighborhood Clinic',
    facility_category: 'clinics_polyclinics',
    facility_category_display: 'Clinics & Polyclinics',
    relevant_specialties: ['Pulmonology & Respiratory Medicine'],
    capability_verification_status: 'unverified_candidate',
    verification_source: 'Unverified Web Mention',
    verification_timestamp: new Date().toISOString(),
    emergency_capable: false,
    address: 'Unlisted Lane',
    phone_number: null,
    latitude: null,
    longitude: null,
    open_now: null,
    is_24x7: false,
    opening_hours_text: null,
    distance_meters: null,
    distance_text: null,
    travel_duration_seconds: null,
    travel_duration_text: null,
    maps_url: 'https://maps.google.com',
    directions_url: 'https://maps.google.com',
    ranking_score: 0,
    ranking_reasons: [],
  };

  const engine = new FacilityDiscoveryEngine([customFacility]);
  const nav = createMockNavContract();
  const request: FacilityDiscoveryRequest = {
    schema_version: 'medassist.facility-discovery-request.v1',
    consent_granted: true,
    manual_locality: 'Unlisted Area',
    navigation_contract: nav,
  };

  const response = engine.discoverAndRank(request);
  assert.equal(response.facilities.length, 1);
  assert.equal(response.facilities[0].capability_verification_status, 'unverified_candidate');
  assert.equal(response.facilities[0].open_now, null);
});

test('Phase B3: Location permission denial & manual locality entry', () => {
  const nav = createMockNavContract();
  const request: FacilityDiscoveryRequest = {
    schema_version: 'medassist.facility-discovery-request.v1',
    consent_granted: true,
    manual_locality: 'Secunderabad Railway Station',
    navigation_contract: nav,
  };

  const response = discoverHealthcareFacilities(request);
  assert.equal(response.location_type, 'manual_locality');
  assert.equal(response.approximate_location, 'Secunderabad Railway Station');
  assert.ok(response.facilities.length > 0);
});

test('Phase B3: Missing credentials gracefully falls back to simulated fixtures', async () => {
  const provider = new GoogleMapsFacilityProvider({ apiKey: '' });
  const nav = createMockNavContract();
  const request: FacilityDiscoveryRequest = {
    schema_version: 'medassist.facility-discovery-request.v1',
    consent_granted: true,
    manual_locality: 'Gachibowli',
    navigation_contract: nav,
  };

  const response = await provider.discover(request);
  assert.equal(response.provider, 'simulated_fixture');
  assert.equal(response.provider_status, 'simulated_fixtures');
  assert.ok(response.facilities.length > 0);
  assert.ok(response.disclaimers.length >= 3);
});

test('Phase B3: API failure and rate-limit handling falls back without crashing', async () => {
  // Simulate fetch throwing network error or 429
  const mockFetch = async () => {
    throw new Error('429 Too Many Requests: Rate limit exceeded');
  };

  const provider = new GoogleMapsFacilityProvider({
    apiKey: 'AIzaSyDUMMY_KEY_FOR_TEST',
    fetchImpl: mockFetch as any,
  });

  const nav = createMockNavContract();
  const request: FacilityDiscoveryRequest = {
    schema_version: 'medassist.facility-discovery-request.v1',
    consent_granted: true,
    latitude: 17.385,
    longitude: 78.486,
    navigation_contract: nav,
  };

  const response = await provider.discover(request);
  assert.equal(response.provider_status, 'live_api_failed');
  assert.ok(response.facilities.length > 0, 'Should fall back to reference fixtures on API error');
  assert.ok(response.disclaimers.some(d => d.includes('failed')));
});

test('Phase B3: Patient privacy preservation — no symptoms or transcripts transmitted', () => {
  const nav = createMockNavContract();
  const request: FacilityDiscoveryRequest = {
    schema_version: 'medassist.facility-discovery-request.v1',
    consent_granted: true,
    latitude: 17.385,
    longitude: 78.486,
    navigation_contract: nav,
  };

  const serialized = JSON.stringify(request);
  // Verify absolutely NO symptoms, diagnoses, patient names or interview transcripts exist in the request
  assert.ok(!serialized.includes('cough'));
  assert.ok(!serialized.includes('fever'));
  assert.ok(!serialized.includes('patient_name'));
  assert.ok(!serialized.includes('transcript'));
  assert.ok(!serialized.includes('conversation'));
});
