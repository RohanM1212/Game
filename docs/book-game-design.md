# The Book Game: Design Document (v2, AI Narrator)

> Status: **v2 built** (`book-game.html`). Real-AI playtesting in progress.
> Plays at home in Chrome on Windows, with free cloud AI and no Claude usage.

---

## 1. The vision
You pick one of three mysterious books. You get a random power. You land somewhere random in a strange world and must find
and complete the page's goal. **You can try literally anything by typing it**, but a Narrator judges it against what your power
can *realistically* do at *your* level, in *this* place. Creativity wins. Spamming loses. Impossible ideas fail.
Regular enemies are manageable. **Bosses are genuinely hard**, and you can never beat the same boss the same way twice.

---

## 2. How it works: Engine + AI Narrator
The AI is **not** in charge of the rules, so it can't be talked into "I win."

| Part | Job |
|---|---|
| **Game Engine** (code) | Owns every fact: HP, energy, gold, power sheets, levels, enemies, boss rules, traps, map, saving. Does all the math. |
| **Judge AI** (smart model) | Reads your sentence + a short summary of the situation and fills in a form (see below). |
| **Validator** (code) | Checks the Judge's form against the power sheet and the scene. Can downgrade a verdict, never upgrade past the rules. |
| **Storyteller AI** (fast model) | Writes 2–4 sentences describing what *actually* happened, using the engine's real numbers. |

### One turn, step by step
1. You type: *"I pull lightning through the iron chains so the whole bridge becomes a trap."*
2. Engine sends the Judge: your power sheet, your level, energy, scene objects and environment, targets and their properties, active boss rules.
3. Judge returns a small form:
   ```json
   { "approach": "trick", "powers": ["lightning"], "objects": ["iron chains"], "target": "Rail Bandits",
     "shape": "trap", "size": "big", "verdict": "natural", "why": "lightning conducts through metal",
     "creativity": 4, "intent": "shock anyone who crosses the bridge" }
   ```
4. Validator checks it. Is "trap" allowed for Lightning? Does "big" fit level 3? Are the chains really in the scene? Does the target have properties that block it?
5. Engine computes the result (damage, meter progress, status effects, energy cost).
6. Storyteller narrates it using the real outcome.

If the AI is slow or confused, the engine asks you to rephrase. **The engine never guesses a result the rules don't allow.**

---

## 3. Verdicts: yes, things can FAIL now
Every action gets one of three verdicts.

| Verdict | Example | Effect |
|---|---|---|
| ✅ **Natural** | Lightning bolt, stone wall, bread as a gift | Full power, normal energy |
| 🌀 **Stretch** | Lightning "fence" that shocks crossers (Lv 3+), Fire shaped into a rope (Lv 5+) | ~60% power, 1.5× energy, backfire chance (lower at higher level). **Too low a level → it fizzles.** |
| ❌ **Impossible** | A *solid* wall of lightning, healing with Shadow, Bread that explodes | **Fails. Turn lost.** No energy spent. Narrator says why and hints at what *would* work. |

- **Environment can downgrade a verdict.** Water with no water nearby: big effects → stretch. Plants on bare metal floor → impossible above small.
- **Targets can block things.** You can't persuade a mindless golem, and illusions don't work on blind creatures (→ impossible against *them*).
- **Level unlocks stretches.** Each power sheet lists stretches with a minimum level. Levelling up literally expands what you can imagine.

---

## 4. Power sheets: every power is genuinely different
Each power has:
- **Natural:** what it obviously does
- **Stretch (min level):** clever uses that need skill
- **Impossible:** hard limits
- **Needs:** what it requires from the environment
- **Signature rule:** a unique mechanic no other power has
- **Weak spot:** what counters it

### Example sheets (the rest follow the same format)

**⚡ Lightning**
- **Natural:** bolts, chain strikes, stunning, overloading machines, lighting dark places, a speed burst.
- **Stretch:** a shock fence/trap (Lv 3), magnetizing metal (Lv 4), riding a bolt to teleport a short distance (Lv 6).
- **Impossible:** anything solid, healing, silence or stealth.
- **Needs:** nothing. Strongest near water and metal.
- **Signature:** **Acts first**, so it can interrupt a boss's charged attack. **Chains** to extra targets that are wet or touching metal.
- **Weak spot:** grounded and rubber enemies. Hurts you if you're standing in water.

**🔥 Fire**
- **Natural:** blasts, walls of flame, light, warmth, burning through wood, rope and plants.
- **Stretch:** fire shaped into animals or rope (Lv 5), controlling existing fires (Lv 3), smoke screens (Lv 2).
- **Impossible:** anything underwater, cold, or healing.
- **Needs:** air. Weak in rain.
- **Signature:** **Fire spreads.** Burning things keep burning for several rounds, including things you *didn't* want burned.
- **Weak spot:** water, wet targets, fireproof enemies.

**🌿 Plants**
- **Natural:** vines to grab and bind, thorn walls, climbing, hiding in foliage, growing food.
- **Stretch:** healing herbs (Lv 2), plant creatures (Lv 5), cracking stone with roots (Lv 3).
- **Impossible:** anything with no soil or water around (metal floors, the sky) above small size.
- **Needs:** soil or water nearby.
- **Signature:** **Seeds grow.** Plant something and it gets stronger every round you leave it.
- **Weak spot:** fire, cold.

**🐦 Talk to Pigeons**
- **Natural:** asking birds what they've seen, scouting the map, distracting with a flock, carrying tiny items.
- **Stretch:** coordinated pecking attacks (Lv 3), a pigeon spy network across the whole level (Lv 5).
- **Impossible:** anything underground or indoors with no birds; fighting big enemies directly.
- **Needs:** birds nearby (outdoors, or a flock you brought).
- **Signature:** **Information.** Pigeons reveal map tiles, enemy weaknesses, and even **Host traps** (once per visit).
- **Weak spot:** cats, storms, indoor levels.

**🪑 Summon One Chair**
- **Natural:** one sturdy chair, placed anywhere you can see. Sit, stand on it, block with it, throw it.
- **Stretch:** a chair at an absurd height (Lv 3), a chair made of a different material (Lv 5).
- **Impossible:** more than one chair, any other furniture.
- **Signature:** **The chair stays in the scene** as a real object you and others can use later: jam a door, reach a ledge, trip a charging boss.
- **Weak spot:** it's a chair.

**💀 Necromancy**
- **Natural:** raising the fallen as minions, commanding bones, talking to ghosts, fear.
- **Stretch:** a bone wall (Lv 2), borrowing a ghost's memories (Lv 4), a bone dragon (Lv 7).
- **Impossible:** healing the living, doing anything kind to living people (persuading them fails).
- **Needs:** bodies. **Defeated enemies leave remains**, so it gets stronger as fights go on.
- **Signature:** **Minions persist** and act every round until destroyed.
- **Weak spot:** holy and light, and places with no dead.

**⏳ Time Skip**
- **Natural:** skipping yourself a few seconds ahead (dodge), slowing a single target, aging or un-aging small objects.
- **Stretch:** rewinding the last round's damage to the team (Lv 3, 2× per page), freezing a boss for a round (Lv 6).
- **Impossible:** direct damage, and changing anything more than one round ago.
- **Signature:** **Rewind:** undo one round of damage (limited uses).
- **Weak spot:** its energy cost is high.

**🍞 Bread**
- **Natural:** any bread, any size up to your level: gifts, bait, soft cushions, a doorstop loaf.
- **Stretch:** bread armor (Lv 2), sticky wet-dough traps (Lv 3), a giant bread fortress (Lv 6).
- **Impossible:** explosions, sharp weapons, anything not bread.
- **Signature:** **Food.** Calms hungry and animal enemies. Teammates who eat it heal.
- **Weak spot:** rain turns it soggy (good for traps, bad for walls).

*Every power in the game (about 35 at launch) gets a sheet like these.* The test bot checks that every power has a path to win every
objective and boss, just a *different* path.

### Fusion
Fusing two powers merges their sheets. Anything *natural* for either stays natural. Anything that's a *stretch* for one and natural for
the other becomes natural. You also get a **new combined signature**, for example Fire + Bread = **Toast Lord**, whose bread burns and spreads warmth that heals.
The AI names and describes the fusion. The engine builds the sheet.

---

## 5. Levels, energy and creativity
- **Power level 1–10**, bought with gold. Level caps the **size** of what you make (small / normal / big / huge / colossal) and unlocks **stretches**.
- **Energy** limits how often you can go big. Resting recovers it, at the cost of a turn.
- **Creativity score (1–5)** from the Judge. It rewards using the scene, being specific, and combining things. More creativity = bonus effect.
- **Repetition penalty** (engine-tracked): the same kind of move gets weaker each time. Bosses adapt within the fight too.
- **The AI never decides numbers.** It only picks categories. The engine turns them into results, so "I do a MILLION damage" does nothing extra.

---

## 6. Worlds, exploration and enemies
- **6 books to start** (Jungle, Sunken City, Haunted School, Sky Islands, Candy Desert, Clockwork City), each with 6 pages.
- **Hidden grid map:** random start, fog of war, encounters, obstacles, treasure, shrines, hint-givers, goal cell.
- **Environment tags per area** (wet, dark, metal, soil, high, indoors, crowded…) feed the verdict rules.
- **Scene objects** you can use (vines, river, chandelier, conveyor belt…). Some are created by play (remains, burning debris, your chair).
- **Enemy properties:** mindless, blind, flying, armored, fireproof, swarm, social, animal, underwater. These change what works.
- **Difficulty:** regular swarms and mini-bosses go down in a few smart turns. Bosses take real planning.

## 7. Objectives (not always a boss)
16 types at launch, each a meter you can move many different ways. The AI adds a **random twist** each time so they never repeat exactly:
Tribal Peace, Save the Party, Owl Museum Heist, Evacuate the Volcano, Goblin Court, Survive Until Dawn, Tame the Dragon, Stop the Ritual,
Runaway Train, Circus Coup, Sunken Bell, Elect Mayor Frog, Frozen King, Bee Diplomacy, Feed the Giant, Relight the Lighthouse, Escort the Snail.

## 8. Bosses
13 bosses with rule-based gimmicks (engine) plus an **AI-written personality and a new twist each encounter**:
Mirror Knight (bounces back repeated approaches), Clockwork Judge (forbids an approach each round, rewinds a big hit),
Hive Mother (single hits barely matter), Understudy (copies your last power), Librarian (noise meter), Absorber (bloat it with 4 different traits),
Twin Kings (hit both or one heals), Spore Choir (clogs a power), Tiny Tyrant (guards first), Weather Witch, Gambler God, Maestro (tempo), Nesting Queen (3 layers).
- **Boss memory:** each boss remembers the approach and trait you beat it with last time, and resists them next time.
- **Telegraphed big attacks:** you get one round to protect, hide, dodge, or (with Lightning or Time) interrupt.

## 9. The Unseen Host
- A vast white hall on a 9×9 grid. Move forward / back / left / right. **Touch him to win.**
- **Traps are fixed** for that visit (a retry keeps the same layout) but **change every new visit**. Stepping on one hurts. Nothing marks them. You have to remember.
- **Amusement** (entertain him → clues about nearby traps and where he is) vs **Annoyance** (boring or rude → he moves, hides clues, springs traps).
- **Moods:** Showman, Critic (only likes certain kinds of act, which you must figure out), Sleeper (stealth: follow the snoring), Hide-and-Seek.
- **The AI plays the Host's voice**, judging whether your act is actually entertaining, original, and to his taste. He remembers your old acts.

## 10. Economy and progress
- **Gold** from pages, encounters, treasure.
- **Spend it on:**
  - power upgrades
  - 🎡 the Cheap Wheel (mostly weird powers)
  - ✨ the Golden Wheel (rare and epic)
  - creative **items** (rope, mirror, fireworks, glue, honey…; each has its own natural uses)
  - **fusion**
- **Dying:** lose a quarter of your gold and pay a fee to retry the page (same map and traps). Can't pay → **run over**.
- Finish a book → a harder **Volume** with new books, keeping your powers.
- Saves automatically in the browser. Export/import a backup code.

## 11. Multiplayer
- **Phase 1:** hot-seat, 1–4 players on one keyboard. **Co-op** (shared gold, combo actions like "my fire + Sam's wind") or **Versus** (own gold, top contributor earns a bonus).
- **Later:** online play from different computers. This needs a small free server to sync games. Planned after the core game feels right.

## 12. The AI setup (free, no Claude usage)
| Role | Main | Backup |
|---|---|---|
| Judge (smart) | **Groq**: GPT-OSS 120B or Llama 3.3 70B | Gemini Flash-Lite |
| Storyteller (fast) | **Groq**: Llama 3.1 8B Instant (very high free limits) | Gemini Flash-Lite |

- Your keys are pasted into Settings once and stored only in your browser.
- Each turn = 1 Judge call + 1 Storyteller call. Messages are kept short so free daily limits cover long play sessions. Groq's big models give about 1,000 requests a day, capped by daily token limits.
- If a service hits its limit, the game **switches automatically** to the backup.
- If *everything* is out for the day, the game says so and you continue tomorrow. (Optional: a basic keyword narrator as an emergency mode. Your call.)
- Free-tier limits change often, so the game shows which AI is active.

### What you need to do (at home, about 10 minutes)
1. **Groq key:** console.groq.com → sign up → **API Keys** → Create. Copy it somewhere private.
2. **Gemini key (backup):** aistudio.google.com → **Get API key** → Create.
3. Open the game in Chrome → ⚙️ Settings → paste both keys → play.
4. Check each service's sign-up terms (age rules apply), and never type personal info into the game.

## 13. How we'll test
- **Me:** a test bot plays thousands of turns with a *fake* AI to prove the rules work and every power can win.
- **You:** play with the real AI and report "the narrator said X but should have said Y". I tune the AI instructions and power sheets.

## 14. Build phases
1. Engine v2: power sheets, verdict validator, environment tags, enemy properties, all existing content ported.
2. AI layer: Judge + Storyteller, provider switching, settings screen, error handling.
3. Bosses and Host with AI personalities and twists.
4. Economy, wheels, fusion sheets, items with natural uses.
5. Hot-seat multiplayer.
6. Your playtesting → fixes → more books, powers and bosses.
7. Online multiplayer (later).

## 15. Decisions (answered)
1. **The game never stops.** It cascades through every free model (Groq big → Groq mid → Gemini Flash-Lite → Groq Llama 8B with ~14,400 free requests/day). A keyword narrator is only an emergency if the internet or every service is down.
2. **Impossible actions:** the first one in a run is a free warning. After that they always cost the turn.
3. **Trial run:** the first page of your first book is a tutorial. The narrator is generous and explains each verdict. After that, normal strictness.
4. No extra content requests. Use the designs above.

## 16. Playtesting help (built into the game)
- ⚙️ Settings: paste keys + a **Test AI** button that confirms each key works.
- An indicator showing which AI is currently narrating.
- 🐞 **Report** button: copies your last few turns (what you typed, the verdict, what happened) so you can paste it to Claude with "this was wrong because…".
