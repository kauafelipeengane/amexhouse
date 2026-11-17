import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const workspace=readFileSync(new URL('../src/pages/Workspace.jsx',import.meta.url),'utf8');
const css=readFileSync(new URL('../src/styles/rigorous-rebuild.css',import.meta.url),'utf8');
test('meta semanal nao usa 3D nem ornamento morto',()=>{assert.match(workspace,/className="goal-weekly-dashboard"/);assert.match(workspace,/className="goal-weekly-facts"/);const start=workspace.indexOf('export function Goals');assert.doesNotMatch(workspace.slice(start),/goal-orbit|goal-academy-3d/);});
test('meta semanal possui composicao desktop e mobile',()=>{assert.match(css,/\.goal-weekly-dashboard \{[\s\S]*grid-template-columns: minmax\(0, 1fr\) 220px/);assert.match(css,/@media \(max-width:680px\)[\s\S]*grid-template-areas:'summary' 'track' 'percentage' 'facts'/);assert.match(css,/@media \(hover:none\)/);});
