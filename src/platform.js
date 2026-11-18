import { reportClientError } from '../lib/errorReporter';
import { supabase } from '../lib/supabase';
import { asArray, sanitizeYoutubeId, result } from '../lib/utils';
import { isUuid, safeText } from '../lib/security';
const limits = Object.freeze({ notes: 100, saved: 200, activities: 100 });
const safeBackendMessage = (error, fallback) => {
  const code = String(error?.code ?? '');
  const message = String(error?.message ?? '').toLowerCase();
  if (code === '42501' || message.includes('sessão')) return 'Sua sessão expirou. Entre novamente.';
  if (code === '22023') {
    if (message.includes('limite')) return 'O limite de tentativas foi atingido.';
    if (message.includes('tentativa')) return 'A tentativa expirou ou já foi enviada. Inicie uma nova avaliação.';
    return 'Os dados enviados não são válidos. Atualize a página e tente novamente.';
  }
  if (code === '23505') return 'Esta operação já foi registrada. Atualize a página.';
  if (code === '23503') return 'O conteúdo está com uma referência acadêmica inconsistente. Informe o suporte.';
  if (code === 'PGRST202' || code === '42883') return 'O serviço está desatualizado. Aplique a migração V1.28.0 no Supabase.';
  if (code === '42P10') return 'O banco precisa da migração de integridade V1.28.0.';
  return fallback;
};
const optionalList = async (label, promise) => {
  try {
    const response = await promise;
    return {
      data: response.error ? [] : asArray(response.data),
      warning: response.error ? label : null,
    };
  } catch (error) {
    reportClientError(error, { source: 'services/platform.js' });
    return { data: [], warning: label };
  }
};
const optionalOne = async (label, promise) => {
  try {
    const response = await promise;
    return {
      data: response.error ? null : (response.data ?? null),
      warning: response.error ? label : null,
    };
  } catch (error) {
    reportClientError(error, { source: 'services/platform.js' });
    return { data: null, warning: label };
  }
};
export async function loadPlatform() {
  try {
    const user = await currentUser();
    if (!user) return result(null, 'Sua sessão expirou. Entre novamente.');
    const core = await Promise.all([
      supabase
        .from('courses')
        .select('id,title,slug,description,level,workload_hours')
        .eq('status', 'published')
        .order('title'),
      supabase.from('course_modules').select('id,course_id,title,position').order('position'),
      supabase
        .from('lessons')
        .select('id,module_id,title,summary,position,workload_hours,objectives,status')
        .eq('status', 'published')
        .order('position'),
      supabase
        .from('lesson_videos')
        .select(
          'lesson_id,youtube_id,title,channel,is_embed_allowed,alternative_youtube_id,reviewed_at',
        ),
    ]);
    if (core.some((item) => item.error))
      return result(null, 'Não foi possível carregar o catálogo.');
    const [courses, modules, rawLessons, videos] = core.map((item) => asArray(item.data));
    const extra = await Promise.all([
      optionalList(
        'progresso',
        supabase
          .from('lesson_progress')
          .select(
            'lesson_id,video_percent,quiz_passed,status,updated_at,last_position_seconds,video_duration_seconds',
          )
          .eq('user_id', user.id),
      ),
      optionalList(
        'anotações',
        supabase
          .from('notes')
          .select('id,lesson_id,title,content,review,archived,updated_at')
          .eq('user_id', user.id)
          .is('deleted_at', null)
          .order('updated_at', { ascending: false })
          .limit(limits.notes),
      ),
      optionalList(
        'favoritos',
        supabase
          .from('favorites')
          .select('lesson_id,created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(limits.saved),
      ),
      optionalList(
        'assistir depois',
        supabase
          .from('watch_later')
          .select('lesson_id,created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(limits.saved),
      ),
      optionalList(
        'atividades',
        supabase
          .from('activities')
          .select('id,activity_type,reference_id,description,created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(limits.activities),
      ),
      optionalList(
        'metas semanais',
        supabase.from('study_goals').select('academy,weekly_minutes').eq('user_id', user.id),
      ),
      optionalList(
        'recursos',
        supabase
          .from('lesson_resources')
          .select('id,lesson_id,title,url,resource_type,position')
          .order('position')
          .limit(500),
      ),
      optionalList(
        'exercícios',
        supabase
          .from('lesson_exercises')
          .select('id,lesson_id,title,instructions,difficulty,acceptance_criteria,position')
          .order('position')
          .limit(500),
      ),
      optionalList('requisitos de avaliação', supabase.rpc('get_quiz_requirements')),
    ]);
    const lessons = rawLessons
      .map((lesson) => {
        const module = modules.find((item) => item.id === lesson.module_id);
        const course = courses.find((item) => item.id === module?.course_id);
        const video = videos.find((item) => item.lesson_id === lesson.id);
        return {
          ...lesson,
          module,
          course,
          objectives: asArray(lesson.objectives),
          video: video
            ? {
                ...video,
                youtube_id: sanitizeYoutubeId(video.youtube_id),
                alternative_youtube_id: sanitizeYoutubeId(video.alternative_youtube_id),
              }
            : null,
        };
      })
      .sort(
        (a, b) =>
          (a.course?.title ?? '').localeCompare(b.course?.title ?? '') ||
          (a.module?.position ?? 0) - (b.module?.position ?? 0) ||
          (a.position ?? 0) - (b.position ?? 0),
      );
    const warnings = extra.map((item) => item.warning).filter(Boolean);
    return result({
      courses,
      modules,
      lessons,
      progress: extra[0].data,
      notes: extra[1].data,
      favorites: extra[2].data,
      later: extra[3].data,
      activities: extra[4].data,
      studyGoals: extra[5].data,
      goal: null,
      resources: extra[6].data,
      exercises: extra[7].data,
      quizRequirements: extra[8].data,
      warnings,
    });
  } catch (error) {
    reportClientError(error, { source: 'services/platform.js' });
    return result(null, 'Não foi possível carregar o catálogo.');
  }
}
export async function currentUser() {
  try {
    const { data, error } = await supabase.auth.getUser();
    return error ? null : data.user;
  } catch (error) {
    reportClientError(error, { source: 'services/platform.js' });
    return null;
  }
}
export async function saveNote(note) {
  try {
    if (!note || typeof note !== 'object' || Array.isArray(note))
      return result(null, 'Anotação inválida.');
    const user = await currentUser();
    if (!user) return result(null, 'Sessão expirada.');
    const title = safeText(note.title, 100),
      content = String(note.content ?? '')
        .trim()
        .slice(0, 6000),
      lessonId = note.lesson_id && isUuid(note.lesson_id) ? note.lesson_id : null;
    if (title.length < 1) return result(null, 'Informe um título para a anotação.');
    const payload = {
      user_id: user.id,
      title,
      content,
      lesson_id: lessonId,
      review: !!note.review,
      archived: !!note.archived,
    };
    if (note.id && !isUuid(note.id)) return result(null, 'Anotação inválida.');
    const response = note.id
      ? await supabase.from('notes').update(payload).eq('id', note.id).eq('user_id', user.id)
      : await supabase.from('notes').insert(payload);
    return result(response.data, response.error ? 'Não foi possível salvar a anotação.' : null);
  } catch (error) {
    reportClientError(error, { source: 'services/platform.js' });
    return result(null, 'Não foi possível salvar a anotação.');
  }
}
export async function deleteNote(id) {
  try {
    if (!isUuid(id)) return result(null, 'Anotação inválida.');
    const user = await currentUser();
    if (!user) return result(null, 'Sessão expirada.');
    const response = await supabase
      .from('notes')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', user.id);
    return result(null, response.error ? 'Não foi possível excluir a anotação.' : null);
  } catch (error) {
    reportClientError(error, { source: 'services/platform.js' });
    return result(null, 'Não foi possível excluir a anotação.');
  }
}
export async function toggleSaved(table, lessonId, active) {
  try {
    if (
      !['favorites', 'watch_later'].includes(table) ||
      !isUuid(lessonId) ||
      typeof active !== 'boolean'
    )
      return result(null, 'Operação não permitida.');
    const user = await currentUser();
    if (!user) return result(null, 'Sessão expirada.');
    const response = active
      ? await supabase.from(table).delete().eq('lesson_id', lessonId).eq('user_id', user.id)
      : await supabase.from(table).insert({ user_id: user.id, lesson_id: lessonId });
    return result(null, response.error ? 'Não foi possível atualizar o conteúdo salvo.' : null);
  } catch (error) {
    reportClientError(error, { source: 'services/platform.js' });
    return result(null, 'Não foi possível atualizar o conteúdo salvo.');
  }
}
export async function saveProgress(
  lessonId,
  percent,
  current = 0,
  duration = 0,
  quizPassed = false,
) {
  try {
    if (!isUuid(lessonId)) return result(null, 'Aula inválida.');
    percent = Math.min(100, Math.max(0, Math.round(Number(percent) || 0)));
    current = Math.max(0, Math.round(Number(current) || 0));
    duration = Math.max(0, Math.round(Number(duration) || 0));
    if (duration > 0) current = Math.min(current, duration);
    const response = await supabase.rpc('amex_save_video_progress', {
      target_lesson_id: lessonId,
      current_seconds: current,
      duration_seconds: duration,
      reported_percent: percent,
    });
    return result(response.data, response.error ? 'Não foi possível salvar o progresso.' : null);
  } catch (error) {
    reportClientError(error, { source: 'services/platform.js' });
    return result(null, 'Não foi possível salvar o progresso.');
  }
}
export async function loadQuiz(lessonId) {
  try {
    if (!isUuid(lessonId)) return result(null, 'Aula inválida.');
    const response = await supabase.rpc('get_quiz_public', {
      target_lesson_id: lessonId,
    });
    if (response.error || !response.data)
      return result(response.data, 'Não foi possível carregar a avaliação.');
    const started = await supabase.rpc('amex_start_quiz', {
      target_quiz_id: response.data.id,
    });
    if (started.error || started.data?.ok === false)
      return result(null, started.data?.message ?? 'Não foi possível iniciar a tentativa.');
    return result({ ...response.data, ...started.data }, null);
  } catch (error) {
    reportClientError(error, { source: 'services/platform.js' });
    return result(null, 'Não foi possível carregar a avaliação.');
  }
}
export async function submitQuiz(attemptToken, answers) {
  try {
    if (!isUuid(attemptToken) || !answers || typeof answers !== 'object' || Array.isArray(answers))
      return result(null, 'Respostas inválidas.');
    const entries = Object.entries(answers);
    if (
      entries.length < 1 ||
      entries.length > 50 ||
      entries.some(
        ([questionId, value]) =>
          !isUuid(questionId) ||
          !Array.isArray(value) ||
          value.length !== 1 ||
          !isUuid(String(value[0])),
      )
    )
      return result(null, 'Respostas inválidas.');
    const response = await supabase.rpc('amex_submit_quiz', {
      attempt_token: attemptToken,
      submitted_answers: answers,
    });
    if (response.error) {
      reportClientError(response.error, { source: 'services/platform.js', action: 'submitQuiz' });
      return result(
        null,
        safeBackendMessage(response.error, 'Não foi possível concluir a correção. Tente novamente.'),
      );
    }
    return result(response.data, response.data?.ok === false ? response.data.message : null);
  } catch (error) {
    reportClientError(error, { source: 'services/platform.js' });
    return result(null, 'Não foi possível concluir a correção. Tente novamente.');
  }
}

export async function saveStudyGoal(academy, weeklyMinutes) {
  try {
    const user = await currentUser();
    if (!user) return result(null, 'Sessão expirada.');
    if (!['pentest', 'python', 'javascript', 'data', 'devops'].includes(academy))
      return result(null, 'Formação inválida.');
    const minutes = Math.round(Number(weeklyMinutes));
    if (![120, 300, 600].includes(minutes)) return result(null, 'Meta semanal inválida.');
    const response = await supabase.rpc('amex_save_study_goal', {
      target_academy: academy,
      target_minutes: minutes,
    });
    if (response.error) {
      reportClientError(response.error, { source: 'services/platform.js', action: 'saveStudyGoal' });
      return result(null, safeBackendMessage(response.error, 'Não foi possível salvar a meta.'));
    }
    return result(response.data, null);
  } catch (error) {
    reportClientError(error, { source: 'services/platform.js' });
    return result(null, 'Não foi possível salvar a meta.');
  }
}
