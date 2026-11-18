import { reportClientError } from './lib/errorReporter';
import { applyPreferences, watchSystemTheme } from './lib/preferences';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import './style.css';
import './styles/production-fixes.css';
import './styles/official-ui.css';
import './styles/rigorous-rebuild.css';
applyPreferences();
const stopSystemTheme = watchSystemTheme();
if (import.meta.hot) import.meta.hot.dispose(stopSystemTheme);
const root = document.getElementById('root');
if (!root) throw new Error('Elemento raiz da aplicação não encontrado.');
window.addEventListener('error', (event) =>
  reportClientError(event.error, { source: 'window', operation: 'uncaught' }),
);
window.addEventListener('unhandledrejection', (event) =>
  reportClientError(event.reason, { source: 'window', operation: 'promise' }),
);
createRoot(root).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
