// Screenshots of key moments (uses the bot's movement brain from bot.js logic, simplified)
const path = require('path');
let chromium; try { ({ chromium } = require('playwright')); } catch (e) { ({ chromium } = require('/opt/node22/lib/node_modules/playwright')); }
const CHROME = require('fs').existsSync('/opt/pw-browsers/chromium-1194/chrome-linux/chrome') ? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' : undefined;
(async () => {
  const browser = await chromium.launch({ executablePath: CHROME });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errs = []; page.on('pageerror', e => errs.push(e.message));
  await page.goto('file://' + path.resolve(__dirname, '../../rift-runners.html'));
  const shot = async n => { await page.waitForTimeout(250); await page.screenshot({ path: path.resolve(__dirname, 'shot-' + n + '.png') }); };
  await page.evaluate(() => { S.seenHelp = true; showTitle(); }); await shot('title');
  await page.evaluate(() => { S.chars = Object.fromEntries(Object.keys(CHARS).map(k => [k, true])); newRun(['mage', 'bomber'], 0, false); });
  await shot('doors');
  const sim = async (sec, setup) => page.evaluate(([sec, setup]) => { if (setup) eval(setup); window.readInput = i => { const pl = PL[i]; const a = G.now * .8 + i * 3; return { mx: Math.cos(a), my: Math.sin(a), dash: false, ult: pl.ult >= 100 }; }; for (let n = 0; n < sec * 30 && mode === 'fight' && !paused; n++) update(1 / 30); render(); }, [sec, setup]);
  await sim(0, "startRoom({ t: 'fight', o: 'capture' })"); await sim(22); await shot('fight-capture');
  await page.evaluate(() => { run.xp = xpNeed(run.level) - .1; addXp(1); }); await shot('levelup-coop');
  await page.evaluate(() => { pickLv(0, 0); pickLv(1, 0); });
  await page.evaluate(() => { run.act = 2; run.room = 3; G = null; mode = 'menu'; }); await sim(0, "startRoom({ t: 'fight', o: 'defend' })"); await sim(18); await shot('fight-lava-defend');
  await page.evaluate(() => { run.act = 4; G = null; mode = 'menu'; }); await sim(0, "startRoom({ t: 'elite', o: 'survive' })"); await sim(15); await shot('fight-dark');
  await page.evaluate(() => { run.act = 1; G = null; mode = 'menu'; }); await sim(0, "startRoom({ t: 'boss' })"); await sim(10); await shot('boss');
  console.log('errors:', errs.length ? errs : 'none');
  await browser.close();
})();
