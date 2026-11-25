// Today's card (/skin share): today's flowers, the garden so far and the mascot, drawn as one SVG
// for the /skin share pane. The plugin cannot make a PNG, so the person shares it as a screenshot;
// the pane also copies a line of text to post with it.

import type { Garden } from '../types'
import type { GardenKit } from './garden'
import { stages, totals } from './garden'
import type { Lang } from './i18n'
import { streak } from './talk'

export type CardLook = {
  /** Skin name and mascot, in the person's language. */
  name: string
  /** The mascot alone (skin.badge): an <svg> with its own viewBox. */
  badge: string
  kit: GardenKit
  /** Heading colour and the card's border colour. */
  heading: string
  border: string
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

export type CardFacts = { date: string; today: [number, number]; total: number; level: number; run: number }

export function cardFacts(g: Garden, today: string): CardFacts {
  const t = totals(g, today)
  return { date: today, today: t.today, total: t.commits, level: stages(t.commits, 0).level, run: streak(g, today) }
}

const WORDS = {
  zh: {
    title: (d: string) => `${d} 的小结`,
    flowers: (n: number) => (n === 0 ? '今天还没种花' : `今天种了 ${n} 朵花`),
    green: (n: number) => (n === 0 ? '还没跑全绿的测试' : `测试全绿 ${n} 次`),
    run: (n: number) => (n >= 2 ? `连续第 ${n} 天` : ''),
    garden: (n: number, lv: number) => `花园共 ${n} 朵 · 第 ${lv} 片草地`,
    foot: 'Lemon Themes · Claude 桌面皮肤',
  },
  en: {
    title: (d: string) => `My day, ${d}`,
    flowers: (n: number) => (n === 0 ? 'No flowers yet today' : `${n} flower${n === 1 ? '' : 's'} planted today`),
    green: (n: number) => (n === 0 ? 'No all-green run yet' : `${n} all-green test run${n === 1 ? '' : 's'}`),
    run: (n: number) => (n >= 2 ? `Day ${n} in a row` : ''),
    garden: (n: number, lv: number) => `${n} flowers in the garden · meadow ${lv}`,
    foot: 'Lemon Themes for Claude',
  },
}

/** The card: 640 x 360, the mascot on the right, today's flowers along the bottom. */
export function cardSvg(f: CardFacts, look: CardLook, lang: Lang): string {
  const w = WORDS[lang]
  const kit = look.kit
  const font = "ui-rounded, 'SF Pro Rounded', 'PingFang SC', 'Hiragino Maru Gothic ProN', sans-serif"
  const text = (x: number, y: number, size: number, weight: number, fill: string, s: string) =>
    s === '' ? '' : `<text x="${x}" y="${y}" font-family="${font}" font-size="${size}" font-weight="${weight}" fill="${fill}">${esc(s)}</text>`
  // today's flowers, one per commit, at most 12 (a patch for the green runs after them)
  const shown = Math.min(12, f.today[0])
  const row = Array.from({ length: shown }, (_, i) => {
    const s = kit.size(kit.flower)
    const k = 34 / Math.max(s.w, s.h)
    return `<use href="#s-${kit.flower}" transform="translate(${44 + i * 38} 318) scale(${k.toFixed(3)})" x="${-s.w / 2}" y="${-s.h}"/>`
  }).join('')
  const more = f.today[0] > shown ? text(44 + shown * 38, 312, 18, 700, look.heading, `+${f.today[0] - shown}`) : ''
  const patches = Array.from({ length: Math.min(4, f.today[1]) }, (_, i) => {
    const s = kit.size(kit.bloom)
    const k = 28 / Math.max(s.w, s.h)
    const x = 44 + (shown + (more === '' ? 0 : 1)) * 38 + 10 + i * 32
    return `<use href="#s-${kit.bloom}" transform="translate(${x} 316) scale(${k.toFixed(3)})" x="${-s.w / 2}" y="${-s.h}"/>`
  }).join('')
  // the badge has its own width/height; place it in a box on the right
  // (its own width and height go first: an attribute twice makes the whole SVG invalid)
  const open = look.badge.slice(0, look.badge.indexOf('>'))
  const badge = open.replace(/\s(width|height|x|y)="[^"]*"/g, '').replace(/^<svg /, '<svg x="430" y="70" width="180" height="220" ') + look.badge.slice(open.length)
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 360" width="640" height="360">` +
    `<defs>${kit.def(kit.flower)}${kit.def(kit.bloom)}</defs>` +
    `<rect x="4" y="4" width="632" height="352" rx="28" fill="#fffdf7" stroke="${look.border}" stroke-width="4"/>` +
    `<path d="M4 300 Q160 280 320 296 T636 290 V328 Q636 356 608 356 H32 Q4 356 4 328Z" fill="${kit.mound ?? '#d7ebb8'}" opacity=".7"/>` +
    text(40, 66, 30, 800, look.heading, w.title(f.date)) +
    text(40, 118, 26, 700, '#3b3226', w.flowers(f.today[0])) +
    text(40, 158, 22, 600, '#5a5044', w.green(f.today[1])) +
    text(40, 196, 22, 600, '#5a5044', w.run(f.run)) +
    text(40, 244, 18, 600, '#7a6e60', w.garden(f.total, f.level)) +
    text(40, 272, 15, 500, '#9a8e80', `${look.name} · ${w.foot}`) +
    badge +
    row +
    more +
    patches +
    `</svg>`
  )
}

/** A line of text to post with the card. */
export function cardText(f: CardFacts, lang: Lang): string {
  const w = WORDS[lang]
  const parts = [w.flowers(f.today[0]), w.green(f.today[1]), w.run(f.run), w.garden(f.total, f.level)].filter(s => s !== '')
  return lang === 'zh'
    ? `🌼 ${f.date}：${parts.join('，')}。陪我写代码的是 Lemon Themes 🍋 https://github.com/simpleciki/lemon-themes`
    : `🌼 ${f.date}: ${parts.join(', ')}. Keeping me company: Lemon Themes 🍋 https://github.com/simpleciki/lemon-themes`
}
