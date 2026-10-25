/** Independently governed seams only; no clinical rules, provider calls or UI changes. */
import type { Handoff } from '../model-a-research/contracts';

export type ReviewedSource = Readonly<{ sourceId: string; version: string; citation: string;
  reviewerId: string; reviewScope: string; reviewedAt: string; expiresAt: string }>;
export type SafetyResult = { status: 'unavailable'; reason: 'clinical_review_required' }
  | { status: 'reviewed_escalation'; policy: ReviewedSource; ruleIds: readonly string[]; approvedMessageId: string };
export interface SafetyPort {
  /** An implemented policy must be independently approved; no LLM/Model B override parameter. */
  check(evidence: Readonly<Handoff>, signal: AbortSignal): Promise<SafetyResult>;
}
export type GuidanceResult = { status: 'unavailable'; reason: 'vetted_sources_required' }
  | { status: 'reviewed_sources'; sources: readonly ReviewedSource[]; approvedMessageIds: readonly string[] };
export interface GuidancePort {
  retrieve(evidence: Readonly<Handoff>, signal: AbortSignal): Promise<GuidanceResult>;
}
export type NavigationRequest = Readonly<{ schema_version: 'medassist.navigation-request.v1';
  consent: { granted: true; purpose: 'nearby_hospital_search'; expires_at: number };
  location: { latitude: number; longitude: number } }>;
export type VerifiedFacility = Readonly<{ providerId: string; name: string; capabilitySource: ReviewedSource;
  emergencyCapability: 'verified' | 'unknown'; specialistCapabilities: readonly string[];
  availability: 'unknown'; navigationUrl: string }>;
export interface NavigationPort {
  search(request: NavigationRequest, signal: AbortSignal): Promise<{ status: 'unavailable'; reason: 'provider_and_capability_verification_required' }
    | { status: 'verified_results'; facilities: readonly VerifiedFacility[] }>;
}

/** Exact allowlist: no narratives, symptoms, evidence or account identifiers leave this seam. */
export function readNavigationRequest(raw: unknown, now = Date.now()): NavigationRequest | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const r = raw as Record<string, unknown>;
  if (Object.keys(r).sort().join() !== 'consent,location,schema_version' || r.schema_version !== 'medassist.navigation-request.v1'
    || !r.consent || typeof r.consent !== 'object' || Array.isArray(r.consent)
    || !r.location || typeof r.location !== 'object' || Array.isArray(r.location)) return null;
  const c = r.consent as Record<string, unknown>, l = r.location as Record<string, unknown>;
  if (Object.keys(c).sort().join() !== 'expires_at,granted,purpose' || c.granted !== true || c.purpose !== 'nearby_hospital_search'
    || typeof c.expires_at !== 'number' || !Number.isFinite(c.expires_at) || c.expires_at <= now
    || Object.keys(l).sort().join() !== 'latitude,longitude' || typeof l.latitude !== 'number' || !Number.isFinite(l.latitude)
    || l.latitude < -90 || l.latitude > 90 || typeof l.longitude !== 'number' || !Number.isFinite(l.longitude)
    || l.longitude < -180 || l.longitude > 180) return null;
  return { schema_version: 'medassist.navigation-request.v1', consent: { granted: true,
    purpose: 'nearby_hospital_search', expires_at: c.expires_at }, location: { latitude: l.latitude, longitude: l.longitude } };
}

export const unavailableSafety: SafetyPort = Object.freeze({
  async check() { return { status: 'unavailable' as const, reason: 'clinical_review_required' as const }; },
});
export const unavailableGuidance: GuidancePort = Object.freeze({
  async retrieve() { return { status: 'unavailable' as const, reason: 'vetted_sources_required' as const }; },
});
export const unavailableNavigation: NavigationPort = Object.freeze({
  async search() { return { status: 'unavailable' as const, reason: 'provider_and_capability_verification_required' as const }; },
});
