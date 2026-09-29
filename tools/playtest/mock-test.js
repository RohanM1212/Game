// Offline engine test for the Book Game: swaps the AI for a scripted fake, so it needs no keys and uses no quota.
// Checks discovery, problems (obstacles), enemy intents, splitting up, team-ups, pranks, backlash and the finale.
// node tools/playtest/mock-test.js [--shots]
const path = require('path');
let chromium; try { ({ chromium } = require('playwright')); } catch (e) { ({ chromium } = require('/opt/node22/lib/node_modules/playwright')); }
const CHROME = require('fs').existsSync('/opt/pw-browsers/chromium-1194/chrome-linux/chrome') ? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' : undefined;
const GAME = path.resolve(__dirname, '../../book-game.html');
const shots = process.argv.includes('--shots');
const WORLD = {
  opening: 'You blink awake on a squeaky metal platform in Gear Plaza. Steam curls around your feet.',
  start: { name: 'Gear Plaza', objects: [{ name: 'spare spring', trait: 'metal' }, { name: 'oil lantern', trait: 'fire' }], env: [] },
  places: [{ name: 'Steam Factory', hint: 'tall chimneys puffing pink steam' }, { name: 'Brass Market', hint: 'noisy stalls' }, { name: 'Oily Alley', hint: 'dark and slick' },
    { name: 'Tram Station', hint: 'a rusty tram' }, { name: 'Copper Rooftop', hint: 'up high' }, { name: "Inventor's Workshop", hint: 'sparks fly from the windows' }],
  nearby: ['Brass Market', 'Tram Station'],
  locals: ['Gus the goblin — wants his hat back', 'Madame Cog — sells springs', 'a sad robot — lost its key'],
  dangers: ['rust rats', 'a runaway steam cart'],
  goalPlace: "Inventor's Workshop", goalSecret: 'The inventor is stuck inside.',
  obstacles: [{ place: 'Oily Alley', name: 'the welded gate', what: 'A tall iron gate, welded shut and hot from the pipes.', facets: ['locked', 'hot'] },
    { place: "Inventor's Workshop", name: 'the snoring steam dragon', what: 'A huge steam dragon sleeps across the doorway, snoring hot clouds.', facets: ['sleeping', 'hot', 'heavy'] }],
  signs: ['a spring bounces past on its own', 'someone shouts for help far away', 'pink steam puffs overhead', 'a bolt falls from the sky'],
};
(async () => {
  const browser = await chromium.launch({ executablePath: CHROME });
  const page = await browser.newPage({ viewport: { width: 1500, height: 950 } });
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.addInitScript(() => localStorage.setItem('bookGameKeys_v1', JSON.stringify({ groq: 'fake', gemini: '', on: true })));
  await page.goto('file://' + GAME);
  await page.evaluate(W => {
    window.MOCK = { next: null, world: W, calls: [] };
    window.ai = async (role, messages) => { // the fake AI
      const sys = messages[0].content;
      if (sys.includes('WORLD BUILDER')) return { text: JSON.stringify(MOCK.world), p: 'mock', m: 'mock' };
      if (role === 'story') return { text: JSON.stringify({ story: 'Something happens.', title: 'A Test', panels: ['They tested.'], best: 'testing' }), p: 'mock', m: 'mock' };
      const u = messages[1].content; MOCK.calls.push(u);
      const j = Object.assign({ approach: 'knowledge', verdict: 'natural', creativity: 3, powers: [], objects: [], says: 'You do it.', progress: 0 }, MOCK.next || {});
      MOCK.next = null;
      return { text: JSON.stringify(j), p: 'mock', m: 'mock' };
    };
  }, WORLD);
  const say = async (text, j) => { await page.evaluate(([t, j]) => { MOCK.next = j; return act(t); }, [text, j]); await page.waitForFunction(() => !BUSY); };
  const st = () => page.evaluate(() => { const L = R.level; return { cur: R.players[R.cur].name, at: R.players.map(p => p.at), place: L.cells[L.x].place, ch: L.ch ? { kind: L.ch.kind, title: L.ch.title, at: L.ch.at, meter: L.ch.meter && Math.round(L.ch.meter.v / L.ch.meter.goal * 100), threats: L.ch.threats.map(t => t.n + ':' + t.hp + ':' + t.intent) } : null, known: (L.world.places || []).filter(p => p.known).map(p => p.name), prog: L.prog, hp: R.players.map(p => p.hp), log: L.log.slice(-6).map(l => l.h.replace(/<[^>]+>/g, '')) }; });
  const shot = async n => { if (shots) { await page.evaluate(() => render()); await page.waitForTimeout(150); await page.screenshot({ path: path.resolve(__dirname, 'out', 'mock-' + n + '.png'), fullPage: true }); } };
  let fails = 0; const ok = (c, m, extra) => { console.log((c ? '✅ ' : '❌ ') + m + (c || !extra ? '' : '  → ' + JSON.stringify(extra))); if (!c) fails++; };
  require('fs').mkdirSync(path.resolve(__dirname, 'out'), { recursive: true });

  // --- start a 2-player page on the Clockwork City
  await page.evaluate(() => { S.tutorialDone = true; newRun(['Mia', 'Sam'], 'coop'); chooseBook('clock'); R.players[0].powers = [{ id: 'fire', lvl: 3 }]; R.players[1].powers = [{ id: 'ice', lvl: 3 }]; render(); });
  await page.waitForFunction(() => !BUSY && R.level.world);
  let s = await st();
  ok(s.known.length === 2 && !s.known.includes("Inventor's Workshop"), 'you only know 2 places at the start (never the goal)', s.known);
  const panel = await page.evaluate(() => document.querySelector('.scene').innerText);
  ok(!/can see from here/i.test(panel) && !/Workshop|Oily|Copper|Steam Factory/.test(panel), 'the journal does not list places you have not found', panel.slice(0, 300));
  await shot('start');

  // --- discovery
  await say('I climb the lamp post and look around', { approach: 'knowledge', world: 'scout', says: 'From up high you spot a dark, slick alley.', discovered: ['Oily Alley'], progress: 1 });
  s = await st(); ok(s.known.includes('Oily Alley'), 'looking around reveals a new place', s.known);
  ok(s.cur === 'Sam', 'turns rotate to Sam', s.cur);

  // --- Sam stays, Mia goes alone to a place with a problem
  await say('I study the spare spring', { approach: 'knowledge', says: 'It is very bouncy.' }); // Sam
  await say('I go to Oily Alley', { approach: 'move', goto: 'Oily Alley', says: 'You slide into the alley.' }); // Mia
  s = await st();
  ok(s.at[0] !== s.at[1], 'Mia went alone; Sam stayed', s.at);
  ok(s.ch && s.ch.kind === 'obs' && /welded gate/i.test(s.ch.title), 'the problem at Oily Alley starts', s.ch);
  ok(s.cur === 'Sam', "it's Sam's turn, far away", s.cur);
  const samPanel = await page.evaluate(() => document.querySelector('.scene').innerText);
  ok(/happening at/i.test(samPanel), 'Sam sees that Mia is dealing with something elsewhere', samPanel.slice(0, 200));
  await shot('split');
  await say('I look around the plaza', { approach: 'knowledge', says: 'Pigeons and pipes.' }); // Sam explores during Mia's scene
  s = await st(); ok(s.cur === 'Mia' && s.ch, "Sam's explore counted as his turn; back to Mia at the gate", s);
  await shot('obstacle');
  // a plan that doesn't fit the facts barely dents it
  const m0 = s.ch.meter;
  await say('I punch the gate', { approach: 'force', solves: 0, creativity: 1, target: null });
  s = await st(); const dumb = s.ch.meter - m0;
  ok(dumb <= 12, 'punching a welded, hot gate barely dents it', { dumb, log: s.log });
  ok(s.log.some(l => /doesn't really deal/.test(l)), 'the game says it does not really deal with it');
  // a reckless stunt stings
  const hp0 = s.hp[0];
  await say('I lick the hot gate', { approach: 'knowledge', solves: 0, backlash: 2 });
  s = await st(); ok(s.hp[0] < hp0, 'a reckless stunt hurts you (backlash)', { hp0, hp: s.hp[0] });
  // a plan that fits the facts works
  for (let k = 0; k < 8 && s.ch && s.ch.kind === 'obs'; k++) {
    if (s.cur !== 'Mia') await say('I look at the tram tracks', { approach: 'knowledge' });
    else await say('I melt the weld with a focused fire beam', { approach: 'force', powers: ['fire'], shape: 'beam', solves: 3, creativity: 4 });
    s = await st();
  }
  ok(!s.ch || s.ch.kind !== 'obs', 'a plan that fits the facts clears the problem', s.ch);
  ok(await page.evaluate(() => R.level.world.obstacles.find(o => /welded/.test(o.name)).cleared), 'the problem stays solved');

  // --- together again, team-up, prank, help
  await page.evaluate(() => { R.cur = 1; render(); });
  await say('I go to Oily Alley', { approach: 'move', goto: 'Oily Alley', says: 'You find Mia.' });
  s = await st(); ok(s.at[0] === s.at[1], 'Sam walks over to Mia', s.at);
  await page.evaluate(() => { R.cur = 0; render(); });
  const chips = await page.evaluate(() => document.querySelector('.chips').innerText);
  ok(/team up with Sam/.test(chips), 'team-up chip shows when a friend is here', chips.slice(0, 200));
  await say('Sam and I team up: I heat the oil and Sam freezes it into a slide', { approach: 'trick', powers: ['fire', 'ice'], teamUp: 'Sam', creativity: 5, progress: 2 });
  s = await st(); ok(s.log.some(l => /TEAM-UP/.test(l)), 'team-up combines both players', s.log);
  ok(s.cur === 'Mia', "a team-up uses Sam's turn too (back to Mia)", s.cur);
  const samHp = s.hp[1];
  await say('I dump a bucket of oil on Sam', { approach: 'trick', teammate: { name: 'Sam', effect: 'prank' }, says: 'Sam is now very shiny.' });
  s = await st(); ok(s.log.some(l => /pranked/.test(l)) && !s.log.some(l => /😬/.test(l)), 'a prank is harmless fun', s.log);
  await say('I hug Mia to cheer her up', { approach: 'heal', teammate: { name: 'Mia', effect: 'help' } }); // Sam
  s = await st(); ok(s.log.some(l => /feels ready/.test(l)), 'helping a friend boosts them', s.log);
  await say('I throw Sam into the air', { approach: 'force', teammate: { name: 'Sam', effect: 'hurt' } }); // Mia
  s = await st(); ok(s.log.some(l => /😬 Sam −\d+ HP/.test(l)), 'really hurting a friend does hurt (a little)', s.log);

  // --- a fight with intents
  await page.evaluate(() => { R.cur = 0; openTrouble('enc'); const t = R.level.ch.threats[0]; t.intent = 'heavy'; t.aim = 1; render(); });
  s = await st(); ok(s.ch && s.ch.kind === 'enc' && s.ch.threats.every(t => t.split(':')[2] !== 'undefined'), 'enemies show what they will do', s.ch);
  const fightTxt = await page.evaluate(() => document.querySelector('.scene').innerText);
  ok(/BIG hit on Sam/.test(fightTxt), 'the panel warns about the big hit on Sam', fightTxt.slice(0, 400));
  await shot('fight');
  await say('I throw sparks in its eyes', { approach: 'trick', target: s.ch.threats[0].split(':')[0], solves: 3 }); // Mia stuns it
  const before = (await st()).hp[1];
  await say('I study the gears', { approach: 'knowledge' }); // Sam
  s = await st();
  ok(s.log.some(l => /dazed/.test(l)) || s.hp[1] >= before - 5, 'stunning the enemy ruins its big hit', { log: s.log, before, after: s.hp[1] });
  // grab: an enemy steals an item, beating it returns it
  await page.evaluate(() => { const C = R.level.ch; if (!C) return; const t = C.threats[0]; R.players[1].items.push({ id: 'rope', uses: 2 }); t.intent = 'grab'; t.aim = 1; t.aimItem = 'rope'; t.stun = 0; runIntents(C); });
  ok(await page.evaluate(() => R.level.ch && R.level.ch.threats[0].loot && R.level.ch.threats[0].loot.length === 1 && !R.players[1].items.some(i => i.id === 'rope')), 'an enemy can snatch your item');
  await page.evaluate(() => { const C = R.level.ch; C.threats.forEach(t => t.hp = 0); checkWin(); });
  ok(await page.evaluate(() => R.players[1].items.some(i => i.id === 'rope')), 'beating it gives your item back');

  // --- the goal: find it, solve its problem, the finale starts
  await page.evaluate(() => { R.cur = 0; render(); });
  await say('I ask the sad robot where the sparks come from', { approach: 'persuade', says: 'The robot points at a workshop throwing sparks.', discovered: ["Inventor's Workshop"] });
  await page.evaluate(() => { R.cur = 0; });
  await say("We all go to the Inventor's Workshop", { approach: 'move', goto: "Inventor's Workshop", says: 'A dragon snores in the doorway.' });
  s = await st(); ok(s.at[0] === s.at[1] && s.ch && /dragon/i.test(s.ch.title), '"we go" moves everyone; the goal\'s problem blocks the way', s);
  for (let k = 0; k < 12 && s.ch && s.ch.kind === 'obs'; k++) { await say('We tiptoe past on frozen slippers while I keep its snores warm', { approach: 'sneak', solves: 3, creativity: 4 }); s = await st(); }
  ok(s.ch && (s.ch.kind === 'obj' || s.ch.kind === 'boss'), 'solving the goal\'s problem opens the heart of the page', s.ch);
  await shot('finale');
  ok(!errors.length, 'no page errors', errors);
  console.log(fails ? `${fails} FAILED` : 'ALL PASSED');
  await browser.close();
  process.exit(fails ? 1 : 0);
})();
