/**
 * Phase B3: Symptom-Matched Healthcare Facility Discovery and Ranking Engine (TypeScript).
 *
 * Implements deterministic capability matching, wrong-specialty rejection,
 * emergency capability filtering, and the 5-priority accessibility ranking.
 */
import type { FacilityTierId } from '../medassist-precautions/precaution-contracts';
import type {
  DiscoveredFacility,
  FacilityDiscoveryRequest,
  FacilityDiscoveryResponse,
} from './discovery-contracts';
import { SIMULATED_FACILITIES } from './discovery-fixtures';

const GENERIC_HEALTHCARE_WORDS = new Set([
  'medicine',
  'medical',
  'clinic',
  'clinics',
  'centre',
  'centres',
  'center',
  'centers',
  'health',
  'care',
  'department',
  'departments',
  'service',
  'services',
  'practice',
  'hospital',
  'hospitals',
  'specialty',
  'speciality',
  'and',
  'for',
  'general',
]);

function matchesSpecialty(required: string, offered: string): boolean {
  const req = required.toLowerCase().trim();
  const off = offered.toLowerCase().trim();
  if (req === off || req.includes(off) || off.includes(req)) {
    return true;
  }
  const reqTokens = req.split(/[\s/&,]+/).filter(t => t.length >= 4 && !GENERIC_HEALTHCARE_WORDS.has(t));
  const offTokens = off.split(/[\s/&,]+/).filter(t => t.length >= 4 && !GENERIC_HEALTHCARE_WORDS.has(t));
  if (reqTokens.length === 0 || offTokens.length === 0) {
    return false;
  }
  return reqTokens.some(rt => offTokens.some(ot => ot.includes(rt) || rt.includes(ot)));
}

export class FacilityDiscoveryEngine {
  private fixtures: DiscoveredFacility[];

  constructor(customFixtures?: DiscoveredFacility[]) {
    this.fixtures = customFixtures ?? SIMULATED_FACILITIES;
  }

  public discoverAndRank(
    request: FacilityDiscoveryRequest,
    candidateFacilities?: DiscoveredFacility[],
    providerStatus: FacilityDiscoveryResponse['provider_status'] = 'simulated_fixtures',
  ): FacilityDiscoveryResponse {
    const nav = request.navigation_contract;
    const urgency = nav.urgency_level;
    const emergencyRequired = nav.emergency_department_required || urgency === 'extreme';
    const reqService = nav.required_service.trim().toLowerCase();
    const altService = (nav.alternative_service ?? '').trim().toLowerCase();

    const candidates = candidateFacilities ?? this.fixtures;
    const exclusionsApplied: string[] = [];
    const eligibleFacilities: DiscoveredFacility[] = [];
    const seenIds = new Set<string>();

    for (const fac of candidates) {
      // 1. Deduplicate by stable ID
      if (seenIds.has(fac.facility_id)) {
        continue;
      }
      seenIds.add(fac.facility_id);

      // 2. Category eligibility check
      const eligibleTiers: string[] = nav.eligible_facility_tiers;
      const facTier: string = fac.facility_category;
      if (eligibleTiers.length > 0 && !eligibleTiers.includes(facTier)) {
        exclusionsApplied.push(`Excluded ${fac.name}: tier '${facTier}' not in eligible tiers`);
        continue;
      }

      // 3. Emergency capability filter
      if (emergencyRequired) {
        if (!fac.emergency_capable) {
          exclusionsApplied.push(`Excluded ${fac.name}: lacks 24x7 emergency department resuscitation`);
          continue;
        }
        if (facTier === 'clinics_polyclinics' || facTier === 'diagnostic_centres') {
          exclusionsApplied.push(`Excluded ${fac.name}: outpatient-only tier excluded during emergency`);
          continue;
        }
      }

      // 4. Specialty matching
      const facSpecialties = fac.relevant_specialties.map(s => s.toLowerCase());
      let serviceMatched = false;
      let matchReason = '';

      if (emergencyRequired) {
        if (facSpecialties.some(s => s.includes('emergency') || s.includes('trauma'))) {
          serviceMatched = true;
          matchReason = '24x7 Emergency & Trauma Resuscitation capability';
        }
      } else {
        // Check match against primary required service
        for (const spec of facSpecialties) {
          if (matchesSpecialty(reqService, spec)) {
            serviceMatched = true;
            matchReason = `Primary service match: ${fac.name} offers ${spec}`;
            break;
          }
        }
        // Check alternative if primary didn't match
        if (!serviceMatched && altService) {
          for (const spec of facSpecialties) {
            if (matchesSpecialty(altService, spec)) {
              serviceMatched = true;
              matchReason = `Alternative service match: ${fac.name} offers ${spec}`;
              break;
            }
          }
        }
      }

      if (!serviceMatched) {
        // Acceptance Check 1: A general or multispecialty hospital listing returned from live discovery
        // without explicit department keywords is admitted as an unverified candidate rather than
        // falsely assigned the specialty.
        const isHospitalTier = [
          'government_general_district_hospitals',
          'private_multispecialty_hospitals',
          'superspecialty_tertiary_hospitals',
          'medical_college_hospitals',
          'small_private_hospitals',
        ].includes(facTier);

        if (fac.capability_verification_status === 'unverified_candidate' && isHospitalTier) {
          serviceMatched = true;
          matchReason = `Unverified candidate: ${fac.name} is a general hospital listing without verified ${nav.required_service} department`;
        }
      }

      if (!serviceMatched) {
        exclusionsApplied.push(`Excluded ${fac.name}: does not offer required service '${nav.required_service}' or alternative '${nav.alternative_service ?? ''}'`);
        continue;
      }

      // 5. Diagnostic centre restriction: not a substitute for clinical consultation
      if (facTier === 'diagnostic_centres' && !reqService.includes('diagnostic')) {
        exclusionsApplied.push(`Excluded ${fac.name}: diagnostic centre is not a substitute for medical consultation`);
        continue;
      }

      // 6. Rank scoring per 5 priorities
      let score = 1000.0;
      const reasons: string[] = [matchReason];

      // Priority 1: Clinical Capability & Verification
      if (fac.capability_verification_status === 'verified_registry') {
        score += 300.0;
        reasons.push('Verified facility registry credentials');
      } else if (fac.capability_verification_status === 'provisional_match') {
        score += 150.0;
        reasons.push('Provisional match on registered specialty');
      } else if (fac.capability_verification_status === 'unverified_candidate') {
        score -= 100.0;
        reasons.push('Specialty match unverified: department not confirmed in provider listing');
      }

      // Priority 2: Urgency & Availability (Open now, 24x7)
      if (emergencyRequired) {
        if (fac.is_24x7) {
          score += 400.0;
          reasons.push('24x7 continuous emergency availability');
        }
      } else {
        if (fac.open_now === true) {
          score += 200.0;
          reasons.push('Currently open for consultations');
        } else if (fac.open_now === false) {
          score -= 100.0;
          reasons.push('Currently closed; scheduled opening applies');
        }
      }

      // Priority 3 & 4: Travel Duration & Road Distance
      const durationSecs = fac.travel_duration_seconds ?? 1800;
      const distMeters = fac.distance_meters ?? 5000;
      score -= durationSecs / 10.0;
      score -= distMeters / 50.0;

      // Priority 5: Tier Appropriateness without commercial/size bias
      // A nearby single-doctor clinic must rank ahead of a large hospital when both are
      // equally appropriate and available and the clinic is more accessible.
      if (!emergencyRequired && (urgency === 'low' || urgency === 'medium')) {
        if (facTier === 'clinics_polyclinics' || facTier === 'primary_health_centres') {
          score += 150.0;
          reasons.push('Accessible primary care clinic prioritized for routine/outpatient consultation');
        } else if (facTier === 'superspecialty_tertiary_hospitals' || facTier === 'private_multispecialty_hospitals') {
          score -= 50.0;
          reasons.push('Tertiary/multi-specialty facility reserved for higher acuity');
        }
      }

      eligibleFacilities.push({
        ...fac,
        ranking_score: Math.round(score * 100) / 100,
        ranking_reasons: reasons,
      });
    }

    // Sort descending by ranking score
    eligibleFacilities.sort((a, b) => b.ranking_score - a.ranking_score);

    const locationStr =
      request.manual_locality ??
      (request.latitude !== undefined && request.latitude !== null && request.longitude !== undefined && request.longitude !== null
        ? `${request.latitude.toFixed(3)}, ${request.longitude.toFixed(3)}`
        : 'Unknown location');
    const locationType = request.manual_locality ? 'manual_locality' : 'device_coordinates';

    const disclaimers = [
      'Research-only demonstrator: facility directory information does not constitute a certified medical referral or guarantee of immediate bed availability.',
      'In a real medical emergency, immediately dial 112 / 108 or go to the nearest 24x7 Emergency Department; do not delay for navigation.',
      'Facilities are evaluated based on clinical capabilities and travel accessibility without commercial bias or hospital size preference.',
    ];

    return {
      schema_version: 'medassist.facility-discovery.v1',
      research_only: true,
      clinical_claim: false,
      provider: providerStatus === 'live_api_active' ? 'google_maps_platform_v1' : 'simulated_fixture',
      provider_status: providerStatus,
      location_type: locationType,
      approximate_location: locationStr,
      searched_service: nav.required_service,
      urgency_level: urgency,
      emergency_department_required: emergencyRequired,
      facilities: eligibleFacilities.slice(0, 5),
      exclusions_applied: exclusionsApplied,
      disclaimers,
    };
  }
}

export function discoverHealthcareFacilities(
  request: FacilityDiscoveryRequest,
  candidateFacilities?: DiscoveredFacility[],
  providerStatus: FacilityDiscoveryResponse['provider_status'] = 'simulated_fixtures',
): FacilityDiscoveryResponse {
  const engine = new FacilityDiscoveryEngine();
  return engine.discoverAndRank(request, candidateFacilities, providerStatus);
}
