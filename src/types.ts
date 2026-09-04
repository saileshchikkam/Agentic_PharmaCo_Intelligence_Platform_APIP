export type ReporterType = 'Patient' | 'Doctor' | 'Nurse' | 'Pharmacist' | 'Consumer';

export type DechallengeOutcome = 
  | 'Positive (improved after stopping)'
  | 'Negative (reaction continued)'
  | 'Not Discontinued'
  | 'Dose Reduced (improved)'
  | 'Unknown';

export type RechallengeOutcome = 
  | 'Positive (recurred upon re-exposure)'
  | 'Negative (did not recur)'
  | 'Not Rechallenged'
  | 'Unknown';

export type WhoUmcCausality = 
  | 'Certain'
  | 'Probable / Likely'
  | 'Possible'
  | 'Unlikely'
  | 'Conditional / Unclassified'
  | 'Unassessable / Unclassifiable';

export type NaranjoCategory = 'Definite' | 'Probable' | 'Possible' | 'Doubtful';

export interface SeriousnessCriteria {
  isFatal: boolean;
  isLifeThreatening: boolean;
  causedHospitalization: boolean;
  causedDisability: boolean;
  congenitalAnomaly: boolean;
  otherMedicallyImportant: boolean;
}

export interface ValidationIssue {
  field: string;
  severity: 'error' | 'warning' | 'info';
  message: string;
}

export interface LiteratureRef {
  title: string;
  journal: string;
  year: number;
  pmid?: string;
}

export interface DrugSafetyMonograph {
  genericName: string;
  drugClass: string;
  commonADRs: string[];
  seriousADRs: string[];
  blackBoxWarnings?: string[];
  contraindications: string[];
  pharmacovigilanceNotes: string;
  literatureRefs: LiteratureRef[];
}

export interface NaranjoQuestionScore {
  question: string;
  score: number;
  rationale: string;
}

export interface ICSRCase {
  id: string;
  caseNumber: string; // e.g. PV-2026-48201
  dateReported: string;
  reporter: {
    type: ReporterType;
    name?: string;
    organization?: string;
    contact?: string;
    country: string;
  };
  patient: {
    initials?: string;
    age: string;
    gender: 'Male' | 'Female' | 'Other' | 'Unspecified';
    weightKg?: number;
    medicalHistory: string[];
  };
  suspectedDrug: {
    name: string;
    genericName?: string;
    indication: string;
    dosage: string;
    route: string;
    lotNumber?: string;
    startDate: string;
    stopDate?: string;
  };
  concomitantDrugs: {
    name: string;
    indication?: string;
    startDate?: string;
  }[];
  adverseEvent: {
    narrative: string;
    primaryTerm: string;
    meddraPreferredTerm?: string;
    systemOrganClass?: string;
    onsetDate: string;
    seriousness: SeriousnessCriteria;
    seriousnessJustification?: string;
    outcome: 'Recovered/Resolved' | 'Recovering/Resolving' | 'Not Recovered' | 'Fatal' | 'Unknown';
  };
  dechallenge: DechallengeOutcome;
  rechallenge: RechallengeOutcome;
  validation: {
    isValidICSR: boolean;
    completenessScore: number;
    qualityIndex: number;
    issues: ValidationIssue[];
    regulatoryCompliance: string;
  };
  causality: {
    naranjoScore: number;
    naranjoCategory: NaranjoCategory;
    whoUmcCategory: WhoUmcCausality;
    questionsBreakdown: NaranjoQuestionScore[];
    signalDetection?: {
      prr: number;
      isDisproportionalSignal: boolean;
      confidenceInterval: string;
      interpretation: string;
    };
    expertMedicalOpinion?: string;
    physicianSignOff?: {
      reviewedBy: string;
      date: string;
      status: 'Pending' | 'Approved' | 'Flagged For Investigation';
      notes?: string;
    };
  };
  knowledge?: {
    monograph?: DrugSafetyMonograph | null;
    aiEvidenceSynthesis?: string;
  };
}

export interface AgentWorkflowState {
  isProcessing: boolean;
  currentAgent: 'Idle' | 'Reporting Agent' | 'Validation Agent' | 'Knowledge Agent' | 'Causality Agent' | 'Completed';
  stepProgress: number; // 0 to 100
  logs: string[];
}
