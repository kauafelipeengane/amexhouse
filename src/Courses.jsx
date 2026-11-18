import React, { useEffect, useMemo, useState } from 'react';
import { Page, Empty } from '../components/ui';
import { MotionAnimatedNumber } from '../components/ui/MotionAnimatedNumber';
import { Progress } from '../components/ui/ShadcnProgress';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '../components/ui/ShadcnCollapsible';
import { ChevronDown } from 'lucide-react';
import { asArray, safeNumber, safePercent } from '../lib/utils';
import { academyConfig } from '../lib/academy';
const stateOf = (value) =>
  value?.status === 'completed'
    ? 'completed'
    : value?.status === 'in_progress'
      ? 'active'
      : 'pending';
const labels = {
  all: 'TODAS',
  pending: 'NÃO INICIADAS',
  active: 'Em andamento',
  completed: 'Concluídas',
};
function LessonState({ state, video }) {
  return (
    <span className={`lesson-mark ${state}`}>
      <i aria-hidden="true" />
      {state === 'completed'
        ? 'CONCLUÍDA'
        : state === 'active'
          ? 'Em andamento'
          : video
            ? 'VIDEOAULA'
            : 'CONTEÚDO'}
    </span>
  );
}
export function Courses({ data, openLesson, courseKind }) {
  const courses = asArray(data.courses),
    modules = asArray(data.modules),
    lessons = asArray(data.lessons),
    progress = asArray(data.progress),
    [openCourse, setOpenCourse] = useState(''),
    [status, setStatus] = useState('all'),
    progressByLesson = useMemo(
      () => new Map(progress.map((item) => [item.lesson_id, item])),
      [progress],
    );
  useEffect(() => {
    if (openCourse && !courses.some((course) => course.id === openCourse)) setOpenCourse('');
  }, [courses, openCourse]);
  const records = useMemo(
      () =>
        courses.map((course, index) => {
          const courseModules = modules
              .filter((module) => module.course_id === course.id)
              .sort((a, b) => safeNumber(a.position) - safeNumber(b.position)),
            allLessons = lessons.filter((lesson) =>
              courseModules.some((module) => module.id === lesson.module_id),
            ),
            visibleLessons = allLessons.filter(
              (lesson) => status === 'all' || stateOf(progressByLesson.get(lesson.id)) === status,
            ),
            completed = allLessons.filter(
              (lesson) => stateOf(progressByLesson.get(lesson.id)) === 'completed',
            ).length,
            active = allLessons.filter(
              (lesson) => stateOf(progressByLesson.get(lesson.id)) === 'active',
            ).length,
            percent = safePercent(allLessons.length ? (completed / allLessons.length) * 100 : 0),
            next =
              allLessons.find((lesson) => stateOf(progressByLesson.get(lesson.id)) === 'active') ??
              allLessons.find((lesson) => stateOf(progressByLesson.get(lesson.id)) === 'pending');
          return {
            course,
            index,
            courseModules,
            allLessons,
            visibleLessons,
            completed,
            active,
            percent,
            next,
          };
        }),
      [courses, modules, lessons, status, progressByLesson],
    ),
    visibleRecords = records.filter((record) => status === 'all' || record.visibleLessons.length),
    totalHours = courses.reduce((sum, course) => sum + safeNumber(course.workload_hours), 0),
    completedLessons = lessons.filter(
      (lesson) => stateOf(progressByLesson.get(lesson.id)) === 'completed',
    ).length,
    overall = safePercent(lessons.length ? (completedLessons / lessons.length) * 100 : 0),
    academy = academyConfig[courseKind] ?? academyConfig.pentest,
    title = academy.catalogTitle,
    subtitle = academy.subtitle;
  if (!courses.length)
    return (
      <Page eyebrow="Catálogo acadêmico" title={title}>
        <Empty
          title="Formação não encontrada"
          description="Nenhum curso desta formação foi identificado no catálogo publicado."
        />
      </Page>
    );
  return (
    <Page
      eyebrow={academy.title}
      title={title}
      actions={
        <button type="button" onClick={() => setStatus('all')} disabled={status === 'all'}>
          LIMPAR FILTRO
        </button>
      }
    >
      <p className="courses-intro">{subtitle}</p>
      <section className="catalog-summary" aria-label="Resumo do catálogo">
        <div>
          <small>Progresso</small>
          <b>{overall}%</b>
          <i
            role="progressbar"
            aria-label="Progresso do catálogo"
            aria-valuemin="0"
            aria-valuemax="100"
            aria-valuenow={overall}
          >
            <u style={{ width: `${overall}%` }} />
          </i>
        </div>
        <dl>
          <div>
            <dt>Cursos</dt>
            <dd>{courses.length}</dd>
          </div>
          <div>
            <dt>Módulos</dt>
            <dd>{modules.length}</dd>
          </div>
          <div>
            <dt>Aulas</dt>
            <dd>{lessons.length}</dd>
          </div>
          <div>
            <dt>Carga</dt>
            <dd>
              {totalHours}
              <span className="metric-unit">h</span>
            </dd>
          </div>
        </dl>
      </section>
      <section className="catalog-toolbar" aria-label="Filtrar aulas por progresso">
        <fieldset>
          <legend>Situação das aulas</legend>
          {Object.entries(labels).map(([value, label]) => (
            <button
              type="button"
              key={value}
              aria-pressed={status === value}
              onClick={() => setStatus(value)}
            >
              {label}
            </button>
          ))}
        </fieldset>
        <p>
          <b>{visibleRecords.length}</b>{' '}
          {visibleRecords.length === 1 ? 'curso visível' : 'cursos visíveis'}
        </p>
      </section>
      {visibleRecords.length === 0 ? (
        <Empty
          title="Nenhuma aula neste filtro"
          description="Altere o status selecionado para visualizar outras aulas da formação."
          action={
            <button type="button" onClick={() => setStatus('all')}>
              MOSTRAR TODAS
            </button>
          }
        />
      ) : (
        <section
          className={`course-ledger academy-${courseKind}`}
          aria-label="Catálogo da formação"
        >
          {visibleRecords.map((record) => {
            const {
                course,
                index,
                courseModules,
                allLessons,
                visibleLessons,
                completed,
                active,
                percent,
                next,
              } = record,
              expanded = openCourse === course.id;
            return (
              <Collapsible key={course.id} open={expanded} onOpenChange={(open) => setOpenCourse(open ? course.id : '')}>
                <article className={`course-edition ${expanded ? 'expanded' : ''}`}>
                <CollapsibleTrigger asChild>
                <button
                  type="button"
                  className="course-cover"
                  aria-expanded={expanded}
                  aria-controls={`course-body-${course.id}`}
                >
                  <span className="course-cover-copy">
                    <small>{academy.trackLabel}</small>
                    <span className="course-title-line">
                      <span className="course-index">{String(index + 1).padStart(2, '0')}</span>
                      <strong>{course.title}</strong>
                    </span>
                    <em>
                      {course.description ||
                        `${courseModules.length} módulos e ${allLessons.length} aulas publicadas.`}
                    </em>
                  </span>
                  <span className="course-cover-progress">
                    <b><MotionAnimatedNumber value={percent} suffix="%" /></b>
                    <span>
                      {completed} concluídas · {active} em andamento
                    </span>
                    <Progress value={percent} label={`Progresso em ${course.title}`} />
                  </span>
                  <span className="course-disclosure">{expanded ? 'RECOLHER' : 'ABRIR CURSO'} <ChevronDown size={16} strokeWidth={1.8} aria-hidden="true" /></span>
                </button>
                </CollapsibleTrigger>
                <CollapsibleContent className="course-collapsible-content">
                  <div className="course-body" id={`course-body-${course.id}`}>
                    <header className="course-body-header">
                      <span>{courseModules.length} MÓDULOS</span>
                      <span>{visibleLessons.length} AULAS NO FILTRO</span>
                      <span>{safeNumber(course.workload_hours)} HORAS</span>
                      {next && (
                        <button type="button" onClick={() => openLesson(next.id)}>
                          Continuar →
                        </button>
                      )}
                    </header>
                    {courseModules.map((module, moduleIndex) => {
                      const moduleLessons = visibleLessons.filter(
                        (lesson) => lesson.module_id === module.id,
                      );
                      if (!moduleLessons.length) return null;
                      const moduleAll = allLessons.filter(
                          (lesson) => lesson.module_id === module.id,
                        ),
                        moduleDone = moduleAll.filter(
                          (lesson) => stateOf(progressByLesson.get(lesson.id)) === 'completed',
                        ).length,
                        modulePercent = safePercent(
                          moduleAll.length ? (moduleDone / moduleAll.length) * 100 : 0,
                        );
                      return (
                        <section className="module-chapter" key={module.id}>
                          <header className="module-heading">
                            <span>{String(moduleIndex + 1).padStart(2, '0')}</span>
                            <div>
                              <small>Módulo</small>
                              <h2>{module.title}</h2>
                            </div>
                            <b>
                              {moduleDone}/{moduleAll.length} · {modulePercent}%
                            </b>
                          </header>
                          <div className="module-progress" aria-hidden="true">
                            <i style={{ width: `${modulePercent}%` }} />
                          </div>
                          <div className="lesson-register">
                            {moduleLessons.map((lesson, lessonIndex) => {
                              const state = stateOf(progressByLesson.get(lesson.id));
                              return (
                                <button
                                  type="button"
                                  className={`lesson-entry ${state}`}
                                  key={lesson.id}
                                  onClick={() => openLesson(lesson.id)}
                                >
                                  <span className="lesson-number">
                                    {String(lessonIndex + 1).padStart(2, '0')}
                                  </span>
                                  <span className="lesson-copy">
                                    <b>{lesson.title}</b>
                                    <small>
                                      {safeNumber(lesson.workload_hours)}H ·{' '}
                                      {lesson.video ? 'VIDEOAULA' : 'LEITURA TÉCNICA'}
                                    </small>
                                  </span>
                                  <LessonState state={state} video={!!lesson.video} />
                                  <span className="lesson-arrow" aria-hidden="true">
                                    ↗
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </section>
                      );
                    })}
                  </div>
                </CollapsibleContent>
              </article>
              </Collapsible>
            );
          })}
        </section>
      )}
    </Page>
  );
}
