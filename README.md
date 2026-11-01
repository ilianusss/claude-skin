# skin

A Claude Code plugin that redraws the transcript: tool calls on a coloured rail with icons and
timings that open onto their input and answer, edits as diff cards, tables, code, shell output,
math and Mermaid charts as cards, a usage band (context, prompt cache, plan limits) and sixteen
skins you can switch, repaint or have Claude make. Only the drawing changes: the conversation and
what the model reads are untouched. Every feature is listed in [FEATURES.md](FEATURES.md).

## Install

Needs Claude Code 2.1.287 or later (terminal or the desktop app's Code tab). Inside Claude Code:

```
/plugin marketplace add ilianusss/claude-skin
/plugin install skin@ilianusss
```

Restart Claude Code; the `noir` skin is on. Or from a shell, for one or several config dirs:
`scripts/install.sh [--config-dir DIR]…`. Updates: `claude plugin update skin@ilianusss`.

## Uninstall

From a shell, then restart Claude Code:

```sh
claude plugin uninstall skin@ilianusss
claude plugin marketplace remove ilianusss
```

The second line is optional: it forgets the marketplace so the plugin can no longer be found or
updated. For another config dir, prefix both with `CLAUDE_CONFIG_DIR=DIR`. Uninstalling deletes
the plugin's settings and pinned folders; add `--keep-data` to keep them. Your own skins in
`~/.claude/skins/` stay, and so does a `SKIN_THEME_HOME` line you added to a `settings.json`.

## Commands

| Command | What it does |
|---|---|
| `/skin` | Settings: pick a skin with a live preview, toggle parts, repaint a colour |
| `/skin <name>` | Switch skin: `noir` `tokyo-night` `dracula` `nord` `gruvbox` `catppuccin` `rose-pine` `everforest` `one-dark` `solarized` `github` `kanagawa` `ayu` `night-owl` `homebrew` `mono`, or one of yours |
| `/skin list` · `help` | Every skin and setting · every command |
| `/skin off` · `on` | Claude Code's own drawing · the skin back |
| `/skin gallery` | Every element the skin draws, numbered |
| `/skin calm` · `calm off` | No motion, one line per tool row, read-only output folded |
| `/skin copy` · `copy code` | Copy the last reply, or its last code block |
| `/skin pin` · `unpin` · `share` | This folder's own look, drop it, or make it the default |
| `/skin shortlist <names>` · `off` | The skins the settings offer first |
| `/skin tables on/text/off` | Tables as cards, as selectable text, or Claude Code's own |
| `/skin prompt left/right/plain` · `words claude/skin` · `icons unicode/ascii` | Prompt outline side, spinner words, icon set |
| `/skin <part> on/off` | `rail` `shimmer` `band` `countdown` `compact` `clip` `markdown` `quiet` `charts` `math` `commands` `shell` `highlight` `hints` `links` `copy` `fold` `expand` |

Your own skins: ask Claude *"make me a skin that feels like a sunset"* (the `make-skin` skill writes
`~/.claude/skins/<name>.json`), or repaint a colour in `/skin`. Force light or dark with
`SKIN_APPEARANCE=light|dark`.

Forked from [hellosverre/claude-skins](https://github.com/hellosverre/claude-skins) (MIT).
