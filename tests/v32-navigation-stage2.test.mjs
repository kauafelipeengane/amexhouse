import test from'node:test';import assert from'node:assert/strict';import{readFileSync}from'node:fs';
const read=p=>readFileSync(new URL(p,import.meta.url),'utf8'),nav=read('../src/hooks/useNavigation.js'),layout=read('../src/components/Layout.jsx'),lesson=read('../src/pages/Lesson.jsx'),css=read('../src/style.css');
test('scroll por rota e restaurado com seguranca',()=>{assert.match(nav,/sessionStorage/);assert.match(nav,/scrollRestoration='manual'/);assert.match(nav,/try\{/)});
test('menu movel prende foco',()=>{assert.match(layout,/const trap=/);assert.match(layout,/e\.key!=='Tab'/);assert.match(layout,/main-menu/)});
test('armazenamento da sidebar possui fallback',()=>assert.match(layout,/localStorage\.getItem\('amex-sidebar'\).*catch/s));
test('aula possui breadcrumb acessivel',()=>{assert.match(lesson,/className="breadcrumbs"/);assert.match(lesson,/aria-current="page"/)});
test('mobile trata textos e excesso de altura',()=>{assert.match(css,/text-overflow:ellipsis/);assert.match(css,/shell>aside[^}]*overflow-y:auto|shell>aside.open[^}]*overflow-y:auto/);assert.match(css,/overscroll-behavior:contain/)});
