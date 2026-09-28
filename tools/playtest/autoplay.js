// node tools/playtest/autoplay.js [persona] [turns] [book]
// A robot player with a personality plays a page with the real AI; then a robot CRITIC reads the whole
// transcript and lists anything a real kid would find wrong, weird or confusing. Report → tools/playtest/out/
const fs = require('fs'), path = require('path');
const { openGame, startPage, act, state, invariants, transcript, llm, sleep } = require('./lib');
const PERSONAS = {
  asker: 'You ask lots of questions ("what do I see?", "who is that?", "what happened to X?") and then act on the answers.',
  crafter: 'You love making things from what is around you (weapons, tools, traps), then using them, and naming your best moves ("I call that ...").',
  breaker: 'You test the rules: sometimes you try impossible things ("I find a helicopter", "I already have the key"), refer back to things that happened earlier, and try weird combos.',
  lazy: 'You type very short things like "go", "attack", "look", "yes", "run", sometimes with typos.',
  hero: 'You try to work out what is going on in this place and fix it cleverly, talking to people and using your powers.',
};
const CRITIC = `You are a sharp QA tester for "The Book Game", a text adventure for kids where an AI narrator reacts to anything the player types.
Read the TRANSCRIPT ([you] = player, [nar] = narrator, [eff]/[note]/[big]/[bad] = game messages). List every real problem a kid would notice:
contradictions with earlier lines, things appearing from nowhere or vanishing, the game ignoring or misreading what the player said, questions not answered,
sounds/smells treated as objects, the narrator switching between "you" and the player's name, numbers or game jargon in the story, confusing or fancy words,
repetitive narration, the game giving convenient directions/handouts, unfair verdicts (a clearly fine idea called impossible, or a clearly impossible one allowed), crashes.
NOTE: short mysterious "signs" happening nearby (footprints, a distant voice, someone running past) are INTENTIONAL — they are how the page shows its secret goal without telling it. Only flag them if they contradict something.
Output JSON: {"issues": [{"severity": "high|medium|low", "quote": "the exact line (short)", "problem": "what is wrong, max 25 words", "fix_idea": "max 20 words"}], "fun": 1-5, "fun_why": "max 25 words"}. Only real problems; [] if none.`;
(async () => {
  const persona = process.argv[2] || 'hero', turns = +process.argv[3] || 15, book = process.argv[4];
  const { browser, page, errors } = await openGame();
  await startPage(page, { book });
  const hist = [], auto = []; let seenLines = 0;
  for (let t = 0; t < turns; t++) {
    const st = await state(page);
    if (st.screen !== 'level') break;
    const panel = await page.evaluate(() => (document.querySelector('.scene') || {}).innerText || '');
    const recent = (await transcript(page)).split('\n').slice(-14).join('\n');
    const a = (await llm(`You are an 11-year-old playing a text adventure. ${PERSONAS[persona]}\nYour stuff: ${JSON.stringify({ hp: st.hp, items: st.items, moves: st.moves })}\nSide panel:\n${panel.slice(0, 900)}\n\nRecent story:\n${recent}\n\nYour last actions: ${hist.slice(-4).join(' | ')}\nWrite ONLY your next action (max 25 words).`, { max: 400 })).replace(/^["“]|["”]$/g, '') || 'look around';
    hist.push(a);
    await act(page, a);
    auto.push(...(await invariants(page, errors, seenLines)).map(x => `turn ${t + 1}: ${x}`));
    seenLines = await page.evaluate(() => R.level ? R.level.log.length : 0);
    await sleep(+process.env.PACE || 4000);
  }
  const tr = await transcript(page);
  await sleep(20000); // let the free per-minute budget refill after the game's own calls
  let crit = { issues: [], fun: '?', fun_why: '⚠️ The critic could not run (AI busy) — read the transcript yourself.' };
  try { const t = await llm(CRITIC + '\n\nTRANSCRIPT:\n' + tr.slice(-9000), { json: true, max: 1500, model: 'openai/gpt-oss-120b' }); if (t) crit = JSON.parse(t.slice(t.indexOf('{'), t.lastIndexOf('}') + 1)); } catch (e) {}
  const out = path.join(__dirname, 'out'); fs.mkdirSync(out, { recursive: true });
  const file = path.join(out, `${new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-')}-${persona}.md`);
  const md = [`# Playtest: ${persona} (${turns} turns)`, '', `Fun: ${crit.fun || '?'}/5 — ${crit.fun_why || ''}`, '', '## Rule checks', ...(auto.length ? auto.map(x => '- ' + x) : ['- all passed']), '',
    '## Critic', ...((crit.issues || []).map(i => `- **${i.severity}** — "${i.quote}" → ${i.problem} _(fix: ${i.fix_idea})_`)), '', '## Transcript', '```', tr, '```'].join('\n');
  fs.writeFileSync(file, md);
  console.log(md.split('## Transcript')[0]); console.log('Full report:', file);
  await browser.close();
})();
