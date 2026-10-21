import { ICSRCase } from './types';

export const INITIAL_ICSR_CASES: ICSRCase[] = [
  {
    id: 'case-001',
    caseNumber: 'PV-2026-88102',
    dateReported: '2026-08-28',
    reporter: {
      type: 'Doctor',
      name: 'Dr. Anita Sharma, MD',
      organization: 'Apollo Specialty Hospital, Chennai',
      contact: 'asharma@apollo.org',
      country: 'India'
    },
    patient: {
      initials: 'R.K.',
      age: '54',
      gender: 'Male',
      weightKg: 72,
      medicalHistory: ['Hypertension', 'Sinusitis', 'No prior hepatic disease']
    },
    suspectedDrug: {
      name: 'Augmentin 625mg',
      genericName: 'Amoxicillin / Clavulanic Acid',
      indication: 'Acute bacterial sinusitis',
      dosage: '625mg PO TID',
      route: 'Oral',
      lotNumber: 'BX-9941A',
      startDate: '2026-08-10',
      stopDate: '2026-08-17'
    },
    concomitantDrugs: [
      { name: 'Amlodipine 5mg', indication: 'Hypertension', startDate: '2024-01-15' }
    ],
    adverseEvent: {
      narrative: 'Patient completed a 7-day course of amoxicillin-clavulanate. Ten days after stopping the antibiotic, he developed dark amber urine, scleral icterus (yellow eyes), and intense generalized pruritus. Liver function tests showed ALT 480 U/L, AST 320 U/L, Total Bilirubin 6.8 mg/dL, and Alkaline Phosphatase 510 U/L consistent with cholestatic-hepatocellular DILI. Viral hepatitis serologies (A, B, C, E) were negative. Liver ultrasound was unremarkable without biliary obstruction.',
      primaryTerm: 'Drug-Induced Liver Injury (Cholestatic Jaundice)',
      meddraPreferredTerm: 'Drug-induced liver injury',
      systemOrganClass: 'Hepatobiliary disorders',
      onsetDate: '2026-08-27',
      seriousness: {
        isFatal: false,
        isLifeThreatening: false,
        causedHospitalization: true,
        causedDisability: false,
        congenitalAnomaly: false,
        otherMedicallyImportant: true
      },
      seriousnessJustification: 'Required inpatient admission for hepatic monitoring and fluid stabilization.',
      outcome: 'Recovering/Resolving'
    },
    dechallenge: 'Positive (improved after stopping)',
    rechallenge: 'Not Rechallenged',
    validation: {
      isValidICSR: true,
      completenessScore: 100,
      qualityIndex: 96,
      issues: [
        { field: 'rechallenge', severity: 'info', message: 'Rechallenge not performed due to ethical contraindication with severe DILI.' }
      ],
      regulatoryCompliance: 'Valid ICSR (ICH E2B(R3) Compliant - expedited 15-day reporting criteria met)'
    },
    causality: {
      naranjoScore: 7,
      naranjoCategory: 'Probable',
      whoUmcCategory: 'Probable / Likely',
      questionsBreakdown: [
        { question: 'Previous conclusive reports?', score: 1, rationale: 'Amoxicillin-clavulanic acid is a classic documented cause of delayed cholestatic liver injury.' },
        { question: 'Appeared after suspected drug?', score: 2, rationale: 'Onset occurred within characteristic latency window (1-3 weeks post therapy).' },
        { question: 'Improved on dechallenge?', score: 1, rationale: 'Transaminases and bilirubin steadily decreased following drug cessation.' },
        { question: 'Reappeared on rechallenge?', score: 0, rationale: 'Rechallenge contraindicated.' },
        { question: 'Alternative causes ruled out?', score: 2, rationale: 'Viral hepatitis, biliary obstruction, and autoantibodies ruled out.' },
        { question: 'Reaction confirmed by objective labs?', score: 1, rationale: 'Marked elevation in ALT, AST, Alk Phos, and total bilirubin.' }
      ],
      signalDetection: {
        prr: 3.12,
        isDisproportionalSignal: true,
        confidenceInterval: '[2.45 - 3.96]',
        interpretation: 'PRR exceeds regulatory safety signal threshold (PRR >= 2.0, N >= 3). Signal active in VigiBase.'
      },
      expertMedicalOpinion: 'Strong probable relationship between Amoxicillin/Clavulanate and cholestatic liver injury. Latency and clinical biochemical pattern are characteristic of clavulanate-mediated idiosyncratic hepatotoxicity.',
      physicianSignOff: {
        reviewedBy: 'Dr. Marcus Vance, MD, Global Safety Lead',
        date: '2026-08-30',
        status: 'Approved',
        notes: 'Transmitted to national PvPI hub. Close follow-up until total bilirubin normalizes below 1.2 mg/dL.'
      }
    },
    knowledge: {
      monograph: {
        genericName: 'Amoxicillin / Clavulanate',
        drugClass: 'Aminopenicillin Beta-lactam Antibiotic',
        commonADRs: ['Diarrhea', 'Nausea', 'Maculopapular rash', 'Vomiting', 'Urticaria'],
        seriousADRs: ['Drug-Induced Liver Injury (Cholestatic Jaundice)', 'Anaphylaxis', 'Stevens-Johnson Syndrome'],
        contraindications: ['History of penicillin hypersensitivity', 'Prior amoxicillin-associated hepatic dysfunction'],
        pharmacovigilanceNotes: 'Risk is 3x to 5x higher with amoxicillin/clavulanic acid than amoxicillin alone due to the clavulanic acid moiety.',
        literatureRefs: [
          { title: 'Amoxicillin-clavulanate-induced liver injury: a review', journal: 'World J Gastroenterol', year: 2021, pmid: '34140788' }
        ]
      },
      aiEvidenceSynthesis: 'Extensive post-marketing literature confirms amoxicillin-clavulanic acid as the most common individual cause of idiosyncratic drug-induced liver injury. R-ratio calculation ((ALT/ULN) / (ALP/ULN)) indicates cholestatic/mixed pattern.'
    }
  },
  {
    id: 'case-002',
    caseNumber: 'PV-2026-90415',
    dateReported: '2026-09-01',
    reporter: {
      type: 'Doctor',
      name: 'Dr. Sarah Jenkins, Emergency Medicine',
      organization: 'St. Jude General Emergency Dept',
      contact: 'sjenkins@stjudemed.org',
      country: 'United States'
    },
    patient: {
      initials: 'E.M.',
      age: '61',
      gender: 'Female',
      weightKg: 68,
      medicalHistory: ['Essential Hypertension (3 years)', 'Osteoarthritis']
    },
    suspectedDrug: {
      name: 'Prinivil (Lisinopril) 20mg',
      genericName: 'Lisinopril',
      indication: 'Essential Hypertension',
      dosage: '20mg PO Once Daily',
      route: 'Oral',
      lotNumber: 'LP-33290',
      startDate: '2023-04-12',
      stopDate: '2026-09-01'
    },
    concomitantDrugs: [
      { name: 'Acetaminophen 500mg PRN', indication: 'Joint discomfort', startDate: '2025-06-01' }
    ],
    adverseEvent: {
      narrative: 'Patient presented to the Emergency Department at 03:30 AM with acute, painless swelling of the lower lip, tongue, and uvula with progressive sensation of throat tightness and dysphonia. No urticaria, wheezing, or hypotension was noted. She has taken Lisinopril 20mg for over 3 years without prior complications. Intubated electively in the ED for definitive airway protection. Administered IV icatibant and methylprednisolone. Swelling resolved over 36 hours. Extubated successfully.',
      primaryTerm: 'Angioedema (Lip, Tongue, Laryngeal)',
      meddraPreferredTerm: 'Angioedema',
      systemOrganClass: 'Skin and subcutaneous tissue disorders',
      onsetDate: '2026-09-01',
      seriousness: {
        isFatal: false,
        isLifeThreatening: true,
        causedHospitalization: true,
        causedDisability: false,
        congenitalAnomaly: false,
        otherMedicallyImportant: true
      },
      seriousnessJustification: 'Life-threatening airway compromise requiring emergent endotracheal intubation in ICU.',
      outcome: 'Recovered/Resolved'
    },
    dechallenge: 'Positive (improved after stopping)',
    rechallenge: 'Not Rechallenged',
    validation: {
      isValidICSR: true,
      completenessScore: 100,
      qualityIndex: 98,
      issues: [],
      regulatoryCompliance: 'Valid ICSR (ICH E2B(R3) Compliant - 7-Day Expedited Life-Threatening Safety Report)'
    },
    causality: {
      naranjoScore: 6,
      naranjoCategory: 'Probable',
      whoUmcCategory: 'Probable / Likely',
      questionsBreakdown: [
        { question: 'Previous conclusive reports?', score: 1, rationale: 'ACE-inhibitor class effect mediated by bradykinin accumulation.' },
        { question: 'Appeared after suspected drug?', score: 2, rationale: 'Event occurred while on active chronic therapy.' },
        { question: 'Improved on dechallenge?', score: 1, rationale: 'Rapid clinical resolution upon lisinopril discontinuation.' },
        { question: 'Reappeared on rechallenge?', score: 0, rationale: 'Rechallenge strictly contraindicated due to fatal asphyxiation hazard.' },
        { question: 'Alternative causes excluded?', score: 2, rationale: 'C1 esterase inhibitor levels normal, no food allergens or insect stings.' }
      ],
      signalDetection: {
        prr: 4.88,
        isDisproportionalSignal: true,
        confidenceInterval: '[3.92 - 6.08]',
        interpretation: 'Major established black-box safety signal. High disproportionality across all international vigilance databases.'
      },
      expertMedicalOpinion: 'Probable causality. Angioedema can occur unpredictably months or years into therapy due to non-allergic kinin pathway activation. Patient advised of permanent contraindication to all ACE inhibitors.',
      physicianSignOff: {
        reviewedBy: 'Dr. Marcus Vance, MD, Global Safety Lead',
        date: '2026-09-02',
        status: 'Approved',
        notes: 'Flagged for regulatory 7-day expedited safety transmittal to FDA MedWatch & EMA EudraVigilance.'
      }
    },
    knowledge: {
      monograph: {
        genericName: 'Lisinopril',
        drugClass: 'Angiotensin-Converting Enzyme (ACE) Inhibitor',
        commonADRs: ['Dry persistent cough', 'Dizziness', 'Headache', 'Hyperkalemia'],
        seriousADRs: ['Angioedema (Intestinal/Laryngeal/Facial)', 'Acute Kidney Injury', 'Severe Hypotension'],
        blackBoxWarnings: ['Fetal Toxicity during 2nd and 3rd trimesters of pregnancy.'],
        contraindications: ['History of ACE inhibitor associated angioedema', 'Concomitant sacubitril/valsartan'],
        pharmacovigilanceNotes: 'Black patients have an approximately 5x higher risk of ACE-inhibitor-associated angioedema compared with non-Black patients.',
        literatureRefs: [
          { title: 'ACE Inhibitor-Induced Angioedema: Epidemiology and Clinical Management', journal: 'J Allergy Clin Immunol Pract', year: 2023, pmid: '36822451' }
        ]
      },
      aiEvidenceSynthesis: 'ACE inhibitors inhibit kininase II, the primary enzyme degrading bradykinin. Elevated bradykinin stimulates B2 receptors causing localized vasodilation and increased vascular permeability.'
    }
  },
  {
    id: 'case-003',
    caseNumber: 'PV-2026-91183',
    dateReported: '2026-09-02',
    reporter: {
      type: 'Pharmacist',
      name: 'Priya Nair, PharmD',
      organization: 'City Care Pharmacy & Clinics',
      contact: 'pnair@citycarepharm.com',
      country: 'India'
    },
    patient: {
      initials: 'V.M.',
      age: '42',
      gender: 'Male',
      weightKg: 80,
      medicalHistory: ['Complicated Urinary Tract Infection', 'Recreational runner']
    },
    suspectedDrug: {
      name: 'Cipro 500mg',
      genericName: 'Ciprofloxacin',
      indication: 'Complicated urinary tract infection',
      dosage: '500mg PO BID',
      route: 'Oral',
      lotNumber: 'CP-7810',
      startDate: '2026-08-25',
      stopDate: '2026-08-29'
    },
    concomitantDrugs: [],
    adverseEvent: {
      narrative: 'Patient reported sharp bilateral heel pain and swelling on day 4 of ciprofloxacin 500mg twice daily while walking down stairs. Physical exam by orthopedist revealed tenderness over right and left Achilles tendons with palpable defect in the right tendon. Ultrasound confirmed partial tear of the right Achilles tendon and diffuse tendinopathy of the left Achilles tendon. Patient was non-athlete with no prior musculoskeletal injuries.',
      primaryTerm: 'Achilles Tendonitis and Tendon Rupture',
      meddraPreferredTerm: 'Tendon rupture',
      systemOrganClass: 'Musculoskeletal and connective tissue disorders',
      onsetDate: '2026-08-29',
      seriousness: {
        isFatal: false,
        isLifeThreatening: false,
        causedHospitalization: false,
        causedDisability: true,
        congenitalAnomaly: false,
        otherMedicallyImportant: true
      },
      seriousnessJustification: 'Caused persistent significant disability and impairment in normal ambulation.',
      outcome: 'Not Recovered'
    },
    dechallenge: 'Positive (improved after stopping)',
    rechallenge: 'Not Rechallenged',
    validation: {
      isValidICSR: true,
      completenessScore: 95,
      qualityIndex: 92,
      issues: [
        { field: 'concomitantDrugs', severity: 'info', message: 'No corticosteroids reported (corticosteroids synergistically increase fluoroquinolone tendon rupture risk).' }
      ],
      regulatoryCompliance: 'Valid ICSR (ICH E2B(R3) Compliant)'
    },
    causality: {
      naranjoScore: 6,
      naranjoCategory: 'Probable',
      whoUmcCategory: 'Probable / Likely',
      questionsBreakdown: [
        { question: 'Previous conclusive reports?', score: 1, rationale: 'Fluoroquinolones carry FDA Boxed Warning for tendinitis and tendon rupture.' },
        { question: 'Appeared after suspected drug?', score: 2, rationale: 'Clear onset on day 4 of oral ciprofloxacin course.' },
        { question: 'Improved on dechallenge?', score: 1, rationale: 'Progression halted upon antibiotic cessation and immobilization.' },
        { question: 'Objective diagnostic confirmation?', score: 1, rationale: 'Ultrasound documented acoustic disruption and structural defect.' }
      ],
      signalDetection: {
        prr: 5.62,
        isDisproportionalSignal: true,
        confidenceInterval: '[4.15 - 7.58]',
        interpretation: 'Strong disproportionality signal. Labeled class hazard across fluoroquinolones.'
      },
      expertMedicalOpinion: 'Probable association. Fluoroquinolones cause chelation of magnesium ions essential for tenocyte vitality, leading to collagen degradation. Immediate cessation and orthopedic referral documented.',
      physicianSignOff: {
        reviewedBy: 'Dr. Elena Rostova, PV Safety Reviewer',
        date: '2026-09-03',
        status: 'Approved',
        notes: 'Report logged for annual safety aggregation and PvPI quarterly signal review.'
      }
    },
    knowledge: {
      monograph: {
        genericName: 'Ciprofloxacin',
        drugClass: 'Fluoroquinolone Antibacterial',
        commonADRs: ['Nausea', 'Dyspepsia', 'Headache', 'Insomnia'],
        seriousADRs: ['Achilles Tendonitis and Tendon Rupture', 'Peripheral Neuropathy', 'QTc Prolongation'],
        blackBoxWarnings: ['Disabling and Potentially Irreversible Serious Adverse Reactions (tendinitis, neuropathy, CNS).'],
        contraindications: ['Concomitant tizanidine', 'Known hypersensitivity'],
        pharmacovigilanceNotes: 'Tendon rupture can occur within hours of initiation or up to several months after stopping the medication.',
        literatureRefs: [
          { title: 'Fluoroquinolone-associated tendinopathy: a continuous pharmacovigilance signal', journal: 'Drug Saf', year: 2023, pmid: '36997782' }
        ]
      },
      aiEvidenceSynthesis: 'Post-marketing surveillance demonstrates an incidence rate ratio of approximately 4.0 for Achilles tendon rupture in exposed individuals, with elevated vulnerability in patients over 60 years or receiving concurrent corticosteroids.'
    }
  },
  {
    id: 'case-004',
    caseNumber: 'PV-2026-92840',
    dateReported: '2026-09-03',
    reporter: {
      type: 'Patient',
      name: 'Sunita Patel',
      organization: 'Self-Report (Citizen)',
      contact: 'sunita.p@gmail.com',
      country: 'India'
    },
    patient: {
      initials: 'S.P.',
      age: '29',
      gender: 'Female',
      weightKg: 58,
      medicalHistory: ['Bipolar disorder', 'Migraine with aura']
    },
    suspectedDrug: {
      name: 'Lamictal 100mg',
      genericName: 'Lamotrigine',
      indication: 'Mood stabilization / Bipolar disorder',
      dosage: '100mg once daily',
      route: 'Oral',
      lotNumber: 'Unknown',
      startDate: '2026-08-20',
      stopDate: '2026-08-31'
    },
    concomitantDrugs: [
      { name: 'Sodium Valproate 500mg BD', indication: 'Seizure / Mood control', startDate: '2025-02-10' }
    ],
    adverseEvent: {
      narrative: 'I started taking Lamictal 10 days ago along with my existing sodium valproate. My doctor started me on 100mg right away. Two days ago, I woke up with fever, sore throat, painful mouth ulcers, and red blistering spots spreading across my chest, face, and lips. The skin on my chest felt like it was burning and started peeling when touched. I was rushed to the hospital burn ICU unit yesterday where they diagnosed me with Stevens-Johnson Syndrome.',
      primaryTerm: 'Stevens-Johnson Syndrome (SJS)',
      meddraPreferredTerm: 'Stevens-Johnson syndrome',
      systemOrganClass: 'Skin and subcutaneous tissue disorders',
      onsetDate: '2026-09-01',
      seriousness: {
        isFatal: false,
        isLifeThreatening: true,
        causedHospitalization: true,
        causedDisability: true,
        congenitalAnomaly: false,
        otherMedicallyImportant: true
      },
      seriousnessJustification: 'Life-threatening dermatological emergency requiring Burn ICU management and IVIG therapy.',
      outcome: 'Recovering/Resolving'
    },
    dechallenge: 'Positive (improved after stopping)',
    rechallenge: 'Not Rechallenged',
    validation: {
      isValidICSR: true,
      completenessScore: 90,
      qualityIndex: 88,
      issues: [
        { field: 'lotNumber', severity: 'warning', message: 'Lot number missing from patient report. Requested from dispensing pharmacy.' },
        { field: 'dosageTitration', severity: 'warning', message: 'Rapid initiation at 100mg without standard slow titration in presence of valproate represents significant medication error.' }
      ],
      regulatoryCompliance: 'Valid ICSR (ICH E2B(R3) Compliant - Critical Safety & Medication Error Alert)'
    },
    causality: {
      naranjoScore: 8,
      naranjoCategory: 'Probable',
      whoUmcCategory: 'Probable / Likely',
      questionsBreakdown: [
        { question: 'Previous conclusive reports?', score: 1, rationale: 'Black Box warning: Lamotrigine + Valproate co-administration drastically multiplies SJS/TEN risk.' },
        { question: 'Appeared after suspected drug?', score: 2, rationale: 'Classic 1-3 week latency after rapid un-titrated dosing.' },
        { question: 'Improved on dechallenge?', score: 1, rationale: 'Stabilized in Burn ICU following immediate cessation of lamotrigine.' },
        { question: 'Alternative causes excluded?', score: 2, rationale: 'No other new agents, infectious etiologies ruled out.' },
        { question: 'Confirmed by objective signs?', score: 2, rationale: 'Positive Nikolsky sign, mucosal membrane involvement, biopsy confirmed.' }
      ],
      signalDetection: {
        prr: 6.84,
        isDisproportionalSignal: true,
        confidenceInterval: '[5.10 - 9.15]',
        interpretation: 'Major pharmacovigilance safety priority. Valproate inhibits lamotrigine glucuronidation (UGT1A4/2B7).'
      },
      expertMedicalOpinion: 'Probable causality compounded by prescription administration error. Valproate decreases lamotrigine clearance by over 50%. The initial starting dose should have been 25mg every other day rather than 100mg daily.',
      physicianSignOff: {
        reviewedBy: 'Dr. Marcus Vance, MD, Global Safety Lead',
        date: '2026-09-03',
        status: 'Flagged For Investigation',
        notes: 'Flagged to Pharmacovigilance Risk Management Committee for medication error root cause analysis.'
      }
    },
    knowledge: {
      monograph: {
        genericName: 'Lamotrigine',
        drugClass: 'Antiepileptic / Mood Stabilizer',
        commonADRs: ['Drowsiness', 'Dizziness', 'Ataxia', 'Blurred vision'],
        seriousADRs: ['Stevens-Johnson Syndrome (SJS)', 'Toxic Epidermal Necrolysis (TEN)', 'DRESS syndrome'],
        blackBoxWarnings: ['Severe Cutaneous Adverse Reactions: Risk increases substantially with valproate or failure to adhere to recommended dose titration.'],
        contraindications: ['Hypersensitivity to lamotrigine'],
        pharmacovigilanceNotes: 'Concomitant sodium valproate doubles lamotrigine elimination half-life from 25-30 hours up to 60-70 hours.',
        literatureRefs: [
          { title: 'Lamotrigine-induced cutaneous adverse reactions: pharmacogenomics and clinical management', journal: 'Epilepsia', year: 2022, pmid: '35916024' }
        ]
      },
      aiEvidenceSynthesis: 'Co-administration with valproate requires a starting dose reduction to 25mg every alternate day for the first two weeks, followed by 25mg once daily for weeks 3-4. Failure to dose-adjust creates severe toxic drug accumulation triggering cytotoxic T-cell epidermal necrosis.'
    }
  }
];

export const SAMPLE_PROMPTS_FOR_INTAKE = [
  {
    title: 'Amoxicillin Rash & Swelling',
    role: 'Patient',
    text: 'I took Amoxicillin 500mg prescribed for a dental infection yesterday morning. Within 4 hours my arms and neck broke out in severe itchy red hives and my lower lip began swelling. I had no difficulty breathing but immediately stopped taking the pills. Today the hives are starting to fade after taking an antihistamine.'
  },
  {
    title: 'Atorvastatin Severe Muscle Weakness',
    role: 'Doctor',
    text: 'Patient is a 67-year-old male on Atorvastatin 40mg daily for hyperlipidemia, co-prescribed Clarithromycin 500mg BID for pneumonia 5 days ago. Presented today with excruciating bilateral thigh and calf myalgia, dark reddish-brown urine, and inability to stand without assistance. Serum CPK is 14,200 U/L and serum creatinine elevated to 2.4 mg/dL. Admitted for IV hydration and statin cessation.'
  },
  {
    title: 'Metformin Lactic Acidosis (Elderly)',
    role: 'Nurse',
    text: 'Elderly 76-year-old female resident on Metformin 1000mg twice daily developed acute gastroenteritis with dehydration. She was brought to our clinic lethargic, hyperventilating with Kussmaul respirations, vomiting, and hypothermic (temp 35.4°C). Arterial blood gas revealed pH 7.12, serum lactate 9.4 mmol/L, and severe acute kidney injury with eGFR 14 mL/min.'
  }
];
