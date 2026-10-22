import type { On } from 'claude-code'

import type { Prefs } from '../../types'
import { copyOf } from '../markdown/markdown'
import { DEFAULT_PREFS, listing, nextTables, runSkinCommand, TOGGLES, withCalm } from '../prefs/command'
import { fallbackOf, kindOf, namesOf, skinOf } from '../skins/catalog'
import { withSlot } from '../skins/custom'
import { galleryPane } from '../ui/gallery'
import { settingsPane } from '../ui/settings'
import { messageOf } from '../util/format'
import { firstDraws, withSettle } from './entrances'
import { activeSkin, lookOf } from './look'
import { commit, runFolderCommand } from './prefs'
import { saveSkinFile } from './skin-files'
import { addCustom, catalogOf, getEditing, getLastReply, getMore, getPinned, getPrefs, setEditing, setMore, toggleMore } from './state'
import type { Turn } from './state'

export const SETTINGS = 'skin-settings'
const GALLERY = 'skin-gallery'

// The settings pane's prompt button cycles through these.
const PROMPT_NEXT: Readonly<Record<Prefs['prompt'], Prefs['prompt']>> = { left: 'right', right: 'plain', plain: 'left' }

export function hookCommand(on: On, turn: Turn): void {
  on('command.run', { command: 'skin' }, async ($, e) => {
    const word = e.args.trim().toLowerCase()

    if (word === '') {
      await setMore($, false)
      await $.ui.open({ id: SETTINGS, title: 'Skin', focus: true, closeOnEscape: true })

      return {}
    }

    if (word === 'gallery') {
      await $.ui.open({ id: GALLERY, title: 'Skin gallery', focus: true, closeOnEscape: true })

      return {}
    }

    if (word === 'copy' || word === 'copy code') {
      const copied = copyOf(await getLastReply($), word === 'copy code')

      if ('message' in copied) {
        $.ui.toast(copied.message)
      } else {
        const result = await $.ui.copy({ text: copied.text })
        $.ui.toast(result.isCopied ? (word === 'copy' ? 'Copied the reply' : 'Copied the code') : 'Could not copy here')
      }

      return {}
    }

    if (word === 'pin' || word === 'unpin' || word === 'share') {
      $.ui.toast(await runFolderCommand($, word))

      return {}
    }

    const current = await getPrefs($)
    const catalog = await catalogOf($)
    const names = namesOf(catalog)

    if (word === 'list') {
      const folder = (await getPinned($)) ? 'pinned' : 'follows the default'
      const extra: [string, string][] = [
        ['this folder', folder],
        ...(catalog.theme === null ? [] : [['skins from', `${catalog.theme.home}/colors`] as [string, string]]),
        ...(turn.lastColumns === undefined ? [] : [['reply width', `${turn.lastColumns} columns`] as [string, string]]),
      ]

      return { text: listing(current, names, extra, name => kindOf(name, catalog)) }
    }

    const outcome = runSkinCommand(e.args, current, names, fallbackOf(catalog))

    if (outcome.prefs !== current) {
      await commit($, outcome.prefs)
    }

    if (outcome.channel === 'row') {
      return { text: outcome.message }
    }

    $.ui.toast(outcome.message)

    return {}
  })

  on('ui.render', { component: 'Pane', requestId: SETTINGS }, async ($, e) => {
    const prefs = await getPrefs($)
    const catalog = await catalogOf($)
    const { custom, theme } = catalog
    const editing = await getEditing($)
    const more = await getMore($)
    const skin = skinOf(prefs.skin, catalog) ?? skinOf(fallbackOf(catalog), catalog)
    const ui = $.ui.resolve(e)

    if (skin === undefined || e.surface === 'mobile' || !('Input' in ui)) {
      return <ui.Text>Open the skin settings in the terminal or the desktop app.</ui.Text>
    }

    const look = lookOf(ui, { prefs, custom, skin }, e.surface)
    const set = (next: Prefs) => void commit($, next)
    const model = {
      names: namesOf(catalog),
      more,
      editing,
      width: e.props.bodyColumns,
      ...(theme === null ? {} : { colorsFrom: `${theme.home}/colors/${skin.name}/palette` }),
    }

    return settingsPane(look, ui, model, {
      pick: name => set({ ...prefs, skin: name }),
      more: () => void toggleMore($),
      toggle: word => set({ ...prefs, [TOGGLES[word]]: !prefs[TOGGLES[word]] }),
      calm: () => set(withCalm(prefs, prefs.calm === null)),
      tables: () => set({ ...prefs, tables: nextTables(prefs.tables) }),
      icons: () => set({ ...prefs, icons: prefs.icons === 'unicode' ? 'ascii' : 'unicode' }),
      prompt: () => set({ ...prefs, prompt: PROMPT_NEXT[prefs.prompt] }),
      words: () => set({ ...prefs, words: prefs.words === 'skin' ? 'claude' : 'skin' }),
      edit: slot => void setEditing($, slot),
      // A built-in skin forks into my-<skin>.json; a file skin is rewritten.
      paint: hex => {
        const made = withSlot(prefs.skin === 'off' ? DEFAULT_PREFS.skin : prefs.skin, custom, editing, hex)

        if (typeof made === 'string') {
          $.ui.toast(made)

          return
        }

        void (async () => {
          await addCustom($, made.skin)
          await commit($, { ...prefs, skin: made.name })
          await saveSkinFile($, made.skin).catch((error: unknown) => $.ui.toast(`Could not save ${made.name}.json: ${messageOf(error)}`))
        })()
      },
    })
  })

  // Every element the skin draws, numbered, to point at when asking for a change.
  on('ui.render', { component: 'Pane', requestId: GALLERY }, async ($, e) => {
    const active = await activeSkin($)
    const ui = $.ui.resolve(e)

    if (active === null) {
      return <ui.Text>The gallery shows a skin. Pick one with /skin first.</ui.Text>
    }

    const look = lookOf(ui, active, e.surface)

    return withSettle($, e, galleryPane({ ...look, ...(look.svg === undefined ? {} : { isFirstDraw: await firstDraws($, e, active.prefs) }) }, e.props.bodyColumns))
  })
}
