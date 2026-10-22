---
name: add-builtin-skin
description: Add (or retune) a built-in skin of the skin plugin — one file in hooks/skins/builtin/, its line in the index, light palette, spinner/footer words, docs and checks. Use when asked to ship a new built-in skin or change a built-in's colours. (A user's own skin is a file in <config>/skins/, see skills/make-skin; a .theme palette is ~/.theme's add-palette skill.)
---

# Adding a built-in skin

1. Copy a sibling: `cp hooks/skins/builtin/nord.ts hooks/skins/builtin/<name>.ts`.
   - `name`: kebab-case, unique; `label`: display name.
   - `palette`: all 15 slots (meanings in `SLOT_HELP`, `hooks/skins/custom.ts`), `#rrggbb` lowercase,
     from the theme's own source (its Neovim plugin palette, terminal ports), never from memory.
   - `light` (optional): its own light palette; without it `toLight()` in `hooks/skins/light.ts`
     derives one (deepened colours, near-black text).
   - `spinner`: up to 12 gerunds; `done`: past-tense words. They carry the skin's mood.
   - A short header comment: where the colours come from.
2. Add it to `SKINS` in `hooks/skins/builtin/index.ts` (import + one line). The first entry is the
   default skin (`DEFAULT_PREFS.skin` must match it).
3. Name it in README's `/skin <name>` row, `skills/make-skin/SKILL.md`'s base list and the count
   ("sixteen") in README/FEATURES/plugin.json if it changes.
4. Check:
   ```sh
   claude plugin test .     # tests/logic.test.ts checks SKINS: the count (update its 16), unique names, every slot
   claude --plugin-dir .    # /skin <name>, /skin gallery on a dark and a light theme
   ```
   Look at: `muted` readable on the background, `surface`/`zebra` quiet, `run`/`write`/`read` distinct.
