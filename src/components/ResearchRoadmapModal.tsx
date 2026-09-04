import React, { useState } from 'react';
import { 
  X, 
  BookOpen, 
  Cpu, 
  CheckCircle2, 
  Layers, 
  FileText, 
  ExternalLink,
  ShieldCheck,
  Award
} from 'lucide-react';

interface ResearchRoadmapModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ResearchRoadmapModal: React.FC<ResearchRoadmapModalProps> = ({
  isOpen,
  onClose
}) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<'agents' | 'research' | 'decisions' | 'pvpi'>('agents');

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-auto">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-teal-100 text-teal-800">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                APP Research Foundation & Multi-Agent Architecture
              </h2>
              <p className="text-xs text-slate-500">
                Grounding in Pharmacovigilance Programme of India (PvPI), WHO-UMC & ICH E2B(R3) Standards
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

        {/* Tab Navigation */}
        <div className="px-6 border-b border-slate-200 flex space-x-2 bg-white text-xs font-semibold overflow-x-auto">
          <button
            onClick={() => setActiveTab('agents')}
            className={`py-3 px-3 border-b-2 transition-colors flex items-center space-x-1.5 ${
              activeTab === 'agents'
                ? 'border-sky-600 text-sky-700 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Cpu className="w-4 h-4 text-sky-600" />
            <span>4-Agent Architecture</span>
          </button>

          <button
            onClick={() => setActiveTab('research')}
            className={`py-3 px-3 border-b-2 transition-colors flex items-center space-x-1.5 ${
              activeTab === 'research'
                ? 'border-sky-600 text-sky-700 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText className="w-4 h-4 text-teal-600" />
            <span>Research Questions (RQ1-RQ8)</span>
          </button>

          <button
            onClick={() => setActiveTab('decisions')}
            className={`py-3 px-3 border-b-2 transition-colors flex items-center space-x-1.5 ${
              activeTab === 'decisions'
                ? 'border-sky-600 text-sky-700 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Layers className="w-4 h-4 text-purple-600" />
            <span>Architecture Decisions (DEC-001–003)</span>
          </button>

          <button
            onClick={() => setActiveTab('pvpi')}
            className={`py-3 px-3 border-b-2 transition-colors flex items-center space-x-1.5 ${
              activeTab === 'pvpi'
                ? 'border-sky-600 text-sky-700 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Award className="w-4 h-4 text-amber-600" />
            <span>PvPI & Regulatory Standards</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-700">
          
          {/* AGENTS TAB */}
          {activeTab === 'agents' && (
            <div className="space-y-4">
              <div className="bg-sky-50 border border-sky-100 rounded-xl p-4 text-sky-900">
                <span className="font-bold text-sm block mb-1">
                  The Multi-Agent Pharmacovigilance Pipeline
                </span>
                <p className="leading-relaxed">
                  Unlike conventional monolithic forms, APP dispatches specialized, cooperating AI agents across the pharmacovigilance workflow to eliminate reporting barriers while maintaining strict regulatory rigor.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Agent 1 */}
                <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
                  <div className="flex items-center space-x-2 font-bold text-slate-900 text-sm mb-2">
                    <span className="w-6 h-6 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center text-xs">1</span>
                    <span>Reporting & Extraction Agent</span>
                  </div>
                  <p className="text-slate-600 leading-relaxed mb-2">
                    Converts natural language patient narratives and unformatted clinical notes into structured ICH E2B(R3) fields with MedDRA Preferred Term (PT) matching.
                  </p>
                  <span className="text-[10px] font-mono bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                    Endpoint: /api/agents/report-extract
                  </span>
                </div>

                {/* Agent 2 */}
                <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
                  <div className="flex items-center space-x-2 font-bold text-slate-900 text-sm mb-2">
                    <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs">2</span>
                    <span>Validation & Compliance Agent</span>
                  </div>
                  <p className="text-slate-600 leading-relaxed mb-2">
                    Audits report completeness against the 4 mandatory statutory ICH criteria and calculates the Quality Index. Flags missing lot numbers and dechallenge gaps.
                  </p>
                  <span className="text-[10px] font-mono bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                    Endpoint: /api/agents/validate
                  </span>
                </div>

                {/* Agent 3 */}
                <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
                  <div className="flex items-center space-x-2 font-bold text-slate-900 text-sm mb-2">
                    <span className="w-6 h-6 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center text-xs">3</span>
                    <span>Knowledge & Evidence RAG Agent</span>
                  </div>
                  <p className="text-slate-600 leading-relaxed mb-2">
                    Retrieves drug safety monographs, FDA/EMA package inserts, boxed warnings, and peer-reviewed PubMed literature to ground causality in biological plausibility.
                  </p>
                  <span className="text-[10px] font-mono bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                    Endpoint: /api/agents/knowledge-rag
                  </span>
                </div>

                {/* Agent 4 */}
                <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
                  <div className="flex items-center space-x-2 font-bold text-slate-900 text-sm mb-2">
                    <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-xs">4</span>
                    <span>Causality & Signal Agent</span>
                  </div>
                  <p className="text-slate-600 leading-relaxed mb-2">
                    Applies the Naranjo Probability Scale and WHO-UMC criteria step-by-step. Computes Proportional Reporting Ratio (PRR) to flag disproportionate safety signals.
                  </p>
                  <span className="text-[10px] font-mono bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                    Endpoint: /api/agents/causality
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* RESEARCH QUESTIONS TAB */}
          {activeTab === 'research' && (
            <div className="space-y-3">
              <span className="font-bold text-slate-900 block text-sm">
                Project Research Questions (From RESEARCH_NOTEBOOK.md)
              </span>
              
              <div className="space-y-2">
                {[
                  { q: 'RQ1', t: 'How do current ADR reporting systems collect adverse drug reaction information?' },
                  { q: 'RQ2', t: 'What difficulties do patients and healthcare professionals face while reporting ADRs?' },
                  { q: 'RQ3', t: 'What information is commonly missing from ADR reports (e.g. lot number, dechallenge)?' },
                  { q: 'RQ4', t: 'How are submitted ADR reports analyzed by pharmacovigilance professionals?' },
                  { q: 'RQ5', t: 'What AI/ML approaches have already been applied to pharmacovigilance?' },
                  { q: 'RQ6', t: 'Have LLMs and RAG already been used for ADR reporting and analysis?' },
                  { q: 'RQ7', t: 'Have multi-agent systems been applied to pharmacovigilance workflows?' },
                  { q: 'RQ8', t: 'What research gaps remain in human-in-the-loop decision support?' }
                ].map((item, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-start space-x-3">
                    <span className="font-mono font-bold text-sky-700 bg-sky-100 px-2 py-0.5 rounded text-xs">
                      {item.q}
                    </span>
                    <span className="font-medium text-slate-800">{item.t}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* DECISIONS TAB */}
          {activeTab === 'decisions' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <span className="font-mono text-xs font-bold text-sky-700">DEC-001 — Project Mission</span>
                <h4 className="font-bold text-slate-900">Technology Follows Purpose</h4>
                <p className="text-slate-600">
                  APP will focus primarily on improving ADR reporting and pharmacovigilance analysis rather than becoming a random showcase of ungrounded AI technologies.
                </p>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <span className="font-mono text-xs font-bold text-sky-700">DEC-002 — Patient + Professional Dual Focus</span>
                <h4 className="font-bold text-slate-900">End-to-End Safety Workflow</h4>
                <p className="text-slate-600">
                  Supports both the intake side (patients, nurses, doctors, pharmacists generating reports) and the pharmacovigilance side (specialists, safety officers, QPPVs analyzing ICSRs).
                </p>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <span className="font-mono text-xs font-bold text-sky-700">DEC-003 — Progressive AI Architecture</span>
                <h4 className="font-bold text-slate-900">Phased Implementation</h4>
                <p className="text-slate-600">
                  Phase 1 (Intelligent Conversational Reporting) → Phase 2 (RAG & Knowledge Grounding) → Phase 3 (Multi-Agent Causality & Autonomous Validation).
                </p>
              </div>
            </div>
          )}

          {/* PVPI TAB */}
          {activeTab === 'pvpi' && (
            <div className="space-y-4">
              <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl text-amber-900 space-y-2">
                <span className="font-bold text-sm block">Pharmacovigilance Programme of India (PvPI) & WHO Guidelines</span>
                <p className="leading-relaxed">
                  The Indian Pharmacopoeia Commission (IPC), National Coordination Centre for PvPI (Ghaziabad), collaborates with the WHO Collaborating Centre for International Drug Monitoring (Uppsala Monitoring Centre - UMC) to protect public health.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  <span className="font-bold text-slate-900 block mb-1">ICH E2B(R3) Standards</span>
                  <p className="text-slate-600">
                    Electronic data transmission format for Individual Case Safety Reports adopted globally by CDSCO/PvPI, US FDA, and EMA.
                  </p>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  <span className="font-bold text-slate-900 block mb-1">Naranjo & WHO-UMC Causality</span>
                  <p className="text-slate-600">
                    Standard validated decision algorithms evaluating temporal sequence, dechallenge, rechallenge, and competing etiologies.
                  </p>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs">
          <span className="text-slate-500 font-medium">
            Status: Phase 0 Research Foundation Transitioning to Live Prototype
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
};
