import React, { useEffect, useRef } from 'react';
import { M3Button, M3Select, M3Switch } from './core';
import { Appearance } from '../../design-system/appearance';

interface Props {
  value: Appearance;
  onChange: (value: Appearance) => void;
  onClose: () => void;
  saved: boolean;
}

export function AppearanceSettings({ value, onChange, onClose, saved }: Props) {
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => { heading.current?.focus(); }, []);

  return (
    <section id="appearance-settings" aria-labelledby="appearance-title"
      onKeyDown={(event) => { if (event.key === 'Escape') onClose(); }}
      className="border-b border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)]">
      <div className="mx-auto max-w-[1400px] space-y-5 px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4">
          <h2 id="appearance-title" ref={heading} tabIndex={-1} className="m3-title-large">Appearance settings</h2>
          <M3Button variant="text" onClick={onClose}>Close settings</M3Button>
        </div>
        <p className="m3-body-medium">White surfaces with your preferred highlight colour. These settings apply throughout the developer showcase.</p>
        <div className="grid max-w-2xl items-center gap-6 sm:grid-cols-2">
          <M3Select id="accent-choice" label="Highlight colour" value={value.accent}
            onChange={(accent) => {
              if (accent === 'blue' || accent === 'black' || accent === 'green') onChange({ ...value, accent });
            }}
            options={[{ value: 'blue', label: 'Blue (default)' }, { value: 'black', label: 'Black' }, { value: 'green', label: 'Green' }]} />
          <M3Switch id="appearance-dark" label="Dark mode" selected={value.isDark}
            onChange={(isDark) => onChange({ ...value, isDark })} />
        </div>
        <p role="status" className="m3-body-small text-[var(--md-sys-color-on-surface-variant)]">
          {saved ? 'Appearance saved in this browser.' : 'Appearance applied for this visit. Browser storage is unavailable.'}
        </p>
      </div>
    </section>
  );
}
