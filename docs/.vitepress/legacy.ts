import { mkdirSync, writeFileSync, existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import aliases from './legacy-routes.json' with { type: 'json' };

const routes: Record<string, string> = aliases;
const cleanPath = (path: string) => decodeURI(path).replace(/\.html$/, '').replace(/\/index$/, '/');
export function legacyTarget(url: string): string | undefined {
  const [pathname, hash] = decodeURI(url).split('#');
  return routes[pathname + (hash ? '#' + hash : '')] ?? routes[pathname] ?? routes[cleanPath(pathname)];
}
function redirectPage(from: string, to: string, base: string) {
  // Keep old category subsection anchors pointing at their new independent topic indexes.
  const anchored = Object.fromEntries(Object.entries(routes).filter(([key]) => cleanPath(key.split('#')[0]) === cleanPath(from) && key.includes('#')).map(([key,value]) => [key.split('#')[1],value]));
  const href = base.replace(/\/$/, '') + to;
  const escaped = href.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
  return `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex"><title>笔记已迁移</title><link rel="canonical" href="${escaped}"></head><body><p>这篇笔记已归入新的知识体系。<a href="${escaped}">继续阅读</a></p><script>const target=${JSON.stringify(to)}, anchors=${JSON.stringify(anchored)}, base=${JSON.stringify(base.replace(/\/$/, ''))}; const hash=decodeURIComponent(location.hash.slice(1));const next=anchors[hash]||target;const parts=next.split('#');location.replace(base+parts[0]+location.search+(parts.length>1?'#'+parts.slice(1).join('#'):location.hash));</script></body></html>`;
}
export function legacyCompatibilityPlugin() {
  return {
    name: 'knowledge-legacy-routes',
    configureServer(server: any) {
      server.middlewares.use((req: any, res: any, next: () => void) => {
        const url = req.url?.split('?')[0];
        if (!url || /(?:\.md|\.vue|\.js|\.ts|\.json)$/.test(url)) return next();
        const target = legacyTarget(url);
        if (!target || cleanPath(target.split('#')[0]) === cleanPath(url)) return next();
        res.statusCode = 200;
        res.setHeader('Content-Type','text/html; charset=utf-8');
        res.end(redirectPage(url,target,'/'));
      });
    },
  };
}
export function publishLegacyPages(outDir: string, base: string) {
  const written = new Set<string>();
  for (const [from,to] of Object.entries(routes)) {
    if (from.includes('#')) continue;
    const output = resolve(outDir, '.' + (from.endsWith('/') ? from + 'index.html' : from.endsWith('.html') ? from : from + '.html'));
    if (written.has(output)) continue;
    // Case-insensitive disks share old /CSS/ and canonical /css/ index files.
    // Keep the new topic index instead of overwriting it with a legacy redirect.
    if (existsSync(output) && !readFileSync(output, 'utf8').includes('笔记已迁移')) continue;
    written.add(output);
    mkdirSync(dirname(output),{recursive:true});
    writeFileSync(output,redirectPage(from,to,base));
  }
}
