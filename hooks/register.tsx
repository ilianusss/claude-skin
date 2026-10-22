import type { Register } from 'claude-code'

import { hookApi } from './engine/api'
import { hookCommand } from './engine/command'
import { hookLifecycle } from './engine/lifecycle'
import { hookChromeRenders } from './engine/render-chrome'
import { hookReplyRenders } from './engine/render-reply'
import { hookToolRenders } from './engine/render-tools'
import { newTurn } from './engine/state'

// The plugin's entry (hooks.json). Only hooks/engine/ touches `$`; everything it draws with is
// pure, under the other folders. See docs/architecture.md.
export const register: Register = on => {
  const turn = newTurn()

  hookApi(on)
  hookLifecycle(on, turn)
  hookCommand(on, turn)
  hookToolRenders(on)
  hookReplyRenders(on, turn)
  hookChromeRenders(on, turn)
}
