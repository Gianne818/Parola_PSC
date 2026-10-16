// Run: node tests/frontend/browser/run.mjs [--species | --demo | --registration] [--zoom200] [--manual] [absolute Chromium executable]
// Uses only installed Vite, React and a local Chromium binary. No app server.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createInterface } from 'node:readline/promises';
import { build } from 'vite';

const root = fileURLToPath(new URL('../../../', import.meta.url));
const directory = path.join(root, 'tests/frontend/browser').replaceAll('\\', '/');
const stateModule = directory + '/state.tsx';
const origin = 'http://parola.offline.invalid';
const assets = new Map();
const blocked = new Set();
const exceptions = [];
let passedChecks = 0;
const manual = process.argv.includes('--manual');
const registrationMode = process.argv.includes('--registration');
const demoMode = process.argv.includes('--demo');
const speciesMode = process.argv.includes('--species');
assert.ok([demoMode, registrationMode, speciesMode].filter(Boolean).length <= 1, 'Browser verification modes must be separate');
const zoom200 = process.argv.includes('--zoom200');
const servedAssets = new Set();
let demoEntryAssets;
let windowId;
let zoomChrome = { x: 0, y: 0 };
let browser;
let profile;
let sequence = 0;
const pending = new Map();
const handlers = new Map();
function send(method, params = {}, sessionId) {
  const id = ++sequence;
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => { pending.delete(id); reject(new Error(`CDP timeout: ${method}`)); }, 15000);
    pending.set(id, { resolve, reject, timeout });
    browser.stdio[3].write(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }) + '\0');
  });
}
function on(method, handler) { handlers.set(method, handler); }
function check(name, condition) { assert.ok(condition, name); passedChecks++; console.log(`PASS ${name}`); }
let session;
async function evaluate(expression) {
  const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true }, session);
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
  return result.result.value;
}
async function until(expression) {
  const deadline = Date.now() + 10000;
  do { if (await evaluate(expression)) return; await new Promise(resolve => setTimeout(resolve, 50)); } while (Date.now() < deadline);
  console.log(await evaluate(`({path:location.pathname,headings:Array.from(document.querySelectorAll('h1')).map(e=>e.textContent),body:document.body.innerText.slice(0,700)})`));
  throw new Error(`UI condition timed out: ${expression}`);
}
async function key(key, modifiers = 0) {
  const codes = { Tab: 9, Enter: 13, Escape: 27, ArrowDown: 40, ArrowUp: 38, End: 35, Home: 36 };
  await send('Input.dispatchKeyEvent', { type: 'keyDown', key, code: key, windowsVirtualKeyCode: codes[key], modifiers, ...(key==='Enter' ? {text:'\r',unmodifiedText:'\r'} : {}) }, session);
  await send('Input.dispatchKeyEvent', { type: 'keyUp', key, code: key, windowsVirtualKeyCode: codes[key], modifiers }, session);
}
const byText = (tag, text) => `Array.from(document.querySelectorAll(${JSON.stringify(tag)})).find(e=>e.getClientRects().length && e.textContent.trim()===${JSON.stringify(text)})`;
async function clickText(tag, text) { const expression = byText(tag, text); await until(`Boolean(${expression})`); await evaluate(`(${expression}).click()`); }
async function viewport(width, height = 800) {
  if (zoom200) {
    await send('Emulation.clearDeviceMetricsOverride', {}, session);
    // Browser chrome borders are measured separately from the zoomed page.
    await send('Browser.setWindowBounds', { windowId, bounds: { width: Math.round(width * 2 + zoomChrome.x), height: Math.round(height * 2 + zoomChrome.y), windowState: 'normal' } });
    if (await evaluate(`location.origin===${JSON.stringify(origin)}`)) await until(`innerWidth===${width}`);
    return;
  }
  await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: false }, session);
  await until(`innerWidth===${width}`);
}
async function containedFocus() {
  // Chromium may report BODY while traversing the browser's own focus boundary.
  // No background page control may become active; test inertness separately.
  return evaluate(`document.querySelector('dialog[open]').contains(document.activeElement) || document.activeElement===document.body`);
}
async function layout(name) {
  const data = await evaluate(`({width:innerWidth,scroll:document.documentElement.scrollWidth, clipped:Array.from(document.querySelectorAll('button, select, input')).filter(e=>e.getClientRects().length && e.scrollWidth>e.clientWidth+2).map(e=>({text:e.textContent.trim().slice(0,65),width:e.clientWidth,scroll:e.scrollWidth}))})`);
  if(data.scroll>data.width+1) console.log(await evaluate(`Array.from(document.querySelectorAll('body *')).filter(e=>e.getClientRects().length && e.getBoundingClientRect().right>innerWidth+1 && !e.closest('.leaflet-pane')).slice(0,12).map(e=>({tag:e.tagName,text:e.textContent.trim().slice(0,70),right:e.getBoundingClientRect().right}))`));
  check(`${name}: no document horizontal overflow`, data.scroll <= data.width + 1);
  check(`${name}: controls contain their text`, data.clipped.length === 0 || (console.log(data.clipped), false));
}

try {
  // No config mutation, .env loading, disk output, dev server or Next process.
  const output = await build({ root, configFile: false, envFile: false, logLevel: 'error',
    resolve: { alias: { '@': root } }, esbuild: { jsx: 'automatic' },
    plugins: [{ name: 'offline-boundaries', enforce: 'pre',
      resolveId(id) {
        if (demoMode) {
          // Only the framework pathname primitive is substituted. No OTP,
          // Supabase, application provider, API or transport success mocks.
          if (id === 'next/navigation') return '\0demo:navigation';
          return;
        }
        if (registrationMode) {
          if (/(^|\/)lib\/supabase$/.test(id)) return directory + '/registration-mocks.ts';
          if (['next/navigation', 'next/link', 'next/dynamic', 'next/image'].includes(id)) return '\0registration:' + id;
          if (/(^|\/)services\/(weatherService|supabaseHotspotService|supabaseWeatherService)$/.test(id)) return '\0registration:' + id.split('/').at(-1);
          return;
        }
        if (/(^|\/)context\/AppContext$/.test(id)) return stateModule;
        if (['next/navigation', 'next/link', 'next/dynamic'].includes(id)) return '\0offline:' + id;
        if (/(^|\/)services\/geocodingService$/.test(id) || (!speciesMode && /(^|\/)services\/dashboardService$/.test(id))) return '\0offline:' + id.split('/').at(-1);
      },
      load(id) {
        if (id === '\0demo:navigation') return `export const usePathname=()=>window.demoPath||'/register';export const useRouter=()=>{throw new Error('Demo must not mount live routing/auth')};`;
        if (id === '\0registration:next/link') return `import React from 'react';export default function Link({href,children,...props}){return React.createElement('a',{...props,href,onClick:e=>{e.preventDefault();window.fixtureNavigation=href}},children)}`;
        if (id === '\0registration:next/navigation') return `const router={push:href=>{window.fixtureNavigation=href},replace:href=>{window.fixtureNavigation=href}};export const useRouter=()=>router;export const usePathname=()=>'/dashboard';`;
        if (id === '\0registration:next/dynamic') return `export default function dynamic(){return ()=>null}`;
        if (id === '\0registration:next/image') return `export default function Image(){return null}`;
        if (id === '\0registration:weatherService') return `export const UNAVAILABLE_WEATHER={temp:null,windSpeed:null,windDirection:null,waveHeight:null,tide:null,stormSignal:null};export async function fetchLiveWeather(){return UNAVAILABLE_WEATHER}`;
        if (id === '\0registration:supabaseHotspotService') return `export async function fetchHotspots(){return []}`;
        if (id === '\0registration:supabaseWeatherService') return `export async function fetchWeatherSafetyOverrides(){return []}`;
        if (id === '\0offline:next/link') return `import React from 'react'; import {useApp} from ${JSON.stringify(stateModule)}; export default function Link({href,children,onClick,...props}){const {route}=useApp();return React.createElement('a',{...props,href,onClick:e=>{onClick?.(e);if(!e.defaultPrevented){e.preventDefault();route(href)}}},children)}`;
        if (id === '\0offline:next/navigation') return `import {useApp} from ${JSON.stringify(stateModule)}; export const useRouter=()=>{const {route}=useApp();return {push:route,replace:route}}; export const usePathname=()=>location.pathname;export const useSearchParams=()=>new URLSearchParams(location.search);`;
        if (id === '\0offline:next/dynamic') return `import React from 'react'; export default function dynamic(loader, options){const Component=React.lazy(async()=>{const value=await loader();return {default:value.default||value}});return props=>React.createElement(React.Suspense,{fallback:options.loading?React.createElement(options.loading):null},React.createElement(Component,props))}`;
        if (id === '\0offline:geocodingService') return `export async function searchLocations(){return []} export async function reverseGeocode(){throw new Error('Offline fixture: no geocoder')}`;
        if (id === '\0offline:dashboardService') return `export async function loadDashboardWeather(){throw new Error('Offline fixture: no weather')} export async function loadFishingAreaResult(){throw new Error('Offline fixture: no predictions')} export async function requestWeatherSms(){throw new Error('Offline fixture: SMS disabled')}`;
      } }],
    build: { write: false, minify: false, cssCodeSplit: false, sourcemap: false, rollupOptions: { input: path.join(directory, speciesMode ? 'species-fixture.tsx' : demoMode ? 'demo-fixture.tsx' : registrationMode ? 'registration-fixture.tsx' : 'fixture.tsx') } } });
  for (const item of output.output) assets.set('/' + item.fileName, Buffer.from(item.type === 'chunk' ? item.code : item.source));
  const entry = output.output.find(item => item.type === 'chunk' && item.isEntry).fileName;
  if (demoMode) {
    const chunks = new Map(output.output.filter(item=>item.type==='chunk').map(item=>[item.fileName,item]));
    const eager = new Set();
    const visit = name => { if(eager.has(name)) return; eager.add(name); chunks.get(name)?.imports.forEach(visit); };
    visit(entry);
    const modules = [...eager].flatMap(name=>Object.keys(chunks.get(name)?.modules || {}));
    check('demo eager module graph excludes live auth, provider, SDK and services', !modules.some(id=>/[/\\](?:services|context|hooks)[/\\]|[/\\]lib[/\\]supabase|[/\\]@supabase[/\\]|[/\\]LiveApplication\./.test(id)));
    check('demo graph is independent of backend OTP previews and their code', !modules.some(id=>/[/\\]app[/\\]api[/\\]|[/\\]lib[/\\](?:sms-mode|registration)\./.test(id)));
    check('demo graph includes actual login/register routes and their application boundary', ['app/login/page.tsx','app/register/page.tsx','components/application/ApplicationBoundary.tsx'].every(part=>modules.some(id=>id.replaceAll('\\','/').endsWith(part))));
    // Even the separately compiled live chunk cannot be loaded by this demo.
    demoEntryAssets = new Set(['/', ...[...eager].map(name=>'/'+name), ...output.output.filter(item=>item.fileName.endsWith('.css')).map(item=>'/'+item.fileName)]);
  }
  const css = output.output.filter(item => item.fileName.endsWith('.css')).map(item => `<link rel="stylesheet" href="/${item.fileName}">`).join('');
  assets.set('/', Buffer.from(`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Offline frontend verification</title>${css}</head><body><div id="root"></div><script type="module" src="/${entry}"></script></body></html>`));
  console.log('Fixture compiled in memory; starting isolated browser with deny proxy.');
  profile = await mkdtemp(path.join(tmpdir(), 'parola-ui02-offline-'));
  const executable = process.argv.slice(2).find(argument => !argument.startsWith('--')) || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
  browser = spawn(executable, [...(manual ? [] : ['--headless=new']), '--remote-debugging-pipe', `--user-data-dir=${profile}`, '--no-first-run', '--no-default-browser-check',
    '--disable-background-networking', '--disable-component-update', '--disable-sync', '--disable-extensions', '--disable-default-apps',
    '--proxy-server=http://127.0.0.1:9', '--proxy-bypass-list=<-loopback>', '--host-resolver-rules=MAP * ~NOTFOUND', 'about:blank'],
    { stdio: ['ignore', 'ignore', 'pipe', 'pipe', 'pipe'], windowsHide: true });
  browser.on('error', error => { for (const item of pending.values()) item.reject(error); });
  let buffer = '';
  browser.stdio[4].on('data', chunk => {
    buffer += chunk.toString(); let boundary;
    while ((boundary = buffer.indexOf('\0')) >= 0) {
      const message = JSON.parse(buffer.slice(0, boundary)); buffer = buffer.slice(boundary + 1);
      if (message.id) { const item = pending.get(message.id); if (item) { clearTimeout(item.timeout); pending.delete(message.id); message.error ? item.reject(new Error(JSON.stringify(message.error))) : item.resolve(message.result); } }
      else { const handler = handlers.get(message.method); if (handler) Promise.resolve(handler(message)).catch(error => exceptions.push(error.message)); }
    }
  });
  browser.stderr.on('data', chunk => { if (/pipe|ERROR|FATAL/.test(chunk.toString())) console.log(chunk.toString().trim().slice(0, 800)); });
  browser.on('exit', (code, signal) => { for (const item of pending.values()) { clearTimeout(item.timeout); item.reject(new Error(`Browser exited (${code}, ${signal})`)); } pending.clear(); });
  on('Fetch.requestPaused', async ({ params, sessionId }) => {
    const url = new URL(params.request.url);
    if (zoom200 && ['chrome:', 'chrome-untrusted:'].includes(url.protocol)) {
      await send('Fetch.continueRequest', { requestId: params.requestId }, sessionId); return;
    }
    const asset = url.origin === origin && (!demoMode || demoEntryAssets.has(url.pathname)) && assets.get(url.pathname);
    if (!asset) { blocked.add(url.origin); await send('Fetch.failRequest', { requestId: params.requestId, errorReason: 'BlockedByClient' }, sessionId); return; }
    servedAssets.add(url.pathname);
    const type = url.pathname.endsWith('.css') ? 'text/css' : url.pathname.endsWith('.js') ? 'text/javascript' : url.pathname === '/' ? 'text/html' : 'application/octet-stream';
    await send('Fetch.fulfillRequest', { requestId: params.requestId, responseCode: 200, responseHeaders: [{ name: 'Content-Type', value: type },
      { name: 'Content-Security-Policy', value: "default-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src data: blob:; connect-src 'none'; font-src 'none'; object-src 'none'; frame-src 'none'; form-action 'none'; base-uri 'none'" }], body: asset.toString('base64') }, sessionId);
  });
  on('Runtime.exceptionThrown', ({ params }) => { const error = params.exceptionDetails.exception?.description || params.exceptionDetails.text; exceptions.push(error); console.log(error); });
  // Page is still about:blank. Install deny-by-default interception before navigation.
  if (zoom200) {
    const settings = await send('Target.createTarget', { url: 'about:blank' });
    const { sessionId: settingsSession } = await send('Target.attachToTarget', { targetId: settings.targetId, flatten: true });
    await send('Fetch.enable', { patterns: [{ urlPattern: '*' }] }, settingsSession);
    await send('Page.navigate', { url: 'chrome://settings/' }, settingsSession);
    const deadline = Date.now() + 10000;
    let ready = false;
    do {
      const result = await send('Runtime.evaluate', { expression: 'typeof chrome.settingsPrivate?.setDefaultZoom === "function"', returnByValue: true }, settingsSession);
      ready = result.result.value;
      if (ready) break;
      await new Promise(resolve => setTimeout(resolve, 50));
    } while (Date.now() < deadline);
    assert.ok(ready, 'isolated Chromium settings exposes default browser zoom');
    await send('Runtime.evaluate', { expression: 'new Promise(resolve=>chrome.settingsPrivate.setDefaultZoom(2,resolve))', awaitPromise: true }, settingsSession);
    await send('Target.closeTarget', { targetId: settings.targetId });
  }
  const target = await send('Target.createTarget', { url: 'about:blank' });
  ({ sessionId: session } = await send('Target.attachToTarget', { targetId: target.targetId, flatten: true }));
  ({ windowId } = await send('Browser.getWindowForTarget', { targetId: target.targetId }));
  await send('Fetch.enable', { patterns: [{ urlPattern: '*' }] }, session);
  await send('Network.enable', {}, session);
  await send('Network.setBypassServiceWorker', { bypass: true }, session);
  await send('Browser.setDownloadBehavior', { behavior: 'deny' });
  await send('Runtime.enable', {}, session);
  await send('Page.enable', {}, session);
  console.log('Browser:', (await send('Browser.getVersion')).product);
  await send('Page.addScriptToEvaluateOnNewDocument', { source: `
    window.offlineManual=${manual};
    window.samples=[];
    const create=URL.createObjectURL.bind(URL);const blobs=new Map();
    URL.createObjectURL=blob=>{const url=create(blob);blobs.set(url,blob);return url};
    const click=HTMLAnchorElement.prototype.click;
    HTMLAnchorElement.prototype.click=function(){if(this.download){const blob=blobs.get(this.href);if(blob)blob.text().then(text=>window.samples.push({name:this.download,type:blob.type,text}));return;}return click.call(this)};
    navigator.sendBeacon=()=>false;window.open=()=>null;
    if (${demoMode || speciesMode}) {
      window.demoRequests=[];
      const denied=(kind,url)=>{window.demoRequests.push(kind+':'+url);throw new Error('Disconnected demo: '+kind+' disabled')};
      window.fetch=async url=>denied('fetch',url);
      XMLHttpRequest.prototype.open=function(method,url){denied('xhr',url)};
      window.WebSocket=class{constructor(url){denied('websocket',url)}};
      window.EventSource=class{constructor(url){denied('eventsource',url)}};
      navigator.sendBeacon=url=>{denied('beacon',url)};
    }
  ` }, session);
  await viewport(1280);
  await send('Page.navigate', { url: origin + '/' }, session);
  await until(`Boolean(window.fixture && document.querySelector('main'))`);
  if (zoom200) {
    const metrics = await evaluate(`({innerWidth,outerWidth,dpr:devicePixelRatio,scale:visualViewport.scale,root:getComputedStyle(document.documentElement).fontSize})`);
    console.log('Browser zoom evidence:', metrics);
    check('actual 200% browser zoom doubles DPR and halves layout width without pinch/CSS scaling', metrics.dpr === 2 && Math.abs(metrics.outerWidth / metrics.innerWidth - 2) < 0.03 && metrics.scale === 1 && metrics.root === '16px');
    zoomChrome = await evaluate(`({x:outerWidth-innerWidth*2,y:outerHeight-innerHeight*2})`);
  }
  check('external fetch is rejected by fixture network guards', await evaluate(`fetch('https://example.invalid/offline-canary').then(()=>false,()=>true)`));
  check('same-origin API is also rejected', await evaluate(`fetch('/api/offline-canary').then(()=>false,()=>true)`));
  if (manual) {
    await send('Emulation.clearDeviceMetricsOverride', {}, session);
    await send('Page.bringToFront', {}, session);
    const terminal = createInterface({ input: process.stdin, output: process.stdout });
    try { await terminal.question('Network-blocked manual fixture ready. Use its fixture controls. Press Enter here when finished: '); }
    finally { terminal.close(); }
  } else if (demoMode) {
    const { verifyDemoUI } = await import('./demo-checks.mjs');
    await verifyDemoUI({ evaluate, until, check, clickText, viewport, layout, key, send, session });
    check('demo never loads the separate live application chunk', [...servedAssets].every(name=>demoEntryAssets.has(name)) && ![...servedAssets].some(name=>name.includes('LiveApplication')));
    check('demo has no unexpected rejected resource requests', blocked.size===0 || (console.log([...blocked]),false));
    check('demo has no uncaught browser/driver exceptions', exceptions.length===0 || (console.log(exceptions),false));
    console.log(`${passedChecks} named disconnected demo checks passed. No authentication or backend integration claimed.`);
  } else if (speciesMode) {
    const { verifySpeciesUI } = await import('./species-checks.mjs');
    await verifySpeciesUI({ evaluate, until, check, clickText, viewport, layout, key, send, session });
    check('no uncaught species browser/driver exceptions', exceptions.length === 0 || (console.log(exceptions), false));
    console.log(`${passedChecks} named disconnected species-contract browser checks passed.`);
  } else if (registrationMode) {
    const { verifyRegistrationUI } = await import('./registration-checks.mjs');
    await verifyRegistrationUI({ evaluate, until, check, clickText, viewport, layout, key, send, session });
    check('no uncaught registration browser/driver exceptions', exceptions.length === 0 || (console.log(exceptions), false));
    console.log(`${passedChecks} named registration browser checks passed.`);
  } else {
  await layout('settings desktop');
  await key('Tab');
  check('skip link receives first keyboard focus and is visible', await evaluate(`document.activeElement.textContent.includes('Skip') && document.activeElement.getBoundingClientRect().top>=0`));
  await key('Enter');
  check('skip link focuses main content', await evaluate(`document.activeElement.id==='dashboard-content'`));
  await key('Tab');
  check('focused control has a visible outline', await evaluate(`getComputedStyle(document.activeElement).outlineStyle!=='none' && parseFloat(getComputedStyle(document.activeElement).outlineWidth)>=2`));
  for (const width of [390, 320]) { await viewport(width); await layout(`settings ${width}px`); }
  await evaluate(`fixture.changeFontScale(4); document.documentElement.style.fontSize='32px'`);
  await layout('settings 320px / 200% root text / largest preference');
  await evaluate(`document.documentElement.style.fontSize=''; fixture.changeFontScale(0)`);
  // Existing language dictionaries must populate the actual rendered controls.
  for (const language of ['en', 'tl', 'ceb', 'hil']) {
    await evaluate(`fixture.changeLanguage('${language}')`);
    await until(`document.querySelector('[lang="${language === 'tl' ? 'fil' : language}"]')!==null`);
    check(`${language}: settings controls have nonempty labels`, await evaluate(`Array.from(document.querySelectorAll('main select')).every(e=>e.labels.length && e.labels[0].textContent.trim() && Array.from(e.options).every(o=>o.text.trim()))`));
    await layout(`settings ${language} mobile`);
  }
  await evaluate(`fixture.changeLanguage('en')`);
  await clickText('a', 'Change home port');
  await until(`document.querySelector('h1')?.textContent==='Change your home port'`);
  check('edit begins with stored port, not default empty selection', await evaluate(`document.querySelector('[aria-label="Selected home port"]').textContent.includes('Mercedes Fish Port')`));
  await layout('home-port editing 320px');
  const normalPortText = await evaluate(`getComputedStyle(document.querySelector('label[for="port-search"]')).fontSize`);
  await evaluate(`document.documentElement.style.fontSize='32px'`);
  const largePortText = await evaluate(`getComputedStyle(document.querySelector('label[for="port-search"]')).fontSize`);
  check('home-port labels follow 200% root text', parseFloat(largePortText) >= parseFloat(normalPortText) * 1.9);
  await layout('home-port editing 200% root text');
  check('English home-port fallback has an explicit language', await evaluate(`document.querySelector('label[for="port-search"]').closest('[lang]').lang==='en'`));
  await evaluate(`document.documentElement.style.fontSize=''`);
  await clickText('button', 'Clear selection');
  check('clear selection restores search focus', await evaluate(`document.activeElement.id==='port-search'`));
  await send('Input.insertText', { text: 'Mercedes' }, session);
  await until(`document.querySelector('[data-port-result]')!==null`);
  await key('ArrowDown');
  check('ArrowDown focuses a listed port result', await evaluate(`document.activeElement.hasAttribute('data-port-result')`));
  await key('Escape');
  check('Escape from result restores search focus', await evaluate(`document.activeElement.id==='port-search'`));
  await key('ArrowDown');
  await key('Enter');
  await until(`Boolean(document.querySelector('[aria-label="Selected home port"]'))`);
  await evaluate(`fixture.setSaveFails(true)`);
  await until(`fixture.saveFails===true`);
  await clickText('button', 'Save home port');
  await until(`document.querySelector('[role="alert"]')?.textContent.includes('could not be saved')`);
  check('failed mocked save retains selected draft and enables retry', await evaluate(`document.querySelector('[aria-label="Selected home port"]').textContent.includes('Mercedes') && !(${byText('button', 'Save home port')}).disabled`));
  await evaluate(`fixture.setSaveFails(false)`);
  await until(`fixture.saveFails===false`);
  await clickText('button', 'Save home port');
  await until(`location.pathname==='/profile' && Boolean(document.querySelector('#profile-heading'))`);
  check('mocked home-port save returns to profile route', true);
  await viewport(390);
  await evaluate(`document.querySelector('button[aria-expanded="false"]').focus()`);
  await key('Enter');
  await until(`Boolean(document.querySelector('dialog[open]'))`);
  for (let i=0;i<15;i++) { await key('Tab'); if(!await containedFocus()) console.log(await evaluate(`({active:document.activeElement.outerHTML.slice(0,200),focus:document.hasFocus()})`)); assert.ok(await containedFocus(), 'navigation drawer contains page focus (browser chrome may receive focus)'); }
  await evaluate(`document.querySelector('main a').focus()`);
  check('navigation modal makes background page controls inert', await containedFocus());
  await key('Escape');
  await until(`!document.querySelector('dialog[open]')`);
  check('navigation Escape restores trigger focus', await evaluate(`document.activeElement.getAttribute('aria-expanded')==='false'`));
  await evaluate(`fixture.route('/dashboard')`);
  await until(`Boolean(document.querySelector('[role="status"]')?.textContent.includes('Map tiles') || document.body.textContent.includes('Map tiles could not load'))`);
  check('blocked map tiles expose list fallback and retry', await evaluate(`document.body.textContent.includes('Map tiles could not load') && Boolean(${byText('button', 'Try again')})`));
  await layout('dashboard map 390px');
  await evaluate(`document.querySelector('details summary').focus()`); await key('Enter');
  await until(`document.querySelector('details').open`); await key('Tab');
  check('map habitat filter is keyboard reachable and labelled', await evaluate(`document.activeElement.tagName==='SELECT' && document.activeElement.closest('label').textContent.includes('Habitat')`));
  await key('ArrowDown');
  check('pelagic filter remains keyboard selectable', await evaluate(`document.activeElement.value==='pelagic'`));
  await key('ArrowDown');
  check('demersal filter remains keyboard selectable', await evaluate(`document.activeElement.value==='demersal'`));
  await key('Home'); await key('Escape');
  check('filter Escape restores summary focus and preserves both habitats', await evaluate(`document.activeElement.tagName==='SUMMARY' && !document.querySelector('details').open && document.querySelector('details select').value==='both'`));
  await clickText('button', 'Areas');
  await until(`document.body.textContent.includes('No fishing areas available here yet')`);
  check('empty predictions remain empty with no fabricated targets', await evaluate(`document.querySelector('#fishing-areas ol')?.children.length===0`));
  await evaluate(`fixture.setFailed(true)`);
  await until(`document.body.textContent.includes('We could not load fishing areas.')`);
  await clickText('button', 'Try again');
  await until(`document.body.textContent.includes('No fishing areas available here yet')`);
  await layout('dashboard empty list mobile');
  await viewport(320);
  await layout('dashboard empty list 320px');
  await clickText('button', 'Map');
  await until(`Boolean(document.querySelector('[data-view="map"]'))`);
  await layout('dashboard map 320px');
  await evaluate(`document.documentElement.style.fontSize='32px'`);
  await layout('dashboard map 320px / 200% root text');
  await evaluate(`document.documentElement.style.fontSize=''`);
  await viewport(800);
  await clickText('button', 'Areas');
  await until(`Boolean(document.querySelector('dialog[open]'))`);
  await key('Escape');
  await until(`!document.querySelector('dialog[open]')`);
  check('tablet areas drawer closes on Escape', true);
  await evaluate(`fixture.setScreen('sample')`);
  await until(`Boolean(${byText('button', 'Open sample export')})`);
  await evaluate(`(${byText('button', 'Open sample export')}).focus()`); await key('Enter');
  await until(`Boolean(document.querySelector('dialog[open]'))`);
  const tree = await send('Accessibility.getFullAXTree', {}, session);
  check('export accessibility tree has named modal dialog', tree.nodes.some(node => node.role?.value==='dialog' && node.name?.value==='Sample file export' && node.properties.some(property=>property.name==='modal' && property.value.value)));
  for (let i=0;i<24;i++) { await key('Tab',i<12?0:8); assert.ok(await containedFocus(), 'export modal contains forward/reverse page focus'); }
  await evaluate(`(${byText('button', 'Open sample export')}).focus()`);
  check('export modal prevents background trigger receiving focus', await containedFocus());
  await evaluate(`document.querySelector('dialog[open] button').focus()`); await key('Tab');
  check('modal keyboard focus has visible outline', await evaluate(`parseFloat(getComputedStyle(document.activeElement).outlineWidth)>=2`));
  for (const width of [1280, 390, 320]) { await viewport(width, 640); await layout(`sample modal ${width}px`); }
  await evaluate(`document.documentElement.style.fontSize='32px'`);
  await layout('sample modal 320px / 200% root text');
  check('modal scroll allows reaching final action', await evaluate(`const d=document.querySelector('dialog[open]');d.scrollTop=d.scrollHeight;d.scrollTop>0 && d.getBoundingClientRect().bottom<=innerHeight`));
  await evaluate(`document.documentElement.style.fontSize=''`);
  for (const [label, extension, mime] of [['.GPX','GPX','application/gpx+xml'],['.KML','KML','application/vnd.google-earth.kml+xml'],['.GeoJSON','GEOJSON','application/geo+json']]) {
    await clickText('button', label + (extension==='GPX'?'Sample waypoints':extension==='KML'?'Sample placemark':'Sample feature'));
    await clickText('button', `Download .${extension} sample`);
    await until(`window.samples.length===${extension==='GPX'?1:extension==='KML'?2:3}`);
    check(`${label} export is explicitly demo with correct MIME`, await evaluate(`samples.at(-1).type===${JSON.stringify(mime)} && samples.at(-1).name.includes('DEMO') && samples.at(-1).text.includes('DEMO ONLY')`));
    check(`${label} export has parseable sample structure`, await evaluate(extension==='GEOJSON' ? `JSON.parse(samples.at(-1).text).features.length===1` : `!new DOMParser().parseFromString(samples.at(-1).text,'application/xml').querySelector('parsererror')`));
  }
  await clickText('button', 'Download .GEOJSON sample');
  await key('Escape');
  await until(`!document.querySelector('dialog[open]')`);
  check('export Escape restores exact trigger and body scroll', await evaluate(`document.activeElement.textContent==='Open sample export' && document.body.style.overflow===''`));
  // This wait tests the actual 600ms export timer, rather than page readiness.
  await evaluate(`new Promise(resolve=>setTimeout(resolve,800))`);
  check('closing a pending sample export cancels file creation', await evaluate(`samples.length===3`));
  await clickText('button', 'Open sample export');
  await until(`Boolean(document.querySelector('dialog[open]'))`);
  check('reopening after cancellation enables a fresh sample export', await evaluate(`!(${byText('button', 'Download .GEOJSON sample')}).disabled`));
  await evaluate(`document.querySelector('dialog[open] button[aria-label="Close modal"]').focus()`); await key('Enter');
  await until(`!document.querySelector('dialog[open]')`);
  for (const type of ['info','success','error']) {
    await evaluate(`fixture.showToast('${type}')`);
    await until(`Boolean(document.querySelector('[role="${type==='error'?'alert':'status'}"]'))`);
    const ax = await send('Accessibility.getFullAXTree', {}, session);
    check(`${type} toast exposes appropriate live semantics`, ax.nodes.some(node=>node.role?.value===(type==='error'?'alert':'status') && node.properties?.some(p=>p.name==='live' && p.value.value===(type==='error'?'assertive':'polite'))));
    await layout(`${type} toast mobile`);
    await evaluate(`document.querySelector('button[aria-label="Close"]').focus()`); await key('Enter');
    await until(`!document.querySelector('[role="${type==='error'?'alert':'status'}"]')`);
  }
  await viewport(640, 450);
  await evaluate(`fixture.route('/settings')`);
  await until(`Boolean(document.querySelector('#profile-heading'))`);
  await layout(zoom200 ? 'settings actual 200% browser zoom / 640x450 CSS viewport' : 'settings 640x450 reflow');
  console.log('Human visual review, screen-reader speech and physical touch-device checks remain pending.');
  check('no uncaught browser/driver exceptions', exceptions.length === 0 || (console.log(exceptions), false));
  console.log(`${passedChecks} named browser checks passed, plus 39 forward/reverse Tab containment assertions.`);
  }
} finally {
  if (browser) {
    if (browser.exitCode === null) await send('Browser.close').catch(() => {});
    if (browser.exitCode === null) await new Promise(resolve => { const timer = setTimeout(() => { browser.kill(); resolve(); }, 5000); browser.once('exit', () => { clearTimeout(timer); resolve(); }); });
  }
  // Delete only the exact task-created, verified temporary profile.
  if (profile && path.dirname(profile) === tmpdir() && path.basename(profile).startsWith('parola-ui02-offline-'))
    await rm(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
  console.log('Temporary browser profile removed; no screenshots/downloads/recordings written.');
}
