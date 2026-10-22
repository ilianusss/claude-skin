import type { EngineInterface, Timer } from 'claude-code'

import { gnomeDark, macDark, resolveLight, windowsDark } from '../skins/light'
import { debugLog, getLight, setLight } from './state'

// How often an `auto` theme asks the system again: nothing tells a plugin it changed.
const APPEARANCE_MS = 5000

const PROBES = [
  { argv: ['defaults', 'read', '-g', 'AppleInterfaceStyle'], dark: macDark },
  {
    argv: ['reg', 'query', 'HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Themes\\Personalize', '/v', 'AppsUseLightTheme'],
    dark: windowsDark,
  },
  { argv: ['gsettings', 'get', 'org.gnome.desktop.interface', 'color-scheme'], dark: gnomeDark },
] as const

// The probe that answered last, so the timer asks one system rather than all three.
let answering: (typeof PROBES)[number] | undefined
let appearance: Timer | undefined
// Before Claude Code binds the session $.config.list rejects while the prefs already load; the
// next draw or row reads the theme again.
let themePending = false

async function systemDark($: EngineInterface): Promise<boolean | undefined> {
  for (const probe of answering === undefined ? PROBES : [answering, ...PROBES]) {
    try {
      const dark = probe.dark(await $.process.run([...probe.argv], { timeoutMs: 2000 }))

      if (dark !== undefined) {
        answering = probe
        return dark
      }
    } catch {
      // The other systems' tools are missing here; expected.
    }
  }

  answering = undefined
  return undefined
}

// Light or dark: `SKIN_APPEARANCE` first, then Claude Code's theme, and for `auto` the terminal
// and the system. `theme` is a value just written, which `$.config.list()` does not answer yet.
// True when the answer came from the system, which can change under it.
async function refreshTheme($: EngineInterface, theme?: unknown): Promise<boolean> {
  const hints = {
    override: await $.env.get('SKIN_APPEARANCE'),
    theme: theme ?? (await $.config.list()).find(row => row.key === 'theme')?.value,
    colorfgbg: await $.env.get('COLORFGBG'),
  }
  const needsSystem = resolveLight(hints) !== resolveLight({ ...hints, systemDark: false })
  const dark = needsSystem ? await systemDark($) : undefined
  const isLight = resolveLight({ ...hints, systemDark: dark })

  // A write redraws every row, and the system is asked again every few seconds.
  if ((await getLight($)) !== isLight) {
    await setLight($, isLight)
  }

  return dark !== undefined
}

export async function followTheme($: EngineInterface, theme?: unknown): Promise<void> {
  const followsSystem = await refreshTheme($, theme)

  appearance?.cancel()
  appearance = followsSystem ? $.clock.every(APPEARANCE_MS, () => void refreshTheme($).catch(debugLog($))) : undefined
}

export const markThemePending = (): void => {
  themePending = true
}

export async function retryTheme($: EngineInterface): Promise<void> {
  if (!themePending) {
    return
  }

  themePending = false

  await followTheme($).catch((error: unknown) => {
    themePending = true
    debugLog($, 'theme not read yet: ')(error)
  })
}
