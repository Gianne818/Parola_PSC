// Network-denied Chromium checks using installed tools and a disposable browser profile.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtemp, rm, mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { buildWorkspaceAssets, workspaceCsp } from './workspace-preview.mjs';
import { runWorkspaceChecks } from './workspace-checks.mjs';

const assets = await buildWorkspaceAssets();
const origin = 'http://127.0.0.1:4177';
const profile = await mkdtemp(path.join(tmpdir(), 'parola-workspace-'));
const nativeZoom = process.argv.includes('--native-zoom');
const screenshots = process.argv.find(arg => arg.startsWith('--screenshots='))?.slice(14);
const browser = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', ['--headless=new', '--remote-debugging-pipe', `--user-data-dir=${profile}`,
  '--no-first-run', '--no-default-browser-check', '--disable-background-networking', '--disable-component-update', '--disable-sync', '--disable-extensions',
  '--disable-default-apps', '--proxy-server=http://127.0.0.1:9', '--proxy-bypass-list=<-loopback>', '--host-resolver-rules=MAP * ~NOTFOUND', 'about:blank'],
{ stdio: ['ignore', 'ignore', 'pipe', 'pipe', 'pipe'], windowsHide: true });
let sequence = 0, session, passed = 0, closed = false;
const pending = new Map(), handlers = new Map(), failures = [];
function send(method, params = {}, sessionId = session) {
  return new Promise((resolve, reject) => {
    if (closed) { reject(new Error('Browser exited')); return; }
    const id = ++sequence;
    const timeout = setTimeout(() => { pending.delete(id); reject(new Error(`Timed out: ${method}`)); }, 15000);
    pending.set(id, { resolve, reject, timeout });
    browser.stdio[3].write(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }) + '\0');
  });
}
let buffer = '';
browser.stdio[4].on('data', chunk => {
  buffer += chunk.toString(); let boundary;
  while ((boundary = buffer.indexOf('\0')) >= 0) {
    const message = JSON.parse(buffer.slice(0, boundary)); buffer = buffer.slice(boundary + 1);
    if (message.id) {
      const item = pending.get(message.id);
      if (item) { clearTimeout(item.timeout); pending.delete(message.id); message.error ? item.reject(new Error(JSON.stringify(message.error))) : item.resolve(message.result); }
    } else if (handlers.has(message.method)) Promise.resolve(handlers.get(message.method)(message)).catch(error => failures.push(error.message));
  }
});
browser.on('error', error => failures.push(error.message));
const exited = new Promise(resolve => browser.on('exit', () => {
  closed = true;
  for (const item of pending.values()) { clearTimeout(item.timeout); item.reject(new Error('Browser exited')); }
  pending.clear(); resolve();
}));
async function evaluate(expression) {
  const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
  return result.result.value;
}
async function until(expression) {
  const deadline = Date.now() + 10000;
  do { if (await evaluate(expression)) return; await new Promise(resolve => setTimeout(resolve, 40)); } while (Date.now() < deadline);
  console.log(await evaluate('document.body.innerText.slice(-5000)'));
  throw new Error(`UI condition timed out: ${expression}`);
}
function check(name, condition) { assert.ok(condition, name); passed++; console.log(`PASS ${name}`); }
async function key(key, modifiers = 0) {
  const codes = { Tab: 9, Enter: 13, Escape: 27, ArrowLeft: 37, ArrowRight: 39 };
  await send('Input.dispatchKeyEvent', { type: 'keyDown', key, code: key, modifiers, windowsVirtualKeyCode: codes[key], ...(key === 'Enter' ? { text: '\r', unmodifiedText: '\r' } : {}) });
  await send('Input.dispatchKeyEvent', { type: 'keyUp', key, code: key, modifiers, windowsVirtualKeyCode: codes[key] });
}
async function viewport(width) { await send('Emulation.setDeviceMetricsOverride', { width, height: 900, deviceScaleFactor: 1, mobile: false }); }
async function capture(name) {
  if (!screenshots) return;
  await mkdir(screenshots, { recursive: true });
  if (!name.includes('settings')) await evaluate('window.scrollTo(0,0)');
  await evaluate('new Promise(resolve=>{document.activeElement?.blur();requestAnimationFrame(()=>requestAnimationFrame(resolve));})');
  await evaluate('new Promise(resolve=>setTimeout(resolve,220))');
  const metrics = await send('Page.getLayoutMetrics');
  const image = await send('Page.captureScreenshot', name.includes('settings') ? { format: 'png', captureBeyondViewport: false } : { format: 'png', captureBeyondViewport: true, clip: { ...metrics.contentSize, scale: 1 } });
  await writeFile(path.join(screenshots, name + '.png'), Buffer.from(image.data, 'base64'));
  await writeFile(path.join(screenshots, name + '.metrics.json'), JSON.stringify({ ...metrics, browser: await evaluate('({width:innerWidth,ratio:devicePixelRatio})') }, null, 2));
}
async function navigate() { await send('Page.navigate', { url: origin + '/' }); await until('Boolean(window.workspaceFixture && document.querySelector("main"))'); }
handlers.set('Fetch.requestPaused', async ({ params, sessionId }) => {
  const url = new URL(params.request.url), asset = url.origin === origin && (assets.get(url.pathname) || (!url.pathname.includes('.') ? assets.get('/') : null));
  if (!asset) { await send('Fetch.failRequest', { requestId: params.requestId, errorReason: 'BlockedByClient' }, sessionId); return; }
  await send('Fetch.fulfillRequest', { requestId: params.requestId, responseCode: 200, responseHeaders: [
    { name: 'Content-Type', value: url.pathname.endsWith('.js') ? 'text/javascript' : url.pathname.endsWith('.css') ? 'text/css' : url.pathname.endsWith('.jpeg') ? 'image/jpeg' : 'text/html' },
    { name: 'Content-Security-Policy', value: workspaceCsp }], body: asset.toString('base64') }, sessionId);
});
handlers.set('Runtime.exceptionThrown', ({ params }) => failures.push(params.exceptionDetails.exception?.description || params.exceptionDetails.text));
try {
  const target = (await send('Target.getTargets', {}, undefined)).targetInfos.find(item => item.type === 'page');
  session = (await send('Target.attachToTarget', { targetId: target.targetId, flatten: true }, undefined)).sessionId;
  await send('Fetch.enable', { patterns: [{ urlPattern: '*' }] });
  await send('Browser.setDownloadBehavior', { behavior: 'deny' });
  await send('Runtime.enable'); await send('Page.enable');
  console.log('Browser:', (await send('Browser.getVersion')).product);
  await viewport(1280); await navigate();
  check('external requests blocked', await evaluate(`fetch('https://example.invalid/canary').then(()=>false,()=>true)`));
  check('unknown same-origin APIs blocked', await evaluate(`fetch('/api/canary').then(()=>false,()=>true)`));
  if (nativeZoom) {
    await send('Emulation.clearDeviceMetricsOverride');
    const { windowId } = await send('Browser.getWindowForTarget');
    await send('Browser.setWindowBounds', { windowId, bounds: { width: 1280, height: 900, windowState: 'normal' } });
    await until('innerWidth>=1200');
    const original = await evaluate('({ratio:devicePixelRatio,width:innerWidth})');
    await send('Fetch.disable'); await send('Page.navigate', { url: 'chrome://settings/appearance' });
    await until('Boolean(window.chrome?.settingsPrivate?.setDefaultZoom)');
    check('native Chrome zoom set to 200%', await evaluate(`new Promise(resolve=>chrome.settingsPrivate.setDefaultZoom(2,()=>resolve(!chrome.runtime.lastError)))`));
    await send('Fetch.enable', { patterns: [{ urlPattern: '*' }] }); await navigate();
    await until(`devicePixelRatio>=${original.ratio * 1.95} && innerWidth<${original.width * .55}`);
    check('200% native zoom confirmed by DPR and CSS viewport', true);
  }
  await runWorkspaceChecks({ evaluate, until, check, key, viewport, capture, send, nativeZoom, navigate });
  check('no uncaught browser exceptions', failures.length === 0 || (console.log(failures), false));
  console.log(`${passed} workspace browser checks passed; synthetic data only${nativeZoom ? '; native 200% zoom' : ''}.`);
} finally {
  if (!closed) { try { await send('Browser.close'); } catch { browser.kill(); } }
  await exited;
  const resolved = path.resolve(profile);
  if (!resolved.startsWith(path.resolve(tmpdir()) + path.sep) || !path.basename(resolved).startsWith('parola-workspace-')) throw new Error('Unexpected temporary profile path');
  await rm(resolved, { recursive: true, force: true });
}
