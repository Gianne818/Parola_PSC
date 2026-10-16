// Disconnected real-component interactions. No successful transport mocks.
export async function verifyPreferencesUI({ evaluate, until, check, clickText, viewport, layout, key, send, session }) {
  const has = async (name, expression) => check(name, await evaluate(expression));
  const input = async (id, value) => evaluate(`(()=>{const e=document.getElementById(${JSON.stringify(id)});Object.getOwnPropertyDescriptor(e instanceof HTMLSelectElement?HTMLSelectElement.prototype:HTMLInputElement.prototype,'value').set.call(e,${JSON.stringify(value)});e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));})()`);
  const day = number => evaluate(`document.getElementById('preference-day-${number}').click()`);
  const save = () => clickText('button', 'Simulate saving preferences');
  const savedText = `document.querySelector('dl')?.innerText`;
  const noNetwork = name => has(name, `demoRequests.length===2 && demoRequests.every(r=>r.includes('offline-canary')) && localStorage.length===0 && sessionStorage.length===0 && document.cookie===''`);

  await until(`document.querySelector('h1')?.textContent==='Advisory preferences demo'`);
  await has('preferences identify synthetic data, memory-only saves and page-refresh loss', `document.body.innerText.includes('DISCONNECTED FRONTEND DEMO') && document.body.innerText.includes('Synthetic account') && document.body.innerText.includes('Refreshing, leaving or closing') && !document.querySelector('dl')`);
  await has('initial contract defaults pause routine preferences, without enrollment or invented schedule', `document.querySelector('#preference-day-count').textContent.includes('0 of 5') && document.querySelector('#preference-time').value==='05:00:00' && document.querySelector('#preference-habitat').value==='both' && document.querySelector('#preference-language').value==='en' && document.body.innerText.includes('Next routine time unavailable')`);
  await has('critical alerts are explicitly independent and no protected/external links exist', `document.body.innerText.includes('Critical alerts are independent of selected weekdays') && document.querySelectorAll('a,iframe').length===0`);
  await noNetwork('initial preference editor makes no application transport attempts or storage writes');
  await layout('preferences desktop');
  await key('Tab');
  await has('first Tab reaches Monday with a visible keyboard outline', `document.activeElement.id==='preference-day-1' && parseFloat(getComputedStyle(document.activeElement).outlineWidth)>=2`);
  await send('Input.dispatchKeyEvent', { type: 'keyDown', key: ' ', code: 'Space', windowsVirtualKeyCode: 32, text: ' ' }, session);
  await send('Input.dispatchKeyEvent', { type: 'keyUp', key: ' ', code: 'Space', windowsVirtualKeyCode: 32 }, session);
  await has('Space toggles the weekday using native keyboard interaction', `document.querySelector('#preference-day-1').checked`);
  for (let number = 2; number <= 5; number++) { await key('Tab'); await has(`Tab reaches weekday ${number}`, `document.activeElement.id==='preference-day-${number}'`); await day(number); }
  await day(6);
  await has('sixth day is rejected with an associated alert and five retained choices', `document.querySelector('#preference-day-count').textContent.includes('5 of 5') && !document.querySelector('#preference-day-6').checked && document.querySelector('#preference-day-6').getAttribute('aria-describedby')==='preference-error' && document.querySelector('[role=alert]').textContent.includes('sixth day was not added')`);
  const errorNodes = (await send('Accessibility.getFullAXTree', {}, session)).nodes;
  check('weekday rejection exposes an assertive accessibility-tree alert', errorNodes.some(node => node.role?.value === 'alert' && node.properties?.some(p => p.name === 'live' && p.value.value === 'assertive')));
  await input('preference-time', ''); await save();
  await has('missing time focuses the labelled input and cannot simulate a save', `document.activeElement.id==='preference-time' && document.activeElement.getAttribute('aria-invalid')==='true' && !document.querySelector('dl') && document.querySelector('[role=alert]').textContent.includes('Enter a Manila time')`);
  await input('preference-time', '23:59:59'); await input('preference-language', 'ceb'); await input('preference-habitat', 'demersal');
  await has('regional preference has explicit English fallback and English language metadata', `document.querySelector('#preference-language-help').textContent.includes('English fallback') && document.querySelector('main').lang==='en'`);
  await evaluate(`document.querySelector('#preference-fail').click()`); await save();
  await has('simulated failure retains all draft choices and produces no saved snapshot', `document.querySelector('#preference-time').value==='23:59:59' && document.querySelector('#preference-language').value==='ceb' && document.querySelector('#preference-habitat').value==='demersal' && !document.querySelector('dl') && !document.querySelector('#preference-fail').checked && document.querySelector('[role=alert]').textContent.includes('Simulated save failure')`);
  await save();
  await has('retry creates only the memory snapshot, retains seconds, and focuses its result', `${savedText}.includes('Monday, Tuesday, Wednesday, Thursday, Friday') && ${savedText}.includes('23:59:59') && ${savedText}.includes('Cebuano') && ${savedText}.includes('demersal') && document.activeElement.id==='preference-result' && document.body.innerText.includes('No real preferences were persisted')`);
  const saveNodes = (await send('Accessibility.getFullAXTree', {}, session)).nodes;
  const byId = new Map(saveNodes.map(node => [node.nodeId, node]));
  const contains = node => node.name?.value?.includes('Simulated save complete in memory only') || node.childIds?.some(id => byId.has(id) && contains(byId.get(id)));
  check('simulated save has polite live semantics and memory-only wording', saveNodes.some(node => node.role?.value === 'status' && node.properties?.some(p => p.name === 'live' && p.value.value === 'polite') && contains(node)));
  await input('preference-habitat', 'pelagic'); await input('preference-time', '00:00');
  await has('draft edits leave the previous simulated saved values separate', `${savedText}.includes('demersal') && ${savedText}.includes('23:59:59') && document.body.innerText.includes('Unsaved sample edits')`);
  await clickText('button', 'Reload sample / discard draft');
  await has('reload sample discards draft and restores memory snapshot without a server read', `document.querySelector('#preference-habitat').value==='demersal' && document.querySelector('#preference-time').value==='23:59:59' && document.body.innerText.includes('no server was read')`);
  await input('preference-habitat', 'pelagic'); await input('preference-time', '00:00');
  await evaluate(`document.querySelector('#preference-fail').click()`); await save();
  await has('failed edit preserves the previous saved snapshot separately from the retained draft', `${savedText}.includes('demersal') && ${savedText}.includes('23:59:59') && document.querySelector('#preference-habitat').value==='pelagic' && document.querySelector('#preference-time').value==='00:00' && document.querySelector('[role=alert]').textContent.includes('unchanged')`);
  await save();
  await has('pelagic and midnight normalize correctly in simulated saves', `${savedText}.includes('pelagic') && ${savedText}.includes('00:00:00')`);
  await viewport(320); await layout('preferences 320px');
  await viewport(667, 375); await layout('preferences mobile landscape');
  await viewport(320);
  const point = await evaluate(`(()=>{const e=document.querySelector('label[for="preference-habitat"]');const control=document.querySelector('#preference-habitat');const label=document.querySelector('#preference-day-7').closest('label');label.scrollIntoView({block:'center'});const r=label.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2,height:r.height,controlHeight:control.getBoundingClientRect().height,labelled:e.textContent}})()`);
  await day(1); // Make room for a sixth distinct candidate by removing Monday.
  await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 1 }, session);
  await send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: point.x, y: point.y, id: 1 }] }, session);
  await send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }, session);
  await has('weekday label responds to touch with at least 44px targets', `document.querySelector('#preference-day-7').checked && ${point.height}>=44 && ${point.controlHeight}>=44 && matchMedia('(pointer:coarse)').matches`);
  await clickText('button', 'Clear weekdays (pause sample)'); await input('preference-habitat', 'both'); await save();
  await has('zero-day simulated save pauses routine sample and preserves both habitats', `${savedText}.includes('routine advisories paused') && ${savedText}.includes('both') && document.body.innerText.includes('Pausing routine advisories does not pause critical alerts')`);
  await evaluate(`document.querySelector('#preference-day-1').focus()`);
  await key('Tab', 8); await key('Tab');
  await has('reverse and forward Tab return to weekday without a trap', `document.activeElement.id==='preference-day-1'`);
  const focusOrder = [];
  for (let step = 0; step < 30; step++) {
    await key('Tab');
    const focused = await evaluate(`({id:document.activeElement.id,text:document.activeElement.textContent?.trim(),type:document.activeElement.type})`);
    focusOrder.push(focused.id || focused.text);
    if (focused.text === 'Reset demo and discard all') break;
  }
  check('keyboard reaches every remaining weekday, native time, selects, failure control and actions', ['preference-day-2', 'preference-day-3', 'preference-day-4', 'preference-day-5', 'preference-day-6', 'preference-day-7', 'Clear weekdays (pause sample)', 'preference-time', 'preference-language', 'preference-habitat', 'preference-fail', 'Simulate saving preferences', 'Reload sample / discard draft', 'Reset demo and discard all'].every(name => focusOrder.includes(name)));
  await evaluate(`document.querySelector('button[type=submit]').focus()`); await key('Enter');
  await has('Enter on simulate-save submits and moves focus to its result', `document.activeElement.id==='preference-result' && document.body.innerText.includes('Simulated save complete in memory only')`);
  for (const language of ['en', 'tl', 'ceb', 'hil']) {
    await input('preference-language', language); await save();
    await has(`language ${language} survives simulated save with honest fallback labels`, `document.querySelector('#preference-language').value==='${language}' && ${savedText}.includes('translations unreviewed') && document.querySelector('#preference-language-help').textContent.includes('${language === 'en' ? 'English sample wording' : 'English fallback'}')`);
  }
  await evaluate(`document.documentElement.style.fontSize='32px'`); await layout('preferences 320px double root text');
  await evaluate(`document.documentElement.style.fontSize=''`);
  await viewport(640, 450); await layout('preferences 640px reflow');
  await noNetwork('all preference edits, saves, errors, pause and reload make zero application requests');
  await clickText('button', 'Reset demo and discard all');
  await has('reset discards saved sample and restores published defaults honestly', `!document.querySelector('dl') && document.querySelector('#preference-time').value==='05:00:00' && document.querySelector('#preference-language').value==='en' && document.body.innerText.includes('All sample edits and simulated saves were discarded')`);
  await day(7); await save();
  // The old document still has this heading briefly after location.reload().
  // Wait for a new document and mounted controls, not the outgoing heading.
  await evaluate(`window.preferenceBeforeReload=true; location.reload()`);
  await until(`!window.preferenceBeforeReload && document.querySelector('#preference-day-count') && document.querySelector('h1')?.textContent==='Advisory preferences demo'`);
  await has('actual page reload loses all simulated saves and restores paused synthetic defaults', `!document.querySelector('dl') && document.querySelector('#preference-day-count').textContent.includes('0 of 5') && document.querySelector('#preference-time').value==='05:00:00' && demoRequests.length===0 && localStorage.length===0 && sessionStorage.length===0 && document.cookie===''`);
}
