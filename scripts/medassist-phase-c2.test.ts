import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  FacilityDiscoveryEngine,
  discoverHealthcareFacilities,
} from '../src/features/medassist-discovery/discovery-engine';
import { GoogleMapsFacilityProvider } from '../server/medassist-maps-provider';
import type { FacilityDiscoveryRequest } from '../src/features/medassist-discovery/discovery-contracts';
import type { FacilityNavigationContract } from '../src/features/medassist-precautions/precaution-contracts';

console.log('=== APIP MedAssist Phase C2: Intelligent Nearest Hospital Recommendation Verification Suite ===\n');

// ---------------------------------------------------------------------------
// Gate 1: Symptom-Based Hospital Matching & 5-Facility Cap
// ---------------------------------------------------------------------------
console.log('Gate 1: Verifying Symptom-Based Hospital Matching & 5-Facility Cap...');

const pulmonaryContract: FacilityNavigationContract = {
  schema_version: 'medassist.facility-navigation.v1',
  research_only: true,
  clinical_claim: false,
  required_service: 'Pulmonology & Respiratory Medicine',
  alternative_service: 'Family Medicine & General Practice',
  required_capabilities: ['outpatient_consultation', 'pulmonary_function_testing'],
  urgency_level: 'medium',
  emergency_department_required: false,
  facility_verification_requirements: ['verified_specialist_consultation'],
  explicit_exclusions: ['diagnostic_centres'],
  eligible_facility_tiers: [
    'clinics_polyclinics',
    'small_private_hospitals',
    'government_general_district_hospitals',
    'private_multispecialty_hospitals',
    'superspecialty_tertiary_hospitals',
  ],
};

const pulmonaryReq: FacilityDiscoveryRequest = {
  schema_version: 'medassist.facility-discovery-request.v1',
  consent_granted: true,
  manual_locality: 'Banjara Hills, Hyderabad',
  navigation_contract: pulmonaryContract,
  search_radius_meters: 10000,
};

const pulmonaryResult = discoverHealthcareFacilities(pulmonaryReq);

assert(pulmonaryResult.facilities.length > 0, 'FAIL: Must discover matching facilities for Pulmonology');
assert(pulmonaryResult.facilities.length <= 5, `FAIL: Max 5 facilities allowed, got ${pulmonaryResult.facilities.length}`);
console.log(`- Discovered ${pulmonaryResult.facilities.length} hospitals for Pulmonology (Cap <= 5 verified)`);

// Verify matching: all returned facilities must match required or alternative service
for (const fac of pulmonaryResult.facilities) {
  const specs = fac.relevant_specialties.join(' ').toLowerCase();
  const matches = specs.includes('pulmonology') || specs.includes('respiratory') || specs.includes('family medicine') || specs.includes('general practice');
  assert(matches, `FAIL: Facility ${fac.name} (${specs}) does not match Pulmonology or General Practice`);
  assert(fac.capability_verification_status, `FAIL: Facility ${fac.name} missing capability verification status`);
  console.log(`  • ${fac.name} [${fac.facility_category_display}] - ${fac.capability_verification_status}`);
}

// Verify wrong-specialty exclusion
assert(pulmonaryResult.exclusions_applied.length > 0, 'FAIL: Exclusions must be applied for non-matching specialties');
const hasDermOrOrthoExclusion = pulmonaryResult.exclusions_applied.some(e => e.includes('does not offer required service'));
assert(hasDermOrOrthoExclusion, 'FAIL: Non-pulmonary facilities must be excluded');

console.log('✓ Gate 1 passed: Symptom-based hospital matching & 5-facility cap strictly enforced.\n');

// ---------------------------------------------------------------------------
// Gate 2: Location Acquisition & No Fictional Defaults
// ---------------------------------------------------------------------------
console.log('Gate 2: Verifying Location Acquisition & No Fictional Defaults...');

// A: Manual locality used in search
const pinCodeReq: FacilityDiscoveryRequest = {
  schema_version: 'medassist.facility-discovery-request.v1',
  consent_granted: true,
  manual_locality: '500034',
  navigation_contract: pulmonaryContract,
};
const pinCodeResult = discoverHealthcareFacilities(pinCodeReq);
assert.equal(pinCodeResult.location_type, 'manual_locality');
assert.equal(pinCodeResult.approximate_location, '500034');
console.log(`- Manual PIN code search verified: ${pinCodeResult.approximate_location}`);

// B: Check HospitalNavigation.tsx source for zero fictional defaults
const navSrc = fs.readFileSync(path.resolve('src/features/medassist-safety/HospitalNavigation.tsx'), 'utf8');
assert(!navSrc.includes("'Central City'"), 'FAIL: Must NOT contain fictional default "Central City"');
assert(navSrc.includes('Use My Location'), 'FAIL: Must provide "Use My Location" option');
assert(navSrc.includes('Enter City / Area / PIN Code'), 'FAIL: Must provide "Enter City / Area / PIN Code" option');
assert(navSrc.includes('LOCATION_PERMISSION_DENIED'), 'FAIL: Must handle location permission denied explicitly');

console.log('✓ Gate 2 passed: Location acquisition verified with zero fictional default locations.\n');

// ---------------------------------------------------------------------------
// Gate 3: Genuine Hospital Discovery & Honest Distance/Time Labeling
// ---------------------------------------------------------------------------
console.log('Gate 3: Verifying Genuine Discovery & Honest Distance/Time Labeling...');

// A: Test GoogleMapsFacilityProvider when API key is unset
const providerNoKey = new GoogleMapsFacilityProvider({ apiKey: '' });
const resNoKey = await providerNoKey.discover(pulmonaryReq);
assert.equal(resNoKey.provider_status, 'live_api_pending_credentials');
assert(resNoKey.disclaimers.some(d => d.includes('GOOGLE_MAPS_API_KEY is not configured')),
  'FAIL: Must clearly communicate when GOOGLE_MAPS_API_KEY is not configured');

// B: Test GoogleMapsFacilityProvider with simulated Places API response
const mockPlaces = [
  {
    id: 'ChIJ_TEST_HOSPITAL_01',
    displayName: { text: 'Apollo Jubilee Hills Respiratory Centre' },
    formattedAddress: 'Road No 72, Jubilee Hills, Hyderabad, Telangana 500033',
    location: { latitude: 17.426, longitude: 78.411 },
    types: ['hospital', 'health'],
    regularOpeningHours: { openNow: true },
    nationalPhoneNumber: '+91 40 2360 7777',
    googleMapsUri: 'https://maps.google.com/?cid=12345',
  },
  {
    id: 'ChIJ_TEST_HOSPITAL_02',
    displayName: { text: 'Care Hospital Banjara Hills' },
    formattedAddress: 'Road No 1, Banjara Hills, Hyderabad, Telangana 500034',
    location: { latitude: 17.416, longitude: 78.448 },
    types: ['hospital'],
    regularOpeningHours: { openNow: true },
    nationalPhoneNumber: '+91 40 3041 8888',
    googleMapsUri: 'https://maps.google.com/?cid=67890',
  },
];

const mockFetch: typeof fetch = async (url, init) => {
  const urlStr = String(url);
  if (urlStr.includes('places:searchText')) {
    return new Response(JSON.stringify({ places: mockPlaces }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  // Mock computeRoutes failing gracefully to test honest straight-line fallback
  if (urlStr.includes('computeRoutes')) {
    return new Response(JSON.stringify({ error: 'ROUTES_API_DISABLED' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  return new Response('Not found', { status: 404 });
};

const providerMock = new GoogleMapsFacilityProvider({
  apiKey: 'MOCK_KEY_FOR_TEST',
  fetchImpl: mockFetch,
});

const liveRes = await providerMock.discover({
  ...pulmonaryReq,
  latitude: 17.420,
  longitude: 78.430,
});

assert.equal(liveRes.provider_status, 'live_api_active');
assert.equal(liveRes.facilities.length, 2);
const facilityNames = liveRes.facilities.map(f => f.name);
assert(facilityNames.includes('Apollo Jubilee Hills Respiratory Centre'),
  'FAIL: Must discover Apollo Jubilee Hills Respiratory Centre');
assert(facilityNames.includes('Care Hospital Banjara Hills'),
  'FAIL: Must discover Care Hospital Banjara Hills');

for (const liveFac of liveRes.facilities) {
  assert(liveFac.distance_text?.includes('approx. straight-line'),
    `FAIL: Distance must be honestly labeled approx. straight-line when Routes API unverified. Got: ${liveFac.distance_text}`);
  assert.equal(liveFac.travel_duration_text, null,
    'FAIL: Travel duration must be null (never fabricated) when live traffic routes are unverified');
  assert(liveFac.directions_url.includes('google.com/maps/dir'),
    'FAIL: Directions URL must be present and point to Google Maps directions');
  assert(liveFac.phone_number, 'FAIL: Phone number must be present if provided by Google Places');
  assert.equal(liveFac.capability_verification_status, 'provisional_match');
}

console.log('✓ Gate 3 passed: Genuine hospital discovery with honest distance & unverified traffic handling verified.\n');

// ---------------------------------------------------------------------------
// Gate 4: Emergency Safety (Extreme Acuity)
// ---------------------------------------------------------------------------
console.log('Gate 4: Verifying Emergency Safety & Prioritization...');

const emergencyContract: FacilityNavigationContract = {
  schema_version: 'medassist.facility-navigation.v1',
  research_only: true,
  clinical_claim: false,
  required_service: '24x7 Emergency Medicine & Trauma Care',
  alternative_service: null,
  required_capabilities: ['emergency_resuscitation', 'advanced_cardiac_life_support'],
  urgency_level: 'extreme',
  emergency_department_required: true,
  facility_verification_requirements: ['verified_24x7_emergency_department'],
  explicit_exclusions: ['clinics_polyclinics', 'diagnostic_centres'],
  eligible_facility_tiers: [
    'emergency_departments_trauma',
    'government_general_district_hospitals',
    'private_multispecialty_hospitals',
    'medical_college_hospitals',
  ],
};

const emergencyReq: FacilityDiscoveryRequest = {
  schema_version: 'medassist.facility-discovery-request.v1',
  consent_granted: true,
  manual_locality: 'Secunderabad',
  navigation_contract: emergencyContract,
};

const emergencyResult = discoverHealthcareFacilities(emergencyReq);

assert(emergencyResult.facilities.length > 0, 'FAIL: Must return emergency facilities');
for (const fac of emergencyResult.facilities) {
  assert(fac.emergency_capable, `FAIL: Facility ${fac.name} must be emergency capable`);
  assert(fac.facility_category !== 'clinics_polyclinics', `FAIL: Clinics forbidden in emergency (${fac.name})`);
  assert(fac.facility_category !== 'diagnostic_centres', `FAIL: Diagnostic centres forbidden in emergency (${fac.name})`);
  console.log(`  🚨 ${fac.name} [${fac.facility_category_display}] - ER Capable: ${fac.emergency_capable}`);
}

assert(navSrc.includes('emergency-call-btn'), 'FAIL: Must feature prominent 112/108 emergency call buttons');
assert(navSrc.includes('tel:112'), 'FAIL: Must link to emergency tel:112');
assert(navSrc.includes('tel:108'), 'FAIL: Must link to ambulance tel:108');

console.log('✓ Gate 4 passed: Emergency safety, 24x7 ER prioritization, and 112/108 access verified.\n');

// ---------------------------------------------------------------------------
// Gate 5: Provider Failure, Cost Control & External Maps Link
// ---------------------------------------------------------------------------
console.log('Gate 5: Verifying Provider Failure, Cost Control & External Maps Fallback...');

assert(navSrc.includes('Live Lookup Unavailable (API Key Not Configured)'),
  'FAIL: Must clearly communicate when live API lookup is unavailable');
assert(navSrc.includes('Search Google Maps for'),
  'FAIL: Must provide direct specialty-specific external Google Maps search fallback');
assert(navSrc.includes('[Simulated Research Fixture]'),
  'FAIL: Must prominently tag simulated reference fixtures');

// Check that no Google Maps API keys are hardcoded in client source files
const clientSrc = fs.readFileSync(path.resolve('src/features/medassist-safety/HospitalNavigation.tsx'), 'utf8') +
                  fs.readFileSync(path.resolve('src/features/medassist-conversation/MedAssistConversation.tsx'), 'utf8');
assert(!/AIza[0-9A-Za-z-_]{35}/.test(clientSrc), 'FAIL: No Google Maps API key may be exposed in client code');

console.log('✓ Gate 5 passed: Provider failure messaging, external search fallback, and zero client key exposure verified.\n');

// ---------------------------------------------------------------------------
// Gate 6: UI Placement & Session Lifecycle Gating
// ---------------------------------------------------------------------------
console.log('Gate 6: Verifying UI Placement & Session Lifecycle Gating...');

const conversationSrc = fs.readFileSync(path.resolve('src/features/medassist-conversation/MedAssistConversation.tsx'), 'utf8');

// Check that HospitalNavigation is placed AFTER Recommended Precautions
const precautionsIndex = conversationSrc.indexOf('className="assessment-precautions-card"');
const hospitalIndex = conversationSrc.indexOf('className="assessment-hospital-card"');

assert(precautionsIndex !== -1, 'FAIL: Recommended Precautions card must exist');
assert(hospitalIndex !== -1, 'FAIL: Assessment hospital card must exist');
assert(hospitalIndex > precautionsIndex, 'FAIL: Hospital card must be placed AFTER Recommended Precautions box');

// Check that it is gated on session completion or emergency
assert.match(conversationSrc, /\{\(finished\s*\|\|\s*!!emergency\s*\|\|\s*!!urgencyAssessment\.emergency_override\s*\|\|\s*showNavigation\)\s*&&\s*\(\s*<div className="assessment-hospital-card">/,
  'FAIL: Hospital card must be conditionally rendered upon session completion or emergency');

// Check that restart() clears navigation state
assert(conversationSrc.includes('setNavigationSession(v => v + 1);'),
  'FAIL: restart() must increment navigationSession to reset hospital navigation component');
assert(conversationSrc.includes('setShowNavigation(false);'),
  'FAIL: restart() must set showNavigation to false');

console.log('✓ Gate 6 passed: UI placement after Recommended Precautions and restart lifecycle verified.\n');

console.log('=== All Phase C2 Verification Gates Passed Successfully! ===');
