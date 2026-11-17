import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { generateSimplifiedPrecautions } from '../src/features/medassist-precautions/simplified-precautions';
import { evaluateHybridUrgency } from '../src/features/medassist-severity/urgency-engine';
import { evaluatePrecautionsAndSpecialty } from '../src/features/medassist-precautions';

console.log('=== APIP MedAssist Phase C1.1 Verification Suite ===\n');

// ---------------------------------------------------------------------------
// Gate 1: Chat Container Scrolling and CSS Layout Verification
// ---------------------------------------------------------------------------
console.log('Gate 1: Verifying Chat Container Scrolling & Bounded Layout CSS...');
const cssPath = path.resolve('src/features/medassist-conversation/conversation.css');
const cssContent = fs.readFileSync(cssPath, 'utf8');

assert.match(cssContent, /\.conversation-workspace\s*\{[^}]*height:\s*clamp\(/,
  'FAIL: .conversation-workspace must have bounded height with clamp()');
assert.match(cssContent, /\.conversation-messages\s*\{[^}]*overflow-y:\s*auto/,
  'FAIL: .conversation-messages must have overflow-y: auto');
assert.match(cssContent, /\.conversation-layout\s*\{[^}]*align-items:\s*start/,
  'FAIL: .conversation-layout must have align-items: start to prevent RHS stretching chat');
assert.match(cssContent, /\.conversation-assessment\s*\{[^}]*max-height:\s*clamp\(/,
  'FAIL: .conversation-assessment must have bounded max-height');
assert.match(cssContent, /\.conversation-assessment\s*\{[^}]*overflow-y:\s*auto/,
  'FAIL: .conversation-assessment must have internal overflow-y: auto');

const tsxPath = path.resolve('src/features/medassist-conversation/MedAssistConversation.tsx');
const tsxContent = fs.readFileSync(tsxPath, 'utf8');

assert.match(tsxContent, /isNearBottomRef\s*=\s*useRef/,
  'FAIL: MedAssistConversation must use isNearBottomRef for user-scroll awareness');
assert.match(tsxContent, /handleMessagesScroll/,
  'FAIL: MedAssistConversation must have handleMessagesScroll listener');
assert.match(tsxContent, /onScroll=\{handleMessagesScroll\}/,
  'FAIL: <ol ref={timeline}> must attach onScroll handler');
assert.match(tsxContent, /scrollTo\(\{\s*top:\s*log\.scrollHeight,\s*behavior:\s*'smooth'\s*\}\)/,
  'FAIL: MedAssistConversation must scroll internal timeline instead of window');

console.log('✓ Gate 1 passed: Bounded chat scrolling and container heights verified.\n');

// ---------------------------------------------------------------------------
// Gate 2: First Two Assessment Boxes Preserved
// ---------------------------------------------------------------------------
console.log('Gate 2: Verifying Preservation of First Two Assessment Boxes...');
assert.match(tsxContent, /<h3 className="assessment-box-title">Your Reported Severity<\/h3>/,
  'FAIL: Box 1 "Your Reported Severity" must exist');
assert.match(tsxContent, /<h3 className="assessment-box-title">Symptom-Based Assessment<\/h3>/,
  'FAIL: Box 2 "Symptom-Based Assessment" must exist');
assert.match(tsxContent, /<SeverityLevelsList\s+selectedLevel=\{patientSeverity/,
  'FAIL: Box 1 must use SeverityLevelsList with patientSeverity');
assert.match(tsxContent, /<SeverityLevelsList\s+selectedLevel=\{urgencyAssessment\.status === 'assessed'/,
  'FAIL: Box 2 must use SeverityLevelsList with urgencyAssessment.assessed_urgency');
assert.match(tsxContent, /SEVERITY_LEVELS_META\s*=\s*\[/,
  'FAIL: SEVERITY_LEVELS_META must be defined for 4 levels (low, medium, high, extreme)');

console.log('✓ Gate 2 passed: First two assessment boxes preserved intact.\n');

// ---------------------------------------------------------------------------
// Gate 3: Precaution Box Visibility & Session Lifecycle
// ---------------------------------------------------------------------------
console.log('Gate 3: Verifying Precaution Box Conditional Visibility & Lifecycle...');

// Precaution box must only show when finished or emergency
assert.match(tsxContent, /const\s+showPrecautions\s*=\s*finished\s*\|\|\s*!!emergency\s*\|\|\s*!!urgencyAssessment\.emergency_override;/,
  'FAIL: showPrecautions must gate visibility on finished or emergency');
assert.match(tsxContent, /\{showPrecautions\s*&&\s*\(\s*<div className="assessment-precautions-card">/,
  'FAIL: Box 3 must be conditionally rendered only when showPrecautions is true');

// In restart, check that timeline scrollTop is reset and results cleared
assert.match(tsxContent, /function restart\(\)\s*\{[^}]*if\s*\(timeline\.current\)\s*timeline\.current\.scrollTop\s*=\s*0;/,
  'FAIL: restart() must reset scroll position to top');
assert.match(tsxContent, /function restart\(\)\s*\{[^}]*isNearBottomRef\.current\s*=\s*true;/,
  'FAIL: restart() must reset isNearBottomRef');

console.log('✓ Gate 3 passed: Precaution visibility strictly gated on session completion or emergency.\n');

// ---------------------------------------------------------------------------
// Gate 4: Simplified Precaution Generation Verification
// ---------------------------------------------------------------------------
console.log('Gate 4: Verifying Simplified Precautions Generation (4–7 concise bullets)...');

// Scenario A: Mild Cough (Low urgency)
const mildAssessment = evaluateHybridUrgency({
  confirmedSymptoms: ['E_50'], // Cough
  selfReportedSeverity: 'low',
  symptomSeverities: {},
  age: 30,
});
const mildGuidance = evaluatePrecautionsAndSpecialty(mildAssessment, { age: 30 });
const mildPrecautions = generateSimplifiedPrecautions(mildAssessment, mildGuidance, { age: 30 });

console.log(`- Mild Cough Precautions Count: ${mildPrecautions.length}`);
assert(mildPrecautions.length >= 4 && mildPrecautions.length <= 7,
  `FAIL: Expected 4-7 bullets for mild cough, got ${mildPrecautions.length}`);
mildPrecautions.forEach((p, i) => {
  assert(p.text.length > 5 && p.text.length < 250, `FAIL: Precaution ${i} invalid length (${p.text.length})`);
  console.log(`  ${i + 1}. ${p.isWarning ? '[WARNING] ' : ''}${p.text}`);
});

// Scenario B: Moderate Multi-symptom (Fever + Cough)
const modAssessment = evaluateHybridUrgency({
  confirmedSymptoms: ['E_50', 'E_115'], // Cough + Fever
  selfReportedSeverity: 'medium',
  symptomSeverities: { E_50: 'medium', E_115: 'medium' },
  age: 45,
});
const modGuidance = evaluatePrecautionsAndSpecialty(modAssessment, { age: 45 });
const modPrecautions = generateSimplifiedPrecautions(modAssessment, modGuidance, { age: 45 });

console.log(`\n- Moderate Cough + Fever Precautions Count: ${modPrecautions.length}`);
assert(modPrecautions.length >= 4 && modPrecautions.length <= 7,
  `FAIL: Expected 4-7 bullets for moderate symptoms, got ${modPrecautions.length}`);
modPrecautions.forEach((p, i) => {
  assert(p.text.length > 5 && p.text.length < 250, `FAIL: Precaution ${i} invalid length (${p.text.length})`);
  console.log(`  ${i + 1}. ${p.isWarning ? '[WARNING] ' : ''}${p.text}`);
});

// Scenario C: Emergency (Chest pain / shortness of breath)
const emergAssessment = evaluateHybridUrgency({
  confirmedSymptoms: ['E_50', 'E_51'], // Cough + Severe chest pain / breathlessness trigger
  selfReportedSeverity: 'extreme',
  symptomSeverities: {},
  age: 62,
  emergencyDetected: true,
  emergencyTrigger: 'Severe chest discomfort and breathing difficulty reported',
});
const emergGuidance = evaluatePrecautionsAndSpecialty(emergAssessment, { age: 62 });
const emergPrecautions = generateSimplifiedPrecautions(emergAssessment, emergGuidance, { age: 62 });

console.log(`\n- Emergency Precautions Count: ${emergPrecautions.length}`);
assert(emergPrecautions.length >= 4 && emergPrecautions.length <= 7,
  `FAIL: Expected 4-7 bullets for emergency, got ${emergPrecautions.length}`);
const hasEmergencyWarning = emergPrecautions.some(p => p.isWarning && /112|108|emergency/i.test(p.text));
assert(hasEmergencyWarning, 'FAIL: Emergency precautions must feature immediate emergency warning with 112 / 108');
emergPrecautions.forEach((p, i) => {
  assert(p.text.length > 5 && p.text.length < 250, `FAIL: Precaution ${i} invalid length (${p.text.length})`);
  console.log(`  ${i + 1}. ${p.isWarning ? '[WARNING] ' : ''}${p.text}`);
});

// Scenario D: Pediatric High Fever (Child safety)
const pedAssessment = evaluateHybridUrgency({
  confirmedSymptoms: ['E_115'], // Fever in child
  selfReportedSeverity: 'high',
  symptomSeverities: { E_115: 'high' },
  age: 4,
});
const pedGuidance = evaluatePrecautionsAndSpecialty(pedAssessment, { age: 4 });
const pedPrecautions = generateSimplifiedPrecautions(pedAssessment, pedGuidance, { age: 4 });

console.log(`\n- Pediatric Fever Precautions Count: ${pedPrecautions.length}`);
assert(pedPrecautions.length >= 4 && pedPrecautions.length <= 7,
  `FAIL: Expected 4-7 bullets for pediatric fever, got ${pedPrecautions.length}`);
pedPrecautions.forEach((p, i) => {
  console.log(`  ${i + 1}. ${p.isWarning ? '[WARNING] ' : ''}${p.text}`);
});

console.log('\n✓ Gate 4 passed: Precaution simplification produces 4-7 concise, actionable, symptom-grounded bullets across all profiles.\n');

console.log('=== All Phase C1.1 Verification Gates Passed Successfully! ===');
