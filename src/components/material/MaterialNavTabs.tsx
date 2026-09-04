import React from 'react';

export type NavTabId = 'domain-components' | 'core-components' | 'patient-health' | 'report-reaction' | 'safety-records' | 'design-foundation';

interface MaterialNavTabsProps {
  activeTab: NavTabId;
  onTabChange: (tab: NavTabId) => void;
}

const TABS: { id: NavTabId; label: string; icon: string }[] = [
  { id: 'domain-components', label: 'Domain Components', icon: 'medical_services' },
  { id: 'core-components', label: 'Core Components', icon: 'widgets' },
  { id: 'patient-health', label: 'Patient Health', icon: 'person' },
  { id: 'report-reaction', label: 'Report a Reaction', icon: 'medication' },
  { id: 'safety-records', label: 'Safety Records', icon: 'clinical_notes' },
  { id: 'design-foundation', label: 'Design Tokens', icon: 'palette' },
];

export const MaterialNavTabs: React.FC<MaterialNavTabsProps> = ({ activeTab, onTabChange }) => {
  const activeIndex = TABS.findIndex((t) => t.id === activeTab);

  return (
    <nav
      id="apip-navigation-tabs"
      className="w-full m3-surface border-b border-[var(--md-sys-color-outline-variant)]/60 transition-colors"
      aria-label="APIP Primary Navigation"
    >
      <div className="max-w-[1400px] w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex border-b border-[var(--md-sys-color-outline-variant)]/40 overflow-x-auto no-scrollbar">
          {TABS.map((tab, idx) => {
            const isActive = tab.id === activeTab;
            return (
              <button
                key={tab.id}
                id={`apip-tab-${tab.id}`}
                role="tab"
                aria-selected={isActive}
                onClick={() => onTabChange(tab.id)}
                className={`flex items-center gap-2 py-3.5 px-4 sm:px-6 text-sm font-medium whitespace-nowrap transition-colors relative outline-none focus-visible:ring-2 focus-visible:ring-[var(--md-sys-color-primary)] rounded-t-md ${
                  isActive
                    ? 'text-[var(--md-sys-color-primary)] font-semibold'
                    : 'text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)] hover:bg-[var(--md-sys-color-surface-container-low)]'
                }`}
              >
                <span
                  className={`material-symbols-outlined text-xl ${
                    isActive ? 'filled text-[var(--md-sys-color-primary)]' : ''
                  }`}
                >
                  {tab.icon}
                </span>
                <span>{tab.label}</span>
                {isActive && (
                  <div
                    className="absolute bottom-0 left-0 right-0 h-0.75 bg-[var(--md-sys-color-primary)] rounded-t-full"
                    aria-hidden="true"
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
