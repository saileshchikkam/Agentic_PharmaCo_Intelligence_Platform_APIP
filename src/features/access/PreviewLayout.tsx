import { ArrowLeft, Check, CircleHelp, LogOut, Moon, Settings, Sun, X } from 'lucide-react';
import { useAccount } from '../account/AccountProvider';
import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { M3Button } from '../../components/material/core';
import type { Appearance } from '../../design-system/appearance';
import { followPreviewLink, navigatePreview } from './navigation';
import { useDiscreetDeveloperAccess } from './discreetDeveloperAccess';
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
  screen: 'specialist' | 'profile' | 'home' | 'patient-home' | 'sign-in' | 'adr-preview' | 'adr-cases' | 'medassist-preview' | 'medassist-conversation' | 'developer-reference';
  appearance: Appearance;
  setAppearance: React.Dispatch<React.SetStateAction<Appearance>>;
  preferencesSaved: boolean;
  onHelp?: () => void;
}

export function PreviewHeader({ screen, appearance, setAppearance, preferencesSaved, onHelp }: HeaderProps) {
  const account = useAccount();
  const header = useRef<HTMLElement>(null);
  useEffect(() => {
    const element = header.current;
    if (!element) return;
    const root = document.documentElement;
    const measure = () => root.style.setProperty('--apip-header-height', `${element.offsetHeight}px`);
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    measure();
    return () => { observer.disconnect(); root.style.removeProperty('--apip-header-height'); };
  }, []);
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
  return <header ref={header} className="access-header" onKeyDown={(event) => {
      if (settingsOpen && event.key === 'Escape') { event.preventDefault(); closeSettings(); }
    }}>
      <a className="access-home-link" href="#/" aria-label="APIP home" onClick={(event) => followPreviewLink(event, '/')}><Brand /></a>
      <div className="access-header-actions">
        <nav className="access-header-navigation" aria-label="Main navigation">
          <a className="access-nav-link" href="#/" aria-current={screen === 'home' ? 'page' : undefined}
            onClick={(event) => followPreviewLink(event, '/')}>Home</a>
          {(!account.user||account.portal==='patient')&&<a className="access-nav-link access-patients-link" href={account.user ? "#/patient/home" : "#/sign-in/patient"} aria-current={screen === 'patient-home' ? 'page' : undefined}
            onClick={(event) => followPreviewLink(event, account.user ? '/patient/home' : '/sign-in/patient')}>For patients</a>}
          {(!account.user||account.portal==='specialist')&&<a className="access-nav-link access-specialists-link" href={account.user ? "#/specialist" : "#/sign-in/specialist"} aria-current={screen === 'specialist' ? 'page' : undefined}
            onClick={(event) => followPreviewLink(event, account.user ? '/specialist' : '/sign-in/specialist')}>For specialists</a>}
          {account.user ? (
            <>
              <a className="access-nav-link" href="#/account/profile" onClick={event => followPreviewLink(event, '/account/profile')}>Profile</a>
              <md-icon-button aria-label="Sign out" title="Sign out" onClick={() => {
                const leave = new CustomEvent('apip:before-navigate', { cancelable: true, detail: { to: '/' } });
                if (!window.dispatchEvent(leave)) return;
                try {
                  sessionStorage.removeItem('apip.account.continue');
                  sessionStorage.removeItem('apip.account.return');
                  sessionStorage.removeItem('apip.last.role');
                } catch {}
                navigatePreview('/', { replace: true });
                void account.signOut();
              }}>
                <LogOut size={22} aria-hidden="true" />
              </md-icon-button>
            </>
          ) : (
            <a className="access-nav-link" href="#/sign-in/patient" aria-current={screen === 'sign-in' ? 'page' : undefined}
              onClick={(event) => followPreviewLink(event, '/sign-in/patient')}>Log in</a>
          )}
        </nav>
        {settingsOpen && <div id="access-appearance-settings" className="access-header-preferences" role="group" aria-label="Appearance settings">
          <span className="access-appearance-label">Appearance</span>
          <div className="access-accent-options" role="group" aria-label="Highlight colour">
            {(['blue', 'red', 'yellow', 'green'] as const).map((accent) => <md-icon-button key={accent} id={`access-accent-${accent}`}
              aria-label={`${accent[0].toUpperCase()}${accent.slice(1)} highlight`} toggle selected={appearance.accent === accent || undefined}
              onClick={() => setAppearance((value) => ({ ...value, accent }))}>
              <span className={`access-accent-dot access-accent-${accent}`} aria-hidden="true">
                {appearance.accent === accent && <Check size={16} />}
              </span>
            </md-icon-button>)}
          </div>
          <md-icon-button aria-label="Dark mode" toggle selected={appearance.isDark || undefined}
            onClick={() => setAppearance((value) => ({ ...value, isDark: !value.isDark }))}>
            {appearance.isDark ? <Moon size={22} aria-hidden="true" /> : <Sun size={22} aria-hidden="true" />}
          </md-icon-button>
          <span className="access-preference-status" role="status">{preferencesSaved ? 'Appearance saved in this browser.' : 'Appearance applies to this visit only.'}</span>
        </div>}
        <md-icon-button id="access-settings-button" aria-label={settingsOpen ? 'Close appearance settings' : 'Appearance settings'} aria-expanded={settingsOpen}
          aria-controls={settingsOpen ? 'access-appearance-settings' : undefined} onClick={() => settingsOpen ? closeSettings() : setSettingsOpen(true)}>
          {settingsOpen ? <X size={22} aria-hidden="true" /> : <Settings size={22} aria-hidden="true" />}
        </md-icon-button>
        {onHelp && <span className="access-help-button"><M3Button variant="text" leadingIcon={<CircleHelp size={20} />} ariaLabel="Help with patient home" onClick={onHelp}><span className="access-help-label">Help</span></M3Button></span>}
      </div>
    </header>;
}

export function PreviewFooter({ children }: { children?: React.ReactNode }) {
  useDiscreetDeveloperAccess();
  return <footer className="access-footer">
    <p>APIP is an AI-assisted research platform and is not a substitute for professional medical advice, diagnosis, or treatment. Reports are not automatically submitted to PvPI.</p>
    {children}
  </footer>;
}

export function PageNavigation({ onBack, backLabel = 'Back' }: { onBack?: () => void; backLabel?: string }) {
  const [host,setHost]=useState<HTMLElement|null>(null);
  useLayoutEffect(()=>{setHost(document.getElementById('access-back-navigation'));},[]);
  if (!onBack || !host) return null;
  return createPortal(<nav className="access-page-navigation" aria-label="Page navigation">
    <M3Button variant="text" leadingIcon={<ArrowLeft size={18} />} ariaLabel={backLabel} onClick={onBack}>Back</M3Button>
  </nav>,host);
}
