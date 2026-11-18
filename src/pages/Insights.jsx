import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Page, Empty, Metric } from '../components/ui';
const duration = (s) => {
  const m = Math.max(0, Math.round(Number(s || 0) / 60));
  return m < 60 ? `${m} min` : `${Math.floor(m / 60)}h ${m % 60}min`;
};
export function Insights({ academy }) {
  const [data, setData] = useState(null),
    [state, setState] = useState('loading'),
    [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true;
    setState('loading');
    supabase
      .rpc('amex_my_learning_insights', { target_academy: academy })
      .then(({ data, error }) => {
        if (!active) return;
        if (error) {
          setState('error');
          return;
        }
        setData(data);
        setState('ready');
      })
      .catch(() => active && setState('error'));
    return () => {
      active = false;
    };
  }, [academy, retry]);
  if (state === 'loading')
    return (
      <Page eyebrow="ANÁLISE ACADÊMICA" title="Preparando seu desempenho">
        <p role="status">Calculando resultados e competências...</p>
      </Page>
    );
  if (state === 'error')
    return (
      <Page eyebrow="ANÁLISE ACADÊMICA" title="Desempenho indisponível">
        <p>Não foi possível carregar seus indicadores.</p>
        <button type="button" onClick={() => setRetry((x) => x + 1)}>
          Tentar novamente
        </button>
      </Page>
    );
  const summary = data?.summary ?? {},
    attempts = data?.attempts ?? [],
    skills = data?.competencies ?? [],
    recommendations = data?.recommendations ?? [];
  return (
    <Page
      eyebrow={
        academy === 'python'
          ? 'AMEX PYTHON'
          : academy === 'pentest'
            ? 'AMEX PENTEST'
            : academy === 'javascript'
              ? 'AMEX JAVASCRIPT'
              : academy === 'data'
                ? 'AMEX DATA'
                : 'AMEX OPS'
      }
      title="Meu desempenho"
    >
      <section className="insights-metrics" aria-label="Resumo acadêmico">
        <Metric value={summary.attempts ?? 0} label="Tentativas" />
        <Metric value={`${summary.average_score ?? 0}%`} label="Média" />
        <Metric value={summary.approved ?? 0} label="Aprovações" />
        <Metric value={duration(summary.study_seconds)} label="Tempo em avaliações" />
      </section>
      <section className="insights-section" aria-labelledby="skills-title">
        <header>
          <small>MAPA DE COMPETÊNCIAS</small>
          <h2 id="skills-title">Evolução por competência</h2>
        </header>
        {skills.length ? (
          <div className="insights-skills">
            {skills.map((skill) => (
              <article key={skill.id}>
                <div>
                  <h3>{skill.title}</h3>
                  <b>{skill.percent}%</b>
                </div>
                <p>{skill.description}</p>
                <div
                  className="insights-track"
                  role="progressbar"
                  aria-label={`Progresso em ${skill.title}`}
                  aria-valuemin="0"
                  aria-valuemax="100"
                  aria-valuenow={skill.percent}
                >
                  <i style={{ width: `${skill.percent}%` }} />
                </div>
                <small>
                  {skill.lessons_completed}/{skill.lessons_total} aulas concluídas
                </small>
              </article>
            ))}
          </div>
        ) : (
          <Empty
            title="Competências em preparação"
            description="As competências serão exibidas quando as aulas forem relacionadas ao mapa acadêmico."
          />
        )}
      </section>
      <section className="insights-section" aria-labelledby="recommendations-title">
        <header>
          <small>Próximos passos</small>
          <h2 id="recommendations-title">Recomendações personalizadas</h2>
        </header>
        {recommendations.length ? (
          <div className="insights-recommendations">
            {recommendations.map((item, index) => (
              <article key={`${item.reference}:${index}`}>
                <span>{String(index + 1).padStart(2, '0')}</span>
                <div>
                  <h3>{item.title}</h3>
                  <p>{item.reason}</p>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p>Nenhuma recomendação pendente. Continue avançando na formação.</p>
        )}
      </section>
      <section className="insights-section" aria-labelledby="attempts-title">
        <header>
          <small>Histórico</small>
          <h2 id="attempts-title">Avaliações realizadas</h2>
        </header>
        {attempts.length ? (
          <div className="insights-attempts">
            {attempts.map((item, index) => (
              <article key={`${item.submitted_at}:${index}`}>
                <div>
                  <strong>{item.quiz_title}</strong>
                  <small>
                    {item.course_title} · {item.lesson_title}
                  </small>
                </div>
                <b className={item.passed ? 'passed' : 'failed'}>{item.score}%</b>
                <span>Tentativa {item.attempt_number}</span>
                <time dateTime={item.submitted_at}>
                  {new Date(item.submitted_at).toLocaleDateString('pt-BR')} ·{' '}
                  {duration(item.duration_seconds)}
                </time>
              </article>
            ))}
          </div>
        ) : (
          <div className="history-empty" role="status">
            <span aria-hidden="true">0</span>
            <div>
              <h3>Nenhuma avaliação realizada</h3>
              <p>O histórico será organizado aqui após a primeira tentativa.</p>
            </div>
          </div>
        )}
      </section>
    </Page>
  );
}
