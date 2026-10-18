export async function runHotspotReadabilityChecks({ evaluate, until, check, clickText, viewport, layout, key, capture, send, navigate, hasBefore, nativeZoom }) {
  const separator = `document.querySelector('[role="separator"][aria-label="Nearby areas inspector width"]')`;
  const width = () => evaluate(`Number(${separator}.getAttribute('aria-valuenow'))`);
  const mapReady = `(()=>{const map=readability.maps.at(-1);return map && map.getSize().x===map.getContainer().clientWidth && map.getSize().x>0})()`;
  const selectArea = async number => {
    await evaluate(`Array.from(document.querySelectorAll('.leaflet-marker-icon[title]')).find(e=>e.title.split(' · ')[0]==='Zone ${number}').click()`);
    await until(`document.querySelector('#inspector-title')?.textContent==='Zone ${number}'`);
  };
  const state = async (advisory, expected = advisory) => {
    await evaluate(`(()=>{const field=document.querySelector('[aria-label="Advisory fixture"]');field.value='${advisory}';field.dispatchEvent(new Event('change',{bubbles:true}));})()`);
    await evaluate(`document.querySelector('button[aria-label="Refresh advisory"]').click()`);
    await until(`document.querySelector('#advisory-title')?.textContent===${JSON.stringify(expected === 'clear' ? 'No Parola hold detected' : expected === 'hold' ? 'Parola hold active' : 'Advisory incomplete')}`);
  };
  const drag = async delta => {
    const start = await evaluate(`(()=>{const r=${separator}.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()`);
    await send('Input.dispatchMouseEvent', { type: 'mousePressed', ...start, button: 'left', buttons: 1, clickCount: 1 });
    await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: start.x + delta, y: start.y, button: 'left', buttons: 1 });
    await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: start.x + delta, y: start.y, button: 'left', buttons: 0, clickCount: 1 });
  };
  await until(`document.querySelectorAll('.leaflet-marker-icon[title^="Zone"]').length===12`);

  if (hasBefore && !nativeZoom) {
    await navigate('before');
    await until(`document.querySelectorAll('.leaflet-marker-icon[title^="Zone"]').length===12`);
    await selectArea(2);
    check('baseline supplied estimate visible with incomplete advisory', await evaluate(`document.querySelector('#advisory-title').textContent==='Advisory incomplete' && document.querySelector('aside[aria-labelledby="inspector-title"]').textContent.includes('70%')`));
    await capture('before-desktop');
    await viewport(390); await clickText('button', 'Areas'); await capture('before-mobile-390');
    await viewport(1280); await navigate('after');
    await until(`Boolean(${separator})`);
  }
  await until(mapReady);
  if (nativeZoom) {
    // Change Chrome's native default zoom in this disposable profile through its own settings UI API.
    // CDP device metrics, pinch zoom and enlarged root text are not native browser zoom.
    await send('Emulation.clearDeviceMetricsOverride', {});
    const { windowId } = await send('Browser.getWindowForTarget', {});
    await send('Browser.setWindowBounds', { windowId, bounds: { width: 1280, height: 900, windowState: 'normal' } });
    await send('Page.bringToFront', {});
    const original = await evaluate(`({ratio:devicePixelRatio,width:innerWidth})`);
    await send('Fetch.disable', {});
    await send('Page.navigate', { url: 'chrome://settings/appearance' });
    await until(`Boolean(window.chrome?.settingsPrivate?.setDefaultZoom)`);
    const result = await evaluate(`new Promise(resolve=>chrome.settingsPrivate.setDefaultZoom(2,()=>resolve(chrome.runtime.lastError?.message || 'ok')))`);
    check('Chrome native default zoom set to 200% in the isolated profile', result === 'ok');
    await send('Fetch.enable', { patterns: [{ urlPattern: '*' }] });
    await navigate('after');
    await until(`devicePixelRatio>=${original.ratio * 1.95}`);
    const zoomed = await evaluate(`({ratio:devicePixelRatio,width:innerWidth})`);
    check('actual browser zoom is 200% with reduced CSS viewport', Math.abs(zoomed.ratio / original.ratio - 2) < .02 && zoomed.width < original.width * .55);
    await layout('native 200% zoom');
    await clickText('button', 'Areas');
    await until(`document.querySelector('#fishing-areas')?.getClientRects().length>0`);
    await layout('native 200% zoom areas');
    await capture('after-native-200-areas');
    await clickText('button', 'Map');
    await until(mapReady);
    check('Leaflet resizes at native 200% zoom', true);
    check('native 200% zoom retains a usable map canvas', await evaluate(`document.querySelector('.leaflet-container').clientHeight>=240`));
    await evaluate(`document.querySelector('.leaflet-container').scrollIntoView({block:'center'});document.activeElement?.blur()`);
    await capture('after-native-200-map');
    return;
  }
  await until(`Number(${separator}.getAttribute('aria-valuenow'))===380`);
  check('desktop inspector defaults to 380px', await width() === 380);
  await layout('readability desktop');
  await evaluate(`${separator}.focus()`);
  await key('ArrowLeft'); await until(`Number(${separator}.getAttribute('aria-valuenow'))===396`);
  check('keyboard expands inspector and exposes live pixel values', await width() === 396 && await evaluate(`${separator}.getAttribute('aria-valuetext')==='396 pixels' && ${separator}.getAttribute('aria-orientation')==='vertical'`));
  check('separator has a visible keyboard focus outline', await evaluate(`getComputedStyle(${separator}).outlineStyle==='solid' && parseFloat(getComputedStyle(${separator}).outlineWidth)>=3`));
  const ax = await send('Accessibility.getFullAXTree', {});
  check('accessibility tree exposes separator name and current width', ax.nodes.some(node => ['splitter', 'separator'].includes(node.role?.value) && node.name?.value === 'Nearby areas inspector width' && Number(node.value?.value) === 396));
  await key('ArrowRight', 8); await until(`Number(${separator}.getAttribute('aria-valuenow'))===348`);
  check('Shift arrow uses larger resize step', await width() === 348);
  await key('End');
  await until(`Number(${separator}.getAttribute('aria-valuenow'))===Number(${separator}.getAttribute('aria-valuemax'))`);
  check('maximum bounds preserve at least 320px of map', await evaluate(`document.querySelector('.leaflet-container').clientWidth>=318 && Number(${separator}.getAttribute('aria-valuenow'))<=560`));
  await key('Home'); await until(`Number(${separator}.getAttribute('aria-valuenow'))===300`);
  check('Home selects minimum inspector width', await width() === 300);
  await clickText('button', 'Reset width'); await until(`Number(${separator}.getAttribute('aria-valuenow'))===380`);
  const resizeEvents = await evaluate(`readability.resizeEvents`);
  await drag(-80); await until(`Number(${separator}.getAttribute('aria-valuenow'))===460`);
  await until(mapReady);
  check('real pointer drag resizes the inspector and Leaflet', await width() === 460 && await evaluate(`readability.resizeEvents>${resizeEvents}`));
  await drag(-1000); await until(`Number(${separator}.getAttribute('aria-valuenow'))===Number(${separator}.getAttribute('aria-valuemax'))`);
  check('pointer capture clamps drags beyond the viewport', await width() <= 560);
  await drag(1000); await until(`Number(${separator}.getAttribute('aria-valuenow'))===300`);
  check('pointer resizing clamps at the minimum', await width() === 300);
  await clickText('button', 'Reset width'); await until(`Number(${separator}.getAttribute('aria-valuenow'))===380`);
  await drag(-48); await until(`Number(${separator}.getAttribute('aria-valuenow'))===428`);
  await selectArea(2); await selectArea(3);
  check('selected-area changes retain inspector width', await width() === 428);
  await clickText('button', 'Weather details');
  await until(`document.querySelector('#inspector-title').textContent==='Weather details'`);
  check('weather inspector retains width and TIER-03 evidence', await width() === 428 && await evaluate(`document.body.textContent.includes('Current regional check unavailable')`));
  await clickText('button', 'Back to nearby areas');
  await selectArea(2);

  const markerColors = await evaluate(`[1,2,3,4,5,6].map(number=>getComputedStyle(document.querySelector('[title^="Zone '+number+' ·"]').firstElementChild).backgroundColor)`);
  const saturation = rgb => { const numbers = rgb.match(/[\d.]+/g).slice(0, 3).map(Number).map(n => n / 255); const max = Math.max(...numbers), min = Math.min(...numbers); return (max - min) / (1 - Math.abs(max + min - 1)); };
  check('rendered pelagic saturation increases with estimates', saturation(markerColors[0]) < saturation(markerColors[1]) && saturation(markerColors[1]) < saturation(markerColors[2]));
  check('rendered demersal saturation increases with estimates', saturation(markerColors[3]) < saturation(markerColors[4]) && saturation(markerColors[4]) < saturation(markerColors[5]));
  check('P/D text labels and compact labelled key are visible', await evaluate(`document.querySelector('[aria-label="Habitat and estimate saturation key"]')?.getClientRects().length>0 && document.querySelectorAll('.dashboard-hotspot-marker span')[0].textContent==='P' && document.querySelectorAll('.dashboard-hotspot-marker span')[3].textContent==='D'`));
  check('mixed and unknown markers have explicit neutral labels', await evaluate(`document.querySelector('[title^="Zone 7 ·"]').textContent==='M' && document.querySelector('[title^="Zone 8 ·"]').textContent==='?' && getComputedStyle(document.querySelector('[title^="Zone 7 ·"]').firstElementChild).backgroundColor!==getComputedStyle(document.querySelector('[title^="Zone 8 ·"]').firstElementChild).backgroundColor`));
  for (const number of [9, 10, 11, 12]) {
    await selectArea(number);
    check(`missing/invalid/producer-omitted estimate ${number} has no percentage or score fill`, await evaluate(`(()=>{const marker=document.querySelector('[title^="Zone ${number} ·"]');const panel=document.querySelector('#nearby-areas-inspector');return marker.title.endsWith('Estimate unavailable') && getComputedStyle(marker.firstElementChild).borderStyle==='dashed' && !panel.textContent.includes('%') && panel.textContent.includes('Unavailable')})()`));
  }
  await selectArea(2);
  for (const advisory of ['clear', 'incomplete', 'hold']) {
    await state(advisory);
    check(`${advisory}: supplied estimate remains visible independently of advisory`, await evaluate(`document.querySelector('#nearby-areas-inspector').textContent.includes('70%') && document.querySelector('[title^="Zone 2 ·"]').title.includes('70% unverified model estimate')`));
    if (advisory === 'hold') check('TIER-03 hold reason and reference notice stay prominent', await evaluate(`document.querySelector('[role="status"]').textContent.includes('Synthetic coastal warning') && document.querySelector('#nearby-areas-inspector').textContent.includes('A hold is active')`));
  }
  check('selection ring stays distinct from habitat fills', await evaluate(`getComputedStyle(document.querySelector('[title^="Zone 2 ·"]').firstElementChild).boxShadow.includes('18, 33, 30')`));
  await evaluate(`document.querySelector('[title^="Zone 3 ·"]').focus()`);
  await key('Enter');
  await until(`document.querySelector('#inspector-title').textContent==='Zone 3' && document.activeElement.id==='inspector-title'`);
  check('keyboard marker activation opens its details and focuses the inspector title', await evaluate(`document.activeElement.id==='inspector-title' && document.querySelector('#nearby-areas-inspector').textContent.includes('90%')`));
  await selectArea(2);
  await capture('after-desktop-hold');
  await state('incomplete', 'hold');
  check('known TIER-03 warning survives a subsequent incomplete refresh', await evaluate(`document.body.textContent.includes('Synthetic coastal warning') && document.querySelector('#nearby-areas-inspector').textContent.includes('70%')`));
  await state('clear');
  await state('incomplete');
  // Fresh navigation makes before/after screenshots use identical initial weather, not retained readings.
  await navigate('after');
  await selectArea(2);
  await clickText('button', 'Reset width');
  await capture('after-desktop');
  await viewport(960); await until(mapReady);
  check('narrow desktop clamps width while preserving map', await evaluate(`Number(${separator}.getAttribute('aria-valuenow'))<=380 && document.querySelector('.leaflet-container').clientWidth>=318`));
  await layout('readability 960px desktop');
  await viewport(800);
  await until(`!${separator}`);
  await clickText('button', 'Areas'); await until(`Boolean(document.querySelector('dialog[open]'))`);
  await layout('readability tablet drawer'); await capture('after-tablet');
  await key('Escape'); await until(`!document.querySelector('dialog[open]')`);
  check('tablet drawer closes with Escape', true);
  for (const mobile of [390, 320]) {
    await viewport(mobile); await clickText('button', 'Areas');
    await layout(`readability ${mobile}px areas`); await capture(`after-mobile-${mobile}-areas`);
    await clickText('button', 'Map'); await until(mapReady);
    check(`${mobile}px map retains at least 240px canvas height`, await evaluate(`document.querySelector('.leaflet-container').clientHeight>=240`));
    await evaluate(`document.querySelector('.leaflet-container').scrollIntoView({block:'center'})`);
    await until(`(()=>{const r=document.querySelector('.leaflet-container').getBoundingClientRect();return r.top>=0 && r.bottom<=innerHeight})()`);
    await layout(`readability ${mobile}px map`); await capture(`after-mobile-${mobile}-map`);
    check(`${mobile}px mobile has no desktop resize controls`, await evaluate(`!${separator} && !Array.from(document.querySelectorAll('button')).some(e=>e.textContent==='Reset width')`));
  }
  await viewport(1280); await until(mapReady);
  check('desktop width survives tablet/mobile switches', await width() === 380);
  check('preview interactions sent no SMS requests', await evaluate(`readability.smsAttempts===0`));
}
