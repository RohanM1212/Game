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
- **Free-limit fallback:** if one model hits its free daily limit, the game automatically switches to the next one.
- **Every power has a sheet:** natural uses, stretches (with minimum level), hard limits, environment needs, and a unique signature rule. See the Power Codex in-game.
- 6 worlds, 16 objective types, 13 adaptive bosses, the Unseen Host, wheels, fusion, items, and 1–4 player hot-seat co-op/versus.
- 🐞 in-game button copies a bug report (last turns + AI verdicts) to paste to Claude.
- Design document: [`docs/book-game-design.md`](docs/book-game-design.md)

## ⚔️ Rift Runners — `rift-runners.html`
Action roguelite with a strategy map. WASD/arrows to move, Space to dash, Esc to pause.
Save backup code: **Stats & Save Backup**.

- **Looks:** glowing weapons and bullets, particles, hit-stop, screen shake, animated floors and weather for every act,
  cinematic boss entrances, boss phases, slow-motion finishers, and an animated menu and map.
- **Endgame:** Act 3 and Endless are much harder: Rift Surges near the end of fights, elites with modifiers
  (Swift, Shielded, Volatile, Summoner), brutes that slam the ground, and bosses with extra phases (lasers, falling boulders, bullet spirals).
- **⚙️ Settings:** turn screen shake off, or set Effects to Low if your computer lags. "Auto" lowers them by itself.
