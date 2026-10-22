import { DEFAULT_PREFS } from '../prefs/command'
import { SKINS } from './builtin'
import { resolveSkin, skinNames } from './custom'
import type { Customs } from './custom'
import type { Skin } from './skin'
import type { ThemeHome } from './theme-home'

// Where the skins come from: the built-ins and the person's skin files, or in .theme mode only
// the palettes of the theme home.
export type Catalog = { custom: Customs; theme: ThemeHome | null }

export const namesOf = ({ custom, theme }: Catalog): string[] =>
  theme === null ? skinNames(custom) : theme.skins.map(skin => skin.name)

export const skinOf = (name: string, { custom, theme }: Catalog): Skin | undefined =>
  theme === null ? resolveSkin(name, custom) : theme.skins.find(skin => skin.name === name)

// The skin `/skin on` and a missing skin fall back to.
export const fallbackOf = ({ theme }: Catalog): string =>
  theme === null ? DEFAULT_PREFS.skin : (theme.current ?? theme.skins[0]?.name ?? DEFAULT_PREFS.skin)

export const kindOf = (name: string, { theme }: Catalog): string =>
  theme !== null ? 'theme palette' : SKINS.some(skin => skin.name === name) ? 'built in' : 'yours'
