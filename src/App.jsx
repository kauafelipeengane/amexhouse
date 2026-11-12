import React, { lazy, useEffect, useState } from 'react';
import { useSession } from './hooks/useSession';
import { usePlatform } from './hooks/usePlatform';
import { useNavigation } from './hooks/useNavigation';
import { useRouteFocus } from './hooks/useRouteFocus';
import { Auth } from './components/Auth';
import { ResetPassword } from './components/ResetPassword';
import { AuthResult } from './components/AuthResult';
import { Layout } from './components/Layout';
import { Loading, Notice, Empty } from './components/ui';
import { SearchResults } from './components/SearchResults';
import { RouteTrail } from './components/RouteTrail';
import { PageBoundary } from './components/PageBoundary';
import { searchLessons } from './lib/search';
import { prefetchAcademicModules } from './lib/prefetch';
import { selectAcademyData, academyConfig, academyCatalogStatus } from './lib/academy';
import { Portal } from './pages/Portal';
import { Store } from './pages/Store';
import { ProfileStandalone } from './pages/ProfileStandalone';

const load = (p, k) => lazy(() => p().then(m => ({ default: m[k] })));
const legalMod = () => import('./pages/Legal');
const wsMod = () => import('./pages/Workspace');

const PrivacyPolicy = load(legalMod, 'PrivacyPolicy');
const TermsOfUse = load(legalMod, 'TermsOfUse');
const Home = load(() => import('./pages/Home'), 'Home');
const Courses = load(() => import('./pages/Courses'), 'Courses');
const Lesson = load(() => import('./pages/Lesson'), 'Lesson');
const Notes = load(wsMod, 'Notes');
const Saved = load(wsMod, 'Saved');
const Progress = load(wsMod, 'Progress');
const Activities = load(wsMod, 'Activities');
const Goals = load(wsMod, 'Goals');
const Certificate = load(wsMod, 'Certificate');

const SECTIONS = { notes: Notes, saved: Saved, progress: Progress, activities: Activities, goals: Goals, certificate: Certificate };

export function App() {
  const { session, ready, flow, flowError, sessionEvent, clearFlow } = useSession();
  const [route, setRoute] = useState(() => location.hash.replace(/^#\/?/, ''));

  useEffect(() => {
    const sync = () => setRoute(location.hash.replace(/^#\/?/, ''));
    addEventListener('hashchange', sync);
    return () => removeEventListener('hashchange', sync);
  }, []);

  if (route === 'privacy' || route === 'terms') {
    const Page = route === 'privacy' ? PrivacyPolicy : TermsOfUse;
    return <PageBoundary resetKey={route}><Page /></PageBoundary>;
  }
  if (!ready) return <Loading />;
  if (flow === 'recovery') return <ResetPassword session={session} onDone={clearFlow} />;
  if (flow === 'email') return <AuthResult error={flowError} onDone={clearFlow} />;
  if (!session) return <Auth sessionEvent={sessionEvent} />;
  return <PrivateApp key={session.user.id} session={session} />;
}

function PrivateApp({ session }) {
  const { data, loading, refreshing, error, stale, lastUpdated, hasData, refresh } = usePlatform();
  const [query, setQuery] = useState('');
  const { page, academy, section, selected, go, invalid } = useNavigation();
  const isAcad = page === 'academy';
  const acadName = academy === 'python' ? 'AMEX Python' : 'AMEX Pentest';

  useEffect(() => {
    document.documentElement.dataset.area = page === 'store' ? 'store' : isAcad ? academy : 'portal';
    return () => { delete document.documentElement.dataset.area; };
  }, [page, academy, isAcad]);

  useEffect(() => prefetchAcademicModules(), []);
  useRouteFocus(`${page}:${academy}:${section}:${selected}`, isAcad ? `${acadName} · ${section}` : page);
  useEffect(() => setQuery(''), [academy, section]);
  useEffect(() => {
    const titles = { academy: acadName, store: 'AMEX Store', profile: 'Perfil' };
    document.title = `${titles[page] || 'Portal AMEX'} · AMEX HOUSE`;
  }, [page, acadName]);

  const navGlobal = t => go(t === 'pentest' || t === 'python' ? { academy: t, section: 'courses' } : t);

  if (page === 'store') return <Store session={session} navigate={go} />;
  if (page === 'portal') return <Portal session={session} navigate={navGlobal} catalogStatus={loading ? null : academyCatalogStatus(data)} />;
  if (loading && !hasData) return <Loading />;
  if (page === 'profile') return <ProfileStandalone session={session} data={data} navigate={go} />;
  if (!isAcad) return <Portal session={session} navigate={navGlobal} catalogStatus={academyCatalogStatus(data)} />;

  const scoped = selectAcademyData(data, academy);
  const config = academyConfig[academy];
  const lesson = scoped.lessons.find(i => i.id === selected);
  const navSec = t => (t === 'portal' ? go('portal') : go({ academy, section: t }));
  const openLesson = id => scoped.lessons.some(i => i.id === id) && go({ academy, section: 'lesson', selected: id });

  let content;
  if (!scoped.courses.length) {
    content = <Empty title={`${config?.title ?? 'Formação'} não encontrada`} description={`Publique a formação usando os slugs esperados: ${config?.courseSlugs?.join(', ') ?? 'catálogo configurado'}.`} />;
  } else if (query.trim()) {
    content = <SearchResults query={query} results={searchLessons(scoped.lessons, query)} onOpen={openLesson} onClear={() => setQuery('')} academy={academy} />;
  } else if (section === 'home') {
    content = <Home data={scoped} openLesson={openLesson} academy={academy} />;
  } else if (section === 'courses') {
    content = scoped.lessons.length ? <Courses data={scoped} openLesson={openLesson} courseKind={academy} /> : <Empty title="Curso sem aulas publicadas" description="O curso existe, mas nenhuma aula publicada está vinculada aos módulos desta formação." />;
  } else if (section === 'lesson') {
    content = lesson ? <Lesson data={scoped} lesson={lesson} openLesson={openLesson} refresh={refresh} academy={academy} openCourses={() => navSec('courses')} /> : <Empty title="Aula não encontrada nesta formação" description="O endereço não pertence ao curso atual. Volte ao catálogo e selecione uma aula." action={<button type="button" onClick={() => navSec('courses')}>VOLTAR AO CURSO</button>} />;
  } else {
    const SecComp = SECTIONS[section] || Certificate;
    content = <SecComp session={session} data={scoped} openLesson={openLesson} refresh={refresh} academy={academy} />;
  }

  return (
    <Layout page={section} setPage={navSec} query={query} setQuery={setQuery} academy={academy}>
      <RouteTrail academy={academy} section={section} lesson={lesson} onNavigate={navSec} />
      {invalid && <Notice message="A rota solicitada era inválida. Você voltou ao Portal AMEX." />}
      {refreshing && <div className="refresh-indicator" role="status">ATUALIZANDO CONTEÚDO...</div>}
      {data.warnings?.length > 0 && <Notice message={`Alguns recursos não puderam ser carregados: ${data.warnings.join(', ')}.`} tone="warning" />}
      {error && <Notice message={stale ? `${error} Os dados exibidos são da última atualização disponível.` : error} tone={stale ? 'warning' : 'error'} onRetry={() => refresh(true)} />}
      {stale && lastUpdated && (
        <div className="stale-data" role="status">
          <b>MODO DE CONTINUIDADE</b>
          <span>Última atualização: {lastUpdated.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
          <button type="button" onClick={() => refresh(true)} disabled={refreshing}>ATUALIZAR AGORA</button>
        </div>
      )}
      <PageBoundary resetKey={`${academy}:${section}:${selected}:${query}`}>{content}</PageBoundary>
    </Layout>
  );
}
