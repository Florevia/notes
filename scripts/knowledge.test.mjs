import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync, existsSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { noteCategories, notesNav, notesSidebar, findKnowledgeContext } from '../docs/.vitepress/navigation.ts';
import { legacyTarget, publishLegacyPages } from '../docs/.vitepress/legacy.ts';

const root = new URL('../',import.meta.url);
const manifest = JSON.parse(readFileSync(new URL('scripts/content-migration.json',root),'utf8'));
const flatten = ns => ns.flatMap(n=>[n,...flatten(n.items ?? [])]);
const nodes = noteCategories.flatMap(c=>flatten(c.items));
test('six domains share the navigation source and isolate their sidebars',()=>{
 assert.equal(noteCategories.length,6);
 assert.equal(notesNav.length,6);
 for (const c of noteCategories) {
  assert.equal(notesNav.find(n=>n.text===c.text).link,c.link);
  assert(notesSidebar[c.link]);
  for (const n of flatten(c.items)) if(n.link) assert(n.link.startsWith(c.link));
 }
});
test('category directories match sidebar path case',()=>{
 const names = readdirSync(new URL('docs/', root));
 for (const c of noteCategories) {
  const dir = c.link.split('/').filter(Boolean)[0];
  assert(names.includes(dir), `${c.text} directory must be ${dir} so VitePress relativePath matches the sidebar`);
 }
});
test('all 264 original article bodies have one primary menu owner',()=>{
 const paths=nodes.filter(n=>n.link).map(n=>n.link);
 assert.equal(paths.length,new Set(paths).size);
 for (const a of manifest.articles) assert(paths.includes(a.route),a.newPath);
 assert.equal(manifest.originalMarkdownCount,265);
});
test('rendering mode, streaming typewriter, Node, and session storage are properly owned',()=>{
 const cases = [
  ['/frontend/browser/rendering-modes','frontend'],
  ['/frontend/practice/streaming-typewriter','frontend'],
  ['/engineering/architecture/map-vs-redis','engineering'],
  ['/engineering/nodejs/event-loop','engineering'],
  ['/ai/agent/mcp/pi-agent-mcp','ai'],
 ];
 for (const [route,owner] of cases) assert.equal(findKnowledgeContext(route+'.html').category.id,owner);
});
test('real interview answers point back to their primary knowledge article',()=>{
 const c=findKnowledgeContext('/interview/frontend/reactivity-answer');
 assert.equal(c.topic.role,'answer');
 assert.equal(c.topic.related[0].link,'/frontend/vue/ref-reactive');
});
test('reference-only sidebar concepts point to their actual topic index',()=>{
 const rag = nodes.find(n => n.text === '检索流程');
 assert.equal(rag.indexLink,'/ai/rag/#topic-3-2');
 const embedding=nodes.find(n=>n.text==='Embedding');
 assert.equal(embedding.indexLink,'/ai/rag/#topic-3-3');
});
test('old URLs and catalog anchors resolve to canonical topic paths',()=>{
 assert.equal(legacyTarget('/AI/Pi-Agent-MCP.html'),'/ai/agent/mcp/pi-agent-mcp');
 assert.equal(legacyTarget('/AI/面试/RAG'),'/ai/rag/rag-basics');
 assert.equal(legacyTarget('/catalog/ai/#topic-4-4'),'/ai/agent/mcp/');
 assert.equal(legacyTarget('/catalog/interviews/'),'/interview/');
});
test('legacy static pages preserve hashes and do not duplicate searchable Markdown',()=>{
 const dir=mkdtempSync(resolve(tmpdir(),'notes-ia-'));
 try {
  publishLegacyPages(dir,'/');
  const page=readFileSync(resolve(dir,'AI/Pi-Agent-MCP.html'),'utf8');
  assert(page.includes('location.hash'));
  assert(page.includes('location.replace'));
  assert(page.includes('noindex'));
  assert(!page.includes('Pi把 mcp连接'));
  assert(existsSync(resolve(dir,'catalog/ai/index.html')));
 } finally { rmSync(dir,{recursive:true,force:true}); }
});
