// Tests the pet system: Rift World (walking, wild battles, catching, trainers, Wardens, badges, gates, fountain, shop,
// hidden items, blackouts), Pokémon-style battles, evolution, the Rift Tower, the pet screens, buddies, packs and old saves.
// Also prints a balance table. node tools/playtest-rift/pets-test.js [--shots]
const path = require('path');
let chromium; try { ({ chromium } = require('playwright')); } catch (e) { ({ chromium } = require('/opt/node22/lib/node_modules/playwright')); }
const CHROME = require('fs').existsSync('/opt/pw-browsers/chromium-1194/chrome-linux/chrome') ? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' : undefined;
const shotsOn = process.argv.includes('--shots');
(async () => {
  const browser = await chromium.launch({ executablePath: CHROME });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  const errs = []; page.on('pageerror', e => errs.push(e.message)); page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await page.goto('file://' + path.resolve(__dirname, '../../rift-runners.html'));
  const shot = async n => { if (!shotsOn) return; await page.waitForTimeout(350); await page.screenshot({ path: path.resolve(__dirname, 'shot-' + n + '.png') }); };
  let fails = 0; const ok = (c, m, x) => { console.log((c ? '✅ ' : '❌ ') + m + (c || x === undefined ? '' : '  → ' + JSON.stringify(x))); if (!c) fails++; };
  const ev = (f, a) => page.evaluate(f, a);
  // plays a battle to the end: attack with the best move, catch when asked, switch when a pet faints
  const playBattle = async (opts = {}) => {
    for (let k = 0; k < 400; k++) {
      const st = await ev(() => PB ? PB.mode : 'done'); if (st === 'done') return;
      if (['menu', 'fight', 'bag', 'pets'].includes(st)) await ev(o => { if (o.catch && pbB().hp < pbB().maxHp * .6 && (bag().orb || 0) > 0) pbTurn({ t: 'orb', id: 'orb' }); else pbTurn({ t: 'move', m: aiMove(pbA(), pbB()) }); }, opts);
      else if (st === 'forceswitch') await ev(() => { const j = PB.my.findIndex(x => x.hp > 0); PB.need = null; PB.a = j; PB.frames = []; pbPlay(); });
      else if (st === 'play') await ev(() => { if (PB) { clearTimeout(PB.timer); PB.fi = PB.frames.length; pbStep(); } });
      await page.waitForTimeout(20);
    }
  };
  await ev(() => { localStorage.clear(); S = defaultSave(); S.seenHelp = true; showTitle(); });
  ok(await ev(() => /Rift World/.test(ui.innerHTML)), 'title shows the Rift World'); await shot('title');
  // --- starter
  await ev(() => enterWorld()); await shot('starter');
  ok(await ev(() => /Choose your first partner/.test(ui.innerHTML)), 'first visit: choose a starter');
  await ev(() => (inputLock = 0, ui.querySelector('[data-a="1"]').click()));
  ok(await ev(() => mode === 'world' && S.party[0] === 'frog' && lvOf('frog') >= 5 && coins() >= 300), 'the starter leads your party; you get coins');
  await shot('world');
  // --- walking with the keyboard
  const p0 = await ev(() => [WS.px, WS.py]);
  for (let i = 0; i < 5; i++) { await page.keyboard.down('KeyD'); await page.waitForTimeout(175); await page.keyboard.up('KeyD'); await page.waitForTimeout(30); }
  const p1 = await ev(() => [WS.px, WS.py]);
  ok(p1[0] > p0[0], 'you can walk around', { p0, p1 });
  ok(await ev(() => { const M = WS.M; return M.t.filter(c => c === ',').length > 40 && M.npcs.filter(n => n.kind === 'trainer').length === 3 && M.t.includes('H') && M.t.includes('S'); }), 'the zone has tall grass, 3 trainers, a fountain and a shop');
  // every zone map is fully reachable
  const reach = await ev(() => ZONES.map((_, z) => { const M = zoneMap(z), seen = new Set([M.start.join()]), q = [M.start]; while (q.length) { const [x, y] = q.pop(); for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + dx, ny = y + dy, c = M.t[ny * WW + nx]; if (!c || 'T~HSIAG'.includes(c) || seen.has(nx + ',' + ny)) continue; if (M.npcs.some(n => n.x === nx && n.y === ny)) continue; seen.add(nx + ',' + ny); q.push([nx, ny]); } } const items = []; M.t.forEach((c, i) => { if (c === '*') items.push([i % WW, Math.floor(i / WW)]); }); const w = M.npcs.find(n => n.k === 'w'); return { z, items: items.filter(([x, y]) => !seen.has(x + ',' + y)).length, warden: seen.has((w.x - 1) + ',' + w.y) }; }));
  ok(reach.every(r => !r.items && r.warden), 'every zone: hidden items and the Warden can be reached', reach);
  // --- a wild battle from the tall grass
  await ev(() => { const M = WS.M; const i = M.t.findIndex((c, k) => c === ',' && !M.npcs.some(n => n.x === k % WW && n.y === Math.floor(k / WW))); WS.px = i % WW; WS.py = Math.floor(i / WW); WS.fx = WS.px; WS.fy = WS.py; WS.stepsSinceFight = 9; Math.random = (r => () => 0.01)(Math.random); });
  await ev(() => wArrive());
  await page.waitForTimeout(700);
  await ev(() => { delete Math.random; Math.random = Math.random; });
  await page.reload(); // restore real randomness and test save/load at the same time
  await ev(() => { S.seenHelp = true; });
  ok(await ev(() => S.world && S.world.started && S.party[0] === 'frog'), 'the world and party are saved');
  await ev(() => enterWorld());
  await ev(() => pbStart('wild', [{ id: 'rat', lv: 4 }], { zone: 0, onEnd: (r, B, n) => { window._res = r; wBattleEnd(r); } }));
  await page.waitForTimeout(1500); await shot('battle-intro');
  await ev(() => { clearTimeout(PB.timer); PB.fi = PB.frames.length; pbStep(); PB.mode = 'fight'; pbDraw(); }); await shot('battle-moves');
  ok(await ev(() => document.querySelectorAll('.pbmove').length >= 2), 'the Fight menu shows your moves');
  await playBattle({ catch: true });
  ok(await ev(() => ['win', 'caught'].includes(window._res)), 'the wild battle ends (' + await ev(() => window._res) + ')');
  // --- catching works
  const caught = await ev(() => { window.pbPlay = () => {}; S.world.bag.orb = 50; let got = 0; for (let i = 0; i < 20; i++) { pbStart('wild', [{ id: 'snail', lv: 3 }], { onEnd: r => { if (r === 'caught') got++; } }); pbB().hp = 1; while (PB && !PB.over) pbTurn({ t: 'orb', id: 'orb' }); if (PB) pbFinish(); } delete window.pbPlay; return got; });
  ok(caught > 0, 'throwing orbs at a weak wild pet catches it', caught);
  await ev(() => { window.pbPlay = function () { PB.fi = 0; PB.mode = 'play'; pbStep(); }; });
  // --- type chart and stats
  ok(await ev(() => typeMul('fire', 'blade') === 1.5 && typeMul('blade', 'fire') === .67 && typeMul('normal', 'fire') === 1), 'the element wheel: super effective and not very effective');
  ok(await ev(() => Object.keys(ROSTER).every(id => { const b = baseStats(id); return b.hp > 30 && b.atk > 30 && b.def > 20 && b.spd > 10; })), 'every pet has a sensible stat spread');
  const bst = await ev(() => [0, 1, 2, 3, 4].map(r => { const l = Object.keys(ROSTER).filter(k => ROSTER[k][2] === r && !EVO_ONLY.has(k)).map(bstOf); return Math.round(l.reduce((a, b) => a + b, 0) / l.length); }));
  ok(bst[4] > bst[3] && bst[3] > bst[2] && bst[2] > bst[1] && bst[1] > bst[0] && bst[4] / bst[0] < 1.5, 'rarer pets have bigger stat totals, but not overwhelming', bst);
  ok(await ev(() => Object.keys(ROSTER).every(id => learnset(id).every(([, m]) => getMove(m) && getMove(m).n))), 'every pet has a full learnset of real moves');
  // --- trainers, the Warden, badges and gates
  await ev(() => { window.pbPlay = function () { PB.fi = 0; PB.mode = 'play'; pbStep(); }; ['frog', 'rat', 'snail'].forEach(id => { col()[id].lv = 30; col()[id].hp = null; }); });
  await ev(() => { const n = WS.M.npcs.find(n => n.kind === 'trainer'); wTalk(n); }); await shot('trainer');
  ok(await ev(() => /Battle!/.test(ui.innerHTML)), 'walking up to a trainer starts a challenge');
  await ev(() => (inputLock = 0, ui.querySelector('[data-a="0"]').click()));
  await playBattle();
  ok(await ev(() => S.world.beat['0-t0']), 'beating a trainer counts');
  ok(await ev(() => WS && wSolid(WS.M.npcs.find(n => n.k === 'w').x, WS.M.npcs.find(n => n.k === 'w').y)), 'the Warden blocks the path');
  await ev(() => { hideUI(); wTalk(WS.M.npcs.find(n => n.k === 'w')); (inputLock = 0, ui.querySelector('[data-a="0"]').click()); });
  await playBattle();
  ok(await ev(() => S.world.badges === 1 && (S.world.bag.greatorb || 0) >= 3), 'beating the Warden gives a badge and Great Orbs');
  await shot('badge');
  ok(await ev(() => !wSolid(WS.M.npcs.find(n => n.k === 'w').x, WS.M.npcs.find(n => n.k === 'w').y)), 'after the Warden the path opens');
  await ev(() => { hideUI(); wZone(1, 'west'); });
  ok(await ev(() => WS.z === 1 && S.world.z === 1), 'the gate takes you to Ember Canyon'); await shot('zone2');
  // --- fountain, shop, hidden item, anomaly
  await ev(() => { col().frog.hp = 1; wHeal(); });
  ok(await ev(() => hpOf('frog') === statsOf('frog').hp), 'the fountain heals your pets');
  const c0 = await ev(() => coins());
  await ev(() => { hideUI(); wShop(); inputLock = 0; ui.querySelector('button.card:not([disabled])').click(); }); await shot('shop');
  ok(await ev(c0 => coins() < c0, c0), 'the shop sells items for coins');
  await ev(() => { hideUI(); const M = WS.M, i = M.t.indexOf('*'); WS.px = i % WW; WS.py = Math.floor(i / WW); wArrive(); });
  ok(await ev(() => /You found/.test(ui.innerHTML)), 'hidden items can be found');
  // --- blackout
  await ev(() => { hideUI(); party().forEach(id => col()[id].hp = 0); });
  await ev(() => wWild()); await page.waitForTimeout(900);
  ok(await ev(() => /fainted|hurry back/i.test(ui.innerHTML) && hpOf('frog') > 0), 'if every pet faints you go back to the fountain, healed');
  // --- evolution
  await ev(() => { hideUI(); addPet('chick', 13); const out = []; giveXp('chick', xpNeedLv(13) + 5, out); });
  ok(await ev(() => readyToEvolve('chick') === 'rooster'), 'Fire Chick is ready to evolve at Lv 14');
  await ev(() => showEvolution('chick', () => { window._evo = true; })); await page.waitForTimeout(2900); await shot('evolution');
  ok(await ev(() => col().rooster && !col().chick && S.party.includes('rooster')), 'it evolves into Blaze Rooster and stays in your party');
  // --- the pet screens
  await ev(() => { showSquadHub('team', hideUI); SQV.sel = 'frog'; drawSquadHub(); }); await shot('party');
  ok(await ev(() => /Moves/.test(ui.innerHTML) && /Attack/.test(ui.innerHTML) && document.querySelectorAll('.mvchip').length >= 4), 'the party screen shows stats and moves');
  await ev(() => { SQV.tab = 'collection'; SQV.sel = 'dragon'; drawSquadHub(); }); await shot('dex');
  // --- tower
  await ev(() => showTower()); await shot('tower');
  ok(await ev(() => /Floor 1/.test(ui.innerHTML)), 'the tower shows floor 1');
  await ev(() => startTowerBattle(1)); await playBattle();
  ok(await ev(() => S.tower.best >= 1 || /Defeat/.test(ui.innerHTML)), 'a tower floor can be played');
  // --- buddies in an action run use the pet's stats
  await ev(() => { S.buddies = ['frog', null]; S.chars.knight = true; newRun(['knight'], 0, false); startRoom({ t: 'fight', o: 'survive' }); for (let n = 0; n < 30 * 8; n++) update(1 / 30); });
  ok(await ev(() => G.comps && G.comps.length === 1 && G.comps[0].pow > 1), 'your buddy fights in runs, powered by its stats');
  await ev(() => { G = null; run = null; mode = 'menu'; showTitle(); });
  // --- packs never give evolved forms; new pets start at Lv 5
  const pk = await ev(() => { const bad = []; for (let i = 0; i < 3000; i++) { const r = pullOne(PACKS.basic); if (EVO_ONLY.has(r.id)) bad.push(r.id); } return bad.length; });
  ok(pk === 0, 'packs never give evolve-only pets');
  // --- an old save from the tower days still works
  await ev(() => { localStorage.setItem(SAVE_KEY, JSON.stringify({ v: 2, gems: 500, col: { lion: { n: 3, lv: 12, xp: 5 }, rat: { n: 1 } }, team: ['lion', 'rat', null, null], buddies: ['lion', null], tower: { best: 7 }, stats: {} })); S = loadSave(); });
  ok(await ev(() => party().includes('lion') && lvOf('rat') >= 5 && lvOf('lion') === 12), 'an old save becomes your party with levels kept');
  // --- balance
  const bal = await ev(() => {
    const keep = window.pbPlay; window.pbPlay = () => {}; const old = { save: window.save }; window.save = () => {};
    const by = [0, 1, 2, 3, 4].map(r => Object.keys(ROSTER).filter(k => ROSTER[k][2] === r && !EVO_ONLY.has(k)));
    const fight = (a, b, la, lb) => { S.col = {}; S.col[a] = { n: 1, lv: la }; S.party = [a]; PB = { kind: 'tower', my: [myBpet(a)], foe: [bpet(b, lb)], a: 0, b: 0, turn: 0, frames: [], opts: { fullHeal: true }, speed: 1 }; for (let t = 0; t < 60 && !PB.over && !PB.need; t++) pbTurn({ t: 'move', m: aiMove(pbA(), pbB()) }); const r = PB.over === 'win' ? 1 : 0; PB = null; return r; };
    const rows = ['Lv 25, 1v1 win % (row vs column):  C    U    R    E    L'];
    for (let a = 0; a < 5; a++) { const row = [RAR[a].name.padEnd(34)]; for (let c = 0; c < 5; c++) { let w = 0; for (let i = 0; i < 120; i++) w += fight(rpick(by[a]), rpick(by[c]), 25, 25); row.push(String(Math.round(w / 1.2)).padStart(5)); } rows.push(row.join('')); }
    let w = 0; for (let i = 0; i < 200; i++) w += fight(rpick(by[0]), rpick(by[4]), 30, 24); rows.push(`Common Lv30 vs Legendary Lv24: ${Math.round(w / 2)}%`);
    window.pbPlay = keep; window.save = old.save; return rows;
  });
  console.log('   ' + bal.join('\n   '));
  ok(!errs.length, 'no page errors', errs.slice(0, 5));
  console.log(fails ? `${fails} FAILED` : 'ALL PASSED');
  await browser.close();
  process.exit(fails ? 1 : 0);
})();
