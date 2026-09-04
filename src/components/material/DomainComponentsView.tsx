import React, { useState } from 'react';
import {
  PatientContextHeader,
  HealthProfileSummary,
  HealthcareRecommendation,
  HealthExperienceEntry,
} from './domain/patient';
import {
  MedicationCard,
  MedicationSummary,
  MedicationChip,
  MedicationContextBlock,
  MedicationStatus,
} from './domain/medication';
import { HealthTimeline } from './domain/timeline';
import {
  AdrExperienceCard,
  AdrEventEntry,
  AdrCompleteness,
  AdrReportSummary,
  AdrClarificationRequest,
  AdrSubmissionSummary,
  AdrReviewStatus,
} from './domain/adr';
import {
  ReviewRequiredBanner,
  HumanReviewStatus,
  SafetyInformationBlock,
  ReviewActionGroup,
  ReviewSummary,
} from './domain/safety';
import {
  PvCaseCard,
  PvCaseStatus,
  PvCaseMetadata,
  PvValidationSummary,
  PvCaseActivity,
  PvHumanDecisionArea,
  PvReviewPanel,
} from './domain/pv';
import {
  EvidenceItem,
  EvidenceSource,
  EvidenceSummary,
  EvidenceStatus,
} from './domain/evidence';
import {
  WorkflowProgress,
  WorkflowStep,
} from './domain/workflow';
import {
  PatientHealthProfile,
  PatientMedication,
  HealthTimelineEvent,
  AdrExperienceModel,
  PvCaseModel,
  ValidationCheckItem,
  EvidenceRecordModel,
  WorkflowStepItem,
} from './domain/types';
import { M3Card } from './core/M3Card';
import { M3Button } from './core/M3Button';
import { M3Chip } from './core/M3Chip';

interface DomainComponentsViewProps {
  isDark: boolean;
  onToggleTheme: () => void;
}

type SectionKey = 'all' | 'patient' | 'medication' | 'timeline' | 'adr' | 'safety' | 'pv' | 'evidence' | 'workflow';

export const DomainComponentsView: React.FC<DomainComponentsViewProps> = ({
  isDark,
  onToggleTheme,
}) => {
  const [activeSection, setActiveSection] = useState<SectionKey>('all');
  const [interactiveNotice, setInteractiveNotice] = useState<string | null>(null);

  // Mock domain datasets
  const mockPatientProfile: PatientHealthProfile = {
    id: 'pt-001',
    initials: 'J.D.',
    age: '54 years',
    gender: 'Female',
    knownConditions: ['Type 2 Diabetes', 'Essential Hypertension', 'Mild Osteoarthritis'],
    allergies: ['Penicillin (reported rash)', 'Sulfa drugs (hives)'],
    activeMedicationsCount: 3,
    lastUpdated: '04 Sep 2026',
  };

  const mockMedications: PatientMedication[] = [
    {
      id: 'med-1',
      name: 'Amoxicillin',
      dosage: '500 mg',
      frequency: 'Twice daily with meals',
      route: 'Oral capsule',
      indication: 'Acute bacterial rhinosinusitis',
      startedDate: '3 days ago (01 Sep 2026)',
      status: 'active',
      lotNumber: 'LOT-2026-981',
      prescribedBy: 'Dr. Sarah Lin, MD',
    },
    {
      id: 'med-2',
      name: 'Lisinopril',
      dosage: '10 mg',
      frequency: 'Once daily in the morning',
      route: 'Oral tablet',
      indication: 'Essential hypertension maintenance',
      startedDate: '14 Feb 2025',
      status: 'active',
    },
    {
      id: 'med-3',
      name: 'Azithromycin',
      dosage: '250 mg',
      frequency: 'Once daily for 5 days',
      route: 'Oral tablet',
      indication: 'Upper respiratory infection',
      startedDate: '10 May 2026',
      stoppedDate: '15 May 2026',
      status: 'completed',
    },
  ];

  const mockTimelineEvents: HealthTimelineEvent[] = [
    {
      id: 'evt-1',
      type: 'symptom',
      date: 'Today, 09:30 AM',
      title: 'Symptom Reported',
      subtitle: 'Mild cutaneous erythema with pruritus',
      description: 'Noticed bilateral forearm rash developing approximately 48 hours after beginning antibiotic regimen.',
      badgeText: 'PATIENT LOG',
    },
    {
      id: 'evt-2',
      type: 'medication',
      date: '01 Sep 2026, 08:00 AM',
      title: 'Medication Started',
      subtitle: 'Amoxicillin 500 mg oral capsule',
      description: 'Course initiated for acute bacterial rhinosinusitis. Prescribed twice daily for 7 days.',
      status: 'Batch LOT-2026-981',
    },
    {
      id: 'evt-3',
      type: 'healthcare',
      date: '31 Aug 2026, 02:15 PM',
      title: 'Healthcare Visit Recorded',
      subtitle: 'Outpatient Clinic Examination',
      description: 'Prescription written by Dr. Sarah Lin following diagnosis of acute sinus inflammation.',
      status: 'Documented',
    },
    {
      id: 'evt-4',
      type: 'adr',
      date: '28 Aug 2026',
      title: 'Possible Reaction Logged',
      subtitle: 'Transient gastric discomfort (historical)',
      description: 'Reported mild nausea following NSAID administration. Dechallenge positive upon discontinuation.',
      badgeText: 'PRIOR ICSR',
    },
  ];

  const mockAdrExperience: AdrExperienceModel = {
    id: 'adr-exp-101',
    title: 'Possible Medication Reaction',
    reportedReaction: 'Cutaneous Maculopapular Rash',
    suspectMedication: 'Amoxicillin',
    dosage: '500 mg BID',
    firstNoticed: '2 days after starting antibiotic (03 Sep 2026)',
    reviewState: 'ready_for_review',
    reportedSeverity: 'Moderate (localized itching & redness)',
    outcome: 'Improving after holding current morning dose',
    narrative: 'Patient noticed reddish patchy eruption across both forearms accompanied by pruritus, starting approximately 48 hours following first dose of Amoxicillin 500 mg.',
    clarificationPrompt: 'More information may help complete your report.',
    clarificationField: 'Approximate time of onset',
    completenessItems: [
      { key: 'patient', label: 'Identifiable Patient', isComplete: true, value: 'Initial J.D., 54F' },
      { key: 'reporter', label: 'Reporter Information', isComplete: true, value: 'Self-reported consumer' },
      { key: 'drug', label: 'Suspect Medicinal Product', isComplete: true, value: 'Amoxicillin 500 mg oral' },
      { key: 'event', label: 'Adverse Reaction / Event', isComplete: true, value: 'Maculopapular rash' },
      { key: 'timing', label: 'Event Chronology & Onset', isComplete: true, value: 'Onset Day 2 post start' },
      { key: 'concomitants', label: 'Concomitant Medications', isComplete: true, value: 'Lisinopril 10 mg' },
      { key: 'lot', label: 'Manufacturer Batch / Lot', isComplete: false },
    ],
  };

  const mockPvCase: PvCaseModel = {
    id: 'case-pv-2026-00124',
    caseNumber: 'APIP-2026-00124',
    dateReported: '04 Sep 2026',
    lastUpdated: '04 Sep 2026, 11:20 UTC',
    reportedReaction: 'Erythematous Maculopapular Rash',
    suspectMedicine: 'Amoxicillin',
    dosage: '500 mg BID',
    patientDemographics: '54y Female • US',
    reporterType: 'Patient / Consumer',
    status: 'under_review',
    seriousness: 'Non-serious (Medically Important)',
    e2bCompliant: true,
  };

  const mockValidationItems: ValidationCheckItem[] = [
    { id: 'v1', label: 'Identifiable Patient Demographics', status: 'complete', detail: 'Age 54, Female, US' },
    { id: 'v2', label: 'Primary Reporter Credentials', status: 'complete', detail: 'Direct consumer intake' },
    { id: 'v3', label: 'Suspect Medicinal Product Name & Regimen', status: 'complete', detail: 'Amoxicillin 500 mg oral' },
    { id: 'v4', label: 'Reported Adverse Reaction Term', status: 'complete', detail: 'MedDRA PT: Rash maculo-papular' },
    { id: 'v5', label: 'Dechallenge / Treatment Cessation Detail', status: 'complete', detail: 'Positive dechallenge documented' },
    { id: 'v6', label: 'Manufacturing Batch / Lot Number', status: 'needs_review', detail: 'Awaiting container photograph or pharmacy receipt' },
  ];

  const mockEvidenceRecords: EvidenceRecordModel[] = [
    {
      id: 'ev-1',
      substance: 'Amoxicillin',
      eventTerm: 'Rash maculopapular',
      sourceType: 'Peer-Reviewed Literature',
      sourceTitle: 'Aminopenicillin-Associated Cutaneous Eruptions in Adults: Incidence and Latency Analysis',
      retrievedDate: '04 Sep 2026',
      summaryText: 'Clinical studies document a 3% to 8% incidence of delayed non-allergic maculopapular rash emerging between days 2 and 7 of aminopenicillin administration.',
      status: 'corroborated',
    },
    {
      id: 'ev-2',
      substance: 'Amoxicillin',
      eventTerm: 'Erythema multiforme vs. simple exanthem',
      sourceType: 'FDA Prescribing Information',
      sourceTitle: 'Amoxicillin Prescribing Information — Adverse Reactions Section 6.1',
      retrievedDate: '04 Sep 2026',
      summaryText: 'Skin and Subcutaneous Disorders: Erythematous maculopapular rashes and urticaria have been reported. Mild reactions may be controlled with antihistamines.',
      status: 'reference_available',
    },
  ];

  const mockWorkflowSteps: WorkflowStepItem[] = [
    { id: 'ws-1', stepNumber: 1, label: 'Patient Intake', state: 'completed', description: 'Narrative & timing captured' },
    { id: 'ws-2', stepNumber: 2, label: 'Medication Context', state: 'completed', description: 'Suspect drug aligned' },
    { id: 'ws-3', stepNumber: 3, label: 'Safety Validation', state: 'current', description: 'ICH E2B(R3) field verification' },
    { id: 'ws-4', stepNumber: 4, label: 'Literature Corroboration', state: 'review', description: 'Evidence synthesis' },
    { id: 'ws-5', stepNumber: 5, label: 'Human Review & Sign-Off', state: 'human_approval', description: 'Reviewer determination' },
  ];

  const mockCaseActivities = [
    {
      id: 'act-1',
      timestamp: '04 Sep 2026, 09:42 UTC',
      author: 'Patient Self-Service Gateway',
      action: 'Adverse Reaction Staged',
      role: 'Direct Consumer',
      note: 'Narrative recorded with timing details relative to start of course.',
    },
    {
      id: 'act-2',
      timestamp: '04 Sep 2026, 10:15 UTC',
      author: 'Triage Safety Officer (Elena Rostova)',
      action: 'Initial Case Validation Completed',
      role: 'Pharmacovigilance Associate',
      note: 'Minimum ICSR reporting elements verified. MedDRA PT coded to Rash maculo-papular.',
    },
    {
      id: 'act-3',
      timestamp: '04 Sep 2026, 11:20 UTC',
      author: 'Elena Vance, RPh',
      action: 'Assigned for Reviewer Evaluation',
      role: 'Lead PV Reviewer',
      note: 'Literature cross-check requested regarding dechallenge timeline.',
    },
  ];

  const showFeedback = (msg: string) => {
    setInteractiveNotice(msg);
    setTimeout(() => setInteractiveNotice(null), 3500);
  };

  return (
    <div id="domain-components-view" className="space-y-12 pb-16 animate-fade-in w-full max-w-[1400px] mx-auto">
      {/* Header & Laboratory Toolbar */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[var(--md-sys-color-outline-variant)]/60 pb-6">
        <div>
          <span className="text-xs font-medium text-[var(--md-sys-color-on-surface-variant)] block">
            Phase 1 • Step 2 • Pass B
          </span>
          <h1 className="m3-headline-medium text-[var(--md-sys-color-on-surface)] mt-1 font-semibold">
            APIP Domain Component System
          </h1>
          <p className="m3-body-medium text-[var(--md-sys-color-on-surface-variant)] mt-1.5 max-w-2xl leading-relaxed">
            Healthcare-specific Material 3 component compositions for patient assistance, adverse drug reaction intake, and human-in-the-loop pharmacovigilance decision support.
          </p>
        </div>

        {/* Theme Toggle & Controls */}
        <div className="flex items-center gap-3 shrink-0">
          <M3Button
            id="btn-domain-theme-toggle"
            variant="tonal"
            label={isDark ? 'Light theme' : 'Dark theme'}
            leadingIcon={isDark ? 'light_mode' : 'dark_mode'}
            onClick={onToggleTheme}
          />
        </div>
      </div>

      {/* Domain Family Jump Bar */}
      <div className="p-3.5 rounded-2xl bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)]/40 space-y-2">
        <span className="text-xs font-semibold text-[var(--md-sys-color-on-surface)] block">
          Component Family Index
        </span>
        <div className="flex flex-wrap gap-2">
          {[
            { key: 'all', label: 'Show All Families' },
            { key: 'patient', label: 'Patient Components' },
            { key: 'medication', label: 'Medication Components' },
            { key: 'timeline', label: 'Health Timeline' },
            { key: 'adr', label: 'ADR Intake & Reporting' },
            { key: 'safety', label: 'Safety & Human Review' },
            { key: 'pv', label: 'PV Case Console' },
            { key: 'evidence', label: 'Evidence & Literature' },
            { key: 'workflow', label: 'Workflow & Steppers' },
          ].map((sec) => (
            <M3Chip
              key={sec.key}
              id={`filter-${sec.key}`}
              type="filter"
              label={sec.label}
              selected={activeSection === sec.key}
              onClick={() => setActiveSection(sec.key as SectionKey)}
            />
          ))}
        </div>
      </div>

      {/* Interactive feedback toast */}
      {interactiveNotice && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-xl bg-[var(--md-sys-color-inverse-surface)] text-[var(--md-sys-color-inverse-on-surface)] shadow-lg text-xs font-medium flex items-center gap-2 animate-fade-in border border-[var(--md-sys-color-outline-variant)]/30">
          <span className="material-symbols-outlined text-sm">info</span>
          {interactiveNotice}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. PATIENT COMPONENTS */}
      {/* ========================================================================= */}
      {(activeSection === 'all' || activeSection === 'patient') && (
        <section id="section-patient" className="space-y-6 scroll-mt-20">
          <div className="border-b border-[var(--md-sys-color-outline-variant)]/40 pb-2">
            <span className="text-xs font-medium text-[var(--md-sys-color-on-surface-variant)] block">
              Domain Family • Patient health space
            </span>
            <h2 className="text-xl font-semibold text-[var(--md-sys-color-on-surface)] mt-0.5">
              Patient Components
            </h2>
            <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] mt-0.5">
              Supportive, restrained patient health space components. Non-diagnostic, calm, and privacy-conscious.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: Context Header + Narrative Intake */}
            <div className="lg:col-span-7 space-y-6">
              <PatientContextHeader />
              <div>
                <span className="text-xs font-medium text-[var(--md-sys-color-on-surface-variant)] block mb-2">
                  Patient narrative intake
                </span>
                <HealthExperienceEntry
                  onSubmitExperience={(data) => showFeedback(`Intake received: "${data.narrative.slice(0, 30)}..." (${data.timing})`)}
                />
              </div>
            </div>

            {/* Right Column: Health Profile + Healthcare Recommendation */}
            <div className="lg:col-span-5 space-y-6">
              <div>
                <span className="text-xs font-medium text-[var(--md-sys-color-on-surface-variant)] block mb-2">
                  Health profile context
                </span>
                <HealthProfileSummary
                  profile={mockPatientProfile}
                  onEditProfile={() => showFeedback('Triggered Edit Health Profile modal')}
                />
              </div>

              <div>
                <span className="text-xs font-medium text-[var(--md-sys-color-on-surface-variant)] block mb-2">
                  Non-diagnostic clinical guidance
                </span>
                <HealthcareRecommendation
                  onAction={() => showFeedback('Opening clinical consultation assistance')}
                  secondaryActionLabel="Review symptom warning signs"
                  onSecondaryAction={() => showFeedback('Displaying emergency triage warning signs')}
                />
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* 2. MEDICATION COMPONENTS */}
      {/* ========================================================================= */}
      {(activeSection === 'all' || activeSection === 'medication') && (
        <section id="section-medication" className="space-y-6 scroll-mt-20">
          <div className="border-b border-[var(--md-sys-color-outline-variant)]/40 pb-2">
            <span className="text-xs font-medium text-[var(--md-sys-color-on-surface-variant)] block">
              Domain Family • Medication information & status
            </span>
            <h2 className="text-xl font-semibold text-[var(--md-sys-color-on-surface)] mt-0.5">
              Medication Components
            </h2>
            <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] mt-0.5">
              Scannable prescription cards, context blocks, and semantic status indicators without KPI metric tropes.
            </p>
          </div>

          <div className="space-y-6">
            {/* Status Guide */}
            <div>
              <span className="text-xs font-medium text-[var(--md-sys-color-on-surface-variant)] block mb-2">
                Semantic medication status guide
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 p-3.5 rounded-xl bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)]/30">
                <div className="p-2.5 rounded-lg bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)]/20">
                  <MedicationStatus status="active" showDescription />
                </div>
                <div className="p-2.5 rounded-lg bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)]/20">
                  <MedicationStatus status="completed" showDescription />
                </div>
                <div className="p-2.5 rounded-lg bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)]/20">
                  <MedicationStatus status="paused" showDescription />
                </div>
                <div className="p-2.5 rounded-lg bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)]/20">
                  <MedicationStatus status="discontinued" showDescription />
                </div>
                <div className="p-2.5 rounded-lg bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)]/20">
                  <MedicationStatus status="unknown" showDescription />
                </div>
              </div>
            </div>

            {/* Context Block */}
            <MedicationContextBlock
              medicationName="Amoxicillin"
              dosage="500 mg"
              frequencyRoute="Twice daily • Oral capsule (LOT-2026-981)"
              onChangeMedication={() => showFeedback('Open medication selection dialog')}
            />

            {/* Medication Cards Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <div className="lg:col-span-6">
                <span className="text-xs font-medium text-[var(--md-sys-color-on-surface-variant)] block mb-2">
                  Detailed prescription card
                </span>
                <MedicationCard
                  medication={mockMedications[0]}
                  onViewDetails={(m) => showFeedback(`Viewing monograph for ${m.name}`)}
                  onReportReaction={(m) => showFeedback(`Reporting reaction for ${m.name}`)}
                />
              </div>

              <div className="lg:col-span-6 space-y-4">
                <span className="text-xs font-medium text-[var(--md-sys-color-on-surface-variant)] block mb-2">
                  Medication summaries & selection chips
                </span>
                <MedicationSummary medication={mockMedications[1]} />
                <MedicationSummary medication={mockMedications[2]} />

                <div className="p-3.5 rounded-xl bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)]/30 space-y-2">
                  <span className="text-xs font-medium text-[var(--md-sys-color-on-surface-variant)] block">
                    Quick filter selection
                  </span>
                  <div className="flex flex-wrap gap-2">
                    <MedicationChip medication={mockMedications[0]} selected />
                    <MedicationChip medication={mockMedications[1]} />
                    <MedicationChip medication={mockMedications[2]} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* 3. HEALTH TIMELINE COMPONENTS */}
      {/* ========================================================================= */}
      {(activeSection === 'all' || activeSection === 'timeline') && (
        <section id="section-timeline" className="space-y-6 scroll-mt-20">
          <div className="border-b border-[var(--md-sys-color-outline-variant)]/40 pb-2">
            <span className="text-xs font-medium text-[var(--md-sys-color-on-surface-variant)] block">
              Domain Family • Health chronology & timeline
            </span>
            <h2 className="text-xl font-semibold text-[var(--md-sys-color-on-surface)] mt-0.5">
              Health Chronology & Timeline
            </h2>
            <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] mt-0.5">
              Sequential medication courses, symptom experiences, and healthcare appointments. Restrained M3 tokens with no glowing connectors.
            </p>
          </div>

          <HealthTimeline
            events={mockTimelineEvents}
            onSelectEvent={(e) => showFeedback(`Selected timeline event: ${e.title} (${e.date})`)}
          />
        </section>
      )}

      {/* ========================================================================= */}
      {/* 4. ADR COMPONENTS */}
      {/* ========================================================================= */}
      {(activeSection === 'all' || activeSection === 'adr') && (
        <section id="section-adr" className="space-y-6 scroll-mt-20">
          <div className="border-b border-[var(--md-sys-color-outline-variant)]/40 pb-2">
            <span className="text-xs font-medium text-[var(--md-sys-color-on-surface-variant)] block">
              Domain Family • Adverse drug reaction intake & review
            </span>
            <h2 className="text-xl font-semibold text-[var(--md-sys-color-on-surface)] mt-0.5">
              Adverse Drug Reaction (ADR) Components
            </h2>
            <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] mt-0.5">
              Form completeness, experience summaries, structured event intake, and supportive follow-up clarification.
            </p>
          </div>

          <div className="space-y-6">
            {/* ADR Workflow States Guide */}
            <div>
              <span className="text-xs font-medium text-[var(--md-sys-color-on-surface-variant)] block mb-2">
                Workflow review status guide
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 p-3.5 rounded-xl bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)]/30">
                <div className="p-2 rounded-lg bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)]/20">
                  <AdrReviewStatus state="draft" showExplanation />
                </div>
                <div className="p-2 rounded-lg bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)]/20">
                  <AdrReviewStatus state="incomplete" showExplanation />
                </div>
                <div className="p-2 rounded-lg bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)]/20">
                  <AdrReviewStatus state="ready_for_review" showExplanation />
                </div>
                <div className="p-2 rounded-lg bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)]/20">
                  <AdrReviewStatus state="under_review" showExplanation />
                </div>
                <div className="p-2 rounded-lg bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)]/20">
                  <AdrReviewStatus state="needs_clarification" showExplanation />
                </div>
                <div className="p-2 rounded-lg bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)]/20">
                  <AdrReviewStatus state="reviewed" showExplanation />
                </div>
                <div className="p-2 rounded-lg bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)]/20 sm:col-span-2 lg:col-span-2">
                  <AdrReviewStatus state="submitted" showExplanation />
                </div>
              </div>
            </div>

            {/* 2-Column: Event Entry + Supportive Clarification on Left, Experience Card + Completeness on Right */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <div className="lg:col-span-7 space-y-6">
                <div>
                  <span className="text-xs font-medium text-[var(--md-sys-color-on-surface-variant)] block mb-2">
                    Structured event intake
                  </span>
                  <AdrEventEntry
                    medicationName="Amoxicillin 500 mg"
                    onSaveEvent={(data) => showFeedback(`Saved event details: ${data.severity} severity, ${data.outcomeStatus}`)}
                  />
                </div>

                <div>
                  <span className="text-xs font-medium text-[var(--md-sys-color-on-surface-variant)] block mb-2">
                    Supportive follow-up clarification
                  </span>
                  <AdrClarificationRequest
                    prompt="Additional timing detail helps clarify whether symptoms occurred immediately or after several doses."
                    question="When did the cutaneous rash first become noticeable?"
                    fieldLabel="Approximate timing / date"
                    onSaveClarification={(val) => showFeedback(`Recorded clarification: "${val}"`)}
                  />
                </div>
              </div>

              <div className="lg:col-span-5 space-y-6">
                <div>
                  <span className="text-xs font-medium text-[var(--md-sys-color-on-surface-variant)] block mb-2">
                    Experience overview
                  </span>
                  <AdrExperienceCard
                    experience={mockAdrExperience}
                    onReview={(exp) => showFeedback(`Reviewing ADR experience: ${exp.reportedReaction}`)}
                    onEdit={(exp) => showFeedback(`Editing ADR experience: ${exp.reportedReaction}`)}
                  />
                </div>

                <div>
                  <span className="text-xs font-medium text-[var(--md-sys-color-on-surface-variant)] block mb-2">
                    Required elements completeness
                  </span>
                  <AdrCompleteness items={mockAdrExperience.completenessItems} />
                </div>
              </div>
            </div>

            {/* Report Summary & Submission Prepared Confirmation */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start pt-2">
              <div>
                <span className="text-xs font-medium text-[var(--md-sys-color-on-surface-variant)] block mb-2">
                  Pre-submission review summary
                </span>
                <AdrReportSummary
                  report={mockAdrExperience}
                  onEdit={() => showFeedback('Returning to step 1 edit')}
                  onReview={() => showFeedback('Proceeding to clinical review staging')}
                  onSaveDraft={() => showFeedback('Draft saved locally')}
                />
              </div>

              <div>
                <span className="text-xs font-medium text-[var(--md-sys-color-on-surface-variant)] block mb-2">
                  Prepared report confirmation
                </span>
                <AdrSubmissionSummary
                  report={mockAdrExperience}
                  submissionReference="APIP-2026-00124"
                  submissionDate="04 Sep 2026"
                  onDone={() => showFeedback('Returning to primary health space')}
                  onPrintOrExport={() => showFeedback('Exporting ICH E2B(R3) record summary')}
                />
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* 5. SAFETY & HUMAN REVIEW COMPONENTS */}
      {/* ========================================================================= */}
      {(activeSection === 'all' || activeSection === 'safety') && (
        <section id="section-safety" className="space-y-6 scroll-mt-20">
          <div className="border-b border-[var(--md-sys-color-outline-variant)]/40 pb-2">
            <span className="text-xs font-medium text-[var(--md-sys-color-on-surface-variant)] block">
              Domain Family • Safety & human-in-the-loop review
            </span>
            <h2 className="text-xl font-semibold text-[var(--md-sys-color-on-surface)] mt-0.5">
              Safety & Human-in-the-Loop Components
            </h2>
            <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] mt-0.5">
              Restrained notices ensuring human clinical decision-making. No alarming red error styling or false AI autonomous certainty.
            </p>
          </div>

          <div className="space-y-6">
            {/* Review Required Banner */}
            <ReviewRequiredBanner
              onAction={() => showFeedback('Opening case review console')}
            />

            {/* Human Review States Guide */}
            <div>
              <span className="text-xs font-medium text-[var(--md-sys-color-on-surface-variant)] block mb-2">
                Human review workflow status guide
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 p-3.5 rounded-xl bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)]/30">
                <div className="p-2.5 rounded-lg bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)]/20">
                  <HumanReviewStatus state="awaiting_review" showExplanation />
                </div>
                <div className="p-2.5 rounded-lg bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)]/20">
                  <HumanReviewStatus state="under_review" reviewerName="Elena Vance, RPh" showExplanation />
                </div>
                <div className="p-2.5 rounded-lg bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)]/20">
                  <HumanReviewStatus state="reviewer_requested_clarification" showExplanation />
                </div>
                <div className="p-2.5 rounded-lg bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)]/20">
                  <HumanReviewStatus state="reviewed" reviewerName="Elena Vance, RPh" showExplanation />
                </div>
              </div>
            </div>

            {/* Regulatory Block & Review Actions Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <div className="lg:col-span-6 space-y-4">
                <span className="text-xs font-medium text-[var(--md-sys-color-on-surface-variant)] block mb-2">
                  Safety information framework
                </span>
                <SafetyInformationBlock />
                <ReviewActionGroup
                  onRequestClarification={() => showFeedback('Routing request to reporter')}
                  onFlagForInvestigation={() => showFeedback('Flagged for Pharmacovigilance Safety Committee review')}
                  onApproveSignOff={() => showFeedback('Sign-off recorded and committed to audit log')}
                />
              </div>

              <div className="lg:col-span-6 space-y-4">
                <span className="text-xs font-medium text-[var(--md-sys-color-on-surface-variant)] block mb-2">
                  Clinical review record
                </span>
                <ReviewSummary
                  caseNumber="APIP-2026-00124"
                  reviewState="reviewed"
                />
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* 6. PV PROFESSIONAL COMPONENTS */}
      {/* ========================================================================= */}
      {(activeSection === 'all' || activeSection === 'pv') && (
        <section id="section-pv" className="space-y-6 scroll-mt-20">
          <div className="border-b border-[var(--md-sys-color-outline-variant)]/40 pb-2">
            <span className="text-xs font-medium text-[var(--md-sys-color-on-surface-variant)] block">
              Domain Family • Pharmacovigilance case management
            </span>
            <h2 className="text-xl font-semibold text-[var(--md-sys-color-on-surface)] mt-0.5">
              Pharmacovigilance (PV) Professional Components
            </h2>
            <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] mt-0.5">
              Professional case cards, ICH E2B validation checklists, case activity audit trails, and human sign-off areas.
            </p>
          </div>

          <div className="space-y-6">
            {/* PV Case Console Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left: Case Card + Case Activity Audit Trail */}
              <div className="lg:col-span-6 space-y-6">
                <div>
                  <span className="text-xs font-medium text-[var(--md-sys-color-on-surface-variant)] block mb-2">
                    Case summary card
                  </span>
                  <PvCaseCard
                    caseItem={mockPvCase}
                    onOpenCase={(c) => showFeedback(`Opening case console for #${c.caseNumber}`)}
                  />
                </div>

                <div>
                  <span className="text-xs font-medium text-[var(--md-sys-color-on-surface-variant)] block mb-2">
                    Case activity audit trail
                  </span>
                  <PvCaseActivity activities={mockCaseActivities} />
                </div>
              </div>

              {/* Right: Validation Summary + Human Decision Area */}
              <div className="lg:col-span-6 space-y-6">
                <div>
                  <span className="text-xs font-medium text-[var(--md-sys-color-on-surface-variant)] block mb-2">
                    ICH E2B(R3) data validation
                  </span>
                  <PvValidationSummary
                    items={mockValidationItems}
                    onViewMissing={() => showFeedback('Filtering view for missing Lot number')}
                  />
                </div>

                <div>
                  <span className="text-xs font-medium text-[var(--md-sys-color-on-surface-variant)] block mb-2">
                    Human sign-off & disposition
                  </span>
                  <PvHumanDecisionArea
                    caseNumber={mockPvCase.caseNumber}
                    onCommitDecision={(dec) => showFeedback(`Committed ${dec.decisionType} by ${dec.reviewerName}`)}
                  />
                </div>
              </div>
            </div>

            {/* Comprehensive Review Panel */}
            <div className="pt-2">
              <span className="text-xs font-medium text-[var(--md-sys-color-on-surface-variant)] block mb-2">
                Full-featured PV review console panel
              </span>
              <PvReviewPanel
                caseData={mockPvCase}
              />
            </div>
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* 7. EVIDENCE COMPONENTS */}
      {/* ========================================================================= */}
      {(activeSection === 'all' || activeSection === 'evidence') && (
        <section id="section-evidence" className="space-y-6 scroll-mt-20">
          <div className="border-b border-[var(--md-sys-color-outline-variant)]/40 pb-2">
            <span className="text-xs font-medium text-[var(--md-sys-color-on-surface-variant)] block">
              Domain Family • Scientific evidence & product labeling
            </span>
            <h2 className="text-xl font-semibold text-[var(--md-sys-color-on-surface)] mt-0.5">
              Scientific Evidence & Literature Corroboration
            </h2>
            <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] mt-0.5">
              Structured peer-reviewed scientific citations and official product information monographs (FDA PI / EMA SmPC). Free of conversational AI chatbot tropes.
            </p>
          </div>

          <div className="space-y-6">
            {/* Status Guide */}
            <div>
              <span className="text-xs font-medium text-[var(--md-sys-color-on-surface-variant)] block mb-2">
                Evidence assessment status guide
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-xl bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)]/30">
                <div className="p-2.5 rounded-lg bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)]/20">
                  <EvidenceStatus status="reference_available" />
                </div>
                <div className="p-2.5 rounded-lg bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)]/20">
                  <EvidenceStatus status="corroborated" />
                </div>
                <div className="p-2.5 rounded-lg bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)]/20">
                  <EvidenceStatus status="under_assessment" />
                </div>
              </div>
            </div>

            {/* 2-Column: Peer-reviewed Study vs Official Product Information */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
              <div>
                <span className="text-xs font-medium text-[var(--md-sys-color-on-surface-variant)] block mb-2">
                  Peer-reviewed biomedical literature
                </span>
                <EvidenceItem
                  evidence={mockEvidenceRecords[0]}
                  onViewSource={(ev) => showFeedback(`Opening external citation: ${ev.sourceTitle}`)}
                />
              </div>

              <div>
                <span className="text-xs font-medium text-[var(--md-sys-color-on-surface-variant)] block mb-2">
                  Official prescribing information (FDA PI / EMA SmPC)
                </span>
                <EvidenceItem
                  evidence={mockEvidenceRecords[1]}
                  onViewSource={(ev) => showFeedback(`Opening official prescribing monograph for ${ev.substance}`)}
                />
              </div>
            </div>

            {/* Aggregated Evidence Summary */}
            <div className="pt-2">
              <span className="text-xs font-medium text-[var(--md-sys-color-on-surface-variant)] block mb-2">
                Aggregated evidence synthesis
              </span>
              <EvidenceSummary
                substanceName="Amoxicillin"
                reactionTerm="Maculopapular rash"
                totalReferencesCount={2}
                literatureRecords={mockEvidenceRecords}
              />
            </div>
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* 8. WORKFLOW COMPONENTS */}
      {/* ========================================================================= */}
      {(activeSection === 'all' || activeSection === 'workflow') && (
        <section id="section-workflow" className="space-y-6 scroll-mt-20">
          <div className="border-b border-[var(--md-sys-color-outline-variant)]/40 pb-2">
            <span className="text-xs font-medium text-[var(--md-sys-color-on-surface-variant)] block">
              Domain Family • Workflow progression
            </span>
            <h2 className="text-xl font-semibold text-[var(--md-sys-color-on-surface)] mt-0.5">
              Workflow & Stepper Components
            </h2>
            <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] mt-0.5">
              Material 3 state progression lines for multi-step intake and validation pipelines without neon or glowing progress animations.
            </p>
          </div>

          <WorkflowProgress
            title="Adverse Reaction Intake & Regulatory Review Workflow"
            steps={mockWorkflowSteps}
            onStepClick={(step) => showFeedback(`Selected Step ${step.stepNumber}: ${step.label} (${step.state})`)}
          />
        </section>
      )}
    </div>
  );
};
