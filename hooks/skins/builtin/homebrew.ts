import type { Skin } from '../skin'

// Homebrew, after hours. Not a copy of brew.sh, the room it suggests:
// espresso-wood surfaces, cream-foam text, one amber pour for you, and the tool
// kinds split into warm (things that make) and cool (things that look).
// Light mode is the same bar at noon: parchment, brown ink, colours steeped darker.
const skin: Skin = {
  name: 'homebrew',
  label: 'Homebrew',
  palette: {
    read: '#86bcd0', // cool glass: looking, not touching
    write: '#ecc46c', // gold: something gets made
    run: '#74c0b2', // water through the lines
    search: '#b8bf6e', // hops: foraging
    web: '#98a8dc', // the sky outside the taproom
    mcp: '#cc9cc4', // a guest tap
    other: '#bfae92', // grain: neutral but warm, never grey
    user: '#fbb040', // the logo's beer: you get the loudest colour
    fg: '#f1dbb2', // cream foam, softer than the site so amber can sing
    muted: '#a8957a',
    surface: '#3a322b',
    zebra: '#2f2924',
    ok: '#93c07e',
    err: '#ec7f72',
    warn: '#e8925a', // copper, so a warning never reads as your own message
  },
  light: {
    read: '#2a6f8a',
    write: '#8a6a10',
    run: '#1d7a70',
    search: '#6e6e0a',
    web: '#4459a0',
    mcp: '#8c3f7e',
    other: '#6f6352',
    user: '#9a5c08',
    fg: '#362c22',
    muted: '#7c6b4e',
    surface: '#f4e7cd',
    zebra: '#f8eedb',
    ok: '#4f7a28',
    err: '#b23a2c',
    warn: '#b0541e',
  },
  spinner: [
    'Brewing',
    'Mashing',
    'Steeping',
    'Sparging',
    'Boiling',
    'Hopping',
    'Fermenting',
    'Conditioning',
    'Cellaring',
    'Tapping',
    'Pouring',
    'Bottling',
  ],
  done: ['Brewed', 'Poured', 'Bottled', 'Tapped', 'Cellared', 'Served'],
}

export default skin
