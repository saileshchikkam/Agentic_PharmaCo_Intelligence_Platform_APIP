"""Fictional PDF mapping and appearance verification; no inference or real records."""
import sys,io,json,copy,unittest,importlib.util
from pathlib import Path
spec=importlib.util.spec_from_file_location('form',Path(__file__).resolve().parents[1]/'server/adr/pdf_form.py');form=importlib.util.module_from_spec(spec);spec.loader.exec_module(form)
from pypdf import PdfReader, PdfWriter
import pypdfium2 as pdfium
ROOT=Path(__file__).resolve().parents[1]
def fixture(extra=False):
 c={'id':'fictional-pdf-verification','revision':12,'fictionalOnly':True,'values':{},'medications':[]}
 def put(k,v):c['values'][k]={'state':'provided' if v is not None else 'unknown','value':v,'confirmedAt':'2026-11-03T00:00:00Z','source':'manual','statementId':'fixture'}
 for k,v in dict(caseType='Initial',initials='FX',age='32',dob='1994-01-02',gender='Female',weight='60',registration='DO NOT FILL AMC',reaction='Fictional itching',reactionStart='2026-10-29',reactionStop='2026-10-30',management='Fictional observation only.',history='Fictional history.',investigations='Fictional result, 30/10/2026.',seriousness='Hospitalization / prolonged hospitalization',outcome='Recovering',reporterName='Fictional Reporter',address='Example address',pin='000000',email='fictional@example.test',phone='0000000000',occupation='Fictional reviewer',reportDate='2026-11-03',additional='Fictional software verification.',signature='Will sign after printing').items():put(k,v)
 for kind,count in [('suspect',4+extra),('concomitant',3+extra)]:
  for i in range(count):
   mid=f'{kind}{i}';c['medications'].append({'id':mid,'kind':kind})
   for key,v in dict(name=f'Test{i+1}',manufacturer='Example',batch=f'B{i+1}',expiry='2027-01-01',dose='5 mg',route='Oral',frequency='Daily',start='2026-10-28',stop='2026-10-30',indication='Fixture',action='Drug withdrawn',rechallenge='No').items():
    if kind=='suspect' or key in form.CON_KEYS:put('med.'+mid+'.'+key,v)
 return c

class PdfTests(unittest.TestCase):
 def test_inventory(self):
  inv=form.inventory();self.assertEqual(len(inv),147);self.assertEqual(sum(x['type']=='/Tx' for x in inv),127);self.assertEqual(sum(x['name'].startswith('Check Box') for x in inv),19);self.assertTrue(all(x['page']==1 for x in inv));self.assertEqual(len(form.TEXT),127)
 def test_full_mapping_and_appearances(self):
  c=fixture();data=form.generate(c);r=PdfReader(io.BytesIO(data));f=r.get_fields();self.assertEqual(len(f),147)
  self.assertEqual(data,form.generate(c),'Same confirmed snapshot must produce identical bytes')
  for key,value in {'Text Field0':'FX','Text Field126':'60','Text Field5':'29/10/2026','Check Box16':'/Yes','Check Box17':'/Yes','Check Box3':'/Yes','Check Box6':'/Yes','Check Box12':'/Yes'}.items():self.assertEqual(str(f[key]['/V']),value)
  for n in [2,3,4,20,91,92,93,44,47,48]:self.assertEqual(f['Text Field'+str(n)].get('/V',''),'')
  for row,columns in enumerate(form.SUSPECT):self.assertEqual(f['Text Field'+str(columns[0])]['/V'],f'Test{row+1}')
  for row,columns in enumerate(form.CONCOM):self.assertEqual(f['Text Field'+str(columns[0])]['/V'],f'Test{row+1}')
  for row,columns in enumerate(form.SUSPECT):
   for key,n in zip(form.MED_KEYS,columns):
    if key=='causality':continue
    value=c['values'][f'med.suspect{row}.{key}']['value']
    if key in ['expiry','start','stop']:value='/'.join(reversed(value.split('-')))
    self.assertEqual(f['Text Field'+str(n)]['/V'],value)
  for row,columns in enumerate(form.CONCOM):
   for key,n in zip(form.CON_KEYS,columns):
    value=c['values'][f'med.concomitant{row}.{key}']['value']
    if key in ['start','stop']:value='/'.join(reversed(value.split('-')))
    self.assertEqual(f['Text Field'+str(n)]['/V'],value)
  for row in form.ACTION:self.assertEqual(f['Text Field'+str(row[0])]['/V'],'X');self.assertEqual(f['Text Field'+str(row[7])]['/V'],'X')
  appearances=[]
  for ref in r.pages[0]['/Annots']:
   a=ref.get_object();name=a['/T']
   if name=='Image Field0':continue
   self.assertEqual(str(a.get('/V','')),str(f[name].get('/V','')))
   ap=a['/AP']['/N']
   if name.startswith('Check Box'):self.assertEqual(a['/AS'],a['/V']);self.assertIn(a['/AS'],ap)
   else:
    self.assertTrue(ap.get_data());appearances.append(ap.indirect_reference.idnum)
  self.assertEqual(len(set(appearances)),127,'Each text widget must own its appearance stream')
  self.assertFalse(any(int(v.get('/Ff',0))&1 for v in f.values()),'Native widgets remain editable')
  edited=PdfWriter();edited.clone_document_from_reader(r);edited.update_page_form_field_values(None,{'Text Field0':'EDITED'},auto_regenerate=False);buf=io.BytesIO();edited.write(buf);self.assertEqual(PdfReader(buf).get_fields()['Text Field0']['/V'],'EDITED')
  self.assertEqual(r.pages[0].get_contents().get_data(),form.original().pages[0].get_contents().get_data())
  self.assertEqual(r.pages[1].get_contents().get_data(),form.original().pages[1].get_contents().get_data())
  self.assertEqual(len(r.pages),2)
  for n,k in [(39,'reporterName'),(40,'address'),(41,'email'),(42,'pin'),(43,'phone'),(45,'occupation')]:
   self.assertEqual(f['Text Field'+str(n)]['/V'],c['values'][k]['value'])
  out=ROOT/'output/pdf';out.mkdir(parents=True,exist_ok=True);(out/'adr-fictional-verification.pdf').write_bytes(data)
  doc=pdfium.PdfDocument(data);doc.init_forms();source=pdfium.PdfDocument(str(form.TEMPLATE));source.init_forms();self.assertEqual(doc[1].render(scale=1).to_pil().tobytes(),source[1].render(scale=1).to_pil().tobytes())
  render=ROOT/'tmp/pdfs';render.mkdir(parents=True,exist_ok=True)
  for i in range(len(doc)):doc[i].render(scale=1.5,draw_annots=True).to_pil().save(render/f'filled-{i+1}.png')
 def test_checkbox_categories(self):
  blank=fixture();blank['values']={};base=pdfium.PdfDocument(form.generate(blank));base.init_forms();baseline=base[0].render(scale=3,draw_annots=True).to_pil()
  checked=set()
  for key,choices in [('caseType',{'Initial':16,'Follow-up':1}),('gender',{'Male':0,'Female':17,'Other':18}),('seriousness',{'None reported':2,**{v:k for k,v in form.CHECK.items() if 4<=k<=9}}),('outcome',{'Recovered':10,'Fatal':11,'Recovering':12,'Recovered with sequelae':13,'Not recovered':14,None:15})]:
   for value,n in choices.items():
    c=fixture();c['values'][key].update(value=value,state='provided' if value is not None else 'unknown');data=form.generate(c);r=PdfReader(io.BytesIO(data));a=next(x.get_object() for x in r.pages[0]['/Annots'] if x.get_object()['/T']=='Check Box'+str(n));self.assertEqual(a['/AS'],'/Yes');self.assertTrue(a['/AP']['/N']['/Yes'].get_data())
    doc=pdfium.PdfDocument(data);doc.init_forms();rendered=doc[0].render(scale=3,draw_annots=True).to_pil()
    for ref in r.pages[0]['/Annots']:
     a=ref.get_object()
     if a['/T'].startswith('Check Box') and a['/AS']=='/Yes':
      x0,y0,x1,y1=map(float,a['/Rect']);box=(round(x0*3),round((841.92-y1)*3),round(x1*3),round((841.92-y0)*3))
      self.assertNotEqual(rendered.crop(box).tobytes(),baseline.crop(box).tobytes(),'Selected checkbox must visibly differ from Off');checked.add(a['/T'])
  self.assertEqual(len(checked),19)
 def test_overflow_unknown_and_regeneration(self):
  c=fixture(extra=True);text='Full fictional reaction detail. '*120;c['values']['reaction']['value']=text;c['values']['outcome'].update(state='unknown',value=None)
  first=form.generate(c);r=PdfReader(io.BytesIO(first));on_form=r.get_fields()['Text Field8']['/V'];self.assertRegex(on_form,r'\nA\d+$');self.assertEqual(r.get_fields()['Check Box15']['/V'],'/Yes')
  full=''.join(line for p in r.pages[2:] for line in p.extract_text().splitlines() if not line.startswith(('APIP fictional continuation /','PDF page '))).replace(' ','')
  prefix=on_form.rsplit('\n',1)[0].replace(' ','').replace('\n','')
  self.assertTrue(prefix)
  narrative=full.split('Reactiondescriptionandmanagement(continued)',1)[1].split('Management:',1)[0]
  self.assertEqual((prefix+narrative).count('Fullfictionalreactiondetail.'),120)
  self.assertIn('Suspectedmedicine5',full)
  self.assertIn('Concomitantmedicine4',full)
  self.assertNotIn('Unknown/notavailable',full)
  self.assertNotIn('FictionalReporter',full)
  (ROOT/'output/pdf/adr-fictional-overflow.pdf').write_bytes(first)
  doc=pdfium.PdfDocument(first);doc.init_forms()
  for i in range(len(doc)):doc[i].render(scale=1,draw_annots=True).to_pil().save(ROOT/f'tmp/pdfs/overflow-{i+1}.png')
  c['revision']+=1;c['values']['initials']['value']='ZZ';self.assertEqual(PdfReader(io.BytesIO(form.generate(c))).get_fields()['Text Field0']['/V'],'ZZ')
  c['values']['reaction']['value']='దురద'
  with self.assertRaisesRegex(ValueError,'PDF_UNSUPPORTED_SCRIPT'):form.generate(c)
  c=fixture();c['values']['seriousness']['value']='Death; Disability'
  with self.assertRaisesRegex(ValueError,'PDF_SELECT_ONE_SERIOUSNESS'):form.generate(c)
  c=fixture();c['values']['reaction']['confirmedAt']='';c['values']['management']['confirmedAt']='';self.assertEqual(PdfReader(io.BytesIO(form.generate(c))).get_fields()['Text Field8']['/V'],'')
  c['values']['outcome'].update(state='unknown',value=None,confirmedAt='');self.assertEqual(PdfReader(io.BytesIO(form.generate(c))).get_fields()['Check Box15']['/V'],'/Off')

if __name__=='__main__':unittest.main()
