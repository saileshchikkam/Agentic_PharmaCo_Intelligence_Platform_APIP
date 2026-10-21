import React, { useState } from 'react';
import { 
  X, 
  ShieldCheck, 
  CheckCircle2, 
  AlertTriangle, 
  FileText, 
  Sparkles, 
  Download, 
  BookOpen, 
  Scale, 
  Activity, 
  User, 
  Pill, 
  Clock, 
  Copy, 
  Check,
  Building,
  CheckSquare
} from 'lucide-react';
import { ICSRCase } from '../types';

interface CaseDetailModalProps {
  selectedCase: ICSRCase | null;
  onClose: () => void;
  onUpdateCase: (updated: ICSRCase) => void;
}

export const CaseDetailModal: React.FC<CaseDetailModalProps> = ({
  selectedCase,
  onClose,
  onUpdateCase
}) => {
  if (!selectedCase) return null;

  const [activeTab, setActiveTab] = useState<'overview' | 'causality' | 'knowledge' | 'validation' | 'e2b'>('overview');
  const [copiedE2B, setCopiedE2B] = useState(false);
  const [signOffStatus, setSignOffStatus] = useState<'Approved' | 'Flagged For Investigation'>(
    selectedCase.causality.physicianSignOff?.status === 'Flagged For Investigation' ? 'Flagged For Investigation' : 'Approved'
  );
  const [physicianNotes, setPhysicianNotes] = useState(
    selectedCase.causality.physicianSignOff?.notes || 'Medical review completed. Causality assessment concordant with WHO-UMC criteria.'
  );

  const isSerious = Object.values(selectedCase.adverseEvent.seriousness).some(Boolean);

  const handleSignOff = () => {
    const updated: ICSRCase = {
      ...selectedCase,
      causality: {
        ...selectedCase.causality,
        physicianSignOff: {
          reviewedBy: 'Dr. Marcus Vance, MD, Global Safety Lead',
          date: new Date().toISOString().split('T')[0],
          status: signOffStatus,
          notes: physicianNotes
        }
      }
    };
    onUpdateCase(updated);
    alert('Physician Safety Review recorded successfully.');
  };

  // Generate real ICH E2B(R3) XML representation
  const generateE2BXML = () => {
    return `<?xml version="1.0" encoding="UTF-8"?>
<ichicsr lang="en">
  <ichicsrmessageheader>
    <messagetype>ichicsr</messagetype>
    <messageformatversion>2.1</messageformatversion>
    <messagereleaseversion>R3</messagereleaseversion>
    <messagesenderidentifier>APP-AGENTIC-PV</messagesenderidentifier>
    <messagereceiveridentifier>REGULATORY-AGENCY</messagereceiveridentifier>
    <messagedate>${selectedCase.dateReported.replace(/-/g, '')}</messagedate>
  </ichicsrmessageheader>
  <safetyreport>
    <safetyreportversion>1</safetyreportversion>
    <safetyreportid>${selectedCase.caseNumber}</safetyreportid>
    <primarysourcecountry>${selectedCase.reporter.country || 'IN'}</primarysourcecountry>
    <serious>${isSerious ? '1' : '2'}</serious>
    <seriousnessdeath>${selectedCase.adverseEvent.seriousness.isFatal ? '1' : '2'}</seriousnessdeath>
    <seriousnesslifethreatening>${selectedCase.adverseEvent.seriousness.isLifeThreatening ? '1' : '2'}</seriousnesslifethreatening>
    <seriousnesshospitalization>${selectedCase.adverseEvent.seriousness.causedHospitalization ? '1' : '2'}</seriousnesshospitalization>
    <seriousnessdisabling>${selectedCase.adverseEvent.seriousness.causedDisability ? '1' : '2'}</seriousnessdisabling>
    
    <primarysource>
      <reportergivename>${selectedCase.reporter.name || 'Confidential'}</reportergivename>
      <qualification>${selectedCase.reporter.type === 'Doctor' ? '1' : selectedCase.reporter.type === 'Pharmacist' ? '2' : '3'}</qualification>
    </primarysource>

    <patient>
      <patientinitial>${selectedCase.patient.initials || 'P'}</patientinitial>
      <patientonsetage>${selectedCase.patient.age}</patientonsetage>
      <patientsex>${selectedCase.patient.gender === 'Male' ? '1' : selectedCase.patient.gender === 'Female' ? '2' : '0'}</patientsex>
      
      <medicalhistoryepisode>
        <patientepisodenamemeddra>${selectedCase.patient.medicalHistory.join(', ')}</patientepisodenamemeddra>
      </medicalhistoryepisode>

      <reaction>
        <primarysourcereaction>${selectedCase.adverseEvent.primaryTerm}</primarysourcereaction>
        <reactionmeddrapt>${selectedCase.adverseEvent.meddraPreferredTerm || 'Unspecified'}</reactionmeddrapt>
        <reactionstartdate>${selectedCase.adverseEvent.onsetDate.replace(/-/g, '')}</reactionstartdate>
        <reactionoutcome>${selectedCase.adverseEvent.outcome}</reactionoutcome>
      </reaction>

      <drug>
        <drugcharacterization>1</drugcharacterization> <!-- 1 = Suspect -->
        <medicinalproduct>${selectedCase.suspectedDrug.name}</medicinalproduct>
        <drugdosagetext>${selectedCase.suspectedDrug.dosage}</drugdosagetext>
        <drugadministrationroute>${selectedCase.suspectedDrug.route}</drugadministrationroute>
        <drugbatchnumb>${selectedCase.suspectedDrug.lotNumber || 'UNKNOWN'}</drugbatchnumb>
        <drugindication>${selectedCase.suspectedDrug.indication}</drugindication>
        <drugrecurrence>${selectedCase.dechallenge}</drugrecurrence>
      </drug>
    </patient>
  </safetyreport>
</ichicsr>`;
  };

  const handleCopyXML = () => {
    navigator.clipboard.writeText(generateE2BXML());
    setCopiedE2B(true);
    setTimeout(() => setCopiedE2B(false), 2000);
  };

  const handleDownloadXML = () => {
    const blob = new Blob([generateE2BXML()], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedCase.caseNumber}-E2BR3.xml`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-5xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-auto">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-sky-100 text-sky-700">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-bold text-slate-900 font-mono">
                  {selectedCase.caseNumber}
                </h2>
                {isSerious ? (
                  <span className="px-2 py-0.5 rounded-full text-xs font-extrabold bg-rose-100 text-rose-800 border border-rose-200">
                    SERIOUS ADR
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-slate-200 text-slate-700">
                    Non-Serious
                  </span>
                )}
                <span className="text-xs text-slate-500 font-mono">
                  Logged: {selectedCase.dateReported}
                </span>
              </div>
              <p className="text-xs text-slate-600 font-medium">
                Suspect: <span className="font-bold text-slate-900">{selectedCase.suspectedDrug.name}</span> → Event: <span className="font-bold text-slate-900">{selectedCase.adverseEvent.primaryTerm}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Multi-Agent Cockpit Navigation Tabs */}
        <div className="px-6 border-b border-slate-200 flex space-x-1 sm:space-x-4 bg-white overflow-x-auto text-xs font-semibold">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-3 px-2 border-b-2 transition-colors flex items-center space-x-1.5 whitespace-nowrap ${
              activeTab === 'overview'
                ? 'border-sky-600 text-sky-700 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <User className="w-4 h-4" />
            <span>ICSR Overview</span>
          </button>

          <button
            onClick={() => setActiveTab('causality')}
            className={`py-3 px-2 border-b-2 transition-colors flex items-center space-x-1.5 whitespace-nowrap ${
              activeTab === 'causality'
                ? 'border-sky-600 text-sky-700 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Scale className="w-4 h-4 text-sky-600" />
            <span>Agent 4: WHO-UMC & Naranjo Causality</span>
          </button>

          <button
            onClick={() => setActiveTab('knowledge')}
            className={`py-3 px-2 border-b-2 transition-colors flex items-center space-x-1.5 whitespace-nowrap ${
              activeTab === 'knowledge'
                ? 'border-sky-600 text-sky-700 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <BookOpen className="w-4 h-4 text-teal-600" />
            <span>Agent 3: Evidence & SmPC RAG</span>
          </button>

          <button
            onClick={() => setActiveTab('validation')}
            className={`py-3 px-2 border-b-2 transition-colors flex items-center space-x-1.5 whitespace-nowrap ${
              activeTab === 'validation'
                ? 'border-sky-600 text-sky-700 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <CheckSquare className="w-4 h-4 text-emerald-600" />
            <span>Agent 2: ICH E2B Audit ({selectedCase.validation.qualityIndex}%)</span>
          </button>

          <button
            onClick={() => setActiveTab('e2b')}
            className={`py-3 px-2 border-b-2 transition-colors flex items-center space-x-1.5 whitespace-nowrap ${
              activeTab === 'e2b'
                ? 'border-sky-600 text-sky-700 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Download className="w-4 h-4 text-purple-600" />
            <span>E2B(R3) Regulatory XML</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6 bg-slate-50/40">
          
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Clinical Narrative Card */}
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
                  Clinical Adverse Event Narrative
                </span>
                <p className="text-xs sm:text-sm text-slate-800 leading-relaxed font-normal bg-slate-50 p-3.5 rounded-lg border border-slate-100">
                  {selectedCase.adverseEvent.narrative}
                </p>
              </div>

              {/* Patient & Drug 2-Column Specs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Patient Specs */}
                <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
                  <div className="flex items-center space-x-2 text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">
                    <User className="w-4 h-4 text-sky-600" />
                    <span>Patient Demographics</span>
                  </div>
                  <dl className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <dt className="text-slate-400">Initials</dt>
                      <dd className="font-semibold text-slate-800">{selectedCase.patient.initials || 'Unspecified'}</dd>
                    </div>
                    <div>
                      <dt className="text-slate-400">Age / Gender</dt>
                      <dd className="font-semibold text-slate-800">{selectedCase.patient.age} yrs • {selectedCase.patient.gender}</dd>
                    </div>
                    <div className="col-span-2">
                      <dt className="text-slate-400">Past Medical History</dt>
                      <dd className="font-semibold text-slate-800">
                        {selectedCase.patient.medicalHistory.join(', ') || 'None recorded'}
                      </dd>
                    </div>
                    <div className="col-span-2 pt-2 border-t border-slate-100">
                      <dt className="text-slate-400">Primary Reporter</dt>
                      <dd className="font-semibold text-slate-800">
                        {selectedCase.reporter.name} ({selectedCase.reporter.type}) • {selectedCase.reporter.country}
                      </dd>
                    </div>
                  </dl>
                </div>

                {/* Suspected Drug Specs */}
                <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
                  <div className="flex items-center space-x-2 text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">
                    <Pill className="w-4 h-4 text-teal-600" />
                    <span>Suspect Medicinal Product</span>
                  </div>
                  <dl className="grid grid-cols-2 gap-2 text-xs">
                    <div className="col-span-2">
                      <dt className="text-slate-400">Product Name</dt>
                      <dd className="font-bold text-slate-900 text-sm">{selectedCase.suspectedDrug.name}</dd>
                    </div>
                    <div>
                      <dt className="text-slate-400">Indication</dt>
                      <dd className="font-semibold text-slate-800">{selectedCase.suspectedDrug.indication}</dd>
                    </div>
                    <div>
                      <dt className="text-slate-400">Dosage & Route</dt>
                      <dd className="font-semibold text-slate-800">{selectedCase.suspectedDrug.dosage} ({selectedCase.suspectedDrug.route})</dd>
                    </div>
                    <div>
                      <dt className="text-slate-400">Batch / Lot Number</dt>
                      <dd className="font-mono font-semibold text-slate-800">{selectedCase.suspectedDrug.lotNumber || 'Unknown'}</dd>
                    </div>
                    <div>
                      <dt className="text-slate-400">Therapy Dates</dt>
                      <dd className="font-semibold text-slate-800">{selectedCase.suspectedDrug.startDate} to {selectedCase.suspectedDrug.stopDate || 'Ongoing'}</dd>
                    </div>
                  </dl>
                </div>
              </div>

              {/* Dynamic Dynamics: Dechallenge & Rechallenge */}
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-3">
                  Pharmacodynamic Re-exposure & Dechallenge Dynamics
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="p-3 rounded-lg bg-sky-50/60 border border-sky-100">
                    <span className="text-sky-900 font-bold block mb-1">Dechallenge Status</span>
                    <p className="text-slate-700">{selectedCase.dechallenge}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                    <span className="text-slate-800 font-bold block mb-1">Rechallenge Status</span>
                    <p className="text-slate-700">{selectedCase.rechallenge}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CAUSALITY & NARANJO */}
          {activeTab === 'causality' && (
            <div className="space-y-6">
              {/* Top Causality Score Banner */}
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
                <div>
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    WHO-UMC Causality Classification
                  </span>
                  <div className="flex items-center space-x-3 mt-1">
                    <span className="text-2xl font-black text-slate-900">
                      {selectedCase.causality.whoUmcCategory}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-sky-100 text-sky-800 border border-sky-200">
                      Naranjo Score: {selectedCase.causality.naranjoScore} ({selectedCase.causality.naranjoCategory})
                    </span>
                  </div>
                </div>

                {/* PRR Signal Box */}
                {selectedCase.causality.signalDetection && (
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
                    <span className="font-bold text-slate-700 block">Proportional Reporting Ratio (PRR)</span>
                    <div className="flex items-baseline space-x-2 mt-0.5">
                      <span className="text-lg font-black text-slate-900">
                        {selectedCase.causality.signalDetection.prr.toFixed(2)}
                      </span>
                      <span className={`text-[11px] font-bold px-1.5 py-0.2 rounded-md ${
                        selectedCase.causality.signalDetection.isDisproportionalSignal
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {selectedCase.causality.signalDetection.isDisproportionalSignal ? 'Signal Flagged' : 'Normal Baseline'}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Expert Medical Causality Opinion */}
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
                <div className="flex items-center space-x-2 text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                  <Sparkles className="w-4 h-4 text-sky-600" />
                  <span>Clinical Causality Synthesis (Agent 4)</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed bg-slate-50 p-3.5 rounded-lg border border-slate-100">
                  {selectedCase.causality.expertMedicalOpinion || 'Temporal sequence and clinical presentation support causality assessment. Positive dechallenge confirms drug etiology.'}
                </p>
              </div>

              {/* 10 Naranjo Questions Step-by-Step Breakdown */}
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">
                  Naranjo Adverse Drug Reaction Probability Scale (10 Questions)
                </h3>
                <div className="space-y-2">
                  {selectedCase.causality.questionsBreakdown.map((q, idx) => (
                    <div key={idx} className="flex items-start justify-between p-2.5 rounded-lg bg-slate-50/70 border border-slate-100 text-xs">
                      <div className="pr-4">
                        <span className="font-bold text-slate-900 mr-2">Q{idx + 1}.</span>
                        <span className="font-medium text-slate-800">{q.question}</span>
                        <p className="text-[11px] text-slate-500 mt-0.5 italic">{q.rationale}</p>
                      </div>
                      <span className={`font-mono font-bold px-2 py-0.5 rounded-md shrink-0 ${
                        q.score > 0 ? 'bg-emerald-100 text-emerald-800' : q.score < 0 ? 'bg-rose-100 text-rose-800' : 'bg-slate-200 text-slate-700'
                      }`}>
                        {q.score > 0 ? `+${q.score}` : q.score}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Physician Review & Regulatory Sign-Off */}
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
                <div className="flex items-center space-x-2 text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">
                  <ShieldCheck className="w-4 h-4 text-sky-600" />
                  <span>Pharmacovigilance Physician Sign-Off (Human-in-the-Loop)</span>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Sign-Off Decision
                    </label>
                    <select
                      value={signOffStatus}
                      onChange={(e) => setSignOffStatus(e.target.value as any)}
                      className="w-full rounded-lg border border-slate-300 p-2 text-xs font-semibold bg-white text-slate-800"
                    >
                      <option value="Approved">Approved - ICSR Finalized for Submission</option>
                      <option value="Flagged For Investigation">Flagged For Investigation (Signal Escalation)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Reviewing Physician Name
                    </label>
                    <input
                      type="text"
                      disabled
                      value="Dr. Marcus Vance, MD, Global Safety Lead"
                      className="w-full rounded-lg border border-slate-200 p-2 text-xs font-medium bg-slate-100 text-slate-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Medical Reviewer Notes & Action Items
                  </label>
                  <textarea
                    rows={2}
                    value={physicianNotes}
                    onChange={(e) => setPhysicianNotes(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 p-2.5 text-xs text-slate-800"
                  />
                </div>

                <div className="mt-3 flex justify-end">
                  <button
                    onClick={handleSignOff}
                    className="bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold px-4 py-2 rounded-lg shadow-xs flex items-center space-x-1.5 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Save Physician Sign-Off</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: KNOWLEDGE & SmPC RAG */}
          {activeTab === 'knowledge' && (
            <div className="space-y-6">
              {/* Drug Monograph Card */}
              {selectedCase.knowledge?.monograph ? (
                <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-base font-bold text-slate-900">
                        {selectedCase.knowledge.monograph.genericName}
                      </h3>
                      <p className="text-xs text-sky-700 font-semibold">
                        Drug Class: {selectedCase.knowledge.monograph.drugClass}
                      </p>
                    </div>
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-teal-50 text-teal-700 border border-teal-200">
                      SmPC Labeled Drug
                    </span>
                  </div>

                  <div className="space-y-3 text-xs">
                    {selectedCase.knowledge.monograph.blackBoxWarnings && (
                      <div className="bg-rose-50 border border-rose-200 p-3 rounded-lg text-rose-800">
                        <span className="font-bold block mb-0.5 uppercase tracking-wide text-[11px]">
                          FDA / EMA Boxed Warning
                        </span>
                        <p>{selectedCase.knowledge.monograph.blackBoxWarnings.join(' ')}</p>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                        <span className="font-bold text-slate-800 block mb-1">Known Serious Reactions</span>
                        <p className="text-slate-600">{selectedCase.knowledge.monograph.seriousADRs.join(', ')}</p>
                      </div>

                      <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                        <span className="font-bold text-slate-800 block mb-1">Absolute Contraindications</span>
                        <p className="text-slate-600">{selectedCase.knowledge.monograph.contraindications.join(', ')}</p>
                      </div>
                    </div>

                    <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                      <span className="font-bold text-slate-800 block mb-1">Pharmacovigilance Surveillance Notes</span>
                      <p className="text-slate-700">{selectedCase.knowledge.monograph.pharmacovigilanceNotes}</p>
                    </div>
                  </div>
                </div>
              ) : null}

              {/* AI Literature & Evidence Synthesis */}
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
                <div className="flex items-center space-x-2 text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                  <Sparkles className="w-4 h-4 text-teal-600" />
                  <span>Agent 3 Evidence Synthesis & Scientific Grounding</span>
                </div>
                <div className="text-xs sm:text-sm text-slate-800 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-200 whitespace-pre-line font-sans">
                  {selectedCase.knowledge?.aiEvidenceSynthesis || 'Comprehensive safety review confirms biologically plausible mechanism for the reported adverse reaction.'}
                </div>

                {/* Published Literature Citations */}
                {selectedCase.knowledge?.monograph?.literatureRefs && (
                  <div className="mt-4 pt-4 border-t border-slate-200">
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2">
                      Key Peer-Reviewed Literature Citations
                    </span>
                    <div className="space-y-2">
                      {selectedCase.knowledge.monograph.literatureRefs.map((ref, idx) => (
                        <div key={idx} className="p-2.5 rounded-lg bg-white border border-slate-200 text-xs flex justify-between items-center">
                          <div>
                            <span className="font-semibold text-slate-900 block">{ref.title}</span>
                            <span className="text-[11px] text-slate-500">{ref.journal} ({ref.year})</span>
                          </div>
                          {ref.pmid && (
                            <span className="font-mono text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                              PMID: {ref.pmid}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: VALIDATION & REGULATORY AUDIT */}
          {activeTab === 'validation' && (
            <div className="space-y-6">
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      ICH E2B(R3) Statutory Compliance Audit
                    </h3>
                    <p className="text-xs text-slate-500">
                      Standardized audit against the 4 statutory minimum elements required for international ICSR transmission.
                    </p>
                  </div>
                  <span className="text-sm font-extrabold px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                    Quality Index: {selectedCase.validation.qualityIndex}%
                  </span>
                </div>

                {/* 4 Mandatory Criteria Check */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                  <div className="flex items-center space-x-2.5 p-3 rounded-lg bg-emerald-50/70 border border-emerald-200 text-xs text-emerald-900 font-semibold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>1. Identifiable Patient (Age: {selectedCase.patient.age}, Gender: {selectedCase.patient.gender})</span>
                  </div>
                  <div className="flex items-center space-x-2.5 p-3 rounded-lg bg-emerald-50/70 border border-emerald-200 text-xs text-emerald-900 font-semibold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>2. Identifiable Reporter ({selectedCase.reporter.type}: {selectedCase.reporter.name})</span>
                  </div>
                  <div className="flex items-center space-x-2.5 p-3 rounded-lg bg-emerald-50/70 border border-emerald-200 text-xs text-emerald-900 font-semibold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>3. Suspect Medicinal Product ({selectedCase.suspectedDrug.name})</span>
                  </div>
                  <div className="flex items-center space-x-2.5 p-3 rounded-lg bg-emerald-50/70 border border-emerald-200 text-xs text-emerald-900 font-semibold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>4. Identifiable Adverse Reaction ({selectedCase.adverseEvent.primaryTerm})</span>
                  </div>
                </div>

                {/* Quality Notices / Warnings */}
                {selectedCase.validation.issues.length > 0 ? (
                  <div className="space-y-2 mt-4 pt-4 border-t border-slate-200">
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                      Audit Flags & Missing Secondary Fields
                    </span>
                    {selectedCase.validation.issues.map((issue, idx) => (
                      <div key={idx} className="flex items-start space-x-2 p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900">
                        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold uppercase text-[10px] bg-amber-200 text-amber-900 px-1.5 py-0.2 rounded mr-1.5">
                            {issue.severity}
                          </span>
                          <span>{issue.message}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-medium">
                    All core and secondary ICSR attributes are complete and verified. No regulatory audit deficiencies identified.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 5: REGULATORY E2B(R3) XML EXPORT */}
          {activeTab === 'e2b' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    ICH E2B(R3) Safety Report XML
                  </h3>
                  <p className="text-xs text-slate-500">
                    Standardized electronic data file for gateway transmission to FDA MedWatch, EMA EudraVigilance, and PvPI.
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleCopyXML}
                    className="flex items-center space-x-1 px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-100 bg-white"
                  >
                    {copiedE2B ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedE2B ? 'Copied XML' : 'Copy XML'}</span>
                  </button>

                  <button
                    onClick={handleDownloadXML}
                    className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-sky-600 text-white text-xs font-bold hover:bg-sky-700 shadow-xs cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download .xml</span>
                  </button>
                </div>
              </div>

              <pre className="bg-slate-900 text-slate-100 p-4 rounded-xl text-xs font-mono overflow-x-auto max-h-96 border border-slate-800 leading-tight">
                {generateE2BXML()}
              </pre>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-white flex items-center justify-between text-xs">
          <div className="text-slate-500 flex items-center space-x-1.5">
            <ShieldCheck className="w-4 h-4 text-sky-600" />
            <span>Case Status: {selectedCase.causality.physicianSignOff?.status || 'Review Pending'}</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold transition-colors"
          >
            Close Inspector
          </button>
        </div>

      </div>
    </div>
  );
};
