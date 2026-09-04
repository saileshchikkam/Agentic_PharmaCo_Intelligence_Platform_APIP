import React, { useState } from 'react';
import {
  M3Button,
  M3TextField,
  M3Checkbox,
  M3RadioGroup,
  M3Switch,
  M3Select,
  M3Chip,
  M3Card,
  M3Divider,
  M3Progress,
  M3Feedback,
} from './core';

interface CoreComponentsViewProps {
  isDark: boolean;
  onToggleTheme: () => void;
}

export const CoreComponentsView: React.FC<CoreComponentsViewProps> = ({
  isDark,
  onToggleTheme,
}) => {
  // State for interactive testing
  const [globalDisabled, setGlobalDisabled] = useState(false);
  const [globalError, setGlobalError] = useState(false);
  const [buttonLoading, setButtonLoading] = useState(false);

  // Input states
  const [searchQuery, setSearchQuery] = useState('');
  const [medicationName, setMedicationName] = useState('Amoxicillin 500 mg');
  const [eventDescription, setEventDescription] = useState('Mild cutaneous rash on forearms starting 2 days after first dose.');
  const [lotNumber, setLotNumber] = useState('LOT-2026-981');
  const [additionalRemarks, setAdditionalRemarks] = useState('');

  // Selection states
  const [confirmationChecked, setConfirmationChecked] = useState(true);
  const [remindersEnabled, setRemindersEnabled] = useState(true);
  const [severity, setSeverity] = useState('moderate');
  const [frequency, setFrequency] = useState('twice-daily');

  // Chip states
  const [filterActive, setFilterActive] = useState(true);
  const [chipsList, setChipsList] = useState(['Amoxicillin 500 mg', 'Lisinopril 10 mg']);

  const handleRemoveChip = (labelToRemove: string) => {
    setChipsList((prev) => prev.filter((c) => c !== labelToRemove));
  };

  const handleAddChip = () => {
    if (!chipsList.includes('Metformin 850 mg')) {
      setChipsList((prev) => [...prev, 'Metformin 850 mg']);
    }
  };

  return (
    <div id="core-components-view" className="space-y-12 pb-16 animate-fade-in max-w-5xl mx-auto">
      {/* Header & Laboratory Toolbar */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[var(--md-sys-color-outline-variant)]/60 pb-6">
        <div>
          <span className="m3-label-medium text-[var(--md-sys-color-primary)] uppercase tracking-wider block font-semibold">
            APIP Design System • Phase 1 Step 2
          </span>
          <h1 className="m3-headline-medium text-[var(--md-sys-color-on-surface)] mt-1">
            Core Material 3 Components
          </h1>
          <p className="m3-body-medium text-[var(--md-sys-color-on-surface-variant)] mt-1.5 max-w-2xl">
            Established reusable component language for all APIP screens. Demonstrates default,
            hover, focus, pressed, disabled, error, and loading states under Google Material 3 specifications.
          </p>
        </div>

        {/* Global state inspection toggles */}
        <div className="flex items-center gap-3 bg-[var(--md-sys-color-surface-container-low)] p-2.5 rounded-xl border border-[var(--md-sys-color-outline-variant)]/40 shrink-0">
          <M3Switch
            id="toggle-simulate-disabled"
            label="Simulate Disabled"
            selected={globalDisabled}
            onChange={setGlobalDisabled}
          />
          <div className="h-6 w-px bg-[var(--md-sys-color-outline-variant)]/60" aria-hidden="true" />
          <M3Switch
            id="toggle-simulate-error"
            label="Simulate Error"
            selected={globalError}
            onChange={setGlobalError}
          />
        </div>
      </div>

      {/* A. BUTTONS */}
      <section aria-labelledby="section-buttons" className="space-y-4">
        <div>
          <h2 id="section-buttons" className="m3-title-medium text-[var(--md-sys-color-on-surface)] font-semibold">
            A. Buttons & Action Hierarchy
          </h2>
          <p className="m3-body-small text-[var(--md-sys-color-on-surface-variant)] mt-0.5">
            Strict Material 3 button taxonomy: Filled for primary, Tonal for high-emphasis secondary,
            Outlined for medium-emphasis review, and Text for low-emphasis actions.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-[var(--md-sys-color-surface-container-lowest)] border border-[var(--md-sys-color-outline-variant)]/60 space-y-6">
          {/* Action Hierarchy Row */}
          <div className="space-y-2">
            <span className="m3-label-small text-[var(--md-sys-color-on-surface-variant)] block">
              Hierarchy Examples (Enabled & Disabled states)
            </span>
            <div className="flex flex-wrap items-center gap-3">
              {/* Primary Filled Button */}
              <M3Button
                id="btn-primary-continue"
                variant="filled"
                label="Continue"
                leadingIcon="arrow_forward"
                disabled={globalDisabled}
              />

              {/* Healthcare Specific Action */}
              <M3Button
                id="btn-report-reaction"
                variant="filled"
                label="Report a reaction"
                leadingIcon="medication"
                disabled={globalDisabled}
              />

              {/* Secondary Tonal Button */}
              <M3Button
                id="btn-secondary-save"
                variant="tonal"
                label="Save draft"
                leadingIcon="save"
                disabled={globalDisabled}
              />

              {/* Outlined Button */}
              <M3Button
                id="btn-outlined-review"
                variant="outlined"
                label="Review report"
                leadingIcon="fact_check"
                disabled={globalDisabled}
              />

              {/* Text Button */}
              <M3Button
                id="btn-text-cancel"
                variant="text"
                label="Cancel"
                disabled={globalDisabled}
              />
            </div>
          </div>

          {/* Interactive Loading & Icon States */}
          <div className="pt-4 border-t border-[var(--md-sys-color-outline-variant)]/30 space-y-2">
            <span className="m3-label-small text-[var(--md-sys-color-on-surface-variant)] block">
              Dynamic Loading & Interactive State Verification
            </span>
            <div className="flex flex-wrap items-center gap-4">
              <M3Button
                id="btn-loading-demo"
                variant="filled"
                label={buttonLoading ? 'Validating report...' : 'Submit with calm loading'}
                loading={buttonLoading}
                leadingIcon="send"
                onClick={() => {
                  setButtonLoading(true);
                  setTimeout(() => setButtonLoading(false), 2000);
                }}
              />
              <M3Button
                id="btn-tonal-trailing"
                variant="tonal"
                label="Next step"
                trailingIcon="arrow_forward"
                disabled={globalDisabled}
              />
              <M3Button
                id="btn-disabled-reference"
                variant="filled"
                label="Permanently disabled"
                disabled
              />
            </div>
            <span className="text-[11px] text-[var(--md-sys-color-on-surface-variant)] block">
              Tip: Click "Submit with calm loading" to inspect non-jarring loading behavior. Keyboard users can Tab through to test focus rings.
            </span>
          </div>
        </div>
      </section>

      {/* B. TEXT INPUTS */}
      <section aria-labelledby="section-inputs" className="space-y-4">
        <div>
          <h2 id="section-inputs" className="m3-title-medium text-[var(--md-sys-color-on-surface)] font-semibold">
            B. Text Inputs & Form Controls
          </h2>
          <p className="m3-body-small text-[var(--md-sys-color-on-surface-variant)] mt-0.5">
            Material Web outlined and filled text fields. Tested for empty, populated, focused, disabled,
            read-only, error, supporting text, and required indicators.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-[var(--md-sys-color-surface-container-lowest)] border border-[var(--md-sys-color-outline-variant)]/60 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Search Input */}
            <M3TextField
              id="input-search-medicines"
              type="search"
              label="Search medicines"
              placeholder="e.g. Amoxicillin, Lisinopril..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leadingIcon="search"
              supportingText="Searches approved national formulary and RxNorm"
              disabled={globalDisabled}
            />

            {/* Outlined Required Text Field */}
            <M3TextField
              id="input-medication-name"
              label="Medication name"
              value={medicationName}
              onChange={(e) => setMedicationName(e.target.value)}
              leadingIcon="medication"
              required
              supportingText="Enter trade name or generic chemical active ingredient"
              disabled={globalDisabled}
              error={globalError}
              errorText={globalError ? 'Please enter the medication name' : undefined}
            />

            {/* Error State Field */}
            <M3TextField
              id="input-lot-number"
              label="Lot / Batch number"
              value={lotNumber}
              onChange={(e) => setLotNumber(e.target.value)}
              leadingIcon="qr_code"
              error={globalError || (lotNumber.length > 0 && !lotNumber.startsWith('LOT-'))}
              errorText="Format must match manufacturer batch LOT-XXXX"
              supportingText="Located on the outer carton or blister foil"
              disabled={globalDisabled}
            />

            {/* Read-only / Immutable Field */}
            <M3TextField
              id="input-safety-id"
              label="Safety Report ID"
              value="ICH-E2B-2026-US-00948"
              readOnly
              leadingIcon="lock"
              supportingText="Immutable E2B(R3) transmission identifier"
              disabled={globalDisabled}
            />
          </div>

          {/* Multiline Textarea */}
          <div className="pt-2">
            <M3TextField
              id="input-describe-happened"
              type="textarea"
              rows={3}
              label="Describe what happened"
              value={eventDescription}
              onChange={(e) => setEventDescription(e.target.value)}
              required
              supportingText="Provide a clear, objective chronological account of symptoms and reaction timeline."
              disabled={globalDisabled}
              error={globalError}
              errorText={globalError ? 'Reaction narrative description is required' : undefined}
            />
          </div>

          {/* Filled Variant Example */}
          <div className="pt-4 border-t border-[var(--md-sys-color-outline-variant)]/30">
            <span className="m3-label-small text-[var(--md-sys-color-on-surface-variant)] mb-2 block">
              Filled Text Field Variant (Secondary notes/inquiries)
            </span>
            <M3TextField
              id="input-additional-remarks"
              variant="filled"
              label="Additional information"
              placeholder="Optional notes or physician comments..."
              value={additionalRemarks}
              onChange={(e) => setAdditionalRemarks(e.target.value)}
              supportingText="Information entered here is preserved for clinical review"
              disabled={globalDisabled}
            />
          </div>
        </div>
      </section>

      {/* C, D, E, F. SELECTION CONTROLS */}
      <section aria-labelledby="section-selection" className="space-y-4">
        <div>
          <h2 id="section-selection" className="m3-title-medium text-[var(--md-sys-color-on-surface)] font-semibold">
            C, D, E, F. Selection Controls (Checkbox, Radio, Switch, Select Menu)
          </h2>
          <p className="m3-body-small text-[var(--md-sys-color-on-surface-variant)] mt-0.5">
            Single-selection, multi-selection, toggles, and dropdown menus adhering to Material 3 interaction rules.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-[var(--md-sys-color-surface-container-lowest)] border border-[var(--md-sys-color-outline-variant)]/60 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Checkbox & Switch */}
            <div className="space-y-5">
              <span className="m3-label-small text-[var(--md-sys-color-on-surface-variant)] block font-medium">
                Binary & Confirmation Controls
              </span>

              {/* Checkbox */}
              <div className="p-3.5 rounded-xl bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)]/30">
                <M3Checkbox
                  id="chk-accuracy-confirm"
                  checked={confirmationChecked}
                  onChange={setConfirmationChecked}
                  label="I confirm that the information I provided is accurate."
                  supportingText="All reports are processed under standard pharmacovigilance data privacy rules."
                  disabled={globalDisabled}
                />
              </div>

              {/* Switch */}
              <div className="p-3.5 rounded-xl bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)]/30">
                <M3Switch
                  id="sw-medication-reminders"
                  selected={remindersEnabled}
                  onChange={setRemindersEnabled}
                  label={`Medication reminders [ ${remindersEnabled ? 'ON' : 'OFF'} ]`}
                  supportingText="Receive automated notifications for scheduled doses and intake checks"
                  disabled={globalDisabled}
                />
              </div>
            </div>

            {/* Radio Button & Select Menu */}
            <div className="space-y-5">
              <span className="m3-label-small text-[var(--md-sys-color-on-surface-variant)] block font-medium">
                Single-Choice Selection
              </span>

              {/* Radio Group */}
              <div className="p-3.5 rounded-xl bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)]/30">
                <M3RadioGroup
                  name="severity-selection"
                  label="Reported Severity (Patient-reported intake sample)"
                  supportingText="Visual example only. The system does not imply clinical diagnostic severity."
                  value={severity}
                  onChange={setSeverity}
                  disabled={globalDisabled}
                  options={[
                    { value: 'mild', label: 'Mild', supportingText: 'Minimal discomfort, does not interfere with daily activities' },
                    { value: 'moderate', label: 'Moderate', supportingText: 'Noticeable discomfort, partially interferes with activities' },
                    { value: 'severe', label: 'Severe', supportingText: 'Incapacitating, prevents normal daily activities' },
                  ]}
                />
              </div>

              {/* Select Menu */}
              <div className="p-3.5 rounded-xl bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)]/30">
                <M3Select
                  id="select-med-frequency"
                  label="Medication frequency"
                  value={frequency}
                  onChange={setFrequency}
                  supportingText="Prescribed administration schedule"
                  disabled={globalDisabled}
                  error={globalError}
                  errorText={globalError ? 'Please choose a frequency' : undefined}
                  options={[
                    { value: 'once-daily', label: 'Once daily' },
                    { value: 'twice-daily', label: 'Twice daily' },
                    { value: 'three-times-daily', label: 'Three times daily' },
                    { value: 'as-needed', label: 'As needed (PRN)' },
                  ]}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* G. CHIPS */}
      <section aria-labelledby="section-chips" className="space-y-4">
        <div>
          <h2 id="section-chips" className="m3-title-medium text-[var(--md-sys-color-on-surface)] font-semibold">
            G. Chips (Assist, Filter, Input, Suggestion)
          </h2>
          <p className="m3-body-small text-[var(--md-sys-color-on-surface-variant)] mt-0.5">
            Material 3 interactive chips for contextual actions, filtering, discrete entity dismissal, and recommendations.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-[var(--md-sys-color-surface-container-lowest)] border border-[var(--md-sys-color-outline-variant)]/60 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Assist Chip */}
            <div className="p-3.5 rounded-xl bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)]/30 space-y-2">
              <span className="m3-label-small font-semibold text-[var(--md-sys-color-on-surface-variant)] block">
                1. Assist Chip
              </span>
              <M3Chip
                id="chip-assist-timeline"
                type="assist"
                label="View timeline"
                icon="history"
                disabled={globalDisabled}
                onClick={() => {}}
              />
              <span className="text-[11px] text-[var(--md-sys-color-on-surface-variant)] block">
                Contextual action shortcut
              </span>
            </div>

            {/* Filter Chip */}
            <div className="p-3.5 rounded-xl bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)]/30 space-y-2">
              <span className="m3-label-small font-semibold text-[var(--md-sys-color-on-surface-variant)] block">
                2. Filter Chip
              </span>
              <M3Chip
                id="chip-filter-medicines"
                type="filter"
                label="Current medicines"
                icon="medication"
                selected={filterActive}
                disabled={globalDisabled}
                onClick={() => setFilterActive(!filterActive)}
              />
              <span className="text-[11px] text-[var(--md-sys-color-on-surface-variant)] block">
                Selected: {filterActive ? 'Active' : 'Inactive'}
              </span>
            </div>

            {/* Input Chips */}
            <div className="p-3.5 rounded-xl bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)]/30 space-y-2 sm:col-span-2">
              <div className="flex items-center justify-between">
                <span className="m3-label-small font-semibold text-[var(--md-sys-color-on-surface-variant)] block">
                  3. Input & 4. Suggestion Chips
                </span>
                {chipsList.length < 3 && (
                  <button
                    type="button"
                    onClick={handleAddChip}
                    className="text-[11px] font-medium text-[var(--md-sys-color-primary)] hover:underline"
                  >
                    + Restore chip
                  </button>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                {chipsList.map((chipLabel) => (
                  <M3Chip
                    key={chipLabel}
                    id={`chip-input-${chipLabel}`}
                    type="input"
                    label={chipLabel}
                    icon="pill"
                    disabled={globalDisabled}
                    onRemove={() => handleRemoveChip(chipLabel)}
                  />
                ))}

                {/* Suggestion Chip */}
                <M3Chip
                  id="chip-suggestion-add"
                  type="suggestion"
                  label="Add medication"
                  icon="add"
                  disabled={globalDisabled}
                  onClick={handleAddChip}
                />
              </div>
              <span className="text-[11px] text-[var(--md-sys-color-on-surface-variant)] block">
                Input chips can be removed; suggestion chip prompts quick addition.
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* H. CARDS / CONTAINERS */}
      <section aria-labelledby="section-cards" className="space-y-4">
        <div>
          <h2 id="section-cards" className="m3-title-medium text-[var(--md-sys-color-on-surface)] font-semibold">
            H. Cards & Grouping Surfaces
          </h2>
          <p className="m3-body-small text-[var(--md-sys-color-on-surface-variant)] mt-0.5">
            Material 3 surface hierarchy: Outlined, Filled, and Elevated. Never nested; each card
            serves as an independent grouping boundary for authentic healthcare data.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Outlined Surface Card */}
          <M3Card id="card-outlined-med" variant="outlined" className="space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="m3-label-small text-[var(--md-sys-color-primary)] font-semibold uppercase block">
                  Outlined Surface
                </span>
                <h3 className="text-base font-semibold text-[var(--md-sys-color-on-surface)] mt-0.5">
                  Amoxicillin 500 mg
                </h3>
              </div>
              <span className="material-symbols-outlined text-[var(--md-sys-color-primary)]">
                medication
              </span>
            </div>
            <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] leading-relaxed">
              Prescribed for acute respiratory tract infection. Schedule: <strong>Twice daily</strong> with meals.
            </p>
            <div className="pt-2 flex items-center justify-between text-xs text-[var(--md-sys-color-on-surface-variant)] border-t border-[var(--md-sys-color-outline-variant)]/40">
              <span>Route: Oral capsule</span>
              <span className="font-mono text-[11px]">Active Rx</span>
            </div>
          </M3Card>

          {/* Filled Surface Card */}
          <M3Card id="card-filled-intake" variant="filled" className="space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="m3-label-small text-[var(--md-sys-color-secondary)] font-semibold uppercase block">
                  Filled / Tonal Surface
                </span>
                <h3 className="text-base font-semibold text-[var(--md-sys-color-on-surface)] mt-0.5">
                  Reaction Intake Summary
                </h3>
              </div>
              <span className="material-symbols-outlined text-[var(--md-sys-color-secondary)]">
                clinical_notes
              </span>
            </div>
            <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] leading-relaxed">
              Patient reported erythematous eruption 48 hours post-dose. Dechallenge documented as positive upon discontinuation.
            </p>
            <div className="pt-2 flex items-center justify-between text-xs text-[var(--md-sys-color-on-surface-variant)] border-t border-[var(--md-sys-color-outline-variant)]/40">
              <span>Causality: Probable</span>
              <span className="font-semibold text-[var(--md-sys-color-primary)]">Score 6</span>
            </div>
          </M3Card>

          {/* Elevated Surface Card */}
          <M3Card id="card-elevated-reporter" variant="elevated" className="space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="m3-label-small text-[var(--md-sys-color-tertiary)] font-semibold uppercase block">
                  Elevated Surface
                </span>
                <h3 className="text-base font-semibold text-[var(--md-sys-color-on-surface)] mt-0.5">
                  Regulatory Compliance
                </h3>
              </div>
              <span className="material-symbols-outlined text-[var(--md-sys-color-tertiary)]">
                verified_user
              </span>
            </div>
            <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] leading-relaxed">
              Standardized under ICH E2B(R3) guidelines. Four minimum criteria satisfied: identifiable patient, reporter, suspect drug, and event.
            </p>
            <div className="pt-2 flex items-center justify-between text-xs text-[var(--md-sys-color-on-surface-variant)] border-t border-[var(--md-sys-color-outline-variant)]/40">
              <span>GVP Module VI</span>
              <span className="text-[11px] font-medium text-[var(--md-sys-color-secondary)]">Validated</span>
            </div>
          </M3Card>
        </div>
      </section>

      {/* I. DIVIDERS & J. PROGRESS */}
      <section aria-labelledby="section-progress" className="space-y-4">
        <div>
          <h2 id="section-progress" className="m3-title-medium text-[var(--md-sys-color-on-surface)] font-semibold">
            I. Dividers & J. Process Indicators
          </h2>
          <p className="m3-body-small text-[var(--md-sys-color-on-surface-variant)] mt-0.5">
            Process states representing UI workflow only (no artificial confidence scores). Dividers applied with restraint.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-[var(--md-sys-color-surface-container-lowest)] border border-[var(--md-sys-color-outline-variant)]/60 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            {/* Determinate Progress */}
            <div className="space-y-2">
              <span className="m3-label-small font-medium text-[var(--md-sys-color-on-surface-variant)] block">
                Determinate Progress
              </span>
              <M3Progress
                id="prog-determinate"
                type="linear"
                value={0.75}
                label="Report completeness"
                valueLabel="75% (3 of 4 sections completed)"
              />
              <span className="text-[11px] text-[var(--md-sys-color-on-surface-variant)] block">
                Measures tangible form field completion, not automated clinical certainty.
              </span>
            </div>

            {/* Indeterminate Progress */}
            <div className="space-y-2">
              <span className="m3-label-small font-medium text-[var(--md-sys-color-on-surface-variant)] block">
                Indeterminate Progress
              </span>
              <M3Progress
                id="prog-indeterminate"
                type="linear"
                indeterminate
                label="Checking information"
                valueLabel="Synchronizing regulatory catalog..."
              />
              <span className="text-[11px] text-[var(--md-sys-color-on-surface-variant)] block">
                Calm loading motion indicating ongoing network or background verification.
              </span>
            </div>
          </div>

          <M3Divider />

          {/* Circular Progress Demonstration */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-6">
              <M3Progress
                id="prog-circular-determinate"
                type="circular"
                value={0.65}
                label="Transmission staging"
                valueLabel="65% processed"
              />
              <M3Progress
                id="prog-circular-indeterminate"
                type="circular"
                indeterminate
                label="Background verification"
                valueLabel="Awaiting server response..."
              />
            </div>
            <span className="text-xs text-[var(--md-sys-color-on-surface-variant)] max-w-xs text-right">
              Section separation uses a subtle 1px outline-variant divider rule.
            </span>
          </div>
        </div>
      </section>

      {/* K. FEEDBACK / SYSTEM NOTICES */}
      <section aria-labelledby="section-feedback" className="space-y-4">
        <div>
          <h2 id="section-feedback" className="m3-title-medium text-[var(--md-sys-color-on-surface)] font-semibold">
            K. Feedback & System Notices
          </h2>
          <p className="m3-body-small text-[var(--md-sys-color-on-surface-variant)] mt-0.5">
            Restrained clinical status banners. Explicitly avoids alarming diagnostic declarations
            or speculative safety claims.
          </p>
        </div>

        <div className="space-y-3">
          {/* Information */}
          <M3Feedback
            id="notice-info"
            type="info"
            title="Information"
            message="Your report can be reviewed and amended before final regulatory submission."
            actionLabel="Review draft"
            onAction={() => {}}
          />

          {/* Warning */}
          <M3Feedback
            id="notice-warning"
            type="warning"
            title="Attention"
            message="Some information is still missing. Providing lot/batch number enhances traceability."
            actionLabel="Add lot code"
            onAction={() => {}}
          />

          {/* Error */}
          <M3Feedback
            id="notice-error"
            type="error"
            title="Validation Required"
            message="Please enter the medication name before continuing."
          />

          {/* Success */}
          <M3Feedback
            id="notice-success"
            type="success"
            title="Success"
            message="Draft saved securely to your local intake session."
          />
        </div>
      </section>

      {/* ACCESSIBILITY & STATE SYSTEM SUMMARY */}
      <section aria-labelledby="section-states" className="space-y-4">
        <div>
          <h2 id="section-states" className="m3-title-medium text-[var(--md-sys-color-on-surface)] font-semibold">
            State System & Accessibility Standards
          </h2>
          <p className="m3-body-small text-[var(--md-sys-color-on-surface-variant)] mt-0.5">
            Audit criteria verified across all interactive components in both light and dark themes.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)]/40 space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div className="p-3 rounded-lg bg-[var(--md-sys-color-surface-container-lowest)] border border-[var(--md-sys-color-outline-variant)]/30">
              <span className="font-semibold text-[var(--md-sys-color-on-surface)] block mb-1">
                State Layers
              </span>
              <p className="text-[var(--md-sys-color-on-surface-variant)]">
                Default, Hover (8%), Focus (12%), Pressed (12%), Selected, Disabled, Error, and Loading.
              </p>
            </div>

            <div className="p-3 rounded-lg bg-[var(--md-sys-color-surface-container-lowest)] border border-[var(--md-sys-color-outline-variant)]/30">
              <span className="font-semibold text-[var(--md-sys-color-on-surface)] block mb-1">
                Focus Visible
              </span>
              <p className="text-[var(--md-sys-color-on-surface-variant)]">
                High-contrast keyboard focus indicators complying with WCAG 2.4.7 Focus Visible.
              </p>
            </div>

            <div className="p-3 rounded-lg bg-[var(--md-sys-color-surface-container-lowest)] border border-[var(--md-sys-color-outline-variant)]/30">
              <span className="font-semibold text-[var(--md-sys-color-on-surface)] block mb-1">
                Touch Targets
              </span>
              <p className="text-[var(--md-sys-color-on-surface-variant)]">
                Comfortable 48×48dp minimum touch bounds for mobile, tablet, and pointer interaction.
              </p>
            </div>

            <div className="p-3 rounded-lg bg-[var(--md-sys-color-surface-container-lowest)] border border-[var(--md-sys-color-outline-variant)]/30">
              <span className="font-semibold text-[var(--md-sys-color-on-surface)] block mb-1">
                Reduced Motion
              </span>
              <p className="text-[var(--md-sys-color-on-surface-variant)]">
                Instantaneous transitions honored when prefers-reduced-motion media query is present.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
