import React, { useState } from 'react';
import { ICSRCase } from '../../types';

interface SafetyRecordsViewProps {
  cases: ICSRCase[];
  onSelectCase?: (c: ICSRCase) => void;
}

export const SafetyRecordsView: React.FC<SafetyRecordsViewProps> = ({ cases, onSelectCase }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSeriousness, setFilterSeriousness] = useState<'all' | 'serious' | 'non-serious'>('all');
  const [selectedCaseDetail, setSelectedCaseDetail] = useState<ICSRCase | null>(null);

  const filteredCases = cases.filter((item) => {
    const matchesSearch =
      item.suspectedDrug.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.adverseEvent.primaryTerm.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.caseNumber.toLowerCase().includes(searchTerm.toLowerCase());

    const isSerious = Object.values(item.adverseEvent.seriousness).some(Boolean);
    if (filterSeriousness === 'serious') return matchesSearch && isSerious;
    if (filterSeriousness === 'non-serious') return matchesSearch && !isSerious;
    return matchesSearch;
  });

  return (
    <div id="safety-records-view" className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="m3-headline-small font-normal text-[var(--md-sys-color-on-surface)]">
            Pharmacovigilance Safety Records
          </h1>
          <p className="m3-body-medium text-[var(--md-sys-color-on-surface-variant)] mt-0.5">
            Individual Case Safety Reports (ICSR) structured under ICH E2B(R3) guidelines.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs px-3 py-1 rounded-full bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface-variant)] font-mono font-medium">
            {filteredCases.length} records displayed
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="m3-surface-container-lowest p-4 rounded-2xl border border-[var(--md-sys-color-outline-variant)]/60 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="w-full sm:w-80 relative">
          <span className="material-symbols-outlined absolute left-3 top-2.5 text-[var(--md-sys-color-outline)] text-lg">
            search
          </span>
          <input
            type="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search drug, reaction, or case ID..."
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] text-sm text-[var(--md-sys-color-on-surface)] placeholder:text-[var(--md-sys-color-on-surface-variant)]/60 focus:outline-none focus:ring-2 focus:ring-[var(--md-sys-color-primary)]"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
          {(['all', 'serious', 'non-serious'] as const).map((filter) => {
            const isSelected = filterSeriousness === filter;
            return (
              <button
                key={filter}
                type="button"
                onClick={() => setFilterSeriousness(filter)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium capitalize border transition-colors whitespace-nowrap ${
                  isSelected
                    ? 'bg-[var(--md-sys-color-secondary-container)] text-[var(--md-sys-color-on-secondary-container)] border-[var(--md-sys-color-secondary)]'
                    : 'bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface-variant)] border-[var(--md-sys-color-outline-variant)] hover:bg-[var(--md-sys-color-surface-container-low)]'
                }`}
              >
                {filter}
              </button>
            );
          })}
        </div>
      </div>

      {/* Records List */}
      <div className="space-y-3">
        {filteredCases.length === 0 ? (
          <div className="p-12 text-center rounded-2xl border border-dashed border-[var(--md-sys-color-outline-variant)] text-[var(--md-sys-color-on-surface-variant)]">
            <span className="material-symbols-outlined text-4xl mb-2 text-[var(--md-sys-color-outline)]">
              folder_off
            </span>
            <p className="text-sm font-medium">No safety records match your query</p>
            <p className="text-xs mt-1">Try refining your search keyword or seriousness filter.</p>
          </div>
        ) : (
          filteredCases.map((c) => {
            const isSerious = Object.values(c.adverseEvent.seriousness).some(Boolean);
            const isSelected = selectedCaseDetail?.id === c.id;

            return (
              <article
                key={c.id}
                onClick={() => setSelectedCaseDetail(isSelected ? null : c)}
                className={`m3-surface-container-lowest p-5 rounded-2xl border transition-all cursor-pointer shadow-xs ${
                  isSelected
                    ? 'border-[var(--md-sys-color-primary)] ring-1 ring-[var(--md-sys-color-primary)]'
                    : 'border-[var(--md-sys-color-outline-variant)]/60 hover:border-[var(--md-sys-color-outline)]'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs font-semibold text-[var(--md-sys-color-primary)]">
                      {c.caseNumber}
                    </span>
                    <span className="text-xs text-[var(--md-sys-color-on-surface-variant)]">
                      {c.dateReported}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {isSerious ? (
                      <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-[var(--md-sys-color-error-container)] text-[var(--md-sys-color-on-error-container)] font-medium">
                        Serious Event
                      </span>
                    ) : (
                      <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface-variant)] font-medium">
                        Non-serious
                      </span>
                    )}

                    <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-[var(--md-sys-color-secondary-container)] text-[var(--md-sys-color-on-secondary-container)] font-medium">
                      Naranjo: {c.causality.naranjoScore} ({c.causality.naranjoCategory})
                    </span>
                  </div>
                </div>

                <div className="mt-3">
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm font-semibold text-[var(--md-sys-color-on-surface)]">
                      {c.suspectedDrug.name}
                    </span>
                    <span className="text-xs text-[var(--md-sys-color-on-surface-variant)]">
                      → {c.adverseEvent.primaryTerm}
                    </span>
                  </div>
                  <p className="mt-1.5 text-xs text-[var(--md-sys-color-on-surface-variant)] leading-relaxed line-clamp-2">
                    {c.adverseEvent.narrative}
                  </p>
                </div>

                {/* Expanded Details on Click */}
                {isSelected && (
                  <div className="mt-4 pt-4 border-t border-[var(--md-sys-color-outline-variant)]/60 text-xs space-y-3 animate-fade-in">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="p-2.5 rounded-lg bg-[var(--md-sys-color-surface-container-low)]">
                        <span className="text-[11px] text-[var(--md-sys-color-on-surface-variant)] block">Patient Age</span>
                        <span className="font-medium text-[var(--md-sys-color-on-surface)]">{c.patient.age} yrs</span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-[var(--md-sys-color-surface-container-low)]">
                        <span className="text-[11px] text-[var(--md-sys-color-on-surface-variant)] block">Sex</span>
                        <span className="font-medium text-[var(--md-sys-color-on-surface)]">{c.patient.gender}</span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-[var(--md-sys-color-surface-container-low)]">
                        <span className="text-[11px] text-[var(--md-sys-color-on-surface-variant)] block">WHO-UMC Causality</span>
                        <span className="font-medium text-[var(--md-sys-color-on-surface)]">{c.causality.whoUmcCategory}</span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-[var(--md-sys-color-surface-container-low)]">
                        <span className="text-[11px] text-[var(--md-sys-color-on-surface-variant)] block">Seriousness Criteria</span>
                        <span className="font-medium text-[var(--md-sys-color-on-surface)]">
                          {c.adverseEvent.seriousness.causedHospitalization ? 'Hospitalization' : 'None reported'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </article>
            );
          })
        )}
      </div>
    </div>
  );
};
