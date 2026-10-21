export async function runReportingChecks({ evaluate, until, check, key, viewport, capture, send, nativeZoom }) {
  const form = `document.querySelector('form')`;
  const input = name => `${form}.querySelector('[name="${name}"]')`;
  const submit = `${form}.querySelector('button[type="submit"]')`;
  const text = `(document.querySelector('main')?.innerText ?? '')`;
  const click = async expression => { await evaluate(`(${expression}).click()`); };
  const button = label => `Array.from(document.querySelectorAll('main button')).find(e=>e.textContent.trim()===${JSON.stringify(label)})`;
  const scenario = async name => {
    await evaluate(`catchFixture.scenario(${JSON.stringify(name)})`);
    await until(name === 'loading' ? `${text}.includes('Loading report history')` : name === 'unavailable' ? `${text}.includes('History is unavailable')` : name === 'history-error' ? `${text}.includes('History could not be loaded')` : `!${text}.includes('Loading report history') && ${text}.includes('Sample account')`);
  };
  const fill = async (name, value) => {
    await evaluate(`(()=>{const e=${input(name)};Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(e,${JSON.stringify(value)});e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));})()`);
    await until(`${input(name)}.value===${JSON.stringify(value)}`);
  };
  const trip = async (weight = '2.5') => {
    for (const [name, value] of Object.entries({ date: '2026-10-20', area: 'Approximate sample bay', species: 'Sample sardine', weight, effort: '3' })) await fill(name, value);
  };
  const confirmed = () => until(`${text}.includes('saved and confirmed by the reporting service')`);
  const failed = () => until(`Boolean(${form}.querySelector('[role="alert"]'))`);
  async function layout(name) {
    check(`${name}: no horizontal document overflow`, await evaluate('document.documentElement.scrollWidth<=innerWidth+1'));
    check(`${name}: visible controls stay within viewport`, await evaluate(`Array.from(document.querySelectorAll('main input,main button,main select')).filter(e=>e.getClientRects().length).every(e=>{const r=e.getBoundingClientRect();return r.left>=-1&&r.right<=innerWidth+1&&r.width>=40})`));
    check(`${name}: form inputs retain labels`, await evaluate(`Array.from(${form}.querySelectorAll('input')).every(e=>e.labels.length>0&&e.labels[0].textContent.trim().length>0)`));
  }

  await scenario('unavailable');
  check('normal unavailable boundary disables saving and does not claim empty history', await evaluate(`${submit}.disabled && !${text}.includes('No reports yet') && ${input('weight')}.disabled && ${input('effort')}.disabled`));
  check('unavailable assistance offers no arbitrary fisher selector', await evaluate(`!document.querySelector('main select') && catchFixture.requests().length===0`));
  check('reporting is explicitly optional for advisories', await evaluate(`${text}.includes('does not affect access to advisories')`));
  await fill('area', 'Draft with approximate area');
  await click(button('Reload history'));
  check('unavailable retry retains the open draft', await evaluate(`${input('area')}.value==='Draft with approximate area'`));
  await scenario('loading');
  check('loading is distinct from empty and cannot submit', await evaluate(`${submit}.disabled && !${text}.includes('No reports yet')`));
  await scenario('ready');
  check('pending, flagged and reviewed outcomes remain distinct', await evaluate(`['Pending review','Flagged','Reviewed'].every(s=>${text}.includes(s))`));
  check('reviewed state does not confer scientific eligibility', await evaluate(`${text}.includes('does not establish eligibility')`));
  check('denied record correction stays disabled', await evaluate(`document.querySelector('[aria-label="Correct report reviewed-1"]').disabled`));
  check('only explicitly permitted fisher subjects are listed', await evaluate(`Array.from(document.querySelector('main select').options).map(o=>o.value).join(',')==='owner,permitted'`));

  await scenario('empty');
  check('confirmed empty history is shown separately', await evaluate(`${text}.includes('No reports yet')`));
  await click(submit); await failed();
  check('validation summary receives focus and exposes linked errors', await evaluate(`document.activeElement===${form}.querySelector('[role="alert"]') && ${form}.querySelectorAll('input[aria-invalid="true"]').length>=4`));
  await trip(); await fill('weight', '-2'); await fill('effort', 'NaN'); await click(submit); await failed();
  check('negative and invalid values never reach submit', await evaluate(`catchFixture.requests().length===0 && ${form}.querySelectorAll('input[aria-invalid="true"]').length===2`));
  await fill('effort', '3'); await click(button('Record zero catch'));
  check('explicit zero catch retains weight zero and no species', await evaluate(`${input('weight')}.value==='0' && ${input('species')}.value===''`));
  check('GPS is never requested automatically', await evaluate('gpsCalls===0'));
  await evaluate(`document.querySelector('main details').open=true`);
  await click(button('Use current GPS'));
  await until(`${text}.includes('GPS permission was denied')`);
  check('denied GPS leaves the report usable without coordinates', await evaluate(`${input('latitude')}.value==='' && ${input('longitude')}.value==='' && !${submit}.disabled`));
  await evaluate(`gpsMode='success'`); await click(button('Use current GPS'));
  await until(`${input('latitude')}.value==='10.3'`);
  check('requested GPS shows current-location caveat', await evaluate(`${input('longitude')}.value==='123.9' && ${text}.includes('may differ from the trip location')`));
  await click(button('Remove GPS'));
  check('GPS can be removed without clearing approximate area', await evaluate(`${input('latitude')}.value==='' && ${input('longitude')}.value==='' && ${input('area')}.value==='Approximate sample bay'`));
  await fill('latitude', '10'); await click(submit); await failed();
  check('partial optional GPS is rejected', await evaluate(`${input('longitude')}.getAttribute('aria-invalid')==='true' && catchFixture.requests().length===0`));
  await click(button('Remove GPS'));

  await evaluate(`catchFixture.nextSave('failure');catchFixture.delay(500)`);
  await evaluate(`${form}.requestSubmit();${form}.requestSubmit()`);
  await until('catchFixture.requests().length===1');
  check('duplicate submit is blocked while saving', await evaluate(`${submit}.disabled && ${form}.querySelector('fieldset').disabled && catchFixture.requests().length===1`));
  await failed();
  check('failed save retains zero-catch draft without saved claim', await evaluate(`${input('weight')}.value==='0' && ${input('area')}.value==='Approximate sample bay' && !${text}.includes('saved and confirmed')`));
  await capture('failed-save-draft');
  await click(submit); await confirmed();
  check('manual retry reuses submission identity and preserves no-GPS zero catch', await evaluate(`(()=>{const r=catchFixture.requests();return r.length===2&&r[0].requestId===r[1].requestId&&r[1].trip.weight===0&&r[1].trip.gps===null&&catchFixture.records().length===1})()`));
  await evaluate(`${form}.requestSubmit()`);
  check('confirmed unchanged draft cannot be submitted again', await evaluate('catchFixture.requests().length===2'));
  await fill('effort', '4');
  check('editing clears stale saved claim', await evaluate(`!${text}.includes('saved and confirmed') && !${submit}.disabled`));
  await click(submit); await confirmed();
  check('edited draft gets a new submission identity', await evaluate('catchFixture.requests()[2].requestId!==catchFixture.requests()[1].requestId'));

  await scenario('empty'); await trip('0'); await evaluate(`catchFixture.nextSave('uncertain')`); await click(submit); await failed();
  await click(submit); await confirmed();
  check('lost acknowledgement retry resolves to a single record in duplicate-safe fixture', await evaluate('catchFixture.requests().length===2&&catchFixture.requests()[0].requestId===catchFixture.requests()[1].requestId&&catchFixture.records().length===1'));
  await scenario('empty'); await trip(); await evaluate(`catchFixture.nextSave('malformed')`); await click(submit); await failed();
  check('malformed success cannot claim a save or lose the draft', await evaluate(`${input('weight')}.value==='2.5' && !${text}.includes('saved and confirmed')`));

  await scenario('ready'); await trip(); await evaluate('catchFixture.failHistory(true)'); await click(button('Reload history'));
  await until(`${text}.includes('History could not be loaded')`);
  check('history failure retains draft and removes action authority', await evaluate(`${input('area')}.value==='Approximate sample bay' && ${submit}.disabled && !${text}.includes('No reports yet')`));
  await evaluate('catchFixture.failHistory(false)'); await click(button('Reload history'));
  await until(`!${text}.includes('Loading report history') && !${submit}.disabled`);
  check('history retry restores confirmed access without replacing the draft', await evaluate(`${input('weight')}.value==='2.5'`));

  await scenario('denied-assistance');
  check('denied assistance hides subject selection and other-fisher history', await evaluate(`!document.querySelector('main select') && !${text}.includes('Sample permitted fisher')`));
  await scenario('ready');
  await evaluate(`(()=>{const e=document.querySelector('main select');e.value='permitted';e.dispatchEvent(new Event('change',{bubbles:true}));})()`);
  await until(`${text}.includes('You are acting for the selected fisher')`);
  await trip(); await click(submit); await confirmed();
  check('assisted submission keeps actor and permitted fisher distinct', await evaluate(`catchFixture.requests()[0].actorId==='owner' && catchFixture.requests()[0].fisherId==='permitted'`));
  await scenario('ready'); await click(`document.querySelector('[aria-label="Correct report flagged-1"]')`);
  await until(`${form}.getAttribute('aria-label')==='Correct trip report'`);
  check('correction focuses its heading and retains reported zero catch', await evaluate(`document.activeElement.textContent==='Correct a report' && ${input('weight')}.value==='0'`));
  await click(submit); await failed();
  check('correction requires a reason', await evaluate(`${input('correctionReason')}.getAttribute('aria-invalid')==='true' && catchFixture.requests().length===0`));
  await fill('correctionReason', 'Corrected effort after checking with fisher'); await fill('effort', '4');
  await evaluate(`catchFixture.nextSave('denied')`); await click(submit); await failed();
  check('revoked correction retains reason and never claims success', await evaluate(`${input('correctionReason')}.value.includes('checking with fisher') && !${text}.includes('saved and confirmed')`));
  await click(submit); await confirmed();
  check('allowed correction carries original ID/revision and stays pending after acknowledgement', await evaluate(`(()=>{const r=catchFixture.requests();return r[1].correction.reportId==='flagged-1'&&r[1].correction.revision==='1'&&r[0].requestId===r[1].requestId&&catchFixture.records().find(r=>r.id==='flagged-1').state==='pending'})()`));
  await scenario('denied-create');
  check('create denial does not invent a create permission', await evaluate(`${submit}.disabled`));
  await click(`document.querySelector('[aria-label="Correct report pending-1"]')`);
  check('explicit correction permission remains independent of create denial', await evaluate(`!${submit}.disabled`));
  await click(button('Back to new report'));
  await until(`document.activeElement.textContent==='Record your trip'`);
  check('leaving correction restores focus to new-report heading', await evaluate(`${form}.getAttribute('aria-label')==='Trip report' && ${submit}.disabled`));
  await scenario('missing-units');
  check('missing units prevent submission even with explicit create permission', await evaluate(`${input('weight')}.disabled && ${submit}.disabled`));

  await scenario('empty'); await trip();
  await evaluate(`${input('date')}.focus()`);
  // Native date controls may expose separate month/day/year segments to Tab.
  for (let segment = 0; segment < 5; segment++) { await key('Tab'); if (await evaluate(`document.activeElement===${input('area')}`)) break; }
  check('keyboard traverses native date segments to approximate area', await evaluate(`document.activeElement===${input('area')}`));
  check('keyboard focus has a visible outline', await evaluate(`parseFloat(getComputedStyle(document.activeElement).outlineWidth)>=3`));
  const ax = await send('Accessibility.getFullAXTree');
  check('accessibility tree exposes named trip form and submission action', ax.nodes.some(node => node.role?.value === 'form' && node.name?.value === 'Trip report') && ax.nodes.some(node => node.role?.value === 'button' && node.name?.value === 'Submit trip report'));
  if (nativeZoom) {
    await layout('native 200% zoom');
    await click(submit); await confirmed();
    check('form completes at native 200% zoom', await evaluate('catchFixture.requests().length===1'));
    await capture('native-200-reporting');
  } else {
    await scenario('ready');
    for (const width of [1280, 960, 768, 390, 320]) {
      await viewport(width); await layout(`${width}px`); await capture(`reporting-${width}`);
    }
    await viewport(390); await click(`document.querySelector('[aria-label="Correct report flagged-1"]')`);
    await capture('correction-390');
  }

  await scenario('shell');
  await until(`document.querySelector('header h1')?.textContent==='Reports'`);
  check('actual Reports page uses the same application shell with one page heading', await evaluate(`document.querySelectorAll('h1').length===1 && document.querySelector('#dashboard-content h2').textContent==='Catch reporting'`));
  check('actual page retains unavailable persistence and never uses fixture records', await evaluate(`${text}.includes('History is unavailable') && ${submit}.disabled && catchFixture.requests().length===0`));
  const reportLink = `document.querySelector('aside nav a[href="/reports"]')`;
  check('Reports joins existing primary navigation without removing destinations', await evaluate(`Array.from(document.querySelector('aside nav').querySelectorAll('a')).map(e=>e.getAttribute('href')).join(',')==='/dashboard,/alerts,/notifications,/reports,/settings'`));
  check('Reports reuses the existing row and outline icon design', await evaluate(`${reportLink}.className===document.querySelector('aside nav a[href="/settings"]').className && ${reportLink}.querySelector('svg').getAttribute('width')==='20'`));
  const shellWidths = nativeZoom ? [null] : [1280, 768, 390, 320];
  for (const width of shellWidths) {
    if (width) await viewport(width);
    await layout(`${width ?? 'native zoom'}px application shell`);
    const mobile = await evaluate('innerWidth<768');
    if (mobile) {
      const trigger = `document.querySelector('header button[aria-expanded]')`;
      await evaluate(`${trigger}.focus()`); await key('Enter');
      await until(`Boolean(document.querySelector('dialog[open]'))`);
      const drawerLink = `document.querySelector('dialog[open] nav a[href="/reports"]')`;
      check(`${width ?? 'native zoom'}: Reports is active and named in mobile navigation`, await evaluate(`${drawerLink}.getAttribute('aria-current')==='page' && ${drawerLink}.getAttribute('aria-label')==='Reports'`));
      await evaluate(`document.querySelector('dialog[open] nav a[href="/notifications"]').focus()`); await key('Tab');
      check(`${width ?? 'native zoom'}: Reports is reachable by keyboard in the existing drawer`, await evaluate(`document.activeElement===${drawerLink}`));
      await capture(`reports-navigation-${width ?? 'native-200'}`);
      await key('Enter'); await until(`!document.querySelector('dialog[open]')`);
      check(`${width ?? 'native zoom'}: choosing Reports closes drawer and restores trigger focus`, await evaluate(`document.activeElement===${trigger}`));
    } else {
      check(`${width}: Reports is active in desktop/tablet sidebar`, await evaluate(`${reportLink}.getAttribute('aria-current')==='page' && ${reportLink}.getClientRects().length>0 && ${reportLink}.getAttribute('title')==='Reports'`));
      await evaluate(`document.querySelector('aside nav a[href="/notifications"]').focus()`); await key('Tab');
      check(`${width}: Reports link has keyboard focus styling`, await evaluate(`document.activeElement===${reportLink} && parseFloat(getComputedStyle(document.activeElement).outlineWidth)>=3`));
      await capture(`reports-navigation-${width}`);
    }
  }
  if (!nativeZoom) {
    await viewport(1280);
    await click(`document.querySelector('button[aria-label="Collapse navigation"]')`);
    check('collapsed Reports link retains accessible name and active state', await evaluate(`${reportLink}.getAttribute('aria-label')==='Reports' && ${reportLink}.getAttribute('aria-current')==='page' && getComputedStyle(${reportLink}.querySelector('span')).display==='none'`));
    await click(`document.querySelector('button[aria-label="Expand navigation"]')`);
    for (const language of ['tl', 'ceb', 'hil', 'en']) {
      await evaluate(`(()=>{const e=document.querySelector('header select');e.value='${language}';e.dispatchEvent(new Event('change',{bubbles:true}));})()`);
      await until(`document.querySelector('[lang="${language === 'tl' ? 'fil' : language}"]')!==null`);
      check(`${language}: Reports label keeps explicit English fallback`, await evaluate(`${reportLink}.getAttribute('lang')==='en' && ${reportLink}.getAttribute('aria-label')==='Reports' && document.querySelector('header h1').textContent==='Reports'`));
    }
  }
}
