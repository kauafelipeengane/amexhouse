const RELEASE = '1.33.4',
  MAX_EVENTS = 20,
  KEY = 'amex-client-events',
  REMOTE_KEY = 'amex-remote-events';
const allowedCode = (value) =>
  String(value ?? 'unknown')
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .slice(0, 64);
const endpoint = String(import.meta.env.VITE_ERROR_ENDPOINT ?? '').trim();
function remoteAllowed() {
  try {
    const count = Number(sessionStorage.getItem(REMOTE_KEY) ?? 0);
    if (count >= 5) return false;
    sessionStorage.setItem(REMOTE_KEY, String(count + 1));
    return true;
  } catch (_storageError) {
    return false;
  }
}
function sendRemote(event) {
  if (!endpoint || !remoteAllowed()) return;
  try {
    const url = new URL(endpoint);
    if (url.protocol !== 'https:') return;
    void fetch(url.toString(), {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(event),
      keepalive: true,
      credentials: 'omit',
      referrerPolicy: 'no-referrer',
    }).catch(() => undefined);
  } catch (_urlError) {
    return;
  }
}
export function reportClientError(error, context = {}) {
  const event = {
    at: new Date().toISOString(),
    release: RELEASE,
    source: allowedCode(context.source),
    operation: allowedCode(context.operation),
    code: allowedCode(error?.code ?? error?.name),
    academy: allowedCode(context.academy),
  };
  try {
    const current = JSON.parse(sessionStorage.getItem(KEY) ?? '[]');
    sessionStorage.setItem(KEY, JSON.stringify([...current, event].slice(-MAX_EVENTS)));
    window.dispatchEvent(new CustomEvent('amex:client-error', { detail: event }));
  } catch (_storageError) {
    return event;
  }
  sendRemote(event);
  return event;
}
export function clientErrorSnapshot() {
  try {
    return JSON.parse(sessionStorage.getItem(KEY) ?? '[]');
  } catch (_storageError) {
    return [];
  }
}
