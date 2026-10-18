// Test/development preview only. Compiles real components with isolated synthetic transports.
import { build } from 'vite';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../../', import.meta.url));
const directory = path.join(root, 'tests/frontend/browser').replaceAll('\\', '/');
export const previewCsp = "default-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'none'; font-src 'self'; object-src 'none'; frame-src 'none'; form-action 'none'; base-uri 'none'";

export async function buildReadabilityAssets({ beforeSource, variant = 'after' } = {}) {
  const stateModule = directory + '/state.tsx';
  const output = await build({ root, base: `/${variant}/`, configFile: false, envFile: false, logLevel: 'error',
    resolve: { alias: { '@': root } }, esbuild: { jsx: 'automatic' },
    plugins: [{ name: 'isolated-readability', enforce: 'pre',
      resolveId(id) {
        if (/(^|\/)context\/AppContext$/.test(id)) return stateModule;
        if (['next/link', 'next/navigation', 'next/dynamic'].includes(id)) return '\0readability:' + id;
      },
      async load(id) {
        if (id === '\0readability:next/link') return `import React from 'react';export default function Link({href,children,...props}){return React.createElement('a',{...props,href,onClick:e=>e.preventDefault()},children)}`;
        if (id === '\0readability:next/navigation') return `export const useRouter=()=>({push(){},replace(){}});export const usePathname=()=>'/dashboard';export const useSearchParams=()=>new URLSearchParams();`;
        if (id === '\0readability:next/dynamic') return `import React from 'react';export default function dynamic(loader,options){const C=React.lazy(async()=>{const m=await loader();return {default:m.default||m}});return props=>React.createElement(React.Suspense,{fallback:options.loading?React.createElement(options.loading):null},React.createElement(C,props))}`;
        if (beforeSource && !id.startsWith('\0')) {
          const relative = path.relative(root, id.split('?')[0]);
          // Read source through the normal project graph so installed dependencies stay shared.
          if (!relative.startsWith('..') && !relative.startsWith('node_modules') && !relative.startsWith('tests')) {
            try { return await readFile(path.join(beforeSource, relative), 'utf8'); }
            catch (error) { if (error.code !== 'ENOENT') throw error; }
          }
        }
      },
    }],
    build: { write: false, minify: false, cssCodeSplit: false, rollupOptions: { input: path.join(directory, 'hotspot-readability-fixture.tsx') } },
  });
  const assets = new Map();
  for (const item of output.output) assets.set(`/${variant}/` + item.fileName, Buffer.from(item.type === 'chunk' ? item.code : item.source));
  const entry = output.output.find(item => item.type === 'chunk' && item.isEntry).fileName;
  const css = output.output.filter(item => item.fileName.endsWith('.css')).map(item => `<link rel="stylesheet" href="/${variant}/${item.fileName}">`).join('');
  assets.set(`/${variant}/`, Buffer.from(`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Parola ${variant} · synthetic preview</title>${css}<style>body{margin:0}#root{min-height:100vh}.leaflet-container{background:#eaf1ec!important}@media(min-width:960px) and (min-height:600px){#root{height:100dvh;display:flex;flex-direction:column}#root>div:last-child{flex:1;min-height:0;height:auto}}</style></head><body><div id="root"></div><script type="module" src="/${variant}/${entry}"></script></body></html>`));
  // Only bundled public branding; no arbitrary filesystem paths or environment files are served.
  for (const name of ['images/parola-logo.jpeg']) {
    try { assets.set('/' + name, await readFile(path.join(root, 'public', name))); } catch { /* Asset may not exist. */ }
  }
  return assets;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const option = name => process.argv.find(value => value.startsWith(`--${name}=`))?.split('=').slice(1).join('=');
  const beforeSource = option('before-source');
  if (!beforeSource) throw new Error('Pass --before-source=<preserved frontend snapshot> to compare the actual starting UI.');
  const assets = new Map([...await buildReadabilityAssets({ beforeSource, variant: 'before' }), ...await buildReadabilityAssets()]);
  const port = Number(option('port') || 4173);
  const server = createServer((request, response) => {
    const url = new URL(request.url, 'http://127.0.0.1');
    const pathname = url.pathname === '/_next/image' && url.searchParams.get('url') === '/images/parola-logo.jpeg' ? '/images/parola-logo.jpeg' : url.pathname;
    const asset = assets.get(pathname);
    response.setHeader('Content-Security-Policy', previewCsp);
    response.setHeader('Cache-Control', 'no-store');
    response.setHeader('Content-Type', pathname.endsWith('.js') ? 'text/javascript' : pathname.endsWith('.css') ? 'text/css' : pathname.endsWith('.jpeg') ? 'image/jpeg' : 'text/html');
    response.writeHead(asset ? 200 : 404);
    response.end(asset || 'Isolated preview: asset unavailable. Use /before/ or /after/.');
  });
  server.listen(port, '127.0.0.1', () => console.log(`Synthetic previews: http://127.0.0.1:${port}/before/ and /after/ (no live requests; system font fallback).`));
}
