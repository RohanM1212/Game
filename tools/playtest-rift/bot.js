// Headless bot for Rift Runners: plays whole runs at high speed and reports crashes + how far it got.
// node tools/playtest-rift/bot.js [solo|coop] [runs] [maxMinutes]
const path = require('path');
let chromium; try { ({ chromium } = require('playwright')); } catch (e) { ({ chromium } = require('/opt/node22/lib/node_modules/playwright')); }
const CHROME = require('fs').existsSync('/opt/pw-browsers/chromium-1194/chrome-linux/chrome') ? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' : undefined;
const GAME = path.resolve(__dirname, '../../rift-runners.html');
(async () => {
  const modeArg = process.argv[2] || 'solo', runs = +process.argv[3] || 1, maxMin = +process.argv[4] || 25;
  const browser = await chromium.launch({ executablePath: CHROME });
  const results = [];
  for (let k = 0; k < runs; k++) {
    const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message)); page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    await page.goto('file://' + GAME);
    await page.evaluate(([coop]) => {
      S.seenHelp = true; S.chars = Object.fromEntries(Object.keys(CHARS).map(k => [k, true]));
      const ids = Object.keys(CHARS), pickC = () => ids[Math.floor(Math.random() * ids.length)];
      window.BOT = { rooms: 0, log: [], simT: 0 };
      const so = skirmishOver; window.skirmishOver = function (r) { BOT.sk = BOT.sk || { win: 0, lose: 0 }; BOT.sk[r]++; return so.apply(this, arguments); };
      const oh = hideUI; window.hideUI = function () { if (lvOpen && BOT.log.length < 3) BOT.log.push(new Error().stack.split('\n').slice(1, 6).join(' | ')); return oh.apply(this, arguments); };
      // bot controls: dodge enemies and bullets, chase the room goal, walk into doors, fire ultimates
      window.readInput = i => {
        const pl = PL[i]; if (!pl || pl.down) return { mx: 0, my: 0, dash: false, ult: false };
        let gx = 0, gy = 0, tgt = null;
        if (G.phase === 'doors') { if (G.botDoor === undefined) G.botDoor = Math.floor(Math.random() * G.doors.length); tgt = G.doors[G.botDoor] || G.doors[0]; }
        else if (G.obj === 'collect') tgt = G.sparks.filter(s => !s.got).sort((a, b) => dist(a, pl) - dist(b, pl))[0];
        else if (G.obj === 'capture') tgt = G.zone;
        else if (G.obj === 'defend') tgt = dist(pl, G.crystal) > 150 ? G.crystal : null;
        else if (G.obj === 'hunt') { const b = G.enemies.find(e => e.beast); if (b && dist(b, pl) > 220) tgt = b; }
        if (G.phase === 'clear' || G.phase === 'reward') tgt = null;
        const o = run.coop ? PL[1 - i] : null; if (o && o.down) tgt = o;
        if (tgt) { const d = dist(tgt, pl) || 1; gx = (tgt.x - pl.x) / d; gy = (tgt.y - pl.y) / d; }
        let ax = 0, ay = 0, close = false;
        for (const e of G.enemies) { const dx = pl.x - e.x, dy = pl.y - e.y, d2 = dx * dx + dy * dy; if (d2 < 220 * 220) { const d = Math.sqrt(d2) || 1; ax += dx / d * (220 - d) / 220 * 2.2; ay += dy / d * (220 - d) / 220 * 2.2; if (d < e.r + 30) close = true; } }
        for (const b of G.eb) { const dx = pl.x - b.x, dy = pl.y - b.y, d = Math.hypot(dx, dy); if (d < 90) { ax += dx / d * 1.5; ay += dy / d * 1.5; if (d < 30) close = true; } }
        const cx0 = WORLD / 2 - pl.x, cy0 = WORLD / 2 - pl.y, cd = Math.hypot(cx0, cy0) || 1; if (cd > 700) { ax += cx0 / cd * .8; ay += cy0 / cd * .8; }
        let mx = gx + ax + Math.cos(G.now * .7 + i) * .25, my = gy + ay + Math.sin(G.now * .7 + i) * .25;
        const l = Math.hypot(mx, my) || 1;
        return { mx: mx / l, my: my / l, dash: close && Math.random() < .5, ult: pl.ult >= 100 && G.enemies.length > 8 };
      };
      window.BOT.menu = () => { // click through menus sensibly
        const bs = [...ui.querySelectorAll('button:not([disabled])')];
        const bad = /Give up|Save &|Reroll|Title|Spend shards|Claim|Tab|Volume|Music|shake|Recruit|Sell|empty|buddy|Squad pack|front|back|^\s*P[12]\b/;
        const skip = document.querySelector('#bcv') && bs.find(b => /Skip/.test(b.textContent)); if (skip) return skip.click();
        if (/Pack Machine/.test(ui.innerText)) { const bp = bs.find(b => /Basic Pack/.test(b.textContent) && /gold/.test(b.textContent)); if (bp && !BOT.boughtPack) { BOT.boughtPack = true; BOT.packs = (BOT.packs || 0) + 1; return bp.click(); } BOT.boughtPack = false; const lv = bs.find(b => /Leave/.test(b.textContent)); if (lv) return lv.click(); return; }
        if (document.querySelector('.pullrow')) { BOT.cards = (BOT.cards || 0) + 1; const b = bs.find(b => /Reveal all|Continue/.test(b.textContent)); if (b) return b.click(); }
        if (/Pick a tactic/.test(ui.innerText) && !BOT.tac) { BOT.tac = true; const tb = bs.filter(b => /All-Out|Hold|Focus|Ambush|Second Wind/.test(b.textContent)); if (tb.length) return tb[Math.floor(Math.random() * tb.length)].click(); }
        if (/Pick a tactic/.test(ui.innerText)) BOT.tac = false;
        const leave = bs.find(b => /Leave shop/.test(b.textContent));
        if (leave && !bs.some(b => b.classList.contains('card'))) return leave.click();
        const card = bs.find(b => b.classList.contains('card')) || bs.find(b => b.classList.contains('opt') && !bad.test(b.textContent)) || bs.find(b => !bad.test(b.textContent));
        if (card) card.click();
      };
      window.BOT.start = () => { const chars = coop ? [pickC(), pickC()] : [pickC()]; window.BOT.chars = chars; newRun(chars, 0, false); };
      window.BOT.start();
    }, [modeArg === 'coop']);
    const t0 = Date.now(); let lastRoom = -1, stuckSince = Date.now();
    while (Date.now() - t0 < maxMin * 60e3) {
      const st = await page.evaluate(() => {
        for (let n = 0; n < 900; n++) { // 30 simulated seconds per call
          if (!run) break;
          if (inputLock > performance.now()) inputLock = 0;
          if (mode === 'fight' && !paused && G) { const n0 = G.projs.length; update(1 / 30); BOT.simT += 1 / 30; if (G && G.comps && G.comps.some(c => c.t > c.d.cd * 1.25)) BOT.comp = (BOT.comp || 0) + 1; }
          else if (ui.className !== 'hidden') { BOT.menu(); }
          else if (mode === 'dead') break;
        }
        const dbg = { hid: BOT.log.slice(0, 2), paused, ui: ui.className, lvOpen, lvQueue, clearT: G && G.clearT, pick: G && G.pick.length, btns: [...ui.querySelectorAll('button')].map(b => (b.disabled ? '-' : '+') + b.textContent.trim().slice(0, 20)).slice(0, 6) };
        return run ? { dbg, act: run.act, room: run.room, lvl: run.level, mode, phase: G && G.phase, obj: G && G.obj, hp: PL.map(p => Math.round(p.hp)), en: G ? G.enemies.length : 0, sim: Math.round(BOT.simT) } : { over: true, sim: Math.round(BOT.simT) };
      });
      if (st.over) break;
      if (st.mode === 'dead') { await new Promise(r => setTimeout(r, 1300)); continue; }
      if (st.dbg && st.dbg.paused) await new Promise(r => setTimeout(r, 120)); // menus with real-time animations (casino reels, squad battles)
      const key = st.act * 100 + st.room; if (key !== lastRoom) { lastRoom = key; stuckSince = Date.now(); }
      if (Date.now() - stuckSince > 90e3) { errors.push('STUCK in ' + JSON.stringify(st)); break; }
    }
    const res = await page.evaluate(() => ({ chars: BOT.chars, stats: { compShots: BOT.comp || 0, skirm: BOT.sk || 'none', packs: BOT.packs || 0, gems: S.gems, owned: Object.keys(S.col).length, runs: S.stats.runs, bosses: S.stats.bosses, kills: S.stats.kills, bestAct: S.stats.bestAct, wins: S.stats.wins, ults: S.stats.ults, obj: S.stats.objectives, revives: S.stats.revives }, simMin: +(BOT.simT / 60).toFixed(1), endedAt: run ? { act: run.act, room: run.room } : 'run over' }));
    results.push({ run: k + 1, ...res, errors: [...new Set(errors)].slice(0, 8) });
    console.log(JSON.stringify(results[results.length - 1]));
    await page.close();
  }
  await browser.close();
})();
