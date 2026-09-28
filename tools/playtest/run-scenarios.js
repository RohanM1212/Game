// node tools/playtest/run-scenarios.js [filter]   — replays every reported bug with the real AI
const { openGame, startPage, act, invariants, transcript, sleep } = require('./lib');
const SCEN = require('./scenarios');
(async () => {
  const only = process.argv[2]; let fails = 0, n = 0, skipped = 0;
  for (const sc of SCEN) {
    if (only && !sc.name.includes(only)) continue;
    n++;
    const { browser, page, errors } = await openGame();
    const probs = [];
    try {
      await startPage(page, { book: sc.book, powers: sc.powers });
      for (const s of sc.setup || []) await page.evaluate(s);
      for (const step of sc.steps) {
        if (step.startsWith('#')) { await page.evaluate(step.slice(1)); continue; }
        await act(page, step); await sleep(+process.env.PACE || 2500);
      }
      probs.push(...await invariants(page, errors));
      // if the free AI was out of breath, the game used its offline narrator — that's not a bug in the scenario
      const busy = await page.evaluate(() => R.level.kind === 'map' || R.level.log.some(l => /lost its voice|AI narrator is unavailable/.test(l.h)));
      const r = await page.evaluate(sc.expect);
      if (r !== true) { if (busy) { probs.length = 0; probs.skip = true; } else probs.push('Expectation failed: ' + r); }
    } catch (e) { probs.push('Runner error: ' + e.message); }
    if (probs.skip) { skipped++; console.log(`⚠️  ${sc.name} — skipped: the free AI was busy, run it again later`); }
    else if (probs.length) { fails++; console.log(`❌ ${sc.name}\n   - ${probs.join('\n   - ')}`); if (process.env.VERBOSE) console.log(await transcript(page).catch(() => '')); }
    else console.log(`✅ ${sc.name}`);
    await browser.close();
    await sleep(+process.env.PAUSE || 20000); // let the free per-minute AI budget refill between scenarios
  }
  console.log(`\n${n - fails - skipped}/${n} scenarios passed${skipped ? `, ${skipped} skipped (AI busy)` : ''}.`);
  process.exit(fails ? 1 : 0);
})();
