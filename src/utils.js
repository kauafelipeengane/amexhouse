import { reportClientError } from './errorReporter';
export const asArray = (value) => (Array.isArray(value) ? value : []);
export const sanitizeYoutubeId = (value) => {
  const id = String(value ?? '')
    .replaceAll('\\', '')
    .trim();
  return /^[A-Za-z0-9_-]{11}$/.test(id) ? id : '';
};
export const formatDate = (value) => {
  const date = value ? new Date(value) : null;
  return date && !Number.isNaN(date.getTime())
    ? date.toLocaleDateString('pt-BR')
    : 'Data não disponível';
};
export const formatTime = (seconds) =>
  `${Math.floor((Number(seconds) || 0) / 60)}:${String((Number(seconds) || 0) % 60).padStart(2, '0')}`;
export const clamp = (value, min = 0, max = 100) =>
  Math.min(max, Math.max(min, Number(value) || 0));
export const result = (data = null, error = null) => ({ data, error });

export const storage = {
  get: (key, fallback = null) => {
    try {
      const value = localStorage.getItem(key);
      return value === null ? fallback : value;
    } catch (error) {
      reportClientError(error, { source: 'lib/utils.js' });
      return fallback;
    }
  },
  set: (key, value) => {
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (error) {
      reportClientError(error, { source: 'lib/utils.js' });
      return false;
    }
  },
  remove: (key) => {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      reportClientError(error, { source: 'lib/utils.js' });
      return false;
    }
  },
};

export const safeNumber = (value, fallback = 0) =>
  Number.isFinite(Number(value)) ? Number(value) : fallback;
export const safePercent = (value) => clamp(Math.round(safeNumber(value)));
export const validDate = (value) => {
  const date = value ? new Date(value) : null;
  return date && !Number.isNaN(date.getTime()) ? date : null;
};
