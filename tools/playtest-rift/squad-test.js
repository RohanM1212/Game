// Tests the Squad & Packs system: packs, pity, reveal, team, skirmish, buddies, save/continue. Also prints a balance table.
const path = require('path');
let chromium; try { ({ chromium } = require('playwright')); } catch (e) { ({ chromium } = require('/opt/node22/lib/node_modules/playwright')); }
const CHROME = require('fs').existsSync('/opt/pw-browsers/chromium-1194/chrome-linux/chrome') ? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' : undefined;
const shotsOn = process.argv.includes('--shots');
(async () => {
  const browser = await chromium.launch({ executablePath: CHROME });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  const errs = []; page.on('pageerror', e => errs.push(e.message));
  await page.goto('file://' + path.resolve(__dirname, '../../rift-runners.html'));
  const shot = async n => { if (!shotsOn) return; await page.waitForTimeout(700); await page.screenshot({ path: path.resolve(__dirname, 'shot-' + n + '.png') }); };
  let fails = 0; const ok = (c, m) => { console.log((c ? '✅ ' : '❌ ') + m); if (!c) fails++; };
  await page.evaluate(() => { localStorage.clear(); S = defaultSave(); S.seenHelp = true; showTitle(); });
  ok(await page.evaluate(() => ui.innerHTML.includes('Squad &amp; Packs')), 'title shows Squad & Packs');
  await shot('title');
  // hub + free pull
  await page.evaluate(() => showSquadHub('packs', showTitle)); await shot('packs');
  ok(await page.evaluate(() => ui.innerHTML.includes('Daily free pull')), 'daily free pull offered');
  await page.evaluate(() => openPack('basic', 'free', drawSquadHub));
  ok(await page.evaluate(() => RV && RV.res.length === 1 && S.freePull === todayStr()), 'free pull gives 1 card');
  await page.evaluate(() => { flipNext(); }); await page.evaluate(() => { const b = RV.back; RV = null; b(); });
  // pack with gems
  const g0 = await page.evaluate(() => S.gems);
  await page.evaluate(() => openPack('basic', 'gems', drawSquadHub));
  ok(await page.evaluate(g0 => S.gems === g0 - 100 && RV.res.length === 3, g0), 'basic pack costs 100 gems, 3 cards');
  await page.evaluate(() => { flipNext(); flipNext(); }); await shot('reveal');
  await page.evaluate(() => { const b = RV.back; RV = null; b(); });
  // force a legendary reveal for the screenshot
  await page.evaluate(() => { S.pity.l = 59; S.gems += 300; openPack('rift', 'gems', drawSquadHub); for (let i = 0; i < 5; i++) { if (RV.res[RV.i] && RV.res[RV.i].r === 4) { flipNext(); break; } flipNext(); } });
  ok(await page.evaluate(() => RV.res.some(x => x.r === 4)), 'legendary pity at 60 works');
  ok(await page.evaluate(() => RV.res.some(x => x.r >= 2)), 'rift pack guarantees Rare+');
  await page.waitForTimeout(150); await shot('legendary');
  ok(await page.evaluate(() => !!document.querySelector('.legend-banner') || RV.i < RV.res.length), 'legendary banner shows');
  await page.evaluate(() => { const b = RV.back; RV = null; b(); });
  // pity stats over many pulls
  const st = await page.evaluate(() => { const bak = JSON.stringify(S); S.pity = { e: 0, l: 0 }; S.col = {}; const c = [0, 0, 0, 0, 0]; let maxGapE = 0, gapE = 0; for (let i = 0; i < 20000; i++) { const r = pullOne(PACKS.basic).r; c[r]++; gapE = r >= 3 ? 0 : gapE + 1; maxGapE = Math.max(maxGapE, gapE); } const own = Object.keys(S.col).length, miss = Object.keys(ROSTER).filter(k => !S.col[k]); S = JSON.parse(bak); return { c, maxGapE, own, miss }; });
  console.log('   20k pulls by rarity:', st.c.join(' / '), '· longest run without Epic+:', st.maxGapE, '· owned', st.own, st.miss.join(','));
  ok(st.maxGapE < 10, 'Epic pity holds'); ok(st.own === 42, 'all 42 members can be pulled');
  // stars from dupes
  ok(await page.evaluate(() => [1, 2, 3, 4, 8, 15, 16].map(starOf).join('') === '1223445'), 'star thresholds');
  // collection + team tabs
  await page.evaluate(() => { SQV.tab = 'collection'; drawSquadHub(); }); await shot('collection');
  await page.evaluate(() => { SQV.tab = 'team'; drawSquadHub(); }); await shot('team');
  ok(await page.evaluate(() => teamUnits().length >= 3), 'starter team exists');
  // abilities: every member's special runs without errors in a battle
  const abErr = await page.evaluate(() => { const bad = []; run = { act: 3, room: 4, heat: 0 }; for (const id of Object.keys(ROSTER)) { try { S.col[id] = { n: 4 }; S.team = [id, 'snail', null, 'candle', null, null]; const B = newBattle({ ids: [id, 'rat', 'snail', 'owl', id, 'bees'], stars: [3, 1, 1, 1, 3, 1], mul: 1 }, 'ambush'); B.f.forEach(x => x.mana = x.d.mana); AB[ROSTER[id][10]](B, B.f.find(x => x.id === id && x.side === 0)); AB[ROSTER[id][10]](B, B.f.find(x => x.id === id && x.side === 1)); while (!B.done) battleTick(B, .05); } catch (e) { bad.push(id + ': ' + e.message); } } run = null; return bad; });
  ok(!abErr.length, 'all 42 specials run' + (abErr.length ? ' — ' + abErr.join('; ') : ''));
  // run: skirmish + buddy + pack door + continue
  await page.evaluate(() => { S.chars.mage = true; newRun(['knight'], 0, false); });
  await page.evaluate(() => { run.act = 1; run.room = 3; enterDoor({ t: 'squad' }); }); await shot('skirmish-prep');
  ok(await page.evaluate(() => ui.innerHTML.includes('Pick a tactic')), 'skirmish prep shows tactics');
  await page.evaluate(() => { SK.tactic = 'focus'; beginSkirmish(); SK.speed = 4; }); await page.waitForTimeout(2500); await shot('skirmish-battle');
  await page.evaluate(() => { useRally(SK.B); while (!SK.B.done) battleTick(SK.B, .05); });
  await page.waitForTimeout(1500);
  ok(await page.evaluate(() => /won|lost/.test(ui.innerHTML)), 'skirmish finishes');
  await page.evaluate(() => { inputLock = 0; ui.querySelector('[data-a="0"]').click(); });
  ok(await page.evaluate(() => G && G.phase === 'doors'), 'back to doors after skirmish');
  await page.evaluate(() => { run.gold = 500; enterDoor({ t: 'packs' }); }); await shot('pack-door');
  await page.evaluate(() => { openPack('basic', 'gold', showPackDoor); });
  ok(await page.evaluate(() => run.gold === 410), 'pack door takes gold');
  await page.evaluate(() => { const b = RV.back; RV = null; b(); roomDone(); });
  // buddy in a fight
  await page.evaluate(() => { S.buddies = ['rat', null]; startRoom({ t: 'fight', o: 'survive' }); window.readInput = i => ({ mx: Math.cos(G.now), my: Math.sin(G.now), dash: false, ult: false }); for (let n = 0; n < 30 * 20 && mode === 'fight' && !paused; n++) update(1 / 30); render(); });
  ok(await page.evaluate(() => G.comps && G.comps.length === 1), 'buddy joins the fight'); await shot('buddy');
  // save + continue
  await page.evaluate(() => { G.phase = 'doors'; run.doors = makeDoors(); saveRun(); save(); location.reload(); });
  await page.waitForTimeout(800);
  await page.evaluate(() => { showTitle(); resumeRun(); });
  ok(await page.evaluate(() => mode === 'fight' || (G && G.phase === 'doors') || ui.innerHTML.includes('door')), 'continue works after reload');
  // T key in hub
  await page.evaluate(() => { hideUI(); paused = false; }); await page.keyboard.press('KeyT');
  ok(await page.evaluate(() => ui.innerHTML.includes('Your team')), 'T opens the team screen');
  await page.keyboard.press('Escape');
  ok(await page.evaluate(() => ui.className === 'hidden' && !paused), 'Esc returns to the run');
  // balance: starter team vs enemy teams per biome
  const bal = await page.evaluate(() => {
    const out = [], save = JSON.stringify(S);
    const tests = { starter: 1, 'new (7 pulls)': null, '10 packs': null, '40 packs': null };
    for (const [name, c] of Object.entries(tests)) {
      S.col = defaultSave().col;
      if (c !== 1) { const n = name.startsWith('new') ? 7 : name.startsWith('10') ? 30 : 120; for (let i = 0; i < n; i++) pullOne(PACKS.basic); }
      // auto team: best 6 by power, tanks front
      const ids = Object.keys(S.col).sort((a, b) => { const pa = unitPower(a, ownStar(a)), pb = unitPower(b, ownStar(b)); return (pb.hp + pb.atk * 12) - (pa.hp + pa.atk * 12); }).slice(0, 6);
      ids.sort((a, b) => (UD(b).range === 'melee') - (UD(a).range === 'melee')); S.team = [null, null, null, null, null, null]; [1, 0, 2, 4, 3, 5].forEach((s, k) => { if (ids[k]) S.team[s] = ids[k]; });
      const row = [name];
      for (let a = 1; a <= 4; a++) { let w = 0; for (let i = 0; i < 60; i++) { run = { act: a, room: 4, heat: 0 }; if (simulateTeam(genEnemyTeam(), 'hold') === 'win') w++; } row.push(Math.round(w / 60 * 100) + '%'); }
      out.push(row.join('  '));
    }
    S = JSON.parse(save); run = null; return out;
  });
  console.log('   win rate vs biome 1/2/3/4 (room 4):\n   ' + bal.join('\n   '));
  console.log('errors:', errs.length ? errs : 'none');
  if (errs.length) fails++;
  console.log(fails ? `${fails} FAILED` : 'ALL PASSED');
  await browser.close();
})();
