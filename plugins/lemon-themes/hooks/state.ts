// The plugin's values: what the session draws from, and what /skin keeps between sessions.

import type { Options } from '../types'
import type { L } from './i18n'

/** Everything on, as a new install starts. */
export const DEFAULT_OPTIONS: Options = { motion: true, floaters: true, bubbles: true, band: true, cheers: true, nap: true, garden: true, status: true, talk: true }

/** The switches in the /skin pane, in order, with what each one turns off. */
export const SWITCHES: { key: keyof Options; label: L; off: L }[] = [
  { key: 'motion', label: { zh: '背景动画', en: 'Backdrop motion' }, off: { zh: '关掉后背景静止，适合性能一般的电脑', en: 'Off: the backdrop holds still, for slower computers' } },
  { key: 'floaters', label: { zh: '飘浮贴纸', en: 'Floating stickers' }, off: { zh: '关掉后两边只留背景和吉祥物', en: 'Off: only the backdrop and the mascot in the margins' } },
  { key: 'bubbles', label: { zh: '气泡上的小贴纸', en: 'Stickers on messages' }, off: { zh: '关掉后你的消息和回复不再贴小贴纸', en: 'Off: no stickers on your messages or the replies' } },
  { key: 'band', label: { zh: '输入框上方的用量条', en: 'Usage band above the prompt' }, off: { zh: '关掉后用量只在 /skin usage 里看', en: 'Off: see usage with /skin usage only' } },
  { key: 'cheers', label: { zh: '庆祝和点击特效', en: 'Celebrations and click effects' }, off: { zh: '关掉后提交、测试通过和点击都不放特效', en: 'Off: no effects for commits, passing tests or clicks' } },
  { key: 'garden', label: { zh: '陪伴花园', en: 'Companion garden' }, off: { zh: '关掉后不画花，提交和测试照样记在本机', en: 'Off: no flowers drawn; commits and tests are still counted on this computer' } },
  { key: 'status', label: { zh: '吉祥物报状态', en: 'Mascot shows what Claude is doing' }, off: { zh: '关掉后不再冒「思考中 / 等你 / 出错了」的小气泡', en: 'Off: no "thinking / your turn / something failed" bubbles' } },
  { key: 'talk', label: { zh: '吉祥物会说话', en: 'The mascot talks' }, off: { zh: '关掉后不再冒「早呀」「连续第 3 天」这类小话', en: 'Off: no little lines like "Morning!" or "Day 3 in a row"' } },
  { key: 'nap', label: { zh: '吉祥物打盹', en: "The mascot's nap" }, off: { zh: '关掉后吉祥物一直醒着', en: 'Off: the mascot stays awake' } },
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
