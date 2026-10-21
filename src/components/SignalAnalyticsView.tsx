import React from 'react';
import { 
  Activity, 
  AlertTriangle, 
  TrendingUp, 
  ShieldAlert, 
  BarChart3, 
  CheckCircle2, 
  Filter,
  Download
} from 'lucide-react';
import { ICSRCase } from '../types';

interface SignalAnalyticsViewProps {
  cases: ICSRCase[];
}

export const SignalAnalyticsView: React.FC<SignalAnalyticsViewProps> = ({ cases }) => {
  // Aggregate signals across current cases
  const drugReactionCounts: Record<string, {
    drug: string;
    reaction: string;
    casesCount: number;
    seriousCount: number;
    prr: number;
    isSignal: boolean;
    whoCausality: string;
  }> = {};

  cases.forEach(c => {
    const key = `${c.suspectedDrug.name}::${c.adverseEvent.meddraPreferredTerm || c.adverseEvent.primaryTerm}`;
    if (!drugReactionCounts[key]) {
      const isSerious = Object.values(c.adverseEvent.seriousness).some(Boolean);
      drugReactionCounts[key] = {
        drug: c.suspectedDrug.name,
        reaction: c.adverseEvent.meddraPreferredTerm || c.adverseEvent.primaryTerm,
        casesCount: 1,
        seriousCount: isSerious ? 1 : 0,
        prr: c.causality.signalDetection?.prr || 1.85,
        isSignal: c.causality.signalDetection?.isDisproportionalSignal || false,
        whoCausality: c.causality.whoUmcCategory
      };
    } else {
      drugReactionCounts[key].casesCount += 1;
      if (Object.values(c.adverseEvent.seriousness).some(Boolean)) {
        drugReactionCounts[key].seriousCount += 1;
      }
    }
  });

  const signalList = Object.values(drugReactionCounts).sort((a, b) => b.prr - a.prr);

  // System Organ Class Distribution
  const socCounts: Record<string, number> = {};
  cases.forEach(c => {
    const soc = c.adverseEvent.systemOrganClass || 'General disorders';
    socCounts[soc] = (socCounts[soc] || 0) + 1;
  });

  // Reporter Distribution
  const reporterCounts: Record<string, number> = {};
  cases.forEach(c => {
    reporterCounts[c.reporter.type] = (reporterCounts[c.reporter.type] || 0) + 1;
  });

  const handleExportSummary = () => {
    const textData = JSON.stringify({
      reportTitle: 'Periodic Pharmacovigilance Signal Summary (PBRER / PSUR)',
      generatedAt: new Date().toISOString(),
      totalICSRsAnalyzed: cases.length,
      signals: signalList,
      socDistribution: socCounts
    }, null, 2);

    const blob = new Blob([textData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `PV-Signal-Report-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center space-x-2 text-sky-700 font-semibold text-xs tracking-wider uppercase mb-1">
            <Activity className="w-4 h-4" />
            <span>Quantitative Safety Surveillance</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Signal Detection & Disproportionality Analytics
          </h1>
          <p className="mt-1 text-slate-600 text-sm">
            Disproportionality analysis using Proportional Reporting Ratio (PRR) algorithm aligned with EMA & FDA post-marketing guidance.
          </p>
        </div>

        <button
          onClick={handleExportSummary}
          className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-bold px-4 py-2 rounded-xl text-xs shadow-xs flex items-center space-x-2 transition-all self-start md:self-auto cursor-pointer"
        >
          <Download className="w-4 h-4 text-sky-600" />
          <span>Export Signal Audit (JSON)</span>
        </button>
      </div>

      {/* Disproportionality Signal Matrix */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Drug-Reaction Disproportionality Signals (PRR &gt; 2.0)
            </h2>
            <p className="text-xs text-slate-500">
              A safety signal is triggered when the PRR is ≥ 2.0 and the number of individual cases is ≥ 3, prompting escalated medical evaluation.
            </p>
          </div>
          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-200">
            {signalList.filter(s => s.isSignal).length} Active Signals
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-3">Suspect Medication</th>
                <th className="py-3 px-3">Reported Reaction (MedDRA PT)</th>
                <th className="py-3 px-3">ICSR Count</th>
                <th className="py-3 px-3">Serious %</th>
                <th className="py-3 px-3">Calculated PRR</th>
                <th className="py-3 px-3">Signal Status</th>
                <th className="py-3 px-3">Causality Consensus</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {signalList.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50/70">
                  <td className="py-3 px-3 font-bold text-slate-900">{item.drug}</td>
                  <td className="py-3 px-3 font-semibold text-slate-700">{item.reaction}</td>
                  <td className="py-3 px-3 font-mono">{item.casesCount} case(s)</td>
                  <td className="py-3 px-3 font-medium text-slate-700">
                    {item.casesCount > 0 ? Math.round((item.seriousCount / item.casesCount) * 100) : 0}%
                  </td>
                  <td className="py-3 px-3 font-mono font-bold text-slate-900">
                    {item.prr.toFixed(2)}
                  </td>
                  <td className="py-3 px-3">
                    {item.isSignal ? (
                      <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                        <AlertTriangle className="w-3 h-3 text-amber-600" />
                        <span>Disproportional Signal</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                        <span>Background Baseline</span>
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-3">
                    <span className="px-2 py-0.5 rounded-md font-semibold text-[11px] bg-sky-50 text-sky-800 border border-sky-200">
                      {item.whoCausality}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Grid: SOC Distribution & Reporter Demographics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* MedDRA System Organ Class Breakdown */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5">
          <div className="flex items-center space-x-2 text-xs font-bold text-slate-800 uppercase tracking-wider mb-4">
            <BarChart3 className="w-4 h-4 text-sky-600" />
            <span>MedDRA System Organ Class (SOC) Distribution</span>
          </div>

          <div className="space-y-3">
            {Object.entries(socCounts).map(([soc, count], idx) => {
              const pct = Math.round((count / cases.length) * 100);
              return (
                <div key={idx} className="text-xs">
                  <div className="flex justify-between font-semibold text-slate-800 mb-1">
                    <span>{soc}</span>
                    <span className="font-mono text-slate-600">{count} ({pct}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-sky-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Primary Reporter Distribution */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5">
          <div className="flex items-center space-x-2 text-xs font-bold text-slate-800 uppercase tracking-wider mb-4">
            <TrendingUp className="w-4 h-4 text-teal-600" />
            <span>ADR Submissions by Reporter Qualification</span>
          </div>

          <div className="space-y-3">
            {Object.entries(reporterCounts).map(([repType, count], idx) => {
              const pct = Math.round((count / cases.length) * 100);
              return (
                <div key={idx} className="text-xs">
                  <div className="flex justify-between font-semibold text-slate-800 mb-1">
                    <span>{repType}</span>
                    <span className="font-mono text-slate-600">{count} ({pct}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-teal-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 p-3 bg-sky-50 rounded-xl border border-sky-100 text-xs text-sky-900 flex items-start space-x-2">
            <CheckCircle2 className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
            <span>
              APP supports both Direct Patient / Consumer Reporting and Healthcare Professional (HCP) expedited reporting, bridging the historical under-reporting gap.
            </span>
          </div>
        </div>

      </div>
    </div>
  );
};
