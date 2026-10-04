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
Action roguelite with a strategy map. Synthesized sound + music (**M** mutes). **WASD/arrows** move · **Space** dash · **E** class skill · **Q** ultimate · **R** Rift Art (found during a run) · **Esc** pause.
Works on phones/tablets too: a touch joystick and ability buttons appear automatically. Save backup code: **Stats & Save Backup**. Progress (including pets) is saved in the browser.

- **Pets & Rift Capsules:** 20 original pets in 5 rarities (Common → Legendary), each with its own job (tank, healer, striker, bomber, collector…).
  Bring 3 into every run (buy up to 5 slots). Open capsules with 🔷 cores from runs, plus a free daily capsule. Duplicates add ★ stars;
  guaranteed Epic+ every 25 pulls and Legendary every 80.
- **Fight goals:** 15 goal types shown on the map (Survive, Hunt, Defend, Capture, Collect, Defuse, Escort, King of the Hill, Rift Anchors,
  Bounty, Nest, Overload, Breakout, Gauntlet, Chaos). Win for bonus gold + cores; flawless pays 1.5×.
- **Living maps:** trees, pillars, shrines with blessings, chests, healing wells, explosive barrels, act hazards (thorns, lava vents, icicles,
  void rifts, crystal spikes, storm clouds) that hurt enemies too, and one random event per fight (treasure goblin or golden hour).
- **Evolutions** play completely differently (beam, knife storm, double halo, holy pillars, thunder ground, meteors, tornadoes, ice spikes, inferno).
- **Endgame:** Act 3+ adds wardens that shield allies, burrowers, Rift Surges, elite modifiers and boss mechanics (the Gaze, shockwave rings, eggs).
- **6 bosses:** Colossus, Hive Queen, Void Eye, then The Mitosis (splits into pieces), The Phantom (teleports, fake clones)
  and The Rift Herald (summons portals and is shielded until you break them) for Endless.
- **Synergies:** level two matching weapons to 4+ to fuse them (Superconductor, Napalm, Solar Wheel, Spellblades, Storm Rang, Cryo Charges).
- **New rooms:** 🔨 Forge, 🎰 Gamble, 🔥 Challenge fights, plus risk/reward events (Blood Pact, Cursed Idol, Dice Table, and more).
- **Twist characters:** Reaper (levels from kills, no XP), Sentinel (only fires while standing still), Juggernaut (no dash, crushes on contact).
- **Heat 1–10:** each level adds a modifier (faster foes, pricier shops, extra elite modifiers, weaker healing, and more).
- **Daily run:** same map and same level-up offers for everyone that day; your score is shown with a copyable line to share.
- **Codex (C):** tracks discovered evolutions, synergies, bosses, relics and enemies; 11 new achievements.
- **Art:** all icons are drawn in code in one flat style (no emoji).
- **⚙️ Settings:** screen shake, effects quality, and 🔋 Battery saver (30 FPS). Menus are throttled to save battery on Chromebooks.
