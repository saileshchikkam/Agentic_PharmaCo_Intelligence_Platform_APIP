export const steps = ['concern', 'duration', 'impact', 'changes'] as const;
export type Field = typeof steps[number];
export type Language = 'en' | 'te';
export type Answers = Record<Field, string | null>;
export const emptyAnswers = (): Answers => ({ concern: null, duration: null, impact: null, changes: null });

export function readSuggestions(value: unknown, answers: Answers): { quotes: Answers; model: string } | null {
  if (!value || typeof value !== 'object') return null;
  const result = value as { suggestions?: Record<string, unknown>; model?: unknown; provider?: unknown };
  if (result.provider !== 'ollama-local' || typeof result.model !== 'string' || !result.suggestions
    || Object.keys(result.suggestions).length !== 4) return null;
  for (const field of steps) {
    if (!Object.hasOwn(result.suggestions, field)) return null;
    const quote = result.suggestions[field];
    if (quote !== null && (typeof quote !== 'string' || !quote.trim() || quote.length > 400
      || !answers[field]?.includes(quote))) return null;
  }
  return { quotes: result.suggestions as Answers, model: result.model };
}

export const prompts = {
  en: {
    concern: 'What symptoms or health issue is this fictional person experiencing?',
    duration: 'When did it start, and how long has it been happening? Leave it unknown if you are unsure.',
    impact: 'How is it affecting their usual activities? Describe it in their own words.',
    changes: 'Has anything changed since it started? Is there anything else they want to share?',
  },
  te: {
    concern: 'ఈ కల్పిత వ్యక్తికి ఏ లక్షణాలు లేదా ఆరోగ్య సమస్య ఉన్నాయి?',
    duration: 'ఇది ఎప్పుడు మొదలైంది? ఎంతకాలంగా ఉంది? తెలియకపోతే తెలియదు అని ఉంచండి.',
    impact: 'ఇది వారి రోజువారీ పనులను ఎలా ప్రభావితం చేస్తోంది? వారి మాటల్లో చెప్పండి.',
    changes: 'మొదలైనప్పటి నుంచి ఏమైనా మార్పులు వచ్చాయా? ఇంకా ఏదైనా చెప్పాలనుకుంటున్నారా?',
  },
};

export const labels = {
  en: { concern: 'Symptoms or concern', duration: 'When it started', impact: 'Effect on usual activities', changes: 'Changes and other details' },
  te: { concern: 'లక్షణాలు లేదా సమస్య', duration: 'ఎప్పుడు మొదలైంది', impact: 'రోజువారీ పనులపై ప్రభావం', changes: 'మార్పులు, ఇతర వివరాలు' },
};

/** Only an explicitly supplied location goes to Maps; patient statements never enter this URL. */
export function hospitalSearchUrl(location: string): string | null {
  const value = location.trim();
  if (!value || value.length > 180) return null;
  const url = new URL('https://www.google.com/maps/search/');
  url.searchParams.set('api', '1');
  url.searchParams.set('query', `hospitals near ${value}`);
  return url.toString();
}
