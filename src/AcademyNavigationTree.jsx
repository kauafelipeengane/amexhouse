import React, { useEffect, useMemo, useRef, useState } from 'react';
import './navigation-tree.css';

const primary = [
  ['home', 'Início'],
  ['courses', 'Catálogo'],
  ['notes', 'Anotações'],
  ['saved', 'Salvos'],
  ['progress', 'Progresso'],
  ['activities', 'Atividades'],
  ['insights', 'Desempenho'],
  ['goals', 'Meta'],
  ['certificate', 'Certificado'],
];
const normalize = (value) =>
  String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

function TreeItem({
  node,
  level,
  currentPage,
  currentLessonId,
  onSection,
  onLesson,
  expanded,
  toggle,
  register,
}) {
  const hasChildren = node.children?.length > 0;
  const isCurrent = node.type === 'section' ? currentPage === node.id : currentLessonId === node.id;
  const isOpen = expanded.has(node.key);
  return (
    <li role="none">
      <button
        ref={(el) => register(node.key, el)}
        type="button"
        role="treeitem"
        tabIndex={isCurrent ? 0 : -1}
        aria-level={level}
        aria-current={isCurrent ? 'page' : undefined}
        aria-expanded={hasChildren ? isOpen : undefined}
        className={`academy-tree-item ${isCurrent ? 'current' : ''}`}
        style={{ '--tree-level': level - 1 }}
        aria-label={node.label}
        onClick={() =>
          hasChildren
            ? toggle(node.key)
            : node.type === 'lesson'
              ? onLesson(node.id)
              : onSection(node.id)
        }
      >
        <span className="academy-tree-label">{node.label}</span>
        {hasChildren && (
          <span className="academy-tree-toggle" aria-hidden="true">
            {isOpen ? '−' : '+'}
          </span>
        )}
      </button>
      {hasChildren && (
        <div className="academy-tree-branch" data-open={isOpen} inert={isOpen ? undefined : ''}>
          <ul role="group">
            {node.children.map((child) => (
              <TreeItem
                key={child.key}
                node={child}
                level={level + 1}
                currentPage={currentPage}
                currentLessonId={currentLessonId}
                onSection={onSection}
                onLesson={onLesson}
                expanded={expanded}
                toggle={toggle}
                register={register}
              />
            ))}
          </ul>
        </div>
      )}
    </li>
  );
}

export function AcademyNavigationTree({
  data,
  page,
  currentLessonId,
  onSection,
  onLesson,
  academy,
}) {
  const [filter, setFilter] = useState(''),
    [expanded, setExpanded] = useState(new Set(['catalog']));
  const root = useRef(null),
    search = useRef(null),
    refs = useRef(new Map());
  const tree = useMemo(() => {
    const courses = (data?.courses ?? []).map((course) => ({
      key: `course-${course.id}`,
      id: course.id,
      type: 'group',
      label: course.title,
      children: (data?.modules ?? [])
        .filter((m) => m.course_id === course.id)
        .map((module) => ({
          key: `module-${module.id}`,
          id: module.id,
          type: 'group',
          label: module.title,
          children: (data?.lessons ?? [])
            .filter((l) => l.module_id === module.id)
            .map((lesson) => ({
              key: `lesson-${lesson.id}`,
              id: lesson.id,
              type: 'lesson',
              label: lesson.title,
            })),
        })),
    }));
    const sections = primary.map(([id, label]) => ({
      key: `section-${id}`,
      id,
      type: 'section',
      label,
    }));
    sections.splice(2, 0, {
      key: 'catalog',
      id: 'catalog',
      type: 'group',
      label: 'Percurso da formação',
      children: courses,
    });
    return sections;
  }, [data]);
  const visibleTree = useMemo(() => {
    const term = normalize(filter.trim());
    if (term.length < 2) return tree;
    const walk = (node) => {
      const children = (node.children ?? []).map(walk).filter(Boolean);
      return normalize(node.label).includes(term) || children.length ? { ...node, children } : null;
    };
    return tree.map(walk).filter(Boolean);
  }, [tree, filter]);
  useEffect(() => {
    const handler = (event) => {
      if (event.key === '/' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(event.target.tagName)) {
        event.preventDefault();
        search.current?.focus();
        return;
      }
      if (!root.current?.contains(event.target) || event.target.getAttribute('role') !== 'treeitem')
        return;
      const items = [...root.current.querySelectorAll('[role="treeitem"]')].filter(
        (el) => !el.closest('[inert]'),
      );
      const index = items.indexOf(event.target);
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        items[Math.min(index + 1, items.length - 1)]?.focus();
      }
      if (event.key === 'ArrowUp') {
        event.preventDefault();
        items[Math.max(index - 1, 0)]?.focus();
      }
      if (event.key === 'Home') {
        event.preventDefault();
        items[0]?.focus();
      }
      if (event.key === 'End') {
        event.preventDefault();
        items.at(-1)?.focus();
      }
      if (event.key === 'ArrowRight' && event.target.getAttribute('aria-expanded') === 'false') {
        event.preventDefault();
        event.target.click();
      }
      if (event.key === 'ArrowLeft' && event.target.getAttribute('aria-expanded') === 'true') {
        event.preventDefault();
        event.target.click();
      }
    };
    addEventListener('keydown', handler);
    return () => removeEventListener('keydown', handler);
  }, []);
  useEffect(() => {
    if (filter.trim().length >= 2) {
      const keys = new Set();
      const collect = (n) => {
        if (n.children?.length) {
          keys.add(n.key);
          n.children.forEach(collect);
        }
      };
      visibleTree.forEach(collect);
      setExpanded(keys);
    }
  }, [filter, visibleTree]);
  const toggle = (key) =>
    setExpanded((value) => {
      const next = new Set(value);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  return (
    <section className="academy-tree" aria-label={`Navegação da academia ${academy}`}>
      <div className="academy-tree-search">
        <svg viewBox="0 0 20 20" aria-hidden="true">
          <path d="m14.5 14.5 3 3M16 9a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z" />
        </svg>
        <input
          ref={search}
          type="search"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filtrar navegação"
          aria-label="Filtrar cursos, módulos e aulas"
        />
        <kbd>/</kbd>
      </div>
      <nav aria-label="Árvore acadêmica">
        <ul ref={root} role="tree">
          {visibleTree.map((node) => (
            <TreeItem
              key={node.key}
              node={node}
              level={1}
              currentPage={page}
              currentLessonId={currentLessonId}
              onSection={onSection}
              onLesson={onLesson}
              expanded={expanded}
              toggle={toggle}
              register={(key, el) => (el ? refs.current.set(key, el) : refs.current.delete(key))}
            />
          ))}
        </ul>
      </nav>
      {filter.trim().length >= 2 && visibleTree.length === 0 && (
        <p className="academy-tree-empty">Nenhum resultado encontrado.</p>
      )}
    </section>
  );
}
