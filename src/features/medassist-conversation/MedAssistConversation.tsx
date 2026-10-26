import React, { useEffect, useRef, useState } from 'react';
import { M3Button, M3Checkbox, M3TextField } from '../../components/material/core';
import { type Answer, type Context, type DemoResult, type Scalar } from '../model-a-research/contracts';
import { readNaturalVocabulary, readNaturalResult, readProposal, proposalAddsInformation, evidenceLabel, questionText, finalSummary, type NaturalVocabulary, type NaturalRequest, type Proposal } from './natural';
import { readLanguageStatus } from './ollama';
import { understand, constrainContext, questionCompatibility, reportedDetails, type Annotation } from './understanding';
import { SubmissionLedger, friendlyError, readErrorCategory, retryAfterMs, transient, type ErrorCategory } from './reliability';
import { ClarificationTracker, type FailureKind } from './clarification';
import { parseQuickReply } from './replies';
import { evaluateStatement, resolveSafetyClarification, type SafetyDecision } from '../medassist-safety/safety';
import HospitalNavigation from '../medassist-safety/HospitalNavigation';
import { welcome, readFictionalAge, readSourceSex, contextUnknown, requestsNavigation, assessmentStatus } from './presentation';
import './conversation.css';
const api = '/api/research/model-a';
type Message = {
    role: 'You' | 'MedAssist';
    text: string;
};
const greeting: Message[] = [{ role: 'MedAssist', text: welcome }];
const displayValue = (v: Scalar) => typeof v === 'boolean' ? v ? 'Yes' : 'No' : String(v);
const clean = (a: Answer): Answer => ({ evidence_id: a.evidence_id, state: a.state, value: a.value });
export default function MedAssistConversation() {
    const [vocabulary, setVocabulary] = useState<NaturalVocabulary | null>(null);
    const [retryAvailability, setRetryAvailability] = useState(0), [description, setDescription] = useState('');
    const [contextStep, setContextStep] = useState<'age' | 'sex' | null>(null), [fictionalAge, setFictionalAge] = useState<number | null>(null);
    const [contextUnavailable, setContextUnavailable] = useState(false), [showNavigation, setShowNavigation] = useState(false), [session, setSession] = useState(0);
    const [assessmentOpen, setAssessmentOpen] = useState(() => window.matchMedia('(min-width:1000px)').matches);
    const [languageRetry, setLanguageRetry] = useState<string | null>(null), [candidate, setCandidate] = useState<Proposal | null>(null);
    const [confirmedProposals, setConfirmedProposals] = useState<Proposal[]>([]);
    const [queued, setQueued] = useState<Answer[]>([]), [unmapped, setUnmapped] = useState<string[]>([]), [narratives, setNarratives] = useState<string[]>([]);
    const [messages, setMessages] = useState<Message[]>(greeting), [request, setRequest] = useState<NaturalRequest | null>(null), [result, setResult] = useState<DemoResult | null>(null);
    const [count, setCount] = useState(0), [selected, setSelected] = useState<number[]>([]), [busy, setBusy] = useState(false), [error, setError] = useState('');
    const [pendingRetry, setPendingRetry] = useState<{
        next: NaturalRequest;
        label: string;
    } | null>(null);
    const [localLanguage, setLocalLanguage] = useState<ReturnType<typeof readLanguageStatus>>(null);
    const [emergency, setEmergency] = useState<SafetyDecision | null>(null), [navigationSession, setNavigationSession] = useState(0);
    const [safetyClarification, setSafetyClarification] = useState<SafetyDecision | null>(null);
    const pendingSafety = useRef<SafetyDecision | null>(null);
    const submissions = useRef(new SubmissionLedger()), confirmedCandidate = useRef<Proposal | null>(null);
    const [understandingRecords, setUnderstandingRecords] = useState<{request_id:string;text:string;question_id:string|null;annotations:Annotation[];details:ReturnType<typeof reportedDetails>;compatibility:string;confirmed:boolean;extraction_method?:string}[]>([]);
    const questionClarifications=useRef(new Map<string,number>()), candidateRequest=useRef<string|null>(null);
    const localSubmissions = useRef(new Set<string>());
    const retryAt = useRef(0), invalidAttempts = useRef(new Map<string, number>());
    const clarification = useRef(new ClarificationTracker());
    const safetyLatch = useRef(false), abort = useRef<AbortController | null>(null), generation = useRef(0), inFlight = useRef(false);
    const timeline = useRef<HTMLOListElement>(null), end = useRef<HTMLDivElement>(null), followLatest = useRef(true), questionHeading = useRef<HTMLHeadingElement>(null);
    const say = (text: string) => setMessages(c => [...c, { role: 'MedAssist', text }]);
    const name = evidenceLabel;
    useEffect(() => { const q = window.matchMedia('(min-width:1000px)'), f = () => setAssessmentOpen(q.matches); q.addEventListener('change', f); return () => q.removeEventListener('change', f); }, []);
    useEffect(() => { const f = () => { followLatest.current = document.documentElement.scrollHeight - window.scrollY - window.innerHeight < 200; }; window.addEventListener('scroll', f, { passive: true }); return () => window.removeEventListener('scroll', f); }, []);
    useEffect(() => {
        const c = new AbortController();
        let disposed = false;
        const timer = setTimeout(() => c.abort(), 17000);
        fetch(`${api}/language`, { signal: c.signal, credentials: 'omit', cache: 'no-store' }).then(async (r) => { if (!disposed)
            setLocalLanguage(r.ok ? readLanguageStatus(await r.json()) : null); }).catch(() => { if (!disposed)
            setLocalLanguage(null); });
        fetch(`${api}/natural/vocabulary`, { signal: c.signal, credentials: 'omit', cache: 'no-store' }).then(async (r) => { const v = r.ok ? readNaturalVocabulary(await r.json()) : null; if (!v)
            throw Error(); if (!disposed)
            setVocabulary(v); }).catch(() => { if (!disposed)
            setError('The question service is unavailable. Emergency help is still available.'); }).finally(() => clearTimeout(timer));
        return () => { disposed = true; clearTimeout(timer); c.abort(); generation.current++; abort.current?.abort(); };
    }, [retryAvailability]);
    useEffect(() => { if (result || candidate)
        questionHeading.current?.focus({ preventScroll: true }); }, [result, candidate]);
    useEffect(() => { if (emergency || safetyClarification)
        questionHeading.current?.focus(); }, [emergency, safetyClarification]);
    useEffect(() => {
        const marker=end.current, log=timeline.current;
        if(!marker||!log)return;
        const reveal=()=>{if(!followLatest.current)return;const composer=marker.nextElementSibling;
            marker.style.scrollMarginBottom=`${(composer?.getBoundingClientRect().height??0)+16}px`;
            marker.scrollIntoView({block:'nearest',behavior:'instant'});};
        reveal();const resize=new ResizeObserver(reveal);resize.observe(log);
        if(marker.nextElementSibling)resize.observe(marker.nextElementSibling);
        return()=>resize.disconnect();
    }, [messages, candidate, result, error, busy, contextStep, showNavigation]);
    function restart() { pendingSafety.current = null; setSafetyClarification(null); setUnderstandingRecords([]); questionClarifications.current.clear(); candidateRequest.current=null; submissions.current.reset(); localSubmissions.current.clear(); confirmedCandidate.current = null; retryAt.current = 0; invalidAttempts.current.clear(); clarification.current.reset(); generation.current++; abort.current?.abort(); inFlight.current = false; safetyLatch.current = false; followLatest.current = true; setSession(v => v + 1); setNavigationSession(v => v + 1); setContextStep(null); setFictionalAge(null); setContextUnavailable(false); setShowNavigation(false); setLanguageRetry(null); setEmergency(null); setRequest(null); setResult(null); setCandidate(null); setDescription(''); setMessages(greeting); setSelected([]); setBusy(false); setError(''); setPendingRetry(null); setQueued([]); setUnmapped([]); setNarratives([]); setCount(0); setConfirmedProposals([]); }
    function applySafety(d: SafetyDecision, text: string) {
        if (safetyLatch.current) return true;
        if (d.status === 'not_assessed') return false;
        generation.current++; abort.current?.abort(); inFlight.current = false;
        setBusy(false); setError(''); setCandidate(null); setPendingRetry(null); setLanguageRetry(null); setContextStep(null);
        setNarratives(old => [...old, text]); setDescription('');
        if (d.status === 'clarify') { pendingSafety.current = d; setSafetyClarification(d); }
        else { safetyLatch.current = true; generation.current++; abort.current?.abort(); pendingSafety.current = null; setSafetyClarification(null); setEmergency(d); setSelected([]); }
        setMessages(c => [...c, { role: 'You', text }, { role: 'MedAssist', text: d.guidance! }]);
        return true;
    }
    function escalate(text: string, includeClarification = false) {
        const d = evaluateStatement(text);
        if (d.status === 'clarify' && !includeClarification) return false;
        return applySafety(d, text);
    }
    function clarifySafety(answer: 'current'|'non_current'|'unsure') {
        const prior = pendingSafety.current; if (!prior || safetyLatch.current) return;
        const resolved = resolveSafetyClarification(prior, answer);
        pendingSafety.current = null; setSafetyClarification(null);
        const label = answer === 'current' ? 'This is happening now' : answer === 'unsure' ? 'I am unsure whether this is happening now' : 'This is only past or hypothetical context';
        if (resolved.status === 'escalate') applySafety(resolved, label);
        else { setMessages(c => [...c, {role:'You',text:label}, {role:'MedAssist',text:'No safety conclusion was made and nothing was added as current evidence. Please describe the current fictional concern, or use Emergency help if you are unsure.'}]); setDescription(''); }
    }
    async function describe(event?: React.FormEvent, retryText?: string) {
        event?.preventDefault();
        const text = (retryText ?? description).trim();
        followLatest.current = true;
        if (escalate(text, true) || safetyLatch.current || inFlight.current || busy || pendingRetry || !text)
            return;
        if (pendingSafety.current) return;
        if (requestsNavigation(text)) {
            const key = 'navigation:' + text;
            if (localSubmissions.current.has(key)) return;
            localSubmissions.current.add(key);
            setShowNavigation(true);
            setMessages(c => [...c, { role: 'You', text }, { role: 'MedAssist', text: 'Choose a location-only Maps search below. I cannot verify a facility’s suitability or availability. Your symptoms are not sent to Maps.' }]);
            setDescription('');
            return;
        }
        if (contextStep) {
            collectContext(text);
            return;
        }
        if (result?.selection.status === 'abstained') { say('This interview has ended. You can restart for new details or ask to find care.'); setDescription(''); return; }
        if (!vocabulary || contextUnavailable)
            return;
        if (request && result) {
            const a = parseQuickReply(text, result.selection.question);
            if (a) {
                answer(a.state, a.value, text);
                return;
            }
        }
        if ((retryText || text === languageRetry) && Date.now() < retryAt.current) {
            setError('Please wait before retrying this message. Your accepted answers are unchanged.'); return;
        }
        const phase = result?.selection.question?.evidence_id ?? 'initial';
        const key = 'extract:' + phase + ':' + text;
        const submission = submissions.current.begin(key);
        if (!submission) return;
        const repeated = clarification.current.check(text, phase, !!retryText);
        if (repeated.blocked) {
            submissions.current.finish(key, false, submission.id); setLanguageRetry(null);
            if (repeated.message) { setError(''); say(repeated.message); } return;
        }
        setDescription(''); setLanguageRetry(null); setCandidate(null);
        if (submission.fresh) {
            setNarratives(c => [...c, text]); setMessages(c => [...c, { role: 'You', text }]);
        }
        const prior=narratives.slice(-12), pendingQuestion=result?.selection.question??null;
        const analysis=understand(text,vocabulary,pendingQuestion,prior);
        if(submission.fresh)setUnderstandingRecords(old=>[...old,{request_id:submission.id,text,question_id:pendingQuestion?.evidence_id??null,annotations:analysis.annotations,details:reportedDetails(text),compatibility:analysis.compatibility.status,confirmed:false}]);
        if(pendingQuestion&&['ambiguous','unrelated'].includes(analysis.compatibility.status)){
            const attempts=questionClarifications.current.get(pendingQuestion.evidence_id)??0;
            if(attempts>=2){submissions.current.finish(key,true,submission.id);setError('I cannot validate another free-text reply for this question. Please use a shown choice or Not sure; no extra question was consumed.');return;}
            questionClarifications.current.set(pendingQuestion.evidence_id,attempts+1);
            if(analysis.compatibility.status==='ambiguous'&&!analysis.proposal.observations.length){submissions.current.finish(key,true,submission.id);setError(analysis.compatibility.message??'Please clarify the current answer.');return;}
        }
        if (!analysis.complete&&(!localLanguage || localLanguage.provider !== 'groq-cloud')) {
            submissions.current.finish(key, false, submission.id); setError(friendlyError('PROVIDER_UNAVAILABLE'));
            setLanguageRetry(text); retryAt.current = Date.now() + 2000; return;
        }
        inFlight.current = true;
        const version = ++generation.current, c = new AbortController();
        abort.current = c;
        const timer = setTimeout(() => c.abort(), 17000);
        setBusy(true);
        setError('');
        try {
            const r = await fetch(`${api}/natural/extract`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Conversation-ID': submissions.current.conversationId, 'X-Request-ID': submission.id }, credentials: 'omit', cache: 'no-store', signal: c.signal, body: JSON.stringify({ schema_version: 'medassist.natural-extract-request.v2', fictional_only: true, text, prior_context:prior, question_id: result?.selection.question?.evidence_id ?? null }) });
            let raw;try{raw=await r.json();}catch{throw Object.assign(Error(),{kind:'invalid_output'});}
            if (version !== generation.current || safetyLatch.current || pendingSafety.current) return;
            if (!r.ok && (raw?.error === 'SAFETY_ESCALATION' || raw?.error === 'SAFETY_CLARIFICATION_REQUIRED')) {
                if (applySafety(evaluateStatement([...prior,text].join('. ')), text)) return;
            }
            if (!r.ok) {
                const legacy: Record<string, ErrorCategory> = { LANGUAGE_MAPPING_FAILED: 'EVIDENCE_MAPPING_FAILURE', LANGUAGE_INVALID_OUTPUT: 'INVALID_STRUCTURED_OUTPUT', LANGUAGE_TIMEOUT: 'PROVIDER_TIMEOUT', LANGUAGE_QUOTA: 'RATE_LIMITED', LANGUAGE_BUSY: 'RATE_LIMITED' };
                const category = readErrorCategory(raw?.error) ?? legacy[raw?.error] ?? 'PROVIDER_UNAVAILABLE';
                throw Object.assign(Error(), { category, wait: retryAfterMs(r.headers.get('retry-after')) });
            }
            const proposal=constrainContext(raw,text,vocabulary,result?.selection.question??null,prior);
            if (version !== generation.current)
                return;
            if (!proposal)
                throw Object.assign(Error(),{kind:'invalid_output'});
            const method=r.headers.get('X-Extraction-Method');
            setUnderstandingRecords(old=>old.map(row=>row.request_id===submission.id?{...row,extraction_method:method==='deterministic.v1'||method==='groq_validated.v1'?method:'legacy_validated_transport'}:row));
            setUnmapped(old => [...new Set([...old, ...proposal.unmapped.map(i => i.quote)])]);
            if (proposal.instruction_attempt) {
                say('Please describe only the fictional person’s symptoms. No suggested answers were recorded.');
                return;
            }
            if (!proposal.observations.length) {
                const contexts=new Set(analysis.annotations.map(a=>a.context));
                const specific=contexts.has('historical_or_resolved')?'I kept this as historical or resolved information, without marking a current symptom. Please describe what is happening now.'
                    :contexts.has('other_person')?'I kept this as information about another person. I will not add it to the fictional person’s evidence. Please clarify who the interview is about.'
                    :contexts.has('hypothetical')?'I kept this as a hypothetical statement, without recording it as a current symptom.'
                    :contexts.has('suspected_condition')?'I kept your concern in your own words. This does not confirm a diagnosis. Please describe the symptoms themselves.'
                    :pendingQuestion?analysis.compatibility.message:null;
                const fallback=clarification.current.fail(text,phase,'unsupported');say(specific??fallback);
                return;
            }
            const known=[...queued,...(request?[request.initial,...request.initial_disclosures,...request.turns.flatMap(t=>[t.answer,...t.disclosures])]:[])];
            if(!proposalAddsInformation(proposal,known)) {say(clarification.current.fail(text,phase,'duplicate'));return;}
            clarification.current.clear(text,phase);
            submissions.current.finish(key, true, submission.id);
            candidateRequest.current=submission.id;
            setCandidate(proposal);
        }
        catch (error) {
            if (version === generation.current) {
                const problem = error as { category?: ErrorCategory; wait?: number; kind?: FailureKind };
                const category = c.signal.aborted ? 'PROVIDER_TIMEOUT' : problem.category ?? (problem.kind === 'invalid_output' ? 'INVALID_STRUCTURED_OUTPUT' : 'PROVIDER_UNAVAILABLE');
                if (category === 'EVIDENCE_MAPPING_FAILURE') setError(clarification.current.fail(text, phase, 'mapping'));
                else {
                    setError(friendlyError(category));
                    if (category === 'INVALID_STRUCTURED_OUTPUT') clarification.current.fail(text, phase, 'invalid_output');
                    const invalid = (invalidAttempts.current.get(submission.id) ?? 0) + (category === 'INVALID_STRUCTURED_OUTPUT' ? 1 : 0);
                    invalidAttempts.current.set(submission.id, invalid);
                    retryAt.current = Date.now() + Math.max(problem.wait ?? 0, category === 'INVALID_STRUCTURED_OUTPUT' ? 0 : 2000);
                    setLanguageRetry(transient(category) || category === 'INVALID_STRUCTURED_OUTPUT' && invalid < 2 ? text : null);
                }
            }
        }
        finally {
            clearTimeout(timer);
            submissions.current.finish(key, false, submission.id);
            if (version === generation.current) {
                inFlight.current = false;
                setBusy(false);
            }
        }
    }
    async function send(next: NaturalRequest, label: string) {
        if (safetyLatch.current || pendingSafety.current || inFlight.current)
            return;
        const key = 'interview:' + JSON.stringify(next), submission = submissions.current.begin(key);
        if (!submission) return;
        if (submission.fresh) setNarratives(old => [...old, label]);
        inFlight.current = true;
        const version = ++generation.current, c = new AbortController();
        abort.current = c;
        const timer = setTimeout(() => c.abort(), 17000);
        setBusy(true);
        setError('');
        setPendingRetry(null);
        setLanguageRetry(null);
        try {
            const r = await fetch(`${api}/natural/interview`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Conversation-ID': submissions.current.conversationId, 'X-Request-ID': submission.id }, credentials: 'omit', cache: 'no-store', signal: c.signal, body: JSON.stringify(next) });
            if(!r.ok)throw Object.assign(Error(),{kind:r.status===422?'eligibility':'inference'});
            const v = readNaturalResult(await r.json());
            if (!v || v.progress.answered !== next.turns.length || v.result.selection.question && [next.initial, ...next.initial_disclosures, ...next.turns.flatMap(t => [t.answer, ...t.disclosures])].some(a => a.evidence_id === v.result.selection.question!.evidence_id))
                throw Error();
            if (version !== generation.current)
                return;
            submissions.current.finish(key, true, submission.id);
            setRequest(next);
            setResult(v.result);
            setCount(v.progress.answered);
            setCandidate(null);
            setQueued([]);
            setContextStep(null);
            setSelected([]);
            setDescription('');
            setMessages(old => [...old, { role: 'You', text: label }, { role: 'MedAssist', text: v.result.selection.question ? questionText(v.result.selection.question) : finalSummary(v.result, vocabulary!, unmapped) }]);
        }
        catch (error) {
            if (version === generation.current) {
                const invalid=(error as {kind?:string})?.kind==='eligibility';
                setError(invalid?'Those details do not form an eligible question sequence. Nothing new was accepted. Please restart with clarified details.':'The question-ranking service is unavailable or returned an invalid result. Accepted answers are unchanged. You can retry.');
                setPendingRetry(invalid?null:{ next, label });
            }
        }
        finally {
            clearTimeout(timer);
            submissions.current.finish(key, false, submission.id);
            if (version === generation.current) {
                inFlight.current = false;
                setBusy(false);
            }
        }
    }
    function confirmInitial() {
        if (!candidate || confirmedCandidate.current === candidate || inFlight.current || busy || pendingRetry || safetyLatch.current || pendingSafety.current)
            return;
        followLatest.current = true;
        confirmedCandidate.current = candidate;
        setUnderstandingRecords(old=>old.map(row=>row.request_id===candidateRequest.current?{...row,confirmed:true}:row));
        setConfirmedProposals(old => [...old, candidate]);
        const all = [...queued], existing = request ? [request.initial, ...request.initial_disclosures, ...request.turns.flatMap(t => [t.answer, ...t.disclosures])] : [];
        for (const a of candidate.observations.map(clean)) {
            const old = [...existing, ...all].find(x => x.evidence_id === a.evidence_id);
            if (old) {
                if (old.state !== a.state || JSON.stringify(old.value) !== JSON.stringify(a.value)) {
                    setCandidate(null);
                    say('That conflicts with a detail you confirmed earlier. I will not choose between them. Please restart with clarified information. The original statements are kept.');
                    if (request)
                        void send({ ...request, stop: 'unresolved_contradiction' }, 'Leave conflicting information unresolved');
                    return;
                }
                continue;
            }
            all.push(a);
        }
        setCandidate(null);
        if (request) {
            const q = result?.selection.question;
            if (!q)
                return;
            const a = all.find(a => a.evidence_id === q.evidence_id);
            if (!a) {
                setQueued(all);
                say('These confirmed details are kept for the next update. Please also answer the current question, or choose Not sure. I will not assume your answer.');
                return;
            }
            void send({ ...request, turns: [...request.turns, { answer: a, disclosures: all.filter(x => x.evidence_id !== a.evidence_id) }] }, 'Confirm these details');
            return;
        }
        setQueued(all);
        if (all.some(a => a.state === 'contradiction')) {
            say('Some details conflict. Please clarify them before starting. No interpretation was chosen.');
            setQueued([]);
            return;
        }
        if (!all.some(a => a.state === 'confirmed' && a.value === true && vocabulary?.items.find(d => d.evidence_id === a.evidence_id)?.initial_allowed)) {
            say('These details are kept. To begin questions, I need a symptom that is clearly present. Could you describe one?');
            return;
        }
        setContextStep('age');
        say('How old is this fictional person, in years? Please use fictional details only. I will not guess missing information.');
    }
    function collectContext(text: string) {
        if (safetyLatch.current || pendingSafety.current || busy || pendingRetry)
            return;
        const key = 'context:' + contextStep + ':' + text;
        if (localSubmissions.current.has(key)) return;
        if (contextUnknown(text)) {
            localSubmissions.current.add(key);
            setContextUnavailable(true);
            setContextStep(null);
            setDescription('');
            setMessages(c => [...c, { role: 'You', text }, { role: 'MedAssist', text: 'I cannot continue questions without an explicit age and female or male entry. I will not guess. Restart with supported fictional details or ask to find care.' }]);
            return;
        }
        if (contextStep === 'age') {
            const age = readFictionalAge(text);
            if (age === null) {
                setError('Please enter an age in years, or Not sure.');
                return;
            }
            localSubmissions.current.add(key);
            setFictionalAge(age);
            setContextStep('sex');
            setDescription('');
            setError('');
            setMessages(c => [...c, { role: 'You', text }, { role: 'MedAssist', text: 'For this limited fictional example, select female (F) or male (M). This does not determine gender. If neither entry can be provided, choose Not sure; I will not substitute one.' }]);
            return;
        }
        const sex = readSourceSex(text);
        if (!sex || fictionalAge === null) {
            setError('Please choose F, M or Not sure.');
            return;
        }
        localSubmissions.current.add(key);
        begin({ age: fictionalAge, source_sex: sex }, text);
    }
    function begin(context: Context, label: string) { const initial = queued.find(a => a.state === 'confirmed' && a.value === true && vocabulary?.items.find(d => d.evidence_id === a.evidence_id)?.initial_allowed); if (initial)
        void send({ schema_version: 'medassist.natural-request.v1', fictional_only: true, context, initial, initial_disclosures: queued.filter(a => a.evidence_id !== initial.evidence_id), turns: [], stop: null }, label); }
    function answer(state: Answer['state'], value: Answer['value'], label: string) {
        const q=result?.selection.question;if(!request||!q||inFlight.current)return;
        if(state==='confirmed'&&vocabulary){
            const compatibility=questionCompatibility(label,q,vocabulary,narratives.slice(-12),value);
            if(compatibility.status!=='valid'){
                const key='answer-clarification:'+q.evidence_id+':'+label;
                if(localSubmissions.current.has(key))return;
                localSubmissions.current.add(key);setNarratives(old=>[...old,label]);setMessages(old=>[...old,{role:'You',text:label}]);
                const attempts=questionClarifications.current.get(q.evidence_id)??0;
                questionClarifications.current.set(q.evidence_id,Math.min(2,attempts+1));
                setError(attempts>=2?'I cannot validate another reply here. Please choose Not sure; no extra question was consumed.':compatibility.message??'Please clarify this answer.');return;
            }
        }
        followLatest.current=true;
        void send({...request,turns:[...request.turns,{answer:{evidence_id:q.evidence_id,state,value},disclosures:state==='contradiction'?[]:queued.filter(a=>a.evidence_id!==q.evidence_id)}]},label);
    }
    function stopInterview() { if (!request)
        return; const next = { ...request, initial_disclosures: [...request.initial_disclosures], turns: request.turns.map(t => ({ ...t, disclosures: [...t.disclosures] })), stop: 'user_stopped' as const }; if (queued.length) {
        if (next.turns.length)
            next.turns.at(-1)!.disclosures.push(...queued);
        else
            next.initial_disclosures.push(...queued);
    } void send(next, 'End this fictional interview'); }
    const optionLabel=(value:Scalar)=>vocabulary?.items.find(d=>d.evidence_id===result?.selection.question?.evidence_id)?.value_labels?.[String(value)]??displayValue(value);
    const question = result?.selection.question, finished = result?.selection.status === 'abstained', handoff = result?.handoff;
    const status = assessmentStatus({ started: !!request || !!contextStep, finished: !!finished, unavailable: contextUnavailable });
    const exportEvidence = () => { if (!handoff)
        return; const url = URL.createObjectURL(new Blob([JSON.stringify({ schema_version: 'medassist.conversation-export.v2', understanding_version:'medassist.understanding.v1', understanding_records:understandingRecords, question_clarifications:[...questionClarifications.current].map(([question_id,attempts])=>({question_id,attempts})), evidence: handoff, conversation: request, unresolved_concepts:clarification.current.snapshot(), evidence_usage: result?.selection.reason === 'unresolved_contradiction' ? 'blocked_unresolved_conflict' : 'fictional_only_no_clinical_assessment', narratives, user_confirmed_proposals: confirmedProposals, unmapped, unresolved_conflict: result?.selection.reason === 'unresolved_contradiction', routine_questions_answered: count }, null, 2)], { type: 'application/json' })); const link = document.createElement('a'); link.href = url; link.download = 'fictional-medassist-evidence.json'; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); };
    return <section className="medassist-conversation" aria-labelledby="medassist-conversation-title">
    <header className="conversation-header">
      <span className="conversation-avatar material-symbols-outlined" aria-hidden="true">forum</span>
      <div><h1 id="medassist-conversation-title" tabIndex={-1}>MedAssist AI</h1>
        <p className="conversation-service-status">Fictional research · {emergency ? 'Emergency help' : busy ? 'Working…' : vocabulary ? 'Ready to listen' : 'Question service offline'}</p></div>
      <M3Button variant="outlined" onClick={() => escalate('I need emergency help')}>Emergency help</M3Button>
    </header>
    <aside className="conversation-notice" aria-label="Fictional demo limitations">
      <details><summary>Demo scope and privacy</summary>
        <p>Fictional research only, not a medical service. {localLanguage?.provider === 'groq-cloud' ? 'Uncovered free-text descriptions or replies may share fictional text and relevant earlier fictional context with Groq through the backend. Supported deterministic expressions do not require a cloud call.' : localLanguage ? 'Experimental local extraction is configured.' : 'Language extraction is unavailable; free-text descriptions cannot be interpreted.'} Interpretations need your confirmation. Coverage is limited; I will say when wording cannot be reliably understood.</p>
        <p>Questions organize information, not diagnoses or severity. Personalized precautions are unavailable. English emergency rules are provisional; no match means no assessment. Questions are not clinically reviewed. Maps receives only separately provided location. State stays in page memory; refreshing safely clears this fictional session rather than replaying a pending request. No account information is imported.</p>
        <a href="#/research/model-a">Developer research lab</a>
      </details>
    </aside>
    <div className="conversation-layout">
      <div className="conversation-workspace">
        <ol ref={timeline} tabIndex={0} className="conversation-messages" role="log" aria-label="Fictional conversation" aria-live="polite" aria-relevant="additions">
          {messages.map((message, index) => <li key={session + ':' + index} className={'conversation-message conversation-' + (message.role === 'You' ? 'user' : 'assistant') + (index === 0 ? ' conversation-welcome' : '')}>
            <span className="conversation-speaker">{message.role === 'MedAssist' ? 'MedAssist AI' : 'You'}</span><p>{message.text}</p></li>)}
          <li className="conversation-turn">
          {safetyClarification && !emergency && <section role="alert" aria-label="Safety clarification" className="conversation-question">
            <h2 tabIndex={-1} ref={questionHeading}>Check safety context</h2><p>{safetyClarification.guidance}</p>
            <div className="conversation-actions"><M3Button onClick={() => clarifySafety('current')}>Happening now</M3Button>
              <M3Button onClick={() => clarifySafety('non_current')}>Only distant past or hypothetical</M3Button>
              <M3Button onClick={() => clarifySafety('unsure')}>Not sure — show emergency help</M3Button></div>
            <p>Ordinary questions are paused. No diagnosis or safety clearance has been made.</p>
          </section>}
          {emergency && <section role="alert" aria-label="Emergency help" className="conversation-question conversation-emergency">
            <h2 tabIndex={-1} ref={questionHeading}>Emergency help</h2><p>{emergency.guidance}</p>
            <p><strong>For a real emergency only:</strong> <a href="tel:112">Call 112 in India</a>. Elsewhere use your local emergency number. Do not place test calls for fictional cases.</p>
            <p>Provisional statement guard · not clinically validated. Ordinary questions and self-care are paused. Urgency remains unassessed.</p>
          </section>}
          {error && <p role="alert" className="conversation-error">{error}</p>}
          {!emergency && !safetyClarification && !vocabulary && <div className="conversation-question">
            <p>{error ? 'Local service unavailable.' : 'Checking local availability…'}</p>
            <M3Button variant="outlined" onClick={() => setRetryAvailability(v => v + 1)}>Retry availability</M3Button></div>}
          {!emergency && !safetyClarification && vocabulary && candidate && !contextStep && !contextUnavailable && <div className="conversation-question">
            <h2 ref={questionHeading} tabIndex={-1}>Confirm what you meant</h2><ul>{candidate.observations.map(a => <li key={a.evidence_id}>{name(a.evidence_id)}: {a.state === 'unknown' ? 'not sure' : a.state === 'contradiction' ? 'conflicting' : Array.isArray(a.value) ? a.value.map(displayValue).join(', ') || 'explicitly none' : displayValue(a.value! as Scalar)}</li>)}</ul>{candidate.unmapped.length > 0 && <p>Kept in your own words, without a structured answer: {candidate.unmapped.map(i => i.quote).join('; ')}</p>}
            <p>Does this reflect what you meant? Nothing here is accepted until you confirm.</p>
            <div className="conversation-actions"><M3Button disabled={busy || !!pendingRetry} onClick={confirmInitial}>Confirm these details</M3Button>
              <M3Button variant="text" disabled={busy || !!pendingRetry} onClick={() => { setCandidate(null); setMessages(current => [...current, { role: 'You', text: 'That mapping is not correct.' }, { role: 'MedAssist', text: 'Please correct the description in your own words. None of these proposed answers was recorded.' }]); }}>No / Not sure — correct this</M3Button></div>
          </div>}
          {!emergency && !safetyClarification && contextStep === 'sex' && <div className="conversation-actions" aria-label="Fictional female or male answer">
            <M3Button disabled={busy || !!pendingRetry} onClick={() => collectContext('F')}>F</M3Button>
            <M3Button variant="outlined" disabled={busy || !!pendingRetry} onClick={() => collectContext('M')}>M</M3Button>
            <M3Button variant="text" disabled={busy || !!pendingRetry} onClick={() => collectContext('Not sure')}>Not sure</M3Button>
          </div>}
          {!emergency && !safetyClarification && result && !candidate && <section aria-labelledby="conversation-question-title" aria-busy={busy}>
            <h2 id="conversation-question-title" className="conversation-sr-only" tabIndex={-1} ref={questionHeading}>{finished ? 'Fictional interview finished' : 'Reply to the latest question'}</h2>
            {question && <><div className="conversation-actions">
              {question.data_type === 'B' && <><M3Button disabled={busy || !!pendingRetry} onClick={() => answer('confirmed', true, 'Yes')}>Yes</M3Button><M3Button variant="outlined" disabled={busy || !!pendingRetry} onClick={() => answer('confirmed', false, 'No')}>No</M3Button></>}
              {question.data_type === 'C' && question.possible_values.map((value, index) => <M3Button key={index} variant="outlined" disabled={busy || !!pendingRetry} onClick={() => answer('confirmed', value, optionLabel(value))}>{optionLabel(value)}</M3Button>)}
            </div>
            {question.data_type === 'M' && <fieldset disabled={busy || !!pendingRetry}><legend>Choose only answers you explicitly want to report</legend>
              {question.possible_values.map((value, index) => <M3Checkbox key={index} id={'conversation-option-' + index} label={optionLabel(value)} checked={selected.includes(index)} disabled={busy || !!pendingRetry} onChange={checked => setSelected(current => checked ? [...current.filter(v => v !== index), index] : current.filter(v => v !== index))}/>)}
              <M3Button disabled={busy || !!pendingRetry} onClick={() => answer('confirmed', selected.map(i => question.possible_values[i]), selected.length ? selected.map(i => optionLabel(question.possible_values[i])).join(', ') : 'Explicitly none of these')}>Confirm choices ({selected.length})</M3Button>
            </fieldset>}
            <div className="conversation-actions"><M3Button variant="tonal" disabled={busy || !!pendingRetry} onClick={() => answer('unknown', null, 'Not sure')}>Not sure</M3Button></div></>}
          </section>}
          {(showNavigation || emergency) && <HospitalNavigation key={navigationSession + ':' + !!emergency} emergency={!!emergency}/>}
          {!emergency && busy && <div role="status" className="conversation-typing"><span aria-hidden="true">•••</span> Working on your message…</div>}
          {pendingRetry && !emergency && !safetyClarification && <M3Button variant="outlined" disabled={busy} onClick={() => void send(pendingRetry.next, pendingRetry.label)}>Retry last action</M3Button>}
          {languageRetry && !emergency && !safetyClarification && <M3Button variant="outlined" disabled={busy} onClick={() => void describe(undefined, languageRetry)}>Retry description</M3Button>}
          {finished && <p role="status">No diagnosis, urgency result or care advice was produced.</p>}
          </li>
        </ol>
        <div ref={end} aria-hidden="true"/>
        <form onSubmit={describe} onKeyDown={event => { if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
        event.preventDefault();
        void describe();
    } }} className="conversation-input" aria-label="Describe a fictional symptom">
          <M3TextField id="fictional-description" type="textarea" rows={2} label={contextStep === 'age' ? 'Fictional age in years' : contextStep === 'sex' ? 'Fictional female or male entry' : request ? 'Your answer' : 'Fictional symptom description'} placeholder={request ? 'Reply in your own words, or use an answer button' : contextStep ? 'Use explicit fictional context only' : 'How is the fictional person feeling?'} value={description} maxLength={300} disabled={!!emergency} onChange={event => { if (!escalate(event.target.value) && !safetyLatch.current) {
        setDescription(event.target.value);
        if (!contextStep && !request)
            setCandidate(null);
    } }}/>
          <M3Button disabled={!!emergency || busy || !!pendingRetry || !description.trim()} onClick={() => void describe()}>{request ? 'Send answer' : 'Send description'}</M3Button>
          <p className="conversation-composer-help">{localLanguage?.provider === 'groq-cloud' && !contextStep ? 'Uncovered fictional wording may be sent to Groq. ' : ''}Enter to send · Shift+Enter for a new line. No real patient data.</p>
        </form>
        <div className="conversation-session">
          {handoff && <details className="conversation-summary"><summary>Session summary</summary>
            <p>{count} follow-up questions. Yes: {handoff.items.filter(i => i.status === 'observed_positive').length}; No: {handoff.items.filter(i => i.status === 'observed_negative').length}; Not sure: {handoff.items.filter(i => i.status === 'unknown').length}. Missing stays unspecified.</p>
            <M3Button variant="text" onClick={exportEvidence}>Download session</M3Button>
            {!emergency && question && <M3Button variant="text" disabled={busy || !!pendingRetry} onClick={() => answer('contradiction', null, 'My answer is conflicting; leave it unresolved')}>Report conflicting information and stop</M3Button>}
          </details>}
          <div className="conversation-actions">
            {!emergency && !finished && request && <M3Button variant="text" disabled={busy || !!pendingRetry} onClick={stopInterview}>End interview</M3Button>}
            <M3Button variant="text" onClick={restart}>Restart fictional interview</M3Button>
          </div>
        </div>
      </div>
      <aside className="conversation-assessment" aria-label="Assessment status">
        <details open={assessmentOpen} onToggle={event => setAssessmentOpen(event.currentTarget.open)} className="assessment-details"><summary>Assessment status · {status}</summary>
          <p role="status">{status}</p>
          <p>{request && !finished ? `Question ${Math.min(count + 1, 8)} of up to 8. ` : ''}Urgency assessment is unavailable. Gathering answers does not establish severity.</p>
          <ul aria-label="Unassessed severity categories">{['Low', 'Moderate', 'High', 'Very High'].map((level, index) => <li key={level} className={'severity-neutral severity-' + index}><span aria-hidden="true"/>{level}<small>{['Green', 'Yellow', 'Orange', 'Red'][index]} · not assessed</small></li>)}</ul>
          <p>No category is selected. Future assessed levels require independent clinical validation and authorization.</p>
          {emergency && <p className="assessment-warning">Independent emergency help is active. This is a provisional safety interruption, not a severity prediction.</p>}
        </details>
      </aside>
    </div>
  </section>;
}
