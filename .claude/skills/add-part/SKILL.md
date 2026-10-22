---
name: add-part
description: Add a new on/off part (a `/skin <part> on|off` setting) or another pref to the skin plugin — the Prefs type, defaults, parsing, the command word, the settings pane button, list/help, the render hook that reads it, docs and tests. Use when asked to make something switchable or add a setting.
---

# Adding a part (an on/off setting)

A part is a boolean in `Prefs`, switched by `/skin <word> on|off` and a settings-pane button.

1. **Type**: add the field, with a one-line comment, to `Prefs` in `types/index.d.ts`.
2. **Defaults and parsing** (`hooks/prefs/command.ts`):
   - `DEFAULT_PREFS`: its default.
   - `TOGGLES`: `word: 'field'` (the word people type; may differ from the field, as `clip`).
   - `parsePrefs`: `field: flagOr(saved.field, DEFAULT_PREFS.field)` (stored prefs may be old).
   - `listing()`: a `['word', onOff(current.field)]` row; `helpText()`: a `/skin word on/off` row.
3. **Command hint**: add the word to `argumentHint` in `hooks/engine/lifecycle.ts`.
4. **Settings pane** (`hooks/ui/settings.tsx`): `{toggle('word', '<free hotkey>', prefs.field)}` in the
   Look row. Free hotkeys: check the other `toggle(...)` calls and buttons.
5. **Use it** where it draws: read `active.prefs.field` (or `look.prefs.field`) in the render hook in
   `hooks/engine/render-*.tsx`, or in a pure builder under `hooks/ui/`. Off must mean Claude Code's own
   drawing or nothing, never a half-drawn row.
6. **Calm**: if calm should change it, extend `CalmSnapshot` and `withCalm` together.
7. **Docs**: FEATURES.md (the area it belongs to, with the word in `code`), README's part list.
8. **Tests**: a `runSkinCommand('word off', …)` case in `tests/logic.test.ts`; an engine test in
   `tests/rows.test.tsx` that mounts the row with it on and off.

```sh
claude plugin test . && claude plugin validate .
```
