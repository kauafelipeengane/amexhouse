# Modelo de dados

## Catálogo

- `courses` 1:N `course_modules`
- `course_modules` 1:N `lessons`
- `lessons` 1:0..1 `lesson_videos`
- `lessons` 1:N `lesson_resources`
- `lessons` 1:N `lesson_exercises`

## Dados pessoais

- `lesson_progress`: usuário e aula
- `notes`: usuário e aula
- `favorites`: usuário e aula
- `watch_later`: usuário e aula
- `activities`: usuário e referência
- `study_goals`: usuário e minutos semanais

Todos os dados pessoais devem ser protegidos por RLS e associados ao usuário autenticado.
