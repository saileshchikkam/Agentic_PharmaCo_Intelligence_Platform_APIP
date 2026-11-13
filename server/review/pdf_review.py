"""Append a separate fictional human-assessment record; never overwrite PvPI fields."""
import io, sys, json, base64
from xml.sax.saxutils import escape
from pypdf import PdfReader, PdfWriter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.pdfgen.canvas import Canvas

def generate(payload):
    source=payload['source']; original=PdfReader(io.BytesIO(base64.b64decode(payload['original'],validate=True)))
    for key,value in source['assessment'].items():
        if key=='reviewerNotes':continue
        try:str(value).encode('cp1252')
        except UnicodeEncodeError:raise ValueError('PDF_UNSUPPORTED_SCRIPT')
    buf=io.BytesIO(); styles=getSampleStyleSheet(); story=[]
    def p(value,style='BodyText'):
        story.append(Paragraph(escape(str(value)).replace('\n','<br/>'),styles[style]));story.append(Spacer(1,8))
    p('APIP — FICTIONAL PROFESSIONAL ASSESSMENT','Title')
    p('Separate human-authored review. Not an official regulatory submission or certified clinical decision.')
    p('Case '+source['caseId']+' | Patient revision '+str(source['patientRevision']))
    p('Assessment version '+str(source['assessmentVersion'])+' | Reviewer reference '+source['reviewer'])
    p('Finalized '+source['finalizedAt'])
    labels={'clinicalAssessment':'Clinical assessment','investigations':'Relevant investigations','medicineVerification':'Suspected medicine verification','seriousness':'Reported seriousness assessment','outcome':'Outcome assessment','causality':'Human causality assessment','causalityReasoning':'Human reasoning and limitations','observations':'Professional observations'}
    for key,label in labels.items():
        p(label,'Heading2');p(source['assessment'].get(key,'Not recorded'))
    p('Patient-authored answers remain unchanged in the preceding original form. Private reviewer notes are excluded. No AMC/NCC identity or official receiving authority is asserted.')
    SimpleDocTemplate(buf,topMargin=40,bottomMargin=40).build(story,canvasmaker=lambda *a,**kw:Canvas(*a,**{**kw,'invariant':1}))
    writer=PdfWriter();writer.clone_document_from_reader(original)
    for page in PdfReader(io.BytesIO(buf.getvalue())).pages:writer.add_page(page)
    out=io.BytesIO();writer.write(out);return out.getvalue()

if __name__=='__main__':
    try:sys.stdout.buffer.write(generate(json.loads(sys.stdin.buffer.read(16000000))))
    except Exception as e:
        sys.stderr.write('PDF_UNSUPPORTED_SCRIPT' if str(e)=='PDF_UNSUPPORTED_SCRIPT' else 'PDF_GENERATION_FAILED');sys.exit(1)
