// Isolated in-memory assets only; no .env, Next routes, production sessions or live transport.
import { build } from 'vite';
import { createServer } from 'node:http';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { readFile } from 'node:fs/promises';

export const reportingCsp = "default-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'none'; font-src 'none'; object-src 'none'; frame-src 'none'; form-action 'none'; base-uri 'none'";
export async function buildReportingAssets() {
  const root = fileURLToPath(new URL('../../../', import.meta.url));
  const output = await build({ root, configFile: false, envFile: false, logLevel: 'error', resolve: { alias: { '@': root } }, esbuild: { jsx: 'automatic' },
    plugins: [{ name: 'reporting-shell-isolation', enforce: 'pre',
      resolveId(id) {
        if (/(^|\/)context\/AppContext$/.test(id)) return path.join(root, 'tests/frontend/browser/state.tsx').replaceAll('\\', '/');
        if (['next/link', 'next/navigation', 'next/image'].includes(id)) return '\0reporting:' + id;
      },
      load(id) {
        if (id === '\0reporting:next/link') return `import React from 'react';export default function Link({href,children,onClick,...props}){return React.createElement('a',{...props,href,onClick:e=>{e.preventDefault();onClick?.(e);}},children)}`;
        if (id === '\0reporting:next/image') return `import React from 'react';export default function Image({src,alt,width,height,className}){return React.createElement('img',{src,alt,width,height,className})}`;
        if (id === '\0reporting:next/navigation') return `import {useSyncExternalStore} from 'react';const subscribe=listener=>{window.addEventListener('popstate',listener);return ()=>window.removeEventListener('popstate',listener)};const router={push(){},replace(){}};export const useRouter=()=>router;export const usePathname=()=>useSyncExternalStore(subscribe,()=>location.pathname);export const useSearchParams=()=>new URLSearchParams(location.search);`;
      },
    }],
    build: { write: false, minify: false, cssCodeSplit: false, rollupOptions: { input: fileURLToPath(new URL('catch-reporting-fixture.tsx', import.meta.url)) } } });
  const assets = new Map();
  assets.set('/images/parola-logo.jpeg', await readFile(path.join(root, 'public/images/parola-logo.jpeg')));
  for (const item of output.output) assets.set('/' + item.fileName, Buffer.from(item.type === 'chunk' ? item.code : item.source));
  const entry = output.output.find(item => item.type === 'chunk' && item.isEntry).fileName;
  const css = output.output.filter(item => item.fileName.endsWith('.css')).map(item => `<link rel="stylesheet" href="/${item.fileName}">`).join('');
  assets.set('/', Buffer.from(`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Parola reports · synthetic preview</title>${css}<style>body{margin:0;--font-sans:system-ui,sans-serif;--font-display:system-ui,sans-serif}button,select{cursor:pointer}</style></head><body><div id="root"></div><script type="module" src="/${entry}"></script></body></html>`));
  return assets;
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const assets = await buildReportingAssets();
  const port = Number(process.argv.find(value => value.startsWith('--port='))?.slice(7) || 4174);
  createServer((request, response) => {
    const pathname = new URL(request.url, 'http://127.0.0.1').pathname;
    const asset = assets.get(pathname);
    response.setHeader('Content-Security-Policy', reportingCsp);
    response.setHeader('Cache-Control', 'no-store');
    response.setHeader('Content-Type', pathname.endsWith('.js') ? 'text/javascript' : pathname.endsWith('.css') ? 'text/css' : pathname.endsWith('.jpeg') ? 'image/jpeg' : 'text/html');
    response.writeHead(asset ? 200 : 404); response.end(asset || 'Isolated reporting preview: unavailable asset.');
  }).listen(port, '127.0.0.1', () => console.log(`Synthetic reporting preview: http://127.0.0.1:${port}/ (no live requests)`));
}
