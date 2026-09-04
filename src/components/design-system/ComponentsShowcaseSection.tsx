import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { Tabs } from '../ui/Tabs';
import { Badge } from '../ui/Badge';
import { Alert } from '../ui/Alert';
import { ProgressRing } from '../ui/ProgressRing';
import { Modal } from '../ui/Modal';
import { Card } from '../ui/Card';
import {
  Send,
  Search,
  AlertTriangle,
  FileText,
  Activity,
  CheckCircle2,
  Sparkles,
  RefreshCw,
  FolderOpen,
  HelpCircle,
  ExternalLink,
} from 'lucide-react';

export const ComponentsShowcaseSection: React.FC = () => {
  const [segmentedTab, setSegmentedTab] = useState('patient');
  const [pillTab, setPillTab] = useState('active');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [inputValue, setInputValue] = useState('Lisinopril 10mg Oral Tablet');
  const [errorInput, setErrorInput] = useState('');
  const [isLoadingBtn, setIsLoadingBtn] = useState(false);

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-teal-500" />
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            04. Core Clinical Component Primitives
          </h3>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Precision-crafted interactive components implementing Apple-like spatial discipline, Material-compatible accessibility, and APIP clinical semantics.
        </p>
      </div>

      {/* Buttons */}
      <Card surface="solid" padding="md" className="space-y-4">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
          Buttons & Interactive Triggers
        </h4>
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="primary" leftIcon={<Send className="w-4 h-4" />}>
            Primary Action
          </Button>
          <Button variant="secondary" leftIcon={<Search className="w-4 h-4" />}>
            Secondary Action
          </Button>
          <Button variant="elevated" leftIcon={<Activity className="w-4 h-4" />}>
            Elevated Button
          </Button>
          <Button variant="glass" leftIcon={<Sparkles className="w-4 h-4 text-teal-600 dark:text-teal-400" />}>
            Liquid Glass Button
          </Button>
          <Button variant="ghost">Ghost Button</Button>
          <Button variant="danger" leftIcon={<AlertTriangle className="w-4 h-4" />}>
            Critical Safety Action
          </Button>
          <Button
            variant="primary"
            isLoading={isLoadingBtn}
            onClick={() => {
              setIsLoadingBtn(true);
              setTimeout(() => setIsLoadingBtn(false), 2000);
            }}
          >
            {isLoadingBtn ? 'Validating...' : 'Simulate Loading'}
          </Button>
        </div>

        <div className="flex items-center gap-4 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500">
          <span>Sizes:</span>
          <Button size="sm" variant="secondary">Small (32px)</Button>
          <Button size="md" variant="secondary">Medium (40px)</Button>
          <Button size="lg" variant="secondary">Large (48px)</Button>
        </div>
      </Card>

      {/* Inputs & Textareas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card surface="solid" padding="md" className="space-y-4">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Form Inputs & States
          </h4>
          <Input
            label="Suspect Medication (Standard Input)"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
            helperText="Brand or generic substance name"
          />
          <Input
            label="Daily Dose & Frequency (Validation Error State)"
            placeholder="e.g. 10mg once daily"
            value={errorInput}
            onChange={(e) => setErrorInput(e.target.value)}
            error={!errorInput ? 'Dose quantity is mandatory under ICH E2B(R3) guidelines.' : undefined}
          />
        </Card>

        <Card surface="solid" padding="md" className="space-y-4">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Clinical Narrative Textarea
          </h4>
          <Textarea
            label="Adverse Event Description"
            defaultValue="Patient reported sudden onset of acute facial and lip swelling 2 hours after morning ingestion of Lisinopril 10mg. No respiratory distress observed. Spontaneously resolved 24h post-dechallenge."
            helperText="Capture patient words verbatim. De-identification is applied before regulatory routing."
            rows={4}
          />
        </Card>
      </div>

      {/* Tabs & Segmented Controls */}
      <Card surface="solid" padding="md" className="space-y-4">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
          Segmented Controls & Navigation Tabs
        </h4>
        <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">Segmented Switcher (Solid Level 1):</p>
            <Tabs
              variant="segmented"
              activeId={segmentedTab}
              onChange={setSegmentedTab}
              options={[
                { id: 'patient', label: 'Patient Workspace' },
                { id: 'pv', label: 'PV Professional', badge: '14' },
                { id: 'agent', label: 'Agent Observability', badge: 'Active' },
              ]}
            />
          </div>

          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">Liquid Glass Pill Tab (Floating Level 3):</p>
            <Tabs
              variant="glass-pill"
              activeId={pillTab}
              onChange={setPillTab}
              options={[
                { id: 'active', label: 'Active Surveillance' },
                { id: 'archived', label: 'Archived Cases' },
              ]}
            />
          </div>
        </div>
      </Card>

      {/* Semantic Badges & Data Provenance */}
      <Card surface="solid" padding="md" className="space-y-4">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
          Semantic Badges & Data Provenance Tags
        </h4>
        <div className="flex flex-wrap items-center gap-2.5">
          <Badge variant="neutral">Draft Report</Badge>
          <Badge variant="success" dot>Statutory Criteria 4/4 Met</Badge>
          <Badge variant="warning" dot>Potential Disproportionality Signal</Badge>
          <Badge variant="critical" dot>Serious / Expedited 15-Day</Badge>
          <Badge variant="info">WHO-UMC: Probable</Badge>
          <Badge variant="agent">Validation Agent: Auditing</Badge>
          <Badge variant="provenance">[Patient-Reported]</Badge>
          <Badge variant="provenance">[AI-Extracted]</Badge>
          <Badge variant="provenance">[Physician-Confirmed]</Badge>
        </div>
      </Card>

      {/* Alerts & Safety Disclaimers */}
      <div className="space-y-3">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
          Mandatory Safety Disclaimers & Alerts
        </h4>
        <Alert variant="disclaimer" title="Medical Non-Diagnostic Safety Disclaimer">
          APIP Triage Support is an AI-assisted symptom exploration tool designed to assist in preparing for a medical consultation. It does not provide medical diagnoses or prescribe treatment. In an emergency, call local emergency services immediately.
        </Alert>

        <Alert variant="signal" title="Potential Disproportionality Signal Detected">
          Statistical screening flags a higher-than-expected reporting rate for Lisinopril + Angioedema (PRR = 3.42, χ² = 28.64). A disproportionality signal does not prove causality or indicate that the medication is unsafe; it warrants formal clinical review and medical safety officer evaluation.
        </Alert>
      </div>

      {/* Progress & Quality Gauges */}
      <Card surface="solid" padding="md" className="space-y-4">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
          Progress & Completeness Indicators
        </h4>
        <div className="flex flex-wrap items-center justify-around gap-6 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50">
          <ProgressRing percentage={96} label="E2B Completeness" variant="primary" />
          <ProgressRing percentage={100} label="Statutory Validity" variant="success" />
          <ProgressRing percentage={74} label="Literature Confidence" variant="warning" />
          <ProgressRing percentage={32} label="Missing Lab Data" variant="critical" />
        </div>
      </Card>

      {/* Loading, Empty, and Error States */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Loading Skeleton */}
        <Card surface="solid" padding="md" className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            <span>Loading State (Skeleton)</span>
          </div>
          <div className="space-y-2 animate-pulse">
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
            <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-full" />
            <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-5/6" />
          </div>
        </Card>

        {/* Empty State */}
        <Card surface="solid" padding="md" className="space-y-2 text-center flex flex-col items-center justify-center">
          <FolderOpen className="w-8 h-8 text-slate-400 mb-1" />
          <h5 className="text-xs font-bold text-slate-800 dark:text-slate-200">No Flagged Signals</h5>
          <p className="text-[11px] text-slate-500">All current substance-event pairs fall below screening thresholds.</p>
        </Card>

        {/* Error State with Recovery */}
        <Card surface="solid" padding="md" className="space-y-2 border-rose-200 dark:border-rose-900/60 bg-rose-50/30 dark:bg-rose-950/20">
          <div className="flex items-center gap-1.5 text-xs font-bold text-rose-700 dark:text-rose-400">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>E2B Export Error</span>
          </div>
          <p className="text-[11px] text-rose-800 dark:text-rose-300">
            Reporter qualification code is missing in ICSR header.
          </p>
          <Button size="sm" variant="secondary" className="text-xs mt-1">
            Resolve in Inspector
          </Button>
        </Card>
      </div>

      {/* Interactive Level 5 Modal Trigger */}
      <Card surface="elevated" padding="md" className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            Level 5 Overlay: Case Inspector Modal
          </h4>
          <p className="text-xs text-slate-500 mt-0.5">
            Demonstrates modal surface elevation above backdrop blur without background bleed.
          </p>
        </div>
        <Button variant="primary" onClick={() => setIsModalOpen(true)}>
          Launch Inspector Modal
        </Button>
      </Card>

      {/* Modal Instance */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="ICSR Case Inspector — PV-2026-AUG-88192"
        subtitle="ICH E2B(R3) Individual Case Safety Report"
      >
        <div className="space-y-4 text-xs text-slate-700 dark:text-slate-300">
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-1.5 font-mono text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Suspect Medication:</span>
              <span className="font-semibold text-slate-900 dark:text-slate-100">Lisinopril 10mg PO Daily</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Adverse Reaction:</span>
              <span className="font-semibold text-rose-600 dark:text-rose-400">Acute Angioedema (Life-Threatening)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Causality (Naranjo):</span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">+6 (Probable)</span>
            </div>
          </div>
          <Alert variant="disclaimer">
            This modal illustrates Level 5 surface elevation. The backdrop blur isolates user focus for high-stakes regulatory decisions.
          </Alert>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" size="sm" onClick={() => setIsModalOpen(false)}>
              Dismiss
            </Button>
            <Button variant="primary" size="sm" onClick={() => setIsModalOpen(false)}>
              Confirm Sign-Off
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
