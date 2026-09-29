# Book Game robot testers

These play `book-game.html` in a headless browser with the **real** free AI (the same Groq/Gemini keys the game uses).

```bash
node tools/playtest/mock-test.js --shots      # NO keys needed: a scripted fake AI checks discovery, problems, enemy plans, friends
export GROQ_API_KEY=...   # and/or GEMINI_API_KEY
node tools/playtest/run-scenarios.js          # every bug a player reported, replayed and checked
node tools/playtest/autoplay.js asker 15      # a robot player (asker | crafter | breaker | lazy | hero) + a robot critic
```

- **run-scenarios.js** — `scenarios.js` holds one scenario per reported bug (wet bloop, icicle crash, helicopter, …). Every run also checks
  rules that must always hold (no sounds as objects, nothing "used up" just by using it, no progress numbers, no "hint/clue" in the story,
  the goal never announced, no crashes). Add a new scenario whenever a new bug is found.
- **autoplay.js** — a persona plays a page, then a critic AI reads the transcript and lists contradictions, ignored actions, weird words,
  unfair verdicts, etc. Reports land in `tools/playtest/out/` (not committed).
- The free AI tiers are small: about 8,000 tokens a minute **and 200,000 tokens a day per Groq model** (one judged turn is about 3,600 tokens,
  so ~55 turns per model per day). The testers use the same keys as the game, so a full scenario run eats into the day's play budget.
  They pace themselves (`PACE` between turns, `PAUSE` between scenarios) and mark a scenario **⚠️ skipped** when the game had to fall back to
  the offline narrator because the AI was busy. Limits are per Groq account, so a second key on the same account doesn't add budget.
