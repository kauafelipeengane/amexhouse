export const normalizeSearch = (value) =>
  String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR')
    .trim()
    .replace(/\s+/g, ' ');
export function searchLessons(lessons, query, limit = 50) {
  const terms = normalizeSearch(query).split(' ').filter(Boolean);
  if (!terms.length) return [];
  return lessons
    .map((lesson) => {
      const title = normalizeSearch(lesson.title),
        course = normalizeSearch(lesson.course?.title),
        module = normalizeSearch(lesson.module?.title),
        summary = normalizeSearch(lesson.summary),
        haystack = `${title} ${course} ${module} ${summary}`;
      if (!terms.every((term) => haystack.includes(term))) return null;
      const score = terms.reduce(
        (sum, term) =>
          sum +
          (title.startsWith(term)
            ? 6
            : title.includes(term)
              ? 4
              : course.includes(term)
                ? 2
                : module.includes(term)
                  ? 2
                  : 1),
        0,
      );
      return { lesson, score };
    })
    .filter(Boolean)
    .sort(
      (a, b) =>
        b.score - a.score || String(a.lesson.title).localeCompare(String(b.lesson.title), 'pt-BR'),
    )
    .slice(0, limit)
    .map((item) => item.lesson);
}
