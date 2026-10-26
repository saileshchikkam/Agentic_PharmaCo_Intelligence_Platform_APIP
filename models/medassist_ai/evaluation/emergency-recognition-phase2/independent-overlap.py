import json,pathlib,hashlib,re,unicodedata,datetime
b=pathlib.Path('models/medassist_ai/evaluation/emergency-recognition-phase2')
gold=json.loads((b/'heldout-gold.json').read_text(encoding='utf-8'))['cases']
def norm(s):return ' '.join(re.sub(r'[^\w\s]',' ',unicodedata.normalize('NFKC',s).casefold()).split())
def load(p):
 d=json.loads(p.read_text(encoding='utf-8-sig'));cases=d.get('cases',d.get('items',[])) if isinstance(d,dict) else d
 if not cases: raise ValueError('No overlap comparison cases found')
 return [c for c in cases if isinstance(c,dict) and isinstance(c.get('text'),str)]
report={'performed_after_implementation_and_gold_freeze':True,'performed_after_final_matcher_run':True,'method':'Exact UTF-8 text equality and NFKC casefold/punctuation-to-space/whitespace collapse equality. No prior-set execution or tuning.','datasets':{}}
for name,p in [('original100',pathlib.Path('models/medassist_ai/evaluation/emergency-recognition-v2/heldout.json')),('development',b/'development.json')]:
 other=load(p);pairs=[]
 for c in gold:
  for o in other:
   if c['text']==o['text'] or norm(c['text'])==norm(o['text']):pairs.append({'gold_id':c['id'],'comparison_id':o.get('id'),'exact':c['text']==o['text'],'normalized':norm(c['text'])==norm(o['text']),'text':c['text']})
 report['datasets'][name]={'sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'comparison_count':len(other),'heldout_count':len(gold),'exact_overlap_count':sum(x['exact'] for x in pairs),'normalized_overlap_count':len(pairs),'pairs':pairs}
p=b/'independent-overlap.json'
with p.open('x',encoding='utf-8') as f:f.write(json.dumps(report,indent=2)+'\n')
print(json.dumps(report))
