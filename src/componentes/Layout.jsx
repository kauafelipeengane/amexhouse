import { reportClientError } from '../lib/errorReporter';
import React, { useEffect, useRef, useState } from 'react';
import logoStaticFallback from '../assets/logo-static.webp';
import logoStatic from '../assets/AMEX_HOUSE.webp';
import pentestLogo from '../assets/portal/AMEX_PENTEST.webp';
import pythonLogo from '../assets/portal/AMEX_PYTHON.webp';
import javascriptLogo from '../assets/academies/javascript.webp';
import dataLogo from '../assets/academies/data.webp';
import devopsLogo from '../assets/academies/devops.webp';
import { supabase } from '../lib/supabase';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { AcademyNavigationTree } from './navigation/AcademyNavigationTree';
const items = [
  ['home', 'INÍCIO'],
  ['courses', 'Curso'],
  ['notes', 'ANOTAÇÕES'],
  ['saved', 'SALVOS'],
  ['progress', 'Progresso'],
  ['activities', 'ATIVIDADES'],
  ['insights', 'DESEMPENHO'],
  ['goals', 'META'],
  ['certificate', 'CERTIFICADO'],
];
export function Layout({
  page,
  setPage,
  query,
  setQuery,
  children,
  academy,
  data,
  currentLessonId,
  openLesson,
}) {
  const areaLogo =
    academy === 'pentest'
      ? pentestLogo
      : academy === 'python'
        ? pythonLogo
        : academy === 'javascript'
          ? javascriptLogo
          : academy === 'data'
            ? dataLogo
            : academy === 'devops'
              ? devopsLogo
              : logoStatic;
  const [open, setOpen] = useState(false),
    [collapsed, setCollapsed] = useState(() => {
      try {
        return localStorage.getItem('amex-sidebar') === 'collapsed';
      } catch (error) {
        reportClientError(error, { source: 'components/Layout.jsx' });
        return false;
      }
    }),
    [signingOut, setSigningOut] = useState(false),
    [logoutError, setLogoutError] = useState(''),
    online = useOnlineStatus(),
    menuButton = useRef(null);
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') {
        setOpen(false);
        menuButton.current?.focus();
      }
    };
    addEventListener('keydown', handler);
    return () => removeEventListener('keydown', handler);
  }, []);
  useEffect(() => {
    document.body.classList.toggle('nav-open', open);
    const panel = open ? document.querySelector('#main-menu') : null;
    if (!panel)
      return () => {
        document.body.classList.remove('nav-open');
        document.body.style.removeProperty('overflow');
      };
    const focusable = [
      ...panel.querySelectorAll('button,input,[href],[tabindex]:not([tabindex="-1"])'),
    ];
    focusable[0]?.focus();
    const trap = (e) => {
      if (e.key !== 'Tab' || !focusable.length) return;
      const first = focusable[0],
        last = focusable.at(-1);
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    panel.addEventListener('keydown', trap);
    return () => {
      panel.removeEventListener('keydown', trap);
      document.body.classList.remove('nav-open');
      document.body.style.removeProperty('overflow');
    };
  }, [open]);
  async function signOut() {
    if (signingOut) return;
    setSigningOut(true);
    setLogoutError('');
    try {
      const { error } = await supabase.auth.signOut();
      if (error) setLogoutError('Não foi possível sair. Tente novamente.');
    } catch (error) {
      reportClientError(error, { source: 'components/Layout.jsx' });
      setLogoutError('Não foi possível sair. Tente novamente.');
    } finally {
      setSigningOut(false);
    }
  }
  const go = (id) => {
    setPage(id);
    setQuery('');
    setOpen(false);
    scrollTo({
      top: 0,
      behavior:
        typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches
          ? 'auto'
          : 'smooth',
    });
  };
  const toggleCollapse = () =>
    setCollapsed((x) => {
      try {
        localStorage.setItem('amex-sidebar', x ? 'expanded' : 'collapsed');
      } catch (error) {
        reportClientError(error, { source: 'components/Layout.jsx' });
      }
      return !x;
    });
  return (
    <main className={`shell ${collapsed ? 'is-collapsed' : ''}`}>
      <p id="route-announcer" className="sr-only" aria-live="polite" aria-atomic="true" />
      <a className="skip-link" href="#main-content">
        Pular para o conteúdo
      </a>
      <button
        ref={menuButton}
        type="button"
        className="menu-button"
        onClick={() => setOpen(true)}
        aria-expanded={open}
        aria-controls="main-menu"
      >
        MENU
      </button>
      {open && (
        <button
          type="button"
          className="overlay"
          onClick={() => setOpen(false)}
          aria-label="Fechar menu"
        />
      )}
      <aside id="main-menu" aria-label="Menu principal" className={open ? 'open' : ''}>
        <header className="drawer-header">
          <div className="brand">
            <span className="brand-logo" aria-hidden="true">
              <img
                className="brand-logo-animated"
                src={areaLogo}
                alt=""
                width="48"
                height="48"
                decoding="async"
              />
            </span>
            <b>
              AMEX <i>HOUSE</i>
            </b>
          </div>
          <div className="sidebar-header-actions">
            <button
              type="button"
              className="collapse-button"
              onClick={toggleCollapse}
              aria-label={collapsed ? 'Expandir menu lateral' : 'Recolher menu lateral'}
              aria-pressed={collapsed}
              title={collapsed ? 'Expandir menu' : 'Recolher menu'}
            >
              <span className="sidebar-toggle-icon" aria-hidden="true">
                <i />
                <i />
              </span>
            </button>
            <button
              type="button"
              className="drawer-close"
              onClick={() => setOpen(false)}
              aria-label="Fechar menu"
            >
              ×
            </button>
          </div>
        </header>
        <button
          type="button"
          className="academy-return"
          onClick={() => setPage('portal')}
          aria-label="Voltar ao Portal AMEX"
        >
          <span className="academy-return-arrow" aria-hidden="true">
            ←
          </span>
          <span>Portal AMEX</span>
        </button>
        <div className="academy-label">
          {academy === 'python'
            ? 'AMEX PYTHON'
            : academy === 'pentest'
              ? 'AMEX PENTEST'
              : academy === 'javascript'
                ? 'AMEX JAVASCRIPT'
                : academy === 'data'
                  ? 'AMEX DATA'
                  : academy === 'devops'
                    ? 'AMEX OPS'
                    : 'ÁREA ACADÊMICA'}
        </div>
        <AcademyNavigationTree
          data={data}
          page={page}
          currentLessonId={currentLessonId}
          academy={academy}
          onSection={go}
          onLesson={(id) => {
            openLesson?.(id);
            setOpen(false);
          }}
        />
        <div className="drawer-footer">
          <span
            role="status"
            aria-live="polite"
            className={online ? 'connection online' : 'connection offline'}
          >
            {online ? 'Online' : 'Offline'}
          </span>
          {logoutError && (
            <p className="logout-error" role="alert">
              {logoutError}
            </p>
          )}
          <button type="button" className="logout" disabled={signingOut} onClick={signOut}>
            {signingOut ? 'Saindo...' : 'SAIR'}
          </button>
        </div>
      </aside>
      <section
        id="main-content"
        className="workspace"
        tabIndex="-1"
        role="main"
        aria-label="Conteúdo principal"
      >
        {children}
      </section>
    </main>
  );
}
