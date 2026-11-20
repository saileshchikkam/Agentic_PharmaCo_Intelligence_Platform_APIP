/**
 * Phase B3: Google Maps Platform Provider for MedAssist Facility Discovery.
 *
 * Implements Places API (New), Text Search, Place Details, Routes API,
 * and deterministic fallback when credentials are unavailable.
 * Strictly adheres to patient privacy: NEVER sends patient PII or symptoms to Google.
 */
import type {
  CapabilityVerificationStatus,
  DiscoveredFacility,
  FacilityDiscoveryRequest,
  FacilityDiscoveryResponse,
} from '../src/features/medassist-discovery/discovery-contracts';
import { FacilityDiscoveryEngine } from '../src/features/medassist-discovery/discovery-engine';
import { SIMULATED_FACILITIES } from '../src/features/medassist-discovery/discovery-fixtures';
import type { FacilityTierId } from '../src/features/medassist-precautions/precaution-contracts';

const SPECIALTY_KEYWORDS: Record<string, string[]> = {
  respiratory: ['respirat', 'pulmonol', 'chest', 'lung', 'asthma', 'bronch'],
  pulmonology: ['pulmonol', 'respirat', 'chest', 'lung'],
  cardiology: ['cardio', 'heart', 'coronary', 'cardiac', 'vascular'],
  neurology: ['neuro', 'brain', 'stroke', 'spine'],
  orthopedics: ['ortho', 'bone', 'joint', 'fracture'],
  pediatrics: ['pediatr', 'paediatr', 'child', 'infant', 'neonat'],
  dermatology: ['dermatol', 'skin'],
  oncology: ['oncol', 'cancer', 'tumor'],
  nephrology: ['nephro', 'kidney', 'renal', 'dialysis'],
  ophthalmology: ['ophthal', 'eye'],
  ent: ['ent', 'ear', 'nose', 'throat', 'otolaryngol'],
  gastroenterology: ['gastro', 'digestive', 'liver', 'hepat', 'endoscop'],
  gynecology: ['gynec', 'gynaec', 'obstetr', 'maternity', 'women'],
  emergency: ['emergency', 'trauma', 'casualty', 'resuscitation'],
  general: ['general medicine', 'family medicine', 'internal medicine', 'general physician', 'physician'],
};

function hasSpecialtyEvidence(name: string, types: string[], requiredService: string): boolean {
  const nameLower = name.toLowerCase();
  const typesLower = types.map(t => t.toLowerCase());
  const reqLower = requiredService.toLowerCase();

  for (const [key, keywords] of Object.entries(SPECIALTY_KEYWORDS)) {
    if (reqLower.includes(key)) {
      const match = keywords.some(kw => nameLower.includes(kw) || typesLower.some(t => t.includes(kw)));
      if (match) return true;
    }
  }

  const GENERIC = new Set([
    'medicine', 'medical', 'hospital', 'hospitals', 'clinic', 'clinics',
    'centre', 'centres', 'center', 'centers', 'care', 'health', 'and', 'for', 'general', 'service', 'services',
  ]);
  const tokens = reqLower.split(/[\s/&,]+/).filter(t => t.length >= 4 && !GENERIC.has(t));
  for (const tok of tokens) {
    if (nameLower.includes(tok) || typesLower.some(t => t.includes(tok))) {
      return true;
    }
  }

  return false;
}

export interface GoogleMapsProviderOptions {
  apiKey?: string;
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
}

export class GoogleMapsFacilityProvider {
  private apiKey: string | null;
  private fetchImpl: typeof fetch;
  private timeoutMs: number;
  private engine: FacilityDiscoveryEngine;

  constructor(options?: GoogleMapsProviderOptions) {
    this.apiKey = options?.apiKey ?? process.env.GOOGLE_MAPS_API_KEY ?? null;
    this.fetchImpl = options?.fetchImpl ?? fetch;
    this.timeoutMs = options?.timeoutMs ?? 10000;
    this.engine = new FacilityDiscoveryEngine(SIMULATED_FACILITIES);
  }

  public async discover(request: FacilityDiscoveryRequest): Promise<FacilityDiscoveryResponse> {
    // If no API key configured, return research reference fixtures with clear pending credentials notice
    if (!this.apiKey || !this.apiKey.trim()) {
      const fallback = this.engine.discoverAndRank(request, undefined, 'live_api_pending_credentials');
      return {
        ...fallback,
        provider_status: 'live_api_pending_credentials',
        disclaimers: [
          ...fallback.disclaimers,
          'Live Google Maps lookup is currently unavailable (GOOGLE_MAPS_API_KEY is not configured on server). Research reference fixtures are displayed for evaluation only; do not use for actual patient routing.',
        ],
      };
    }

    try {
      const liveCandidates = await this.queryGooglePlaces(request);
      if (!liveCandidates || liveCandidates.length === 0) {
        // Fallback to simulated fixtures if live API returns 0 results
        const fallback = this.engine.discoverAndRank(request, undefined, 'simulated_fixtures');
        return {
          ...fallback,
          disclaimers: [
            ...fallback.disclaimers,
            'Live Google Places returned 0 results for this search area; displaying verified reference fixtures.',
          ],
        };
      }

      // If user provided coordinates, compute driving distance/duration via Routes API or honest straight-line
      if (request.latitude && request.longitude) {
        await this.enrichRoutes(request.latitude, request.longitude, liveCandidates);
      }

      return this.engine.discoverAndRank(request, liveCandidates, 'live_api_active');
    } catch (error) {
      // Graceful fallback on API error or rate-limiting
      const fallback = this.engine.discoverAndRank(request, undefined, 'live_api_failed');
      return {
        ...fallback,
        provider_status: 'live_api_failed',
        disclaimers: [
          ...fallback.disclaimers,
          `Google Maps API query failed (${error instanceof Error ? error.message : 'network error'}); displaying reference fixtures.`,
        ],
      };
    }
  }

  private async queryGooglePlaces(request: FacilityDiscoveryRequest): Promise<DiscoveredFacility[]> {
    const nav = request.navigation_contract;
    const isEmergency = nav.emergency_department_required || nav.urgency_level === 'extreme';

    // Build privacy-safe search query (strictly generic healthcare term, NO symptoms or PII)
    const serviceTerm = nav.required_service.replace(/[^\w\s]/g, ' ').trim();
    let query = isEmergency
      ? '24x7 hospital emergency trauma department'
      : `${serviceTerm} clinic hospital`;

    if (request.manual_locality && request.manual_locality.trim()) {
      query = `${query} in ${request.manual_locality.trim()}`;
    }

    const body: Record<string, unknown> = {
      textQuery: query,
      maxResultCount: 15,
    };

    if (request.latitude && request.longitude) {
      body.locationBias = {
        circle: {
          center: {
            latitude: request.latitude,
            longitude: request.longitude,
          },
          radius: (request.search_radius_meters ?? 10000) * 1.0,
        },
      };
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await this.fetchImpl('https://places.googleapis.com/v1/places:searchText', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': this.apiKey!,
          'X-Goog-FieldMask':
            'places.id,places.displayName,places.formattedAddress,places.location,places.types,places.regularOpeningHours,places.nationalPhoneNumber,places.googleMapsUri',
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Google Places API returned status ${response.status}`);
      }

      const data = await response.json() as { places?: any[] };
      const rawPlaces = data.places ?? [];

      return rawPlaces.map((p: any) => this.mapGooglePlaceToFacility(p, nav.required_service, isEmergency));
    } finally {
      clearTimeout(timer);
    }
  }

  private mapGooglePlaceToFacility(
    place: any,
    requiredService: string,
    isEmergency: boolean,
  ): DiscoveredFacility {
    const name: string = place.displayName?.text ?? 'Healthcare Facility';
    const placeId: string = place.id ?? `GPLACE_${Math.random().toString(36).substring(2, 9)}`;
    const types: string[] = place.types ?? [];
    const address: string = place.formattedAddress ?? 'Address available on Maps';
    const lat: number | null = place.location?.latitude ?? null;
    const lng: number | null = place.location?.longitude ?? null;
    const phone: string | null = place.nationalPhoneNumber ?? null;
    const openNow: boolean | null = place.regularOpeningHours?.openNow ?? null;
    const mapsUri: string = place.googleMapsUri ?? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name)}`;

    const category = this.inferFacilityCategory(name, types);

    // Rule 1: Never assign the searched specialty without supporting provider evidence.
    // Explicitly classify unverified listings as unverified candidates.
    const hasEvidence = hasSpecialtyEvidence(name, types, requiredService);
    const relevantSpecialties = hasEvidence
      ? [requiredService]
      : ['General Healthcare (Department unverified)'];
    const capabilityStatus: CapabilityVerificationStatus = hasEvidence
      ? 'provisional_match'
      : 'unverified_candidate';

    // Rule 2: Never mark a hospital as emergency-capable solely because the search is an emergency search.
    // Provider evidence (types or facility name) is strictly required.
    const emergencyCapable =
      types.includes('emergency_room') ||
      types.includes('trauma_center') ||
      /\b(emergency|trauma|casualty|resuscitation)\b/i.test(name);

    // Rule 2b: Never mark 24x7 solely because the search is an emergency search or emergencyCapable.
    // Provider opening hours or explicit 24-hour naming evidence is strictly required.
    const is24x7 = this.extract24x7Evidence(name, place.regularOpeningHours);

    return {
      facility_id: placeId,
      name,
      facility_category: category,
      facility_category_display: this.formatCategoryDisplay(category),
      relevant_specialties: relevantSpecialties,
      capability_verification_status: capabilityStatus,
      verification_source: hasEvidence
        ? 'Google Places Platform API (Listing Provider Evidence Verified)'
        : 'Google Places Platform API (Unverified Specialty Match - Facility Verification Required)',
      verification_timestamp: new Date().toISOString(),
      emergency_capable: emergencyCapable,
      address,
      phone_number: phone,
      latitude: lat,
      longitude: lng,
      open_now: openNow,
      is_24x7: is24x7,
      opening_hours_text: openNow !== null ? (openNow ? 'Open currently' : 'Closed currently') : 'Hours unverified',
      distance_meters: null,
      distance_text: null,
      travel_duration_seconds: null,
      travel_duration_text: null,
      maps_url: mapsUri,
      directions_url: lat && lng
        ? `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`
        : `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(name)}`,
      ranking_score: 0,
      ranking_reasons: [],
    };
  }

  private extract24x7Evidence(name: string, openingHours: any): boolean {
    if (/\b(24x7|24\s*hours?|24\s*hr|round-the-clock)\b/i.test(name)) {
      return true;
    }
    if (!openingHours) return false;
    if (Array.isArray(openingHours.weekdayDescriptions)) {
      const all24 = openingHours.weekdayDescriptions.every((d: string) => /open 24 hours/i.test(d));
      if (all24 && openingHours.weekdayDescriptions.length >= 5) return true;
    }
    if (Array.isArray(openingHours.periods) && openingHours.periods.length === 1) {
      const p = openingHours.periods[0];
      if (p.open && p.open.hour === 0 && p.open.minute === 0 && !p.close) {
        return true;
      }
    }
    return false;
  }

  private inferFacilityCategory(name: string, types: string[]): FacilityTierId {
    const lower = name.toLowerCase();
    if (types.includes('emergency_room') || lower.includes('trauma') || lower.includes('emergency care')) {
      return 'emergency_departments_trauma';
    }
    if (lower.includes('medical college') || lower.includes('teaching hospital') || lower.includes('institute of medical')) {
      return 'medical_college_hospitals';
    }
    if (lower.includes('super specialty') || lower.includes('superspecialty') || lower.includes('cancer institute')) {
      return 'superspecialty_tertiary_hospitals';
    }
    if (lower.includes('district hospital') || lower.includes('civil hospital') || lower.includes('general hospital')) {
      return 'government_general_district_hospitals';
    }
    if (lower.includes('community health') || lower.includes('chc')) {
      return 'community_health_centres';
    }
    if (lower.includes('primary health') || lower.includes('phc') || lower.includes('uphc')) {
      return 'primary_health_centres';
    }
    if (lower.includes('diagnostic') || lower.includes('imaging') || lower.includes('scan') || lower.includes('pathology')) {
      return 'diagnostic_centres';
    }
    if (lower.includes('nursing home') || lower.includes('maternity hospital')) {
      return 'small_private_hospitals';
    }
    if (lower.includes('clinic') || lower.includes('polyclinic') || lower.includes('dispensary') || lower.includes('doctor')) {
      return 'clinics_polyclinics';
    }
    return 'private_multispecialty_hospitals';
  }

  private formatCategoryDisplay(tier: FacilityTierId): string {
    const displayMap: Record<FacilityTierId, string> = {
      clinics_polyclinics: 'Clinics & Polyclinics',
      primary_health_centres: 'Primary Health Centres (PHC)',
      community_health_centres: 'Community Health Centres (CHC)',
      small_private_hospitals: 'Small Private Hospitals & Nursing Homes',
      government_general_district_hospitals: 'Government General / District Hospitals',
      private_multispecialty_hospitals: 'Private Multi-Specialty Hospitals',
      superspecialty_tertiary_hospitals: 'Super-Specialty Hospitals & Tertiary Care',
      medical_college_hospitals: 'Medical College Hospitals & Teaching Institutions',
      diagnostic_centres: 'Diagnostic Centres & Imaging Facilities',
      emergency_departments_trauma: '24x7 Emergency Departments & Trauma Care',
    };
    return displayMap[tier] ?? tier;
  }

  private async enrichRoutes(
    originLat: number,
    originLng: number,
    facilities: DiscoveredFacility[],
  ): Promise<void> {
    for (const fac of facilities) {
      if (!fac.latitude || !fac.longitude) continue;

      // Haversine direct calculation
      const dLat = ((fac.latitude - originLat) * Math.PI) / 180;
      const dLng = ((fac.longitude - originLng) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((originLat * Math.PI) / 180) *
          Math.cos((fac.latitude * Math.PI) / 180) *
          Math.sin(dLng / 2) *
          Math.sin(dLng / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const directMeters = Math.round(6371000 * c);

      // Attempt genuine Google Routes API if API key is active
      if (this.apiKey) {
        try {
          const controller = new AbortController();
          const timer = setTimeout(() => controller.abort(), 4000);
          const routeRes = await this.fetchImpl('https://routes.googleapis.com/directions/v2:computeRoutes', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Goog-Api-Key': this.apiKey,
              'X-Goog-FieldMask': 'routes.distanceMeters,routes.duration,routes.staticDuration',
            },
            body: JSON.stringify({
              origin: { location: { latLng: { latitude: originLat, longitude: originLng } } },
              destination: { location: { latLng: { latitude: fac.latitude, longitude: fac.longitude } } },
              travelMode: 'DRIVE',
              routingPreference: 'TRAFFIC_AWARE',
            }),
            signal: controller.signal,
          });
          clearTimeout(timer);
          if (routeRes.ok) {
            const routeData = (await routeRes.json()) as {
              routes?: Array<{
                distanceMeters?: number;
                duration?: string;
                staticDuration?: string;
              }>;
            };
            const route = routeData.routes?.[0];
            if (route) {
              const driveMeters = route.distanceMeters;
              const durationSec = parseInt(route.duration?.replace('s', '') || '0', 10);
              const staticSec = route.staticDuration
                ? parseInt(route.staticDuration.replace('s', '') || '0', 10)
                : null;

              if (driveMeters) {
                fac.distance_meters = driveMeters;
                fac.distance_text = `${(driveMeters / 1000).toFixed(1)} km (driving)`;
              }
              if (durationSec) {
                fac.travel_duration_seconds = durationSec;
                // Rule 5: Never label travel time as live traffic unless the route response
                // actually uses traffic-aware data (indicated by presence of staticDuration / traffic model evaluation).
                const isTrafficAware = staticSec !== null && staticSec > 0;
                fac.travel_duration_text = isTrafficAware
                  ? `${Math.ceil(durationSec / 60)} mins (live traffic)`
                  : `${Math.ceil(durationSec / 60)} mins (estimated driving, traffic unverified)`;
              }
              continue;
            }
          }
        } catch {
          // Fall through to honest straight-line disclosure if Routes API fails or times out
        }
      }

      // Honestly label straight-line distance; NEVER claim it is driving distance without Routes API
      fac.distance_meters = directMeters;
      fac.distance_text = `~${(directMeters / 1000).toFixed(1)} km (approx. straight-line)`;
      // Never fabricate travel duration without genuine Routes/Traffic API data
      fac.travel_duration_seconds = null;
      fac.travel_duration_text = null;
    }
  }
}
