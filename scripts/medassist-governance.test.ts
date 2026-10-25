import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readNavigationRequest, unavailableSafety, unavailableGuidance, unavailableNavigation } from '../src/features/medassist-intelligence/governance';
import type { Handoff } from '../src/features/model-a-research/contracts';

const request = { schema_version: 'medassist.navigation-request.v1', consent: { granted: true, purpose: 'nearby_hospital_search', expires_at: 2000 }, location: { latitude: 0, longitude: 0 } };
test('location seam requires explicit unexpired scoped consent and finite coordinates', () => {
  assert.ok(readNavigationRequest(request, 1000));
  assert.equal(readNavigationRequest(request, 2000), null);
  for (const bad of [{ ...request, consent: { ...request.consent, granted: false } },
    { ...request, consent: { ...request.consent, purpose: 'analytics' } },
    { ...request, location: { latitude: NaN, longitude: 0 } },
    { ...request, location: { latitude: 91, longitude: 0 } },
    { ...request, location: { latitude: 0, longitude: 181 } },
    { ...request, symptom: 'must not leave' },
    { ...request, location: { ...request.location, accountId: 'forbidden' } }]) assert.equal(readNavigationRequest(bad, 1000), null);
});
test('all independently governed capabilities remain unavailable without rules or network', async () => {
  const signal = new AbortController().signal;
  assert.deepEqual(await unavailableSafety.check({} as Handoff, signal), { status: 'unavailable', reason: 'clinical_review_required' });
  assert.deepEqual(await unavailableGuidance.retrieve({} as Handoff, signal), { status: 'unavailable', reason: 'vetted_sources_required' });
  assert.deepEqual(await unavailableNavigation.search(readNavigationRequest(request, 1000)!, signal), { status: 'unavailable', reason: 'provider_and_capability_verification_required' });
});
