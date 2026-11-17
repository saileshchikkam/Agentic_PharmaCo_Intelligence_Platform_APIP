import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { generateSessionPdf, preserveUnicodeText } from '../src/features/medassist-conversation/pdf-export';
import { evaluateHybridUrgency } from '../src/features/medassist-severity/urgency-engine';
import { evaluatePrecautionsAndSpecialty } from '../src/features/medassist-precautions/precaution-engine';

test('Phase C1 Stabilization Gate 1: Native Browser PDF (Zero Node.js Buffer Dependency)', () => {
  const code = readFileSync('src/features/medassist-conversation/pdf-export.ts', 'utf-8');

  // Verify zero reliance on Node.js Buffer
  assert.doesNotMatch(code, /\bBuffer\b/, 'pdf-export.ts must not reference Node.js Buffer');
  assert.doesNotMatch(code, /Buffer\.from/, 'pdf-export.ts must not call Buffer.from');
  assert.doesNotMatch(code, /Buffer\.byteLength/, 'pdf-export.ts must not call Buffer.byteLength');
  assert.match(code, /TextEncoder/, 'pdf-export.ts must use standard TextEncoder for byte encoding');

  // Verify generator returns a Uint8Array
  const samplePdf = generateSessionPdf({
    sessionDate: '11/17/2026, 11:45:00 AM',
    patientDescription: 'Mild cough',
    confirmedSymptoms: ['cough'],
    fictionalAge: 30,
    questionsAndAnswers: [],
    patientSeverity: 'low',
    assessedUrgency: 'low',
    emergencyOverride: false,
  });

  assert.ok(samplePdf instanceof Uint8Array);
  const pdfText = new TextDecoder('latin1').decode(samplePdf);
  assert.ok(pdfText.startsWith('%PDF-1.4'));
  assert.ok(pdfText.includes('%%EOF'));
});

test('Phase C1 Stabilization Gate 2: Unicode & Telugu Symptom Preservation', () => {
  const teluguInput = 'తీవ్రమైన దగ్గు మరియు జ్వరం (Severe cough and fever)';
  const enriched = preserveUnicodeText(teluguInput);
  assert.ok(enriched.includes('దగ్గు'), 'Telugu script దగ్గు must be preserved');
  assert.ok(enriched.includes('జ్వరం'), 'Telugu script జ్వరం must be preserved');
  assert.ok(enriched.includes('daggu: cough'), 'Transliterated gloss must be appended for clinical readability');

  const pdfBytes = generateSessionPdf({
    sessionDate: '11/17/2026, 11:45:00 AM',
    patientDescription: 'నాకు దగ్గు మరియు జ్వరం ఉంది (I have cough and fever)',
    confirmedSymptoms: ['దగ్గు (cough)', 'జ్వరం (fever)'],
    fictionalAge: 40,
    questionsAndAnswers: [
      { question: 'ఎప్పటినుంచి ఉంది? (Since when?)', answer: '3 రోజుల నుంచి (Since 3 days)' },
    ],
    patientSeverity: 'medium',
    assessedUrgency: 'medium',
    emergencyOverride: false,
  });

  // Verify byte presence in UTF-8
  const utf8String = new TextDecoder('utf-8').decode(pdfBytes);
  // Also verify PDF stream structure
  assert.ok(utf8String.includes('APIP MedAssist - Patient Session Summary'));
  // Verify Telugu Unicode characters exist in the output stream
  assert.ok(utf8String.includes('0C26') || utf8String.includes('దగ్గు'), 'Telugu Unicode must be present in PDF stream');
  assert.ok(utf8String.includes('daggu: cough'), 'Clinical gloss must be present for readability');
});

test('Phase C1 Stabilization Gate 3: Emergency-Terminated Session PDF Download & Readability', () => {
  const emergencyPdfBytes = generateSessionPdf({
    sessionDate: '11/17/2026, 11:50:00 AM',
    patientDescription: 'Crushing chest pain and cannot breathe at rest',
    confirmedSymptoms: ['chest pain', 'severe dyspnea'],
    fictionalAge: 58,
    fictionalSex: 'M',
    questionsAndAnswers: [
      { question: 'Do you have difficulty breathing?', answer: 'Yes, I cannot catch my breath' },
    ],
    patientSeverity: 'extreme',
    assessedUrgency: 'extreme',
    emergencyOverride: true,
    emergencyTrigger: 'severe_acute_dyspnea',
    riskFactors: ['adult_emergency_warning_sign', 'respiratory_distress'],
    recommendedSpecialty: {
      primary: 'Emergency Medicine',
      rationale: 'Life-threatening acute dyspnea requires immediate 24x7 Emergency Department care.',
    },
    precautions: {
      timeframe: 'IMMEDIATE EMERGENCY: Call 112 / 108 immediately or proceed to the nearest 24x7 Emergency Department.',
      whatToDo: [
        'Call emergency services immediately (112 in India).',
        'Stay in an upright seated position to maintain open airway.',
        'Keep medical information accessible for ambulance responders.',
      ],
      whatToAvoid: [
        'Do NOT drive yourself to the emergency department.',
        'Do NOT delay seeking emergency professional care.',
        'Do NOT exert yourself or consume unverified medications.',
      ],
      warningSigns: [
        'CRITICAL EMERGENCY TRIGGER: severe_acute_dyspnea',
        'Cyanosis (bluish lips or fingers)',
        'Loss of consciousness or severe confusion',
      ],
    },
  });

  assert.ok(emergencyPdfBytes.length > 1000);
  const pdfLatin = new TextDecoder('latin1').decode(emergencyPdfBytes);

  // Assert emergency banner, trigger, and extreme urgency
  assert.ok(pdfLatin.includes('CRITICAL EMERGENCY SAFETY OVERRIDE ACTIVE'));
  assert.ok(pdfLatin.includes('IMMEDIATE EMERGENCY ACTION REQUIRED'));
  assert.ok(pdfLatin.includes('Emergency Trigger: severe_acute_dyspnea'));
  assert.ok(pdfLatin.includes('Symptom-Based Assessment:  EXTREME \\(EMERGENCY OVERRIDE\\)'));
  assert.ok(pdfLatin.includes('Primary Specialty: Emergency Medicine'));
  assert.ok(pdfLatin.includes('Call 112'));
});

test('Phase C1 Stabilization Gate 4: Zero Silent Truncation of Safety-Critical Precautions', () => {
  const tsx = readFileSync('src/features/medassist-conversation/MedAssistConversation.tsx', 'utf-8');
  const pdfExport = readFileSync('src/features/medassist-conversation/pdf-export.ts', 'utf-8');

  // Verify .slice(0, 4) is removed from precautions rendering in TSX
  assert.doesNotMatch(tsx, /precaution-bullet-list[\s\S]*?\.slice\(0,\s*4\)/, 'Precautions in UI must never be truncated with slice(0, 4)');

  // Verify .slice(0, 4) is removed from pdf-export.ts
  assert.doesNotMatch(pdfExport, /whatToDo\.slice\(0,\s*4\)/, 'whatToDo in PDF must not be truncated');
  assert.doesNotMatch(pdfExport, /whatToAvoid\.slice\(0,\s*4\)/, 'whatToAvoid in PDF must not be truncated');
  assert.doesNotMatch(pdfExport, /warningSigns\.slice\(0,\s*4\)/, 'warningSigns in PDF must not be truncated');

  // Generate a PDF with 7 whatToDo items, 6 whatToAvoid items, and 8 warning signs
  const multiItems = Array.from({ length: 8 }, (_, i) => `Critical Safety Precaution #${i + 1}`);
  const testPdf = generateSessionPdf({
    sessionDate: '11/17/2026, 11:55:00 AM',
    patientDescription: 'Multi-symptom case',
    confirmedSymptoms: ['fever', 'cough', 'rash'],
    fictionalAge: 25,
    questionsAndAnswers: [],
    patientSeverity: 'medium',
    assessedUrgency: 'medium',
    emergencyOverride: false,
    precautions: {
      timeframe: 'Consult within 24 hours',
      whatToDo: multiItems,
      whatToAvoid: multiItems,
      warningSigns: multiItems,
    },
  });

  const pdfText = new TextDecoder('latin1').decode(testPdf);
  for (let i = 1; i <= 8; i++) {
    assert.ok(pdfText.includes(`Critical Safety Precaution #${i}`), `Precaution #${i} must be preserved in the PDF output`);
  }
});
