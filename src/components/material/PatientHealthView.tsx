import React, { useState } from 'react';

interface PatientHealthViewProps {
  onNavigateToReport: () => void;
}

export const PatientHealthView: React.FC<PatientHealthViewProps> = ({ onNavigateToReport }) => {
  const [symptomQuery, setSymptomQuery] = useState('');
  const [selectedMed, setSelectedMed] = useState<string | null>('Amoxicillin 500mg');
  const [isExploring, setIsExploring] = useState(false);
  const [hasExplored, setHasExplored] = useState(false);

  const activeMedications = [
    { name: 'Amoxicillin 500mg', regimen: 'Oral • Twice daily', indication: 'Respiratory infection' },
    { name: 'Lisinopril 10mg', regimen: 'Oral • Once daily', indication: 'Hypertension' },
    { name: 'Metformin 850mg', regimen: 'Oral • With meals', indication: 'Type 2 diabetes' },
  ];

  const handleExplore = (e: React.FormEvent) => {
    e.preventDefault();
    if (!symptomQuery.trim()) return;
    setIsExploring(true);
    setTimeout(() => {
      setIsExploring(false);
      setHasExplored(true);
    }, 600);
  };

  return (
    <div id="patient-health-view" className="space-y-8 animate-fade-in">
      {/* Calm Medical Safety Notice - Non-alarmist, Clear Boundary */}
      <div
        id="medical-safety-banner"
        className="p-4 rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] flex items-start gap-3.5 text-sm"
      >
        <span
          className="material-symbols-outlined text-[var(--md-sys-color-primary)] text-xl shrink-0 mt-0.5"
          aria-hidden="true"
        >
          info
        </span>
        <div className="space-y-1">
          <p className="font-medium text-[var(--md-sys-color-on-surface)]">
            Preliminary Healthcare Triage Support
          </p>
          <p className="text-[var(--md-sys-color-on-surface-variant)] text-xs sm:text-sm leading-relaxed">
            APIP provides preliminary symptom exploration and adverse reaction intake support. This platform does not provide definitive medical diagnoses and does not replace the evaluation of a qualified healthcare practitioner. If you experience severe chest pain, difficulty breathing, or sudden swelling, please contact emergency medical services immediately.
          </p>
        </div>
      </div>

      {/* Main Exploration Section: Symptom Exploration & Medication Context */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Natural Input & Preliminary Exploration */}
        <section
          aria-labelledby="explore-heading"
          className="lg:col-span-7 m3-surface-container-lowest p-6 rounded-2xl border border-[var(--md-sys-color-outline-variant)]/60 shadow-xs space-y-6"
        >
          <div>
            <h1 id="explore-heading" className="m3-headline-small font-normal text-[var(--md-sys-color-on-surface)]">
              Describe your health experience
            </h1>
            <p className="m3-body-medium text-[var(--md-sys-color-on-surface-variant)] mt-1.5">
              Explain how you are feeling in your own words. We will assist in assessing the urgency and checking whether your current medication may be related.
            </p>
          </div>

          <form onSubmit={handleExplore} className="space-y-4">
            <div>
              <label
                htmlFor="patient-symptom-input"
                className="m3-label-medium text-[var(--md-sys-color-on-surface-variant)] block mb-2"
              >
                Symptoms or changes noticed
              </label>
              <textarea
                id="patient-symptom-input"
                rows={4}
                value={symptomQuery}
                onChange={(e) => setSymptomQuery(e.target.value)}
                placeholder="E.g., I developed a mild rash on my arms 3 days after starting Amoxicillin, accompanied by slight itching..."
                className="w-full px-3.5 py-2.5 rounded-lg border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)] placeholder:text-[var(--md-sys-color-on-surface-variant)]/60 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--md-sys-color-primary)] focus:border-transparent transition-all"
              />
            </div>

            {/* Suspected Medication Association */}
            <div>
              <span className="m3-label-medium text-[var(--md-sys-color-on-surface-variant)] block mb-2">
                Associated medication (optional)
              </span>
              <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Select medication">
                {activeMedications.map((med) => {
                  const isSelected = selectedMed === med.name;
                  return (
                    <button
                      key={med.name}
                      type="button"
                      role="radio"
                      aria-checked={isSelected}
                      onClick={() => setSelectedMed(isSelected ? null : med.name)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
                        isSelected
                          ? 'bg-[var(--md-sys-color-secondary-container)] text-[var(--md-sys-color-on-secondary-container)] border-[var(--md-sys-color-secondary)]'
                          : 'bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface-variant)] border-[var(--md-sys-color-outline-variant)] hover:bg-[var(--md-sys-color-surface-container-low)]'
                      }`}
                    >
                      {isSelected && (
                        <span className="material-symbols-outlined text-sm">check</span>
                      )}
                      <span>{med.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pt-2 flex items-center gap-3">
              <button
                type="submit"
                id="btn-explore-symptoms"
                disabled={isExploring || !symptomQuery.trim()}
                className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-full bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] text-sm font-medium hover:opacity-90 active:opacity-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-xs"
              >
                {isExploring ? (
                  <>
                    <span className="material-symbols-outlined animate-spin text-sm">sync</span>
                    <span>Assessing information...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-lg">medical_services</span>
                    <span>Explore Experience</span>
                  </>
                )}
              </button>

              <button
                type="button"
                id="btn-quick-report"
                onClick={onNavigateToReport}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full border border-[var(--md-sys-color-outline)] text-[var(--md-sys-color-primary)] text-sm font-medium hover:bg-[var(--md-sys-color-surface-container-low)] active:bg-[var(--md-sys-color-surface-container)] transition-colors"
              >
                <span className="material-symbols-outlined text-lg">edit_note</span>
                <span>Report Adverse Event</span>
              </button>
            </div>
          </form>

          {/* Preliminary Exploration Outcome Card */}
          {hasExplored && (
            <div
              id="preliminary-assessment-result"
              className="p-4 rounded-xl bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)] space-y-3 animate-fade-in"
            >
              <div className="flex items-center justify-between">
                <span className="m3-label-large font-medium text-[var(--md-sys-color-on-surface)] flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[var(--md-sys-color-primary)] text-base">
                    fact_check
                  </span>
                  Preliminary Urgency Assessment
                </span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-[var(--md-sys-color-secondary-container)] text-[var(--md-sys-color-on-secondary-container)] font-medium">
                  Moderate Urgency
                </span>
              </div>

              <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] leading-relaxed">
                The symptoms described (mild cutaneous eruption after commencing antibiotic therapy) correspond to a known potential adverse reaction documented for aminopenicillins. We recommend scheduling an appointment with your prescribing physician to evaluate whether continuing treatment or substituting an alternative antimicrobial agent is advised.
              </p>

              <div className="pt-2 flex items-center justify-between border-t border-[var(--md-sys-color-outline-variant)]/60 text-xs">
                <span className="text-[var(--md-sys-color-on-surface-variant)]">
                  Would you like to log this formal safety report?
                </span>
                <button
                  type="button"
                  onClick={onNavigateToReport}
                  className="text-[var(--md-sys-color-primary)] font-medium hover:underline inline-flex items-center gap-1"
                >
                  Create Formal Report
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </button>
              </div>
            </div>
          )}
        </section>

        {/* Right Column: Active Medications & Health Timeline */}
        <section
          aria-labelledby="medications-heading"
          className="lg:col-span-5 space-y-6"
        >
          {/* Active Medicines Surface */}
          <div className="m3-surface-container-lowest p-6 rounded-2xl border border-[var(--md-sys-color-outline-variant)]/60 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h2 id="medications-heading" className="m3-title-medium font-semibold text-[var(--md-sys-color-on-surface)]">
                Active Medicines
              </h2>
              <span className="text-xs text-[var(--md-sys-color-on-surface-variant)]">
                3 recorded
              </span>
            </div>

            <div className="divide-y divide-[var(--md-sys-color-outline-variant)]/50">
              {activeMedications.map((med) => (
                <div key={med.name} className="py-3 first:pt-0 last:pb-0 flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-[var(--md-sys-color-on-surface)]">
                      {med.name}
                    </p>
                    <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] mt-0.5">
                      {med.regimen}
                    </p>
                    <span className="inline-block mt-1 text-[11px] px-2 py-0.2 rounded bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface-variant)]">
                      {med.indication}
                    </span>
                  </div>
                  <span className="material-symbols-outlined text-[var(--md-sys-color-on-surface-variant)]/60 text-lg mt-1">
                    medication
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Privacy & Safeguard Info */}
          <div className="p-5 rounded-2xl bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)]/40 space-y-2.5">
            <div className="flex items-center gap-2 text-sm font-medium text-[var(--md-sys-color-on-surface)]">
              <span className="material-symbols-outlined text-[var(--md-sys-color-primary)] text-base">
                lock
              </span>
              Privacy & Anonymization Standards
            </div>
            <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] leading-relaxed">
              All clinical details are handled in strict compliance with pharmacovigilance confidentiality standards. Personal identifiers are protected and de-identified prior to safety aggregation or regulatory transmission.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
};
