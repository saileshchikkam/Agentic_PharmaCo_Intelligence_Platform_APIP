/**
 * Phase C1: MedAssist Session PDF Export.
 *
 * Generates a clean, readable, standard PDF (PDF 1.4) document
 * summarizing the completed MedAssist conversation, symptoms,
 * Q&A, severity results, precautions, and research disclaimer.
 *
 * Zero external npm dependencies. Works in browser and Node.js.
 */

export interface SessionPdfData {
  sessionDate: string;
  patientDescription: string;
  confirmedSymptoms: string[];
  fictionalAge: number | null;
  fictionalSex?: string | null;
  questionsAndAnswers: Array<{ question: string; answer: string }>;
  patientSeverity: string | null;
  symptomSeverities?: Record<string, string>;
  assessedUrgency: string | null;
  urgencyRationale?: string;
  emergencyOverride: boolean;
  emergencyTrigger?: string | null;
  riskFactors?: string[];
  recommendedSpecialty?: { primary: string; alternative?: string; rationale?: string };
  precautions?: {
    timeframe: string;
    whatToDo: string[];
    whatToAvoid: string[];
    warningSigns: string[];
  };
}

function sanitizeText(str: string): string {
  if (!str) return '';
  return str
    .replace(/\r\n/g, ' ')
    .replace(/[\r\n]/g, ' ')
    .replace(/[’‘]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[—–]/g, '-')
    .replace(/[•]/g, '*')
    .replace(/[✓✔]/g, '[X]')
    .replace(/[^\x20-\x7E]/g, ' ') // Restrict to standard printable ASCII for Type 1 fonts
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)');
}

interface TextLine {
  text: string;
  font: 'F1' | 'F2'; // F1 = Regular, F2 = Bold
  size: number;
  r?: number;
  g?: number;
  b?: number;
  indent?: number;
}

export function generateSessionPdf(data: SessionPdfData): Uint8Array {
  const lines: TextLine[] = [];

  // Header
  lines.push({ text: 'APIP MedAssist - Patient Session Summary', font: 'F2', size: 16, r: 0.08, g: 0.35, b: 0.65 });
  lines.push({ text: 'Agentic Pharma Co-intelligence Platform - Research Demonstration', font: 'F1', size: 10, r: 0.4, g: 0.4, b: 0.4 });
  lines.push({ text: `Generated: ${data.sessionDate}  |  Session Status: Complete (Research Prototype)`, font: 'F1', size: 9, r: 0.4, g: 0.4, b: 0.4 });
  lines.push({ text: '------------------------------------------------------------------------------------------------------', font: 'F1', size: 8, r: 0.7, g: 0.7, b: 0.7 });

  // 1. Intake & Confirmed Symptoms
  lines.push({ text: '1. PATIENT INTAKE & CONFIRMED SYMPTOMS', font: 'F2', size: 11, r: 0.1, g: 0.1, b: 0.1 });
  lines.push({ text: `Reported Description: "${data.patientDescription || 'No description recorded.'}"`, font: 'F1', size: 10, indent: 10 });
  const symText = data.confirmedSymptoms.length > 0 ? data.confirmedSymptoms.join(', ') : 'None confirmed';
  lines.push({ text: `Confirmed Symptoms: ${symText}`, font: 'F1', size: 10, indent: 10 });
  if (data.fictionalAge !== null || data.fictionalSex !== null) {
    const ageSex = [data.fictionalAge !== null ? `Age: ${data.fictionalAge} yrs` : null, data.fictionalSex ? `Sex: ${data.fictionalSex}` : null].filter(Boolean).join(', ');
    lines.push({ text: `Patient Context: ${ageSex}`, font: 'F1', size: 10, indent: 10 });
  }
  lines.push({ text: ' ', font: 'F1', size: 6 });

  // 2. Both Severity Results
  lines.push({ text: '2. SEVERITY & URGENCY ASSESSMENT', font: 'F2', size: 11, r: 0.1, g: 0.1, b: 0.1 });
  const pSev = data.patientSeverity ? data.patientSeverity.toUpperCase() : 'NOT REPORTED';
  lines.push({ text: `Your Reported Severity:  ${pSev}`, font: 'F2', size: 10, indent: 10, r: 0.1, g: 0.3, b: 0.6 });
  if (data.symptomSeverities && Object.keys(data.symptomSeverities).length > 0) {
    const spec = Object.entries(data.symptomSeverities).map(([k, v]) => `${k}: ${v}`).join('; ');
    lines.push({ text: `Symptom Breakdown: ${spec}`, font: 'F1', size: 9, indent: 20, r: 0.3, g: 0.3, b: 0.3 });
  }

  const sysUrgency = data.assessedUrgency ? data.assessedUrgency.toUpperCase() : 'UNABLE TO ASSESS';
  lines.push({ text: `Symptom-Based Assessment:  ${sysUrgency}`, font: 'F2', size: 10, indent: 10, r: 0.1, g: 0.3, b: 0.6 });
  if (data.emergencyOverride) {
    lines.push({ text: `EMERGENCY SAFETY OVERRIDE ACTIVE: ${data.emergencyTrigger || 'Red-flag symptom identified'}`, font: 'F2', size: 9, indent: 20, r: 0.8, g: 0.1, b: 0.1 });
  }
  if (data.urgencyRationale) {
    lines.push({ text: `Assessment Rationale: ${data.urgencyRationale}`, font: 'F1', size: 9, indent: 20 });
  }
  if (data.riskFactors && data.riskFactors.length > 0) {
    lines.push({ text: `Identified Risk Factors: ${data.riskFactors.join(', ')}`, font: 'F1', size: 9, indent: 20 });
  }
  lines.push({ text: ' ', font: 'F1', size: 6 });

  // 3. Recommended Precautions
  lines.push({ text: '3. RECOMMENDED PRECAUTIONS & COMFORT GUIDANCE', font: 'F2', size: 11, r: 0.1, g: 0.1, b: 0.1 });
  if (data.precautions) {
    lines.push({ text: 'When to Seek Medical Attention:', font: 'F2', size: 9, indent: 10 });
    lines.push({ text: `* ${data.precautions.timeframe}`, font: 'F1', size: 9, indent: 20 });

    if (data.precautions.whatToDo.length > 0) {
      lines.push({ text: 'What to Do (Supportive Comfort Measures):', font: 'F2', size: 9, indent: 10 });
      for (const item of data.precautions.whatToDo.slice(0, 4)) {
        lines.push({ text: `* ${item}`, font: 'F1', size: 9, indent: 20 });
      }
    }

    if (data.precautions.whatToAvoid.length > 0) {
      lines.push({ text: 'What to Avoid:', font: 'F2', size: 9, indent: 10 });
      for (const item of data.precautions.whatToAvoid.slice(0, 4)) {
        lines.push({ text: `* ${item}`, font: 'F1', size: 9, indent: 20 });
      }
    }

    if (data.precautions.warningSigns.length > 0) {
      lines.push({ text: 'Warning Signs (Red Flags):', font: 'F2', size: 9, indent: 10, r: 0.8, g: 0.1, b: 0.1 });
      for (const item of data.precautions.warningSigns.slice(0, 4)) {
        lines.push({ text: `* ${item}`, font: 'F1', size: 9, indent: 20, r: 0.8, g: 0.1, b: 0.1 });
      }
    }
  } else {
    lines.push({ text: 'No symptom precautions recorded for this session.', font: 'F1', size: 9, indent: 10 });
  }
  lines.push({ text: ' ', font: 'F1', size: 6 });

  // 4. Healthcare Specialty Recommendation
  if (data.recommendedSpecialty) {
    lines.push({ text: '4. HEALTHCARE SPECIALTY ROUTING', font: 'F2', size: 11, r: 0.1, g: 0.1, b: 0.1 });
    lines.push({ text: `Primary Specialty: ${data.recommendedSpecialty.primary}`, font: 'F2', size: 9, indent: 10 });
    if (data.recommendedSpecialty.alternative) {
      lines.push({ text: `Alternative Specialty: ${data.recommendedSpecialty.alternative}`, font: 'F1', size: 9, indent: 10 });
    }
    if (data.recommendedSpecialty.rationale) {
      lines.push({ text: `Clinical Routing Rationale: ${data.recommendedSpecialty.rationale}`, font: 'F1', size: 9, indent: 10 });
    }
    lines.push({ text: ' ', font: 'F1', size: 6 });
  }

  // 5. Questions and Answers
  lines.push({ text: '5. CONVERSATION QUESTIONS & ANSWERS', font: 'F2', size: 11, r: 0.1, g: 0.1, b: 0.1 });
  if (data.questionsAndAnswers.length > 0) {
    for (let i = 0; i < data.questionsAndAnswers.length; i++) {
      const qa = data.questionsAndAnswers[i];
      lines.push({ text: `Q${i + 1}: ${qa.question}`, font: 'F2', size: 9, indent: 10 });
      lines.push({ text: `A: ${qa.answer}`, font: 'F1', size: 9, indent: 20 });
    }
  } else {
    lines.push({ text: 'No follow-up questions recorded in this session.', font: 'F1', size: 9, indent: 10 });
  }
  lines.push({ text: ' ', font: 'F1', size: 6 });

  // 6. Research Safety Disclaimer
  lines.push({ text: '------------------------------------------------------------------------------------------------------', font: 'F1', size: 8, r: 0.7, g: 0.7, b: 0.7 });
  lines.push({ text: 'RESEARCH DISCLAIMER & SAFETY NOTICE', font: 'F2', size: 9, r: 0.5, g: 0.1, b: 0.1 });
  lines.push({ text: 'This session summary is generated by the APIP MedAssist academic research demonstrator.', font: 'F1', size: 8, r: 0.4, g: 0.4, b: 0.4 });
  lines.push({ text: 'It is NOT certified medical advice, clinical triage, or a diagnostic tool. No drug prescriptions or', font: 'F1', size: 8, r: 0.4, g: 0.4, b: 0.4 });
  lines.push({ text: 'therapeutic dosages are provided. If experiencing a life-threatening medical emergency, call 112 / 108.', font: 'F1', size: 8, r: 0.4, g: 0.4, b: 0.4 });

  // Wrap lines to fit width (max ~80 chars per line for standard size)
  const wrappedLines: TextLine[] = [];
  for (const line of lines) {
    const maxChars = line.size >= 14 ? 55 : line.size >= 11 ? 75 : 90;
    if (line.text.length <= maxChars || line.text.startsWith('---')) {
      wrappedLines.push(line);
    } else {
      // Word wrap
      const words = line.text.split(' ');
      let current = '';
      for (const w of words) {
        if ((current + ' ' + w).trim().length > maxChars) {
          wrappedLines.push({ ...line, text: current });
          current = (line.indent ? '  ' : '') + w;
        } else {
          current = current ? current + ' ' + w : w;
        }
      }
      if (current) wrappedLines.push({ ...line, text: current });
    }
  }

  // Page layout: A4 = 595.28 x 841.89 points
  const pageHeight = 841.89;
  const leftX = 45;
  const topY = 800;
  const bottomY = 50;

  const pages: string[] = [];
  let currentStream: string[] = [];
  let y = topY;

  for (const line of wrappedLines) {
    const lineHeight = line.size + 4;
    if (y - lineHeight < bottomY) {
      // Start new page
      pages.push(currentStream.join('\n'));
      currentStream = [];
      y = topY;
    }

    const r = line.r ?? 0;
    const g = line.g ?? 0;
    const b = line.b ?? 0;
    const x = leftX + (line.indent ?? 0);
    const escaped = sanitizeText(line.text);

    currentStream.push('BT');
    currentStream.push(`/${line.font} ${line.size} Tf`);
    currentStream.push(`${r.toFixed(3)} ${g.toFixed(3)} ${b.toFixed(3)} rg`);
    currentStream.push(`1 0 0 1 ${x.toFixed(2)} ${y.toFixed(2)} Tm`);
    currentStream.push(`(${escaped}) Tj`);
    currentStream.push('ET');

    y -= lineHeight;
  }

  if (currentStream.length > 0) {
    pages.push(currentStream.join('\n'));
  }

  if (pages.length === 0) {
    pages.push('BT /F1 12 Tf 50 750 Td (No content) Tj ET');
  }

  return assemblePdf(pages);
}

function assemblePdf(pageStreams: string[]): Uint8Array {
  const objects: string[] = [];
  const count = pageStreams.length;

  // Obj 1: Catalog
  // Obj 2: Pages
  // Obj 3..3+count-1: Page objects
  // Obj 3+count..3+2*count-1: Content stream objects
  // Obj 3+2*count: Font F1 (Helvetica)
  // Obj 3+2*count+1: Font F2 (Helvetica-Bold)

  const fontF1ObjId = 3 + 2 * count;
  const fontF2ObjId = fontF1ObjId + 1;

  // 1: Catalog
  objects.push('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj');

  // 2: Pages
  const kids = Array.from({ length: count }, (_, i) => `${3 + i} 0 R`).join(' ');
  objects.push(`2 0 obj\n<< /Type /Pages /Kids [${kids}] /Count ${count} >>\nendobj`);

  // 3..3+count-1: Page objects
  for (let i = 0; i < count; i++) {
    const pageObjId = 3 + i;
    const streamObjId = 3 + count + i;
    objects.push(
      `${pageObjId} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595.28 841.89] ` +
      `/Resources << /Font << /F1 ${fontF1ObjId} 0 R /F2 ${fontF2ObjId} 0 R >> >> ` +
      `/Contents ${streamObjId} 0 R >>\nendobj`
    );
  }

  // Content streams
  for (let i = 0; i < count; i++) {
    const streamObjId = 3 + count + i;
    const stream = pageStreams[i];
    const len = Buffer.byteLength(stream, 'utf-8');
    objects.push(
      `${streamObjId} 0 obj\n<< /Length ${len} >>\nstream\n${stream}\nendstream\nendobj`
    );
  }

  // Fonts
  objects.push(`${fontF1ObjId} 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj`);
  objects.push(`${fontF2ObjId} 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj`);

  // Assemble PDF bytes
  let pdf = '%PDF-1.4\n%\xE2\xE3\xCF\xD3\n';
  const offsets: number[] = [0]; // 0-th object

  for (let i = 0; i < objects.length; i++) {
    offsets.push(Buffer.byteLength(pdf, 'utf-8'));
    pdf += objects[i] + '\n';
  }

  const startxref = Buffer.byteLength(pdf, 'utf-8');
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += '0000000000 65535 f \n';
  for (let i = 1; i <= objects.length; i++) {
    const off = String(offsets[i]).padStart(10, '0');
    pdf += `${off} 00000 n \n`;
  }

  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${startxref}\n%%EOF\n`;

  return Buffer.from(pdf, 'utf-8');
}
