# Games

Two single-file games that run offline in any browser, including on a school Chromebook.
Email yourself the `.html` file, download it, and open it from the Files app.

## 📖 The Book Game — `book-game.html`
An imagination-driven text adventure with a **free AI narrator**. Pick one of three mysterious books, get a random power,
and **type anything you want to do**. The AI Judge rules each action ✅ Natural, 🌀 Stretch (weaker, riskier, needs a
higher power level) or ❌ Impossible for *your* power at *your* level in *this* place. The game engine does all the math,
so the AI can't be talked into "I win".

- **Setup (once):** get free keys from [Groq](https://console.groq.com/keys) (main) and [Google AI Studio](https://aistudio.google.com/apikey) (backup).
  Open the game in Chrome, go to ⚙️ Settings, paste them, and press **Save & Test AI**.
  Keys stay in your browser only. They're never in backup codes or bug reports.
- **Free-limit fallback:** if one model hits its free limit, the game automatically switches to the next one (Groq GPT-OSS / Qwen, then Gemini).
- **Open-world pages:** no map, no set way through, and nobody tells you what to do. You wake up somewhere strange; look around, ask questions, talk to people, work out what's wrong, and fix it your way. The world remembers what you did. (With the AI off, pages use the classic grid map.)
- **Make things and name your moves:** craft items from what's around you (they last and wear out), and name a clever move ("I call that Frost Fog") to use it again.
- **The book remembers:** people you meet remember how you treated them and come back later; your choices change later pages; win by force, friendship, trickery or cleverness for different endings; get a funny comic recap after every page.
- **AI that plays fair:** creative ideas are rewarded instead of punished, vague ones get a helpful question, bosses talk back, and the Unseen Host rates your acts ⭐1–5.
- Already set up before Sep 2026? Nothing to do — the game switches to the new models by itself.
- **Every power has a sheet:** natural uses, stretches (with minimum level), hard limits, environment needs, and a unique signature rule. See the Power Codex in-game.
- 6 worlds, 16 objective types, 13 adaptive bosses, the Unseen Host, wheels, fusion, items, and 1–4 player hot-seat co-op/versus.
- 👎 any weird story line while you play, then 🐞 copies one bug report with all your flags (plus the last turns and AI verdicts) to paste to Claude.
- Robot testers for developers: [`tools/playtest/`](tools/playtest/README.md).
- Design document: [`docs/book-game-design.md`](docs/book-game-design.md)

## ⚔️ Rift Runners — `rift-runners.html`
Action roguelite with a strategy map. WASD/arrows to move, Space to dash, Esc to pause.
Save backup code: **Stats & Save Backup**.
