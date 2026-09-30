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
- **Find things out yourself:** you only know the places you've discovered. Problems stand in the way with plain facts and no set answer: any plan that fits works, reckless stunts hurt. Enemies show what they're about to do, so fights are puzzles you can read.
- **Better with friends:** split up or move together, team up ("Sam and I…") to combine powers, chain combos, prank each other. Silly ideas count.
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
A co-op action roguelite. Fully offline: one file, no internet needed (sound is made in code).

- **1 or 2 players on one keyboard.** P1: WASD, Space dash, E ultimate. P2: Arrows, Enter or / dash, Right Shift or . ultimate. Gamepads work too.
  The camera zooms out to fit both of you; if your partner goes down, stand next to them to revive them.
- **Rift doors instead of a map.** Clear a room and doors open, each showing its reward (⭐ level-up, 🪙 gold, ❤️ heal, 💀 elite relic, 🛒 shop,
  ❓ mystery, ⛺ camp, 💎 treasure) and its goal. Walk into the one you want. 8 rooms, then the biome's boss; 3 biomes to win, then Endless.
- **Rooms with goals:** ⏳ survive, 🎯 hunt the marked beasts, 💎 defend the crystal, 🌀 capture the portal, ✨ collect the sparks.
- **Arenas with stuff:** pillars block enemy shots, 🛢️ barrels explode, a ⛲ healing shrine, and a hazard per biome (bushes, lava, ice, darkness, storms).
- **Every runner has an ultimate** (Bulwark Slam, Arrow Rain, Meteor, Carpet Bomb, Firestorm, Blood Moon, Blizzard, Thunderstorm, Cyclone, Jackpot).
- **🌍 Rift World (Pokémon + Prodigy style):** choose a starter, explore 6 zones, find wild pets in the tall grass, weaken and catch them
  with orbs, beat trainers and each zone's Warden for badges. 1-vs-1 pet battles with switching, items and 4 moves per pet.
- **🐾 Pets:** 74 pets in 5 rarities, each with a stat spread (HP, Attack, Defence, Speed), an ability, a learnset, and evolutions
  (some 3 stages). Rarer pets have bigger stat totals, but level matters just as much. Packs, catching and duplicates (★) all help.
- **🗼 Rift Tower:** floor-by-floor trainer battles for gems, packs and blessings that power up your action runs. Your 🐾 buddy fights
  beside you in runs, as strong as its stats, and earns XP.
- **Element sets:** weapons are 🔥 fire, ❄️ frost, ⚡ storm, 🗡️ blade or ✨ arcane; own 2 or 4 of one element for a set bonus. Plus evolutions, relics, and new enemies with tells (chargers, snipers, healers, summoners, bats).
- **Online co-op (experimental):** two computers connect by swapping two codes (no server). Works best at home; school Wi-Fi often blocks it.
- Progress, upgrades and unlocks save in the browser; **Stats → Save Backup** gives a code to move it. Old saves carry over.
- Robot testers (for developers): `node tools/playtest-rift/bot.js solo 3` plays whole runs at high speed; `online.js` tests online play; `shots.js` takes screenshots; `pets-test.js` tests the Rift World, pet battles, catching, evolution, the tower and buddies, and prints a balance table.
