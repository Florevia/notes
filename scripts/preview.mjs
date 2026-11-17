import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { resolve, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../docs/.vitepress/dist/', import.meta.url));
const aliases = JSON.parse(readFileSync(new URL('../docs/.vitepress/legacy-routes.json',import.meta.url),'utf8'));
const portIndex = process.argv.indexOf('--port');
const hostIndex = process.argv.indexOf('--host');
const port = portIndex >= 0 ? Number(process.argv[portIndex+1]) : 4173;
const host = hostIndex >= 0 ? process.argv[hostIndex+1] : '127.0.0.1';
const mime = { '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.css':'text/css; charset=utf-8', '.json':'application/json; charset=utf-8', '.png':'image/png', '.jpg':'image/jpeg', '.svg':'image/svg+xml', '.woff2':'font/woff2', '.ts':'text/plain; charset=utf-8', '.yaml':'text/plain; charset=utf-8' };
createServer((req,res) => {
  try {
    const url=new URL(req.url,'http://localhost');
    const pathname=decodeURIComponent(url.pathname);
    const target=aliases[pathname];
    // Server redirect preserves browser fragments; category anchor remapping uses static HTML.
    if(target && !pathname.startsWith('/catalog/')) {
      res.writeHead(302,{Location:target+url.search,'Cache-Control':'no-store'});res.end();return;
    }
    if(pathname.includes('\0') || pathname.split('/').includes('..')) {res.writeHead(400);res.end();return;}
    const relative=pathname.replace(/^\//,'');
    let file=resolve(root,relative);
    if(!file.startsWith(root)) {res.writeHead(403);res.end();return;}
    if(existsSync(file) && statSync(file).isDirectory()) file=resolve(file,'index.html');
    if(!existsSync(file) && !extname(file)) file += '.html';
    const found=existsSync(file) && statSync(file).isFile();
    res.writeHead(found ? 200 : 404,{'Content-Type':mime[extname(file)] ?? 'application/octet-stream','Cache-Control':'no-cache'});
    if(req.method==='HEAD') {res.end();return;}
    res.end(readFileSync(found?file:resolve(root,'404.html')));
  } catch {res.writeHead(400);res.end();}
}).listen(port,host,()=>console.log(`Knowledge site preview: http://${host}:${port}/`));
