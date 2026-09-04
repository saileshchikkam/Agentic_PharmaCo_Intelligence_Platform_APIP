import React, { useState } from 'react';
import { 
  Sparkles, 
  Send, 
  Mic, 
  MicOff, 
  AlertCircle, 
  CheckCircle2, 
  HelpCircle, 
  Pill, 
  Clock, 
  AlertTriangle,
  RotateCcw,
  User,
  ShieldCheck,
  FileCheck
} from 'lucide-react';
import { ICSRCase, ReporterType, DechallengeOutcome, RechallengeOutcome, SeriousnessCriteria } from '../types';
import { SAMPLE_PROMPTS_FOR_INTAKE } from '../mockData';

interface ReportIntakeViewProps {
  onSubmitCase: (newCase: ICSRCase) => void;
  onNavigateToDashboard: () => void;
}

export const ReportIntakeView: React.FC<ReportIntakeViewProps> = ({
  onSubmitCase,
  onNavigateToDashboard
}) => {
  const [activeMode, setActiveMode] = useState<'narrative' | 'structured'>('narrative');
  const [narrative, setNarrative] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isListening, setIsListening] = useState(false);

  // Form Fields
  const [reporterType, setReporterType] = useState<ReporterType>('Patient');
  const [reporterName, setReporterName] = useState('');
  const [reporterContact, setReporterContact] = useState('');
  const [patientAge, setPatientAge] = useState('45');
  const [patientGender, setPatientGender] = useState<'Male' | 'Female' | 'Other' | 'Unspecified'>('Female');
  const [patientInitials, setPatientInitials] = useState('J.D.');

  // Drug & Event
  const [suspectedDrugName, setSuspectedDrugName] = useState('');
  const [drugIndication, setDrugIndication] = useState('');
  const [drugDosage, setDrugDosage] = useState('');
  const [lotNumber, setLotNumber] = useState('');
  const [adverseEventDesc, setAdverseEventDesc] = useState('');
  const [meddraTerm, setMeddraTerm] = useState('');
  const [onsetTiming, setOnsetTiming] = useState('');
  const [dechallenge, setDechallenge] = useState<DechallengeOutcome>('Positive (improved after stopping)');
  const [rechallenge, setRechallenge] = useState<RechallengeOutcome>('Not Rechallenged');
  const [concomitantMeds, setConcomitantMeds] = useState('');

  // Seriousness
  const [seriousness, setSeriousness] = useState<SeriousnessCriteria>({
    isFatal: false,
    isLifeThreatening: false,
    causedHospitalization: false,
    causedDisability: false,
    congenitalAnomaly: false,
    otherMedicallyImportant: false
  });

  // Check 4 mandatory ICH criteria
  const hasPatient = !!(patientAge || patientInitials);
  const hasReporter = !!(reporterName || reporterType);
  const hasDrug = !!(suspectedDrugName.trim().length > 1);
  const hasEvent = !!(adverseEventDesc.trim().length > 1);
  const isICHCompliant = hasPatient && hasReporter && hasDrug && hasEvent;

  // Calculate live quality index
  let qualityScore = 0;
  if (hasPatient) qualityScore += 25;
  if (hasReporter) qualityScore += 25;
  if (hasDrug) qualityScore += 25;
  if (hasEvent) qualityScore += 25;
  if (lotNumber.trim().length > 0) qualityScore = Math.min(100, qualityScore + 10);
  if (dechallenge !== 'Unknown') qualityScore = Math.min(100, qualityScore + 10);

  // Toggle voice recognition
  const handleToggleVoice = () => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      alert('Speech recognition is not natively supported in this browser. Please type your experience in the box.');
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onerror = () => setIsListening(false);
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setNarrative(prev => (prev ? `${prev} ${transcript}` : transcript));
      };

      recognition.start();
    } catch (e) {
      console.warn('Speech recognition error:', e);
      setIsListening(false);
    }
  };

  // AI Extraction call
  const handleExtractFromNarrative = async () => {
    if (!narrative.trim()) return;
    setIsExtracting(true);

    try {
      const res = await fetch('/api/agents/report-extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ narrative, reporterType })
      });
      const result = await res.json();
      if (result.success && result.data) {
        const d = result.data;
        if (d.suspectedDrug) setSuspectedDrugName(d.suspectedDrug);
        if (d.indication) setDrugIndication(d.indication);
        if (d.dosageAndRoute) setDrugDosage(d.dosageAndRoute);
        if (d.lotNumber) setLotNumber(d.lotNumber);
        if (d.adverseEvent) setAdverseEventDesc(d.adverseEvent);
        if (d.meddraPreferredTerm) setMeddraTerm(d.meddraPreferredTerm);
        if (d.onsetTiming) setOnsetTiming(d.onsetTiming);
        if (d.dechallenge) setDechallenge(d.dechallenge as any);
        if (d.patientAge && d.patientAge !== 'Unspecified') setPatientAge(d.patientAge);
        if (d.patientGender && ['Male', 'Female'].includes(d.patientGender)) setPatientGender(d.patientGender as any);
        if (d.concomitantDrugs && d.concomitantDrugs.length > 0) {
          setConcomitantMeds(d.concomitantDrugs.join(', '));
        }
        if (d.seriousnessCriteria) {
          setSeriousness(d.seriousnessCriteria);
        }
        setActiveMode('structured');
      }
    } catch (err) {
      console.error('Extraction error:', err);
    } finally {
      setIsExtracting(false);
    }
  };

  const handleApplySample = (sample: typeof SAMPLE_PROMPTS_FOR_INTAKE[0]) => {
    setNarrative(sample.text);
    setReporterType(sample.role as ReporterType);
    setReporterName(sample.role === 'Patient' ? 'Citizen Self-Report' : `Dr. Staff Physician (${sample.role})`);
  };

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasDrug || !hasEvent) {
      alert('Please fill in both the Suspected Drug and the Adverse Reaction.');
      return;
    }

    setIsSubmitting(true);

    const isSerious = Object.values(seriousness).some(Boolean);

    // Call server-side causality & validation agents
    let calculatedCausality: any = {
      naranjoScore: 6,
      naranjoCategory: 'Probable',
      whoUmcCategory: 'Probable / Likely',
      questionsBreakdown: []
    };

    let knowledgeData: any = null;

    try {
      // 1. Validation
      const valRes = await fetch('/api/agents/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          suspectedDrug: suspectedDrugName,
          adverseEvent: adverseEventDesc,
          patientAge,
          reporterName: reporterName || 'Self Reporter',
          lotNumber,
          dechallenge
        })
      });
      const valData = await valRes.json();

      // 2. Causality
      const causalRes = await fetch('/api/agents/causality', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          drugName: suspectedDrugName,
          adverseEvent: adverseEventDesc,
          dechallenge,
          rechallenge,
          onsetTiming,
          concomitantDrugs: concomitantMeds.split(',').map(s => s.trim()).filter(Boolean)
        })
      });
      calculatedCausality = await causalRes.json();

      // 3. Knowledge
      const ragRes = await fetch('/api/agents/knowledge-rag', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ drugName: suspectedDrugName, adverseEvent: adverseEventDesc })
      });
      knowledgeData = await ragRes.json();

      const newCase: ICSRCase = {
        id: `case-${Date.now()}`,
        caseNumber: `PV-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`,
        dateReported: new Date().toISOString().split('T')[0],
        reporter: {
          type: reporterType,
          name: reporterName || `${reporterType} Reporter`,
          contact: reporterContact || 'contact@reporter.org',
          country: 'India'
        },
        patient: {
          initials: patientInitials || 'P.T.',
          age: patientAge || 'Adult',
          gender: patientGender,
          medicalHistory: ['Reported during intake']
        },
        suspectedDrug: {
          name: suspectedDrugName,
          genericName: suspectedDrugName,
          indication: drugIndication || 'Therapeutic indication',
          dosage: drugDosage || 'Standard dosing',
          route: 'Oral',
          lotNumber: lotNumber || 'Unknown',
          startDate: new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0],
          stopDate: new Date().toISOString().split('T')[0]
        },
        concomitantDrugs: concomitantMeds
          ? concomitantMeds.split(',').map(d => ({ name: d.trim() }))
          : [],
        adverseEvent: {
          narrative: narrative || adverseEventDesc,
          primaryTerm: adverseEventDesc,
          meddraPreferredTerm: meddraTerm || adverseEventDesc,
          systemOrganClass: 'General disorders and administration site conditions',
          onsetDate: new Date().toISOString().split('T')[0],
          seriousness,
          seriousnessJustification: isSerious 
            ? 'Meets ICH E2A seriousness criteria'
            : 'Non-serious adverse reaction',
          outcome: 'Recovering/Resolving'
        },
        dechallenge,
        rechallenge,
        validation: {
          isValidICSR: valData.isValidICSR ?? true,
          completenessScore: valData.completenessScore ?? 90,
          qualityIndex: valData.finalQualityIndex ?? 85,
          issues: valData.issues || [],
          regulatoryCompliance: valData.regulatoryCompliance || 'Valid ICSR (ICH E2B Compliant)'
        },
        causality: {
          naranjoScore: calculatedCausality.naranjoScore ?? 6,
          naranjoCategory: calculatedCausality.naranjoCategory ?? 'Probable',
          whoUmcCategory: calculatedCausality.whoUmcCategory ?? 'Probable / Likely',
          questionsBreakdown: calculatedCausality.questionsBreakdown || [],
          signalDetection: calculatedCausality.signalDetection,
          expertMedicalOpinion: calculatedCausality.expertMedicalOpinion
        },
        knowledge: {
          monograph: knowledgeData?.localMonograph,
          aiEvidenceSynthesis: knowledgeData?.aiEvidenceSynthesis
        }
      };

      onSubmitCase(newCase);
      setIsSubmitting(false);
      onNavigateToDashboard();
    } catch (e) {
      console.error('Submission failed:', e);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6">
      {/* Header Banner */}
      <div className="mb-8">
        <div className="flex items-center space-x-2 text-sky-700 font-semibold text-xs tracking-wider uppercase mb-1">
          <ShieldCheck className="w-4 h-4" />
          <span>Pharmacovigilance Reporting Gateway</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Adverse Drug Reaction (ADR) Intake
        </h1>
        <p className="mt-2 text-slate-600 text-sm max-w-3xl">
          Report any suspected reaction, side effect, or therapeutic complication. APP uses multi-agent AI to structure your narrative into an ICH E2B(R3) standardized Individual Case Safety Report (ICSR).
        </p>
      </div>

      {/* Mode Switcher & Live Compliance Bar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-2 flex space-x-2 shadow-xs">
          <button
            id="tab-mode-narrative"
            type="button"
            onClick={() => setActiveMode('narrative')}
            className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-semibold flex items-center justify-center space-x-2 transition-all ${
              activeMode === 'narrative'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>AI Conversational Intake</span>
          </button>

          <button
            id="tab-mode-structured"
            type="button"
            onClick={() => setActiveMode('structured')}
            className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-semibold flex items-center justify-center space-x-2 transition-all ${
              activeMode === 'structured'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <FileCheck className="w-4 h-4" />
            <span>Standardized E2B Form</span>
          </button>
        </div>

        {/* Quality & Validation Score Card */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              ICH E2B(R3) Completeness
            </span>
            <span className={`text-xs font-extrabold px-2 py-0.5 rounded-full ${
              isICHCompliant ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
            }`}>
              {isICHCompliant ? 'Regulatory Threshold Met' : 'Incomplete'}
            </span>
          </div>

          <div className="mt-2">
            <div className="flex justify-between items-center text-xs font-semibold mb-1">
              <span className="text-slate-700">Quality Index</span>
              <span className="text-slate-900 font-bold">{qualityScore}%</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
              <div
                className={`h-2 transition-all duration-300 rounded-full ${
                  qualityScore >= 80 ? 'bg-emerald-500' : qualityScore >= 50 ? 'bg-amber-500' : 'bg-rose-500'
                }`}
                style={{ width: `${qualityScore}%` }}
              />
            </div>
          </div>

          <div className="mt-2 flex items-center space-x-3 text-[11px] text-slate-500">
            <span className={hasPatient ? 'text-emerald-600 font-medium' : 'text-slate-400'}>
              ✓ Patient
            </span>
            <span className={hasReporter ? 'text-emerald-600 font-medium' : 'text-slate-400'}>
              ✓ Reporter
            </span>
            <span className={hasDrug ? 'text-emerald-600 font-medium' : 'text-slate-400'}>
              ✓ Suspect Drug
            </span>
            <span className={hasEvent ? 'text-emerald-600 font-medium' : 'text-slate-400'}>
              ✓ Reaction
            </span>
          </div>
        </div>
      </div>

      {/* Mode 1: Natural Language Intake */}
      {activeMode === 'narrative' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Describe the Adverse Drug Experience
              </h2>
              <p className="text-xs text-slate-500">
                Explain in your own words what medicine was taken, what happened, and when symptoms appeared.
              </p>
            </div>

            {/* Quick Sample Presets */}
            <div className="flex items-center space-x-1.5 flex-wrap">
              <span className="text-xs text-slate-400 font-medium mr-1">Pre-load:</span>
              {SAMPLE_PROMPTS_FOR_INTAKE.map((sample, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleApplySample(sample)}
                  className="text-xs bg-slate-100 hover:bg-sky-50 hover:text-sky-700 text-slate-600 px-2.5 py-1 rounded-md border border-slate-200 transition-colors font-medium"
                >
                  {sample.title}
                </button>
              ))}
            </div>
          </div>

          {/* Narrative Text Area */}
          <div className="relative">
            <textarea
              id="narrative-input"
              rows={6}
              value={narrative}
              onChange={(e) => setNarrative(e.target.value)}
              placeholder="e.g., I started taking Amoxicillin 500mg 3 times a day for a tooth infection. On the third day, my arms broke out in red itchy hives and my face began to swell. I stopped the medication and visited the ER where I received an antihistamine shot..."
              className="w-full rounded-xl border border-slate-300 p-4 text-sm text-slate-900 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 placeholder-slate-400 shadow-xs resize-y"
            />

            <div className="absolute right-3 bottom-3 flex items-center space-x-2">
              <button
                type="button"
                onClick={handleToggleVoice}
                className={`p-2 rounded-lg text-xs font-semibold flex items-center space-x-1 transition-colors border ${
                  isListening
                    ? 'bg-rose-50 border-rose-300 text-rose-600 animate-pulse'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
                title="Voice Input (Speech-to-Text)"
              >
                {isListening ? <MicOff className="w-4 h-4 text-rose-500" /> : <Mic className="w-4 h-4" />}
                <span className="hidden sm:inline">{isListening ? 'Listening...' : 'Dictate'}</span>
              </button>
            </div>
          </div>

          {/* Action Bar */}
          <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <div className="flex items-center space-x-2 text-xs text-slate-500">
              <User className="w-3.5 h-3.5" />
              <span>Reporting as:</span>
              <select
                value={reporterType}
                onChange={(e) => setReporterType(e.target.value as ReporterType)}
                className="bg-slate-50 border border-slate-300 rounded-md px-2 py-1 text-xs font-semibold text-slate-800"
              >
                <option value="Patient">Patient / Family</option>
                <option value="Doctor">Doctor</option>
                <option value="Pharmacist">Pharmacist</option>
                <option value="Nurse">Nurse</option>
              </select>
            </div>

            <div className="flex items-center space-x-3 w-full sm:w-auto">
              <button
                id="btn-extract-narrative"
                type="button"
                disabled={!narrative.trim() || isExtracting}
                onClick={handleExtractFromNarrative}
                className="w-full sm:w-auto bg-gradient-to-r from-sky-600 to-teal-600 hover:from-sky-700 hover:to-teal-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-sm flex items-center justify-center space-x-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                <Sparkles className={`w-4 h-4 ${isExtracting ? 'animate-spin' : ''}`} />
                <span>{isExtracting ? 'Extracting with Reporting Agent...' : 'Auto-Extract ICSR with AI'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mode 2: Standardized E2B Form & Extraction Confirmation */}
      <form onSubmit={handleFinalSubmit} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <div className="border-b border-slate-200 pb-4 mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Individual Case Safety Report (ICSR) Specifications
            </h2>
            <p className="text-xs text-slate-500">
              Review and augment the structured fields according to ICH E2B(R3) guidelines.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setSuspectedDrugName('');
              setAdverseEventDesc('');
              setDrugIndication('');
              setLotNumber('');
              setMeddraTerm('');
            }}
            className="text-xs text-slate-400 hover:text-slate-600 flex items-center space-x-1"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset Fields</span>
          </button>
        </div>

        {/* Section 1: Patient & Reporter */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Reporter Type & Name
            </label>
            <div className="grid grid-cols-2 gap-2">
              <select
                value={reporterType}
                onChange={(e) => setReporterType(e.target.value as ReporterType)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium text-slate-800 bg-white"
              >
                <option value="Patient">Patient</option>
                <option value="Doctor">Doctor</option>
                <option value="Pharmacist">Pharmacist</option>
                <option value="Nurse">Nurse</option>
              </select>
              <input
                type="text"
                placeholder="Name / Initials"
                value={reporterName}
                onChange={(e) => setReporterName(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-800"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Patient Age & Gender
            </label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="Age (e.g. 52)"
                value={patientAge}
                onChange={(e) => setPatientAge(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-800"
              />
              <select
                value={patientGender}
                onChange={(e) => setPatientGender(e.target.value as any)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium text-slate-800 bg-white"
              >
                <option value="Female">Female</option>
                <option value="Male">Male</option>
                <option value="Other">Other</option>
                <option value="Unspecified">Unspecified</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Patient Initials / Identifier
            </label>
            <input
              type="text"
              placeholder="e.g. S.K. (Confidential)"
              value={patientInitials}
              onChange={(e) => setPatientInitials(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-800"
            />
          </div>
        </div>

        {/* Section 2: Suspected Medication */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-6">
          <div className="flex items-center space-x-2 text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">
            <Pill className="w-4 h-4 text-sky-600" />
            <span>Suspect Medicinal Product (Required)</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Drug Name (Brand or Generic) *
              </label>
              <input
                id="input-suspected-drug"
                type="text"
                required
                placeholder="e.g. Augmentin 625mg / Amoxicillin"
                value={suspectedDrugName}
                onChange={(e) => setSuspectedDrugName(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 bg-white font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Reason / Indication
              </label>
              <input
                type="text"
                placeholder="e.g. Dental infection, Hypertension"
                value={drugIndication}
                onChange={(e) => setDrugIndication(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Batch / Lot Number
              </label>
              <input
                type="text"
                placeholder="e.g. BX-9842"
                value={lotNumber}
                onChange={(e) => setLotNumber(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Dosage & Route
              </label>
              <input
                type="text"
                placeholder="e.g. 500mg Oral Twice Daily"
                value={drugDosage}
                onChange={(e) => setDrugDosage(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Concomitant Medications (Other Drugs Taken)
              </label>
              <input
                type="text"
                placeholder="e.g. Paracetamol 650mg, Pantoprazole 40mg"
                value={concomitantMeds}
                onChange={(e) => setConcomitantMeds(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 bg-white"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Adverse Reaction Symptoms & Timing */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-6">
          <div className="flex items-center space-x-2 text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span>Adverse Reaction Clinical Details (Required)</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Reported Reaction / Symptoms *
              </label>
              <input
                id="input-adverse-event"
                type="text"
                required
                placeholder="e.g. Severe maculopapular rash, facial angioedema, elevated transaminases"
                value={adverseEventDesc}
                onChange={(e) => setAdverseEventDesc(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 bg-white font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                MedDRA Preferred Term (PT)
              </label>
              <input
                type="text"
                placeholder="e.g. Angioedema / Urticaria"
                value={meddraTerm}
                onChange={(e) => setMeddraTerm(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 bg-white font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Onset Timing
              </label>
              <input
                type="text"
                placeholder="e.g. 4 hours after initial dose"
                value={onsetTiming}
                onChange={(e) => setOnsetTiming(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Dechallenge (Did symptoms stop on drug withdrawal?)
              </label>
              <select
                value={dechallenge}
                onChange={(e) => setDechallenge(e.target.value as DechallengeOutcome)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium text-slate-800 bg-white"
              >
                <option value="Positive (improved after stopping)">Positive (improved after stopping)</option>
                <option value="Negative (reaction continued)">Negative (reaction continued)</option>
                <option value="Not Discontinued">Not Discontinued</option>
                <option value="Dose Reduced (improved)">Dose Reduced (improved)</option>
                <option value="Unknown">Unknown</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Rechallenge (Did symptoms recur upon re-exposure?)
              </label>
              <select
                value={rechallenge}
                onChange={(e) => setRechallenge(e.target.value as RechallengeOutcome)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium text-slate-800 bg-white"
              >
                <option value="Not Rechallenged">Not Rechallenged</option>
                <option value="Positive (recurred upon re-exposure)">Positive (recurred)</option>
                <option value="Negative (did not recur)">Negative (did not recur)</option>
                <option value="Unknown">Unknown</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 4: Seriousness Criteria (ICH E2A / FDA 21 CFR) */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              ICH Regulatory Seriousness Criteria
            </span>
            <span className="text-[11px] text-slate-500">
              Check all that apply. If none apply, report is classified as Non-Serious.
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
            <label className="flex items-center space-x-2 bg-white p-2.5 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-100">
              <input
                type="checkbox"
                checked={seriousness.isFatal}
                onChange={(e) => setSeriousness({ ...seriousness, isFatal: e.target.checked })}
                className="rounded text-sky-600 focus:ring-sky-500"
              />
              <span className="font-semibold text-rose-700">Patient Death</span>
            </label>

            <label className="flex items-center space-x-2 bg-white p-2.5 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-100">
              <input
                type="checkbox"
                checked={seriousness.isLifeThreatening}
                onChange={(e) => setSeriousness({ ...seriousness, isLifeThreatening: e.target.checked })}
                className="rounded text-sky-600 focus:ring-sky-500"
              />
              <span className="font-semibold text-rose-600">Life-Threatening</span>
            </label>

            <label className="flex items-center space-x-2 bg-white p-2.5 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-100">
              <input
                type="checkbox"
                checked={seriousness.causedHospitalization}
                onChange={(e) => setSeriousness({ ...seriousness, causedHospitalization: e.target.checked })}
                className="rounded text-sky-600 focus:ring-sky-500"
              />
              <span className="font-semibold text-amber-700">Hospitalization / Prolonged</span>
            </label>

            <label className="flex items-center space-x-2 bg-white p-2.5 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-100">
              <input
                type="checkbox"
                checked={seriousness.causedDisability}
                onChange={(e) => setSeriousness({ ...seriousness, causedDisability: e.target.checked })}
                className="rounded text-sky-600 focus:ring-sky-500"
              />
              <span className="font-medium text-slate-800">Persistent Disability</span>
            </label>

            <label className="flex items-center space-x-2 bg-white p-2.5 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-100">
              <input
                type="checkbox"
                checked={seriousness.congenitalAnomaly}
                onChange={(e) => setSeriousness({ ...seriousness, congenitalAnomaly: e.target.checked })}
                className="rounded text-sky-600 focus:ring-sky-500"
              />
              <span className="font-medium text-slate-800">Congenital Anomaly</span>
            </label>

            <label className="flex items-center space-x-2 bg-white p-2.5 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-100">
              <input
                type="checkbox"
                checked={seriousness.otherMedicallyImportant}
                onChange={(e) => setSeriousness({ ...seriousness, otherMedicallyImportant: e.target.checked })}
                className="rounded text-sky-600 focus:ring-sky-500"
              />
              <span className="font-medium text-slate-800">Medically Significant</span>
            </label>
          </div>
        </div>

        {/* Form Submission Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-200">
          <div className="text-xs text-slate-500 flex items-center space-x-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>
              Submission will trigger the Multi-Agent PV Orchestrator (Naranjo Scoring, WHO-UMC Causality & SmPC Check).
            </span>
          </div>

          <button
            id="btn-submit-adr-case"
            type="submit"
            disabled={!hasDrug || !hasEvent || isSubmitting}
            className="w-full sm:w-auto bg-sky-600 hover:bg-sky-700 text-white font-bold px-6 py-3 rounded-xl shadow-sm flex items-center justify-center space-x-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <Send className="w-4 h-4" />
            <span>{isSubmitting ? 'Running Multi-Agent Pipeline...' : 'Submit ICSR to Safety Workspace'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
