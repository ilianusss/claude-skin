# .theme mode

For a machine where one `theme` command sets the colours of every tool (the author's "Prometheus"
setup: `~/.theme`, with Ghostty, zsh and Neovim following it). In this mode the skins **are** the
theme's palettes, and the two directions stay in sync.

## Turning it on

Set `SKIN_THEME_HOME` to the theme folder, in Claude Code's settings (user, project or `--settings`):

```json
{ "env": { "SKIN_THEME_HOME": "~/.theme" } }
```

or in the shell that starts Claude Code (`export SKIN_THEME_HOME=~/.theme`; the process environment
wins over settings). `~` and `$HOME` are expanded. The mode is on only when `<home>/colors/` exists;
otherwise the plugin behaves as for everyone else. `scripts/install.sh --prometheus` writes the
settings line for each config dir it installs into.

## What it reads

| Path under the theme home | Use |
|---|---|
| `colors/<name>/palette` | one skin per folder, named `<name>`, labelled by its `name=` key |
| `current/colors` | symlink to the selected palette folder: the skin in use |
| `generated/stamp` | rewritten by every `theme apply`: polled (mtime, every 2 s) to follow changes |
| `bin/theme` | run as `theme colors <name>` (with `THEME_HOME=<home>`) when a skin is picked |

A palette is `key="value"` lines (`#` comments). Keys used:

| Key | Use |
|---|---|
| `base00`..`base0F` | required; the derived skin (below) |
| `name` | the label |
| `claude_skin` | optional: start from this built-in skin (its colours and spinner/footer words) instead of deriving |
| `claude_<slot>` | optional: one slot's colour, `"#rrggbb"` (slots: `user fg muted surface zebra ok err warn read write run search web mcp other`) |

Derived from base16 when `claude_skin` is absent:

| Slot | base16 | | Slot | base16 |
|---|---|---|---|---|
| `fg` | 05 | | `read` | 0D |
| `muted` | 04 | | `write` | 09 |
| `surface` | 01 | | `run` | 0B |
| `zebra` | mix(00, 01) | | `search` | 0E |
| `user` | 0D | | `web` | 0C |
| `ok` | 0B | | `mcp` | 0A |
| `err` | 08 | | `other` | 04 |
| `warn` | 09 | | | |

The palette is drawn as-is whatever Claude Code's light/dark setting: it was made for the terminal's
own background. A palette missing a base16 key, or with a malformed hex, is skipped (debug log).

## Behaviour

- `/skin` and `/skin list` show only the palettes; `/skin noir` is "unknown".
- `/skin <palette>` (or picking it in the pane) runs `theme colors <palette>`; a failure is a toast and
  nothing else changes.
- `theme colors <palette>` anywhere moves every open session within ~2 s; so does editing a palette and
  running `theme apply`.
- `/skin off` stays off across theme changes; `/skin on` turns on the selected palette.
- Pinned folders keep their parts; the skin always follows the theme.
- Repainting a slot and skin files are disabled: edit the palette (`claude_<slot>` keys).

## Code

`hooks/skins/theme-home.ts` (pure: parse, derive), `hooks/engine/theme-home.ts` (env, files, poll,
`theme colors`), `hooks/engine/prefs.ts` (`load`, `commit`). Tests: `tests/theme.test.tsx`.
