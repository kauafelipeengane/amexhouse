import { reportClientError } from '../lib/errorReporter';
import React, { useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import pentestArt from '../assets/portal/AMEX_PENTEST_BANNER.webp';
import pythonArt from '../assets/portal/AMEX_PYTHON_BANNER.webp';
import storeArt from '../assets/portal/AMEX_STORE_X.webp';
import javascriptArt from '../assets/portal/javascript-exato.webp';
import dataArt from '../assets/portal/data-exato.webp';
import devopsArt from '../assets/portal/devops-exato.webp';
import pentestPoster from '../assets/posters/pentest.webp';
import pythonPoster from '../assets/posters/python.webp';
import javascriptPoster from '../assets/posters/javascript.webp';
import dataPoster from '../assets/posters/data.webp';
import devopsPoster from '../assets/posters/devops.webp';
import storePoster from '../assets/posters/store.webp';
import logoStaticFallback from '../assets/logo-static.webp';
import logoStatic from '../assets/AMEX_HOUSE.webp';
import storeLogo from '../assets/portal/AMEX_STORE.webp';
import { LazyAnimatedArtwork } from '../components/LazyAnimatedArtwork';
import './portal.css';
import { NotificationCenter } from '../components/NotificationCenter';
import { readPreferences, savePreferences } from '../lib/preferences';
const areas = [
  {
    route: 'pentest',
    poster: pentestPoster,
    href: '#/academy/pentest/courses',
    n: '01',
    kind: 'FORMAÇÃO EM SEGURANÇA',
    title: 'AMEX PENTEST',
    copy: 'Pentest de aplicações, redes e infraestrutura em laboratórios controlados.',
    action: 'ACESSAR PENTEST',
    image: pentestArt,
  },
  {
    route: 'python',
    poster: pythonPoster,
    href: '#/academy/python/courses',
    n: '02',
    kind: 'FORMAÇÃO EM DESENVOLVIMENTO',
    title: 'AMEX PYTHON',
    copy: 'Python, APIs, automação, testes e serviços prontos para produção.',
    action: 'ACESSAR PYTHON',
    image: pythonArt,
  },
  {
    route: 'javascript',
    poster: javascriptPoster,
    href: '#/academy/javascript/courses',
    n: '03',
    kind: 'DESENVOLVIMENTO FULL STACK',
    title: 'AMEX JAVASCRIPT',
    copy: 'JavaScript, TypeScript, React e Node.js, do navegador ao deploy.',
    action: 'ACESSAR JAVASCRIPT',
    image: javascriptArt,
  },
  {
    route: 'data',
    poster: dataPoster,
    href: '#/academy/data/courses',
    n: '04',
    kind: 'DADOS E ANALYTICS',
    title: 'AMEX DATA',
    copy: 'SQL, análise, estatística, pipelines e inteligência de negócio.',
    action: 'ACESSAR DATA',
    image: dataArt,
  },
  {
    route: 'devops',
    poster: devopsPoster,
    href: '#/academy/devops/courses',
    n: '05',
    kind: 'PLATAFORMA E CONFIABILIDADE',
    title: 'AMEX OPS',
    copy: 'Linux, CI/CD, containers, cloud, Kubernetes e observabilidade.',
    action: 'ACESSAR OPS',
    image: devopsArt,
  },
  {
    route: 'store',
    poster: storePoster,
    href: '#/store',
    n: '06',
    kind: 'PRODUTOS OFICIAIS',
    title: 'AMEX STORE',
    copy: 'Uma área independente para produtos, edições e lançamentos AMEX.',
    action: 'ACESSAR STORE',
    image: storeArt,
  },
];
export function AccountMenu({ session, navigate }) {
  const [open, setOpen] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [avatarUrl, setAvatarUrl] = useState(''),
    root = useRef(null),
    trigger = useRef(null),
    user = session.user,
    name = user.user_metadata?.display_name || 'Estudante',
    initials =
      name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((x) => x[0]?.toUpperCase())
        .join('') || 'A';
  useEffect(() => {
    const close = (e) => {
      if (e.key === 'Escape') {
        setOpen(false);
        trigger.current?.focus();
      } else if (open && !root.current?.contains(e.target)) setOpen(false);
    };
    addEventListener('keydown', close);
    addEventListener('pointerdown', close);
    return () => {
      removeEventListener('keydown', close);
      removeEventListener('pointerdown', close);
    };
  }, [open]);
  useEffect(() => {
    let active = true;
    async function loadAvatar() {
      const path = session.user.user_metadata?.avatar_path;
      if (!path) {
        if (active) setAvatarUrl('');
        return;
      }
      const { data, error: avatarError } = await supabase.storage
        .from('avatars')
        .createSignedUrl(path, 3600);
      if (avatarError) {
        reportClientError(avatarError, { source: 'pages/Portal.jsx', operation: 'avatar.sign' });
        if (active) setAvatarUrl('');
        return;
      }
      if (active) setAvatarUrl(data?.signedUrl ?? '');
    }
    loadAvatar();
    addEventListener('amex:avatar-updated', loadAvatar);
    return () => {
      active = false;
      removeEventListener('amex:avatar-updated', loadAvatar);
    };
  }, [session.user.id, session.user.user_metadata?.avatar_path]);
  async function logout() {
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      reportClientError(error, { source: 'pages/Portal.jsx' });
      setError('Não foi possível sair. Tente novamente.');
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="portal-account" ref={root}>
      <button
        ref={trigger}
        type="button"
        className="portal-avatar"
        aria-expanded={open}
        aria-controls="account-menu"
        onClick={() => setOpen((v) => !v)}
        aria-label="Abrir perfil e configurações"
      >
        {avatarUrl ? (
          <img src={avatarUrl} alt="" width="44" height="44" />
        ) : (
          <span aria-hidden="true">{initials}</span>
        )}
      </button>
      {open && (
        <section id="account-menu" className="portal-account-menu">
          <header>
            <small>Conta AMEX</small>
            <strong>{name}</strong>
            <span>{user.email}</span>
          </header>
          <button type="button" onClick={() => navigate('profile')}>
            Perfil e configurações
          </button>
          <button type="button" onClick={logout} disabled={busy}>
            {busy ? 'Saindo...' : 'Sair da conta'}
          </button>
          {error && <p role="alert">{error}</p>}
        </section>
      )}
    </div>
  );
}
export function PortalUtilityBar({ session, navigate }) {
  const [theme, setTheme] = useState(() =>
    readPreferences().theme === 'light' ? 'light' : 'dark',
  );
  function toggleTheme() {
    const next = theme === 'dark' ? 'light' : 'dark';
    const prefs = { ...readPreferences(), theme: next };
    savePreferences(prefs);
    setTheme(next);
  }
  return (
    <nav className="portal-utility" aria-label="Atalhos da conta">
      <button
        type="button"
        className="utility-item"
        onClick={() => navigate('portal')}
        aria-label="Início"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" />
          <path d="M9 22V12h6v10" />
        </svg>
        <span>Início</span>
      </button>
      <button
        type="button"
        className="utility-item"
        onClick={() => navigate('profile')}
        aria-label="Perfil"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
        <span>Perfil</span>
      </button>
      <NotificationCenter compact />
      <button
        type="button"
        className="utility-item"
        onClick={() => navigate('profile')}
        aria-label="Configurações"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-2.82 1.18V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 7.1 19.73l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 3.09 14H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.27 7.1l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 10 3.09V3a2 2 0 0 1 4 0v.09A1.65 1.65 0 0 0 16.9 4.27l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 20.91 10H21a2 2 0 0 1 0 4h-.09A1.65 1.65 0 0 0 19.4 15Z" />
        </svg>
        <span>Ajustes</span>
      </button>
      <button
        type="button"
        className="utility-item utility-theme"
        onClick={toggleTheme}
        aria-label={theme === 'dark' ? 'Ativar tema claro' : 'Ativar tema escuro'}
      >
        {theme === 'dark' ? (
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="12" cy="12" r="5" />
            <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z" />
          </svg>
        )}
        <span>Tema</span>
      </button>
      <AccountMenu session={session} navigate={navigate} />
    </nav>
  );
}
export function PortalHeader({ session, navigate, title, area }) {
  const areaLogo =
    area === 'store'
      ? storeLogo
      : area === 'javascript'
        ? javascriptArt
        : area === 'data'
          ? dataArt
          : area === 'devops'
            ? devopsArt
            : area === 'pentest'
              ? pentestArt
              : area === 'python'
                ? pythonArt
                : logoStatic;
  return (
    <header className="portal-topbar portal-inner">
      <button type="button" className="portal-brand" onClick={() => navigate('portal')}>
        <span className="brand-logo" aria-hidden="true">
          <img className="brand-logo-animated" src={areaLogo} alt="" />
          <img className="brand-logo-static" src={logoStaticFallback} alt="" />
        </span>
        <span>
          <b>AMEX</b>
          <i>HOUSE</i>
        </span>
      </button>
      {title && <strong className="portal-area-title">{title}</strong>}
      <PortalUtilityBar session={session} navigate={navigate} />
    </header>
  );
}
export function Portal({ session, navigate, catalogStatus }) {
  return (
    <main className="portal-shell">
      <PortalHeader session={session} navigate={navigate} />
      <section className="portal-grid portal-flags" aria-label="Escolha um destino AMEX">
        {areas.map((a) => (
          <a
            key={a.route}
            href={a.href}
            className="portal-card portal-flag"
            aria-label={`Acessar ${a.title}`}
            data-catalog-state={
              catalogStatus && a.route !== 'store'
                ? catalogStatus[a.route] > 0
                  ? 'available'
                  : 'missing'
                : 'available'
            }
          >
            <span className="portal-flag-roll" aria-hidden="true">
              <span className="portal-image portal-flag-cloth">
                <LazyAnimatedArtwork
                  src={a.image}
                  poster={a.poster}
                  priority={a.route === 'pentest'}
                />
                <i />
              </span>
            </span>
          </a>
        ))}
      </section>
      <footer className="portal-footer">
        <span>AMEX HOUSE V1.33.4</span>
        <nav>
          <a href="#/privacy">Privacidade</a>
          <a href="#/terms">Termos</a>
        </nav>
      </footer>
    </main>
  );
}
