// The mascot talks: short lines that read your garden and the clock, so it remembers you.
// Every line here comes from something the plugin really knows (the garden's day rows, the local
// clock, this session's tool results); nothing is made up about you.

import type { Garden } from '../types'
import { localDay, totals } from './garden'
import type { Lang } from './i18n'

type Line = { zh: string; en: string }
const say = (l: Line, lang: Lang) => l[lang]

/** Days between two local dates written YYYY-MM-DD. */
export function daysBetween(a: string, b: string): number {
  return Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86400000)
}

/** How many days in a row, ending today or yesterday, have a flower or a green run. */
export function streak(g: Garden, today: string): number {
  const active = (day: string) => {
    const r = g.days[day]
    return r !== undefined && r[0] + r[1] > 0
  }
  let n = 0
  let at = Date.parse(`${today}T00:00:00Z`)
  if (!active(today)) at -= 86400000
  while (active(new Date(at).toISOString().slice(0, 10))) {
    n++
    at -= 86400000
  }
  return n
}

/** The last day before today with anything planted, or undefined. */
export function lastDayBefore(g: Garden, today: string): string | undefined {
  return Object.entries(g.days)
    .filter(([d, [c, t]]) => d < today && c + t > 0)
    .map(([d]) => d)
    .sort()
    .pop()
}

/** What the mascot says when a session opens. An unreadable garden says nothing it cannot know. */
export function greeting(g: Garden, nowMs: number, lang: Lang): string {
  const h = new Date(nowMs).getHours()
  const today = localDay(nowMs)
  if (g.ok) {
    const t = totals(g, today)
    if (t.commits + t.green === 0) return say({ zh: '你好呀！提交一次，我就种第一朵花', en: "Hi! Commit once and I'll plant the first flower" }, lang)
    const last = lastDayBefore(g, today)
    const gap = last === undefined ? 0 : daysBetween(last, today)
    if (gap >= 3 && t.today[0] + t.today[1] === 0) return say({ zh: `好久不见！${gap} 天没来啦`, en: `Long time no see! ${gap} days` }, lang)
    const run = streak(g, today)
    if (run >= 3) return say({ zh: `我们连续第 ${run} 天见面啦`, en: `Day ${run} in a row together!` }, lang)
  }
  if (h < 5) return say({ zh: '这么晚还在呀，我陪你', en: "Still up? I'll stay with you" }, lang)
  if (h < 11) return say({ zh: '早呀，今天也一起加油', en: "Morning! Let's do this" }, lang)
  if (h >= 22) return say({ zh: '晚上好，别太晚哦', en: "Evening! Don't stay up too late" }, lang)
  return say({ zh: '我在这儿，开工吧', en: "I'm here. Let's begin" }, lang)
}

/** After a flower (commit) or a patch (green run): a line for the moments worth one, else nothing. */
export function afterPlant(g: Garden, today: string, what: 'commit' | 'green', lang: Lang): string | null {
  const t = totals(g, today)
  if (what === 'green') {
    return t.today[1] === 1 ? say({ zh: '今天第一次全绿！开一小片花', en: 'First all-green run today!' }, lang) : null
  }
  if (t.commits === 1) return say({ zh: '第一朵花种下啦！', en: 'The very first flower!' }, lang)
  if (t.commits % 100 === 0) return say({ zh: `第 ${t.commits} 朵！草地升级啦`, en: `Flower ${t.commits}! The meadow grew` }, lang)
  if (t.commits % 10 === 0) return say({ zh: '十朵花长成一丛啦', en: 'Ten flowers made a bush' }, lang)
  if ([5, 10, 20, 30].includes(t.today[0])) return say({ zh: `今天第 ${t.today[0]} 朵了，喝口水吧`, en: `${t.today[0]} today. Have some water` }, lang)
  return null
}

/** Late at night (0:00-4:59), when you send a message: a line at most once an hour. */
export function lateNight(nowMs: number, lang: Lang): string | null {
  const h = new Date(nowMs).getHours()
  return h < 5 ? say({ zh: `${h} 点了，我还陪着你`, en: `${h} am. Still here with you` }, lang) : null
}

/** After three failed tools in a row. */
export const calmDown = (lang: Lang) => say({ zh: '别急，我们慢慢来', en: "No rush. One step at a time" }, lang)

// ---------- the bubble ----------

const strip = (body: string) =>
  `<svg x="0" y="0" width="100%" height="100%" viewBox="0 0 400 1000" preserveAspectRatio="xMaxYMax meet">${body}</svg>`

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

// a rough width: a CJK character is about a full em, anything else about half
const width = (s: string, px: number) => [...s].reduce((w, ch) => w + (/[⺀-￿]/.test(ch) ? px : px * 0.56), 0)

/** Splits a line in two at a comma or space when it is too wide for the bubble. */
function wrap(text: string, px: number, max: number): string[] {
  if (width(text, px) <= max) return [text]
  const cut = [...text.matchAll(/[，,！!。 ]/g)].map(m => m.index ?? 0).filter(i => i > 0 && i < text.length - 1)
  const mid = text.length / 2
  const at = cut.sort((a, b) => Math.abs(a - mid) - Math.abs(b - mid))[0] ?? Math.ceil(mid)
  return [text.slice(0, at + 1).trim(), text.slice(at + 1).trim()]
}

/** The speech bubble above the mascot, its tail toward the head; grows to the left. */
export function talkLayer(text: string, headTop = 662): string {
  const px = 21
  const lines = wrap(text, px, 230)
  const w = Math.round(Math.max(...lines.map(l => width(l, px))) + 36)
  const h = 20 + lines.length * 28
  const right = 262
  const x = right - w
  // the tail's tip (y + h + 26) lands just above the head
  const y = headTop - 30 - h
  const texts = lines
    .map((l, i) => `<text x="${x + w / 2}" y="${y + 33 + i * 28}" text-anchor="middle" font-family="sans-serif" font-size="${px}" font-weight="600" fill="#4a3a28">${esc(l)}</text>`)
    .join('')
  return strip(
    // no fade-in: with motion off every <animate> is removed, and the bubble must still show
    `<g>` +
      `<path d="M${right - 46} ${y + h - 4} L${right - 8} ${y + h + 26} L${right - 22} ${y + h - 4}Z" fill="#fffdf6" stroke="#d8c9b0" stroke-width="3" stroke-linejoin="round"/>` +
      `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="22" fill="#fffdf6" stroke="#d8c9b0" stroke-width="3"/>` +
      `<path d="M${right - 44} ${y + h - 2} L${right - 24} ${y + h - 2}" stroke="#fffdf6" stroke-width="5"/>${texts}</g>`,
  )
}
