// Lemon + honey bear theme art, storybook sticker style.
// Sprites (sprites.ts) and the bear's flipbook frames (frames.ts) are traced from Codex drawings.
// Every animation is SMIL (<animate>, <animateTransform>): the desktop app plays SMIL in a
// backdrop, while CSS animations there stay still (lemo-mod uses SMIL for the same reason).

import type { Poke } from '../../../types'
import { FRAMES } from './frames'
import { SPRITES } from './sprites'

const def = (name: string) => {
  const s = SPRITES[name]
  return s === undefined ? '' : `<g id="s-${name}">${s.body}</g>`
}

const size = (name: string) => SPRITES[name] ?? { w: 0, h: 0, body: '' }
export const sizeOf = size
export const defOf = def

const use = (name: string) => {
  const s = size(name)
  return `<use href="#s-${name}" x="${-s.w / 2}" y="${-s.h / 2}"/>`
}

// A sprite centred on (x, y) at scale k, no motion.
const put = (name: string, x: number, y: number, k = 1, rot = 0) =>
  `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${k})">${use(name)}</g>`

// ---------- SMIL helpers ----------
const EASE = '.45 0 .55 1'
const loop = (type: string, values: string, dur: number, begin: number, splines = 2) =>
  `<animateTransform attributeName="transform" type="${type}" values="${values}" dur="${dur}s" begin="${-begin}s" repeatCount="indefinite" calcMode="spline" keySplines="${Array(splines).fill(EASE).join(';')}"/>`

// A floating sticker: drifts up and down and sways, each on its own clock.
const floater = (name: string, x: number, y: number, k: number, i: number, drift = 36, sway = 12) => {
  const dur = 5 + ((i * 37) % 6) // 5-10 s
  const off = (i * 1.7) % dur
  return (
    `<g transform="translate(${x} ${y}) scale(${k})">` +
    `<g>${loop('translate', `0 0;${(i % 2 ? 1 : -1) * 14} ${-drift};0 0`, dur, off)}` +
    `<g>${loop('rotate', `${-sway};${sway};${-sway}`, dur * 0.8, off)}${name === 'bee' ? beeBody : use(name)}</g></g></g>`
  )
}

// ---------- a bee: wings flap behind the body ----------
const BEE = size('bee')
const WINGS = size('wings')
const beeBody =
  `<g transform="translate(${BEE.w * 0.06} ${-BEE.h * 0.18})"><g>` +
  `<animateTransform attributeName="transform" type="scale" values="1 1;1 .7;1 1" dur=".5s" repeatCount="indefinite"/>` +
  `<use href="#s-wings" x="${-WINGS.w / 2}" y="${-WINGS.h}"/></g></g>` +
  `<use href="#s-bee" x="${-BEE.w / 2}" y="${-BEE.h / 2}"/>`

// ---------- the world: cream gingham and floating stickers in both side margins ----------
const STYLE = `<style>
.bg{fill:#fbf3d9}.gingham{opacity:.32}
@media (prefers-color-scheme: dark){.bg{fill:#1f1912}.gingham{opacity:.07}}
</style>`

const PATTERN =
  `<pattern id="gh" width="56" height="56" patternUnits="userSpaceOnUse">` +
  `<rect width="28" height="56" fill="#ffe99a" opacity=".5"/><rect width="56" height="28" fill="#ffe99a" opacity=".5"/></pattern>`

// The desktop sidebar covers the window's left edge; the left strip starts past it.
const SIDEBAR = 300
// A tall strip pinned to one side, 400 x 1000 units, scaled to the window's height.
const strip = (side: 'left' | 'right', align: string, body: string) =>
  `<svg x="${side === 'left' ? SIDEBAR : 0}" y="0" width="100%" height="100%" viewBox="0 0 400 1000" preserveAspectRatio="${align} meet">${body}</svg>`

// [sprite, x, y, scale] in a strip's units; the right strip keeps its lower part for the bear.
const LEFT: [string, number, number, number][] = [
  ['slice', 70, 120, 0.62], ['heart', 190, 80, 0.5], ['leaf', 120, 250, 0.55], ['bee', 210, 330, 0.62],
  ['daisy', 60, 420, 0.55], ['sparkle', 170, 520, 0.42], ['lemon', 90, 600, 0.6], ['heart', 200, 690, 0.42],
  ['lemonade', 80, 800, 0.62], ['jar', 190, 880, 0.55], ['sparkle', 60, 960, 0.35],
]
const RIGHT: [string, number, number, number][] = [
  ['sparkle', 330, 70, 0.42], ['bee', 230, 150, 0.7], ['lemon', 330, 260, 0.55], ['heart', 250, 360, 0.45],
  ['slice', 340, 440, 0.55], ['daisy', 240, 520, 0.5], ['leaf', 350, 600, 0.45], ['sparkle', 230, 640, 0.35],
]

const PROPS = ['lemon', 'slice', 'leaf', 'daisy', 'jar', 'lemonade', 'sparkle', 'heart', 'bee', 'wings']

/** The world layer: gingham and floating stickers. */
export function worldLayer(floaters = true): string {
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">` +
    STYLE +
    `<defs>${PROPS.map(def).join('')}${PATTERN}</defs>` +
    `<rect class="bg" x="0" y="0" width="100%" height="100%"/>` +
    `<rect class="gingham" x="0" y="0" width="100%" height="100%" fill="url(#gh)"/>` +
    (floaters ? strip('left', 'xMinYMid', LEFT.map(([n, x, y, k], i) => floater(n, x, y, k, i)).join('')) : '') +
    (floaters ? strip('right', 'xMaxYMid', RIGHT.map(([n, x, y, k], i) => floater(n, x, y, k, i + 20)).join('')) : '') +
    `</svg>`
  )
}

// ---------- the bear: a flipbook of Codex-drawn frames ----------
type Mood = 'sit' | 'sleep'

export function moodOf(isAsleep: boolean): Mood {
  return isAsleep ? 'sleep' : 'sit'
}

// [frame, seconds] steps; a frame may come back more than once.
const FLIP: Record<Mood, { seq: string; steps: [number, number][] }> = {
  // frames: 0 calm, 1 blink, 2 head tilted
  sit: { seq: 'idle', steps: [[0, 3.2], [1, 0.18], [0, 2.4], [1, 0.18]] },
  // frames: 0 breathing out, 1 breathing in
  sleep: { seq: 'sleep', steps: [[0, 1.7], [1, 1.7]] },
}

// still = only the first frame, no animation (light; used while testing what the app holds still)
function flipbook(mood: Mood, still = false): { defs: string; body: string } {
  const { seq, steps } = FLIP[mood]
  // only the frames the timeline uses are sent
  const used = new Set(steps.map(([fi]) => fi))
  const frames = (FRAMES[seq] ?? []).filter((_, i) => used.has(i) && (!still || i === 0))
  const total = steps.reduce((a, [, t]) => a + t, 0)
  let at = 0
  const keyTimes = steps.map(([, t]) => {
    const k = (at / total).toFixed(4)
    at += t
    return k
  })
  const body = frames
    .map((f, i) => {
      const values = steps.map(([fi]) => (fi === i ? 1 : 0)).join(';')
      return (
        `<g opacity="${i === 0 ? 1 : 0}">` +
        (still ? '' : `<animate attributeName="opacity" values="${values}" keyTimes="${keyTimes.join(';')}" calcMode="discrete" dur="${total}s" repeatCount="indefinite"/>`) +
        `<use href="#f-${seq}-${i}" x="${-f.w / 2}" y="${-f.h + f.dy}"/></g>`
      )
    })
    .join('')
  return { defs: frames.map((f, i) => `<g id="f-${seq}-${i}">${f.body}</g>`).join(''), body }
}

// Height of the sitting bear in the right strip's units.
const BEAR_HEIGHT = 230
const FRAME_K = BEAR_HEIGHT / (FRAMES.idle?.[0]?.h ?? 270)
// The bear sits low in the right margin, clear of the prompt (strip units, its feet).
const BEAR_AT = { x: 290, y: 905 }

const once = (dur: number, begin = 0) => `dur="${dur}s" begin="${begin}s" fill="freeze"`

// Hearts that rise from the bear when it is clicked (origin: its feet, frame units).
const HEARTS = [-80, 0, 80]
  .map(
    (dx, i) =>
      `<g transform="translate(${dx} -300) scale(1.3)" opacity="0">` +
      `<animate attributeName="opacity" values="0;1;1;0" keyTimes="0;.1;.75;1" ${once(3, i * 0.2)}/>` +
      `<g><animateTransform attributeName="transform" type="translate" values="0 0;${(i - 1) * 20} -170" ${once(3, i * 0.2)}/>${use('heart')}</g></g>`,
  )
  .join('')

// Stickers that burst out around the bear when it celebrates.
const BURST = ['slice', 'heart', 'sparkle', 'daisy', 'lemon', 'heart', 'sparkle', 'slice']
const CONFETTI = BURST.map((name, i) => {
  const a = (-165 + (i * 150) / (BURST.length - 1)) * (Math.PI / 180)
  const dx = Math.round(Math.cos(a) * 260)
  const dy = Math.round(Math.sin(a) * 230)
  const d = (i % 3) * 0.08
  return (
    `<g transform="translate(0 -150)" opacity="0">` +
    `<animate attributeName="opacity" values="0;1;1;0" keyTimes="0;.12;.75;1" ${once(1.8, d)}/>` +
    `<g><animateTransform attributeName="transform" type="translate" values="0 0;${dx} ${dy}" calcMode="spline" keySplines=".2 .7 .3 1" ${once(1.8, d)}/>` +
    `<g><animateTransform attributeName="transform" type="rotate" values="0;200" ${once(1.8, d)}/>${use(name)}</g></g></g>`
  )
}).join('')

// zzz rising from the sleeping bear's head.
const SNORE = [0, 1, 2]
  .map(
    i =>
      `<text x="${70 + i * 18}" y="${-150 - i * 24}" font-family="sans-serif" font-weight="700" font-size="${26 + i * 8}" fill="#7a4a2c" opacity="0">z` +
      `<animate attributeName="opacity" values="0;1;0" keyTimes="0;.3;1" dur="3.6s" begin="${i * 1.2}s" repeatCount="indefinite"/>` +
      `<animateTransform attributeName="transform" type="translate" values="0 0;12 -26" dur="3.6s" begin="${i * 1.2}s" repeatCount="indefinite"/></text>`,
  )
  .join('')

// A slow lean from side to side around the feet, so the sitting bear's head tilts a little.
const SWAY = `<animateTransform attributeName="transform" type="rotate" values="0;-2.2;0;1.8;0" keyTimes="0;.25;.5;.75;1" dur="7s" repeatCount="indefinite" calcMode="spline" keySplines="${Array(4).fill(EASE).join(';')}"/>`

const HOP = `<animateTransform attributeName="transform" type="translate" values="0 0;0 -30;0 0" dur=".7s" repeatCount="3"/>`

// A sticker that pops where the person clicked (x, y: 0-1 of the window).
const POP_KINDS = ['heart', 'sparkle', 'slice', 'daisy', 'lemon']
const popAt = (x: number, y: number, n: number) => {
  const name = POP_KINDS[n % POP_KINDS.length] ?? 'heart'
  return (
    `<svg x="${(x * 100).toFixed(1)}%" y="${(y * 100).toFixed(1)}%" overflow="visible"><g opacity="0">` +
    `<animate attributeName="opacity" values="0;1;1;0" keyTimes="0;.1;.75;1" ${once(3)}/>` +
    `<g><animateTransform attributeName="transform" type="translate" values="0 0;0 -70" ${once(3)}/>` +
    `<g><animateTransform attributeName="transform" type="scale" values=".4;1.5;1.2" keyTimes="0;.2;1" ${once(3)}/>${use(name)}</g></g></g></svg>`
  )
}

/** The bear layer: the bear's flipbook in the right margin, plus what a poke sets off. */
export function bearLayer(mood: Mood, poke: Poke | null = null, still = false, withProps = true): string {
  const fb = flipbook(mood, still)
  const isPop = poke?.what === 'pop' && poke.x !== undefined && poke.y !== undefined
  const extras =
    poke?.what === 'mascot' ? ['heart'] : poke?.what === 'party' ? ['slice', 'heart', 'sparkle', 'daisy', 'lemon'] : isPop ? POP_KINDS : []
  const bearBody =
    (poke?.what === 'party' ? CONFETTI : '') +
    (poke?.what === 'party' || poke?.what === 'mascot' ? `<g>${HOP}${fb.body}</g>` : mood === 'sit' ? `<g>${SWAY}${fb.body}</g>` : fb.body) +
    (poke?.what === 'mascot' ? HEARTS : '') +
    (mood === 'sleep' ? SNORE : '')
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">` +
    // a fresh number per poke, so the one-shot animations play again
    `<!-- poke ${poke?.n ?? 0} -->` +
    // inside scene() the world layer already defines the sticker sprites
    `<defs>${fb.defs}${withProps ? extras.map(def).join('') : ''}</defs>` +
    strip(
      'right',
      'xMaxYMax',
      `<ellipse cx="${BEAR_AT.x}" cy="${BEAR_AT.y + 4}" rx="80" ry="11" fill="#e8d6a6" opacity=".55"/>` +
        `<g transform="translate(${BEAR_AT.x} ${BEAR_AT.y}) scale(${FRAME_K.toFixed(3)})">${bearBody}</g>`,
    ) +
    (isPop ? popAt(poke.x ?? 0, poke.y ?? 0, poke.n) : '') +
    `</svg>`
  )
}

/** Both layers flattened into one SVG, for previews outside the app. */
export function scene(isAsleep: boolean, poke: Poke | null = null, still = false, floaters = true): string {
  const inner = (s: string) => s.slice(s.indexOf('>') + 1, s.lastIndexOf('</svg>'))
  return `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">${inner(worldLayer(floaters))}${inner(bearLayer(moodOf(isAsleep), poke, still, false))}</svg>`
}

// The bear on its own (its first idle frame), for the usage pane's header.
const F0 = FRAMES.idle?.[0] ?? { w: 1, h: 1, dy: 0, body: '' }
export const BADGE =
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-6 -6 ${F0.w + 12} ${F0.h + 12}" width="84" height="${Math.round((84 * (F0.h + 12)) / (F0.w + 12))}">` +
  F0.body +
  `</svg>`

// Small stickers for chat bubbles: a gentle SMIL sway. Pointer events never reach an Svg in a
// message row, so they have no hover or click.
const swayLoop = `<animateTransform attributeName="transform" type="rotate" values="-6;6;-6" dur="4s" repeatCount="indefinite" calcMode="spline" keySplines="${EASE};${EASE}"/>`

// sprite centred on the origin, wrapped in one group per motion
const stickerBody = (inner: string) => `<g>${swayLoop}${inner}</g>`

const sticker = (name: string) => {
  const s = size(name)
  const pad = 8
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${-s.w / 2 - pad} ${-s.h / 2 - pad} ${s.w + pad * 2} ${s.h + pad * 2}" width="34" height="${Math.round((34 * (s.h + pad * 2)) / (s.w + pad * 2))}">` +
    `<defs>${def(name)}</defs>${stickerBody(use(name))}</svg>`
  )
}

// the bee's wings stick up above its body: the box reaches up to their tips
const BEE_TOP = BEE.h * 0.18 + WINGS.h
const BEE_BOX = `${-BEE.w / 2 - 8} ${-BEE_TOP - 6} ${BEE.w + 16} ${BEE_TOP + BEE.h / 2 + 12}`
const beeBob = `<animateTransform attributeName="transform" type="translate" values="0 0;0 -5;0 0" dur="2.4s" repeatCount="indefinite" calcMode="spline" keySplines="${EASE};${EASE}"/>`

const BEE_STICKER =
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${BEE_BOX}" width="36" height="40">` +
  `<defs>${def('bee')}${def('wings')}</defs>` +
  `<g>${beeBob}${beeBody}</g></svg>`

export const STICKERS = {
  lemon: sticker('lemon'),
  slice: sticker('slice'),
  daisy: sticker('daisy'),
  heart: sticker('heart'),
  bee: BEE_STICKER,
}

// ---------- small icons for the band and pane, drawn from the same sprites ----------

const iconSvg = (viewBox: string, body: string, defs: string[]) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}">` +
  `<defs>${defs.map(def).join('')}</defs>${body}</svg>`

const spriteIcon = (name: string, pad = 4) => {
  const s = size(name)
  const side = Math.max(s.w, s.h) + pad * 2
  const x = -(side - s.w) / 2
  const y = -(side - s.h) / 2
  return iconSvg(`${x} ${y} ${side} ${side}`, `<use href="#s-${name}"/>`, [name])
}

export const ICONS = {
  bear: spriteIcon('head', 2),
  think: spriteIcon('sparkle', 4),
  honey: spriteIcon('jar', 2),
  coin: spriteIcon('slice', 2),
  bee: iconSvg(BEE_BOX, beeBody, ['bee', 'wings']),
}

// A glass of lemonade whose level is the context window's fill (0-100).
export function juiceGlass(percent: number | null): string {
  const p = Math.max(0, Math.min(100, percent ?? 0))
  const hot = p >= 80
  const top = 10
  const bottom = 46
  const level = bottom - ((bottom - top) * p) / 100
  const juice = hot ? '#f6a5b5' : '#ffd84d'
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 52">` +
    `<defs><clipPath id="g"><path d="M10 8 L38 8 L35 46 Q24 50 13 46Z"/></clipPath></defs>` +
    `<path d="M10 8 L38 8 L35 46 Q24 50 13 46Z" fill="#fffbef" stroke="#ffffff" stroke-width="7" stroke-linejoin="round"/>` +
    `<g clip-path="url(#g)"><rect x="0" y="${level.toFixed(1)}" width="48" height="52" fill="${juice}"/>` +
    `<path d="M8 ${level.toFixed(1)} Q16 ${(level - 2).toFixed(1)} 24 ${level.toFixed(1)} T40 ${level.toFixed(1)}" stroke="#ffffff" stroke-width="1.6" fill="none" opacity=".7"/></g>` +
    `<path d="M10 8 L38 8 L35 46 Q24 50 13 46Z" fill="none" stroke="#4a2c1a" stroke-width="2.8" stroke-linejoin="round"/>` +
    `<path d="M30 8 L36 0" stroke="#f6a5b5" stroke-width="3" stroke-linecap="round"/>` +
    `<circle cx="12" cy="9" r="6.5" fill="#ffd84d" stroke="#4a2c1a" stroke-width="2"/>` +
    `<path d="M12 3 V15 M6 9 H18 M8 5 L16 13 M16 5 L8 13" stroke="#fff6c2" stroke-width="1"/>` +
    `</svg>`
  )
}

// A honey ring that fills with a rate-limit window's use (0-100).
export function limitRing(percent: number): string {
  const p = Math.max(0, Math.min(100, percent))
  const r = 16
  const c = 2 * Math.PI * r
  const hot = p >= 80
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">` +
    `<circle cx="24" cy="24" r="21" fill="#fffbef" stroke="#ffffff" stroke-width="5"/>` +
    `<circle cx="24" cy="24" r="21" fill="none" stroke="#4a2c1a" stroke-width="2.6"/>` +
    `<circle cx="24" cy="24" r="${r}" fill="none" stroke="#f3e6c4" stroke-width="7"/>` +
    `<circle cx="24" cy="24" r="${r}" fill="none" stroke="${hot ? '#f28ca0' : '#f5b62a'}" stroke-width="7" stroke-linecap="round"` +
    ` stroke-dasharray="${((c * p) / 100).toFixed(1)} ${c.toFixed(1)}" transform="rotate(-90 24 24)"/>` +
    `<circle cx="24" cy="24" r="4" fill="#4a2c1a"/>` +
    `</svg>`
  )
}
