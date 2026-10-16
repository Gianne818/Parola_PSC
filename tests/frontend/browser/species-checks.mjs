export async function verifySpeciesUI({ evaluate, until, check, clickText, viewport, layout, key, send, session }) {
  const rows = `document.querySelectorAll('#fishing-areas ol li').length`;
  const body = `document.body.innerText`;
  const select = async (label, value) => {
    const control = `Array.from(document.querySelectorAll('select')).find(e=>e.labels[0]?.textContent.startsWith(${JSON.stringify(label)}))`;
    await until(`Boolean(${control})`);
    await evaluate(`{const e=${control};e.value=${JSON.stringify(value)};e.dispatchEvent(new Event('change',{bubbles:true}));}`);
  };
  const openFilters = async () => { await clickText('summary', 'Filter fish'); };
  await until(`${rows}===3`);
  await layout('species workspace desktop');
  await openFilters();
  check('all three habitat options retained', await evaluate(`Array.from(document.querySelectorAll('select')[0].options).map(e=>e.value).join(',')==='both,pelagic,demersal'`));
  await select('Habitat', 'pelagic'); await until(`${rows}===2`);
  check('pelagic filter keeps matching and mixed habitat', await evaluate(`${body}.includes('Surface-water fish') && !document.querySelector('#fishing-areas ol').innerText.includes('Bottom and reef fish')`));
  await select('Habitat', 'demersal'); await until(`${rows}===2`);
  check('demersal filter keeps matching and mixed habitat', await evaluate(`!document.querySelector('#fishing-areas ol').innerText.includes('Surface-water fish')`));
  await select('Habitat', 'both'); await until(`${rows}===3`);
  const fish = await evaluate(`document.querySelectorAll('select')[1].options[1].value`);
  await select('Target fish', fish);
  await until(`${body}.includes('Species HSI is unavailable')`);
  await clickText('summary', 'Filter fish');
  await until(`Boolean(document.querySelector('button[aria-label="View details: Zone 23"]'))`);
  await evaluate(`document.querySelector('button[aria-label="View details: Zone 23"]').click()`);
  await until(`${body}.includes('Habitat-model score')`);
  check('habitat score and unavailable HSI are distinct from species presence', await evaluate(`${body}.includes('60%') && ${body}.includes('habitat scores are unchanged') && ${body}.includes('Verified species presence') && ${body}.includes('no species evidence supplied')`));
  check('catalog common/scientific/local names retain their meaning', await evaluate(`${body}.includes('Sample sardine') && ${body}.includes('Scientific representative') && ${body}.includes('Sample scientific name') && Array.from(document.querySelectorAll('dt')).some(e=>e.textContent==='Local name' && e.nextElementSibling.textContent==='Unavailable')`));
  check('zero stored SST/chlorophyll survive and depth remains unavailable', await evaluate(`Array.from(document.querySelectorAll('dt')).some(e=>e.textContent==='Depth' && e.nextElementSibling.textContent==='Unavailable') && ${body}.includes('0 °C') && Array.from(document.querySelectorAll('dt')).some(e=>e.textContent.startsWith('Stored chlorophyll') && e.nextElementSibling.textContent==='0') && ${body}.includes('Stored values are not verified measured conditions')`));
  await until(`document.activeElement.id==='inspector-title'`);
  check('details selection moves keyboard focus to the inspector', await evaluate(`document.activeElement.id==='inspector-title'`));
  await layout('species details desktop');
  for (const width of [390, 320]) { await viewport(width); await layout(`species details ${width}px`); }
  await evaluate(`document.documentElement.style.fontSize='32px'`); await layout('species details 320px with doubled text');
  await evaluate(`document.documentElement.style.fontSize=''`);
  await viewport(1280);
  await evaluate(`fixture.setScenario('missing')`);
  await until(`Array.from(document.querySelectorAll('dt')).some(e=>e.textContent.startsWith('Stored SST') && e.nextElementSibling.textContent==='Unavailable')`);
  check('absent environment stays unavailable after refresh', await evaluate(`!${body}.includes('0 °C') && !${body}.includes('NaN')`));
  // A same-filter contract error must evict even previously successful/selected areas.
  for (const scenario of ['unsupported', 'ambiguous', 'unavailable']) {
    await evaluate(`fixture.setScenario(${JSON.stringify(scenario)})`);
    await until(`${body}.includes(${JSON.stringify(scenario === 'unavailable' ? 'species catalog is unavailable' : 'unsupported or ambiguous')})`);
    check(`${scenario}: explicit status removes previous results and score`, await evaluate(`${rows}===0 && !${body}.includes('Habitat-model score') && !${body}.includes('No areas match')`));
    check(`${scenario}: status has English fallback semantics`, await evaluate(`Array.from(document.querySelectorAll('[role="status"][lang="en"]')).some(e=>e.innerText.includes(${JSON.stringify(scenario === 'unavailable' ? 'catalog is unavailable' : 'unsupported or ambiguous')}))`));
  }
  const tree = await send('Accessibility.getFullAXTree', {}, session);
  check('catalog failure has status semantics in accessibility tree', tree.nodes.some(node => node.role?.value === 'status'));
  const requestsBefore = await evaluate(`fixture.requests.length`);
  await evaluate(`Array.from(document.querySelectorAll('#fishing-areas button')).find(e=>e.textContent==='Try again').click()`);
  await until(`fixture.requests.length>${requestsBefore} && ${body}.includes('species catalog is unavailable')`);
  check('retry preserves the requested target', await evaluate(`new URL(fixture.requests.at(-1),location.origin).searchParams.get('species')===${JSON.stringify(fish)}`));
  await evaluate(`Array.from(document.querySelectorAll('#fishing-areas button')).find(e=>e.textContent==='Clear filters').focus()`);
  await key('Enter');
  await until(`${rows}===3`);
  check('keyboard clear filter recovers habitat results without a species fallback', await evaluate(`!new URL(fixture.requests.at(-1),location.origin).searchParams.has('species') && !${body}.includes('catalog is unavailable')`));
  await evaluate(`fixture.setScenario('empty')`); await until(`${body}.includes('No fishing areas available')`);
  check('valid empty results remain different from catalog failure', await evaluate(`!${body}.includes('catalog is unavailable') && ${rows}===0`));
  check('mocked requests use only the two approved local read paths', await evaluate(`fixture.requests.every(url=>url.startsWith('/api/advisories/nearest?')||url.startsWith('/api/dashboard/weather?'))`));
  check('only the deliberate network canaries reach the denied transport', await evaluate(`window.demoRequests.length===2`));
}
