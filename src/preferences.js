/* Appearance, language and companion preferences.

   Theme and language live here, not in App, so the choice reaches <html>
   before React's first paint. Reading them later would show one frame of the
   wrong theme, which is the flash a theme control exists to avoid. The chosen
   companion is read in the same pass because it is stored in the same record,
   and one read is all storage should need. */

import { SUPPORTED, setLocale } from './i18n.js';
import { PET_IDS, DEFAULT_PET } from './pets.js';

export const THEMES = ['system', 'light', 'dark'];

/* The key is still v1: a record saved before companions existed simply has no
   pet, and an absent value falls back to the loaf, which is what those readers
   were already looking at. */
const KEY = 'monty-preferences-v1';
const DEFAULTS = { theme: 'system', locale: 'en', pet: DEFAULT_PET };

export function readPreferences() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY));
    return {
      theme: THEMES.includes(saved?.theme) ? saved.theme : DEFAULTS.theme,
      locale: SUPPORTED.includes(saved?.locale) ? saved.locale : DEFAULTS.locale,
      pet: PET_IDS.includes(saved?.pet) ? saved.pet : DEFAULTS.pet,
    };
  } catch { /* A local file or a private window can refuse storage entirely. */ }
  return { ...DEFAULTS };
}

export function savePreferences(preferences) {
  try { localStorage.setItem(KEY, JSON.stringify(preferences)); } catch {}
}

/* 'system' removes the attribute instead of writing a resolved value:
   tokens.css keys its dark block off `prefers-color-scheme` *and*
   `:root:not([data-theme='light'])`, so leaving a stale attribute behind would
   pin the theme and stop it following the phone the next time the reader
   changes their own setting. */
export function applyTheme(theme) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  if (theme === 'system') root.removeAttribute('data-theme');
  else root.setAttribute('data-theme', theme);

  /* Narrowing color-scheme is what makes iOS render the native date, time and
     select controls in the chosen theme. Left at `light dark` they follow the
     phone instead and a forced-light app shows black system pickers. */
  root.style.colorScheme = theme === 'system' ? 'light dark' : theme;
  syncThemeColor();
}

/* Safari paints the area behind the status bar and the home indicator with
   theme-color. index.html ships two media-scoped tags so the first paint is
   right before this file runs, but a browser uses the first tag whose media
   matches: appending a third would lose to them whenever a forced theme
   disagrees with the device. So every tag is set to the resolved background
   instead, and the 'system' watcher re-runs this when the device flips. */
function syncThemeColor() {
  if (typeof document === 'undefined') return;
  const background = getComputedStyle(document.documentElement).getPropertyValue('--bg-app').trim();
  if (!background) return;
  const tags = document.querySelectorAll('meta[name="theme-color"]');
  if (!tags.length) {
    const meta = document.createElement('meta');
    meta.name = 'theme-color';
    meta.content = background;
    document.head.append(meta);
    return;
  }
  for (const tag of tags) tag.setAttribute('content', background);
}

export function applyLocale(locale) {
  setLocale(locale);
  syncThemeColor();
}

/* Applied before React mounts. Returns the preferences so App can seed its own
   state from the same read, and storage is only touched once. */
export function initPreferences() {
  const preferences = readPreferences();
  applyTheme(preferences.theme);
  applyLocale(preferences.locale);
  return preferences;
}

/* A reader on 'system' should follow the phone while the app is open, not only
   at load. Returns an unsubscribe function for the effect that owns it. */
export function watchSystemTheme(onChange) {
  if (typeof matchMedia !== 'function') return () => {};
  const query = matchMedia('(prefers-color-scheme: dark)');
  const handle = () => onChange(query.matches ? 'dark' : 'light');
  query.addEventListener('change', handle);
  return () => query.removeEventListener('change', handle);
}
