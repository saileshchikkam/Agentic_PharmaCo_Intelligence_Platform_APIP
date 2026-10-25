import { anchors, labelIsSupported } from './concepts';
/** Conversational transport and proposals, separate from the frozen research API. */
import { readDemoResult, readRequest, type Answer, type Context, type DemoResult, type Question } from '../model-a-research/contracts';
export type Definition = {
    evidence_id: string;
    kind: 'symptom' | 'antecedent';
    data_type: 'B' | 'C' | 'M';
    question_en: string;
    possible_values: (string | number | boolean)[];
    initial_allowed: boolean;
    value_labels?: Record<string,string>;
};
export type NaturalVocabulary = {
    schema_version: 'medassist.natural-vocabulary.v1';
    fictional_only: true;
    items: Definition[];
    coverage: {
        symptom_fields: number;
        universal_coverage: false;
    };
};
export type NaturalRequest = {
    schema_version: 'medassist.natural-request.v1';
    fictional_only: true;
    context: Context;
    initial: Answer;
    initial_disclosures: Answer[];
    turns: {
        answer: Answer;
        disclosures: Answer[];
    }[];
    stop: 'user_stopped' | 'unresolved_contradiction' | null;
};
export type NaturalResult = {
    schema_version: 'medassist.natural-result.v1';
    result: DemoResult;
    progress: {
        answered: number;
        target: 8;
        hard_limit: 10;
    };
    audit: {
        filter_version: 'topical-candidates.v1'|'topical-candidates.v2';
        candidate_ids: string[];
        frozen_feature_encoding: true;
        clinical_validation: false;
    };
};
export const object = (v: any) => v && typeof v === 'object' && !Array.isArray(v);
export function readNaturalVocabulary(v: any): NaturalVocabulary | null {
    if (!object(v) || v.schema_version !== 'medassist.natural-vocabulary.v1' || v.fictional_only !== true || !Array.isArray(v.items) || !v.items.length || v.items.length > 223
        || !v.items.every((d: any) => object(d) && /^E_\d{1,3}$/.test(d.evidence_id) && ['symptom', 'antecedent'].includes(d.kind) && ['B', 'C', 'M'].includes(d.data_type)
            && typeof d.question_en === 'string' && d.question_en.length < 4096 && typeof d.initial_allowed === 'boolean' && Array.isArray(d.possible_values) && d.possible_values.length <= 223
            && (d.value_labels===undefined || object(d.value_labels) && Object.entries(d.value_labels).every(([key,label])=>d.possible_values.some((v:unknown)=>String(v)===key)&&typeof label==='string'&&label.length<512))
            && d.possible_values.every((x: any) => typeof x === 'string' || typeof x === 'boolean' || typeof x === 'number' && Number.isFinite(x)))
        || new Set(v.items.map((d: any) => d.evidence_id)).size !== v.items.length || v.coverage?.universal_coverage !== false || !Number.isInteger(v.coverage?.symptom_fields))
        return null;
    return v;
}
export function readNaturalRequest(v: any): NaturalRequest | null {
    if (!object(v) || Object.keys(v).sort().join() !== 'context,fictional_only,initial,initial_disclosures,schema_version,stop,turns'
        || v.schema_version !== 'medassist.natural-request.v1' || v.fictional_only !== true || !Array.isArray(v.initial_disclosures) || v.initial_disclosures.length > 8
        || !Array.isArray(v.turns) || v.turns.length > 10 || !v.turns.every((t: any) => object(t) && Object.keys(t).sort().join() === 'answer,disclosures' && Array.isArray(t.disclosures) && t.disclosures.length <= 8))
        return null;
    const answers = [...v.initial_disclosures, ...v.turns.flatMap((t: any) => [t.answer, ...t.disclosures])];
    return readRequest({ schema_version: 'model-a.request.v1', fictional_case: true, context: v.context, initial: v.initial, answers, stop: v.stop }) ? v : null;
}
export function readNaturalResult(v: any): NaturalResult | null {
    if (!object(v) || v.schema_version !== 'medassist.natural-result.v1' || !readDemoResult(v.result) || !v.result.handoff
        || !Number.isInteger(v.progress?.answered) || v.progress.answered < 0 || v.progress.answered > 10 || v.progress.target !== 8 || v.progress.hard_limit !== 10
        || !['topical-candidates.v1','topical-candidates.v2'].includes(v.audit?.filter_version) || v.audit.frozen_feature_encoding !== true || v.audit.clinical_validation !== false
        || !Array.isArray(v.audit.candidate_ids) || v.audit.candidate_ids.length > 223 || !v.audit.candidate_ids.every((id: any) => typeof id === 'string' && /^E_\d{1,3}$/.test(id)))
        return null;
    return v;
}
// Supported language anchors are deliberately narrower than the complete schema.
export { anchors } from './concepts';
const detailLabels: Record<string, string> = {
    E_53: 'pain', E_54: 'pain characteristics', E_55: 'pain location', E_56: 'pain intensity', E_57: 'radiating pain', E_58: 'precision of pain location', E_59: 'speed of pain onset',
    E_130: 'rash color', E_131: 'peeling lesions', E_132: 'swollen rash', E_133: 'rash location', E_134: 'rash pain intensity', E_135: 'lesions larger than 1 cm', E_136: 'itch intensity', E_152: 'swelling location',
    E_161: 'loss of appetite or feeling full sooner', E_150: 'ability to pass stool or gas', E_173: 'heartburn with a bitter taste', E_88: 'exhaustion preventing usual activities',
    E_77: 'increased or colored sputum with cough', E_112: 'inhaled wheeze after coughing', E_202: 'whooping cough', E_90: 'weakness worsened by fatigue or stress', E_157: 'numb limbs and tingling around the mouth', E_52: 'double vision',
    E_172: 'difficulty raising an eyelid', E_180: 'difficulty controlling eye direction', E_216: 'pain increased by movement', E_220: 'pain increased by deep breathing', E_221: 'pain increased by coughing or straining',
    E_215: 'pain worsened after eating', E_217: 'pain worse lying flat and better upright', E_218: 'pain worsened by exertion and improved by rest',
};
export const evidenceLabel = (id: string) => anchors[id]?.label ?? detailLabels[id] ?? 'another reported detail';
/** Fixed engineering phrasing: same ID and proposition, never generated by an LLM. */
export const questionText = (q: Question) => q.evidence_id === 'E_161'
    ? 'Have you recently lost your appetite, or felt full sooner than usual?'
    : q.evidence_id === 'E_88' ? 'Are you too tired to do your usual activities, or in bed all day?' : q.question_en;
export type Proposal = {
    schema_version: 'medassist.natural-extraction.v1';
    observations: (Answer & {
        quote: string;
    })[];
    unmapped: {
        quote: string;
        kind: 'duration' | 'unsupported' | 'ambiguous';
    }[];
    instruction_attempt: boolean;
};
export const proposalAddsInformation=(proposal:Proposal,known:Answer[])=>proposal.observations.some(a=>{
    const old=known.find(k=>k.evidence_id===a.evidence_id);
    return !old||old.state!==a.state||JSON.stringify(old.value)!==JSON.stringify(a.value);
});
const exactKeys = (v: any, fields: string) => object(v) && Object.keys(v).sort().join() === fields;
/** Narrow an overlong support quote only; never change IDs, states or values.
 * The complete source and all proposed fields still pass readProposal below.
 */
export function normalizeProposalQuotes(raw: any): unknown {
    if (!object(raw) || !Array.isArray(raw.observations) || raw.observations.length > 8) return raw;
    const unsupported: Proposal['unmapped'] = [];
    const observations = raw.observations.filter((item: any) => {
        // A denial of any vomiting is not the qualified repeated-vomiting field.
        // Preserve the exact denial visibly as unsupported text, never as another
        // feature, UNKNOWN, or an accepted negative in the frozen evidence schema.
        if (exactKeys(item, 'evidence_id,quote,state,value') && item.evidence_id === 'E_211' && item.state === 'confirmed' && item.value === false
            && typeof item.quote === 'string' && !anchors.E_211.pattern.test(item.quote)
            && /\b(?:(?:have not|haven['’]t|did not|didn['’]t)(?: actually)? vomit(?:ed)?|no vomiting)\b/i.test(item.quote)) {
            unsupported.push({ quote: item.quote, kind: 'unsupported' }); return false;
        }
        return true;
    }).map((item: any) => {
        const anchor = anchors[item?.evidence_id];
        if (!anchor || typeof item.quote !== 'string' || item.state === 'contradiction') return item;
        const spans = item.quote.split(/[.,;!?]|\bbut\b|\band\b/i).map((s: string) => s.trim()).filter((s: string) => anchor.pattern.test(s));
        return spans.length === 1 ? { ...item, quote: spans[0] } : item;
    });
    return { ...raw, observations, unmapped: Array.isArray(raw.unmapped) ? [...raw.unmapped, ...unsupported] : raw.unmapped };
}
export function readProposal(raw: any, text: string, vocabulary: NaturalVocabulary, pending: Question | null, issue?: (code: string) => void): Proposal | null {
    const reject = (code: string) => { issue?.(code); return null; };
    if (!exactKeys(raw, 'instruction_attempt,observations,schema_version,unmapped') || raw.schema_version !== 'medassist.natural-extraction.v1'
        || typeof raw.instruction_attempt !== 'boolean' || !Array.isArray(raw.observations) || raw.observations.length > 8 || !Array.isArray(raw.unmapped) || raw.unmapped.length > 20
        || raw.instruction_attempt && (raw.observations.length || raw.unmapped.length))
        return reject('ROOT_SCHEMA');
    if (/\b(ignore|disregard|override|system prompt|prescribe|diagnose|api key)\b/i.test(text) && !raw.instruction_attempt)
        return reject('INSTRUCTION_GUARD');
    const seen = new Set<string>();
    for (const item of raw.observations) {
        const d = vocabulary.items.find(d => d.evidence_id === item?.evidence_id);
        if (!exactKeys(item, 'evidence_id,quote,state,value') || !d || seen.has(d.evidence_id) || typeof item.quote !== 'string' || !item.quote.trim() || !text.includes(item.quote)
            || !['confirmed', 'unknown', 'contradiction'].includes(item.state))
            return reject('OBSERVATION_SCHEMA_OR_SPAN');
        seen.add(d.evidence_id);
        if (item.state === 'confirmed' && /\b(?:not sure|unsure|unknown|maybe|might|perhaps|don't know|do not know|think i|not certain)\b/i.test(item.quote))
            return reject('UNCERTAIN_CONFIRMED');
        if (item.state !== 'confirmed') {
            if (item.value !== null)
                return reject('NONCONFIRMED_VALUE');
        }
        else if (d.data_type === 'B' ? typeof item.value !== 'boolean' : d.data_type === 'C'
            ? !d.possible_values.some(x => Object.is(x, item.value)) : !Array.isArray(item.value) || new Set(item.value).size !== item.value.length || !item.value.every((x: any) => d.possible_values.some(y => Object.is(x, y))))
            return reject('TYPED_VALUE');
        const isPending = pending?.evidence_id === d.evidence_id;
        if (item.state === 'confirmed' && d.data_type !== 'B') {
            const values = Array.isArray(item.value) ? item.value : [item.value];
            if (!values.length && !/^\s*(?:none|none of these|explicitly none of these)[.!]?\s*$/i.test(item.quote))
                return reject('EMPTY_CHOICES');
            if (values.some((v: unknown) => !labelIsSupported(item.quote, d.value_labels?.[String(v)]??String(v))))
                return reject('VALUE_SUPPORT');
        }
        if (isPending && d.data_type === 'B' && !anchors[d.evidence_id]?.pattern.test(item.quote) && !/^(?:yes|no|not sure|unknown|i (?:do not|don't) know)\b/i.test(item.quote.trim()))
            return reject('PENDING_SUPPORT');
        if (!isPending && (!anchors[d.evidence_id] || !anchors[d.evidence_id].pattern.test(item.quote)))
            return reject('UNSUPPORTED_ANCHOR');
        if (item.state === 'confirmed' && d.data_type === 'B') {
            const uncertain = /\b(?:not sure|unsure|maybe|perhaps|might|unknown|don't know|think i|not certain)\b/i.test(item.quote);
            // Broad negation/contradiction checks fail closed; explicit confirmation still required.
            const negative = /\b(?:no|not|without|deny|denies|absent|don't|do not|haven['’]t|hasn['’]t|didn['’]t|doesn['’]t)\b/i.test(item.quote)
                || d.evidence_id==='E_66'&&/\b(?:can breathe normally|breathing normally)\b/i.test(item.quote);
            if (uncertain || item.value === true && negative
                || item.value === false && !negative && !/^\s*no[.!]?\s*$/i.test(item.quote))
                return reject('POLARITY_OR_UNCERTAINTY');
        }
        const anchor = anchors[d.evidence_id];
        if (anchor) {
            // Negation shared across a coordinated phrase must not become presence.
            // Ambiguous scope fails closed rather than guessing the omitted subject.
            if (item.state === 'confirmed' && item.value === true && text.split(/[.;!?]|\bbut\b/i).some(sentence => {
                const parts = sentence.split(/\band\b/i);
                return parts.some((part, index) => anchor.pattern.test(part) && index > 0
                    && !/^\s*(?:i|he|she|they|it|my|the person)\b/i.test(part)
                    && /\b(?:no|not|without|don't|do not)\b/i.test(parts.slice(0, index).join(' and ')));
            })) return reject('SHARED_NEGATION');
            const clauses = text.split(/[.,;!?]|\bbut\b|\band\b/i).filter(s => anchor.pattern.test(s));
            const uncertain = clauses.some(s => /\b(?:not sure|unsure|unknown|maybe|might|perhaps|don't know|think i|not certain)\b/i.test(s));
            const negative = (s: string) => /\b(?:no|not|without|denies|deny|absent|don't|do not|haven['’]t|hasn['’]t|didn['’]t|doesn['’]t)\b/i.test(s);
            if (item.state === 'confirmed' && uncertain)
                return reject('SOURCE_UNCERTAINTY');
            if (clauses.some(negative) && clauses.some(s => !negative(s)) && item.state !== 'contradiction')
                return reject('SOURCE_CONFLICT');
        }
        if (item.state === 'unknown' && !/\b(?:not sure|unsure|unknown|don't know|do not know|maybe|might|perhaps|think i|not certain)\b/i.test(item.quote))
            return reject('UNKNOWN_SUPPORT');
        if (item.state === 'contradiction' && !/\b(?:but|actually|contradict(?:ory|ion)?|conflict(?:ing)?|yes and no)\b/i.test(item.quote))
            return reject('CONTRADICTION_SUPPORT');
    }
    if (!raw.unmapped.every((i: any) => exactKeys(i, 'kind,quote') && typeof i.quote === 'string' && !!i.quote.trim() && text.includes(i.quote) && ['duration', 'unsupported', 'ambiguous'].includes(i.kind)))
        return reject('UNMAPPED_SCHEMA_OR_SPAN');
    return raw;
}
export function finalSummary(result: DemoResult, vocabulary: NaturalVocabulary, unmapped: string[] = []) {
    const items = result.handoff?.items ?? [];
    const label = evidenceLabel;
    const conflicted = result.selection.reason === 'unresolved_contradiction';
    const positive = items.filter(i => i.status === 'observed_positive').map(i => label(i.evidence_id));
    const negative = items.filter(i => i.status === 'observed_negative').map(i => label(i.evidence_id));
    const uncertain = items.filter(i => ['unknown', 'contradiction'].includes(i.status)).length;
    return [result.selection.reason==='no_eligible_questions' ? `There are no further supported questions. You confirmed: ${positive.slice(0,5).join(', ')||'no present symptoms'}. I will not ask you to repeat them.` : conflicted ? 'Some details conflict. I have kept the original statements without choosing an interpretation.' : `You confirmed: ${positive.slice(0, 5).join(', ') || 'no supported present symptoms'}.`,
        conflicted ? 'Please clarify the conflicting details before starting another interview.' : `Other details: age ${result.handoff?.context.age ?? 'not provided'}; ${negative.length ? 'you reported no ' + negative.slice(0, 3).join(', ') : 'no additional absent symptoms were confirmed'}.`,
        `Still uncertain: ${conflicted ? 'unresolved conflicting information; ' : ''}${uncertain} unanswered or conflicting details${unmapped.length ? '; some wording, including ' + unmapped.slice(0, 2).join('; ') + ', could not be recorded as structured answers' : ''}. Anything not discussed remains unspecified.`,
        'I cannot assess urgency or suggest personalized precautions. This summary is not a diagnosis.',
        'For real symptoms, speak with a qualified healthcare professional; use Emergency help if emergency assistance is needed.'].join('\n');
}
