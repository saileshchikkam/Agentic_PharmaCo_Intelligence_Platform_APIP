import React, { useState } from 'react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Tabs } from '../ui/Tabs';
import {
  HeartHandshake,
  ShieldCheck,
  Cpu,
  Send,
  Sparkles,
  CheckCircle2,
  Clock,
  ExternalLink,
  ChevronRight,
  User,
  Bot,
} from 'lucide-react';

export const ExperienceModesSection: React.FC = () => {
  const [activeMode, setActiveMode] = useState<'patient' | 'pv' | 'agent'>('patient');

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-teal-500" />
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            05. Three Information-Density Modes
          </h3>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          One cohesive design language adapts into three distinct density modes: <strong>Patient</strong> (calm, conversational, low cognitive load), <strong>Pharmacovigilance</strong> (dense, analytical, high-contrast), and <strong>Agent</strong> (observable, milestone-driven).
        </p>
      </div>

      {/* Mode Switcher */}
      <Tabs
        variant="segmented"
        activeId={activeMode}
        onChange={(id) => setActiveMode(id as 'patient' | 'pv' | 'agent')}
        options={[
          { id: 'patient', label: 'Patient Experience (Calm & Conversational)', icon: <HeartHandshake className="w-3.5 h-3.5" /> },
          { id: 'pv', label: 'PV Professional (High-Density Analysis)', icon: <ShieldCheck className="w-3.5 h-3.5" /> },
          { id: 'agent', label: 'Agent Observability (Observable Milestones)', icon: <Cpu className="w-3.5 h-3.5" /> },
        ]}
      />

      {/* MODE 1: PATIENT EXPERIENCE */}
      {activeMode === 'patient' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Role: <strong className="text-teal-700 dark:text-teal-300">PATIENT</strong></span>
            <span>Density: <strong>Comfortable / Relaxed</strong> (24px Spacing)</span>
          </div>

          <div className="relative rounded-2xl border border-slate-200 dark:border-slate-800 bg-gradient-to-b from-slate-50/80 to-white dark:from-slate-900/80 dark:to-slate-950 p-6 space-y-6">
            {/* Conversation Flow */}
            <div className="space-y-4 max-w-2xl mx-auto">
              {/* Patient Message */}
              <div className="flex items-start gap-3 justify-end">
                <div className="p-4 rounded-2xl rounded-tr-sm bg-teal-600 text-white shadow-sm max-w-md text-sm leading-relaxed">
                  I started taking Lisinopril 10mg three days ago. This morning my upper lip suddenly swelled up and felt tingling, but I can breathe normally.
                </div>
                <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center shrink-0 text-slate-600 dark:text-slate-300 text-xs font-bold">
                  <User className="w-4 h-4" />
                </div>
              </div>

              {/* Assistant Message with Extracted Confirmation Card */}
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-teal-100 dark:bg-teal-900/60 flex items-center justify-center shrink-0 text-teal-700 dark:text-teal-300 text-xs font-bold">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="space-y-3 max-w-lg">
                  <div className="p-4 rounded-2xl rounded-tl-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm text-sm text-slate-800 dark:text-slate-200 leading-relaxed space-y-2">
                    <p>
                      Thank you for sharing this. Facial and lip swelling while on an ACE inhibitor like Lisinopril requires prompt clinical evaluation.
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      I have prepared this adverse event brief for your review before sharing with the safety registry:
                    </p>

                    {/* Extracted Structured Entity Preview */}
                    <div className="p-3 bg-slate-50 dark:bg-slate-900/70 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-2 text-xs">
                      <div className="flex items-center justify-between font-semibold text-slate-700 dark:text-slate-300">
                        <span>Extracted Details</span>
                        <Badge variant="provenance" size="sm">[AI Extracted - Unconfirmed]</Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                        <div><span className="text-slate-400">Suspect Drug:</span> <strong>Lisinopril 10mg</strong></div>
                        <div><span className="text-slate-400">Reaction:</span> <strong>Acute Lip Swelling</strong></div>
                        <div><span className="text-slate-400">Onset:</span> <strong>Day 3 (Acute)</strong></div>
                        <div><span className="text-slate-400">Breathing:</span> <strong>Normal / Intact</strong></div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="primary">Confirm Details</Button>
                    <Button size="sm" variant="secondary">Edit Information</Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating Liquid Glass Input Tray (Apple-like functional contextual surface) */}
            <div className="max-w-2xl mx-auto apip-glass rounded-2xl p-2 flex items-center gap-2">
              <input
                type="text"
                placeholder="Describe any other symptoms or ask a question..."
                className="flex-1 bg-transparent px-3 py-2 text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 outline-none"
              />
              <Button size="sm" variant="primary" leftIcon={<Send className="w-3.5 h-3.5" />}>
                Send
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODE 2: PHARMACOVIGILANCE EXPERIENCE */}
      {activeMode === 'pv' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Role: <strong className="text-sky-700 dark:text-sky-300">PV_PROFESSIONAL</strong></span>
            <span>Density: <strong>High Density / Solid Surfaces</strong> (8px-12px Spacing)</span>
          </div>

          <Card surface="solid" padding="none" className="overflow-hidden">
            <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">
                  ICH E2B(R3) ICSR Safety Registry (Solid High Contrast Table)
                </h4>
                <Badge variant="neutral" size="sm">4 Active Records</Badge>
              </div>
              <span className="text-[11px] text-slate-500">Zero glass applied to clinical records</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="py-2.5 px-4 font-mono">Case ID</th>
                    <th className="py-2.5 px-4">Suspect Drug</th>
                    <th className="py-2.5 px-4">Adverse Reaction (MedDRA LLT)</th>
                    <th className="py-2.5 px-4">Seriousness</th>
                    <th className="py-2.5 px-4 font-mono">Naranjo</th>
                    <th className="py-2.5 px-4 font-mono">PRR Signal</th>
                    <th className="py-2.5 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-normal">
                  <tr className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-2.5 px-4 font-mono font-bold text-teal-700 dark:text-teal-400">PV-2026-AUG-88192</td>
                    <td className="py-2.5 px-4 font-semibold text-slate-900 dark:text-slate-100">Lisinopril 10mg</td>
                    <td className="py-2.5 px-4">Acute Angioedema</td>
                    <td className="py-2.5 px-4"><Badge variant="critical" size="sm">Life-Threatening</Badge></td>
                    <td className="py-2.5 px-4 font-mono font-bold text-emerald-600">+6 (Probable)</td>
                    <td className="py-2.5 px-4 font-mono font-semibold text-amber-600">PRR 3.42</td>
                    <td className="py-2.5 px-4 text-right">
                      <Button size="sm" variant="secondary" className="h-7 text-[11px] px-2.5">Inspect</Button>
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-2.5 px-4 font-mono font-bold text-teal-700 dark:text-teal-400">PV-2026-CIP-91024</td>
                    <td className="py-2.5 px-4 font-semibold text-slate-900 dark:text-slate-100">Ciprofloxacin 500mg</td>
                    <td className="py-2.5 px-4">Achilles Tendon Rupture</td>
                    <td className="py-2.5 px-4"><Badge variant="critical" size="sm">Disability</Badge></td>
                    <td className="py-2.5 px-4 font-mono font-bold text-emerald-600">+7 (Probable)</td>
                    <td className="py-2.5 px-4 font-mono font-semibold text-amber-600">PRR 4.15</td>
                    <td className="py-2.5 px-4 text-right">
                      <Button size="sm" variant="secondary" className="h-7 text-[11px] px-2.5">Inspect</Button>
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-2.5 px-4 font-mono font-bold text-teal-700 dark:text-teal-400">PV-2026-LAM-44018</td>
                    <td className="py-2.5 px-4 font-semibold text-slate-900 dark:text-slate-100">Lamotrigine + Valproate</td>
                    <td className="py-2.5 px-4">Stevens-Johnson Syndrome</td>
                    <td className="py-2.5 px-4"><Badge variant="critical" size="sm">Hospitalization</Badge></td>
                    <td className="py-2.5 px-4 font-mono font-bold text-teal-600">+9 (Definite)</td>
                    <td className="py-2.5 px-4 font-mono font-semibold text-amber-600">PRR 8.90</td>
                    <td className="py-2.5 px-4 text-right">
                      <Button size="sm" variant="secondary" className="h-7 text-[11px] px-2.5">Inspect</Button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* MODE 3: AGENT OBSERVABILITY */}
      {activeMode === 'agent' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Architecture: <strong className="text-indigo-700 dark:text-indigo-300">4-AGENT PIPELINE</strong></span>
            <span>Safety Rule: <strong>Zero Hidden Prompts / Zero CoT Leaked</strong></span>
          </div>

          <Card surface="solid" padding="md" className="space-y-4">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Observable Milestone Pipeline (Transparent Operational State)
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-xl border border-teal-200 dark:border-teal-800 bg-teal-50/40 dark:bg-teal-950/20 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-teal-800 dark:text-teal-300">Agent 1: Reporting</span>
                  <Badge variant="success" size="sm">Completed</Badge>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-300">
                  Extracted 4 statutory criteria from conversational patient dialogue.
                </p>
                <div className="text-[10px] font-mono text-teal-600 dark:text-teal-400">Confidence: 98%</div>
              </div>

              <div className="p-3.5 rounded-xl border border-teal-200 dark:border-teal-800 bg-teal-50/40 dark:bg-teal-950/20 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-teal-800 dark:text-teal-300">Agent 2: Validation</span>
                  <Badge variant="success" size="sm">Completed</Badge>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-300">
                  ICH E2B(R3) schema audit passed. Flagged Expedited 15-Day clock.
                </p>
                <div className="text-[10px] font-mono text-teal-600 dark:text-teal-400">Validity: 100%</div>
              </div>

              <div className="p-3.5 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50/40 dark:bg-indigo-950/20 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-800 dark:text-indigo-300">Agent 3: Knowledge</span>
                  <Badge variant="agent" size="sm">Retrieving RAG</Badge>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-300">
                  Cross-referencing FDA SmPC Boxed Warnings & PubMed literature (PMID 31201).
                </p>
                <div className="text-[10px] font-mono text-indigo-600 dark:text-indigo-400">3 Citations Found</div>
              </div>

              <div className="p-3.5 rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50/40 dark:bg-amber-950/20 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-800 dark:text-amber-300">Agent 4: Analysis</span>
                  <Badge variant="warning" size="sm">Review Req.</Badge>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-300">
                  Naranjo computed +6 (Probable). Awaiting Safety Physician sign-off.
                </p>
                <div className="text-[10px] font-mono text-amber-600 dark:text-amber-400">Human Gate Active</div>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
