// Meadow + little lamb theme art, soft felt-ball sticker style.
// Sprites (sprites.ts) and the lamb's flipbook frames (frames.ts) are traced from Codex drawings.
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

// A butterfly: its wings close and open by squeezing the drawing sideways.
const butterflyBody = `<g><animateTransform attributeName="transform" type="scale" values="1 1;.35 1;1 1" dur=".45s" repeatCount="indefinite"/>${use('butterfly')}</g>`

// A floating sticker: drifts up and down and sways, each on its own clock.
const floater = (name: string, x: number, y: number, k: number, i: number, drift = 36, sway = 12) => {
  const dur = 5 + ((i * 37) % 6) // 5-10 s
  const off = (i * 1.7) % dur
  return (
    `<g transform="translate(${x} ${y}) scale(${k})">` +
    `<g>${loop('translate', `0 0;${(i % 2 ? 1 : -1) * 14} ${-drift};0 0`, dur, off)}` +
    `<g>${loop('rotate', `${-sway};${sway};${-sway}`, dur * 0.8, off)}${name === 'butterfly' ? butterflyBody : use(name)}</g></g></g>`
  )
}

// Something growing in the meadow: stays put and leans in the breeze from its base.
const grower = (name: string, x: number, y: number, k: number, i: number) => {
  const s = size(name)
  const dur = 4 + ((i * 29) % 4)
  return (
    `<g transform="translate(${x} ${y}) scale(${k})"><g>${loop('rotate', '-2.5;2.5;-2.5', dur, i * 0.9)}` +
    `<use href="#s-${name}" x="${-s.w / 2}" y="${-s.h}"/></g></g>`
  )
}

// A cloud sliding slowly across a strip and back.
const drifter = (name: string, y: number, k: number, from: number, to: number, dur: number, i: number) =>
  `<g transform="translate(0 ${y}) scale(${k})"><g>${loop('translate', `${from / k} 0;${to / k} 0;${from / k} 0`, dur, i * 7)}${use(name)}</g></g>`

// ---------- the world: a soft meadow-green paper with crayon hatching in both side margins ----------
const STYLE = `<style>
.bg{fill:#f5f8ec}.hatch{opacity:.55}.hill{fill:#cfe6a6}
@media (prefers-color-scheme: dark){.bg{fill:#151c14}.hatch{opacity:.12}.hill{fill:#2c3b22}}
</style>`

// faint diagonal crayon strokes, like the meadow in the reference drawings
const PATTERN =
  `<pattern id="gh" width="46" height="46" patternUnits="userSpaceOnUse" patternTransform="rotate(-28)">` +
  `<path d="M4 8h14M26 20h12M10 32h16M30 40h9" stroke="#dcebbf" stroke-width="2.4" stroke-linecap="round"/></pattern>`

// The desktop sidebar covers the window's left edge; the left strip starts past it.
const SIDEBAR = 300
// A tall strip pinned to one side, 400 x 1000 units, scaled to the window's height.
const strip = (side: 'left' | 'right', align: string, body: string) =>
  `<svg x="${side === 'left' ? SIDEBAR : 0}" y="0" width="100%" height="100%" viewBox="0 0 400 1000" preserveAspectRatio="${align} meet">${body}</svg>`

// [sprite, x, y, scale] in a strip's units. Floaters drift in the air; growers stand on the
// meadow at the bottom (y = where they touch the ground); the right strip keeps its corner for the lamb.
const LEFT_AIR: [string, number, number, number][] = [
  ['heart', 190, 230, 0.65], ['butterfly', 90, 330, 0.81], ['sparkle', 210, 430, 0.55],
  ['clover', 200, 610, 0.65], ['sparkle', 80, 700, 0.45],
]
const LEFT_GROUND: [string, number, number, number][] = [
  ['tree', 90, 900, 1.09], ['grass', 200, 915, 0.71], ['blossom', 300, 905, 0.92], ['daisy', 170, 965, 0.52],
  ['dandelion', 40, 975, 0.57], ['grass', 330, 975, 0.57],
]
const RIGHT_AIR: [string, number, number, number][] = [
  ['butterfly', 250, 240, 0.91], ['sparkle', 340, 330, 0.52], ['heart', 240, 440, 0.55],
  ['daisy', 340, 540, 0.62], ['clover', 250, 630, 0.55],
]
const RIGHT_GROUND: [string, number, number, number][] = [
  ['grass', 160, 935, 0.63], ['dandelion', 370, 925, 0.55], ['daisy', 200, 975, 0.46],
]

const PROPS = ['tree', 'blossom', 'cloud', 'daisy', 'dandelion', 'butterfly', 'clover', 'grass', 'sparkle', 'heart']

// a low green mound along the bottom of a strip, the meadow everything stands on
const HILL = `<path class="hill" d="M14 1004 C4 952 40 918 110 910 C190 900 250 898 320 910 C378 920 398 960 388 1004Z"/>`

/** The world layer: meadow paper, clouds, floating stickers and the plants on the hill. */
export function worldLayer(floaters = true): string {
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">` +
    STYLE +
    `<defs>${PROPS.map(def).join('')}${PATTERN}</defs>` +
    `<rect class="bg" x="0" y="0" width="100%" height="100%"/>` +
    `<rect class="hatch" x="0" y="0" width="100%" height="100%" fill="url(#gh)"/>` +
    strip(
      'left',
      'xMinYMid',
      drifter('cloud', 110, 0.9, 40, 260, 46, 0) +
        HILL +
        LEFT_GROUND.map(([n, x, y, k], i) => grower(n, x, y, k, i)).join('') +
        (floaters ? LEFT_AIR.map(([n, x, y, k], i) => floater(n, x, y, k, i)).join('') : ''),
    ) +
    strip(
      'right',
      'xMaxYMid',
      drifter('cloud', 120, 0.75, 340, 130, 52, 1) +
        HILL +
        RIGHT_GROUND.map(([n, x, y, k], i) => grower(n, x, y, k, i + 10)).join('') +
        (floaters ? RIGHT_AIR.map(([n, x, y, k], i) => floater(n, x, y, k, i + 20)).join('') : ''),
    ) +
    `</svg>`
  )
}

// ---------- the lamb: a flipbook of Codex-drawn frames ----------
type Mood = 'sit' | 'sleep'

export function moodOf(isAsleep: boolean): Mood {
  return isAsleep ? 'sleep' : 'sit'
}

// [frame, seconds] steps; a frame may come back more than once.
const FLIP: Record<Mood, { seq: string; steps: [number, number][] }> = {
  // frames: 0 calm, 1 blink, 2 head down grazing (nibbles: down, up, down again)
  sit: {
    seq: 'idle',
    steps: [[0, 3.2], [1, 0.18], [0, 2.2], [2, 1.8], [0, 0.45], [2, 1.4], [0, 2.8], [1, 0.18], [0, 0.3], [1, 0.18], [0, 2]],
  },
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

// Height of the standing lamb in the right strip's units.
const LAMB_HEIGHT = 225
const FRAME_K = LAMB_HEIGHT / (FRAMES.idle?.[0]?.h ?? 270)
// The lamb stands on the hill low in the right margin, clear of the prompt (strip units, its feet).
const LAMB_AT = { x: 285, y: 930 }

const once = (dur: number, begin = 0) => `dur="${dur}s" begin="${begin}s" fill="freeze"`

// Hearts that rise from the lamb when it is clicked (origin: its feet, frame units).
const HEARTS = [-80, 0, 80]
  .map(
    (dx, i) =>
      `<g transform="translate(${dx} -300) scale(1.3)" opacity="0">` +
      `<animate attributeName="opacity" values="0;1;1;0" keyTimes="0;.1;.75;1" ${once(3, i * 0.2)}/>` +
      `<g><animateTransform attributeName="transform" type="translate" values="0 0;${(i - 1) * 20} -170" ${once(3, i * 0.2)}/>${use('heart')}</g></g>`,
  )
  .join('')

// Stickers that burst out around the lamb when it celebrates.
const BURST = ['daisy', 'heart', 'sparkle', 'clover', 'butterfly', 'heart', 'sparkle', 'daisy']
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

// zzz rising from the sleeping lamb's head.
const SNORE = [0, 1, 2]
  .map(
    i =>
      `<text x="${70 + i * 18}" y="${-150 - i * 24}" font-family="sans-serif" font-weight="700" font-size="${26 + i * 8}" fill="#6b8f4e" opacity="0">z` +
      `<animate attributeName="opacity" values="0;1;0" keyTimes="0;.3;1" dur="3.6s" begin="${i * 1.2}s" repeatCount="indefinite"/>` +
      `<animateTransform attributeName="transform" type="translate" values="0 0;12 -26" dur="3.6s" begin="${i * 1.2}s" repeatCount="indefinite"/></text>`,
  )
  .join('')

// A slow lean from side to side around the feet, so the standing lamb's head tilts a little.
const SWAY = `<animateTransform attributeName="transform" type="rotate" values="0;-2.2;0;1.8;0" keyTimes="0;.25;.5;.75;1" dur="7s" repeatCount="indefinite" calcMode="spline" keySplines="${Array(4).fill(EASE).join(';')}"/>`

const HOP = `<animateTransform attributeName="transform" type="translate" values="0 0;0 -30;0 0" dur=".7s" repeatCount="3"/>`

// A sticker that pops where the person clicked (x, y: 0-1 of the window).
const POP_KINDS = ['heart', 'sparkle', 'daisy', 'clover', 'butterfly']
const popAt = (x: number, y: number, n: number) => {
  const name = POP_KINDS[n % POP_KINDS.length] ?? 'heart'
  return (
    `<svg x="${(x * 100).toFixed(1)}%" y="${(y * 100).toFixed(1)}%" overflow="visible"><g opacity="0">` +
    `<animate attributeName="opacity" values="0;1;1;0" keyTimes="0;.1;.75;1" ${once(3)}/>` +
    `<g><animateTransform attributeName="transform" type="translate" values="0 0;0 -70" ${once(3)}/>` +
    `<g><animateTransform attributeName="transform" type="scale" values=".4;1.5;1.2" keyTimes="0;.2;1" ${once(3)}/>${use(name)}</g></g></g></svg>`
  )
}

const FELT =
  `<filter id="felt" x="-5%" y="-5%" width="110%" height="110%">` +
  `<feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="3" result="n"/>` +
  `<feDisplacementMap in="SourceGraphic" in2="n" scale="3" result="d"/><feGaussianBlur in="d" stdDeviation=".7"/></filter>`

/** The lamb layer: the lamb's flipbook in the right margin, plus what a poke sets off. */
export function lambLayer(mood: Mood, poke: Poke | null = null, still = false, withProps = true): string {
  const traced = flipbook(mood, still)
  // tracing flattens the felt into colour blocks; a little noise on the edges and a soft blur bring
  // back some of its fuzz (the faces were traced finely, so they survive the blur)
  const fb = { defs: traced.defs + FELT, body: `<g filter="url(#felt)">${traced.body}</g>` }
  const isPop = poke?.what === 'pop' && poke.x !== undefined && poke.y !== undefined
  const extras =
    poke?.what === 'mascot' ? ['heart'] : poke?.what === 'party' ? ['daisy', 'heart', 'sparkle', 'clover', 'butterfly'] : isPop ? POP_KINDS : []
  const lambBody =
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
      `<ellipse cx="${LAMB_AT.x}" cy="${LAMB_AT.y + 4}" rx="78" ry="10" fill="#9fc46e" opacity=".45"/>` +
        `<g transform="translate(${LAMB_AT.x} ${LAMB_AT.y}) scale(${FRAME_K.toFixed(3)})">${lambBody}</g>`,
    ) +
    (isPop ? popAt(poke.x ?? 0, poke.y ?? 0, poke.n) : '') +
    `</svg>`
  )
}

/** Both layers flattened into one SVG, for previews outside the app. */
export function scene(isAsleep: boolean, poke: Poke | null = null, still = false, floaters = true): string {
  const inner = (s: string) => s.slice(s.indexOf('>') + 1, s.lastIndexOf('</svg>'))
  return `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">${inner(worldLayer(floaters))}${inner(lambLayer(moodOf(isAsleep), poke, still, false))}</svg>`
}

// The lamb on its own (its first idle frame), for the usage pane's header.
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

// the butterfly bobs while its wings flap
const BF = size('butterfly')
const BF_BOX = `${-BF.w / 2 - 8} ${-BF.h / 2 - 10} ${BF.w + 16} ${BF.h + 20}`
const bfBob = `<animateTransform attributeName="transform" type="translate" values="0 0;0 -5;0 0" dur="2.4s" repeatCount="indefinite" calcMode="spline" keySplines="${EASE};${EASE}"/>`

const BUTTERFLY_STICKER =
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${BF_BOX}" width="36" height="${Math.round((36 * (BF.h + 20)) / (BF.w + 16))}">` +
  `<defs>${def('butterfly')}</defs>` +
  `<g>${bfBob}${butterflyBody}</g></svg>`

export const STICKERS = {
  daisy: sticker('daisy'),
  clover: sticker('clover'),
  heart: sticker('heart'),
  wool: sticker('wool'),
  butterfly: BUTTERFLY_STICKER,
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
  lamb: spriteIcon('head', 2),
  think: spriteIcon('sparkle', 4),
  wool: spriteIcon('wool', 2),
  coin: spriteIcon('clover', 2),
  butterfly: iconSvg(BF_BOX, butterflyBody, ['butterfly']),
}

// A glass of milk whose level is the context window's fill (0-100).
export function juiceGlass(percent: number | null): string {
  const p = Math.max(0, Math.min(100, percent ?? 0))
  const hot = p >= 80
  const top = 10
  const bottom = 46
  const level = bottom - ((bottom - top) * p) / 100
  const juice = hot ? '#f6a5b5' : '#b9dd84'
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 52">` +
    `<defs><clipPath id="g"><path d="M10 8 L38 8 L35 46 Q24 50 13 46Z"/></clipPath></defs>` +
    `<path d="M10 8 L38 8 L35 46 Q24 50 13 46Z" fill="#fbfdf4" stroke="#ffffff" stroke-width="7" stroke-linejoin="round"/>` +
    `<g clip-path="url(#g)"><rect x="0" y="${level.toFixed(1)}" width="48" height="52" fill="${juice}"/>` +
    `<path d="M8 ${level.toFixed(1)} Q16 ${(level - 2).toFixed(1)} 24 ${level.toFixed(1)} T40 ${level.toFixed(1)}" stroke="#ffffff" stroke-width="1.6" fill="none" opacity=".7"/></g>` +
    `<path d="M10 8 L38 8 L35 46 Q24 50 13 46Z" fill="none" stroke="#3f5a2c" stroke-width="2.8" stroke-linejoin="round"/>` +
    `<path d="M30 8 L36 0" stroke="#f6a5b5" stroke-width="3" stroke-linecap="round"/>` +
    `<circle cx="12" cy="9" r="6.5" fill="#fffdf4" stroke="#3f5a2c" stroke-width="2"/>` +
    `<circle cx="12" cy="9" r="2.2" fill="#f2c94c"/>` +
    `</svg>`
  )
}

// A grass ring that fills with a rate-limit window's use (0-100).
export function limitRing(percent: number): string {
  const p = Math.max(0, Math.min(100, percent))
  const r = 16
  const c = 2 * Math.PI * r
  const hot = p >= 80
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">` +
    `<circle cx="24" cy="24" r="21" fill="#fbfdf4" stroke="#ffffff" stroke-width="5"/>` +
    `<circle cx="24" cy="24" r="21" fill="none" stroke="#3f5a2c" stroke-width="2.6"/>` +
    `<circle cx="24" cy="24" r="${r}" fill="none" stroke="#e3efcf" stroke-width="7"/>` +
    `<circle cx="24" cy="24" r="${r}" fill="none" stroke="${hot ? '#f28ca0' : '#7fb24a'}" stroke-width="7" stroke-linecap="round"` +
    ` stroke-dasharray="${((c * p) / 100).toFixed(1)} ${c.toFixed(1)}" transform="rotate(-90 24 24)"/>` +
    `<circle cx="24" cy="24" r="4" fill="#3f5a2c"/>` +
    `</svg>`
  )
}
