import type { SkinSlot } from '../../types'
import { SKINS } from './builtin'
import { mix } from './light'
import type { Palette, Skin } from './skin'

// .theme mode: every palette in <theme home>/colors/<name>/palette is a skin (docs/theme-mode.md).
// A palette is `key="value"` lines; zsh and Neovim parse the same grammar, so keep it that simple.

export type Palettes = Readonly<Record<string, string>>

export type { ThemeHome } from '../../types'

const LINE = /^\s*([A-Za-z0-9_]+)=(.*)$/
const HEX = /^#[0-9a-f]{6}$/i
const BASES = Array.from({ length: 16 }, (_, i) => `base0${i.toString(16).toUpperCase()}`)

export function parsePalette(text: string): Palettes {
  const keys: Record<string, string> = {}

  for (const line of text.split('\n')) {
    const match = LINE.exec(line)

    if (match !== null) {
      const rest = match[2] ?? ''
      keys[match[1] ?? ''] = /^"([^"]*)"/.exec(rest)?.[1] ?? /^(\S*)/.exec(rest)?.[1] ?? ''
    }
  }

  return keys
}

// The base16 slot each skin slot takes when the palette names no built-in skin.
export const DERIVED: Readonly<Record<Exclude<SkinSlot, 'zebra'>, string>> = {
  fg: 'base05',
  muted: 'base04',
  surface: 'base01',
  user: 'base0D',
  ok: 'base0B',
  err: 'base08',
  warn: 'base09',
  read: 'base0D',
  write: 'base09',
  run: 'base0B',
  search: 'base0E',
  web: 'base0C',
  mcp: 'base0A',
  other: 'base04',
}

const colour = (keys: Palettes, key: string): string | undefined => {
  const value = keys[key]?.toLowerCase()

  return value !== undefined && HEX.test(value) ? value : undefined
}

function derived(keys: Palettes): Palette | undefined {
  if (BASES.some(base => colour(keys, base) === undefined)) {
    return undefined
  }

  const at = (base: string) => colour(keys, base) ?? '#000000'
  const slots = Object.fromEntries(Object.entries(DERIVED).map(([slot, base]) => [slot, at(base)]))

  return { ...slots, zebra: mix(at('base00'), at('base01'), 0.5) } as Palette
}

// A palette's skin: the built-in it names with `claude_skin`, else derived from base16; then
// each `claude_<slot>` key over it. Undefined when neither gives every slot.
export function paletteSkin(name: string, keys: Palettes): Skin | undefined {
  const base = SKINS.find(skin => skin.name === keys.claude_skin)
  const fallback = SKINS[0]
  const from = base?.palette ?? derived(keys)

  if (from === undefined || fallback === undefined) {
    return undefined
  }

  const own = Object.fromEntries(
    Object.keys(from).flatMap(slot => {
      const hex = colour(keys, `claude_${slot}`)

      return hex === undefined ? [] : [[slot, hex]]
    }),
  )
  const palette = { ...from, ...own } as Palette

  return {
    name,
    label: keys.name ?? name,
    palette,
    // The terminal's background is the palette's own, light or dark: it is drawn as it is.
    light: palette,
    spinner: (base ?? fallback).spinner,
    done: (base ?? fallback).done,
  }
}

// The palette folder a `current/colors` link resolves to: `/x/.theme/colors/kanagawa` → `kanagawa`.
export const folderName = (path: string | undefined): string | null =>
  path === undefined ? null : (path.replace(/[\\/]+$/, '').split(/[\\/]/).at(-1) ?? null)

// `~/x` and `$HOME/x` against the home directory; anything else as given.
export function expandHome(path: string, home: string | undefined): string {
  const trimmed = path.trim()

  if (home === undefined) {
    return trimmed
  }

  return trimmed.replace(/^(~|\$HOME|\$\{HOME\})(?=$|[\\/])/, home)
}
