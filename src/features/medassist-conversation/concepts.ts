/** Explicit English equivalences for fictional ingress; no disease or clinical rules.
 * Misspellings are allowlisted whole-token forms, never fuzzy nearest-ID matches.
 */
const baseAnchors: Record<string, {
    label: string;
    pattern: RegExp;
}> = {
    // General pain is already a trained root symptom. Anatomy stays in the
    // narrative unless an exact, metadata-labelled location is explicitly chosen.
    E_53: { label: 'pain', pattern: /\bpain\b|\bhead\s*ache\b|\bstomach\s*ache\b|\b(?:head|stomach)\b[^.!?;]{0,24}\bhurt(?:ing|s)?\b/i },
    E_201: { label: 'cough', pattern: /\bcough(?:ing)?\b/i }, E_91: { label: 'fever', pattern: /\bfever(?:ish)?\b/i }, E_97: { label: 'sore throat', pattern: /\bsore throat\b|\bthroat (?:is |feels? )?sore\b/i },
    E_51: { label: 'diarrhea', pattern: /\bdiarrh(?:ea|oea)\b/i }, E_148: { label: 'nausea', pattern: /\bnause(?:a|ous|ated)\b|\bfeel(?:ing)? sick to (?:my|the) stomach\b|\bfeel(?:ing)? like (?:vomiting|throwing up)\b/i },
    E_211: { label: 'repeated vomiting', pattern: /\b(?:repeated(?:ly)?|keep|kept) (?:vomit(?:ing)?|throwing up)\b|\bvomit(?:ing)? repeatedly\b/i },
    E_129: { label: 'rash or skin lesions', pattern: /\brash\b|\bskin lesions?\b/i }, E_151: { label: 'swelling', pattern: /\bswell(?:ing|ed)?\b|\bswollen\b/i },
    E_30: { label: 'abdominal bloating', pattern: /\b(?:abdom(?:inal|en)|stomach|belly) (?:is |feels? )?bloat(?:ed|ing)\b|\bbloat(?:ed|ing) (?:stomach|belly)\b/i },
    E_94: { label: 'chills', pattern: /\bchills\b/i }, E_50: { label: 'sweating', pattern: /\bsweat(?:ing)?\b/i }, E_144: { label: 'diffuse muscle pain', pattern: /\b(?:muscle aches? all over|diffuse muscle pain|all.over muscle aches?)\b/i },
    E_175: { label: 'new fatigue or body aches', pattern: /\b(?:new fatigue|body aches|malaise)\b/i }, E_89: { label: 'constant fatigue or unrefreshing sleep', pattern: /\b(?:constant fatigue|always tired|unrefreshing sleep)\b/i },
    E_181: { label: 'nasal congestion or clear runny nose', pattern: /\b(?:nasal congestion|stuffy nose|clear runny nose)\b/i }, E_182: { label: 'green or yellow nasal discharge', pattern: /\b(?:green|yellow) (?:nasal discharge|mucus from (?:my|the) nose)\b/i },
    E_103: { label: 'loss of smell', pattern: /\b(?:loss of smell|lost (?:my )?sense of smell|cannot smell)\b/i }, E_212: { label: 'hoarse voice', pattern: /\bhoarse(?: voice)?\b/i },
    E_203: { label: 'intense coughing fits', pattern: /\b(?:intense|severe) cough(?:ing)? fits\b/i }, E_166: { label: 'vomiting after coughing', pattern: /\b(?:vomit(?:ing)?|throw(?:ing)? up) after cough(?:ing)?\b/i },
    E_219: { label: 'symptoms worse at night', pattern: /\b(?:worse|mostly|especially) at night\b/i }, E_32: { label: 'decreased appetite', pattern: /\b(?:decreased|less|reduced) appetite\b/i },
    E_74: { label: 'red eyes', pattern: /\bred eyes?\b/i }, E_127: { label: 'excessive tears', pattern: /\b(?:excessive tears|eyes? water(?:ing)? a lot)\b/i },
    E_170: { label: 'severe eye itching', pattern: /\b(?:severe(?:ly)? itchy eyes?|eyes? itch(?:ing)? severely)\b/i }, E_93: { label: 'numb feet', pattern: /\b(?:numb feet|feet (?:are |feel )?numb)\b/i },
    E_177: { label: 'numbness or tingling', pattern: /\b(?:numbness|tingling)\b/i }, E_76: { label: 'slight dizziness or lightheadedness', pattern: /\b(?:slight(?:ly)? dizzy|lightheaded(?:ness)?)\b/i },
};

const aliases: Record<string,string[]> = {
  "E_201": [
    "cough",
    "coughing",
    "coughed",
    "been coughing",
    "persistent cough",
    "couhg",
    "coughng"
  ],
  "E_53": [
    "stomach pain",
    "abdominal pain",
    "belly ache",
    "belly pain",
    "headache",
    "head ache",
    "head hurts",
    "head hurting",
    "head has been hurting",
    "stomach has hurt",
    "stomach hurts",
    "lower back pain",
    "lower back has been aching",
    "back aches",
    "stomache ache",
    "headach"
  ],
  "E_148": [
    "nausea",
    "nauseous",
    "nauseated",
    "feeling sick to my stomach",
    "feel sick to my stomach",
    "feel like vomiting",
    "feel like throwing up"
  ],
  "E_51": [
    "diarrhea",
    "diarrhoea",
    "diarhea"
  ],
  "E_91": [
    "fever",
    "feverish"
  ],
  "E_97": [
    "sore throat",
    "throat feels sore"
  ],
  "E_181": [
    "nasal congestion",
    "stuffy nose",
    "clear runny nose"
  ],
  "E_182": [
    "green nasal discharge",
    "yellow nasal discharge"
  ],
  "E_94": [
    "chills"
  ],
  "E_129": [
    "rash",
    "skin lesion",
    "skin lesions"
  ],
  "E_50": [
    "sweating",
    "sweat"
  ],
  "E_211": [
    "repeated vomiting",
    "repeatedly vomiting",
    "keep vomiting",
    "vomiting repeatedly"
  ],
  "E_219": [
    "worse at night",
    "mostly at night",
    "especially at night"
  ],
  "E_89": [
    "constant fatigue",
    "always tired",
    "unrefreshing sleep"
  ],
  "E_175": [
    "new fatigue",
    "body aches",
    "malaise"
  ],
  "E_66": [
    "significant shortness of breath",
    "significant difficulty breathing",
    "can breathe normally",
    "breathing normally"
  ]
};
baseAnchors.E_66 = { label: 'significant shortness of breath or difficulty breathing', pattern: /\b(?:significant (?:shortness of breath|difficulty breathing)|can breathe normally|breathing normally)\b/i };
export const tokenize = (text:string) => [...text.matchAll(/[a-z]+(?:['’][a-z]+)?|[0-9]+(?:\.[0-9]+)?/gi)].map(m=>({text:m[0].toLowerCase().replaceAll('’',"'"),start:m.index!,end:m.index!+m[0].length}));
export function labelIsSupported(quote:string,label:string) {
  const normalize=(s:string)=>tokenize(s).map(t=>t.text).join(' ');
  const n=' '+normalize(quote)+' ', side=label.match(/^(.*)\(([RL])\)$/);
  return [label,...(side?[`${side[2]==='R'?'right':'left'} ${side[1].trim()}`]:[])].some(s=>n.includes(' '+normalize(s)+' '));
}
const escape = (text:string) => text.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
export const languageConcepts = Object.entries(baseAnchors).map(([evidence_id, definition]) => {
  const synonyms = aliases[evidence_id] ?? [definition.label];
  const pattern = new RegExp('(?:'+definition.pattern.source+'|'+synonyms.map(s=>'\\b'+escape(s).replaceAll(' ','\\s+')+'\\b').join('|')+')','i');
  return {concept_id:'concept.'+evidence_id,evidence_id,canonical:definition.label,synonyms,pattern,
    qualifier_policy:'Match complete supported meaning; ambiguous qualifiers remain context.',confirmation_required:true as const};
});
export const anchors = Object.fromEntries(languageConcepts.map(c=>[c.evidence_id,{label:c.canonical,pattern:c.pattern}]));
export const ambiguousConcepts = [
 {concept:'nasal_discharge_unspecified',expressions:['runny nose','nasal discharge'],candidate_fields:['E_181','E_182'],reason:'Color/congestion qualifier unspecified.'},
 {concept:'feeling_sick_unspecified',expressions:['feeling sick','feel sick'],candidate_fields:['E_148'],reason:'General illness versus nausea is ambiguous.'},
 {concept:'breathing_difficulty_unspecified',expressions:['shortness of breath','difficulty breathing'],candidate_fields:['E_66'],reason:'Significant qualifier unspecified; safety remains independent.'},
 {concept:'reported_lump',expressions:['lump','tumor','cancer'],candidate_fields:[],reason:'No matching symptom field or confirmed diagnosis is inferred.'}
];
