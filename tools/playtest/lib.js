// Shared helpers for the Book Game robot testers. Runs the real game in headless Chromium with the REAL free AI.
// Needs: node 18+, playwright, and GROQ_API_KEY and/or GEMINI_API_KEY in the environment.
const path = require('path');
let chromium;
try { ({ chromium } = require('playwright')); } catch (e) { ({ chromium } = require('/opt/node22/lib/node_modules/playwright')); }
const GAME = process.env.GAME || path.resolve(__dirname, '../../book-game.html');
const CHROME = process.env.CHROME || (require('fs').existsSync('/opt/pw-browsers/chromium-1194/chrome-linux/chrome') ? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' : undefined);
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function openGame() {
  const browser = await chromium.launch({ executablePath: CHROME, proxy: process.env.HTTPS_PROXY ? { server: process.env.HTTPS_PROXY } : undefined });
  const page = await (await browser.newContext({ ignoreHTTPSErrors: true })).newPage();
  const errors = [];
  page.on('pageerror', e => errors.push('PAGE ERROR: ' + e.message));
  await page.addInitScript(([g, m]) => localStorage.setItem('bookGameKeys_v1', JSON.stringify({ groq: g || '', gemini: m || '', on: true })), [process.env.GROQ_API_KEY, process.env.GEMINI_API_KEY]);
  await page.goto('file://' + GAME);
  return { browser, page, errors };
}
// start a page: book id (jungle, sunken, school, sky, candy, clock), optional power ids, tutorial flag
async function startPage(page, { book, powers, tutorial = false, names = ['Mia'], entry } = {}) {
  await page.evaluate(([b, pw, tut, names, entry]) => {
    S.tutorialDone = !tut; newRun(names, 'coop'); chooseBook(b || R.books[0]);
    if (entry) { R.plan[0] = entry; R.page = 0; startPage(); }
    if (pw) R.players.forEach(p => { p.powers = pw.map(id => ({ id, lvl: 1 })); });
    render();
  }, [book, powers, tutorial, names, entry]);
  await page.waitForFunction(() => !BUSY && (R.level.kind !== 'open' || R.level.world), null, { timeout: 120000 });
}
async function act(page, text) {
  await page.evaluate(t => act(t), text);
  await page.waitForFunction(() => !BUSY, null, { timeout: 120000 });
}
const logLines = page => page.evaluate(() => R.level ? R.level.log.map(l => ({ c: l.c, t: l.h.replace(/<[^>]+>/g, '') })) : []);
const state = page => page.evaluate(() => {
  const L = R.level, p = R.players[R.cur] || R.players[0];
  return { screen: R.screen, kind: L && L.kind, place: L && L.cells ? L.cells[L.y * L.w + L.x].place : null,
    objs: L ? (L.ch ? L.ch.objs : L.cells ? L.cells[L.y * L.w + L.x].objs : []).map(o => o.n) : [],
    fight: L && L.ch ? { title: L.ch.title, hp: L.ch.threats.map(t => t.hp), boss: L.ch.boss ? L.ch.boss.hp : null } : null,
    items: p.items.map(it => itemDef(it).n), moves: (p.moves || []).map(m => m.name), hp: p.hp, en: p.en,
    goalTitle: L && L.entry ? (L.entry.t === 'obj' ? OBJ[L.entry.o].n : L.entry.b ? BOSSES[L.entry.b].n : '') : '',
    people: (R.bm && R.bm.chars || []).map(c => c.name + ':' + c.feeling), via: AIC.last && AIC.last.m };
});
// rules every turn must follow — each one is a bug the player reported once
async function invariants(page, errors, fromLine = 0) {
  const probs = errors.splice(0);
  const lines = (await logLines(page)).slice(fromLine);
  const st = await state(page);
  const bad = await page.evaluate(() => { const L = R.level; if (!L || !L.cells) return []; return L.cells.flatMap(c => c.objs).concat(L.ch ? L.ch.objs : []).filter(o => !isThing(o.n)).map(o => o.n); });
  if (bad.length) probs.push('A sound/smell/air became an object: ' + bad.join(', '));
  lines.forEach(l => {
    if (/Something went wrong/.test(l.t)) probs.push('Crash: ' + l.t);
    if (/is used up\./.test(l.t)) probs.push('Thing "used up" just by using it: ' + l.t);
    if (st.kind === 'open' && /Progress \+|→ \d+%/.test(l.t)) probs.push('Progress numbers shown: ' + l.t);
    if (st.kind === 'open' && l.c === 'nar' && /\b(hint|clue)s?\b/i.test(l.t)) probs.push('Narration says hint/clue: ' + l.t);
    if (st.kind === 'open' && /Now you know what this page wants/.test(l.t)) probs.push('Goal announced: ' + l.t);
  });
  return probs;
}
async function transcript(page) { return (await logLines(page)).map(l => `[${l.c}] ${l.t}`).join('\n'); }
// a free model for the robot player / critic (not the game's own chain)
async function llm(prompt, { json = false, max = 600, model = process.env.TESTER_MODEL || 'openai/gpt-oss-20b' } = {}) {
  const useGemini = !process.env.GROQ_API_KEY;
  const url = useGemini ? 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions' : 'https://api.groq.com/openai/v1/chat/completions';
  const body = { model: useGemini ? 'gemini-3.5-flash-lite' : model, max_tokens: max, messages: [{ role: 'user', content: prompt }], reasoning_effort: 'low' };
  if (json) body.response_format = { type: 'json_object' };
  for (let k = 0; k < 4; k++) {
    const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + (useGemini ? process.env.GEMINI_API_KEY : process.env.GROQ_API_KEY) }, body: JSON.stringify(body) }).catch(() => null);
    if (r && r.ok) { const d = await r.json(); const t = d.choices && d.choices[0].message.content; if (t) return t.trim(); }
    await sleep(8000 * (k + 1));
  }
  if (!useGemini && process.env.GEMINI_API_KEY) { // Groq busy: try Gemini once
    const r = await fetch('https://generativelanguage.googleapis.com/v1beta/openai/chat/completions', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + process.env.GEMINI_API_KEY }, body: JSON.stringify({ ...body, model: 'gemini-3.5-flash-lite' }) }).catch(() => null);
    if (r && r.ok) { const d = await r.json(); const t = d.choices && d.choices[0].message.content; if (t) return t.trim(); }
  }
  return '';
}
module.exports = { openGame, startPage, act, state, logLines, invariants, transcript, llm, sleep };
