import { reportClientError } from './errorReporter';
import { storage } from './utils';
export const defaultPreferences = Object.freeze({
  theme: 'dark',
  density: 'comfortable',
  reduceMotion: false,
  logoMotion: true,
});
const normalizePreferences = (value) => ({
  theme: ['light', 'dark', 'system'].includes(value?.theme)
    ? value.theme
    : defaultPreferences.theme,
  density: ['compact', 'comfortable', 'spacious'].includes(value?.density)
    ? value.density
    : defaultPreferences.density,
  reduceMotion: value?.reduceMotion === true,
  logoMotion: value?.logoMotion !== false,
});
export function readPreferences() {
  try {
    const parsed = JSON.parse(storage.get('amex-preferences', '{}'));
    return normalizePreferences(
      parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : defaultPreferences,
    );
  } catch (error) {
    reportClientError(error, { source: 'lib/preferences.js' });
    return { ...defaultPreferences };
  }
}
export function applyPreferences(prefs = readPreferences()) {
  prefs = normalizePreferences(prefs);
  const root = document.documentElement,
    theme =
      prefs.theme === 'system'
        ? typeof matchMedia === 'function' && matchMedia('(prefers-color-scheme: light)').matches
          ? 'light'
          : 'dark'
        : prefs.theme;
  root.dataset.theme = ['light', 'dark'].includes(theme) ? theme : 'dark';
  root.dataset.density = ['compact', 'comfortable', 'spacious'].includes(prefs.density)
    ? prefs.density
    : 'comfortable';
  root.dataset.motion = prefs.reduceMotion ? 'reduced' : 'full';
  root.dataset.logoMotion = prefs.logoMotion ? 'on' : 'off';
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute('content', root.dataset.theme === 'light' ? '#f4f7f5' : '#030604');
  return prefs;
}
export function savePreferences(prefs) {
  const normalized = normalizePreferences(prefs),
    saved = storage.set('amex-preferences', JSON.stringify(normalized));
  applyPreferences(normalized);
  return saved;
}

export function watchSystemTheme() {
  if (typeof matchMedia !== 'function') return () => {};
  const media = matchMedia('(prefers-color-scheme: light)'),
    sync = () => {
      const prefs = readPreferences();
      if (prefs.theme === 'system') applyPreferences(prefs);
    };
  media.addEventListener?.('change', sync);
  return () => media.removeEventListener?.('change', sync);
}
