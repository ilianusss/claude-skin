import type { EngineInterface, FsEntry, Timer } from 'claude-code'

import type { CustomSkin } from '../../types'
import { customFromFile, customToFile } from '../skins/custom'
import { debugLog, setCustom } from './state'

// The person's own skins: `<config>/skins/<name>.json`, written by the make-skin skill or the
// settings pane's repaint. Polled, so editing the skin in use redraws it.
const POLL_MS = 2000

let dir: string | undefined
let signature = ''
let poller: Timer | undefined

async function skinsDirOf($: EngineInterface): Promise<string | undefined> {
  const config = await $.env.get('CLAUDE_CONFIG_DIR')
  const home = (await $.env.get('HOME')) ?? (await $.env.get('USERPROFILE'))
  const base = config !== undefined && config.trim() !== '' ? config.trim() : home === undefined ? undefined : `${home}/.claude`

  return base === undefined ? undefined : `${base.replace(/[\\/]+$/, '')}/skins`
}

async function skinFiles($: EngineInterface, from: string): Promise<FsEntry[]> {
  return (await $.fs.list(from).catch(() => [])).filter(entry => entry.kind === 'file' && entry.name.endsWith('.json'))
}

const signatureOf = (files: readonly FsEntry[]): string =>
  files
    .map(file => `${file.name}:${file.mtimeMs}:${file.size}`)
    .sort()
    .join('|')

async function readSkins($: EngineInterface, from: string, files: readonly FsEntry[]): Promise<Record<string, CustomSkin>> {
  const custom: Record<string, CustomSkin> = {}

  for (const file of files) {
    const skin = customFromFile(file.name, await $.fs.read(`${from}/${file.name}`).catch(() => ''))

    if (typeof skin === 'string') {
      debugLog($, 'skin file ')(skin)
    } else {
      custom[skin.name] = skin
    }
  }

  return custom
}

export async function loadSkinFiles($: EngineInterface): Promise<Record<string, CustomSkin>> {
  // Without an environment to read there is no folder; the built-ins still load.
  dir = await skinsDirOf($).catch(() => undefined)

  if (dir === undefined) {
    return {}
  }

  const files = await skinFiles($, dir)
  signature = signatureOf(files)

  return readSkins($, dir, files)
}

async function refresh($: EngineInterface, from: string): Promise<void> {
  const files = await skinFiles($, from)
  const now = signatureOf(files)

  if (now === signature) {
    return
  }

  signature = now
  const custom = await readSkins($, from, files)
  await setCustom($, custom)
}

export function watchSkinFiles($: EngineInterface): void {
  poller?.cancel()
  const from = dir
  poller = from === undefined ? undefined : $.clock.every(POLL_MS, () => void refresh($, from).catch(debugLog($, 'skin files: ')))
}

export function stopSkinFiles(): void {
  poller?.cancel()
  poller = undefined
}

export async function saveSkinFile($: EngineInterface, skin: CustomSkin): Promise<void> {
  if (dir === undefined) {
    throw new Error('no skins folder (HOME and CLAUDE_CONFIG_DIR are unset)')
  }

  await $.fs.write(`${dir}/${skin.name}.json`, customToFile(skin))
}
