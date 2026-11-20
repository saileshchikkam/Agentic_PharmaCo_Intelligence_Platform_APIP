# scripts/generate_concepts.py
"""Comprehensive 218-field vocabulary concepts generator for MedAssist.
Preserves all 30 existing anchors, aliases, and wording verbatim.
Maps all 110 symptoms and 108 active antecedents.
Preserves 5 quarantined fields as excluded.
"""
import json
import re
from pathlib import Path

# Load metadata
metadata = json.loads(Path("models/medassist_ai/docs/symptom-schema-metadata.json").read_text(encoding="utf-8"))
items = {i["evidence_id"]: i for i in metadata["items"]}
quarantined_ids = {"E_69", "E_37", "E_118", "E_123", "E_87"}

# The 30 existing base anchors verbatim:
existing_base_anchors = {
    "E_53": ("pain", r"\bpain\b|\bhead\s*ache\b|\bstomach\s*ache\b|\b(?:head|stomach)\b[^.!?;]{0,24}\bhurt(?:ing|s)?\b"),
    "E_201": ("cough", r"\bcough(?:ing)?\b|^\s*cgh(?:\s+(?:since|for|today)\b|[.!]?\s*$)|\b(?:have|having|no|maybe|perhaps) cgh\b"),
    "E_91": ("fever", r"\bfever(?:ish)?\b"),
    "E_97": ("sore throat", r"\bsore throat\b|\bthroat (?:is |feels? )?sore\b"),
    "E_51": ("diarrhea", r"\bdiarrh(?:ea|oea)\b"),
    "E_148": ("nausea", r"\bnause(?:a|ous|ated)\b|\bfeel(?:ing)? sick to (?:my|the) stomach\b|\bfeel(?:ing)? like (?:vomiting|throwing up)\b"),
    "E_211": ("repeated vomiting", r"\b(?:repeated(?:ly)?|keep|kept) (?:vomit(?:ing)?|throwing up)\b|\bvomit(?:ing)? repeatedly\b"),
    "E_129": ("rash or skin lesions", r"\brash\b|\bskin lesions?\b"),
    "E_151": ("swelling", r"\bswell(?:ing|ed)?\b|\bswollen\b"),
    "E_30": ("abdominal bloating", r"\b(?:abdom(?:inal|en)|stomach|belly) (?:is |feels? )?bloat(?:ed|ing)\b|\bbloat(?:ed|ing) (?:stomach|belly)\b"),
    "E_94": ("chills", r"\bchills\b"),
    "E_50": ("sweating", r"\bsweat(?:ing)?\b"),
    "E_144": ("diffuse muscle pain", r"\b(?:muscle aches? all over|diffuse muscle pain|all.over muscle aches?|body (?:is )?aching all over|body aching all over)\b"),
    "E_175": ("new fatigue or body aches", r"\b(?:new fatigue|body aches|malaise)\b"),
    "E_89": ("constant fatigue or unrefreshing sleep", r"\b(?:constant fatigue|always tired|unrefreshing sleep)\b"),
    "E_181": ("nasal congestion or clear runny nose", r"\b(?:nasal congestion|stuffy nose|clear runny nose)\b"),
    "E_182": ("green or yellow nasal discharge", r"\b(?:green|yellow) (?:nasal discharge|mucus from (?:my|the) nose)\b"),
    "E_103": ("loss of smell", r"\b(?:loss of smell|lost (?:my )?sense of smell|cannot smell)\b"),
    "E_212": ("hoarse voice", r"\bhoarse(?: voice)?\b"),
    "E_203": ("intense coughing fits", r"\b(?:intense|severe) cough(?:ing)? fits\b"),
    "E_166": ("vomiting after coughing", r"\b(?:vomit(?:ing)?|throw(?:ing)? up) after cough(?:ing)?\b"),
    "E_219": ("symptoms worse at night", r"\b(?:worse|mostly|especially) at night\b"),
    "E_32": ("decreased appetite", r"\b(?:decreased|less|reduced) appetite\b"),
    "E_74": ("red eyes", r"\bred eyes?\b"),
    "E_127": ("excessive tears", r"\b(?:excessive tears|eyes? water(?:ing)? a lot)\b"),
    "E_170": ("severe eye itching", r"\b(?:severe(?:ly)? itchy eyes?|eyes? itch(?:ing)? severely)\b"),
    "E_93": ("numb feet", r"\b(?:numb feet|feet (?:are |feel )?numb)\b"),
    "E_177": ("numbness or tingling", r"\b(?:numbness|tingling)\b"),
    "E_76": ("slight dizziness or lightheadedness", r"\b(?:slight(?:ly)? dizzy|lightheaded(?:ness)?)\b"),
    "E_66": ("significant shortness of breath or difficulty breathing", r"\b(?:significant (?:shortness of breath|difficulty breathing)|can breathe normally|breathing normally)\b"),
}

# The existing aliases verbatim for the 30 anchors:
existing_aliases = {
    "E_201": [
        "cough", "coughing", "coughed", "been coughing", "persistent cough", "couhg", "coughng",
        "cogh", "coffing", "couffing", "coffin", "daggu", "daggina", "daggu vastondi",
        "daggu undi", "dagguthunna", "dry daggu", "severe daggu", "దగ్గు", "దగ్గుగా ఉంది", "దగ్గు వస్తుంది"
    ],
    "E_53": [
        "stomach pain", "abdominal pain", "belly ache", "belly pain", "headache", "head ache",
        "head hurts", "head hurting", "head has been hurting", "head paining", "head is paining",
        "hed is paining", "hed paining", "head has been aching", "aching head", "aching hed",
        "hed hurts", "hed hurting", "hedache", "hed ache", "tummy hurting", "belly ache bad",
        "stomach pain coming going", "pain coming and going", "pain coming going", "bad stomach ache",
        "bad headache", "back pain", "throat is paining", "throat paining", "body is aching",
        "stomach has hurt", "stomach hurts", "lower back pain", "lower back has been aching",
        "back aches", "stomache ache", "headach", "talanoppi", "thala noppi", "tala noppi",
        "kadupu noppi", "kadupunoppi", "kadupulo noppi", "noppi", "తలనొప్పి", "తల నొప్పి",
        "కడుపు నొప్పి", "కడుపునొప్పి", "నొప్పి"
    ],
    "E_148": [
        "nausea", "nauseous", "nauseated", "nausous", "nausia", "feel a bit pukey",
        "feeling sick to my stomach", "feel like puking", "feeling like puking",
        "feel sick to my stomach", "feel like vomiting", "feel like throwing up",
        "pukey feeling", "pukey feeling in stomach", "feeling pukey", "feel like pukin",
        "vanthulu", "vaanthulu", "vanthi sensation", "vanti vastunnatlu", "vanthi", "వాంతులు", "వాంతి"
    ],
    "E_51": [
        "diarrhea", "diarrhoea", "diarhea", "loose motion", "loose motions", "motions are loose",
        "motions loose", "motions loose from morning", "tummy upset with loose motions",
        "the runs", "diarhoea", "diarrea", "virechanalu", "virechanaalu", "motions avtunnayi",
        "motions aithunnai", "విరేచనాలు"
    ],
    "E_91": [
        "fever", "feverish", "fevr", "body burning hot", "burning hot body", "burning body",
        "jwaram", "jvaram", "jvaramu", "jwaramga undi", "jwaram vastondi", "high jwaram",
        "జ్వరం", "జ్వరము", "జ్వరంగా ఉంది"
    ],
    "E_97": [
        "sore throat", "throat feels sore", "throat has been sore", "throat feels soor",
        "sore thrt", "sore throaat", "soar throat", "throat scratching while swallowing",
        "scratchy throat", "gontu noppi", "gonthu noppi", "gontulo manta", "gonthu manta",
        "గొంతు నొప్పి", "గొంతు మంట"
    ],
    "E_181": [
        "nasal congestion", "nose is blocked", "nose is stuffy", "nose is stufy",
        "nose feels congested", "nose fully blocked", "nose blocked", "blocked nose",
        "nose water coming", "watery runny nose", "stuffy nose", "clear runny nose"
    ],
    "E_182": ["green nasal discharge", "yellow nasal discharge"],
    "E_94": ["chills", "chillls", "feel shivery"],
    "E_129": ["rash", "skin lesion", "skin lesions"],
    "E_50": ["sweating", "sweat"],
    "E_211": ["repeated vomiting", "repeatedly vomiting", "keep vomiting", "vomiting repeatedly", "vomting repeatedly"],
    "E_219": ["worse at night", "mostly at night", "especially at night"],
    "E_89": ["constant fatigue", "always tired", "always tierd", "tierd", "unrefreshing sleep"],
    "E_144": [
        "diffuse muscle pain", "muscle aches all over", "diffuse muscle aches",
        "body is aching all over", "body aching all over", "aching all over",
        "muscle pain all over", "all over muscle aches"
    ],
    "E_74": ["red eyes", "red eye", "eyes are red", "eyes red", "eye red", "eyes feel red"],
    "E_175": ["new fatigue", "body aches", "malaise"],
    "E_66": ["significant shortness of breath", "significant difficulty breathing", "can breathe normally", "breathing normally"],
    "E_76": ["feel light headed", "feeling light headed", "little dizzy", "feel dizzzy", "dizzzy", "dizzy", "head spinning", "head is spinning", "slight dizziness", "lightheaded", "lightheadedness"]
}

# The existing wording overrides verbatim:
existing_wording = {
    "E_201": r"\b(?:coff|couugh)\b",
    "E_91": r"\b(?:feever|fevar)\b",
    "E_97": r"\bsoar throat\b|\bthroat(?:['’]s|\s+(?:(?:is|feels?|not|a|little|[a-z]+)\s+){0,4})\s*sore\b|\bthroat (?:is )?scratching while swallowing\b",
    "E_148": r"\bnausia\b|\b(?:feel(?:ing)? (?:ready|about) to puke|vomiting sensation)\b",
    "E_51": r"\bdiarrhoe\b|\bno runs\b",
    "E_94": r"\bchils\b",
    "E_76": r"\b(?:liteheaded|light-headed|light headed i am)\b",
    "E_74": r"\b(?:eyes?\s+(?:are\s+)?(?:not\s+)?red|not\s+red\s+eyes?|eyes?\b[^.!?,;]{0,20}\bred|red\b[^.!?,;]{0,20}\beyes?|not\s+red)\b",
    "E_53": r"\b(?:head|hed|tummy)\s+(?:(?:is|does|not|has|been)\s+){0,4}(?:hurt(?:s|ing)?|pain(?:ing)?)\b|\bhedache\b|\bhed\s*ache\b|\baching\s+hed\b|\bhead aches\b|\baching back\b|\bpainful (?:head|back|knee|shoulder|arm|leg|foot|stomach|belly|tummy)\b|\bonly my (?:knee|shoulder|arm|leg|foot) hurts\b",
    "E_181": r"\bnose\s+(?:(?:is|not|getting|feels?)\s+){0,4}(?:blocked|stufffed)\b|\bnose\s+(?:(?:is|not|won['’]t|will|stop)\s+){0,4}(?:leaking water|dripping clear water)\b",
}

print("Base existing anchors loaded:", len(existing_base_anchors))

# Additional 188 active items dictionary: (label, pattern, aliases)
new_anchors = {
    # Child symptoms
    "E_54": ("pain characteristics", r"\b(?:knife\s*stroke|stabbing|sharp|burning|cramp|throbbing|pulse|heavy|tearing|sickening|aching)\s*pain\b|\bcharacterize\s*pain\b", ["knife stroke", "sharp pain", "burning pain", "throbbing pain", "cramping pain", "stabbing pain"]),
    "E_55": ("pain location", r"\bpain\s+(?:in|at|on)\s+(?:the\s+)?[a-z\s()]+|\bfeel\s+pain\s+somewhere\b", ["pain location", "pain in back", "pain in chest", "pain in abdomen", "pain in knee", "pain in shoulder", "pain in neck"]),
    "E_56": ("pain intensity", r"\bpain\s+(?:is\s+)?(?:intensity\s+)?[0-9]{1,2}(?:\s*out\s*of\s*10)?\b|\bhow\s+intense\s+is\s+the\s+pain\b", ["pain intensity", "intense pain", "pain scale"]),
    "E_57": ("radiating pain", r"\bradiat(?:ing|es?)\s+(?:to|down|into)\b|\bpain\s+spread(?:ing|s)?\s+(?:to|into)\b", ["radiating pain", "radiates to", "pain radiates", "pain spreads to"]),
    "E_58": ("precision of pain location", r"\bprecise(?:ly)?\s+located\b|\bprecision\s+of\s+pain\b", ["precision of pain", "precisely located", "well localized pain", "diffuse pain"]),
    "E_59": ("speed of pain onset", r"\b(?:fast|sudden|gradual)\s+(?:pain\s+)?onset\b|\bhow\s+fast\s+did\s+the\s+pain\s+appear\b", ["speed of pain onset", "sudden onset", "gradual onset"]),
    "E_130": ("rash color", r"\b(?:red|pink|dark|yellow|pale)\s+rash\b|\bwhat\s+color\s+is\s+the\s+rash\b", ["rash color", "red rash", "pink rash", "dark rash", "pale rash", "yellow rash"]),
    "E_131": ("peeling lesions", r"\blesions?\s+peel(?:ing)?\s+off\b|\bpeeling\s+(?:skin|lesions?|rash)\b", ["peeling lesions", "lesions peel off", "skin peeling", "peeling rash"]),
    "E_132": ("swollen rash", r"\b(?:swollen|raised)\s+rash\b|\brash\s+is\s+swollen\b", ["swollen rash", "rash is swollen", "raised rash"]),
    "E_133": ("rash location", r"\brash\s+(?:on|across)\s+(?:the\s+)?[a-z\s()]+\b", ["rash location", "rash on face", "rash on chest", "rash on arms", "rash on legs", "rash on back"]),
    "E_134": ("rash pain intensity", r"\brash\s+(?:is\s+)?painful\b|\bpain\s+caused\s+by\s+(?:the\s+)?rash\b", ["rash pain", "painful rash", "pain from rash"]),
    "E_135": ("lesions larger than 1cm", r"\blesions?\s+(?:larger|bigger)\s+than\s+1\s*cm\b|\blarge\s+(?:lesions?|spots?)\b", ["lesions larger than 1cm", "large lesions", "lesions > 1cm", "spots bigger than 1cm"]),
    "E_136": ("rash itch intensity", r"\bitch(?:ing|y)?\s+rash\b|\bhow\s+severe\s+is\s+the\s+itching\b", ["rash itch intensity", "itchy rash", "severe itching", "itching rash"]),
    "E_152": ("swelling location", r"\bswelling\s+(?:in|on|around)\s+(?:the\s+)?[a-z\s()]+\b", ["swelling location", "swelling in ankles", "swelling in legs", "swelling in feet", "swelling in face", "swollen ankles"]),

    # Root symptoms
    "E_159": ("lost consciousness", r"\b(?:los[ts]\s+consciousness|faint(?:ed|ing)?|pass(?:ed)?\s+out|black(?:ed)?\s+out|syncope|spruha\s+tapp(?:adam|indi))\b", ["lost consciousness", "fainted", "passed out", "blacked out", "syncope", "spruha tappadam", "స్పృహ తప్పడం"]),
    "E_154": ("pale skin", r"\b(?:pale\s+skin|skin\s+(?:is\s+)?paler?|pallor)\b", ["pale skin", "skin pale", "pallor", "paler than usual", "tellaga ayyindi"]),
    "E_155": ("palpitations or racing heart", r"\b(?:palpitation[s]?|heart\s+(?:is\s+)?(?:racing|beating\s+fast|fluttering|skipping\s+a\s+beat)|racing\s+heart)\b", ["palpitations", "racing heart", "heart racing", "heart pounding", "irregular heartbeat", "gunde dadata", "gunde dada", "gunde dadaga", "గుండె దడ", "గుండె దడగా ఉంది", "గుండె దడగా", "గుండెదడ"]),
    "E_210": ("vomiting blood or coffee ground emesis", r"\b(?:vomit(?:ed|ing)?\s+blood|threw\s+up\s+blood|coffee[\s-]ground\s+(?:vomit|emesis)|hematemesis)\b", ["vomiting blood", "threw up blood", "coffee ground vomit", "blood in vomit", "hematemesis"]),
    "E_140": ("black stools", r"\b(?:black\s+stool[s]?|coal[\s-]like\s+stool[s]?|melena|dark\s+black\s+(?:poop|bowel\s+movement))\b", ["black stools", "black stool", "coal like stools", "melena", "dark black stool"]),
    "E_179": ("blood in stool", r"\b(?:blood\s+(?:in|with)\s+(?:my\s+)?stool|bloody\s+stool[s]?|rectal\s+bleeding|blood\s+clots?\s+in\s+stool|hematochezia)\b", ["blood in stool", "bloody stools", "rectal bleeding", "blood in poop", "hematochezia", "raktha virechanalu"]),
    "E_75": ("choking or suffocating", r"\b(?:chok(?:ing|ed)|suffocat(?:ing|ed)|cannot\s+catch\s+my\s+breath|air\s+hunger)\b", ["choking", "suffocating", "choking sensation", "feel like suffocating"]),
    "E_114": ("mood instability or irritability", r"\b(?:irritable|irritability|mood\s+(?:swings|unstable|instability)|very\s+irritable)\b", ["irritable", "irritability", "mood swings", "mood unstable"]),
    "E_82": ("severe dizziness or about to faint", r"\b(?:about\s+to\s+faint|feel(?:ing)?\s+like\s+fainting|feel(?:ing)?\s+like\s+passing\s+out|presyncope)\b", ["about to faint", "feel like fainting", "feel like passing out", "presyncope", "severe dizziness"]),
    "E_220": ("pain increased when breathing in deeply", r"\b(?:pain\s+(?:is\s+)?(?:worse|increased)\s+(?:when|while)\s+breath(?:ing|e)\s+in|hurts\s+to\s+breathe\s+in|pleuritic\s+pain)\b", ["pain increased breathing in", "hurts to breathe deeply", "pain breathing in", "pleuritic pain"]),
    "E_161": ("loss of appetite or feeling full sooner", r"\b(?:get\s+full\s+(?:more\s+quickly|faster|sooner)|early\s+satiety|feel\s+full\s+after\s+(?:a\s+few|little)\s+bites)\b", ["feeling full sooner", "early satiety", "get full quickly", "full after few bites"]),
    "E_162": ("involuntary weight loss in last 3 months", r"\b(?:lost\s+weight\s+(?:without\s+trying|involuntarily|over\s+the\s+last\s+3\s+months)|involuntary\s+weight\s+loss)\b", ["involuntary weight loss", "lost weight last 3 months", "unexplained weight loss"]),
    "E_174": ("unintentional weight loss or loss of appetite", r"\b(?:unintentionally\s+losing\s+weight|unintentional\s+weight\s+loss)\b", ["unintentionally losing weight", "unintentional weight loss", "losing weight without trying"]),
    "E_96": ("weight gain", r"\b(?:gained\s+weight|weight\s+gain|putting\s+on\s+weight)\b", ["gained weight", "weight gain", "putting on weight", "baruvu peragadam"]),
    "E_173": ("heartburn with bitter taste", r"\b(?:heartburn|acid\s+reflux|burning\s+in\s+(?:stomach|chest)\s+(?:and|to)\s+throat|bitter\s+taste\s+in\s+mouth|waterbrash)\b", ["heartburn", "acid reflux", "burning in throat", "bitter taste in mouth", "chest burn"]),
    "E_33": ("pain relieved by leaning forward", r"\b(?:pain\s+improves?\s+(?:when|by)\s+lean(?:ing)?\s+forward|better\s+when\s+lean(?:ing)?\s+forward)\b", ["pain improves leaning forward", "better leaning forward", "relieved leaning forward"]),
    "E_218": ("symptoms worse with exertion relieved by rest", r"\b(?:(?:worse|increased)\s+with\s+(?:exercise|exertion|walking|effort)|alleviated\s+with\s+rest|better\s+(?:with|when)\s+rest(?:ing)?)\b", ["worse with exertion", "alleviated with rest", "better resting", "exertional symptoms"]),
    "E_216": ("pain increased with movement", r"\b(?:pain\s+(?:is\s+)?(?:worse|increased)\s+(?:with|upon)\s+movement|hurts\s+to\s+move)\b", ["pain increased with movement", "hurts to move", "worse with movement"]),
    "E_217": ("symptoms worse lying down relieved sitting up", r"\b(?:worse\s+(?:when\s+)?lying\s+down|better\s+(?:when\s+)?sitting\s+up|orthopnea)\b", ["worse lying down", "better sitting up", "orthopnea", "cannot lie flat"]),
    "E_215": ("symptoms worse after eating", r"\b(?:worse\s+after\s+(?:eating|meals|food)|increased\s+after\s+eating)\b", ["worse after eating", "worse after meals", "symptoms worse after food"]),
    "E_64": ("out of breath with minimal effort", r"\b(?:out\s+of\s+breath\s+with\s+minimal\s+(?:effort|exertion|walking)|breathless\s+walking\s+a\s+few\s+steps)\b", ["out of breath with minimal effort", "breathless walking short distance", "minimal exertion breathlessness"]),
    "E_163": ("vaginal discharge", r"\b(?:vaginal\s+discharge|leukorrhea|unusual\s+discharge\s+from\s+vagina)\b", ["vaginal discharge", "leukorrhea", "abnormal vaginal discharge"]),
    "E_145": ("heavy or long menstrual periods", r"\b(?:heavy\s+period[s]?|heavy\s+menstruation|menorrhagia|very\s+long\s+periods)\b", ["heavy periods", "heavy menstruation", "menorrhagia", "long menstrual periods"]),
    "E_43": ("loss of consciousness with convulsions", r"\b(?:seizure[s]?|convulsion[s]?|sustained\s+muscle\s+contractions|absence\s+episode|epileptic\s+fit)\b", ["seizure", "convulsions", "epileptic fit", "absence episode", "muscle contractions seizure"]),
    "E_156": ("facial weakness or unilateral paralysis", r"\b(?:facial\s+droop(?:ing)?|weakness\s+on\s+one\s+side\s+of\s+(?:the\s+)?face|paralysis\s+on\s+one\s+side\s+of\s+face|bell['’]?s\s+palsy)\b", ["facial droop", "facial paralysis", "weakness one side face", "bell's palsy"]),
    "E_83": ("facial muscle and eye weakness", r"\b(?:weakness\s+in\s+facial\s+muscles|weakness\s+around\s+eyes|facial\s+muscle\s+weakness)\b", ["weakness in facial muscles", "facial muscle weakness", "weakness around eyes"]),
    "E_176": ("limb or facial weakness", r"\b(?:weakness\s+in\s+(?:my\s+)?(?:arm[s]?|leg[s]?|limbs?)|paralysis\s+in\s+(?:arm|leg|face|limb))\b", ["limb weakness", "weakness in arm", "weakness in leg", "paralysis in limb", "facial weakness"]),
    "E_84": ("weakness in both arms or legs", r"\b(?:weakness\s+in\s+both\s+arms|weakness\s+in\s+both\s+legs|bilateral\s+weakness)\b", ["weakness in both arms", "weakness in both legs", "bilateral limb weakness"]),
    "E_90": ("weakness worsened by fatigue or stress", r"\b(?:weakness\s+(?:gets\s+)?worse\s+with\s+(?:fatigue|tiredness|stress)|muscle\s+weakness\s+increases\s+at\s+end\s+of\s+day)\b", ["weakness worsens with fatigue", "weakness worse with stress", "fatigable muscle weakness"]),
    "E_88": ("severe fatigue bedridden", r"\b(?:too\s+tired\s+to\s+do\s+(?:my\s+)?usual\s+activities|stuck\s+in\s+(?:my\s+)?bed\s+all\s+day|bedridden\s+from\s+exhaustion)\b", ["too tired to do usual activities", "stuck in bed all day", "severe fatigue bedridden"]),
    "E_9": ("swollen lymph nodes", r"\b(?:swollen\s+(?:lymph\s+nodes?|glands?)|lymphadenopathy|painful\s+lymph\s+nodes?)\b", ["swollen lymph nodes", "swollen glands", "lymphadenopathy", "painful lymph nodes"]),
    "E_65": ("difficulty swallowing", r"\b(?:difficult(?:y)?\s+swallowing|trouble\s+swallowing|dysphagia|food\s+(?:gets\s+)?stuck\s+(?:in\s+throat|swallowing))\b", ["difficulty swallowing", "trouble swallowing", "dysphagia", "food gets stuck swallowing"]),
    "E_205": ("jaw trismus or pain opening mouth", r"\b(?:difficulty\s+opening\s+(?:my\s+)?mouth|unable\s+to\s+open\s+mouth|trismus|locked\s+jaw|jaw\s+pain\s+when\s+opening)\b", ["difficulty opening mouth", "trismus", "locked jaw", "jaw pain opening mouth"]),
    "E_63": ("difficulty articulating words or speaking", r"\b(?:slurred\s+speech|difficulty\s+(?:articulating|speaking|talking)|trouble\s+speaking|dysarthria)\b", ["slurred speech", "difficulty speaking", "trouble articulating", "dysarthria"]),
    "E_128": ("sudden suffocating episode", r"\b(?:suffocat(?:ing|ed)\s+for\s+a\s+(?:very\s+)?short\s+time|unable\s+to\s+breathe\s+or\s+speak\s+briefly)\b", ["suffocating briefly", "short suffocation episode", "unable to breathe or speak briefly"]),
    "E_190": ("excessive salivation", r"\b(?:excessive\s+saliva|producing\s+more\s+saliva|drooling|hypersalivation|too\s+much\s+spit)\b", ["excessive saliva", "producing more saliva", "drooling", "hypersalivation"]),
    "E_39": ("confusion or disorientation", r"\b(?:confused|confusion|disorient(?:ed|ation)|brain\s+fog|delirium)\b", ["confused", "confusion", "disoriented", "brain fog", "delirium"]),
    "E_206": ("painful mouth ulcers", r"\b(?:mouth\s+(?:ulcers?|sores?)|canker\s+sores?|aphthous\s+ulcers?|sores?\s+in\s+mouth)\b", ["mouth ulcers", "canker sores", "mouth sores", "aphthous ulcers", "notilo purlu"]),
    "E_52": ("double vision", r"\b(?:double\s+vision|diplopia|seeing\s+two\s+(?:images|of\s+everything))\b", ["double vision", "diplopia", "seeing double"]),
    "E_38": ("jaw pain or weakness", r"\b(?:jaw\s+pain|pain\s+in\s+(?:my\s+)?jaw|weakness\s+in\s+(?:my\s+)?jaw|jaw\s+hurts?\s+chewing)\b", ["jaw pain", "pain in jaw", "weakness in jaw", "jaw ache"]),
    "E_172": ("difficulty raising eyelid", r"\b(?:droop(?:y|ing)\s+eyelid|hard\s+time\s+opening\s+(?:one\s+or\s+both\s+)?eyelids?|ptosis)\b", ["drooping eyelid", "hard time opening eyelid", "ptosis"]),
    "E_180": ("unable to control eye direction", r"\b(?:unable\s+to\s+control\s+(?:the\s+)?direction\s+of\s+(?:my\s+)?eyes|eyes\s+moving\s+involuntarily|eye\s+movement\s+abnormal)\b", ["unable to control eye direction", "eyes moving involuntarily", "eye movement problem"]),
    "E_168": ("trouble keeping tongue in mouth", r"\b(?:trouble\s+keeping\s+tongue\s+in\s+mouth|tongue\s+protrud(?:ing|es)|tongue\s+sticking\s+out)\b", ["trouble keeping tongue in mouth", "tongue sticking out", "tongue protrusion"]),
    "E_192": ("neck muscle spasms", r"\b(?:neck\s+spasms?|stiff\s+neck\s+(?:preventing|stopping)\s+head\s+turning|torticollis|cannot\s+turn\s+head)\b", ["neck spasms", "stiff neck", "torticollis", "cannot turn head"]),
    "E_193": ("facial or body muscle spasms", r"\b(?:muscle\s+spasms?\s+in\s+(?:face|neck|body)|involuntary\s+spasms?|dystonia|twitching)\b", ["muscle spasms", "facial spasms", "body spasms", "dystonia", "muscle twitching"]),
    "E_178": ("unusual bleeding or bruising", r"\b(?:unusual\s+(?:bleeding|bruising)|easy\s+bruising|spontaneous\s+bruis(?:es|ing)|petechiae)\b", ["unusual bleeding", "unusual bruising", "easy bruising", "petechiae"]),
    "E_188": ("pale stools and dark urine", r"\b(?:pale\s+stool[s]?\s+and\s+dark\s+urine|clay[\s-]colored\s+stool|tea[\s-]colored\s+urine)\b", ["pale stools and dark urine", "clay colored stool", "dark tea colored urine"]),
    "E_92": ("sudden cheek redness", r"\b(?:cheeks?\s+suddenly\s+turn(?:ed)?\s+red|flushed\s+cheeks|facial\s+erythema|malar\s+flush)\b", ["cheeks suddenly turn red", "flushed cheeks", "malar flush", "facial redness"]),
    "E_169": ("itchy nose or throat", r"\b(?:itchy\s+nose|itchy\s+back\s+of\s+throat|itchiness\s+in\s+throat\s+or\s+nose)\b", ["itchy nose", "itchy throat", "itchiness in nose or throat"]),
    "E_14": ("chest pain at rest", r"\b(?:chest\s+pain\s+(?:even\s+)?at\s+rest|resting\s+chest\s+pain)\b", ["chest pain at rest", "resting chest pain", "chest pain sitting quietly"]),
    "E_13": ("symptoms worsening over 2 weeks on less effort", r"\b(?:symptoms\s+worsened\s+over\s+(?:the\s+last\s+)?2\s+weeks|progressively\s+less\s+effort\s+causes?\s+symptoms)\b", ["symptoms worsening over 2 weeks", "progressively less effort causes symptoms"]),
    "E_42": ("contact with known allergen", r"\b(?:allergic\s+reaction|ate\s+something\s+(?:i\s+am\s+)?allergic\s+to|exposed\s+to\s+allergen)\b", ["allergic reaction", "ate allergen", "contact with allergen", "allergy trigger"]),
    "E_45": ("coughing up blood", r"\b(?:cough(?:ing|ed)?\s+up\s+blood|bloody\s+sputum|hemoptysis|blood\s+in\s+cough)\b", ["coughing up blood", "bloody sputum", "hemoptysis", "cough with blood", "daggu lo raktham"]),
    "E_194": ("inspiratory stridor", r"\b(?:high[\s-]pitched\s+sound\s+(?:when|while)\s+breath(?:ing|e)\s+in|inspiratory\s+stridor|noisy\s+inhalation)\b", ["high pitched sound breathing in", "inspiratory stridor", "stridor breathing in"]),
    "E_214": ("expiratory wheeze", r"\b(?:wheez(?:ing|e)\s+(?:sound\s+)?(?:when|while)\s+(?:i\s+)?exhale|wheezing\s+on\s+exhalation)\b", ["wheezing exhaling", "wheeze when exhale", "expiratory wheeze"]),
    "E_150": ("inability to pass stool or gas", r"\b(?:unable\s+to\s+pass\s+(?:stools?|gas|wind)|cannot\s+pass\s+gas|no\s+bowel\s+movement\s+or\s+gas)\b", ["unable to pass stool or gas", "cannot pass gas", "no bowel movement or gas", "obstipation"]),
    "E_221": ("pain increased with coughing or straining", r"\b(?:pain\s+(?:is\s+)?(?:worse|increased)\s+with\s+(?:cough(?:ing)?|straining|lifting|bowel\s+movement))\b", ["pain increased with coughing", "pain worse straining", "pain worse lifting"]),
    "E_202": ("whooping cough", r"\b(?:whooping\s+cough|pertussis|whoop\s+sound\s+when\s+coughing)\b", ["whooping cough", "pertussis", "whoop sound coughing"]),
    "E_77": ("colored or abundant sputum", r"\b(?:cough\s+(?:with|producing)\s+(?:colored|yellow|green|abundant)\s+(?:sputum|phlegm|mucus)|productive\s+cough)\b", ["colored sputum", "cough producing phlegm", "productive cough", "cough with green mucus"]),
    "E_67": ("nocturnal choking or shortness of breath", r"\b(?:waking\s+up\s+(?:at\s+night\s+)?(?:choking|gasping|out\s+of\s+breath)|paroxysmal\s+nocturnal\s+dyspnea)\b", ["waking up choking", "waking up out of breath", "paroxysmal nocturnal dyspnea"]),
    "E_171": ("detached from body or surroundings", r"\b(?:detached\s+from\s+(?:my\s+)?(?:own\s+)?body|out\s+of\s+body\s+feeling|derealization|depersonalization)\b", ["detached from body", "derealization", "depersonalization", "feeling detached"]),
    "E_111": ("feeling like dying", r"\b(?:feel(?:ing)?\s+like\s+(?:i\s+am\s+)?dying|afraid\s+that\s+i\s+was\s+about\s+to\s+die|impending\s+doom)\b", ["feeling like dying", "afraid about to die", "impending doom"]),
    "E_23": ("stop breathing while asleep", r"\b(?:temporarily\s+stop\s+breathing\s+while\s+asleep|stop\s+breathing\s+during\s+sleep|sleep\s+apnea\s+episodes?)\b", ["stop breathing while asleep", "temporarily stop breathing during sleep", "sleep apnea"]),
    "E_157": ("numbness in limbs and mouth", r"\b(?:numbness\s+in\s+both\s+arms\s+and\s+legs\s+and\s+around\s+mouth|tingling\s+limbs\s+and\s+mouth)\b", ["numbness in limbs and mouth", "tingling around mouth and limbs"]),
    "E_112": ("inhaled wheeze or noisy breathing after cough", r"\b(?:wheeze\s+while\s+inhaling|noisy\s+breathing\s+after\s+coughing|stridor\s+after\s+coughing)\b", ["wheeze while inhaling", "noisy breathing after coughing", "inhaled wheeze"]),
    "E_164": ("irregular disorganized heartbeat", r"\b(?:heart\s+beating\s+very\s+irregularly|disorganized\s+heartbeat|arrhythmia\s+sensation)\b", ["irregular disorganized heartbeat", "heart beating very irregularly", "disorganized heartbeat"]),

    # Antecedents
    "E_16": ("anxious", r"\b(?:anxious|feeling\s+anxious|anxiety|nervous)\b", ["anxious", "feeling anxious", "anxiety", "nervous", "aatram"]),
    "E_102": ("high blood pressure consultation", r"\b(?:consulting\s+(?:for|due\s+to)\s+high\s+blood\s+pressure|blood\s+pressure\s+checkup)\b", ["consulting for high blood pressure", "high bp consultation"]),
    "E_196": ("surgery within last month", r"\b(?:surgery\s+within\s+(?:the\s+last\s+)?month|had\s+an\s+operation\s+recently|recent\s+surgical\s+procedure)\b", ["surgery within last month", "recent surgery", "recent operation"]),
    "E_78": ("excessive alcohol or addiction", r"\b(?:excessive\s+alcohol|drink\s+heavily|alcohol\s+addiction|heavy\s+drinker|alcoholism)\b", ["excessive alcohol", "heavy drinker", "alcohol addiction", "alcoholism"]),
    "E_146": ("new oral anticoagulants / NOACs", r"\b(?:noac[s]?|doac[s]?|oral\s+anticoagulant[s]?|blood\s+thinners?|apixaban|rivaroxaban|dabigatran)\b", ["noacs", "oral anticoagulants", "blood thinners", "apixaban", "rivaroxaban"]),
    "E_105": ("heart attack or angina", r"\b(?:heart\s+attack|myocardial\s+infarction|angina|coronary\s+artery\s+disease)\b", ["heart attack", "myocardial infarction", "angina", "coronary disease"]),
    "E_108": ("poor circulation", r"\b(?:poor\s+circulation|peripheral\s+artery\s+disease|pad|poor\s+blood\s+flow)\b", ["poor circulation", "peripheral artery disease", "poor blood flow"]),
    "E_104": ("high blood pressure or meds", r"\b(?:high\s+blood\s+pressure|hypertension|bp\s+meds|blood\s+pressure\s+medication|hypertensive)\b", ["high blood pressure", "hypertension", "bp medication", "taking bp meds"]),
    "E_79": ("smoke cigarettes", r"\b(?:smoke\s+cigarettes?|smoker|smoking\s+daily|pack\s+a\s+day)\b", ["smoke cigarettes", "smoker", "smoking cigarettes", "cigarette smoker"]),
    "E_71": ("high cholesterol or meds", r"\b(?:high\s+cholesterol|hyperlipidemia|cholesterol\s+medication|statins?)\b", ["high cholesterol", "hyperlipidemia", "cholesterol medication", "taking statins"]),
    "E_41": ("contact with person with similar symptoms", r"\b(?:contact\s+with\s+(?:someone|person)\s+with\s+similar\s+symptoms|exposed\s+to\s+someone\s+sick)\b", ["contact with similar symptoms", "exposed to sick person", "family member has same symptoms"]),
    "E_100": ("take hormones", r"\b(?:take\s+hormones?|hormone\s+replacement|birth\s+control\s+pills?|estrogen|progesterone)\b", ["take hormones", "hormone replacement", "birth control pills", "taking hormones"]),
    "E_167": ("pregnant", r"\b(?:pregnant|think\s+i\s+am\s+pregnant|expecting\s+a\s+baby|garbhavathi|గర్భవతి)\b", ["pregnant", "currently pregnant", "think i am pregnant", "expecting a baby", "garbhavathi", "గర్భవతి"]),
    "E_115": ("unprotected sex multiple partners", r"\b(?:unprotected\s+sex\s+with\s+more\s+than\s+one\s+partner|multiple\s+unprotected\s+partners)\b", ["unprotected sex multiple partners", "unprotected sex with multiple partners"]),
    "E_70": ("significantly overweight", r"\b(?:significantly\s+overweight|obese|obesity|high\s+bmi)\b", ["significantly overweight", "obese", "obesity", "very overweight"]),
    "E_10": ("taking NSAIDs", r"\b(?:nsaids?|anti[\s-]inflammatory\s+drugs?|ibuprofen|advil|naproxen)\b", ["taking nsaids", "anti-inflammatory drugs", "ibuprofen", "advil", "naproxen"]),
    "E_165": ("family pneumothorax", r"\b(?:family\s+member\s+(?:had\s+a\s+)?pneumothorax|family\s+collapsed\s+lung)\b", ["family pneumothorax", "family member had pneumothorax", "family collapsed lung"]),
    "E_8": ("dialysis", r"\b(?:dialysis|hemodialysis|peritoneal\s+dialysis|undergo(?:ing)?\s+dialysis)\b", ["dialysis", "hemodialysis", "undergoing dialysis", "on dialysis"]),
    "E_25": ("family cluster headaches", r"\b(?:cluster\s+headaches?\s+in\s+family|family\s+member\s+with\s+cluster\s+headache)\b", ["family cluster headaches", "cluster headaches in family"]),
    "E_184": ("vasodilator medication", r"\b(?:vasodilator[s]?|nitroglycerin|nitrates?|hydralazine)\b", ["vasodilator medication", "taking vasodilators", "nitroglycerin", "nitrates"]),
    "E_185": ("head trauma", r"\b(?:head\s+trauma|head\s+injury|concussion|hit\s+(?:my\s+)?head)\b", ["head trauma", "head injury", "concussion", "hit head"]),
    "E_99": ("migraine or family migraine", r"\b(?:migraine[s]?|history\s+of\s+migraines?|family\s+has\s+migraines?)\b", ["migraine", "migraines", "family has migraines", "history of migraines"]),
    "E_107": ("stroke", r"\b(?:stroke|transient\s+ischemic\s+attack|tia|cva)\b", ["stroke", "had a stroke", "transient ischemic attack", "tia"]),
    "E_226": ("atopy or common allergies", r"\b(?:prone\s+to\s+allergies|atopic|atopy|more\s+likely\s+to\s+develop\s+allergies)\b", ["atopy", "common allergies", "prone to allergies", "atopic"]),
    "E_62": ("stimulant drugs", r"\b(?:stimulant\s+drugs?|amphetamines?|cocaine|stimulants)\b", ["stimulant drugs", "taking stimulants", "amphetamines", "cocaine"]),
    "E_49": ("daycare worker or attendee", r"\b(?:work\s+in\s+a\s+daycare|attend\s+a\s+daycare|childcare\s+worker)\b", ["daycare worker", "attend daycare", "childcare worker"]),
    "E_95": ("Parkinson's disease", r"\b(?:parkinson['’]?s(?:\s+disease)?)\b", ["parkinson's", "parkinson's disease", "parkinsons"]),
    "E_204": ("travel out of country", r"\b(?:traveled\s+out\s+of\s+the\s+country|international\s+travel|traveled\s+abroad)\b", ["travel out of country", "traveled abroad", "international travel"]),
    "E_153": ("osteoporosis treatment", r"\b(?:treated\s+for\s+osteoporosis|osteoporosis\s+treatment|osteoporotic)\b", ["osteoporosis treatment", "treated for osteoporosis"]),
    "E_124": ("asthma or bronchodilator", r"\b(?:asthma|asthmatic|use(?:d)?\s+(?:an\s+)?inhaler|bronchodilator|albuterol|salbutamol)\b", ["asthma", "asthmatic", "use inhaler", "bronchodilator"]),
    "E_98": ("hiatal hernia", r"\b(?:hiatal\s+hernia|hiatus\s+hernia)\b", ["hiatal hernia", "hiatus hernia"]),
    "E_116": ("cold in last 2 weeks", r"\b(?:had\s+a\s+cold\s+in\s+(?:the\s+last\s+)?2\s+weeks|recent\s+cold)\b", ["cold in last 2 weeks", "had a cold recently", "recent cold"]),
    "E_48": ("live with 4+ people", r"\b(?:live\s+with\s+4\s+or\s+more\s+people|household\s+of\s+4\s+or\s+more|crowded\s+house)\b", ["live with 4 or more people", "household of 4 or more"]),
    "E_2": ("HIV infection", r"\b(?:hiv\s+(?:positive|infection)|human\s+immunodeficiency\s+virus)\b", ["hiv", "hiv positive", "hiv infection", "human immunodeficiency virus"]),
    "E_227": ("immunosuppressed", r"\b(?:immunosuppressed|immunocompromised|weakened\s+immune\s+system)\b", ["immunosuppressed", "immunocompromised", "weakened immune system"]),
    "E_61": ("IV drug use", r"\b(?:intravenous\s+drugs?|iv\s+drug\s+use|injecting\s+drugs)\b", ["iv drug use", "intravenous drugs", "injecting drugs"]),
    "E_47": ("Crohn's disease or ulcerative colitis", r"\b(?:crohn['’]?s|ulcerative\s+colitis|inflammatory\s+bowel\s+disease|ibd)\b", ["crohn's", "ulcerative colitis", "ibd", "inflammatory bowel disease"]),
    "E_27": ("sexually transmitted infection", r"\b(?:sexually\s+transmitted\s+infection|sti|std)\b", ["sexually transmitted infection", "sti", "std"]),
    "E_143": ("regular exercise 4+ times a week", r"\b(?:exercise\s+regularly|workout\s+4\s+times\s+a\s+week|regular\s+physical\s+exercise)\b", ["regular exercise", "exercise regularly", "workout 4 times a week"]),
    "E_191": ("former smoker", r"\b(?:former\s+smoker|used\s+to\s+smoke|quit\s+smoking)\b", ["former smoker", "used to smoke", "quit smoking"]),
    "E_208": ("underweight / BMI < 18.5", r"\b(?:underweight|bmi\s+less\s+than\s+18\.5|very\s+thin)\b", ["underweight", "bmi less than 18.5", "very thin"]),
    "E_126": ("liver cirrhosis", r"\b(?:cirrhosis|liver\s+cirrhosis|end[\s-]stage\s+liver\s+disease)\b", ["cirrhosis", "liver cirrhosis", "liver disease"]),
    "E_189": ("sex with HIV-positive partner", r"\b(?:sex\s+with\s+an\s+hiv[\s-]positive\s+partner|partner\s+has\s+hiv)\b", ["sex with hiv positive partner", "partner has hiv"]),
    "E_7": ("poor diet", r"\b(?:poor\s+diet|junk\s+food\s+diet|malnourished|eating\s+poorly)\b", ["poor diet", "eating poorly", "malnourished"]),
    "E_24": ("anemia diagnosis", r"\b(?:diagnosed\s+with\s+anemia|anemic|iron\s+deficiency\s+anemia)\b", ["anemia", "anemic", "iron deficiency anemia"]),
    "E_26": ("family anemia", r"\b(?:family\s+member[s]?\s+(?:have\s+)?anemia|anemia\s+runs\s+in\s+(?:the\s+)?family)\b", ["family anemia", "anemia in family"]),
    "E_113": ("chronic kidney failure", r"\b(?:chronic\s+kidney\s+(?:failure|disease)|ckd|renal\s+failure)\b", ["chronic kidney failure", "ckd", "renal failure", "kidney disease"]),
    "E_160": ("premature birth", r"\b(?:born\s+prematurely|preterm\s+birth|premature\s+baby)\b", ["premature birth", "born prematurely", "preterm baby"]),
    "E_28": ("family myasthenia gravis", r"\b(?:family\s+diagnosed\s+myasthenia\s+gravis|myasthenia\s+gravis\s+in\s+family)\b", ["family myasthenia gravis", "myasthenia gravis in family"]),
    "E_20": ("rheumatoid arthritis", r"\b(?:rheumatoid\s+arthritis|ra)\b", ["rheumatoid arthritis", "ra"]),
    "E_80": ("depression diagnosis", r"\b(?:diagnosed\s+with\s+depression|clinical\s+depression|depressed)\b", ["depression", "diagnosed with depression", "clinical depression"]),
    "E_40": ("pertussis contact", r"\b(?:contact\s+with\s+(?:someone\s+with\s+)?(?:pertussis|whooping\s+cough))\b", ["pertussis contact", "contact with whooping cough"]),
    "E_0": ("recent viral infection", r"\b(?:recent\s+viral\s+infection|had\s+a\s+virus\s+recently|viral\s+illness)\b", ["recent viral infection", "had a virus recently", "viral illness"]),
    "E_1": ("antibiotic for ear infection", r"\b(?:antibiotic[s]?\s+for\s+(?:an\s+)?ear\s+infection|taking\s+antibiotic[s]?\s+for\s+ear)\b", ["antibiotic for ear infection", "ear infection antibiotic"]),
    "E_34": ("active cancer", r"\b(?:active\s+cancer|chemotherapy|cancer\s+treatment|malignancy)\b", ["active cancer", "chemotherapy", "cancer treatment"]),
    "E_209": ("vaccinations up to date", r"\b(?:vaccinations?\s+(?:are\s+)?up\s+to\s+date|fully\s+vaccinated|immunizations?\s+current)\b", ["vaccinations up to date", "fully vaccinated", "up to date vaccines"]),
    "E_139": ("heart defect", r"\b(?:heart\s+defect|congenital\s+heart\s+disease|hole\s+in\s+(?:the\s+)?heart)\b", ["heart defect", "congenital heart disease", "hole in heart"]),
    "E_19": ("hyperthyroidism", r"\b(?:hyperthyroid(?:ism)?|overactive\s+thyroid|graves['’]?\s+disease)\b", ["hyperthyroidism", "overactive thyroid", "graves disease"]),
    "E_31": ("severe COPD", r"\b(?:severe\s+copd|chronic\s+obstructive\s+pulmonary\s+disease|emphysema)\b", ["severe copd", "emphysema", "chronic bronchitis"]),
    "E_22": ("heart valve issue", r"\b(?:heart\s+valve\s+(?:problem|disease|issue)|mitral\s+valve|aortic\s+valve)\b", ["heart valve issue", "heart valve disease", "valve problem"]),
    "E_60": ("energy drinks", r"\b(?:energy\s+drinks?|red\s+bull|monster\s+energy)\b", ["energy drinks", "regular energy drinks", "red bull"]),
    "E_35": ("coffee or tea", r"\b(?:regularly\s+drink\s+coffee|drink\s+tea\s+daily|coffee\s+or\s+tea)\b", ["coffee or tea", "regular coffee drinker", "drink tea regularly"]),
    "E_213": ("decongestants or stimulants", r"\b(?:taken\s+decongestants?|pseudoephedrine|nasal\s+decongestant\s+meds)\b", ["decongestants", "taking decongestants", "pseudoephedrine"]),
    "E_12": ("severe food allergy", r"\b(?:severe\s+food\s+allergy|anaphylaxis\s+to\s+food|peanut\s+allergy|shellfish\s+allergy)\b", ["severe food allergy", "food anaphylaxis", "peanut allergy"]),
    "E_44": ("corticosteroids", r"\b(?:corticosteroids?|prednisone|steroid\s+medication|dexamethasone)\b", ["corticosteroids", "prednisone", "steroid medication"]),
    "E_4": ("croup history or family", r"\b(?:croup|laryngotracheobronchitis)\b", ["croup", "croup history", "family croup"]),
    "E_81": ("chronic anxiety", r"\b(?:chronic\s+anxiety|generalized\s+anxiety\s+disorder|gad)\b", ["chronic anxiety", "generalized anxiety disorder", "gad"]),
    "E_109": ("deep vein thrombosis / DVT", r"\b(?:deep\s+vein\s+thrombosis|dvt|blood\s+clot\s+in\s+leg)\b", ["deep vein thrombosis", "dvt", "blood clot in leg"]),
    "E_110": ("bedridden / immobile > 3 days", r"\b(?:unable\s+to\s+move\s+or\s+get\s+up\s+for\s+more\s+than\s+3\s+days|bedridden\s+for\s+days|immobile\s+in\s+bed)\b", ["bedridden for more than 3 days", "immobile in bed", "unable to get up for 3 days"]),
    "E_17": ("Asian descent", r"\b(?:asian\s+descent|of\s+asian\s+origin|asian\s+heritage)\b", ["asian descent", "asian origin", "asian heritage"]),
    "E_18": ("cystic fibrosis", r"\b(?:cystic\s+fibrosis|cf)\b", ["cystic fibrosis", "cf"]),
    "E_207": ("live in big city", r"\b(?:live\s+in\s+(?:a\s+)?big\s+city|urban\s+resident|metro\s+city)\b", ["live in big city", "urban resident", "big city resident"]),
    "E_86": ("family allergies / eczema / hay fever", r"\b(?:family\s+(?:history\s+of\s+)?(?:allergies|eczema|hay\s+fever))\b", ["family allergies", "family eczema", "family hay fever"]),
    "E_141": ("menarche < 12", r"\b(?:first\s+menstrual\s+period\s+before\s+(?:age\s+)?12|early\s+menarche)\b", ["menarche before 12", "first period before 12", "early menarche"]),
    "E_11": ("breastfed child > 9 months", r"\b(?:breastfed\s+(?:child\s+)?for\s+more\s+than\s+9\s+months|nursed\s+baby\s+over\s+9\s+months)\b", ["breastfed more than 9 months", "nursed baby over 9 months"]),
    "E_186": ("obstructive sleep apnea", r"\b(?:diagnosed\s+with\s+(?:osa|obstructive\s+sleep\s+apnea)|cpap\s+machine)\b", ["obstructive sleep apnea", "osa", "cpap machine"]),
    "E_106": ("heart failure", r"\b(?:heart\s+failure|congestive\s+heart\s+failure|chf)\b", ["heart failure", "congestive heart failure", "chf"]),
    "E_158": ("endocrine disease or hormone dysfunction", r"\b(?:endocrine\s+disease|hormone\s+dysfunction|hormonal\s+disorder)\b", ["endocrine disease", "hormone dysfunction", "hormonal disorder"]),
    "E_187": ("ate tuna / dark fish / Swiss cheese before reaction", r"\b(?:ate\s+(?:tuna|dark[\s-]fleshed\s+fish|swiss\s+cheese)\s+before|scombroid)\b", ["ate tuna before reaction", "ate swiss cheese before reaction", "scombroid"]),
    "E_6": ("chronic pancreatitis", r"\b(?:chronic\s+pancreatitis|pancreas\s+inflammation)\b", ["chronic pancreatitis", "pancreatitis"]),
    "E_125": ("gastroesophageal reflux / GERD", r"\b(?:gerd|gastroesophageal\s+reflux|acid\s+reflux\s+disease)\b", ["gerd", "gastroesophageal reflux", "acid reflux disease"]),
    "E_21": ("spontaneous pneumothorax", r"\b(?:spontaneous\s+pneumothorax|collapsed\s+lung\s+in\s+past)\b", ["spontaneous pneumothorax", "collapsed lung in past"]),
    "E_222": ("daily secondhand smoke", r"\b(?:secondhand\s+smoke|exposed\s+to\s+smoke\s+daily|passive\s+smoking)\b", ["secondhand smoke", "daily secondhand smoke", "passive smoking"]),
    "E_15": ("antipsychotic medication in last 7 days", r"\b(?:antipsychotic\s+medication|haloperidol|risperidone|quetiapine|olanzapine)\b", ["antipsychotic medication", "taking antipsychotics", "haloperidol", "risperidone"]),
    "E_147": ("hospital/ER treatment with IV/IM meds", r"\b(?:treated\s+in\s+hospital\s+with\s+(?:iv|intramuscular)\s+meds|hospitalized\s+for\s+agitation\s+or\s+intoxication)\b", ["treated in hospital with iv meds", "hospital treatment iv im meds"]),
    "E_137": ("lymph node removal surgery", r"\b(?:surgery\s+to\s+remove\s+lymph\s+nodes|lymphadenectomy|lymph\s+node\s+dissection)\b", ["surgery to remove lymph nodes", "lymphadenectomy"]),
    "E_149": ("calcium channel blockers", r"\b(?:calcium\s+channel\s+blockers?|amlodipine|diltiazem|verapamil|nifedipine)\b", ["calcium channel blockers", "amlodipine", "diltiazem", "verapamil"]),
    "E_197": ("kidney protein loss / nephrotic", r"\b(?:nephrotic\s+syndrome|protein\s+in\s+urine|inability\s+to\s+retain\s+proteins)\b", ["nephrotic syndrome", "protein in urine", "kidney protein loss"]),
    "E_3": ("pericarditis", r"\b(?:pericarditis|inflammation\s+around\s+the\s+heart)\b", ["pericarditis", "heart inflammation"]),
    "E_29": ("family psychiatric illness", r"\b(?:psychiatric\s+illness\s+in\s+family|mental\s+illness\s+in\s+(?:immediate\s+)?family)\b", ["family psychiatric illness", "mental illness in family"]),
    "E_225": ("family early cardiovascular disease < 50", r"\b(?:family\s+history\s+of\s+heart\s+disease\s+before\s+50|early\s+cardiovascular\s+disease\s+in\s+family)\b", ["family heart disease before 50", "early cardiovascular disease in family"]),
    "E_73": ("Ebola virus contact", r"\b(?:ebola\s+(?:virus|contact)|contact\s+with\s+anyone\s+infected\s+with\s+ebola)\b", ["ebola contact", "ebola virus contact"]),
    "E_138": ("fibromyalgia", r"\b(?:fibromyalgia)\b", ["fibromyalgia"]),
    "E_101": ("asthma hospitalization past year", r"\b(?:hospitalized\s+for\s+asthma\s+in\s+(?:the\s+)?past\s+year|admitted\s+for\s+asthma\s+attack)\b", ["hospitalized for asthma past year", "admitted for asthma"]),
    "E_46": ("2+ asthma attacks past year", r"\b(?:2\s+or\s+more\s+asthma\s+attacks|multiple\s+asthma\s+attacks\s+this\s+year)\b", ["2 or more asthma attacks", "multiple asthma attacks past year"]),
    "E_119": ("chronic sinusitis", r"\b(?:chronic\s+sinusitis|chronic\s+sinus\s+infection)\b", ["chronic sinusitis", "chronic sinus infection"]),
    "E_72": ("COPD flare-ups in past year", r"\b(?:copd\s+flare[\s-]ups?|copd\s+exacerbations?\s+in\s+(?:the\s+)?past\s+year)\b", ["copd flare-ups in past year", "copd exacerbations"]),
    "E_198": ("agriculture worker", r"\b(?:work\s+in\s+agriculture|farmer|farm\s+worker|agricultural\s+work)\b", ["agriculture worker", "farmer", "farm worker"]),
    "E_200": ("mining worker", r"\b(?:work\s+in\s+(?:the\s+)?mining\s+sector|miner|quarry\s+worker)\b", ["mining worker", "work in mining", "miner"]),
    "E_199": ("construction worker", r"\b(?:work\s+in\s+construction|construction\s+worker|building\s+site\s+worker)\b", ["construction worker", "work in construction", "builder"]),
    "E_121": ("deviated nasal septum", r"\b(?:deviated\s+(?:nasal\s+)?septum|septum\s+is\s+deviated)\b", ["deviated nasal septum", "deviated septum"]),
    "E_120": ("nasal polyps", r"\b(?:nasal\s+polyps?|polyps?\s+in\s+nose)\b", ["nasal polyps", "polyps in nose"]),
    "E_142": ("mother has asthma", r"\b(?:mother\s+has\s+asthma|mom\s+has\s+asthma|maternal\s+asthma)\b", ["mother has asthma", "mom has asthma", "maternal asthma"]),
    "E_195": ("live in suburbs", r"\b(?:live\s+in\s+(?:the\s+)?suburbs|suburban\s+area)\b", ["live in suburbs", "suburban resident"]),
    "E_183": ("live in rural area", r"\b(?:live\s+in\s+(?:a\s+)?rural\s+area|countryside|village\s+resident)\b", ["live in rural area", "rural resident", "countryside"]),
    "E_224": ("family lung cancer", r"\b(?:family\s+(?:member\s+with\s+)?lung\s+cancer|parent\s+had\s+lung\s+cancer)\b", ["family lung cancer", "lung cancer in family"]),
    "E_223": ("family pancreatic cancer", r"\b(?:family\s+member\s+with\s+pancreatic\s+cancer|pancreatic\s+cancer\s+in\s+family)\b", ["family pancreatic cancer", "pancreatic cancer in family"]),
    "E_5": ("fluid in lungs", r"\b(?:fluid\s+in\s+(?:my\s+)?lungs?|pulmonary\s+edema|pleural\s+effusion)\b", ["fluid in lungs", "pulmonary edema", "pleural effusion"]),
}

# Combine and verify all 218 active items
all_anchors = {}
all_aliases = dict(existing_aliases)

for eid, (label, pattern) in existing_base_anchors.items():
    all_anchors[eid] = (label, pattern)

for eid, (label, pattern, aliases) in new_anchors.items():
    if eid in quarantined_ids:
        continue
    all_anchors[eid] = (label, pattern)
    if eid not in all_aliases:
        all_aliases[eid] = aliases
    else:
        all_aliases[eid] = list(dict.fromkeys(all_aliases[eid] + aliases))

# Verify coverage
missing_active = [eid for eid in items if eid not in quarantined_ids and eid not in all_anchors]
print(f"Total mapped anchors: {len(all_anchors)}")
print(f"Missing active items: {len(missing_active)}: {missing_active}")

# Generate TypeScript code
ts_lines = [
    "/** Explicit English equivalences for fictional ingress; no disease or clinical rules.",
    " * Complete coverage for all 218 active DDXPlus evidence definitions.",
    " * Quarantined fields (E_69, E_37, E_118, E_123, E_87) are preserved as excluded.",
    " */",
    "const baseAnchors: Record<string, { label: string; pattern: RegExp }> = {",
]

for eid, (label, pattern) in sorted(all_anchors.items(), key=lambda x: int(x[0][2:])):
    ts_lines.append(f"  {eid}: {{ label: {json.dumps(label)}, pattern: /{pattern}/i }},")

ts_lines.append("};")
ts_lines.append("")
ts_lines.append("const aliases: Record<string, string[]> = {")

for eid, syns in sorted(all_aliases.items(), key=lambda x: int(x[0][2:])):
    ts_lines.append(f"  {json.dumps(eid)}: {json.dumps(syns, ensure_ascii=False)},")

ts_lines.append("};")
ts_lines.append("")
ts_lines.append("export const tokenize = (text:string) => [...text.matchAll(/[\\p{L}\\p{M}]+(?:['’][\\p{L}\\p{M}]+)?|[0-9]+(?:\\.[0-9]+)?/gu)].map(m=>({text:m[0].toLowerCase().replaceAll('’',\"'\"),start:m.index!,end:m.index!+m[0].length}));")
ts_lines.append("export function labelIsSupported(quote:string,label:string) {")
ts_lines.append("  const normalize=(s:string)=>tokenize(s).map(t=>t.text).join(' ');")
ts_lines.append("  const n=' '+normalize(quote)+' ', side=label.match(/^(.*)\\(([RL])\\)$/);")
ts_lines.append("  return [label,...(side?[`${side[2]==='R'?'right':'left'} ${side[1].trim()}`]:[])].some(s=>n.includes(' '+normalize(s)+' '));")
ts_lines.append("}")
ts_lines.append("const escape = (text:string) => text.replace(/[.*+?^${}()|[\\]\\\\]/g,'\\\\$&');")
ts_lines.append("// Bounded lexical/grammar variants. Match original source directly: normalization")
ts_lines.append("// must never replace user text, move offsets or discard polarity/context words.")
ts_lines.append("const wording: Record<string,RegExp> = {")

for eid, wpat in sorted(existing_wording.items()):
    ts_lines.append(f"  {eid}: /{wpat}/i,")

ts_lines.append("};")
ts_lines.append("")
ts_lines.append("export const languageConcepts = Object.entries(baseAnchors).map(([evidence_id, definition]) => {")
ts_lines.append("  const synonyms = [definition.label, ...(aliases[evidence_id] ?? [])];")
ts_lines.append("  const bound = (s: string) => /[^\\x00-\\x7F]/.test(s)")
ts_lines.append("    ? '(?<=^|[^\\\\p{L}\\\\p{N}])' + escape(s).replaceAll(' ', '\\\\s+') + '(?=$|[^\\\\p{L}\\\\p{N}])'")
ts_lines.append("    : '\\\\b' + escape(s).replaceAll(' ', '\\\\s+') + '\\\\b';")
ts_lines.append("  const pattern = new RegExp('(?:'+definition.pattern.source+'|'+synonyms.map(bound).join('|')+(wording[evidence_id]?'|'+wording[evidence_id].source:'')+')','iu');")
ts_lines.append("  return {concept_id:'concept.'+evidence_id,evidence_id,canonical:definition.label,synonyms,pattern,")
ts_lines.append("    qualifier_policy:'Match complete supported meaning; ambiguous qualifiers remain context.',confirmation_required:true as const};")
ts_lines.append("});")
ts_lines.append("export const anchors = Object.fromEntries(languageConcepts.map(c=>[c.evidence_id,{label:c.canonical,pattern:c.pattern}]));")
ts_lines.append("export const ambiguousConcepts = [")
ts_lines.append("  {concept:'nasal_discharge_unspecified',expressions:['runny nose','nasal discharge'],candidate_fields:['E_181','E_182'],reason:'Color/congestion qualifier unspecified.'},")
ts_lines.append("  {concept:'feeling_sick_unspecified',expressions:['feeling sick','feel sick'],candidate_fields:['E_148'],reason:'General illness versus nausea is ambiguous.'},")
ts_lines.append("  {concept:'breathing_difficulty_unspecified',expressions:['shortness of breath','difficulty breathing'],candidate_fields:['E_66'],reason:'Significant qualifier unspecified; safety remains independent.'},")
ts_lines.append("  {concept:'reported_lump',expressions:['lump','tumor','cancer'],candidate_fields:[],reason:'No matching symptom field or confirmed diagnosis is inferred.'}")
ts_lines.append("];")
ts_lines.append("")

out_file = Path("src/features/medassist-conversation/concepts.ts")
out_file.write_text("\n".join(ts_lines), encoding="utf-8")
print(f"Generated {out_file} with {len(all_anchors)} base anchors.")
