// Connects two browser windows with the copy-paste codes and plays a bit of online co-op.
const path = require('path');
let chromium; try { ({ chromium } = require('playwright')); } catch (e) { ({ chromium } = require('/opt/node22/lib/node_modules/playwright')); }
const CHROME = require('fs').existsSync('/opt/pw-browsers/chromium-1194/chrome-linux/chrome') ? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' : undefined;
const GAME = 'file://' + path.resolve(__dirname, '../../rift-runners.html');
const sleep = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const browser = await chromium.launch({ executablePath: CHROME });
  const host = await browser.newPage({ viewport: { width: 1100, height: 650 } }), guest = await browser.newPage({ viewport: { width: 1100, height: 650 } });
  const errs = []; for (const [n, p] of [['host', host], ['guest', guest]]) { p.on('pageerror', e => errs.push(n + ': ' + e.message)); await p.goto(GAME); await p.evaluate(() => { S.seenHelp = true; showTitle(); }); }
  await host.evaluate(() => hostFlow()); await host.waitForFunction(() => $('#c1') && $('#c1').value.startsWith('RRH:'), null, { timeout: 15000 });
  const offer = await host.evaluate(() => $('#c1').value);
  await guest.evaluate(() => joinFlow()); await guest.evaluate(v => { $('#c1').value = v; }, offer);
  await guest.click('button.opt'); await guest.waitForFunction(() => $('#c2') && $('#c2').value.startsWith('RRJ:'), null, { timeout: 15000 });
  const answer = await guest.evaluate(() => $('#c2').value);
  await host.evaluate(v => { $('#c2').value = v; }, answer); await host.click('button.opt');
  await host.waitForFunction(() => NET.ok, null, { timeout: 20000 }); await guest.waitForFunction(() => NET.ok, null, { timeout: 20000 });
  console.log('connected ✔');
  await sleep(500);
  await host.keyboard.press('1'); await guest.keyboard.press('2'); // each picks a runner
  await sleep(1000);
  console.log('debug:', await host.evaluate(() => JSON.stringify({ chars: netChars, ui: ui.innerText.slice(0, 80), run: !!run })), await guest.evaluate(() => JSON.stringify({ ui: ui.innerText.slice(0, 80) })));
  await host.waitForFunction(() => run && run.online && mode === 'fight', null, { timeout: 10000 });
  await guest.waitForFunction(() => G && G.remote, null, { timeout: 10000 });
  console.log('run started ✔', await host.evaluate(() => run.players.map(p => p.char)));
  // guest walks right for a second: host should see P2 move
  const x0 = await host.evaluate(() => PL[1].x);
  await guest.keyboard.down('KeyD'); await sleep(1200); await guest.keyboard.up('KeyD');
  const x1 = await host.evaluate(() => PL[1].x);
  console.log('guest input moves P2 on host:', Math.round(x1 - x0) > 50 ? '✔' : '✘', Math.round(x1 - x0));
  // host picks a door; both should be in a fight
  await host.keyboard.press('1'); await sleep(1500);
  console.log('in a room:', await host.evaluate(() => G.phase), '| guest sees:', await guest.evaluate(() => G.phase + ' enemies=' + G.enemies.length));
  await host.screenshot({ path: path.resolve(__dirname, 'shot-online-host.png') }); await guest.screenshot({ path: path.resolve(__dirname, 'shot-online-guest.png') });
  // force a level-up: guest should get its own cards and be able to pick
  await host.evaluate(() => addXp(xpNeed(run.level) + 1)); await sleep(800);
  const gcards = await guest.evaluate(() => [...ui.querySelectorAll('button.card:not([disabled])')].length);
  console.log('guest level-up cards:', gcards);
  await host.keyboard.press('1'); await guest.keyboard.press('1'); await sleep(800);
  console.log('both picked, host resumed:', await host.evaluate(() => !paused && lvQueue === 0), '| P2 weapons/passives:', await host.evaluate(() => JSON.stringify([run.players[1].weapons.map(w => w.id + w.lvl), run.players[1].passives])));
  console.log('snapshot size (bytes):', await host.evaluate(() => JSON.stringify(netSnap()).length));
  console.log('errors:', errs.length ? errs : 'none');
  await browser.close();
})();
