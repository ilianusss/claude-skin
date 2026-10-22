# Architecture

The plugin is a Claude Code **function-hooks mod**: `hooks/hooks.json` names one module,
`hooks/register.tsx`, whose `register(on)` hooks engine events (`session.start`, `ui.render`,
`command.run`, …). A render hook gets an event `e` and the engine `$`, and answers an element tree, or
`next(e)` to keep Claude Code's own drawing.

## Two rules the engine enforces

The loader scans the module statically, so:

1. **`$` crosses a file boundary only into a `function` declaration.** Passing `$` to an arrow
   function imported from another file fails to load. Every engine helper is
   `export async function x($: EngineInterface, …)`.
2. **`read` / `update` must name an atom declared in the same file.** So all session state lives in
   `hooks/engine/state.ts`, which exports one small accessor per atom (`getPrefs`, `setPrefs`,
   `durationOf($, e)`, …). Nothing else imports `atom`.

`claude plugin test .` and `claude plugin validate .` report both.

## Layout

```
hooks/
  register.tsx        wires the engine modules, nothing else
  engine/             the only code that touches `$`
    state.ts          every atom + accessors, `live` (per-session values), `Turn`, debugLog
    lifecycle.ts      session.start (register /skin, load, timers), clear/resume reload, turn and tool
                      events (timings, touched files, stats), config.set (theme)
    prefs.ts          load (catalog + prefs + pins), commit (the one path for a prefs change; in
                      .theme mode it runs `theme colors`), pin/unpin/share, reload on a new session
    command.tsx       /skin, the settings pane, the gallery pane
    render-tools.tsx  ToolUse, ToolGroup, ToolResult
    render-reply.tsx  UserMessage, AssistantMessage, CommandOutput, the chart hint (prompt.compose)
    render-chrome.tsx Spinner, TurnDuration, AbovePrompt / PromptHint (usage band), AskUserQuestion
    look.ts           activeSkin, the Look a drawing gets, links, copy
    entrances.ts      card entrance animations: play once, then settle
    appearance.ts     light or dark: SKIN_APPEARANCE, Claude Code's theme, terminal, system
    usage.ts          usage band data: context, plan limits, countdowns, prompt cache, Compact
    skin-files.ts     <config>/skins/*.json: load, poll, save
    theme-home.ts     .theme mode: SKIN_THEME_HOME, palettes, stamp poll, `theme colors`
    api.ts            $.skins.markdown for other mods
  skins/              skin data and logic (pure)
    skin.ts           Skin, Palette, icon sets
    builtin/          the sixteen skins, one file each; index.ts orders them (first = default)
    custom.ts         made skins: validation, resolve over a base, repaint, skin files
    catalog.ts        which skins exist now: built-ins + files, or the theme home's palettes
    theme-home.ts     palette file → Skin (base16 derivation, claude_skin, claude_<slot>)
    light.ts          light palettes, light/dark resolution, system probes' parsers
  prefs/              command.ts (Prefs defaults, /skin words, list, help), folders.ts (pins)
  ui/                 element builders (pure): look.ts (Look type), rows.tsx (tool, prompt, spinner,
                      footer rows), reply-rows.tsx (reply layout, tables), cards.tsx (card images and
                      copy controls), band.tsx (usage band), settings.tsx, gallery.tsx, …
  markdown/           reply splitting, blocks, links, highlighter, diff fences, command output
  charts/             Mermaid parse/layout, terminal art, SVG charts
  math/  svg/  tools/  util/  vendor/ (bundled beautiful-mermaid)
types/index.d.ts      public contract: Prefs, state shape, $.skins (must not import anything)
tests/                claude-code/testing: pure tests and engine tests with stubbed events
skills/make-skin/     the skill shipped to users
```

## Flow

1. **`session.start`** registers `/skin`, then `load()`: decide the catalog (theme home or built-ins +
   skin files), read prefs from the plugin store (per folder when pinned), fill the atoms, start the
   poller (stamp or skins folder), read terminal capabilities; then usage, appearance and timers.
2. **Drawing**: each render hook calls `activeSkin($)` (prefs + catalog + light/dark) and either
   answers `next(e)` (skin off, or not ours to draw) or builds elements with a `Look`
   (`ui`, `skin`, `prefs`, `surface`, optional `svg`, `copy`, `links`, `touched`, `folds`).
   Reading an atom subscribes the drawing: a write redraws it.
3. **Changes**: `/skin …` → `runSkinCommand` (pure) → `commit()` → atom + plugin store (+ `theme
   colors` in .theme mode). The settings pane calls the same `commit()`.
4. **New session without session.start** (`/clear`, `/resume`, plan guards): the first appended row or
   `classic.SessionStart` reloads (`reloadIfNewSession`).

## State and storage

| What | Where |
|---|---|
| Prefs, pinned folders | the plugin store (`$.store`: `prefs`, `folders`), a JSON file Claude Code keeps per plugin |
| Your skins | `<config>/skins/<name>.json` |
| .theme palettes | `$SKIN_THEME_HOME/colors/*/palette`, selection `current/colors`, signal `generated/stamp` |
| Session state | atoms in `engine/state.ts` (reset by /clear) |

## Adding things

- A built-in skin: `.claude/skills/add-builtin-skin`.
- A new on/off part: `.claude/skills/add-part`.
- Releasing: `.claude/skills/release`.
- The .theme bridge: `.claude/skills/theme-mode` and [theme-mode.md](theme-mode.md).
