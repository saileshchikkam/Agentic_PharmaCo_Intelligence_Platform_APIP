import { Accent, getColorScheme } from './tokens';

export interface Appearance {
  accent: Accent;
  isDark: boolean;
}

const storageKey = 'apip.appearance.v1';

export function loadAppearance(): Appearance {
  try {
    const value = JSON.parse(localStorage.getItem(storageKey) ?? 'null');
    if (value && ['blue', 'black', 'green'].includes(value.accent) && typeof value.isDark === 'boolean') {
      return { accent: value.accent, isDark: value.isDark };
    }
  } catch {
    // A blocked or invalid preference must not prevent the showcase opening.
  }
  return { accent: 'blue', isDark: false };
}

export function applyAppearance(appearance: Appearance): boolean {
  const root = document.documentElement;
  root.classList.toggle('dark', appearance.isDark);
  root.style.colorScheme = appearance.isDark ? 'dark' : 'light';
  for (const [role, color] of Object.entries(getColorScheme(appearance.accent, appearance.isDark))) {
    const cssRole = role.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
    root.style.setProperty(`--md-sys-color-${cssRole}`, color);
  }
  try {
    localStorage.setItem(storageKey, JSON.stringify(appearance));
    return true;
  } catch {
    return false;
  }
}
