import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { generateSessionPdf } from '../src/features/medassist-conversation/pdf-export';
import { evaluateHybridUrgency } from '../src/features/medassist-severity/urgency-engine';
import { evaluatePrecautionsAndSpecialty } from '../src/features/medassist-precautions/precaution-engine';

test('Phase C1: Assessment UI and Right-Side Boxes Specification', () => {
  const tsx = readFileSync('src/features/medassist-conversation/MedAssistConversation.tsx', 'utf-8');
  const css = readFileSync('src/features/medassist-conversation/conversation.css', 'utf-8');

  // Requirement 1: Rename "Restart fictional interview" to "Restart Session"
  assert.match(tsx, /Restart Session/);
  assert.doesNotMatch(tsx, /Restart fictional interview/);

  // Requirement 2: First box "Your Reported Severity"
  assert.match(tsx, /Your Reported Severity/);

  // Requirement 3: Second box "Symptom-Based Assessment"
  assert.match(tsx, /Symptom-Based Assessment/);

  // Requirement 4: Severity dot colors and highlighting
  assert.match(css, /#22C55E/, 'Low must be #22C55E');
  assert.match(css, /#EAB308/, 'Medium must be #EAB308');
  assert.match(css, /#EF4444/, 'High must be #EF4444');
  assert.match(css, /#000000/, 'Extreme must be #000000');
  assert.match(css, /severity-dot-extreme/, 'Extreme dot must have dark mode outline support');
  assert.match(css, /severity-row-check/, 'Checkmark class must be present');
  assert.match(css, /severity-neutral-indicator/, 'Neutral indicator class must be present');

  // Vertical layout verification
  assert.match(css, /flex-direction:\s*column/, 'Severity options must be arranged vertically');

  // Requirement 5: Third box "Recommended Precautions"
  assert.match(tsx, /Recommended Precautions/);
  assert.match(tsx, /When to Seek Medical Attention:/);
  assert.match(tsx, /What to Do:/);
  assert.match(tsx, /What to Avoid:/);
  assert.match(tsx, /Warning Signs/);

  // Requirement 6: Download Session button
  assert.match(tsx, /Download Session/);
});

test('Phase C1: Session PDF Export Generator Verification', () => {
  const pdfBytes = generateSessionPdf({
    sessionDate: '11/17/2026, 11:30:00 AM',
    patientDescription: 'Severe chronic cough with thick yellow mucus and high fever',
    confirmedSymptoms: ['cough', 'fever'],
    fictionalAge: 45,
    fictionalSex: 'M',
    questionsAndAnswers: [
      { question: 'Do you have difficulty breathing at rest?', answer: 'No' },
      { question: 'How long have you had this fever?', answer: '3 days' },
    ],
    patientSeverity: 'high',
    symptomSeverities: { E_201: 'high', E_91: 'medium' },
    assessedUrgency: 'high',
    urgencyRationale: 'High urgency assessed due to persistent fever and high reported discomfort.',
    emergencyOverride: false,
    riskFactors: ['adult_persistent_symptom'],
    recommendedSpecialty: {
      primary: 'Pulmonology',
      alternative: 'General Medicine',
      rationale: 'Persistent respiratory symptom with systemic fever.',
    },
    precautions: {
      timeframe: 'Consult a pulmonologist or physician within 24 to 48 hours.',
      whatToDo: ['Rest adequately and drink plenty of fluids (water, warm soups).', 'Use honey-lemon warm water for throat soothing.'],
      whatToAvoid: ['Avoid heavy physical exertion.', 'Avoid smoking and cold exposures.'],
      warningSigns: ['Sudden difficulty breathing or chest pain.', 'High fever exceeding 102F that does not respond to cooling.'],
    },
  });

  assert.ok(pdfBytes instanceof Uint8Array, 'PDF output must be Uint8Array');
  assert.ok(pdfBytes.length > 500, 'PDF output must contain content');

  const pdfString = Buffer.from(pdfBytes).toString('latin1');

  // PDF 1.4 header and trailer check
  assert.ok(pdfString.startsWith('%PDF-1.4'), 'Must start with PDF 1.4 header');
  assert.ok(pdfString.includes('%%EOF'), 'Must terminate with %%EOF');
  assert.ok(pdfString.includes('xref'), 'Must have xref table');
  assert.ok(pdfString.includes('/Type /Catalog'), 'Must have Catalog object');
  assert.ok(pdfString.includes('/Type /Pages'), 'Must have Pages object');

  // Content verification
  assert.ok(pdfString.includes('APIP MedAssist - Patient Session Summary'), 'Header must be present');
  assert.ok(pdfString.includes('Your Reported Severity:  HIGH'), 'Reported severity must be present');
  assert.ok(pdfString.includes('Symptom-Based Assessment:  HIGH'), 'System urgency must be present');
  assert.ok(pdfString.includes('RECOMMENDED PRECAUTIONS'), 'Precautions header must be present');
  assert.ok(pdfString.includes('When to Seek Medical Attention'), 'Precautions timeframe must be present');
  assert.ok(pdfString.includes('RESEARCH DISCLAIMER & SAFETY NOTICE'), 'Disclaimer must be present');
});

test('Phase C1: Emergency Override Safety Boundaries', () => {
  const urgency = evaluateHybridUrgency({
    confirmedSymptoms: ['E_201'],
    selfReportedSeverity: 'low',
    emergencyDetected: true,
    emergencyTrigger: 'severe_acute_dyspnea',
  });

  assert.equal(urgency.emergency_override, true, 'Emergency override must be active');
  assert.equal(urgency.assessed_urgency, 'extreme', 'Emergency override must mandate extreme urgency');

  const precautions = evaluatePrecautionsAndSpecialty(urgency);
  assert.equal(precautions.facility_navigation_contract.emergency_department_required, true, 'Emergency department must be required');
  assert.ok(precautions.urgency_guidance.recommended_timeframe.includes('emergency') || precautions.urgency_guidance.recommended_timeframe.includes('112'), 'Timeframe must advise emergency care');
});
