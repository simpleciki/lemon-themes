// The companion garden: every successful `git commit` plants a flower on the bank, every all-green
// test run opens a little patch. What is kept: one row per local day in $.store, never one per event.
//
// Data contract (docs/design/companion-garden.md, the four questions):
//   in      a Bash `git commit` or test command that ran without error (tool.call), and the local clock
//   kept    $.store key "garden" = { v: 1, days: { "YYYY-MM-DD": [commits, greenRuns] } }
//   a unit  one flower = one successful commit; the day is the person's local date
//   failure a store that cannot be read gives { ok: false }: the garden then says so in words and
//           draws no flowers, and nothing is written over the old record

import type { Garden } from '../types'
import type { Lang } from './i18n'

export const GARDEN_KEY = 'garden'
/** The whole store may hold 4 MiB; the garden keeps well under a tenth of it. */
export const STORE_BUDGET = 400 * 1024
/** The app refuses a backdrop Svg over this many characters. */
export const SVG_LIMIT = 131072

export const EMPTY_GARDEN: Garden = { ok: true, days: {} }

/** The person's local date of a moment, `YYYY-MM-DD`. */
export function localDay(ms: number): string {
  const d = new Date(ms)
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

const DAY = /^\d{4}-\d{2}-\d{2}$/
const count = (v: unknown) => typeof v === 'number' && Number.isInteger(v) && v >= 0

/** What the store held, checked. Unset = a new garden; anything else that is not a garden = unreadable. */
export function parseGarden(value: unknown): Garden {
  if (value === undefined) return { ok: true, days: {} }
  if (value === null || typeof value !== 'object') return { ok: false, days: {}, why: 'read' }
  const days = (value as { days?: unknown }).days
  if ((value as { v?: unknown }).v !== 1 || days === null || typeof days !== 'object') return { ok: false, days: {}, why: 'read' }
  const out: Record<string, [number, number]> = {}
  for (const [k, row] of Object.entries(days as Record<string, unknown>)) {
    if (!DAY.test(k) || !Array.isArray(row) || row.length !== 2 || !count(row[0]) || !count(row[1])) {
      return { ok: false, days: {}, why: 'read' }
    }
    out[k] = [row[0] as number, row[1] as number]
  }
  return { ok: true, days: out }
}

/** The stored form of a garden. */
export const storedGarden = (g: Garden) => ({ v: 1, days: g.days })

/** The garden with today's row moved on by a commit or a green run. */
export function plant(g: Garden, day: string, what: 'commit' | 'green'): Garden {
  const [c, t] = g.days[day] ?? [0, 0]
  return { ...g, days: { ...g.days, [day]: what === 'commit' ? [c + 1, t] : [c, t + 1] } }
}

export type Totals = { commits: number; green: number; days: number; today: [number, number]; greenThisWeek: number }

export function totals(g: Garden, today: string): Totals {
  let commits = 0
  let green = 0
  let greenThisWeek = 0
  const weekAgo = Date.parse(`${today}T00:00:00Z`) - 6 * 86400000
  for (const [day, [c, t]] of Object.entries(g.days)) {
    commits += c
    green += t
    if (Date.parse(`${day}T00:00:00Z`) >= weekAgo && day <= today) greenThisWeek += t
  }
  const days = Object.values(g.days).filter(([c, t]) => c + t > 0).length
  return { commits, green, days, today: g.days[today] ?? [0, 0], greenThisWeek }
}

/**
 * How the flowers grow up, so a year of work still fits: every 10 flowers become a bush, every
 * 100 a landmark (the meadow levels up). At most 9 flowers, 9 bushes and 4 landmarks are drawn,
 * whatever the total; the total itself is written on the bank.
 */
export function stages(commits: number, greenThisWeek: number) {
  return {
    landmarks: Math.min(4, Math.floor(commits / 100)),
    bushes: Math.floor((commits % 100) / 10),
    flowers: commits % 10,
    patches: Math.min(6, greenThisWeek),
    level: Math.floor(commits / 100) + 1,
  }
}

/** What a skin plants, for the look it is in: sprite ids its backdrop already defines. */
export type GardenKit = {
  flower: string
  bush: string
  landmark: string
  bloom: string
  /** A sprite's size, to stand it on the ground by its foot. */
  size: (name: string) => { w: number; h: number }
  /** A sprite's definition (`<g id="s-name">…</g>`), for drawings outside the backdrop. */
  def: (name: string) => string
  /** Text colour on the bank. */
  ink: string
  /** A skin with no ground of its own (the bear's gingham) gets a low mound in this colour. */
  mound?: string
}

// Where things stand, in the side strips' 400 x 1000 units (the bank at the bottom). Back row
// first. The right strip stops at x 200: the mascot stands at about 285.
type Slot = [side: 'L' | 'R', x: number, y: number]
const BACK: Slot[] = [['L', 120, 950], ['L', 330, 948], ['R', 60, 952], ['L', 230, 946]]
const MID: Slot[] = [
  ['L', 60, 966], ['L', 180, 962], ['L', 290, 968], ['R', 130, 966], ['L', 370, 970],
  ['L', 120, 974], ['R', 30, 972], ['L', 240, 976], ['R', 185, 974],
]
const FRONT: Slot[] = [
  ['L', 40, 990], ['L', 95, 994], ['L', 150, 990], ['L', 205, 995], ['L', 260, 991],
  ['L', 315, 995], ['L', 365, 990], ['R', 70, 993], ['R', 150, 992],
]
const PATCH: Slot[] = [['L', 70, 984], ['L', 200, 984], ['L', 330, 984], ['R', 40, 986], ['L', 135, 986], ['R', 110, 986]]

// k is for a sprite about 100 units across (the traced skins); a pixel sprite of 16 is scaled up to match
const put = (kit: GardenKit, name: string, x: number, y: number, k: number) => {
  const s = kit.size(name)
  const sk = +(k * (100 / Math.max(1, s.w, s.h))).toFixed(3)
  return `<use href="#s-${name}" x="${Math.round(-s.w / 2)}" y="${-s.h}" transform="translate(${x} ${y}) scale(${sk})"/>`
}

const side = (which: 'L' | 'R', body: string) =>
  body === ''
    ? ''
    : `<svg x="${which === 'L' ? 300 : 0}" y="0" width="100%" height="100%" viewBox="0 0 400 1000" preserveAspectRatio="${which === 'L' ? 'xMinYMid' : 'xMaxYMid'} meet">${body}</svg>`

const WORDS = {
  zh: { unreadable: '读不到花园记录', unwritable: '花园记录存不进去', count: (n: number, lv: number) => `🌼 ${n} · 第 ${lv} 片草地` },
  en: { unreadable: "Can't read your garden records", unwritable: "Can't save your garden records", count: (n: number, lv: number) => `🌼 ${n} · meadow ${lv}` },
}

/**
 * The garden drawn over a backdrop, in at most `budget` characters: the bank's words first, then
 * landmarks, bushes, patches and flowers, until the budget runs out (the count on the bank stays true).
 */
export function gardenLayer(g: Garden, today: string, kit: GardenKit, lang: Lang, budget: number): string {
  const w = WORDS[lang]
  // above the bank, with a white halo so it reads over grass and stickers
  const label = (text: string, color: string) =>
    `<text x="200" y="872" text-anchor="middle" font-family="sans-serif" font-size="22" font-weight="700" fill="${color}" stroke="#fff" stroke-width="5" paint-order="stroke" stroke-linejoin="round">${text}</text>`
  const mound = kit.mound === undefined ? '' : `<path d="M10 1004 C20 950 80 936 200 934 C320 936 380 950 390 1004Z" fill="${kit.mound}" opacity=".8"/>`
  if (!g.ok) {
    // never an empty meadow that looks like nothing was ever planted: say what went wrong
    return side('L', mound + label(g.why === 'write' ? w.unwritable : w.unreadable, '#c0392b'))
  }
  const t = totals(g, today)
  const st = stages(t.commits, t.greenThisWeek)
  const parts: { L: string[]; R: string[] } = { L: [mound], R: [] }
  // both strips' wrappers count, even before anything is in them
  let used = side('L', '-').length - 1 + (side('R', '-').length - 1) + mound.length
  const add = (slot: Slot, svg: string) => {
    if (used + svg.length > budget) return false
    parts[slot[0]].push(svg)
    used += svg.length
    return true
  }
  if (t.commits > 0 || t.green > 0) add(['L', 0, 0], label(w.count(t.commits, st.level), kit.ink))
  const queue: [Slot | undefined, string, number][] = [
    ...BACK.slice(0, st.landmarks).map((s): [Slot, string, number] => [s, kit.landmark, 0.62]),
    ...MID.slice(0, st.bushes).map((s): [Slot, string, number] => [s, kit.bush, 0.5]),
    ...PATCH.slice(0, st.patches).map((s): [Slot, string, number] => [s, kit.bloom, 0.36]),
    ...FRONT.slice(0, st.flowers).map((s): [Slot, string, number] => [s, kit.flower, 0.4]),
  ]
  for (const [slot, name, k] of queue) {
    if (slot === undefined || !add(slot, put(kit, name, slot[1], slot[2], k))) break
  }
  return side('L', parts.L.join('')) + side('R', parts.R.join(''))
}

/** Lays extra drawings over a finished backdrop, inside its outer <svg>. */
export const overlay = (svg: string, extra: string) => {
  if (extra === '') return svg
  const end = svg.lastIndexOf('</svg>')
  return end < 0 ? svg : svg.slice(0, end) + extra + svg.slice(end)
}
