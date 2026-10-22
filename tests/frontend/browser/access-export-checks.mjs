export async function runAccessExportChecks({ evaluate, until, check, key, viewport, capture, send, nativeZoom }) {
  const access = `document.querySelector('section[aria-label="Geographic access status"]')`;
  const exportDetails = `Array.from(document.querySelectorAll('details')).find(e=>e.querySelector('summary')?.textContent==='Current prediction export')`;
  const button = `${exportDetails}.querySelector('button')`;
  const result = `${exportDetails}.querySelector('[aria-live]')`;
  const toggleWithSpace = async () => {
    await send('Input.dispatchKeyEvent', { type: 'keyDown', key: ' ', code: 'Space', windowsVirtualKeyCode: 32, text: ' ' });
    await send('Input.dispatchKeyEvent', { type: 'keyUp', key: ' ', code: 'Space', windowsVirtualKeyCode: 32 });
  };
  const choose = async (label, mode) => {
    await evaluate(`(()=>{const field=Array.from(document.querySelectorAll('label')).find(e=>e.textContent.startsWith(${JSON.stringify(label)})).querySelector('select');field.value=${JSON.stringify(mode)};field.dispatchEvent(new Event('change',{bubbles:true}));})()`);
  };
  const clickText = async text => { await evaluate(`Array.from(document.querySelectorAll('button')).find(e=>e.textContent===${JSON.stringify(text)} && e.getClientRects().length).click()`); };
  const areas = async () => {
    if (await evaluate(`innerWidth<960`)) {
      await until(`Array.from(document.querySelectorAll('button')).some(e=>e.textContent==='Areas'&&e.getClientRects().length)`);
      await clickText('Areas');
    }
    await until(`${access}?.getClientRects().length>0`);
  };
  const open = async () => {
    if (!await evaluate(`${exportDetails}.open`)) { await evaluate(`${exportDetails}.querySelector('summary').focus()`); await key('Enter'); }
    await until(`${exportDetails}.open`);
    await evaluate(`${button}.scrollIntoView({block:'center'})`);
  };
  const status = async (mode, expected) => {
    await choose('Coverage fixture', mode); await clickText('Refresh areas');
    await until(`${access}.textContent.includes(${JSON.stringify(expected)})`);
    check(`coverage ${mode} explained accurately`, await evaluate(`${access}.textContent.includes('not navigation clearance or legal fishing permission')`));
  };
  const layout = async name => {
    check(`${name}: no horizontal page overflow`, await evaluate('document.documentElement.scrollWidth<=innerWidth+1'));
    check(`${name}: readable, contained export controls`, await evaluate(`(()=>{const el=${button};const r=el.getBoundingClientRect();return r.width>0&&r.height>=44&&r.right<=innerWidth+1&&r.left>=-1&&parseFloat(getComputedStyle(el).fontSize)>=14})()`));
  };
  await until(`document.querySelectorAll('.leaflet-marker-icon[title^="Zone"]').length===2`);
  await areas();
  check('demo is explicitly not evaluated', await evaluate(`${access}.textContent.includes('Geographic access not evaluated')`));
  check('areas precede supporting prediction coverage and export', await evaluate(`Boolean(document.querySelector('#fishing-areas').compareDocumentPosition(${exportDetails})&Node.DOCUMENT_POSITION_FOLLOWING)&&Boolean(document.querySelector('#fishing-areas').compareDocumentPosition(Array.from(document.querySelectorAll('summary')).find(e=>e.textContent==='Prediction coverage and selection'))&Node.DOCUMENT_POSITION_FOLLOWING)`));
  const geographicDetails = `${access}.querySelector('details')`;
  check('coverage details start collapsed while the essential caution stays visible', await evaluate(`!${geographicDetails}.open&&${access}.innerText.includes('not navigation clearance or legal fishing permission')&&!${access}.innerText.includes('verified geographic access or restriction coverage')`));
  await evaluate(`${geographicDetails}.querySelector('summary').focus()`); await key('Enter');
  check('Enter opens geographic details with visible focus', await evaluate(`${geographicDetails}.open&&parseFloat(getComputedStyle(document.activeElement).outlineWidth)>=3&&${access}.innerText.includes('verified geographic access or restriction coverage')`));
  await toggleWithSpace();
  check('Space closes geographic details without moving focus', await evaluate(`!${geographicDetails}.open&&document.activeElement===${geographicDetails}.querySelector('summary')`));
  await open();
  await evaluate(`${exportDetails}.querySelector('summary').focus()`);
  check('keyboard focus is visible', await evaluate(`parseFloat(getComputedStyle(document.activeElement).outlineWidth)>=3`));
  await key('Tab');
  check('Tab reaches the download control', await evaluate(`document.activeElement===${button}`));
  const ax = await send('Accessibility.getFullAXTree');
  check('download control has an accessible name', ax.nodes.some(node => node.role?.value === 'button' && node.name?.value === 'Download GeoJSON'));
  await key('Enter');
  await until(`accessFixture.downloads.length===1 && ${result}.textContent.includes('Download requested')`);
  check('demo filename and raw non-operational metadata retained', await evaluate(`(()=>{const f=accessFixture.downloads[0],d=JSON.parse(f.text);return f.filename==='parola-demo-predictions-unverified.geojson'&&d.export_mode==='demo_preview'&&d.operational_eligible===false&&d.provenance==='legacy_unverified'&&d.synthetic_fixture_only===true})()`));
  check('GeoJSON keeps longitude/latitude and both model habitats', await evaluate(`(()=>{const d=JSON.parse(accessFixture.downloads[0].text);return d.features[0].geometry.coordinates[0]===123.08&&d.features[0].geometry.coordinates[1]===14.08&&d.features.map(f=>f.properties.model_type).join(',')==='pelagic,demersal'})()`));
  check('browser handoff does not claim confirmed disk storage', await evaluate(`${result}.textContent.includes('saving to disk cannot be confirmed')`));
  check('demo, unverified and non-operational labels stay visible with metadata collapsed', await evaluate(`${result}.innerText.includes('Demo preview · access not evaluated')&&${result}.innerText.includes('Unverified · operational_eligible=false')&&!${exportDetails}.querySelector('[aria-label="Returned export metadata"]').closest('details').open`));
  const returnedDetails = `${exportDetails}.querySelector('[aria-label="Returned export metadata"]').closest('details')`;
  await evaluate(`${returnedDetails}.querySelector('summary').focus()`); await key('Enter');
  check('returned metadata is keyboard accessible and retains raw provenance', await evaluate(`${returnedDetails}.open&&${returnedDetails}.innerText.includes('legacy_unverified / unverified')&&${returnedDetails}.innerText.includes('false · not operational guidance')`));
  await toggleWithSpace();
  check('returned metadata closes with Space', await evaluate(`!${returnedDetails}.open`));
  const queryDetails = `${exportDetails}.querySelector('details:last-child')`;
  await evaluate(`${queryDetails}.querySelector('summary').focus()`); await key('Enter');
  check('query details expose the unchanged coordinates, limit and sample separation', await evaluate(`${queryDetails}.innerText.includes('14.0122, 123.0114')&&${queryDetails}.innerText.includes('1,000')&&${queryDetails}.innerText.includes('GPX and KML are sample formats only')`));
  await toggleWithSpace();
  check('sample export and horizon controls remain separate', await evaluate(`${exportDetails}.textContent.includes('fixed example coordinates')&&${exportDetails}.textContent.includes('score threshold and returned-date display filter do not apply')&&!${exportDetails}.querySelector('select')`));
  if (nativeZoom) { await layout('native 200%'); await capture('access-export-native-200'); }
  else {
    await layout('desktop 1280'); await capture('access-export-desktop');
    for (const width of [960, 768, 390, 320]) {
      await viewport(width); await areas(); await open(); await layout(`${width}px`); await capture(`access-export-${width}`);
      await evaluate(`${exportDetails}.open=false;${access}.closest('aside').querySelector('[class*="panelScroll"]').scrollTop=0`);
      await capture(`access-export-${width}-overview`); await open();
      if (width === 768) await key('Escape');
    }
    await viewport(1280); await areas(); await open();
  }
  await evaluate(`${exportDetails}.open=false;${access}.closest('aside').querySelector('[class*="panelScroll"]').scrollTop=0`);
  await capture(nativeZoom ? 'access-export-native-overview' : 'access-export-overview');
  await open();
  await status('filtered', 'Selection geographically filtered');
  check('denied candidate counts do not label markers as permitted', await evaluate(`${access}.textContent.includes('2 candidates denied')&&${access}.textContent.includes('not individual point decisions')&&!document.body.innerText.includes('Access granted')`));
  await choose('Coverage fixture', 'delayed'); await clickText('Refresh areas');
  await until(`${access}.textContent.includes('Checking geographic coverage')`);
  check('refresh does not present retained filtered coverage as current', await evaluate(`!${access}.textContent.includes('Selection geographically filtered')&&!${access}.textContent.includes('2 candidates denied')`));
  await evaluate('accessFixture.resolveNearest()'); await until(`${access}.textContent.includes('Selection geographically filtered')`);
  await status('partial', 'Partial geographic coverage');
  await status('unavailable', 'latest request failed');
  await status('malformed', 'Geographic coverage unavailable');
  await status('empty', 'Selection geographically filtered');
  check('empty selection is not presented as unrestricted', await evaluate(`${access}.textContent.includes('does not establish unrestricted access')`));
  await status('authentication', 'latest request failed');
  await status('denied', 'latest request failed');
  await status('demo', 'Geographic access not evaluated');
  await open();
  for (const [mode, expected] of [
    ['authentication', 'Sign in again'], ['denied', 'server denied'], ['partial', 'complete geographic coverage is unavailable'],
    ['unavailable', 'complete geographic coverage is unavailable'], ['failure', 'Check your connection'], ['malformed', 'could not be verified'], ['download_failure', 'could not be started'],
  ]) {
    await choose('Export fixture', mode);
    const before = await evaluate('accessFixture.downloads.length');
    await evaluate(`${button}.click()`); await until(`${result}.textContent.includes(${JSON.stringify(expected)})`);
    check(`${mode}: no file and a retry action`, await evaluate(`accessFixture.downloads.length===${before}&&${button}.textContent==='Retry GeoJSON export'&&!${exportDetails}.querySelector('[aria-label="Returned export metadata"]')`));
  }
  await capture(nativeZoom ? 'access-export-native-error' : 'access-export-error');
  await choose('Export fixture', 'empty'); await evaluate(`${button}.click()`);
  await until(`${result}.textContent.includes('No stored predictions matched')`);
  check('valid empty response starts no download', await evaluate(`accessFixture.downloads.length===1&&${exportDetails}.textContent.includes('No file was downloaded')`));
  await choose('Export fixture', 'filtered'); await evaluate(`${button}.focus()`); await key('Enter');
  await until(`accessFixture.downloads.length===2 && ${result}.textContent.includes('Download requested')`);
  check('explicit retry uses a fresh server request and succeeds', await evaluate(`accessFixture.downloads[1].filename==='parola-predictions-unverified.geojson'&&JSON.parse(accessFixture.downloads[1].text).export_mode==='geographically_filtered'`));
  check('query uses current stored data and supported parameters only', await evaluate(`(()=>{const q=new URL('http://fixture'+accessFixture.requests.filter(p=>p.startsWith('/api/advisories/export')).at(-1));return q.searchParams.get('lat')==='14.0122'&&q.searchParams.get('lon')==='123.0114'&&q.searchParams.get('habitat')==='both'&&q.searchParams.get('limit')==='1000'&&!q.searchParams.has('prediction_date')&&!q.searchParams.has('min_threshold')&&!q.searchParams.has('user_id')})()`));
  await choose('Export fixture', 'delayed'); const calls = await evaluate('accessFixture.exportCalls');
  await evaluate(`${button}.click();${button}.click()`); await until(`accessFixture.exportCalls===${calls + 1}`);
  check('duplicate pending actions make one request', await evaluate(`${button}.disabled&&${result}.textContent.includes('No download has started')`));
  await evaluate('accessFixture.resolveExport()'); await until('accessFixture.downloads.length===3');
  await choose('Export fixture', 'delayed'); await evaluate(`${button}.click()`);
  await until(`${button}.disabled`);
  await evaluate('switchFixtureAccount()');
  await until('accessFixture.aborted>=1');
  await evaluate('accessFixture.resolveExport()');
  await open();
  check('account changes abort pending work and clear prior success', await evaluate(`accessFixture.downloads.length===3&&${result}.textContent.trim()===''`));
  if (!nativeZoom) {
    await choose('Export fixture', 'delayed'); await evaluate(`${button}.click()`); await until(`${button}.disabled`);
    await evaluate(`Array.from(document.querySelectorAll('summary')).find(e=>e.textContent==='Filter fish').click()`);
    await evaluate(`(()=>{const field=Array.from(document.querySelectorAll('label')).find(e=>e.textContent.startsWith('Habitat')).querySelector('select');field.value='pelagic';field.dispatchEvent(new Event('change',{bubbles:true}));})()`);
    await until('accessFixture.aborted>=2'); await evaluate('accessFixture.resolveExport()');
    await evaluate(`Array.from(document.querySelectorAll('summary')).find(e=>e.textContent==='Filter fish').closest('details').open=false`); await open();
    check('habitat changes cancel obsolete downloads and clear success', await evaluate(`accessFixture.downloads.length===3&&${result}.textContent.trim()===''`));
    await choose('Export fixture', 'filtered'); await evaluate(`${button}.click()`); await until('accessFixture.downloads.length===4');
    check('new export sends the selected habitat without changing model values', await evaluate(`(()=>{const f=JSON.parse(accessFixture.downloads[3].text);return f.features.length===1&&f.features[0].properties.model_type==='pelagic'&&f.features[0].properties.model_score===.7})()`));
    const separator = `document.querySelector('[role="separator"][aria-label="Nearby areas inspector width"]')`;
    const original = await evaluate(`Number(${separator}.getAttribute('aria-valuenow'))`);
    await evaluate(`${separator}.focus()`); await key('ArrowLeft');
    check('existing inspector keyboard resizing preserved', await evaluate(`Number(${separator}.getAttribute('aria-valuenow'))===${original + 16}`));
  }
  const drift = `document.querySelector('[class*="driftCard"]')`;
  for (const [mode, speed, strength] of [['optimal', '0.36 m/s (0.7 kts)', 'Optimal Feeding Flow'], ['strong', '0.85 m/s (1.7 kts)', 'Strong Current'], ['slack', '0.08 m/s (0.2 kts)', 'Slack Current'], ['missing'], ['invalid']]) {
    await choose('Current fixture', mode); await clickText('Refresh areas');
    await until(`${access}.getAttribute('aria-busy')==='false'`);
    await evaluate(`document.querySelector('#fishing-areas ol button').click()`);
    await until(`Boolean(document.querySelector('[class*="areaDetails"]'))`);
    if (speed) {
      check(`${mode}: drift uses outline icons without emoji or nested decorative boxes`, await evaluate(`!/[🌊🎯🧭]/u.test(${drift}.textContent)&&${drift}.querySelectorAll('svg').length===3&&getComputedStyle(${drift}).boxShadow==='none'&&Array.from(${drift}.querySelectorAll('[class*="driftTacticalBox"]')).every(e=>getComputedStyle(e).borderTopWidth==='0px')`));
      check(`${mode}: current values, classification and direction preserved`, await evaluate(`${drift}.textContent.includes(${JSON.stringify(speed)})&&${drift}.textContent.includes(${JSON.stringify(strength)})&&${drift}.textContent.includes('56° NE')&&${drift}.textContent.includes('SW Boundary')&&${drift}.textContent.includes('Drift NE across the zone')`));
      if (mode === 'optimal') {
        await until(`document.querySelectorAll('.hotspot-upstream-badge-marker svg, .hotspot-downstream-badge-marker svg').length===2`);
        check('map feeding-edge and drift callouts use decorative outline icons without emoji', await evaluate(`Array.from(document.querySelectorAll('.hotspot-upstream-badge-marker, .hotspot-downstream-badge-marker')).every(e=>!/[🎯🧭]/u.test(e.textContent)&&e.querySelector('svg[aria-hidden="true"][focusable="false"][stroke="currentColor"][fill="none"]'))`));
        check('map callout text and direction remain unchanged', await evaluate(`document.querySelector('.hotspot-upstream-badge-marker').textContent.includes('Feeding Edge')&&document.querySelector('.hotspot-downstream-badge-marker').textContent.includes('56° ENE')`));
        await evaluate(`${drift}.scrollIntoView({block:'center'})`);
        await capture(nativeZoom ? 'drift-native-200' : 'drift-desktop');
        if (!nativeZoom) {
          for (const width of [960, 768, 390, 320]) {
            await viewport(width); await areas(); await evaluate(`${drift}.scrollIntoView({block:'center'})`);
            check(`${width}px: drift contained in the inspector`, await evaluate(`(()=>{const r=${drift}.getBoundingClientRect();return r.width>0&&r.left>=0&&r.right<=innerWidth+1&&document.documentElement.scrollWidth<=innerWidth+1})()`));
            await capture(`drift-${width}`);
            if (width === 768) await key('Escape');
          }
          await viewport(1280); await areas();
        }
      }
    } else check(`${mode}: current advisory remains absent`, await evaluate(`!${drift}`));
    await evaluate(`document.querySelector('[class*="backButton"]').click()`);
    await until(`Boolean(document.querySelector('#fishing-areas ol button'))`);
  }
}
