import React, { useState } from 'react';
import { 
  AlertTriangle, 
  Search, 
  Filter, 
  ChevronRight, 
  Eye, 
  ShieldAlert, 
  CheckCircle2, 
  FileSpreadsheet, 
  Activity, 
  Sparkles,
  User,
  Pill,
  ArrowUpDown
} from 'lucide-react';
import { ICSRCase } from '../types';

interface SafetyDashboardViewProps {
  cases: ICSRCase[];
  onSelectCase: (c: ICSRCase) => void;
  onNavigateToIntake: () => void;
}

export const SafetyDashboardView: React.FC<SafetyDashboardViewProps> = ({
  cases,
  onSelectCase,
  onNavigateToIntake
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [seriousnessFilter, setSeriousnessFilter] = useState<'ALL' | 'SERIOUS' | 'NON_SERIOUS'>('ALL');
  const [causalityFilter, setCausalityFilter] = useState<string>('ALL');
  const [sortField, setSortField] = useState<'date' | 'naranjo' | 'quality'>('date');
  const [sortAsc, setSortAsc] = useState(false);

  // Computed metrics
  const totalCount = cases.length;
  const seriousCount = cases.filter(c => Object.values(c.adverseEvent.seriousness).some(Boolean)).length;
  const signalCount = cases.filter(c => c.causality.signalDetection?.isDisproportionalSignal).length;
  const avgQuality = Math.round(
    cases.reduce((acc, c) => acc + (c.validation.qualityIndex || 0), 0) / (totalCount || 1)
  );

  // Filtered cases
  const filteredCases = cases.filter(c => {
    const matchesSearch = 
      c.caseNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.suspectedDrug.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.adverseEvent.primaryTerm.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.adverseEvent.meddraPreferredTerm && c.adverseEvent.meddraPreferredTerm.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (c.reporter.name && c.reporter.name.toLowerCase().includes(searchTerm.toLowerCase()));

    const isSerious = Object.values(c.adverseEvent.seriousness).some(Boolean);
    const matchesSeriousness = 
      seriousnessFilter === 'ALL' ? true :
      seriousnessFilter === 'SERIOUS' ? isSerious :
      !isSerious;

    const matchesCausality = 
      causalityFilter === 'ALL' ? true :
      c.causality.whoUmcCategory.toLowerCase().includes(causalityFilter.toLowerCase());

    return matchesSearch && matchesSeriousness && matchesCausality;
  }).sort((a, b) => {
    if (sortField === 'date') {
      return sortAsc 
        ? a.dateReported.localeCompare(b.dateReported)
        : b.dateReported.localeCompare(a.dateReported);
    }
    if (sortField === 'naranjo') {
      return sortAsc
        ? a.causality.naranjoScore - b.causality.naranjoScore
        : b.causality.naranjoScore - a.causality.naranjoScore;
    }
    if (sortField === 'quality') {
      return sortAsc
        ? a.validation.qualityIndex - b.validation.qualityIndex
        : b.validation.qualityIndex - a.validation.qualityIndex;
    }
    return 0;
  });

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center space-x-2 text-sky-700 font-semibold text-xs tracking-wider uppercase mb-1">
            <ShieldAlert className="w-4 h-4" />
            <span>Pharmacovigilance Safety Operations</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Safety Case Management & ICSR Inbox
          </h1>
          <p className="mt-1 text-slate-600 text-sm">
            Review incoming adverse drug reaction reports, multi-agent causality evaluations, and WHO-UMC assessments.
          </p>
        </div>

        <button
          onClick={onNavigateToIntake}
          className="bg-sky-600 hover:bg-sky-700 text-white font-bold px-4 py-2.5 rounded-xl text-sm shadow-xs flex items-center space-x-2 transition-all cursor-pointer self-start md:self-auto"
        >
          <Sparkles className="w-4 h-4" />
          <span>+ New ADR Report</span>
        </button>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total ICSR Cases</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-black text-slate-900">{totalCount}</span>
            <span className="text-xs font-semibold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-md">
              E2B(R3)
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Logged in clinical registry</p>
        </div>

        <div className="bg-white rounded-xl border border-rose-200 p-4 shadow-xs bg-rose-50/20">
          <span className="text-xs font-bold text-rose-700 uppercase tracking-wider">Serious ADRs</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-black text-rose-700">{seriousCount}</span>
            <span className="text-xs font-semibold text-rose-800 bg-rose-100 px-2 py-0.5 rounded-md">
              Expedited 15-Day
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Inpatient, ICU, or disabling events</p>
        </div>

        <div className="bg-white rounded-xl border border-amber-200 p-4 shadow-xs bg-amber-50/20">
          <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">Disproportionality Signals</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-black text-amber-800">{signalCount}</span>
            <span className="text-xs font-semibold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md">
              PRR ≥ 2.0
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Statistical signals above baseline</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Avg Quality Index</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-black text-slate-900">{avgQuality}%</span>
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
              WHO Compliant
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Completeness across 4 mandatory ICH rules</p>
        </div>
      </div>

      {/* Toolbar: Search, Filters & Sorting */}
      <div className="bg-white rounded-xl border border-slate-200 p-3 sm:p-4 mb-6 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            id="safety-search-input"
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search drug, reaction, case ID..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 text-slate-900 focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
          />
        </div>

        {/* Filter Badges */}
        <div className="flex items-center space-x-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          {/* Seriousness Filter */}
          <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-lg text-xs font-semibold text-slate-700">
            <button
              onClick={() => setSeriousnessFilter('ALL')}
              className={`px-2.5 py-1 rounded-md transition-all ${
                seriousnessFilter === 'ALL' ? 'bg-white shadow-xs text-slate-900' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setSeriousnessFilter('SERIOUS')}
              className={`px-2.5 py-1 rounded-md transition-all ${
                seriousnessFilter === 'SERIOUS' ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-600 hover:text-rose-700'
              }`}
            >
              Serious Only
            </button>
            <button
              onClick={() => setSeriousnessFilter('NON_SERIOUS')}
              className={`px-2.5 py-1 rounded-md transition-all ${
                seriousnessFilter === 'NON_SERIOUS' ? 'bg-white shadow-xs text-slate-900' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Non-Serious
            </button>
          </div>

          {/* Causality Filter */}
          <select
            value={causalityFilter}
            onChange={(e) => setCausalityFilter(e.target.value)}
            className="bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs font-medium text-slate-800"
          >
            <option value="ALL">All Causality</option>
            <option value="Certain">Certain</option>
            <option value="Probable">Probable / Likely</option>
            <option value="Possible">Possible</option>
            <option value="Unlikely">Unlikely</option>
          </select>

          {/* Sort Button */}
          <button
            onClick={() => {
              if (sortField === 'date') setSortField('naranjo');
              else if (sortField === 'naranjo') setSortField('quality');
              else setSortField('date');
            }}
            className="flex items-center space-x-1 bg-white border border-slate-300 px-2.5 py-1 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50"
            title="Toggle sort criteria"
          >
            <ArrowUpDown className="w-3 h-3 text-slate-500" />
            <span>Sort: {sortField.toUpperCase()}</span>
          </button>
        </div>
      </div>

      {/* Case Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Case Identifier</th>
                <th className="py-3 px-4">Suspected Drug</th>
                <th className="py-3 px-4">Adverse Event (MedDRA PT)</th>
                <th className="py-3 px-4">Seriousness</th>
                <th className="py-3 px-4">WHO-UMC Causality</th>
                <th className="py-3 px-4">Quality Score</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {filteredCases.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">
                    No safety cases match the current filter criteria.
                  </td>
                </tr>
              ) : (
                filteredCases.map((c) => {
                  const isSerious = Object.values(c.adverseEvent.seriousness).some(Boolean);
                  return (
                    <tr 
                      key={c.id} 
                      onClick={() => onSelectCase(c)}
                      className="hover:bg-sky-50/40 cursor-pointer transition-colors group"
                    >
                      {/* Case ID & Date */}
                      <td className="py-3.5 px-4">
                        <div className="font-mono font-bold text-slate-900 group-hover:text-sky-600 transition-colors">
                          {c.caseNumber}
                        </div>
                        <div className="text-[11px] text-slate-400 flex items-center space-x-1 mt-0.5">
                          <span>{c.dateReported}</span>
                          <span>•</span>
                          <span className="font-medium text-slate-600">{c.reporter.type}</span>
                        </div>
                      </td>

                      {/* Suspected Drug */}
                      <td className="py-3.5 px-4 font-medium text-slate-900">
                        <div className="flex items-center space-x-1.5">
                          <Pill className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                          <span className="font-semibold text-slate-900">{c.suspectedDrug.name}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 font-normal">
                          {c.suspectedDrug.dosage}
                        </div>
                      </td>

                      {/* Adverse Reaction */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="font-semibold text-slate-900 truncate">
                          {c.adverseEvent.primaryTerm}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono truncate">
                          PT: {c.adverseEvent.meddraPreferredTerm || 'Uncoded'}
                        </div>
                      </td>

                      {/* Seriousness */}
                      <td className="py-3.5 px-4">
                        {isSerious ? (
                          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-600"></span>
                            <span>SERIOUS</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                            <span>Non-Serious</span>
                          </span>
                        )}
                      </td>

                      {/* WHO-UMC & Naranjo */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center space-x-1.5">
                          <span className={`px-2 py-0.5 rounded-md font-bold text-[11px] ${
                            c.causality.whoUmcCategory.includes('Certain')
                              ? 'bg-purple-100 text-purple-800'
                              : c.causality.whoUmcCategory.includes('Probable')
                              ? 'bg-sky-100 text-sky-800'
                              : c.causality.whoUmcCategory.includes('Possible')
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}>
                            {c.causality.whoUmcCategory}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          Naranjo: <span className="font-bold text-slate-800">{c.causality.naranjoScore}</span> ({c.causality.naranjoCategory})
                        </div>
                      </td>

                      {/* Quality Score */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center space-x-2">
                          <div className="w-16 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <div 
                              className={`h-1.5 rounded-full ${
                                c.validation.qualityIndex >= 85 ? 'bg-emerald-500' : 'bg-amber-500'
                              }`} 
                              style={{ width: `${c.validation.qualityIndex}%` }}
                            />
                          </div>
                          <span className="font-bold text-slate-800 text-xs">
                            {c.validation.qualityIndex}%
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {c.validation.isValidICSR ? 'ICH E2B Valid' : 'Missing Fields'}
                        </div>
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectCase(c);
                          }}
                          className="inline-flex items-center space-x-1 text-sky-600 hover:text-sky-800 font-semibold px-2.5 py-1 rounded-lg hover:bg-sky-50 transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Review</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
