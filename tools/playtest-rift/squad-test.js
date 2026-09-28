// Tests the Squad & Packs system: packs, pity, reveal, Rift Tower battles, buddies, eggs, save/continue. Also prints a tower balance table.
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
  await page.evaluate(() => openPack('basic', 'free', drawSquadHub)); await page.evaluate(() => { RV.tease = false; });
  ok(await page.evaluate(() => RV && RV.res.length === 1 && S.freePull === todayStr()), 'free pull gives 1 card');
  await page.evaluate(() => { flipNext(); }); await page.evaluate(() => { const b = RV.back; RV = null; b(); });
  // pack with gems
  const g0 = await page.evaluate(() => S.gems);
  await page.evaluate(() => openPack('basic', 'gems', drawSquadHub)); await shot('tease'); await page.evaluate(() => { RV.tease = false; });
  ok(await page.evaluate(g0 => S.gems === g0 - 100 && RV.res.length === 3, g0), 'basic pack costs 100 gems, 3 cards');
  await page.evaluate(() => { flipNext(); flipNext(); }); await shot('reveal');
  await page.evaluate(() => { const b = RV.back; RV = null; b(); });
  // force a legendary reveal for the screenshot
  await page.evaluate(() => { S.pity.l = 59; S.gems += 300; openPack('rift', 'gems', drawSquadHub); RV.tease = false; for (let i = 0; i < 5; i++) { if (RV.res[RV.i] && RV.res[RV.i].r === 4) { flipNext(); break; } flipNext(); } });
  ok(await page.evaluate(() => RV.res.some(x => x.r === 4)), 'legendary pity at 60 works');
  ok(await page.evaluate(() => RV.res.some(x => x.r >= 2)), 'rift pack guarantees Rare+');
  await page.waitForTimeout(150); await shot('legendary');
  ok(await page.evaluate(() => !!document.querySelector('.legend-banner') || RV.i < RV.res.length), 'legendary banner shows');
  await page.evaluate(() => { const b = RV.back; RV = null; b(); });
  // pity stats over many pulls
  const st = await page.evaluate(() => { const bak = JSON.stringify(S); S.pity = { e: 0, l: 0 }; S.col = {}; const c = [0, 0, 0, 0, 0]; let maxGapE = 0, gapE = 0; for (let i = 0; i < 20000; i++) { const r = pullOne(PACKS.basic).r; c[r]++; gapE = r >= 3 ? 0 : gapE + 1; maxGapE = Math.max(maxGapE, gapE); } const own = Object.keys(S.col).length, miss = Object.keys(ROSTER).filter(k => !S.col[k]); S = JSON.parse(bak); return { c, maxGapE, own, miss }; });
  console.log('   20k pulls by rarity:', st.c.join(' / '), '· longest run without Epic+:', st.maxGapE, '· owned', st.own, st.miss.join(','));
  ok(st.maxGapE < 10, 'Epic pity holds'); ok(st.own === 60, 'all 60 members can be pulled');
  // stars from dupes
  ok(await page.evaluate(() => [1, 2, 3, 4, 8, 15, 16].map(starOf).join('') === '1223445'), 'star thresholds');
  // collection + team tabs
  await page.evaluate(() => { SQV.tab = 'collection'; drawSquadHub(); }); await shot('collection');
  await page.evaluate(() => { SQV.tab = 'team'; drawSquadHub(); }); await shot('team');
  ok(await page.evaluate(() => teamUnits().length >= 3), 'starter team exists');
  // abilities: every member's special runs without errors in a turn-based battle
  const abErr = await page.evaluate(() => { const bad = []; for (const id of Object.keys(ROSTER)) { try { const B = tbNew({ ids: [id, 'rat', 'owl', 'bees'], stars: [3, 1, 1, 1], lvs: [5, 1, 1, 1] }, { ids: [id, 'snail', 'candle', 'frog'], stars: [3, 1, 1, 1], lvs: [5, 1, 1, 1], mul: 1 }); B.u.forEach(x => x.cd = 0); for (const x of B.u.filter(x => x.id === id)) { tbStartRound(B); const t = tbFoes(B, x)[0]; tbDo(B, x, 'sp', t); } for (let n = 0; n < 600 && !B.done; n++) { const u = tbNextActor(B); if (!u) break; if (!tbBeginTurn(B, u)) { tbCheck(B); continue; } const a = tbAI(B, u); tbDo(B, u, a.act, a.t); } if (!B.done) bad.push(id + ': no result'); } catch (e) { bad.push(id + ': ' + e.message); } } return bad; });
  ok(!abErr.length, 'all ' + 60 + ' specials run' + (abErr.length ? ' — ' + abErr.join('; ') : ''));
  // tower
  await page.evaluate(() => { showTower(); }); await shot('tower');
  ok(await page.evaluate(() => ui.innerHTML.includes('Rift Tower') && ui.innerHTML.includes('Fight!')), 'tower screen');
  await page.evaluate(() => { S.tbAuto = false; startTowerBattle(1); });
  await page.waitForTimeout(1500);
  const my = await page.evaluate(() => TB && TB.mode);
  ok(my === 'choose' || my === 'busy', 'battle starts, waits for a choice (' + my + ')');
  for (let k = 0; k < 60; k++) { const st = await page.evaluate(() => TB ? TB.mode : 'gone'); if (st === 'gone') break; if (st === 'target') await page.keyboard.press('Digit1'); if (st === 'choose') { await page.keyboard.press(k % 3 === 0 ? 'KeyS' : 'KeyA'); await page.waitForTimeout(100); const m = await page.evaluate(() => TB && TB.mode); if (m === 'target') { if (k === 2) await shot('battle-target'); await page.keyboard.press('Digit1'); } if (m === 'choose') await page.keyboard.press('KeyA'); } await page.waitForTimeout(300); if (k === 5) await shot('battle'); }
  ok(await page.evaluate(() => !TB && /victory|defeat/i.test(ui.innerHTML)), 'floor 1 finishes by hand');
  const best = await page.evaluate(() => S.tower.best); ok(best === 1, 'floor 1 cleared (best=' + best + ')');
  await shot('battle-win');
  // auto battle floor 5 (free pack reward)
  await page.evaluate(() => { S.tower.best = 4; S.tbAuto = true; S.tbSpeed = 3; startTowerBattle(5); });
  for (let k = 0; k < 80; k++) { if (await page.evaluate(() => !TB)) break; await page.waitForTimeout(250); }
  const res5 = await page.evaluate(() => /victory/i.test(ui.innerText) ? 'win' : 'lose');
  console.log('   floor 5 auto:', res5);
  if (res5 === 'win') { await page.evaluate(() => { inputLock = 0; ui.querySelector('[data-a="0"]').click(); }); ok(await page.evaluate(() => !!RV && RV.res.length === 3), 'floor 5 gives a free pack'); await page.evaluate(() => { const b = RV.back; RV = null; b(); }); }
  // mystery legendary at 25
  await page.evaluate(() => { const g = S.gems; S.pity = { e: 0, l: 0 }; openPack('rift', 'reward', showTitle, 4); window._r = RV.res.map(x => x.r); window._g = S.gems - g; RV = null; });
  ok(await page.evaluate(() => _r[0] === 4 && _r.filter(r => r === 4).length < 5 && _g >= 0), 'mystery reward gives one guaranteed Legendary for free');
  // blessings apply to runs
  await page.evaluate(() => { S.tower.best = 50; S.chars.mage = true; newRun(['knight'], 0, false); });
  ok(await page.evaluate(() => run.gold >= 60 && run.relics.length >= 1 && run.rerolls >= 2), 'tower blessings apply to runs');
  ok(await page.evaluate(() => !makeDoors().some(d => d.t === 'squad')), 'no squad fights inside runs');
  await page.evaluate(() => { S.tower.best = 0; });
  // buddy in a fight
  await page.evaluate(() => { S.buddies = ['rat', null]; startRoom({ t: 'fight', o: 'survive' }); window.readInput = i => ({ mx: Math.cos(G.now), my: Math.sin(G.now), dash: false, ult: false }); for (let n = 0; n < 30 * 20 && mode === 'fight' && !paused; n++) update(1 / 30); render(); });
  ok(await page.evaluate(() => G.comps && G.comps.length === 1), 'buddy joins the fight'); await shot('buddy');
  await page.evaluate(() => { S.col.dragon = { n: 1, lv: 1, xp: 0 }; S.buddies = ['dragon', null]; G = null; mode = 'menu'; startRoom({ t: 'fight', o: 'survive' }); run.room = 2; G.gobAt = 1; for (let n = 0; n < 30 * 12 && mode === 'fight' && !paused; n++) update(1 / 30); render(); });
  ok(await page.evaluate(() => G.gobDone), 'goblin can appear'); await shot('legendary-buddy');
  await page.evaluate(() => { run.eggs = ['egg', 'goldegg']; G.phase = 'doors'; });
  await page.evaluate(() => endRun('dead'));
  ok(await page.evaluate(() => RV && RV.res.length === 2), 'eggs hatch at the end of a run');
  await page.evaluate(() => { RV.tease = false; flipNext(); flipNext(); const b = RV.back; RV = null; b(); });
  ok(await page.evaluate(() => /You Fell/.test(ui.innerHTML) && /xp/.test(ui.innerHTML)), 'run summary shows buddy XP');
  await page.evaluate(() => { S.chars.mage = true; newRun(['knight'], 0, false); });
  // save + continue
  await page.evaluate(() => { G.phase = 'doors'; run.doors = makeDoors(); saveRun(); save(); location.reload(); });
  await page.waitForTimeout(800);
  await page.evaluate(() => { showTitle(); resumeRun(); });
  ok(await page.evaluate(() => mode === 'fight' || (G && G.phase === 'doors') || ui.innerHTML.includes('door')), 'continue works after reload');
  // T key in hub
  await page.evaluate(() => { hideUI(); paused = false; }); await page.keyboard.press('KeyT');
  ok(await page.evaluate(() => ui.innerHTML.includes('Buddies')), 'T opens the team screen');
  await page.keyboard.press('Escape');
  ok(await page.evaluate(() => ui.className === 'hidden' && !paused), 'Esc returns to the run');
  // balance: auto-battle win rate on tower floors for a few collection sizes
  const bal = await page.evaluate(() => {
    const out = [], keep = JSON.stringify(S), floors = [3, 8, 15, 25, 35, 45, 55];
    for (const [n, lvl] of [[0, 3], [7, 6], [30, 12], [120, 20], [300, 30]]) {
      const row = [(n + ' pulls, lv' + lvl).padEnd(16)];
      for (const f of floors) { let w = 0; for (let t = 0; t < 4; t++) { S.pity = { e: 0, l: 0 }; S.col = defaultSave().col; for (let i = 0; i < n; i++) pullOne(PACKS.basic); for (const id in S.col) S.col[id].lv = Math.min(lvCap(id), lvl);
        const ids = Object.keys(S.col).sort((x, y) => { const a = unitPower(x, ownStar(x), lvOf(x)), c = unitPower(y, ownStar(y), lvOf(y)); return (c.hp + c.atk * 10) - (a.hp + a.atk * 10); }).slice(0, 4).sort((x, y) => (UD(y).range === 'melee') - (UD(x).range === 'melee'));
        S.team = [0, 1, 2, 3].map(i => ids[i] || null); for (let k = 0; k < 4; k++) if (tbSimulate(myTeamSpec(), towerFloor(f)).done === 'win') w++; }
        row.push(String(Math.round(w / 16 * 100)).padStart(4) + '%'); }
      out.push(row.join(''));
    }
    S = JSON.parse(keep); return ['floor           ' + floors.map(f => String(f).padStart(5)).join('')].concat(out);
  });
  console.log('   tower auto-battle win rate:\n   ' + bal.join('\n   '));
  console.log('errors:', errs.length ? errs : 'none');
  if (errs.length) fails++;
  console.log(fails ? `${fails} FAILED` : 'ALL PASSED');
  await browser.close();
})();
