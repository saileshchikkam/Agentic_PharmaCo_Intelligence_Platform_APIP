"""Native PvPI v1.4 filling. Input/output via pipes; no report files or model calls."""
import io, json, sys, hashlib, re
from pathlib import Path
from pypdf import PdfReader, PdfWriter
from pypdf.generic import NameObject, TextStringObject, DictionaryObject, DecodedStreamObject, RectangleObject, NumberObject
from reportlab.pdfbase.pdfmetrics import stringWidth
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet
from xml.sax.saxutils import escape

TEMPLATE = Path(__file__).resolve().parents[2] / 'docs/adr/templates/ADRRF_2.pdf'
SHA = '40af4962d6dd65ce538ff4791805b0632085159623c5a4beeb755442f6c0ed0b'
TEXT = {0:'Patient initials',1:'Age or date of birth',2:'AMC report number (reserved)',3:'Registration number (AMC/NCC reserved)',4:'Worldwide unique number (reserved)',5:'Reaction start date',6:'Reaction stop date',7:'Relevant investigations',8:'Reaction description and management',9:'Relevant history',38:'Additional information',39:'Reporter name',40:'Reporter address',41:'Reporter email',42:'Reporter PIN',43:'Reporter contact',44:'Reporter signature (reserved)',45:'Reporter occupation',46:'Report date',47:'Receiving personnel (reserved)',48:'Date of death (not collected)',126:'Weight (kg)'}
SUSPECT = [[10,11,12,13,14,15,16,17,18,19,20],[49,52,55,58,61,67,70,64,88,85,91],[50,53,56,59,62,68,71,65,89,86,92],[51,54,57,60,63,69,72,66,90,87,93]]
MED_KEYS=['name','manufacturer','batch','expiry','dose','route','frequency','start','stop','indication','causality']
ACTION=[[21,22,23,24,25,26,27,28,29,30],[94,97,100,103,106,109,74,73,79,82],[95,98,101,104,107,110,75,77,80,83],[96,99,102,105,108,111,76,78,81,84]]
ACTION_LABELS=['Drug withdrawn','Dose increased','Dose reduced','Dose not changed','Not applicable','Unknown','Yes','No','Effect unknown','Reintroduced dose']
CONCOM=[[31,32,33,34,35,36,37],[112,114,116,118,120,122,124],[113,115,117,119,121,123,125]]
CON_KEYS=['name','dose','route','frequency','start','stop','indication']
CHECK={0:'Gender Male',17:'Gender Female',18:'Gender Other',16:'Initial case',1:'Follow-up case',2:'Seriousness No',3:'Seriousness Yes',4:'Death',5:'Life threatening',6:'Hospitalization / prolonged hospitalization',7:'Congenital anomaly',8:'Disability',9:'Other medically important condition',10:'Recovered',11:'Fatal',12:'Recovering',13:'Recovered with sequelae',14:'Not recovered',15:'Outcome unknown'}
for row,cols in enumerate(SUSPECT):
    TEXT.update({n:f'Suspected medicine {row+1}: {key}' for n,key in zip(cols,MED_KEYS)})
for row,cols in enumerate(ACTION):
    TEXT.update({n:f'Suspected medicine {row+1}: {key}' for n,key in zip(cols,ACTION_LABELS)})
for row,cols in enumerate(CONCOM):
    TEXT.update({n:f'Concomitant medicine {row+1}: {key}' for n,key in zip(cols,CON_KEYS)})

def original():
    data=TEMPLATE.read_bytes()
    if hashlib.sha256(data).hexdigest()!=SHA: raise ValueError('TEMPLATE_CHANGED')
    return PdfReader(io.BytesIO(data))

def inventory():
    r=original()
    result=[]
    for page,p in enumerate(r.pages,1):
        for ref in p.get('/Annots',[]):
            a=ref.get_object()
            if a.get('/Subtype')!='/Widget': continue
            name=str(a['/T']); flags=int(a.get('/Ff',0)); kind=str(a['/FT'])
            label=TEXT[int(name[10:])] if name.startswith('Text Field') else CHECK[int(name[9:])] if name.startswith('Check Box') else 'Receiving signature image button (reserved)'
            source={0:'initials',1:'age + dob',5:'reactionStart',6:'reactionStop',7:'investigations',8:'reaction + management',9:'history',38:'additional + continuation notice',39:'reporterName',40:'address',41:'email',42:'pin',43:'phone',45:'occupation',46:'reportDate',126:'weight'}
            for row,cols in enumerate(SUSPECT):source.update({n:f'medications[kind=suspect][{row}].{key}' for n,key in zip(cols,MED_KEYS) if key!='causality'})
            for row,cols in enumerate(ACTION):source.update({n:f'medications[kind=suspect][{row}].'+('action' if j<6 else 'rechallenge')+f' == {ACTION_LABELS[j]}' for j,n in enumerate(cols) if j<9})
            for row,cols in enumerate(CONCOM):source.update({n:f'medications[kind=concomitant][{row}].{key}' for n,key in zip(cols,CON_KEYS)})
            schema=source.get(int(name[10:])) if kind=='/Tx' else ('caseType' if int(name[9:]) in [1,16] else 'gender' if int(name[9:]) in [0,17,18] else 'seriousness' if 2<=int(name[9:])<=9 else 'outcome') if name.startswith('Check Box') else None
            result.append(dict(name=name,type=kind,page=page,bbox=[float(v) for v in a['/Rect']],label=label,schemaPath=schema,disposition='confirmed values only' if schema else 'unfilled: reserved or not collected',multiline=bool(flags&4096),flags=flags,allowedValues=['/Off','/Yes'] if name.startswith('Check Box') else 'text' if kind=='/Tx' else 'pushbutton; retained but hidden in generated output'))
    assert len(result)==147 and len(r.get_fields())==147
    assert {v.idnum for v in r.trailer['/Root']['/AcroForm']['/Fields']}=={v.idnum for v in r.pages[0]['/Annots']}
    return result

def generate(case):
    if case.get('fictionalOnly') is not True: raise ValueError('FICTIONAL_ONLY')
    values=case['values']; mapped={}; annex=[]
    def val(k):
        v=values.get(k,{})
        return v.get('value') if v.get('state')=='provided' and v.get('confirmedAt') else None
    def unknown(k):
        v=values.get(k,{})
        return v.get('state')=='unknown' and bool(v.get('confirmedAt'))
    def date(v):
        return '/'.join(reversed(v.split('-'))) if v and len(v)==10 and v[4]=='-' and v[7]=='-' else v
    def put(n,v):
        if v: mapped['Text Field'+str(n)]=str(v)
    def tick(n): mapped['Check Box'+str(n)]='/Yes'
    def continue_with(label,text):
        ref='A'+str(len(annex)+1)
        annex.append((ref,label,text))
        return ref
    for k,v in values.items():
        if v.get('confirmedAt') and v.get('state')=='provided':
            text=v.get('value')
            # Fail closed rather than produce missing glyphs or incorrect complex-script shaping.
            try: str(text).encode('cp1252')
            except UnicodeEncodeError: raise ValueError('PDF_UNSUPPORTED_SCRIPT')
    put(0,val('initials'));put(1,(val('age')+' years') if val('age') else date(val('dob')));put(126,val('weight'))
    for k,n in [('reactionStart',5),('reactionStop',6),('reportDate',46)]:put(n,date(val(k)))
    for k,n in [('investigations',7),('history',9),('reporterName',39),('address',40),('email',41),('pin',42),('phone',43),('occupation',45)]:put(n,val(k))
    put(8,'\n'.join(x for x in [val('reaction'),('Management: '+val('management')) if val('management') else None] if x))
    if val('caseType')=='Follow-up' and val('followUp'):
        put(38,'Previous report: '+val('followUp'))
    if val('additional'):
        put(38,'\n'.join(filter(None,[mapped.get('Text Field38'),val('additional')])))
    if val('caseType'):tick(16 if val('caseType')=='Initial' else 1)
    if val('gender'):tick({'Male':0,'Female':17,'Other':18}[val('gender')])
    serious=val('seriousness')
    if serious:
        selections=serious.split('; ')
        if len(selections)>1: raise ValueError('PDF_SELECT_ONE_SERIOUSNESS')
        if serious=='None reported':tick(2)
        else:
            tick(3);tick({label:n for n,label in CHECK.items() if 4<=n<=9}[serious])
    if val('outcome'):tick({'Recovered':10,'Fatal':11,'Recovering':12,'Recovered with sequelae':13,'Not recovered':14}[val('outcome')])
    elif unknown('outcome'):tick(15)
    for kind,rows,keys in [('suspect',SUSPECT,MED_KEYS),('concomitant',CONCOM,CON_KEYS)]:
        meds=[m for m in case['medications'] if m['kind']==kind]
        for i,m in enumerate(meds):
            prefix='med.'+m['id']+'.'
            if i>=len(rows):
                details=[]
                for key in [*keys, *(['action','rechallenge'] if kind=='suspect' else [])]:
                    v=val(prefix+key)
                    if v and key!='causality':
                        details.append(f"{key.capitalize()}: {date(v) if key in ['start','stop','expiry'] else v}")
                if details:
                    continue_with(f"{'Suspected' if kind=='suspect' else 'Concomitant'} medicine {i+1}",'\n'.join(details))
                continue
            for key,n in zip(keys,rows[i]):
                if key=='causality':continue
                v=val(prefix+key);put(n,date(v) if key in ['start','stop','expiry'] else v)
            if kind=='suspect':
                action=val(prefix+'action');rechallenge=val(prefix+'rechallenge')
                if action in ACTION_LABELS[:6]:put(ACTION[i][ACTION_LABELS.index(action)],'X')
                elif unknown(prefix+'action'):put(ACTION[i][5],'X')
                elif action:continue_with(f'Suspected medicine {i+1}: action after reaction',action)
                if rechallenge in ['Yes','No','Effect unknown']:put(ACTION[i][ACTION_LABELS.index(rechallenge)],'X')
                elif unknown(prefix+'rechallenge'):put(ACTION[i][8],'X')
                elif rechallenge:continue_with(f'Suspected medicine {i+1}: reaction after restarting',rechallenge)
    r=original();w=PdfWriter();w.clone_document_from_reader(r)
    widgets={a.get_object()['/T']:a.get_object() for a in w.pages[0]['/Annots']}
    fields={name:'/Off' if name.startswith('Check Box') else '' for name in widgets if name!='Image Field0'}
    # Uniform explicit appearances; never rely on a viewer to regenerate them.
    # Original widgets share /AP objects. Detach before updating, or values leak visually.
    checkbox_positions={16:(102.955,737.020),1:(254.925,737.020),0:(85.889,696.430),17:(105.835,696.430),18:(141.115,696.430),2:(451.795,540.620),3:(486.375,540.620),4:(325.025,529.100),7:(451.315,529.100),5:(325.025,519.020),8:(451.555,519.020),6:(325.025,508.700),9:(451.075,508.700),10:(325.025,481.340),12:(382.885,481.340),14:(488.055,481.340),11:(325.025,471.020),13:(383.365,471.020),15:(487.335,471.020)}
    for name,a in widgets.items():
        if a.get('/FT')=='/Tx':
            a.pop(NameObject('/AP'),None)
            a[NameObject('/DA')]=TextStringObject('/Helv 7 Tf 0 0 0 rg')
        elif name.startswith('Check Box'):
            x,y=checkbox_positions[int(name[9:])];a[NameObject('/Rect')]=RectangleObject([x,y,x+5.726,y+5.813])
            states=DictionaryObject()
            for state,content in [('/Off',b'q Q'),('/Yes',b'q 0 G 0.8 w 1 1 m 4.7 4.8 l 1 4.8 m 4.7 1 l S Q')]:
                stream=DecodedStreamObject();stream.set_data(content);stream.update({NameObject('/Type'):NameObject('/XObject'),NameObject('/Subtype'):NameObject('/Form'),NameObject('/BBox'):RectangleObject([0,0,5.726,5.813]),NameObject('/Resources'):DictionaryObject()});states[NameObject(state)]=w._add_object(stream)
            a[NameObject('/AP')]=DictionaryObject({NameObject('/N'):states})
        elif name=='Image Field0':a[NameObject('/F')]=NumberObject(2) # reserved receiving signature button hidden, never synthesized

    additional=mapped.pop('Text Field38',None)
    def fill_text(name,text,reserve=0):
        a=widgets[name]
        x0,y0,x1,y1=map(float,a['/Rect']);width=x1-x0-4;height=y1-y0-2
        font_size=6 if re.fullmatch(r'\d{2}/\d{2}/\d{4}',text) else 7
        a[NameObject('/DA')]=TextStringObject(f'/Helv {font_size} Tf 0 0 0 rg')
        multi=bool(int(a.get('/Ff',0))&4096);lines=[]
        for para in text.splitlines() or ['']:
            line=''
            for ch in para:
                candidate=line+ch
                if stringWidth(candidate,'Helvetica',font_size)<=width:
                    line=candidate
                    continue
                split=candidate.rfind(' ')
                if split>0:
                    lines.append(candidate[:split])
                    line=candidate[split+1:]
                else:
                    lines.append(line)
                    line=ch
            lines.append(line)
        capacity=max(1,int((height-font_size)/(font_size*1.3))+1-reserve) if multi else 1
        if len(lines)>capacity:
            if multi and capacity>1:
                kept=lines[:capacity-1]
                excess='\n'.join(lines[capacity-1:])
                ref=continue_with(TEXT[int(name[10:])]+ ' (continued)',excess)
                fields[name]='\n'.join([*kept,ref])
            else:
                fields[name]=continue_with(TEXT[int(name[10:])],text)
        else:fields[name]='\n'.join(lines)
    for name,text in mapped.items():
        if name.startswith('Check Box'):fields[name]=text
        else:fill_text(name,text)
    has_other_overflow=bool(annex)
    if additional:
        fill_text('Text Field38',additional,reserve=int(has_other_overflow))
    if has_other_overflow:
        notice='See continuation (A1).' if len(annex)==1 else f'See continuation (A1-A{len(annex)}).'
        fields['Text Field38']='\n'.join(filter(None,[fields['Text Field38'],notice]))
    w.update_page_form_field_values(None,fields,auto_regenerate=False)
    styles=getSampleStyleSheet();story=[Paragraph('APIP - fictional case continuation',styles['Title']),Paragraph(escape(f"Case {case['id']} / revision {case['revision']}"),styles['Normal']),Paragraph('Pages 1-2 retain the original PvPI form and instructions. This continuation is generated by APIP; it is not government endorsement or submission. Blank fields are not known negatives. Correct the saved APIP case and regenerate; PDF-only edits do not update APIP.',styles['Normal']),Spacer(1,12)]
    for ref,label,text in annex:
        story += [Paragraph(escape(ref+' - '+label),styles['Heading3']),Paragraph(escape(text).replace('\n','<br/>'),styles['Normal'])]
    def footer(canvas,doc):
        canvas.saveState();canvas.setFont('Helvetica',7)
        canvas.drawString(40,22,f"APIP fictional continuation / {case['id']} / revision {case['revision']}")
        canvas.drawRightString(555,22,f'PDF page {doc.page+2}');canvas.restoreState()
    if annex:
        buf=io.BytesIO()
        SimpleDocTemplate(buf,pagesize=(595.2,841.92),leftMargin=40,rightMargin=40,topMargin=40,bottomMargin=40,invariant=1).build(story,onFirstPage=footer,onLaterPages=footer)
        for p in PdfReader(buf).pages:w.add_page(p)
    out=io.BytesIO();w.write(out);data=out.getvalue();check=PdfReader(io.BytesIO(data));actual=check.get_fields()
    assert len(actual)==147
    for name,value in fields.items():assert str(actual[name].get('/V',''))==value,(name,value,actual[name].get('/V'))
    assert check.pages[1].get_contents().get_data()==r.pages[1].get_contents().get_data()
    return data

if __name__=='__main__':
    try:
        if '--inventory' in sys.argv:sys.stdout.buffer.write(json.dumps(inventory(),indent=2).encode())
        else:sys.stdout.buffer.write(generate(json.load(sys.stdin)))
    except Exception as e:
        code=str(e) if str(e) in ['PDF_UNSUPPORTED_SCRIPT','PDF_SELECT_ONE_SERIOUSNESS','TEMPLATE_CHANGED','FICTIONAL_ONLY'] else 'PDF_GENERATION_FAILED'
        sys.stderr.write(code);sys.exit(1)
