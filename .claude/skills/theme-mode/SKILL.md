---
name: theme-mode
description: Work on or debug the skin plugin's .theme mode (SKIN_THEME_HOME, the "Prometheus" setup) — how ~/.theme palettes become skins, how /skin runs `theme colors`, how the stamp poll follows a shell switch, and what to check when a skin does not follow. Use for anything touching hooks/skins/theme-home.ts, hooks/engine/theme-home.ts or the .theme contract.
---

# .theme mode

Contract and behaviour: `docs/theme-mode.md`. The other side is `~/.theme/AGENTS.md` (its palette
table lists the `claude_*` keys; its "How each tool follows" table has the Claude Code row). Change
both together when the contract changes.

## Pieces

| File | Does |
|---|---|
| `hooks/skins/theme-home.ts` | pure: `parsePalette`, `paletteSkin` (claude_skin base or `DERIVED` base16 map, then `claude_<slot>`), `folderName`, `expandHome` |
| `hooks/engine/theme-home.ts` | `themeHomeOf` (env, then settings env; needs `colors/`), `loadThemeHome`, `watchThemeHome` (stamp mtime, 2 s), `selectPalette` (`<home>/bin/theme colors <name>`, `THEME_HOME` set) |
| `hooks/engine/prefs.ts` | `load` picks the catalog; `inCatalog` makes the skin the selected palette; `commit` runs `selectPalette` when the skin changes; `followThemeHome` applies a stamp change |
| `hooks/skins/catalog.ts` | names / skin lookup / `/skin on` fallback / list kind for either mode |
| `tests/theme.test.tsx` | pure tests + engine tests with a fake file system and `process.run` |

## Changing the derivation

Edit `DERIVED` (and `docs/theme-mode.md`'s table, `~/.theme`'s add-palette skill). Check against the
real palettes: `SKIN_THEME_HOME=~/.theme claude --plugin-dir .`, `/skin gallery` for each palette.

## Debugging "the skin does not follow"

1. Mode on? `/skin list` shows `skins from <home>/colors`. If not: `SKIN_THEME_HOME` unset or
   `<home>/colors` missing (`claude --debug` shows the plugin's debug lines).
2. Palette skipped? A missing base16 key or bad hex is logged as `palette <name>: …`.
3. Shell switch not seen? `theme apply` must rewrite `generated/stamp` (check its mtime).
4. `/skin <palette>` toast `theme colors … failed`: run `~/.theme/bin/theme colors <palette>` by hand;
   `bin/theme` needs zsh on PATH.
