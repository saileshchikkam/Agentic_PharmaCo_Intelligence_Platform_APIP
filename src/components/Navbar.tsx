import React from 'react';
import { 
  ShieldAlert, 
  FileText, 
  Activity, 
  BookOpen, 
  Cpu, 
  Sparkles,
  Stethoscope
} from 'lucide-react';

interface NavbarProps {
  currentTab: 'intake' | 'dashboard' | 'signals' | 'research';
  setCurrentTab: (tab: 'intake' | 'dashboard' | 'signals' | 'research') => void;
  caseCount: number;
  seriousCaseCount: number;
  onOpenResearchModal: () => void;
  apiStatus: { ok: boolean; geminiConfigured: boolean };
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  caseCount,
  seriousCaseCount,
  onOpenResearchModal,
  apiStatus
}) => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 to-teal-500 flex items-center justify-center text-white shadow-sm ring-2 ring-sky-100">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-slate-900 text-lg tracking-tight">APP</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200">
                  Agentic Pharmacovigilance
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium hidden sm:block">
                AI Decision Support for Adverse Drug Reaction Reporting & Analysis
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center space-x-1 sm:space-x-2">
            <button
              id="nav-intake-tab"
              onClick={() => setCurrentTab('intake')}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                currentTab === 'intake'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Stethoscope className="w-4 h-4" />
              <span>Report ADR</span>
            </button>

            <button
              id="nav-dashboard-tab"
              onClick={() => setCurrentTab('dashboard')}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-semibold transition-all relative ${
                currentTab === 'dashboard'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Safety Inbox</span>
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
                currentTab === 'dashboard' ? 'bg-sky-700 text-white' : 'bg-slate-200 text-slate-700'
              }`}>
                {caseCount}
              </span>
              {seriousCaseCount > 0 && (
                <span className="w-2 h-2 rounded-full bg-rose-500 absolute -top-0.5 -right-0.5" title="Serious ICSRs Pending" />
              )}
            </button>

            <button
              id="nav-signals-tab"
              onClick={() => setCurrentTab('signals')}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                currentTab === 'signals'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Activity className="w-4 h-4" />
              <span className="hidden md:inline">Signal Analytics</span>
              <span className="md:hidden">Signals</span>
            </button>

            <button
              id="nav-research-btn"
              onClick={onOpenResearchModal}
              className="flex items-center space-x-1.5 px-2.5 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200"
            >
              <BookOpen className="w-3.5 h-3.5 text-teal-600" />
              <span className="hidden sm:inline">PvPI & Research</span>
            </button>
          </nav>

          {/* AI Multi-Agent Status */}
          <div className="hidden lg:flex items-center space-x-2 text-xs font-medium border-l border-slate-200 pl-4">
            <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
              <Cpu className="w-3.5 h-3.5 text-sky-600" />
              <span>4 Agents: Active</span>
            </div>
            {apiStatus.geminiConfigured ? (
              <span className="flex items-center space-x-1 text-teal-700 font-semibold bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">
                <Sparkles className="w-3 h-3 text-teal-600" />
                <span>Gemini 2.5 Live</span>
              </span>
            ) : (
              <span className="flex items-center space-x-1 text-slate-500 bg-slate-50 px-2 py-0.5 rounded-full border border-slate-200" title="API running in hybrid rule-based PV mode">
                <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse"></span>
                <span>Hybrid PV Engine</span>
              </span>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
