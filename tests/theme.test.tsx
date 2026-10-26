import type { On, RenderElement } from 'claude-code'
import { expect, mock, test } from 'claude-code/testing'
import type { Engine } from 'claude-code/testing'

import { runSkinCommand, DEFAULT_PREFS } from '../hooks/prefs/command'
import gruvbox from '../hooks/skins/builtin/gruvbox'
import noir from '../hooks/skins/builtin/noir'
import { fallbackOf, kindOf, namesOf, skinOf } from '../hooks/skins/catalog'
import { customFromFile, customToFile } from '../hooks/skins/custom'
import { mix } from '../hooks/skins/light'
import { expandHome, folderName, paletteSkin, parsePalette } from '../hooks/skins/theme-home'
import type { ThemeHome } from '../hooks/skins/theme-home'

const BASE16 = `
base00="#282828"
base01="#32302f"
base02="#504945"
base03="#665c54"
base04="#bdae93"
base05="#d4be98"
base06="#ebdbb2"
base07="#fbf1c7"
base08="#ea6962"
base09="#e78a4e"
base0A="#d8a657"
base0B="#a9b665"
base0C="#89b482"
base0D="#7daea3"
base0E="#d3869b"
base0F="#bd6f3e"
`

const palette = (head: string) => `# a palette\n${head}\n${BASE16}`

test('a palette parses quoted and bare values and skips comments', () => {
  const keys = parsePalette('# Gruvbox — https://x\nname="Gruvbox Material"\nvariant=dark\nbase00="#282828"   # bg\nnvim_colorscheme=gruvbox\n  # claude_skin=nope\n')

  expect(keys).toEqual({ name: 'Gruvbox Material', variant: 'dark', base00: '#282828', nvim_colorscheme: 'gruvbox' })
})

test('a palette without claude_skin derives every slot from base16', () => {
  const skin = paletteSkin('gruvbox-material-dark', parsePalette(palette('name="Gruvbox Material Dark"\nvariant=dark')))

  expect(skin?.name).toBe('gruvbox-material-dark')
  expect(skin?.label).toBe('Gruvbox Material Dark')
  expect(skin?.palette).toEqual({
    fg: '#d4be98',
    muted: '#bdae93',
    surface: '#32302f',
    zebra: mix('#282828', '#32302f', 0.5),
    user: '#7daea3',
    ok: '#a9b665',
    err: '#ea6962',
    warn: '#e78a4e',
    read: '#7daea3',
    write: '#e78a4e',
    run: '#a9b665',
    search: '#d3869b',
    web: '#89b482',
    mcp: '#d8a657',
    other: '#bdae93',
  })
  expect(skin?.light).toEqual(skin?.palette)
  expect(skin?.spinner).toEqual(noir.spinner)
})

test('claude_skin starts from a built-in skin, words and light palette included, and claude_<slot> overrides', () => {
  const skin = paletteSkin('g', parsePalette(palette('variant=dark\nclaude_skin=gruvbox\nclaude_user="#FF0000"\nclaude_nope="#00ff00"\nclaude_run=red')))

  expect(skin?.palette).toEqual({ ...gruvbox.palette, user: '#ff0000' })
  expect(skin?.spinner).toEqual(gruvbox.spinner)
  expect(skin?.done).toEqual(gruvbox.done)
})

test('a palette missing a base16 key, or with a bad hex, is no skin', () => {
  expect(paletteSkin('broken', parsePalette('name="Broken"\nbase00="#000000"'))).toBeUndefined()
  expect(paletteSkin('bad-hex', parsePalette(palette('').replace('"#282828"', '"282828"')))).toBeUndefined()
})

test('the selected palette is the last part of the resolved link, and ~ expands against HOME', () => {
  expect(folderName('/Users/me/.theme/colors/kanagawa-paper-ink')).toBe('kanagawa-paper-ink')
  expect(folderName('C:\\Users\\me\\.theme\\colors\\nord\\')).toBe('nord')
  expect(folderName(undefined)).toBeNull()
  expect(expandHome('~/.theme', '/Users/me')).toBe('/Users/me/.theme')
  expect(expandHome('$HOME/.theme', '/Users/me')).toBe('/Users/me/.theme')
  expect(expandHome('/opt/theme', '/Users/me')).toBe('/opt/theme')
  expect(expandHome('~other/.theme', '/Users/me')).toBe('~other/.theme')
})

test('a skin file is named by its file and checked like any made skin', () => {
  const made = customFromFile('sunset.json', JSON.stringify({ name: 'ignored', label: 'Sunset', base: 'gruvbox', palette: { user: '#FF8A5B' }, spinner: ['Glowing'] }))

  expect(made).toEqual({ name: 'sunset', label: 'Sunset', base: 'gruvbox', palette: { user: '#ff8a5b' }, spinner: ['Glowing'], done: [] })
  expect(typeof made === 'string' ? undefined : customFromFile('sunset.json', customToFile(made))).toEqual(made)
  expect(customFromFile('x.json', '{ nope')).toMatch(/^x\.json: not JSON/)
  expect(customFromFile('x.json', '[]')).toBe('x.json: not a skin object')
  expect(customFromFile('nord.json', '{}')).toMatch(/taken by a built-in skin/)
  expect(customFromFile('x.json', '{"palette": {"user": "red"}}')).toMatch(/bad palette entries: user/)
})

test('the catalog is the built-ins and skin files, or in .theme mode only the palettes', () => {
  const sunset = { name: 'sunset', label: 'Sunset', base: 'nord', palette: {}, spinner: [], done: [] }
  const own = { custom: { sunset }, theme: null }
  const paper = paletteSkin('paper', parsePalette(palette('variant=light')))
  const theme: ThemeHome = { home: '/t', skins: paper === undefined ? [] : [paper], current: 'paper' }
  const themed = { custom: { sunset }, theme }

  expect(namesOf(own)).toContain('noir')
  expect(namesOf(own)).toContain('sunset')
  expect(namesOf(themed)).toEqual(['paper'])
  expect(skinOf('noir', themed)).toBeUndefined()
  expect(skinOf('paper', themed)?.name).toBe('paper')
  expect([kindOf('noir', own), kindOf('sunset', own), kindOf('paper', themed)]).toEqual(['built in', 'yours', 'theme palette'])
  expect(fallbackOf(own)).toBe(DEFAULT_PREFS.skin)
  expect(fallbackOf(themed)).toBe('paper')
  expect(fallbackOf({ custom: {}, theme: { ...theme, current: null } })).toBe('paper')
})

test('/skin on turns the fallback skin back on', () => {
  const off = { ...DEFAULT_PREFS, skin: 'off' }

  expect(runSkinCommand('on', off, ['paper'], 'paper').prefs.skin).toBe('paper')
  expect(runSkinCommand('on', off, ['noir']).prefs.skin).toBe(DEFAULT_PREFS.skin)
})

const SITE = { plugin: 'skin', viewport: { columns: 100, rows: 30 } } as const
const STOCK: RenderElement = { type: 'Text', props: {}, children: ['stock row'] }

const bashRow = (id: string) =>
  ({
    ...SITE,
    surface: 'terminal',
    component: 'ToolUse',
    requestId: id,
    props: { tool_use_id: id, tool: 'Bash', input: { command: 'ls' }, isRunning: false, isErrored: false, isInterrupted: false },
  }) as const

type Found = { props: Record<string, unknown>; children?: readonly unknown[] } | undefined

function spanColor(row: Found, text: string): unknown {
  for (const child of row?.children ?? []) {
    const element = child as { props?: { color?: unknown }; children?: readonly unknown[] }

    if (element.children?.[0] === text) {
      return element.props?.color
    }

    const inner = spanColor(element as Found, text)

    if (inner !== undefined) {
      return inner
    }
  }

  return undefined
}

async function bashColor($: Engine, id: string): Promise<unknown> {
  const row = await $.ui.mount(bashRow(id))
  const color = spanColor((await row.find({ type: 'Text', text: /Bash/ })) as Found, 'Bash')
  await row.unmount()

  return color
}

const runSkin = ($: Engine, args: string) =>
  $.command.run({ command: 'skin', args, origin: { kind: 'composer' }, presentation: { isFullscreen: false, columns: 100 } })

// A file system of plain text files and folders, with mtimes the test moves.
function fakeFs(on: On, files: Record<string, string>, links: Record<string, string> = {}) {
  const mtimes: Record<string, number> = {}
  const writes: string[] = []
  const parentOf = (path: string) => path.slice(0, path.lastIndexOf('/'))
  // Windows resolves a path before it reaches the hook: drop the drive and the backslashes.
  const at = (path: string) => path.replace(/^[A-Za-z]:/, '').replace(/\\/g, '/')

  on('fs.read', ($, e) => {
    const text = files[at(e.path)]

    if (text === undefined) {
      throw new Error(`ENOENT ${at(e.path)}`)
    }

    return { value: text }
  })
  on('fs.write', ($, e) => {
    files[at(e.path)] = e.text
    mtimes[at(e.path)] = (mtimes[at(e.path)] ?? 0) + 1
    writes.push(at(e.path))
    return { value: undefined }
  })
  on('fs.exists', ($, e) => ({ value: Object.keys(files).some(path => path === at(e.path) || path.startsWith(`${at(e.path)}/`)) }))
  on('fs.list', ($, e) => {
    const names = new Map<string, 'file' | 'dir'>()

    for (const path of Object.keys(files)) {
      if (path.startsWith(`${at(e.path)}/`)) {
        const [name = '', ...rest] = path.slice(at(e.path).length + 1).split('/')
        names.set(name, rest.length === 0 ? 'file' : 'dir')
      }
    }

    if (names.size === 0) {
      throw new Error(`ENOENT ${at(e.path)}`)
    }

    return {
      value: [...names].map(([name, kind]) => ({ name, kind, size: files[`${at(e.path)}/${name}`]?.length ?? 0, mtimeMs: mtimes[`${at(e.path)}/${name}`] ?? 0, isLink: false })),
    }
  })
  on('fs.stat', ($, e) => {
    const target = links[at(e.path)]

    if (target === undefined && files[at(e.path)] === undefined) {
      throw new Error(`ENOENT ${at(e.path)}`)
    }

    return { value: { kind: target === undefined ? 'file' : 'dir', size: 0, mtimeMs: mtimes[at(e.path)] ?? 0, isLink: target !== undefined, ...(target === undefined ? {} : { realPath: target }) } }
  })

  return {
    files,
    writes,
    touch: (path: string) => {
      mtimes[path] = (mtimes[path] ?? 0) + 1
      files[parentOf(path)] ??= ''
    },
  }
}

const exited = (exitCode: number, stderr = '') => ({ value: { exitCode, stdout: '', stderr, isStdoutTruncated: false, isStderrTruncated: false } })

// Only `theme` answers: the appearance probes (defaults, reg, gsettings) find nothing here.
const onlyTheme = (argv: readonly string[], exitCode = 0, stderr = '') => (argv[0]?.endsWith('/bin/theme') === true ? exited(exitCode, stderr) : exited(127))

function stubSession(on: On, env: Record<string, string | undefined>, own: { toast?: boolean } = {}) {
  const clock = mock.clock(on, { now: 10_000 })
  on('session.cwd', () => ({ value: '/work' }))
  on('env.get', ($, e) => ({ value: env[e.name] }))
  on('store.get', () => ({ value: undefined }))
  on('store.set', () => ({ value: undefined }))
  if (!own.toast) {
    on('ui.toast', () => ({ value: undefined }))
  }
  on('ui.open', () => ({ value: { isPlaced: true } }))
  on('ui.log', () => ({ value: undefined }))
  on('session.usage', () => ({ value: { startedAt: 0, context: { window: 200000, percent: 42 }, rateLimits: [] } }))
  on('ui.render', () => STOCK)
  on('session.start', () => ({ cwd: '/work' }))
  on('command.register', () => ({ value: { command: 'skin' } }))
  on('config.list', () => ({ value: [] }))

  return clock
}

const HOME = '/t'
const themeFiles = (home = HOME) => ({
  [`${home}/colors/gruvbox-material-dark/palette`]: palette('name="Gruvbox Material Dark"\nvariant=dark'),
  [`${home}/colors/homebrew-dark/palette`]: palette('name="Homebrew Dark"\nvariant=dark\nclaude_skin=homebrew\nclaude_run="#123456"'),
  [`${home}/generated/stamp`]: 'gruvbox-material-dark jetbrains-mono\n',
})

test('.theme mode lists only the palettes, draws the selected one, and /skin <palette> runs theme colors', async ($, on) => {
  stubSession(on, { SKIN_THEME_HOME: HOME, HOME: '/home/me' })
  const fs = fakeFs(on, themeFiles(), { [`${HOME}/current/colors`]: `${HOME}/colors/gruvbox-material-dark` })
  const ran: { argv: readonly string[]; env?: Record<string, string> }[] = []
  on('process.run', ($, e) => {
    ran.push({ argv: e.argv, ...(e.init?.env === undefined ? {} : { env: e.init.env }) })
    return onlyTheme(e.argv)
  })

  await $.session.start({ surface: 'terminal', isInteractive: true, cwd: '/work' })

  expect(await bashColor($, 'a')).toBe('#a9b665')

  const listed = (await runSkin($, 'list')).text ?? ''
  expect(listed).toMatch(/\| gruvbox-material-dark \(current\) +\| theme palette +\|/)
  expect(listed).toMatch(/\| homebrew-dark +\| theme palette +\|/)
  expect(listed).not.toMatch(/\| noir /)
  expect(listed).toMatch(/\| skins from +\| \/t\/colors +\|/)
  expect((await runSkin($, 'noir')).text).toMatch(/unknown skin "noir"/)

  await runSkin($, 'homebrew-dark')
  expect(ran.filter(run => run.argv[0] === `${HOME}/bin/theme`)).toEqual([{ argv: [`${HOME}/bin/theme`, 'colors', 'homebrew-dark'], env: { THEME_HOME: HOME } }])
  expect(await bashColor($, 'b')).toBe('#123456')
  expect(fs.writes).toEqual([])
})

test('.theme mode follows a theme switched elsewhere, and /skin off stays off', async ($, on) => {
  const clock = stubSession(on, { HOME: '/home/me' })
  on('settings.read', () => ({ value: { env: { SKIN_THEME_HOME: '~/theme' } } as never }))
  const home = '/home/me/theme'
  const links = { [`${home}/current/colors`]: `${home}/colors/gruvbox-material-dark` }
  const fs = fakeFs(on, themeFiles(home), links)
  on('process.run', ($, e) => onlyTheme(e.argv))

  await $.session.start({ surface: 'terminal', isInteractive: true, cwd: '/work' })
  expect(await bashColor($, 'a')).toBe('#a9b665')

  links[`${home}/current/colors`] = `${home}/colors/homebrew-dark`
  fs.touch(`${home}/generated/stamp`)
  await clock.advance(2000)
  expect(await bashColor($, 'b')).toBe('#123456')

  await runSkin($, 'off')
  links[`${home}/current/colors`] = `${home}/colors/gruvbox-material-dark`
  fs.touch(`${home}/generated/stamp`)
  await clock.advance(2000)
  const row = await $.ui.mount(bashRow('c'))
  expect(await row.find({ type: 'Text', text: 'stock row' })).toBeDefined()
})

test('a failing theme command is told in a toast and the selection stays', async ($, on) => {
  stubSession(on, { SKIN_THEME_HOME: HOME }, { toast: true })
  const toasts: string[] = []
  on('ui.toast', ($, e) => {
    toasts.push(e.text)
    return { value: undefined }
  })
  fakeFs(on, themeFiles(), { [`${HOME}/current/colors`]: `${HOME}/colors/gruvbox-material-dark` })
  on('process.run', ($, e) => onlyTheme(e.argv, 1, 'theme: no colors x\n'))

  await $.session.start({ surface: 'terminal', isInteractive: true, cwd: '/work' })
  await runSkin($, 'homebrew-dark')

  expect(toasts).toContain('theme colors homebrew-dark failed: theme: no colors x')
})

test('skin files load from <config>/skins, a repaint writes one, and an edited file redraws', async ($, on) => {
  const clock = stubSession(on, { HOME: '/home/me' })
  const dir = '/home/me/.claude/skins'
  const fs = fakeFs(on, { [`${dir}/sunset.json`]: JSON.stringify({ base: 'noir', palette: { run: '#111111' } }) })
  on('process.run', () => exited(127))

  await $.session.start({ surface: 'terminal', isInteractive: true, cwd: '/work' })
  expect((await runSkin($, 'list')).text).toMatch(/\| sunset +\| yours +\|/)

  await runSkin($, 'sunset')
  expect(await bashColor($, 'a')).toBe('#111111')

  fs.files[`${dir}/sunset.json`] = JSON.stringify({ base: 'noir', palette: { run: '#222222' } })
  fs.touch(`${dir}/sunset.json`)
  await clock.advance(2000)
  expect(await bashColor($, 'b')).toBe('#222222')

  await runSkin($, 'dracula')
  const pane = await $.ui.mount({ ...SITE, surface: 'desktop', component: 'Pane', requestId: 'skin-settings', props: { title: 'Skin', isFocused: true, bodyColumns: 80, placement: 'inline', scroll: { offset: 0, bodyRows: 30 }, view: {} } })
  await pane.input({ key: 'hex', text: '#ff0000' })
  await pane.unmount()
  await clock.advance(0)

  expect(fs.writes).toEqual([`${dir}/my-dracula.json`])
  expect(JSON.parse(fs.files[`${dir}/my-dracula.json`] ?? '{}')).toEqual({ label: 'My dracula', base: 'dracula', palette: { user: '#ff0000' }, spinner: [], done: [] })
})

test('CLAUDE_CONFIG_DIR moves the skins folder', async ($, on) => {
  stubSession(on, { HOME: '/home/me', CLAUDE_CONFIG_DIR: '/home/me/.claude-team/' })
  fakeFs(on, { '/home/me/.claude-team/skins/team.json': '{"base": "nord"}' })

  await $.session.start({ surface: 'terminal', isInteractive: true, cwd: '/work' })

  expect((await runSkin($, 'list')).text).toMatch(/\| team +\| yours +\|/)
})
