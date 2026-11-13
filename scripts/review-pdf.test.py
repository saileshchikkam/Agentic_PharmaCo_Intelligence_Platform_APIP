"""Actual appendix generation; original pages and private-note boundaries."""
import io,base64,unittest,importlib.util
from pathlib import Path
from pypdf import PdfReader
from reportlab.pdfgen.canvas import Canvas
ROOT=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('review',ROOT/'server/review/pdf_review.py');review=importlib.util.module_from_spec(spec);spec.loader.exec_module(review)
def payload(original):
 return {'original':base64.b64encode(original).decode(),'source':{'caseId':'fictional-case','patientRevision':12,'assessmentVersion':2,'reviewer':'fictional-reviewer','finalizedAt':'2026-11-13T12:00:00Z','assessment':{'clinicalAssessment':'Fictional human assessment <not automated>','causality':'Not assessed','causalityReasoning':'No clinical determination','reviewerNotes':'PRIVATE_SENTINEL'}}}
class ReviewPdfTests(unittest.TestCase):
 def test_unsupported_script_fails_without_silent_glyph_replacement(self):
  buf=io.BytesIO();c=Canvas(buf);c.drawString(30,800,'Original');c.save();p=payload(buf.getvalue());p['source']['assessment']['clinicalAssessment']='తెలుగు'
  with self.assertRaisesRegex(ValueError,'PDF_UNSUPPORTED_SCRIPT'):review.generate(p)
 def test_real_appendix_preserves_original_and_excludes_notes(self):
  buf=io.BytesIO();c=Canvas(buf,invariant=1);c.drawString(30,800,'Original page one');c.showPage();c.drawString(30,800,'Original instructions');c.save();data=buf.getvalue()
  filled=review.generate(payload(data));r=PdfReader(io.BytesIO(filled));original=PdfReader(io.BytesIO(data));self.assertGreaterEqual(len(r.pages),3)
  for i in range(2):self.assertEqual(r.pages[i].get_contents().get_data(),original.pages[i].get_contents().get_data())
  text=''.join(p.extract_text() for p in r.pages[2:]);self.assertIn('Fictional human assessment <not automated>',text);self.assertNotIn('PRIVATE_SENTINEL',text);self.assertEqual(filled,review.generate(payload(data)))
 def test_original_acroform_when_locally_available(self):
  if not (ROOT/'docs/adr/templates/ADRRF_2.pdf').exists():self.skipTest('Original template not distributed in this checkout')
  spec=importlib.util.spec_from_file_location('form',ROOT/'server/adr/pdf_form.py');form=importlib.util.module_from_spec(spec);spec.loader.exec_module(form)
  case={'id':'fictional','revision':1,'fictionalOnly':True,'values':{'initials':{'state':'provided','value':'FX','confirmedAt':'2026-11-13T00:00:00Z'}},'medications':[]};data=form.generate(case);r=PdfReader(io.BytesIO(review.generate(payload(data))));before=PdfReader(io.BytesIO(data));self.assertEqual(r.get_fields()['Text Field0']['/V'],'FX');self.assertEqual(len(r.get_fields()),147)
  for i in range(2):self.assertEqual(r.pages[i].get_contents().get_data(),before.pages[i].get_contents().get_data())
if __name__=='__main__':unittest.main()
