import React, { useState } from 'react';

interface ReportReactionViewProps {
  onReportSubmitted: (caseRef: string) => void;
}

export const ReportReactionView: React.FC<ReportReactionViewProps> = ({ onReportSubmitted }) => {
  const [suspectedDrug, setSuspectedDrug] = useState('Amoxicillin 500mg');
  const [reactionDescription, setReactionDescription] = useState('');
  const [indication, setIndication] = useState('Respiratory tract infection');
  const [severityLevel, setSeverityLevel] = useState<'mild' | 'moderate' | 'severe'>('moderate');
  const [isHospitalized, setIsHospitalized] = useState(false);
  const [isLifeThreatening, setIsLifeThreatening] = useState(false);
  const [reviewRequired, setReviewRequired] = useState(true);
  const [consentGranted, setConsentGranted] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!suspectedDrug.trim() || !reactionDescription.trim()) return;

    setIsSubmitting(true);
    setTimeout(() => {
      const generatedRef = `APIP-E2B-${Math.floor(1000 + Math.random() * 9000)}`;
      setIsSubmitting(false);
      setSubmissionSuccess(generatedRef);
      onReportSubmitted(generatedRef);
    }, 700);
  };

  return (
    <div id="report-reaction-view" className="max-w-4xl mx-auto space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="m3-headline-small font-normal text-[var(--md-sys-color-on-surface)]">
          Report an Adverse Drug Reaction
        </h1>
        <p className="m3-body-medium text-[var(--md-sys-color-on-surface-variant)] mt-1">
          Structured documentation adhering to international pharmacovigilance safety standards (ICH E2B).
        </p>
      </div>

      {submissionSuccess ? (
        <div
          id="report-success-confirmation"
          className="p-6 rounded-2xl bg-[var(--md-sys-color-surface-container-lowest)] border border-[var(--md-sys-color-primary)] shadow-xs space-y-4 animate-fade-in"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] flex items-center justify-center">
              <span className="material-symbols-outlined text-2xl">check</span>
            </div>
            <div>
              <h2 className="text-base font-semibold text-[var(--md-sys-color-on-surface)]">
                Safety Report Successfully Recorded
              </h2>
              <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] mt-0.5">
                Case Identifier: <strong className="font-mono text-[var(--md-sys-color-primary)]">{submissionSuccess}</strong>
              </p>
            </div>
          </div>

          <p className="text-sm text-[var(--md-sys-color-on-surface-variant)] leading-relaxed">
            Your adverse drug reaction submission has been registered and scheduled for clinical review by safety officers. You can view or reference this case in the Safety Records section.
          </p>

          <div className="pt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                setSubmissionSuccess(null);
                setReactionDescription('');
              }}
              className="px-5 py-2 rounded-full border border-[var(--md-sys-color-outline)] text-xs font-medium text-[var(--md-sys-color-primary)] hover:bg-[var(--md-sys-color-surface-container-low)]"
            >
              Submit Another Report
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section 1: Medication Details */}
          <fieldset className="m3-surface-container-lowest p-6 rounded-2xl border border-[var(--md-sys-color-outline-variant)]/60 shadow-xs space-y-4">
            <legend className="m3-title-medium font-semibold text-[var(--md-sys-color-on-surface)] px-1">
              Medication Details
            </legend>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="suspected-drug-input"
                  className="m3-label-medium text-[var(--md-sys-color-on-surface-variant)] block mb-1.5"
                >
                  Suspected medicine *
                </label>
                <input
                  id="suspected-drug-input"
                  type="text"
                  required
                  value={suspectedDrug}
                  onChange={(e) => setSuspectedDrug(e.target.value)}
                  placeholder="E.g., Amoxicillin 500mg"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--md-sys-color-primary)]"
                />
              </div>

              <div>
                <label
                  htmlFor="indication-input"
                  className="m3-label-medium text-[var(--md-sys-color-on-surface-variant)] block mb-1.5"
                >
                  Therapeutic indication
                </label>
                <input
                  id="indication-input"
                  type="text"
                  value={indication}
                  onChange={(e) => setIndication(e.target.value)}
                  placeholder="Reason medication was prescribed"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--md-sys-color-primary)]"
                />
              </div>
            </div>
          </fieldset>

          {/* Section 2: Reaction Details & Seriousness */}
          <fieldset className="m3-surface-container-lowest p-6 rounded-2xl border border-[var(--md-sys-color-outline-variant)]/60 shadow-xs space-y-4">
            <legend className="m3-title-medium font-semibold text-[var(--md-sys-color-on-surface)] px-1">
              Adverse Event Information
            </legend>

            <div>
              <label
                htmlFor="reaction-desc-input"
                className="m3-label-medium text-[var(--md-sys-color-on-surface-variant)] block mb-1.5"
              >
                Event description & symptoms *
              </label>
              <textarea
                id="reaction-desc-input"
                rows={4}
                required
                value={reactionDescription}
                onChange={(e) => setReactionDescription(e.target.value)}
                placeholder="Describe what occurred, timing of symptom onset after dosing, and current status..."
                className="w-full px-3.5 py-2.5 rounded-lg border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--md-sys-color-primary)]"
              />
            </div>

            {/* Clinical Severity Chips */}
            <div>
              <span className="m3-label-medium text-[var(--md-sys-color-on-surface-variant)] block mb-2">
                Clinical Severity Level
              </span>
              <div className="flex gap-2.5" role="radiogroup" aria-label="Severity level">
                {(['mild', 'moderate', 'severe'] as const).map((lvl) => {
                  const isSelected = severityLevel === lvl;
                  return (
                    <button
                      key={lvl}
                      type="button"
                      role="radio"
                      aria-checked={isSelected}
                      onClick={() => setSeverityLevel(lvl)}
                      className={`px-4 py-1.5 rounded-full text-xs font-medium capitalize border transition-colors ${
                        isSelected
                          ? 'bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] border-[var(--md-sys-color-primary)]'
                          : 'bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface-variant)] border-[var(--md-sys-color-outline-variant)] hover:bg-[var(--md-sys-color-surface-container-low)]'
                      }`}
                    >
                      {lvl}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Seriousness Criteria (ICH E2B) */}
            <div className="pt-2 border-t border-[var(--md-sys-color-outline-variant)]/40 space-y-2">
              <span className="m3-label-medium text-[var(--md-sys-color-on-surface)] block">
                ICH Seriousness Criteria
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="flex items-center gap-2.5 cursor-pointer text-xs text-[var(--md-sys-color-on-surface)]">
                  <input
                    type="checkbox"
                    checked={isHospitalized}
                    onChange={(e) => setIsHospitalized(e.target.checked)}
                    className="w-4 h-4 rounded text-[var(--md-sys-color-primary)] focus:ring-[var(--md-sys-color-primary)] border-[var(--md-sys-color-outline)]"
                  />
                  <span>Resulted in or prolonged hospitalization</span>
                </label>

                <label className="flex items-center gap-2.5 cursor-pointer text-xs text-[var(--md-sys-color-on-surface)]">
                  <input
                    type="checkbox"
                    checked={isLifeThreatening}
                    onChange={(e) => setIsLifeThreatening(e.target.checked)}
                    className="w-4 h-4 rounded text-[var(--md-sys-color-primary)] focus:ring-[var(--md-sys-color-primary)] border-[var(--md-sys-color-outline)]"
                  />
                  <span>Life-threatening event</span>
                </label>
              </div>
            </div>
          </fieldset>

          {/* Section 3: Review & Triage Control */}
          <div className="m3-surface-container-lowest p-6 rounded-2xl border border-[var(--md-sys-color-outline-variant)]/60 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="m3-label-large font-medium text-[var(--md-sys-color-on-surface)] block">
                  Mark as 'Review required'
                </span>
                <span className="text-xs text-[var(--md-sys-color-on-surface-variant)]">
                  Escalate to safety inbox for pharmacovigilance officer causality evaluation.
                </span>
              </div>
              <input
                type="checkbox"
                role="switch"
                aria-checked={reviewRequired}
                checked={reviewRequired}
                onChange={(e) => setReviewRequired(e.target.checked)}
                className="w-10 h-5 accent-[var(--md-sys-color-primary)] cursor-pointer"
              />
            </div>

            <div className="pt-3 border-t border-[var(--md-sys-color-outline-variant)]/40 flex items-start gap-2.5">
              <input
                id="consent-checkbox"
                type="checkbox"
                required
                checked={consentGranted}
                onChange={(e) => setConsentGranted(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded text-[var(--md-sys-color-primary)] focus:ring-[var(--md-sys-color-primary)] border-[var(--md-sys-color-outline)] cursor-pointer"
              />
              <label htmlFor="consent-checkbox" className="text-xs text-[var(--md-sys-color-on-surface-variant)] leading-normal cursor-pointer">
                I authorize the processing of this de-identified event information for pharmacovigilance safety evaluation in compliance with health data governance protocols.
              </label>
            </div>
          </div>

          {/* Submission Action */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="submit"
              id="btn-submit-adr"
              disabled={isSubmitting || !reactionDescription.trim() || !consentGranted}
              className="inline-flex items-center justify-center gap-2 px-8 py-3 rounded-full bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] text-sm font-medium hover:opacity-90 active:opacity-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-xs"
            >
              {isSubmitting ? (
                <>
                  <span className="material-symbols-outlined animate-spin text-sm">sync</span>
                  <span>Transmitting report...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-lg">send</span>
                  <span>Submit Safety Report</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
