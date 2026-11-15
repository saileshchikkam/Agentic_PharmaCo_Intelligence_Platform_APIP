/**
 * Phase B3: Symptom-Matched Healthcare Facility Discovery Contracts (TypeScript).
 *
 * Versioned, research-only output contracts for MedAssist Phase B3 facility discovery
 * and Google Maps Platform integration. Non-clinical demonstration only.
 */
import type { FacilityNavigationContract, FacilityTierId } from '../medassist-precautions/precaution-contracts';
import type { UrgencyLevel } from '../medassist-severity/severity-contracts';

export type CapabilityVerificationStatus =
  | 'verified_registry'
  | 'provisional_match'
  | 'unverified_candidate';

export interface DiscoveredFacility {
  facility_id: string;
  name: string;
  facility_category: FacilityTierId;
  facility_category_display: string;
  relevant_specialties: string[];
  capability_verification_status: CapabilityVerificationStatus;
  verification_source: string;
  verification_timestamp: string;
  emergency_capable: boolean;
  address: string;
  phone_number: string | null;
  latitude: number | null;
  longitude: number | null;
  open_now: boolean | null;
  is_24x7: boolean;
  opening_hours_text: string | null;
  distance_meters: number | null;
  distance_text: string | null;
  travel_duration_seconds: number | null;
  travel_duration_text: string | null;
  maps_url: string;
  directions_url: string;
  ranking_score: number;
  ranking_reasons: string[];
}

export interface FacilityDiscoveryRequest {
  schema_version: 'medassist.facility-discovery-request.v1';
  consent_granted: boolean;
  latitude?: number | null;
  longitude?: number | null;
  manual_locality?: string | null;
  navigation_contract: FacilityNavigationContract;
  search_radius_meters?: number;
}

export interface FacilityDiscoveryResponse {
  schema_version: 'medassist.facility-discovery.v1';
  research_only: true;
  clinical_claim: false;
  provider: 'google_maps_platform_v1' | 'simulated_fixture';
  provider_status:
    | 'live_api_active'
    | 'simulated_fixtures'
    | 'live_api_pending_credentials'
    | 'live_api_failed';
  location_type: 'device_coordinates' | 'manual_locality';
  approximate_location: string;
  searched_service: string;
  urgency_level: UrgencyLevel;
  emergency_department_required: boolean;
  facilities: DiscoveredFacility[];
  exclusions_applied: string[];
  disclaimers: string[];
}
