import { asArray, safeNumber } from './utils';
export function buildLessonSequence(data, currentLesson) {
  const courses = asArray(data?.courses),
    modules = asArray(data?.modules),
    lessons = asArray(data?.lessons),
    courseId = currentLesson?.course?.id;
  const courseIndex = courses.findIndex((course) => course.id === courseId),
    course = courses[courseIndex] ?? null;
  const courseModuleIds = new Set(
    modules.filter((module) => module.course_id === courseId).map((module) => module.id),
  );
  const courseLessons = lessons
    .filter((lesson) => courseModuleIds.has(lesson.module_id))
    .sort(
      (a, b) =>
        safeNumber(a.module?.position) - safeNumber(b.module?.position) ||
        safeNumber(a.position) - safeNumber(b.position) ||
        String(a.title).localeCompare(String(b.title), 'pt-BR'),
    );
  const lessonIndex = courseLessons.findIndex((lesson) => lesson.id === currentLesson?.id),
    previous = lessonIndex > 0 ? courseLessons[lessonIndex - 1] : null,
    next =
      lessonIndex >= 0 && lessonIndex < courseLessons.length - 1
        ? courseLessons[lessonIndex + 1]
        : null;
  const nextCourse =
    courses.slice(courseIndex + 1).find((candidate) => {
      const ids = new Set(
        modules.filter((module) => module.course_id === candidate.id).map((module) => module.id),
      );
      return lessons.some((lesson) => ids.has(lesson.module_id));
    }) ?? null;
  const nextCourseModuleIds = new Set(
    modules.filter((module) => module.course_id === nextCourse?.id).map((module) => module.id),
  );
  const nextCourseFirstLesson = nextCourse
    ? (lessons
        .filter((lesson) => nextCourseModuleIds.has(lesson.module_id))
        .sort(
          (a, b) =>
            safeNumber(a.module?.position) - safeNumber(b.module?.position) ||
            safeNumber(a.position) - safeNumber(b.position),
        )[0] ?? null)
    : null;
  return {
    course,
    courseIndex,
    courseLessons,
    lessonIndex,
    previous,
    next,
    nextCourse,
    nextCourseFirstLesson,
    isFirst: lessonIndex === 0,
    isLast: lessonIndex === courseLessons.length - 1,
    total: courseLessons.length,
  };
}
