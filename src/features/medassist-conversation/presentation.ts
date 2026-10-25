import type { Context } from '../model-a-research/contracts';

export const welcome = "Hello! I’m MedAssist AI.\n\nI can help organize a fictional symptom description and ask follow-up questions. I cannot diagnose, assess urgency or replace a healthcare professional.\n\nThis is a research demo. Tell me how the fictional person is feeling today.";

/** Explicit fictional context only; no profile import or inferred demographic defaults. */
export function readFictionalAge(text: string): number | null {
  const value = text.trim().toLowerCase();
  if (value.length > 300 || !/^(?:0|[1-9]\d*)(?:\.\d+)?(?:\s+years?(?:\s+old)?)?$/.test(value)) return null;
  const age = Number(value.replace(/\s+years?(?:\s+old)?$/, ''));
  return Number.isFinite(age) && age >= 0 ? age : null;
}
export function readSourceSex(text: string): Context['source_sex'] | null {
  const value = text.trim().toLowerCase();
  return ['f', 'female'].includes(value) ? 'F' : ['m', 'male'].includes(value) ? 'M' : null;
}
export const contextUnknown = (text: string) => ['unknown', 'not sure', "i don't know", 'unsupported', 'other', 'prefer not to say'].includes(text.trim().toLowerCase());
export const requestsNavigation = (text: string) => /^(?:please\s+)?(?:find (?:care|hospitals?|healthcare)|show (?:nearby )?hospitals?|help me find care)[.!]?$/i.test(text.trim());
export function assessmentStatus({ started, finished, unavailable }: { started: boolean; finished: boolean; unavailable: boolean }) {
  return finished || unavailable ? 'Unable to assess' : started ? 'Gathering information' : 'Not assessed';
}
