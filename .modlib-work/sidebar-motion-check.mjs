import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import assert from 'node:assert/strict';
const require = createRequire(import.meta.url);
const vpRequire = createRequire(require.resolve('vitepress/package.json'));
const { JSDOM } = require('jsdom');
const { parse, compileScript } = vpRequire('@vue/compiler-sfc');
const dom = new JSDOM('<div id="app"></div>', { url: 'http://localhost/' });
for (const name of ['window', 'document', 'navigator', 'Element', 'HTMLElement', 'SVGElement', 'Node', 'localStorage']) {
  Object.defineProperty(globalThis, name, { value: dom.window[name], configurable: true });
}
globalThis.getComputedStyle = dom.window.getComputedStyle.bind(dom.window);
globalThis.requestAnimationFrame = callback => setTimeout(callback, 0);
globalThis.cancelAnimationFrame = clearTimeout;
let motionReduced = false;
window.matchMedia = query => ({ get matches() { return query.includes('reduced-motion') ? motionReduced : true; }, addEventListener() {}, removeEventListener() {} });
const motions = [];
const scrolls = [];
HTMLElement.prototype.scrollIntoView = () => { throw new Error('Must not scroll ancestors'); };
HTMLElement.prototype.scrollTo = function(options) { scrolls.push(options); };
HTMLElement.prototype.getBoundingClientRect = function() {
  const collapsed = document.querySelector('.Layout')?.classList.contains('sidebar-collapsed');
  const left = (collapsed ? 100 : 220) + (this.mockOffset || 0);
  return { left, top: 120, width: 624, height: 32 };
};
HTMLElement.prototype.animate = function(frames, options) {
  assert.equal(options.duration, 280);
  assert(!frames.some(frame => frame.transform.includes('scale')));
  const el = this;
  const motion = { frames, options, cancelled: false, cancel() { this.cancelled = true; el.mockOffset = 0; this.oncancel?.(); } };
  this.mockOffset = Number(frames[0].transform.match(/translate\(([-\d.]+)/)[1]) / 2;
  motions.push(motion);
  return motion;
};
const vueUrl = pathToFileURL(vpRequire.resolve('vue')).href;
const vue = await import(vueUrl);
const route = vue.reactive({ path: '/one' });
const hasSidebar = vue.ref(true);
globalThis.__sidebarTest = { route, hasSidebar };
const source = readFileSync(new URL('../docs/.vitepress/theme/Layout.vue', import.meta.url), 'utf8');
const compiled = compileScript(parse(source).descriptor, { id: 'motion-test', inlineTemplate: true });
let code = compiled.content
  .replace(/from ["']vue["']/g, `from ${JSON.stringify(vueUrl)}`)
  .replace(/import \{ useRoute \} from "vitepress";/, 'const useRoute = () => globalThis.__sidebarTest.route;')
  .replace(/import DefaultTheme, \{ useLayout \} from "vitepress\/theme";/, `
    import { h as testH } from ${JSON.stringify(vueUrl)};
    const useLayout = () => ({ hasSidebar: globalThis.__sidebarTest.hasSidebar });
    const DefaultTheme = { Layout: { setup(_, { slots }) { return () => testH('div', { class: 'Layout' }, [
      testH('div', { class: 'VPNavBarTitle' }, 'Title'),
      ...(slots['nav-bar-content-before']?.() || []),
      testH('aside', { class: 'VPSidebar' }, [testH('div', { class: 'VPSidebarItem is-active' }, [testH('div', { class: 'item' }, 'Active')])]),
      testH('div', { class: 'VPDoc' }, [testH('div', { class: 'content-container' }, 'Article')])
    ]); } } };
  `)
  .replace(/import (\w+) from "\.\/components\/[^"]+";/g, 'const $1 = { render() { return null; } };');
const { default: Layout } = await import('data:text/javascript;base64,' + Buffer.from(code).toString('base64'));
let app = vue.createApp(Layout);
app.mount('#app');
await vue.nextTick();
const button = () => document.querySelector('button');
button().click();
await vue.nextTick();
assert.equal(button().getAttribute('aria-expanded'), 'false');
assert(motions.length >= 2);
const previous = [...motions];
button().click();
await vue.nextTick();
assert.equal(button().getAttribute('aria-expanded'), 'true');
assert(previous.every(m => m.cancelled));
assert(scrolls.length > 0);
assert.equal(scrolls.at(-1).behavior, 'instant');
assert.equal(motions.at(-1).frames[0].transform, 'translate(-60px, 0px)');
window.dispatchEvent(new window.Event('resize'));
assert(motions.every(m => m.cancelled));
assert([...document.querySelectorAll('[style]')].every(el => !el.style.willChange));
button().click();
button().click();
await vue.nextTick();
assert.equal(button().getAttribute('aria-expanded'), 'true');
route.path = '/two';
await vue.nextTick();
assert(motions.every(m => m.cancelled));
const count = motions.length;
motionReduced = true;
button().click();
await vue.nextTick();
assert.equal(motions.length, count);
assert.equal(localStorage.getItem('notes:sidebar-collapsed'), 'true');
app.unmount();
app = vue.createApp(Layout);
app.mount('#app');
await vue.nextTick();
assert.equal(button().getAttribute('aria-expanded'), 'false');
app.unmount();
console.log('PASS: translation-only motion; interruption continues from visual position; fast toggles; resize/route/unmount cleanup; sidebar-only scroll; reduced motion; persistence.');
