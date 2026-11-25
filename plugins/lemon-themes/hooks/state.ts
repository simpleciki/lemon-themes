// The plugin's values: what the session draws from, and what /skin keeps between sessions.

import type { Options } from '../types'

/** Everything on, as a new install starts. */
export const DEFAULT_OPTIONS: Options = { motion: true, floaters: true, bubbles: true, band: true, cheers: true, nap: true }

/** The switches in the /skin pane, in order, with what each one turns off. */
export const SWITCHES: { key: keyof Options; label: string; off: string }[] = [
  { key: 'motion', label: '背景动画', off: '关掉后背景静止，适合性能一般的电脑' },
  { key: 'floaters', label: '飘浮贴纸', off: '关掉后两边只留背景和吉祥物' },
  { key: 'bubbles', label: '气泡上的小贴纸', off: '关掉后你的消息和回复不再贴小贴纸' },
  { key: 'band', label: '输入框上方的用量条', off: '关掉后用量只在 /skin usage 里看' },
  { key: 'cheers', label: '庆祝和点击特效', off: '关掉后提交、测试通过和点击都不放特效' },
  { key: 'nap', label: '吉祥物打盹', off: '关掉后吉祥物一直醒着' },
]

/** Reads saved options, keeping a default for any switch an older version did not save. */
export function savedOptions(value: unknown): Options {
  const o = { ...DEFAULT_OPTIONS }
  if (value !== null && typeof value === 'object') {
    for (const { key } of SWITCHES) {
      const v = (value as Record<string, unknown>)[key]
      if (typeof v === 'boolean') o[key] = v
    }
  }
  return o
}
