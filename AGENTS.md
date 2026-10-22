# skin

A Claude Code function-hooks plugin (`skin@ilianusss`) that redraws the transcript: tool rows,
cards (tables, code, diffs, shell, math, Mermaid), a usage band and switchable skins. One plugin for
everyone; `.theme` mode (env `SKIN_THEME_HOME`) ties the skins to the author's `theme` command.

- What it does: [FEATURES.md](FEATURES.md) — keep it in sync with every user-visible change.
- How it is built: [docs/architecture.md](docs/architecture.md).
- The .theme contract: [docs/theme-mode.md](docs/theme-mode.md).

## Commands

```sh
claude plugin test .                 # every test (tests/*.test.ts[x]); must stay green
claude plugin validate .             # manifests, hooks scan, env/state lists
claude --plugin-dir .                # run it; saving a file reloads the mod live
# type check (as CI): lay the API types once, then tsc
claude --plugin-dir . -p types >/dev/null 2>&1; mkdir -p .claude/types && cp -R .claude-plugin/types/. .claude/types/ && rm -f .claude/types/tsconfig.json
npx -y -p typescript@5.9.3 tsc -p tsconfig.json
scripts/install.sh [--prometheus] [--config-dir DIR]… [--local]
```

## Rules (the engine enforces 1 and 2 at load)

1. Only `hooks/engine/` touches `$`, and an engine helper that takes `$` is a `function`
   declaration, never an arrow function (`$` may cross a file only into a function declaration).
2. Atoms are declared and read/written only in `hooks/engine/state.ts`; other files call its
   accessors (`getPrefs($)`, `setDurationOf($, e, ms)`, …). Add an accessor rather than an atom elsewhere.
3. Everything outside `hooks/engine/` is pure (no `$`) and unit-tested.
4. Every prefs change goes through `commit()` in `engine/prefs.ts`.
5. `types/index.d.ts` is the public contract: self-contained, no imports.
6. Hook failures that cost one drawing go to `debugLog($, 'prefix: ')`, never throw out of a hook
   that gates the session.
7. A user-visible change updates FEATURES.md and, for a command, `helpText()` in `prefs/command.ts`
   and README's table.

## Conventions

- TypeScript strict, no semicolons, single quotes, 2-space indent, `h`/`Fragment` JSX.
- Comments say why, briefly; no history, no issue numbers.
- Colours `#rrggbb` lowercase. Skin names kebab-case.
- Tests describe behaviour in their titles (`'a failed call opens by itself'`).

## Skills (`.claude/skills/`)

| Skill | For |
|---|---|
| `add-builtin-skin` | a new built-in skin |
| `add-part` | a new `/skin <part> on/off` setting |
| `theme-mode` | the .theme bridge: palettes → skins, `theme colors`, debugging it |
| `release` | version bump, checks, tag, how users get it |

`skills/make-skin/` is shipped to users (Claude writes `<config>/skins/<name>.json`).
