/**
 * Phase B1: Natural Severity Understanding Module.
 *
 * Deterministic NLP extraction of patient-reported discomfort severity.
 * Supports typos, colloquial language, Indian English, negations, corrections,
 * and symptom-specific severity breakdowns.
 */
import type { SeverityLevel } from './severity-contracts';

export interface ParsedSeverity {
  overall: SeverityLevel | null;
  symptom_severities: Record<string, SeverityLevel>;
  confidence: 'high' | 'medium' | 'low';
  raw_quote: string;
  is_other_person: boolean;
  is_negation_inversion?: boolean;
}

const NORMALIZE_MAP: Record<string, string> = {
  'extremly': 'extreme',
  'extream': 'extreme',
  'unbarable': 'unbearable',
  'unbareable': 'unbearable',
  'sever': 'severe',
  'severely': 'severe',
  'modrate': 'moderate',
  'disscomfort': 'discomfort',
  'interfers': 'interferes',
  'tolerat': 'tolerate',
  'paining': 'pain',
  'cant': "can't",
  'dont': "don't",
};

function normalizeText(text: string): string {
  let cleaned = text.toLowerCase().trim();
  for (const [typo, replacement] of Object.entries(NORMALIZE_MAP)) {
    cleaned = cleaned.replace(new RegExp(`\\b${typo}\\b`, 'g'), replacement);
  }
  return cleaned;
}

// Symptom keyword mappings to canonical evidence IDs
const SYMPTOM_PATTERNS: Array<{ evidence_id: string; pattern: RegExp }> = [
  { evidence_id: 'E_201', pattern: /\b(?:cough|coughing)\b/ },
  { evidence_id: 'E_91', pattern: /\b(?:fever|temperature|body hot)\b/ },
  { evidence_id: 'E_97', pattern: /\b(?:throat|sore throat)\b/ },
  { evidence_id: 'E_181', pattern: /\b(?:nose|runny nose|cold|stuffy nose)\b/ },
  { evidence_id: 'E_94', pattern: /\b(?:chills|shivering)\b/ },
  { evidence_id: 'E_53', pattern: /\b(?:pain|headache|chest pain|stomach pain|body pain)\b/ },
  { evidence_id: 'E_148', pattern: /\b(?:nausea|vomiting|feeling sick)\b/ },
  { evidence_id: 'E_51', pattern: /\b(?:diarrhea|loose motion)\b/ },
  { evidence_id: 'E_76', pattern: /\b(?:dizzy|dizziness|giddy|lightheaded)\b/ },
];

export function parseNaturalSeverity(rawText: string): ParsedSeverity {
  const norm = normalizeText(rawText);

  // Check if statement refers to another person
  const isOtherPerson = /\b(?:my|his|her|their)\s+(?:brother|sister|mother|father|mom|dad|child|son|daughter|friend|wife|husband|baby)\b/.test(norm)
    && !/\b(?:i|my symptoms|for me|i am)\b/.test(norm);

  if (isOtherPerson) {
    return {
      overall: null,
      symptom_severities: {},
      confidence: 'low',
      raw_quote: rawText,
      is_other_person: true,
    };
  }

  // Handle corrections / contrastive retractions: "not extreme, just low" or "not high, it's low"
  const retractionMatch = norm.match(/\bnot\s+(extreme|high|severe|medium|moderate|low|mild)\s*[;,.]?\s*(?:actually|just|it is|it's|rather)?\s*(extreme|high|severe|medium|moderate|low|mild|not sure)\b/);
  if (retractionMatch) {
    const target = retractionMatch[2];
    const resolved = mapWordToSeverity(target);
    if (resolved) {
      return {
        overall: resolved,
        symptom_severities: {},
        confidence: 'high',
        raw_quote: rawText,
        is_other_person: false,
        is_negation_inversion: true,
      };
    }
  }

  // Handle pure negations: "not extreme", "not severe"
  if (/\b(?:not|no)\s+(?:extreme|unbearable)\b/.test(norm) && !/\b(?:high|medium|low)\b/.test(norm)) {
    return {
      overall: 'medium', // Downgraded from extreme
      symptom_severities: {},
      confidence: 'medium',
      raw_quote: rawText,
      is_other_person: false,
    };
  }
  if (/\b(?:not|no)\s+(?:severe|high)\b/.test(norm) && !/\b(?:medium|low)\b/.test(norm)) {
    return {
      overall: 'low', // Downgraded from high
      symptom_severities: {},
      confidence: 'medium',
      raw_quote: rawText,
      is_other_person: false,
    };
  }

  // Check for symptom-specific severity: e.g. "cough is mild, headache is severe"
  const symptomSeverities: Record<string, SeverityLevel> = {};
  const clauses = norm.split(/[,;.]|\band\b|\bbut\b/);
  for (const clause of clauses) {
    for (const { evidence_id, pattern } of SYMPTOM_PATTERNS) {
      if (pattern.test(clause)) {
        const clauseSev = extractDirectSeverity(clause);
        if (clauseSev) {
          symptomSeverities[evidence_id] = clauseSev;
        }
      }
    }
  }

  const direct = extractDirectSeverity(norm);
  let overall = direct;

  // If symptom-specific severities found, take the highest for overall
  if (Object.keys(symptomSeverities).length > 0) {
    const ranks: Record<SeverityLevel, number> = {
      extreme: 4,
      high: 3,
      medium: 2,
      low: 1,
      not_sure: 0,
    };
    let highest: SeverityLevel = 'low';
    for (const sev of Object.values(symptomSeverities)) {
      if (ranks[sev] > ranks[highest]) {
        highest = sev;
      }
    }
    overall = overall ? (ranks[overall] > ranks[highest] ? overall : highest) : highest;
  }

  return {
    overall,
    symptom_severities: symptomSeverities,
    confidence: overall ? 'high' : 'low',
    raw_quote: rawText,
    is_other_person: false,
  };
}

function extractDirectSeverity(text: string): SeverityLevel | null {
  // 1. Extreme
  if (
    /\b(?:extreme|extremely|unbearable|intolerable|agony|excruciating|can't take it anymore|cannot take it anymore|worst ever|cannot tolerate at all|difficult to tolerate|extremely difficult to tolerate)\b/.test(text)
  ) {
    return 'extreme';
  }

  // 2. High
  if (
    /\b(?:high|severe|significantly affect(?:s)? normal functioning|significantly affect(?:s)?|hard to function|can't function properly|cannot do normal activities|very bad|bad discomfort|bad pain|bahut zyada|too much paining|too much discomfort|terrible)\b/.test(text)
  ) {
    return 'high';
  }

  // 3. Medium
  if (
    /\b(?:medium|moderate|interfere(?:s)? with daily activities|interfere(?:s)? with work|interfere(?:s)? with daily life|quite uncomfortable|somewhat uncomfortable|trouble getting through the day|bothering me)\b/.test(text)
  ) {
    return 'medium';
  }

  // 4. Low
  if (
    /\b(?:low|mild|mild discomfort|minor|slight|a little uncomfortable|normal activities are possible|normal activities are fine|manageable|tolerable|bearable|thoda|thoda thoda|little bit|not bad)\b/.test(text)
  ) {
    return 'low';
  }

  // 5. Not sure / Uncertainty
  if (
    /\b(?:not sure|don't know|unsure|hard to say|cannot say|no idea|not certain|uncertain|unable to confidently describe severity)\b/.test(text)
  ) {
    return 'not_sure';
  }

  return null;
}

function mapWordToSeverity(word: string): SeverityLevel | null {
  switch (word) {
    case 'extreme':
    case 'unbearable':
      return 'extreme';
    case 'high':
    case 'severe':
      return 'high';
    case 'medium':
    case 'moderate':
      return 'medium';
    case 'low':
    case 'mild':
      return 'low';
    case 'not sure':
      return 'not_sure';
    default:
      return null;
  }
}
