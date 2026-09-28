# Book Game robot testers

These play `book-game.html` in a headless browser with the **real** free AI (the same Groq/Gemini keys the game uses).

```bash
export GROQ_API_KEY=...   # and/or GEMINI_API_KEY
node tools/playtest/run-scenarios.js          # every bug a player reported, replayed and checked
node tools/playtest/autoplay.js asker 15      # a robot player (asker | crafter | breaker | lazy | hero) + a robot critic
```

- **run-scenarios.js** — `scenarios.js` holds one scenario per reported bug (wet bloop, icicle crash, helicopter, …). Every run also checks
  rules that must always hold (no sounds as objects, nothing "used up" just by using it, no progress numbers, no "hint/clue" in the story,
  the goal never announced, no crashes). Add a new scenario whenever a new bug is found.
- **autoplay.js** — a persona plays a page, then a critic AI reads the transcript and lists contradictions, ignored actions, weird words,
  unfair verdicts, etc. Reports land in `tools/playtest/out/` (not committed).
- The free AI tiers are small (about 8,000 tokens a minute per Groq model), so the testers pace themselves (`PACE=4000` ms between turns).
