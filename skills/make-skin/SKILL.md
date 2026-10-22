---
name: make-skin
description: Make or change a Claude Code skin for the skin plugin — from a mood, a brand, a wallpaper or another theme — by writing a skin file; also how to switch skins and parts. Use when the person asks to restyle, recolour or theme Claude Code, make a skin, or change the spinner or footer words.
---

# Making a skin

The skin plugin redraws the transcript: tool rows on a coloured rail, tables with a header band and
zebra rows, a shimmering spinner and a turn footer. A skin is 15 colours ("slots") and two word lists.

## First: which mode is this?

If the environment or Claude Code's settings `env` has `SKIN_THEME_HOME` (Prometheus / `.theme`
mode), skins are **not** made here: every skin is a palette of that `.theme` folder, shared with the
terminal and Neovim. Add or edit a palette there instead (its `add-palette` skill; per-slot overrides
are `claude_<slot>="#rrggbb"` keys). Stop reading this skill.

Otherwise, continue.

## Steps

1. Pick the built-in skin closest to the request as `base`: `noir`, `tokyo-night`, `dracula`, `nord`,
   `gruvbox`, `catppuccin`, `rose-pine`, `everforest`, `one-dark`, `solarized`, `github`, `kanagawa`,
   `ayu`, `night-owl`, `homebrew`, `mono`. A skin file lists only the slots it changes.
2. Write `${CLAUDE_CONFIG_DIR:-~/.claude}/skins/<name>.json` (`<name>`: lowercase letters, digits,
   hyphens; not a built-in's name):

   ```json
   {
     "label": "Sunset",
     "base": "gruvbox",
     "palette": { "user": "#ff8a5b", "run": "#ffcf70", "surface": "#3a2b2b", "zebra": "#2e2424" },
     "spinner": ["Glowing", "Fading", "Drifting"],
     "done": ["Set", "Faded"]
   }
   ```

   `spinner` (gerunds) and `done` (past tense) are optional, up to 12 words of 1–24 characters.
3. Tell the person to run `/skin <name>`. While a skin is in use, saving its file redraws it within
   two seconds, so further tweaks show live. A file that does not parse is skipped (`/skin list`
   won't show it; the reason goes to Claude Code's debug log).

## Slots

| Slot | Paints |
|---|---|
| `user` | the accent: the rail, your prompt marker, the spinner |
| `fg` | body text |
| `muted` | secondary text: commands, paths, timings |
| `surface` | band behind a table header |
| `zebra` | every other table row; a step off the background |
| `ok` / `err` / `warn` | a finished / failed / interrupted call |
| `read` | Read |
| `write` | Edit and Write |
| `run` | Bash and PowerShell |
| `search` | Glob and Grep |
| `web` | WebFetch and WebSearch |
| `mcp` | MCP tools |
| `other` | anything else in a group |

## What makes a skin look good

- **One accent.** `user` is the colour the skin is about; keep everything else quieter.
- **Readable text.** `fg` and `muted` sit on the terminal background (almost always dark). `muted`
  carries commands, paths and timings: keep it clearly readable.
- **Quiet bands.** `surface` and `zebra` are backgrounds behind table rows: one small step off the
  background, never bright.
- **Kinds told apart.** Give `run`, `write` and `read` clearly different hues.
- **Status stays conventional.** `ok` green-ish, `err` red-ish.

A light background gets a derived palette (deepened colours, near-black text); nothing to do.

## Other changes the person may want

All typed by the person, not by you: `/skin <name>` switches, `/skin` opens the settings (pick, toggle
parts, repaint one slot — which saves `my-<skin>.json`), `/skin <part> on|off` for `rail`, `shimmer`,
`tables`, `band`, …, `/skin icons ascii` for fonts without the glyphs, `/skin help` for every command.
