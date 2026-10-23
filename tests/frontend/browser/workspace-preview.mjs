// Explicit in-memory development preview. No .env loading, production session or live requests.
import { build } from 'vite';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const workspaceCsp = "default-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'none'; font-src 'none'; object-src 'none'; frame-src 'none'; form-action 'none'; base-uri 'none'";
export async function buildWorkspaceAssets() {
  const root = fileURLToPath(new URL('../../../', import.meta.url));
  const output = await build({ root, configFile: false, envFile: false, logLevel: 'error', resolve: { alias: { '@': root } }, esbuild: { jsx: 'automatic' },
    plugins: [{ name: 'workspace-isolation', enforce: 'pre', resolveId(id) {
      if (/(^|\/)context\/AppContext$/.test(id)) return path.join(root, 'tests/frontend/browser/state.tsx').replaceAll('\\', '/');
      if (/(^|\/)utils\/auth-fetch$/.test(id)) return '\0access:auth';
      if (['next/link', 'next/navigation', 'next/dynamic', 'next/image'].includes(id)) return '\0access:' + id;
    }, load(id) {
      if (id === '\0access:auth') return 'export const authHeaders=async()=>({});';
      if (id === '\0access:next/image') return `import React from 'react';export default function Image({src,alt,width,height,className}){return React.createElement('img',{src,alt,width,height,className})}`;
      if (id === '\0access:next/link') return `import React from 'react';export default function Link({href,children,...props}){return React.createElement('a',{...props,href,onClick:e=>{if(!href.startsWith('#')){e.preventDefault();window.fixture.route(href)}}},children)}`;
      if (id === '\0access:next/navigation') return `const router={push:path=>window.fixture.route(path),replace:path=>window.fixture.route(path)};export const useRouter=()=>router;export const usePathname=()=>location.pathname;export const useSearchParams=()=>new URLSearchParams(location.search);`;
      if (id === '\0access:next/dynamic') return `import React from 'react';export default function dynamic(loader,options){const C=React.lazy(async()=>{const m=await loader();return {default:m.default||m}});return props=>React.createElement(React.Suspense,{fallback:options.loading?React.createElement(options.loading):null},React.createElement(C,props))}`;
    } }],
    build: { write: false, minify: false, cssCodeSplit: false, rollupOptions: { input: fileURLToPath(new URL('workspace-fixture.tsx', import.meta.url)) } } });
  const assets = new Map();
  for (const item of output.output) assets.set('/' + item.fileName, Buffer.from(item.type === 'chunk' ? item.code : item.source));
  const entry = output.output.find(item => item.type === 'chunk' && item.isEntry).fileName;
  const css = output.output.filter(item => item.fileName.endsWith('.css')).map(item => `<link rel="stylesheet" href="/${item.fileName}">`).join('');
  assets.set('/', Buffer.from(`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Parola welcome/workspaces · synthetic preview</title>${css}<style>body{margin:0;--font-sans:system-ui,sans-serif;--font-display:system-ui,sans-serif}#root{min-height:100vh}.leaflet-container{background:#eaf1ec!important}</style></head><body><div id="root"></div><script type="module" src="/${entry}"></script></body></html>`));
  assets.set('/images/parola-logo.jpeg', await readFile(path.join(root, 'public/images/parola-logo.jpeg')));
  assets.set('/images/auth-bg.jpeg', await readFile(path.join(root, 'public/images/auth-bg.jpeg')));
  return assets;
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const assets = await buildWorkspaceAssets();
  const port = Number(process.argv.find(value => value.startsWith('--port='))?.slice(7) || 4177);
  createServer((request, response) => {
    const pathname = new URL(request.url, 'http://127.0.0.1').pathname;
    const asset = assets.get(pathname) || (pathname === '/' || pathname.startsWith('/workspace') || pathname.startsWith('/onboarding') ? assets.get('/') : null);
    response.setHeader('Content-Security-Policy', workspaceCsp); response.setHeader('Cache-Control', 'no-store');
    response.setHeader('Content-Type', pathname.endsWith('.js') ? 'text/javascript' : pathname.endsWith('.css') ? 'text/css' : pathname.endsWith('.jpeg') ? 'image/jpeg' : 'text/html');
    response.writeHead(asset ? 200 : 404); response.end(asset || 'Isolated preview: unavailable asset.');
  }).listen(port, '127.0.0.1', () => console.log(`Synthetic welcome/workspaces preview: http://127.0.0.1:${port}/ (no live requests)`));
}
