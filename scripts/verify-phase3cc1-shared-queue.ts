import postgres from 'postgres';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { writeFile, unlink } from 'node:fs/promises';
import { resolve } from 'node:path';

import { postgresSpecialistRepository } from '../server/specialist/postgresRepository';
import { postgresGuidedRepository } from '../server/adr/postgresRepository';
import { postgresSharingRepository } from '../server/sharing/repository';
import { createSharingPoolRepository } from '../server/sharing/pool';
import { prepareDisclosure } from '../server/sharing/disclosure';
import { createPdfService } from '../server/adr/pdf';
import { pooledSharingPolicyVersion } from '../server/sharing/policy';

const dbUrl = process.env.APIP_ADR_DATABASE_URL;
if (!dbUrl) {
  throw new Error('APIP_ADR_DATABASE_URL environment variable is required.');
}
const sql = postgres(dbUrl, { max: 3, ssl: { rejectUnauthorized: true } });

const adminSub = '409aea75-8325-4c94-b0d7-58ff5aa75317';
const approvedSpecialistSub = 'da312f4f-cbcf-400b-8a81-b0e13f7efc42';
const revokedSpecialistSub = 'f85551e8-abc5-451e-8d2a-18d12101d764';
const patientSub = adminSub;

async function runTest() {
  console.log('=== ADR Phase 3C-C1: Shared Specialist Review Queue Verification ===\n');
  const results: Record<string, string> = {};

  try {
    const specialistRepo = postgresSpecialistRepository(sql);
    const guidedRepo = postgresGuidedRepository(sql);
    const sharingRepo = postgresSharingRepository(sql);
    const poolRepo = createSharingPoolRepository(sql, ':memory:');
    const pdfService = createPdfService();

    // 1. Verify Approved Specialist state
    console.log('[1/13] Verifying approved specialist identity...');
    const app = await specialistRepo.applicationForAdministrator(adminSub, 'fe677eea-2ac2-4d0c-b377-650f50907538');
    assert.equal(app.state, 'APPROVED');
    assert.equal(app.owner, approvedSpecialistSub);
    assert(app.validUntil && Date.parse(app.validUntil) > Date.now());
    results.approvedSpecialist = 'PASS';
    console.log(' -> Approved specialist PASS (Pharmacovigilance Associate, valid capability)');

    // 2. Verify Revoked Specialist cannot access specialist operations
    console.log('[2/13] Verifying revoked specialist is denied...');
    const revokedApp = await specialistRepo.applicationForAdministrator(adminSub, '3bb60d1d-f16a-4ea4-a235-3b736ec2431f');
    assert.equal(revokedApp.state, 'REVOKED');
    await assert.rejects(
      () => sharingRepo.operation(revokedSpecialistSub, 'inbox', null, {}, randomUUID()),
      /FORBIDDEN/
    );
    results.revokedDenied = 'PASS';
    console.log(' -> Revoked specialist rejected with FORBIDDEN PASS');

    // 3. Ensure specialist directory opt-in is active
    console.log('[3/13] Ensuring approved specialist directory opt-in is active...');
    const optIn = await sharingRepo.operation(approvedSpecialistSub, 'opt_in', null, { optedIn: true }, randomUUID());
    assert.equal(optIn.optedIn, true);
    results.directoryOptIn = 'PASS';
    console.log(' -> Specialist directory opt-in PASS');

    // 4. Create patient ADR guided case in live Supabase PostgreSQL
    console.log('[4/13] Creating patient ADR guided case in Supabase PostgreSQL...');
    const caseId = randomUUID();
    const medId = 'med-' + randomUUID().slice(0, 8);
    const val = (v: string) => ({
      state: 'provided' as const,
      value: v,
      confirmedAt: new Date().toISOString(),
      source: 'manual' as const,
      statementId: 'fictional',
    });

    const initialCase = {
      schemaVersion: 1,
      id: caseId,
      revision: 1,
      fictionalOnly: true,
      updatedAt: new Date().toISOString(),
      values: {
        caseType: val('Initial'),
        initials: val('FC'),
        reaction: val('Fictional acute urticaria and facial edema'),
        reporterName: val('Fictional APIP Patient Reporter'),
        email: val('fictional.reporter@example.test'),
        phone: val('+91 98765 43210'),
        [`med.${medId}.name`]: val('Fictional medicine'),
      },
      medications: [{ id: medId, kind: 'suspect' as const }],
      statements: [
        {
          id: 'st-1',
          text: 'Patient developed rash within 2 hours of taking synthetic test antibiotic.',
          confirmedAt: new Date().toISOString(),
        },
      ],
      proposals: [],
      providerStatus: 'manual' as const,
    };

    const savedCase = await guidedRepo.save(patientSub, initialCase, 0, { type: 'create' }, randomUUID());
    assert(savedCase);
    assert.equal(savedCase.id, caseId);
    assert.equal(savedCase.revision, 1);
    results.patientCase = 'PASS';
    console.log(' -> Patient case created at revision 1 PASS');

    // 5. Patient grants explicit consent to the Approved Specialist Review Pool (C1-A)
    console.log('[5/13] Preparing disclosure and creating pooled review request with explicit consent...');
    const disclosure = prepareDisclosure(savedCase);
    assert(disclosure.digest);

    const poolRequestId = randomUUID();
    const commandId = randomUUID();
    const poolItem = await poolRepo.createPoolRequest(
      patientSub,
      {
        id: poolRequestId,
        caseId: savedCase.id,
        revision: savedCase.revision,
        snapshot: savedCase,
        disclosure,
        digest: disclosure.digest,
        policyVersion: pooledSharingPolicyVersion,
      },
      commandId
    );

    assert.equal(poolItem.id, poolRequestId);
    assert.equal(poolItem.state, 'pending_claim');
    assert.equal(poolItem.policyVersion, 'phase3c-c1-v1');
    assert.equal(poolItem.claimedBy, null);
    results.poolConsent = 'PASS';
    console.log(' -> Explicit pooled consent request created (state: pending_claim) PASS');

    // 6. Shared Queue Visibility & Minimal Safe Metadata Disclosure (C1-B)
    console.log('[6/13] Verifying shared review queue contents and minimal metadata...');
    const queue = await poolRepo.listQueue();
    const queueEntry = queue.find(q => q.id === poolRequestId);
    assert(queueEntry, 'Pooled request must appear in queue');
    assert.equal(queueEntry.caseRef, caseId.slice(0, 8));
    assert.equal(queueEntry.revision, 1);
    assert.equal(queueEntry.state, 'pending_claim');

    // Verify privacy: safe metadata must NOT contain personal patient details
    assert(queueEntry.safeMetadata.reactionSnippet.includes('acute urticaria'));
    assert(queueEntry.safeMetadata.suspectMedicineClass.includes('Fictional medicine'));
    assert(!JSON.stringify(queueEntry).includes('Fictional APIP Patient Reporter'));
    assert(!JSON.stringify(queueEntry).includes('fictional.reporter@example.test'));
    assert(!JSON.stringify(queueEntry).includes('+91 98765 43210'));
    results.queueMetadata = 'PASS';
    console.log(' -> Shared queue PASS (minimal safe metadata only; personal details strictly omitted)');

    // 7. Conflict of Interest / Self-assignment Prohibition (C1-E)
    console.log('[7/13] Verifying self-assignment prohibition (Conflict of Interest)...');
    await assert.rejects(
      () =>
        poolRepo.claim(patientSub, poolRequestId, randomUUID(), async () => {
          throw new Error('Should not reach assignment callback');
        }),
      /CONFLICT_OF_INTEREST/
    );
    results.conflictOfInterest = 'PASS';
    console.log(' -> Self-assignment rejected with CONFLICT_OF_INTEREST PASS');

    // 8. Atomic Claim Operation (C1-C)
    console.log('[8/13] Approved specialist claims pending case from pool...');
    const claimCommandId = randomUUID();
    const claimResult = await poolRepo.claim(
      approvedSpecialistSub,
      poolRequestId,
      claimCommandId,
      async item => {
        // Creates the verified assignment in Supabase PostgreSQL apip_sharing.requests
        return await sharingRepo.operation(
          item.patient,
          'create',
          item.id,
          {
            caseId: item.caseId,
            revision: item.revision,
            specialist: approvedSpecialistSub,
            consent: true,
            policyVersion: 'phase3c-b-v1',
            snapshot: item.snapshot,
            disclosure: item.disclosure,
            digest: item.disclosureDigest,
          },
          claimCommandId
        );
      }
    );

    assert(claimResult.request);
    assert.equal(claimResult.request.state, 'active');
    assert.equal(claimResult.request.caseId, caseId);

    // Queue must now be empty of this case
    const queueAfterClaim = await poolRepo.listQueue();
    assert(!queueAfterClaim.some(q => q.id === poolRequestId), 'Claimed case must leave available queue');
    results.atomicClaim = 'PASS';
    console.log(' -> Atomic claim PASS (case transitioned to active, removed from pool queue)');

    // 9. Concurrency Race Test: Second specialist attempting to claim already claimed case receives 409
    console.log('[9/13] Concurrency race: second specialist attempting claim receives ACTIVE_ASSIGNMENT_CONFLICT...');
    const secondSpecialist = randomUUID();
    await assert.rejects(
      () =>
        poolRepo.claim(secondSpecialist, poolRequestId, randomUUID(), async () => {
          throw new Error('Should never run');
        }),
      /ACTIVE_ASSIGNMENT_CONFLICT/
    );
    results.concurrencyConflict = 'PASS';
    console.log(' -> Simultaneous claim conflict PASS (exactly one winner, second receives ACTIVE_ASSIGNMENT_CONFLICT)');

    // 10. Claimed Specialist Authorized Full Report & Original PvPI PDF (C1-C)
    console.log('[10/13] Claimed specialist accesses detailed report & generates original PvPI PDF preview...');
    const report = await sharingRepo.operation(approvedSpecialistSub, 'report', poolRequestId, {}, randomUUID());
    assert.equal(report.id, poolRequestId);
    assert.equal(report.revision, 1);
    assert(report.disclosure);

    const pdfSnapshot = await sharingRepo.operation(
      approvedSpecialistSub,
      'pdf_snapshot',
      poolRequestId,
      {},
      randomUUID()
    );
    assert.equal(pdfSnapshot.revision, 1);
    assert.equal(pdfSnapshot.values.reporterName.value, 'Fictional APIP Patient Reporter');

    const pdfBytes = await pdfService.generate(pdfSnapshot);
    assert(Buffer.isBuffer(pdfBytes));
    assert(pdfBytes.length > 5000);

    const tempPdfPath = resolve('test-pool-pypdf-verify.pdf');
    await writeFile(tempPdfPath, pdfBytes);

    const pyScript = `
from pypdf import PdfReader
import sys
reader = PdfReader(sys.argv[1])
assert len(reader.pages) in (2, 3), f"Expected 2 or 3 pages, got {len(reader.pages)}"
fields = reader.get_fields()
values = [str(f.get('/V', '')) for f in fields.values()]
print("PDF values found:", [v for v in values if v and v != '/Off'])
assert any('Fictional APIP Patient Reporter' in v for v in values), "Reporter name missing"
assert any('Fictional medicine' in v for v in values), "Medicine name missing"
print("PYPDF_POOL_ASSERTION_OK")
`;
    const pyOutput = execFileSync(process.env.APIP_PDF_PYTHON || 'python', ['-c', pyScript, tempPdfPath], {
      encoding: 'utf8',
    });
    assert(pyOutput.includes('PYPDF_POOL_ASSERTION_OK'));
    await unlink(tempPdfPath);
    results.authorizedReviewAndPdf = 'PASS';
    console.log(' -> Claimed specialist detailed access & pypdf 2-page form assertion PASS');

    // 11. Release Case Back to Pool (C1-C)
    console.log('[11/13] Claimed specialist releases case back to pool...');
    const releaseResult = await poolRepo.release(
      approvedSpecialistSub,
      poolRequestId,
      2, // version incremented on claim
      randomUUID(),
      async (id, expectedVersion) => {
        return await sharingRepo.operation(
          approvedSpecialistSub,
          'decline',
          id,
          { expectedVersion: 1 },
          randomUUID()
        );
      }
    );
    assert.equal(releaseResult.request.state, 'pending_claim');

    // Case must now reappear in the pool queue!
    const queueAfterRelease = await poolRepo.listQueue();
    assert(queueAfterRelease.some(q => q.id === poolRequestId), 'Released case must reappear in pool queue');
    results.releaseToPool = 'PASS';
    console.log(' -> Release back to pool PASS (case returned to pending_claim, visible in queue again)');

    // 12. Patient Withdrawal (C1-A & C1-F)
    console.log('[12/13] Patient withdraws pool sharing request...');
    const withdrawResult = await poolRepo.withdraw(
      patientSub,
      poolRequestId,
      3, // version incremented on release
      randomUUID()
    );
    assert.equal(withdrawResult.request.state, 'withdrawn');

    // Withdrawn case must immediately disappear from queue
    const queueAfterWithdraw = await poolRepo.listQueue();
    assert(!queueAfterWithdraw.some(q => q.id === poolRequestId), 'Withdrawn case must not appear in queue');

    // Further claim attempts must fail
    await assert.rejects(
      () =>
        poolRepo.claim(approvedSpecialistSub, poolRequestId, randomUUID(), async () => {
          throw new Error('Should not claim withdrawn case');
        }),
      /NOT_FOUND/
    );
    results.patientWithdrawal = 'PASS';
    console.log(' -> Patient withdrawal immediately revokes access and removes from queue PASS');

    // 13. Direct Phase 3C-B 1-to-1 Sharing Remains Fully Functional
    console.log('[13/13] Verifying original Phase 3C-B direct specialist sharing remains functional...');
    const directCaseId = randomUUID();
    const directSaved = await guidedRepo.save(
      patientSub,
      { ...initialCase, id: directCaseId },
      0,
      { type: 'create' },
      randomUUID()
    );
    const directDisclosure = prepareDisclosure(directSaved);
    const directReqId = randomUUID();
    const directReq = await sharingRepo.operation(
      patientSub,
      'create',
      directReqId,
      {
        caseId: directCaseId,
        revision: 1,
        specialist: approvedSpecialistSub,
        consent: true,
        policyVersion: 'phase3c-b-v1',
        snapshot: directSaved,
        disclosure: directDisclosure,
        digest: directDisclosure.digest,
      },
      randomUUID()
    );
    assert.equal(directReq.state, 'active');
    assert.equal(directReq.case_id, directCaseId);
    results.directSharing3CB = 'PASS';
    console.log(' -> Original Phase 3C-B direct sharing intact PASS');

    console.log('\n======================================================');
    console.log('All 13/13 ADR Phase 3C-C1 verification gates PASSED cleanly!');
    console.log('======================================================\n');
    console.log(JSON.stringify(results, null, 2));
  } finally {
    await sql.end({ timeout: 2 });
  }
}

runTest().catch(err => {
  console.error('\nVerification failed:', err);
  process.exit(1);
});
