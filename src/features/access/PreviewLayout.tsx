import React, { useEffect, useState } from 'react';
import { M3Button } from '../../components/material/core';
import type { Appearance } from '../../design-system/appearance';
import { followPreviewLink } from './navigation';
import './access.css';

export function Brand({ large = false }: { large?: boolean }) {
  return <span className={`access-brand ${large ? 'access-brand-large' : ''}`}>
    <svg viewBox="0 0 40 40" fill="none" aria-hidden="true">
      <rect x="4" y="14" width="32" height="12" rx="6" fill="currentColor" opacity=".7" />
      <rect x="14" y="4" width="12" height="32" rx="6" fill="currentColor" />
      <circle cx="20" cy="20" r="3" fill="var(--md-sys-color-surface)" />
    </svg><span>APIP</span>
  </span>;
}

interface HeaderProps {
  screen: 'home' | 'patient-home' | 'sign-in' | 'adr-preview' | 'medassist-preview' | 'developer-reference';
  appearance: Appearance;
  setAppearance: React.Dispatch<React.SetStateAction<Appearance>>;
  preferencesSaved: boolean;
  onHelp?: () => void;
}

export function PreviewHeader({ screen, appearance, setAppearance, preferencesSaved, onHelp }: HeaderProps) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const closeSettings = () => { setSettingsOpen(false); document.getElementById('access-settings-button')?.focus(); };
  useEffect(() => { setSettingsOpen(false); }, [screen]);
  useEffect(() => {
    if (!settingsOpen) return;
    let disposed = false;
    const button = document.getElementById(`access-accent-${appearance.accent}`) as (HTMLElement & { updateComplete: Promise<boolean> }) | null;
    void button?.updateComplete.then(() => { if (!disposed) button.focus(); });
    return () => { disposed = true; };
  }, [settingsOpen, appearance.accent]);
  return <header className={`access-header ${settingsOpen ? 'access-header-settings-open' : ''}`} onKeyDown={(event) => {
      if (settingsOpen && event.key === 'Escape') { event.preventDefault(); closeSettings(); }
    }}>
      <a className="access-home-link" href="#/" aria-label="APIP home" onClick={(event) => followPreviewLink(event, '/')}><Brand /></a>
      <div className="access-header-actions">
        <nav className="access-header-navigation" aria-label="Main navigation">
          <a className="access-nav-link" href="#/" aria-current={screen === 'home' ? 'page' : undefined}
            onClick={(event) => followPreviewLink(event, '/')}>Home</a>
          {!settingsOpen && <>
            <a className="access-nav-link access-patients-link" href="#/patient/home" aria-current={screen === 'patient-home' ? 'page' : undefined}
              onClick={(event) => followPreviewLink(event, '/patient/home')}>For patients</a>
            <a className="access-nav-link" href="#/sign-in/patient" aria-current={screen === 'sign-in' ? 'page' : undefined}
              onClick={(event) => followPreviewLink(event, '/sign-in/patient')}>Log in</a>
          </>}
        </nav>
        {settingsOpen && <div id="access-appearance-settings" className="access-header-preferences" role="group" aria-label="Appearance settings">
          <span className="access-appearance-label">Appearance</span>
          <div className="access-accent-options" role="group" aria-label="Highlight colour">
            {(['blue', 'red', 'yellow', 'green'] as const).map((accent) => <md-icon-button key={accent} id={`access-accent-${accent}`}
              aria-label={`${accent[0].toUpperCase()}${accent.slice(1)} highlight`} toggle selected={appearance.accent === accent || undefined}
              onClick={() => setAppearance((value) => ({ ...value, accent }))}>
              <span className={`access-accent-dot access-accent-${accent}`} aria-hidden="true">
                {appearance.accent === accent && <span className="material-symbols-outlined">check</span>}
              </span>
            </md-icon-button>)}
          </div>
          <md-icon-button aria-label="Dark mode" toggle selected={appearance.isDark || undefined}
            onClick={() => setAppearance((value) => ({ ...value, isDark: !value.isDark }))}>
            <md-icon><span className="material-symbols-outlined">{appearance.isDark ? 'dark_mode' : 'light_mode'}</span></md-icon>
          </md-icon-button>
          <span className="access-preference-status" role="status">{preferencesSaved ? 'Appearance saved in this browser.' : 'Appearance applies to this visit only.'}</span>
        </div>}
        <md-icon-button id="access-settings-button" aria-label={settingsOpen ? 'Close appearance settings' : 'Appearance settings'} aria-expanded={settingsOpen}
          aria-controls={settingsOpen ? 'access-appearance-settings' : undefined} onClick={() => settingsOpen ? closeSettings() : setSettingsOpen(true)}>
          <md-icon><span className="material-symbols-outlined">{settingsOpen ? 'close' : 'settings'}</span></md-icon>
        </md-icon-button>
        {onHelp && !settingsOpen && <M3Button className="access-help-button" variant="text" leadingIcon="help" ariaLabel="Help with patient home" onClick={onHelp}><span className="access-help-label">Help</span></M3Button>}
      </div>
    </header>;
}

/** A permanent 48px navigation slot keeps every screen's Back control aligned. */
export function PageNavigation({ onBack, backLabel = 'Back' }: { onBack?: () => void; backLabel?: string }) {
  return <nav className="access-page-navigation" aria-label="Page navigation">
    {onBack && <M3Button variant="text" leadingIcon="arrow_back" ariaLabel={backLabel} onClick={onBack}>Back</M3Button>}
  </nav>;
}
