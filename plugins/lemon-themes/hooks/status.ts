// The mascot's speech bubble: what Claude is doing right now.
//   busy  Claude is thinking or running a tool: three dots taking turns
//   wait  Claude is waiting for you (a permission prompt, or a question it asked): a waving bubble
//   worry a tool just failed or the turn ended in an error: a "!" and a drop of sweat
//   idle  nothing: no bubble
// Drawn in the mascot's own strip (bottom right, 400 x 1000 units), above its head.

import type { Busy } from '../types'
import type { Lang } from './i18n'

const WORDS: Record<Lang, { wait: string }> = { zh: { wait: '👋 等你' }, en: { wait: '👋 your turn' } }

const strip = (body: string) =>
  `<svg x="0" y="0" width="100%" height="100%" viewBox="0 0 400 1000" preserveAspectRatio="xMaxYMax meet">${body}</svg>`

// a round bubble at (x, y) with its tail toward the mascot's head (lower right)
const bubble = (x: number, y: number, w: number, fill: string, stroke: string, inner: string, motion = '') =>
  `<g transform="translate(${x} ${y})"><g>${motion}` +
  `<path d="M${w / 2 - 30} 50 L${w / 2 + 12} 76 L${w / 2 - 6} 48Z" fill="${fill}" stroke="${stroke}" stroke-width="3" stroke-linejoin="round"/>` +
  `<rect x="${-w / 2}" y="0" width="${w}" height="54" rx="27" fill="${fill}" stroke="${stroke}" stroke-width="3"/>` +
  `<path d="M${w / 2 - 33} 49 L${w / 2 - 8} 49" stroke="${fill}" stroke-width="5"/>${inner}</g></g>`

const dots = [0, 1, 2]
  .map(
    i =>
      `<circle cx="${-22 + i * 22}" cy="27" r="7" fill="#7a6a58" opacity=".35">` +
      `<animate attributeName="opacity" values=".35;1;.35" dur="1.2s" begin="${i * 0.4}s" repeatCount="indefinite"/></circle>`,
  )
  .join('')

const WAVE = `<animateTransform attributeName="transform" type="rotate" values="-6 0 54;6 0 54;-6 0 54" dur=".9s" repeatCount="indefinite"/>`
const SHAKE = `<animateTransform attributeName="transform" type="translate" values="0 0;3 0;-3 0;0 0" dur=".4s" repeatCount="indefinite"/>`

/** While a tool runs: a question Claude asks you waits for your answer; anything else is work. */
export const statusWhileCalling = (tool: string): Busy => (tool === 'AskUserQuestion' ? 'wait' : 'busy')

/** The bubble for a state, or nothing when idle. */
// The bubbles were drawn for a mascot whose head tops out at y 676; each skin moves them to its own.
const at = (headTop: number, body: string) => (body === '' ? '' : strip(`<g transform="translate(0 ${Math.round(headTop - 676)})">${body}</g>`))

/** The bubble for a state, standing on a head that tops out at `headTop`, or nothing when idle. */
export function statusLayer(state: Busy, lang: Lang, headTop = 676): string {
  const inner = statusBody(state, lang)
  return at(headTop, inner)
}

function statusBody(state: Busy, lang: Lang): string {
  if (state === 'busy') return (bubble(190, 600, 104, '#fffdf6', '#d8c9b0', dots))
  if (state === 'wait') {
    const text = `<text x="0" y="36" text-anchor="middle" font-family="sans-serif" font-size="24" font-weight="700" fill="#5a4630">${WORDS[lang].wait}</text>`
    return (bubble(180, 596, lang === 'zh' ? 128 : 170, '#fff4c9', '#e2b33c', text, WAVE))
  }
  if (state === 'worry') {
    const text = `<text x="0" y="40" text-anchor="middle" font-family="sans-serif" font-size="34" font-weight="800" fill="#c0392b">!</text>`
    const sweat = `<path d="M262 660 C252 676 254 688 264 688 C274 688 276 676 262 660Z" fill="#9fd3f0" stroke="#5b9cc4" stroke-width="2"/>`
    return (bubble(200, 600, 64, '#fff0ec', '#e58a7a', text, SHAKE) + sweat)
  }
  return ''
}
