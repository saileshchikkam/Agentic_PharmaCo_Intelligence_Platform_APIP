export type MedicationState = 'active' | 'completed' | 'paused' | 'discontinued' | 'unknown';

export interface PatientMedication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  route: string;
  indication?: string;
  startedDate: string;
  stoppedDate?: string;
  status: MedicationState;
  lotNumber?: string;
  prescribedBy?: string;
}

export interface PatientHealthProfile {
  id: string;
  initials: string;
  age: string;
  gender: string;
  knownConditions: string[];
  activeMedicationsCount: number;
  allergies: string[];
  lastUpdated: string;
}

export type HealthEventType = 'medication' | 'symptom' | 'healthcare' | 'adr';

export interface HealthTimelineEvent {
  id: string;
  type: HealthEventType;
  date: string;
  title: string;
  subtitle?: string;
  description?: string;
  status?: string;
  medicationName?: string;
  badgeText?: string;
}

export type AdrReviewState = 
  | 'draft' 
  | 'incomplete' 
  | 'ready_for_review' 
  | 'under_review' 
  | 'needs_clarification' 
  | 'reviewed' 
  | 'submitted';

export interface AdrCompletenessItem {
  key: string;
  label: string;
  isComplete: boolean;
  value?: string;
}

export interface AdrExperienceModel {
  id: string;
  title: string;
  reportedReaction: string;
  suspectMedication: string;
  dosage?: string;
  firstNoticed: string;
  reviewState: AdrReviewState;
  narrative?: string;
  reportedSeverity?: string;
  outcome?: string;
  clarificationPrompt?: string;
  clarificationField?: string;
  completenessItems: AdrCompletenessItem[];
}

export type PvCaseState = 
  | 'new' 
  | 'incomplete' 
  | 'validation_required' 
  | 'under_review' 
  | 'needs_clarification' 
  | 'reviewed' 
  | 'closed';

export interface PvCaseModel {
  id: string;
  caseNumber: string;
  dateReported: string;
  lastUpdated: string;
  reportedReaction: string;
  suspectMedicine: string;
  dosage: string;
  patientDemographics: string;
  reporterType: string;
  status: PvCaseState;
  seriousness: string;
  e2bCompliant: boolean;
}

export interface ValidationCheckItem {
  id: string;
  label: string;
  status: 'complete' | 'needs_review' | 'missing';
  detail?: string;
}

export interface EvidenceRecordModel {
  id: string;
  substance: string;
  eventTerm: string;
  sourceType: string;
  sourceTitle: string;
  retrievedDate: string;
  referenceUrl?: string;
  summaryText: string;
  status: 'reference_available' | 'corroborated' | 'under_assessment';
}

export interface WorkflowStepItem {
  id: string;
  stepNumber: number;
  label: string;
  state: 'completed' | 'current' | 'pending' | 'review' | 'human_approval';
  description?: string;
}
