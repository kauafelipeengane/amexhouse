import { reportClientError } from '../lib/errorReporter';
import React, { useState } from 'react';
import { Page, Empty } from '../components/ui';
import { VideoPlayer } from '../components/VideoPlayer';
import { asArray, storage, safeNumber } from '../lib/utils';
import { Quiz } from '../components/Quiz';
import { toggleSaved } from '../services/platform';
import { buildLessonSequence } from '../lib/lessonSequence';
export function Lesson({ data, lesson, openLesson, refresh, academy, openCourses }) {
  const lessons = asArray(data.lessons),
    progress = asArray(data.progress).find((item) => item.lesson_id === lesson.id),
    sequence = buildLessonSequence(data, lesson),
    {
      courseLessons,
      lessonIndex: index,
      previous,
      next,
      nextCourse,
      nextCourseFirstLesson,
      isLast,
    } = sequence,
    curriculumKey = `amex-curriculum:${academy}:${lesson.course?.id ?? 'course'}`,
    [curriculumOpen, setCurriculumOpen] = useState(
      () => storage.get(curriculumKey, 'open') !== 'closed',
    ),
    favorite = asArray(data.favorites).some((item) => item.lesson_id === lesson.id),
    later = asArray(data.later).some((item) => item.lesson_id === lesson.id),
    [focus, setFocus] = useState(false),
    [message, setMessage] = useState(''),
    [savingAction, setSavingAction] = useState(''),
    resources = asArray(data.resources).filter((item) => item.lesson_id === lesson.id),
    exercises = asArray(data.exercises).filter((item) => item.lesson_id === lesson.id);
  async function toggle(table, active) {
    if (savingAction) return;
    setSavingAction(table);
    setMessage('');
    try {
      const response = await toggleSaved(table, lesson.id, active);
      setMessage(response.error ?? 'Atualizado com sucesso.');
      if (!response.error) await refresh(true);
    } catch (error) {
      reportClientError(error, { source: 'pages/Lesson.jsx' });
      setMessage('Não foi possível atualizar o conteúdo salvo.');
    } finally {
      setSavingAction('');
    }
  }
  return (
    <>
      <nav className="breadcrumbs" aria-label="Navegação estrutural">
        <button type="button" onClick={openCourses}>
          {lesson.course?.title ?? 'Curso'}
        </button>
        <span aria-hidden="true">/</span>
        <span>{lesson.module?.title ?? 'Módulo'}</span>
        <span aria-hidden="true">/</span>
        <b aria-current="page">{lesson.title}</b>
      </nav>
      <div className={focus ? 'lesson-layout focus' : 'lesson-layout'}>
        <aside className={curriculumOpen ? 'curriculum' : 'curriculum collapsed'}>
          <header className="curriculum-header">
            <div className="curriculum-heading">
              <span>Conteúdo do curso</span>
              <b>{lesson.course?.title}</b>
              <small>
                {courseLessons.length} {courseLessons.length === 1 ? 'aula' : 'aulas'}
              </small>
            </div>
            <button
              type="button"
              className="curriculum-toggle"
              aria-expanded={curriculumOpen}
              aria-controls="lesson-curriculum-list"
              onClick={() => {
                const next = !curriculumOpen;
                setCurriculumOpen(next);
                storage.set(curriculumKey, next ? 'open' : 'closed');
              }}
            >
              <span>{curriculumOpen ? 'Ocultar aulas' : 'Mostrar aulas'}</span>
              <svg className="curriculum-toggle-icon" viewBox="0 0 20 20" aria-hidden="true">
                <path d="m5.5 11.75 4.5-4.5 4.5 4.5" />
              </svg>
            </button>
          </header>
          <div id="lesson-curriculum-list" className="curriculum-list">
            {courseLessons.map((item) => (
              <button
                className={item.id === lesson.id ? 'current' : ''}
                key={item.id}
                onClick={() => openLesson(item.id)}
              >
                {item.id === lesson.id ? '●' : '○'} {item.title}
              </button>
            ))}
          </div>
        </aside>
        <Page
          eyebrow={`${lesson.course?.title ?? 'Curso'} / ${lesson.module?.title ?? 'Módulo'} / Aula ${lesson.position}`}
          title={lesson.title}
          actions={
            <button onClick={() => setFocus((value) => !value)}>
              {focus ? 'SAIR DO FOCO' : 'MODO FOCO'}
            </button>
          }
        >
          <p className="lesson-meta">{lesson.workload_hours}H DE CARGA PEDAGÓGICA</p>
          {lesson.video ? (
            <>
              <VideoPlayer lesson={lesson} progress={progress} academy={academy} />
              <aside className="source-card" aria-label="Fonte do conteúdo">
                <div>
                  <small>Material de referência</small>
                  <strong>{lesson.video.channel || 'Canal não informado'}</strong>
                </div>
                <a
                  href={`https://youtube.com/watch?v=${lesson.video.youtube_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Assistir ${lesson.title} no YouTube, abre em nova guia`}
                >
                  ASSISTIR NO YOUTUBE <span aria-hidden="true">↗</span>
                </a>
              </aside>
            </>
          ) : (
            <Empty
              title="Aula sem vídeo"
              description="O conteúdo está disponível como leitura, exercício e prática orientada."
            />
          )}
          <div className="lesson-actions">
            <button
              aria-pressed={favorite}
              disabled={!!savingAction}
              onClick={() => toggle('favorites', favorite)}
            >
              {favorite ? 'Remover favorito' : 'FAVORITAR'}
            </button>
            <button
              aria-pressed={later}
              disabled={!!savingAction}
              onClick={() => toggle('watch_later', later)}
            >
              {later ? 'Remover da lista' : 'Assistir depois'}
            </button>
            <span aria-live="polite">{message}</span>
          </div>
          <section className="lesson-content">
            <h2 id="lesson-summary">Resumo</h2>
            <p>{lesson.summary}</p>
            <h2 id="lesson-objectives">Objetivos</h2>
            {asArray(lesson.objectives).length ? (
              <ul>
                {asArray(lesson.objectives).map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            ) : (
              <p>Os objetivos específicos desta aula ainda não foram cadastrados.</p>
            )}
            <h2 id="lesson-plan">Roteiro</h2>
            {[
              ['Videoaula', 20],
              ['Leitura', 20],
              ['Exercícios', 20],
              ['Prática', 25],
              ['Avaliação e consolidação', 15],
            ].map(([label, share]) => (
              <div className="workload" key={label}>
                <span>{label}</span>
                <b>
                  {Math.max(0, Math.round((safeNumber(lesson.workload_hours) * 60 * share) / 100))}{' '}
                  MIN
                </b>
              </div>
            ))}
          </section>
          {resources.length > 0 && (
            <section className="lesson-resources">
              <h2>Recursos complementares</h2>
              {resources.map((item) => (
                <a key={item.id} href={item.url} target="_blank" rel="noopener noreferrer">
                  <span>
                    <small>
                      {item.resource_type === 'official_docs'
                        ? 'Documentação oficial'
                        : 'Recurso externo'}
                    </small>
                    <b>{item.title}</b>
                  </span>
                  <i>↗</i>
                </a>
              ))}
            </section>
          )}
          {exercises.length > 0 && (
            <section className="lesson-exercises">
              <h2>Prática obrigatória</h2>
              {exercises.map((item) => (
                <article key={item.id}>
                  <small>{item.difficulty.toUpperCase()}</small>
                  <h3>{item.title}</h3>
                  <p>{item.instructions}</p>
                  <ul>
                    {asArray(item.acceptance_criteria).map((value) => (
                      <li key={value}>{value}</li>
                    ))}
                  </ul>
                </article>
              ))}
            </section>
          )}
          <div id="lesson-quiz">
            <Quiz lesson={lesson} academy={academy} />
          </div>
          <nav className="lesson-pagination" aria-label="Navegação entre aulas">
            {previous && (
              <button type="button" className="previous" onClick={() => openLesson(previous.id)}>
                <span aria-hidden="true">←</span>
                <span>
                  <small>Aula anterior</small>
                  <b>{previous.title}</b>
                </span>
              </button>
            )}
            <span className="lesson-position">
              {index + 1} / {courseLessons.length}
            </span>
            {next && (
              <button type="button" className="next" onClick={() => openLesson(next.id)}>
                <span>
                  <small>Próxima aula</small>
                  <b>{next.title}</b>
                </span>
                <span aria-hidden="true">→</span>
              </button>
            )}
          </nav>
          {isLast && (
            <section className="course-completion" aria-label="Fim do curso atual">
              <small>Fim deste curso</small>
              <h2>{lesson.course?.title}</h2>
              <p>
                Você chegou à última aula publicada deste curso. O avanço para outra frente da
                formação acontece somente por uma ação explícita.
              </p>
              <div>
                <button type="button" onClick={openCourses}>
                  Revisar catálogo
                </button>
                {nextCourseFirstLesson && (
                  <button
                    type="button"
                    className="primary"
                    onClick={() => openLesson(nextCourseFirstLesson.id)}
                  >
                    Iniciar {nextCourse?.title} →
                  </button>
                )}
              </div>
            </section>
          )}
        </Page>
      </div>
    </>
  );
}
