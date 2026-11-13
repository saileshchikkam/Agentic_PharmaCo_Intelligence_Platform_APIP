import postgres from 'postgres';
import assert from 'node:assert/strict';
import { randomUUID, createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { writeFile, unlink } from 'node:fs/promises';
import { resolve } from 'node:path';

import { postgresSpecialistRepository } from '../server/specialist/postgresRepository';
import { postgresGuidedRepository } from '../server/adr/postgresRepository';
import { postgresSharingRepository } from '../server/sharing/repository';
import { prepareDisclosure } from '../server/sharing/disclosure';
import { createPdfService } from '../server/adr/pdf';

const dbUrl = process.env.APIP_ADR_DATABASE_URL;
if (!dbUrl) {
  throw new Error('APIP_ADR_DATABASE_URL environment variable is required. Connection strings must not be hardcoded.');
}
const sql = postgres(dbUrl, { max: 2, ssl: { rejectUnauthorized: true } });

const adminSub = '409aea75-8325-4c94-b0d7-58ff5aa75317';
const approvedSpecialistSub = 'da312f4f-cbcf-400b-8a81-b0e13f7efc42';
const revokedSpecialistSub = 'f85551e8-abc5-451e-8d2a-18d12101d764';
const patientSub = adminSub;

async function runTest() {
  const results = {};
  try {
    const specialistRepo = postgresSpecialistRepository(sql);
    const guidedRepo = postgresGuidedRepository(sql);
    const sharingRepo = postgresSharingRepository(sql);
    const pdfService = createPdfService();

    // 1. Verify Approved Specialist state
    console.log('[1/10] Verifying approved specialist...');
    const app = await specialistRepo.applicationForAdministrator(adminSub, 'fe677eea-2ac2-4d0c-b377-650f50907538');
    assert.equal(app.state, 'APPROVED');
    assert.equal(app.owner, approvedSpecialistSub);
    assert.equal(app.profile.category, 'Pharmacovigilance Associate');
    assert(app.validUntil && Date.parse(app.validUntil) > Date.now());
    assert(Date.parse(app.validUntil) <= Date.now() + 31 * 86400000);
    assert(app.decisions.some(d => d.action === 'begin_verification'));
    assert(app.decisions.some(d => d.action === 'approve'));
    results.approvedSpecialist = 'PASS';
    console.log(' -> Approved specialist PASS (30-day capability, Pharmacovigilance Associate, audited)');

    // 2. Verify Revoked Specialist remains revoked
    console.log('[2/10] Verifying revoked specialist remains revoked...');
    const revokedApp = await specialistRepo.applicationForAdministrator(adminSub, '3bb60d1d-f16a-4ea4-a235-3b736ec2431f');
    assert.equal(revokedApp.state, 'REVOKED');
    assert.equal(revokedApp.owner, revokedSpecialistSub);
    results.revokedRemainsRevoked = 'PASS';
    console.log(' -> Revoked specialist remains REVOKED PASS');

    // 3. Specialist opt-in and directory
    console.log('[3/10] Testing specialist directory opt-in & directory listing...');
    const optIn = await sharingRepo.operation(approvedSpecialistSub, 'opt_in', null, { optedIn: true }, randomUUID());
    assert.equal(optIn.optedIn, true);

    const directory = await sharingRepo.operation(patientSub, 'directory', null, {}, randomUUID());
    assert(directory.some(d => d.id === approvedSpecialistSub));
    assert(!directory.some(d => d.id === revokedSpecialistSub));
    results.directoryOptIn = 'PASS';
    console.log(' -> Directory opt-in PASS (approved specialist present, revoked absent)');

    // 4. Create patient ADR guided case and confirm fields
    console.log('[4/10] Creating patient ADR guided case in hosted PostgreSQL...');
    const caseId = randomUUID();
    const medId = 'med-' + randomUUID().slice(0, 8);
    const val = (v) => ({ state: 'provided', value: v, confirmedAt: new Date().toISOString(), source: 'manual', statementId: 'fictional' });

    const initialCase = {
      schemaVersion: 1,
      id: caseId,
      revision: 1,
      fictionalOnly: true,
      updatedAt: new Date().toISOString(),
      values: {
        caseType: val('Initial'),
        initials: val('FC'),
        reaction: val('Fictional rash for authorized sharing verification'),
        reporterName: val('Fictional APIP reporter'),
        email: val('fictional@example.test'),
        [`med.${medId}.name`]: val('Fictional medicine')
      },
      medications: [{ id: medId, kind: 'suspect' }],
      statements: [{ id: 'st-1', text: 'Patient experienced rash after taking fictional medicine.', confirmedAt: new Date().toISOString() }],
      proposals: [],
      providerStatus: 'manual'
    };

    const savedCase = await guidedRepo.save(patientSub, initialCase, 0, { type: 'create' }, randomUUID());
    assert(savedCase);
    assert.equal(savedCase.id, caseId);
    assert.equal(savedCase.revision, 1);
    results.patientCase = 'PASS';
    console.log(' -> Patient case created at revision 1 PASS');

    // 5. Prepare disclosure and create sharing request with consent
    console.log('[5/10] Preparing disclosure and creating consented sharing request...');
    const disclosure = prepareDisclosure(savedCase);
    assert(disclosure.digest);
    const requestId = randomUUID();
    const commandId = randomUUID();
    const requestBody = {
      caseId: savedCase.id,
      revision: savedCase.revision,
      specialist: approvedSpecialistSub,
      consent: true,
      policyVersion: 'phase3c-b-v1',
      snapshot: savedCase,
      disclosure,
      digest: disclosure.digest
    };

    const sharingRequest = await sharingRepo.operation(patientSub, 'create', requestId, requestBody, commandId);
    assert.equal(sharingRequest.state, 'active');
    assert.equal(sharingRequest.case_id, caseId);
    assert.equal(sharingRequest.revision, 1);
    results.consentedSharing = 'PASS';
    console.log(' -> Consented sharing request created (state: active) PASS');

    // 6. Specialist pending reviews and report fetch
    console.log('[6/10] Specialist queries pending review inbox and report...');
    const inbox = await sharingRepo.operation(approvedSpecialistSub, 'inbox', null, {}, randomUUID());
    assert(inbox.some(r => r.id === requestId));

    const report = await sharingRepo.operation(approvedSpecialistSub, 'report', requestId, {}, randomUUID());
    assert.equal(report.id, requestId);
    assert.equal(report.revision, 1);
    assert(report.disclosure);
    results.specialistInboxReport = 'PASS';
    console.log(' -> Specialist inbox and report fetch PASS');

    // 7. Original PvPI PDF generation and pypdf validation
    console.log('[7/10] Specialist generates original PvPI PDF preview & validating with pypdf...');
    const pdfSnapshot = await sharingRepo.operation(approvedSpecialistSub, 'pdf_snapshot', requestId, {}, randomUUID());
    assert.equal(pdfSnapshot.revision, 1);
    assert.equal(pdfSnapshot.values.reporterName.value, 'Fictional APIP reporter');
    assert.equal(pdfSnapshot.values[`med.${medId}.name`].value, 'Fictional medicine');

    const pdfBytes = await pdfService.generate(pdfSnapshot);
    assert(Buffer.isBuffer(pdfBytes));
    assert(pdfBytes.length > 5000);

    const tempPdfPath = resolve('test-pypdf-verify.pdf');
    await writeFile(tempPdfPath, pdfBytes);

    const pyScript = `
from pypdf import PdfReader
import sys
reader = PdfReader(sys.argv[1])
assert len(reader.pages) == 2, f"Expected 2 pages, got {len(reader.pages)}"
fields = reader.get_fields()
values = [str(f.get('/V', '')) for f in fields.values()]
assert any('Fictional APIP reporter' in v for v in values), "Reporter name missing from PDF"
assert any('Fictional medicine' in v for v in values), "Medicine name missing from PDF"
print("PYPDF_ASSERTION_OK")
`;
    const pyOutput = execFileSync(process.env.APIP_PDF_PYTHON || 'python', ['-c', pyScript, tempPdfPath], { encoding: 'utf8' });
    assert(pyOutput.includes('PYPDF_ASSERTION_OK'));
    await unlink(tempPdfPath);
    results.originalPdfPvPI = 'PASS';
    console.log(' -> Original PvPI PDF preview generation & pypdf assertion PASS');

    // 8. Negative security & unauthorized access checks
    console.log('[8/10] Verifying negative authorization gates...');
    const foreignUser = randomUUID();

    // Revoked specialist denied
    await assert.rejects(
      () => sharingRepo.operation(revokedSpecialistSub, 'report', requestId, {}, randomUUID()),
      /NOT_FOUND/
    );
    // Foreign user denied
    await assert.rejects(
      () => sharingRepo.operation(foreignUser, 'report', requestId, {}, randomUUID()),
      /NOT_FOUND/
    );
    // Patient cannot read specialist inbox
    await assert.rejects(
      () => sharingRepo.operation(patientSub, 'report', requestId, {}, randomUUID()),
      /NOT_FOUND/
    );
    results.negativeAuthorization = 'PASS';
    console.log(' -> Negative authorization checks PASS (revoked denied, foreign denied, patient denied)');

    // 9. Newer revision privacy
    console.log('[9/10] Verifying newer revision privacy (revision 2 created by patient)...');
    const revision2Case = {
      ...savedCase,
      values: {
        ...savedCase.values,
        reaction: val('Fictional private newer revision - not consented')
      }
    };
    const savedRev2 = await guidedRepo.save(patientSub, revision2Case, 1, { type: 'confirm', key: 'reaction', value: 'Fictional private newer revision - not consented' }, randomUUID());
    assert.equal(savedRev2.revision, 2);

    // Specialist queries pdf_snapshot again: MUST STILL BE REVISION 1
    const snapshotStillRev1 = await sharingRepo.operation(approvedSpecialistSub, 'pdf_snapshot', requestId, {}, randomUUID());
    assert.equal(snapshotStillRev1.revision, 1);
    assert.equal(snapshotStillRev1.values.reaction.value, 'Fictional rash for authorized sharing verification');
    assert.notEqual(snapshotStillRev1.values.reaction.value, 'Fictional private newer revision - not consented');
    results.newerRevisionPrivacy = 'PASS';
    console.log(' -> Newer revision privacy PASS (specialist sees only consented revision 1, not revision 2)');

    // 10. Patient consent withdrawal
    console.log('[10/10] Testing patient consent withdrawal and subsequent access denied...');
    const withdrawResult = await sharingRepo.operation(patientSub, 'withdraw', requestId, { expectedVersion: 1 }, randomUUID());
    assert.equal(withdrawResult.state, 'withdrawn');

    // Subsequent access by specialist must now be denied (NOT_FOUND)
    await assert.rejects(
      () => sharingRepo.operation(approvedSpecialistSub, 'report', requestId, {}, randomUUID()),
      /NOT_FOUND/
    );
    await assert.rejects(
      () => sharingRepo.operation(approvedSpecialistSub, 'pdf_snapshot', requestId, {}, randomUUID()),
      /NOT_FOUND/
    );

    const inboxAfterWithdraw = await sharingRepo.operation(approvedSpecialistSub, 'inbox', null, {}, randomUUID());
    assert(!inboxAfterWithdraw.some(r => r.id === requestId));
    results.consentWithdrawal = 'PASS';
    console.log(' -> Consent withdrawal and subsequent access denied PASS');

    console.log('\n========================================');
    console.log('ALL PHASE 3C-B GATES PASSED SUCCESSFULLY:');
    console.log(JSON.stringify(results, null, 2));
    console.log('========================================');
  } catch (err) {
    console.error('FATAL TEST ERROR:', err);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

runTest();