import { asArray, safeNumber } from './utils';
export const academyConfig = Object.freeze({
  pentest: {
    key: 'pentest',
    title: 'AMEX PENTEST',
    catalogTitle: 'Pentest e Segurança Ofensiva',
    trackLabel: 'TRILHA PENTEST',
    subtitle:
      'Dez cursos sobre aplicações, redes, sistemas, cloud, automação e metodologia de testes autorizados.',
    courseSlugs: [
      'apis-identidade',
      'base-profissional',
      'cloud-containers',
      'laboratorios-controlados',
      'linux-windows',
      'metodologia-profissional',
      'programacao-automacao',
      'projeto-final',
      'redes-protocolos',
      'seguranca-web',
    ],
  },
  python: {
    key: 'python',
    title: 'AMEX PYTHON',
    catalogTitle: 'Python: Fundamentos e Produção',
    trackLabel: 'TRILHA PYTHON',
    subtitle:
      'Nove cursos de Python, orientação a objetos, testes, APIs, bancos, concorrência e serviços em produção.',
    courseSlugs: [
      'python-do-basico-ao-avancado',
      'python-fundamentos',
      'python-colecoes-funcoes',
      'python-orientacao-objetos',
      'python-testes-qualidade',
      'python-apis-bancos',
      'python-async-performance',
      'python-devops-producao',
      'python-projeto-senior',
    ],
  },
  javascript: {
    key: 'javascript',
    title: 'AMEX JAVASCRIPT',
    catalogTitle: 'JavaScript Full Stack',
    trackLabel: 'TRILHA JAVASCRIPT',
    subtitle:
      'Nove cursos de JavaScript, TypeScript, React e Node.js, com APIs, persistência, testes e deploy.',
    courseSlugs: [
      'javascript-fundamentos',
      'javascript-web-moderno',
      'typescript-arquitetura',
      'react-interfaces',
      'node-backend',
      'bancos-javascript',
      'testes-javascript',
      'fullstack-producao',
      'javascript-projeto-senior',
    ],
  },
  data: {
    key: 'data',
    title: 'AMEX DATA',
    catalogTitle: 'Dados e Analytics',
    trackLabel: 'TRILHA DATA',
    subtitle: 'Nove cursos de SQL, PostgreSQL, Python, estatística, visualização, pipelines e BI.',
    courseSlugs: [
      'dados-fundamentos',
      'sql-profissional',
      'postgresql-modelagem',
      'python-analise-dados',
      'visualizacao-dados',
      'estatistica-aplicada',
      'engenharia-dados',
      'analytics-bi',
      'dados-projeto-senior',
    ],
  },
  devops: {
    key: 'devops',
    title: 'AMEX OPS',
    catalogTitle: 'Operações, Cloud e SRE',
    trackLabel: 'TRILHA OPS',
    subtitle:
      'Nove cursos de Linux, CI/CD, Docker, cloud, Terraform, Kubernetes, observabilidade e SRE.',
    courseSlugs: [
      'devops-fundamentos',
      'linux-automacao',
      'git-ci-cd',
      'containers-docker',
      'cloud-fundamentos',
      'infraestrutura-codigo',
      'kubernetes-plataforma',
      'sre-observabilidade',
      'devops-projeto-senior',
    ],
  },
});
const normalize = (value) =>
  String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
export function classifyCourses(courses) {
  const result = {
    ...Object.fromEntries(Object.keys(academyConfig).map((key) => [key, []])),
    unclassified: [],
    collisions: [],
  };
  for (const course of asArray(courses)) {
    const slug = normalize(course?.slug),
      matches = Object.entries(academyConfig)
        .filter(([, config]) => config.courseSlugs.includes(slug))
        .map(([key]) => key);
    if (matches.length === 1) result[matches[0]].push(course);
    else if (matches.length > 1) result.collisions.push(course);
    else result.unclassified.push(course);
  }
  return result;
}
export function selectAcademyData(data, kind) {
  const classified = classifyCourses(data?.courses),
    courses = classified[kind] ?? [],
    courseIds = new Set(courses.map((course) => course.id)),
    modules = asArray(data?.modules).filter((module) => courseIds.has(module.course_id)),
    moduleIds = new Set(modules.map((module) => module.id)),
    lessons = asArray(data?.lessons).filter((lesson) => moduleIds.has(lesson.module_id)),
    lessonIds = new Set(lessons.map((lesson) => lesson.id));
  return {
    ...data,
    courses,
    modules,
    lessons,
    progress: asArray(data?.progress).filter((item) => lessonIds.has(item.lesson_id)),
    notes: asArray(data?.notes).filter((item) => item.lesson_id && lessonIds.has(item.lesson_id)),
    favorites: asArray(data?.favorites).filter((item) => lessonIds.has(item.lesson_id)),
    later: asArray(data?.later).filter((item) => lessonIds.has(item.lesson_id)),
    activities: asArray(data?.activities).filter((item) => lessonIds.has(item.reference_id)),
    resources: asArray(data?.resources).filter((item) => lessonIds.has(item.lesson_id)),
    exercises: asArray(data?.exercises).filter((item) => lessonIds.has(item.lesson_id)),
    goal: asArray(data?.studyGoals).find((item) => item.academy === kind) ?? null,
    academyMeta: {
      kind,
      courseIds: [...courseIds],
      courseCount: courses.length,
      moduleCount: modules.length,
      lessonCount: lessons.length,
      totalHours: courses.reduce((sum, course) => sum + safeNumber(course.workload_hours), 0),
      unclassifiedCount: classified.unclassified.length,
      collisionCount: classified.collisions.length,
    },
  };
}
export function academyCatalogStatus(data) {
  const classified = classifyCourses(data?.courses);
  return {
    ...Object.fromEntries(Object.keys(academyConfig).map((key) => [key, classified[key].length])),
    unclassified: classified.unclassified.length,
    collisions: classified.collisions.length,
  };
}
