// Pond + little duckling theme art, oil-pastel crayon sticker style. It has three looks that follow
// the person's day: a sunny pond, an evening pond with fireflies (from 18:00 to 6:00) and, on some
// days, rain. Sprites (sprites.ts) and the duckling's frames (frames.ts) are traced from Codex drawings.
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

// Something with wings (dragonfly, firefly): the wings close and open by squeezing it sideways.
const flap = (name: string) =>
  `<g><animateTransform attributeName="transform" type="scale" values="1 1;.4 1;1 1" dur=".4s" repeatCount="indefinite"/>${use(name)}</g>`
const FLAPPERS = new Set(['fly', 'firefly'])
// A firefly's light breathes: the whole sticker fades a little and back.
const glow = (inner: string, i: number) =>
  `<g><animate attributeName="opacity" values="1;.45;1" dur="${2 + (i % 3) * 0.7}s" repeatCount="indefinite"/>${inner}</g>`

// A floating sticker: drifts up and down and sways, each on its own clock.
const floater = (name: string, x: number, y: number, k: number, i: number, drift = 36, sway = 12) => {
  const dur = 5 + ((i * 37) % 6) // 5-10 s
  const off = (i * 1.7) % dur
  return (
    `<g transform="translate(${x} ${y}) scale(${k})">` +
    `<g>${loop('translate', `0 0;${(i % 2 ? 1 : -1) * 14} ${-drift};0 0`, dur, off)}` +
    `<g>${loop('rotate', `${-sway};${sway};${-sway}`, dur * 0.8, off)}${name === 'firefly' ? glow(flap(name), i) : FLAPPERS.has(name) ? flap(name) : use(name)}</g></g></g>`
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

// ---------- the world: paper, a pond bank in both side margins, and the weather ----------
export type Weather = 'day' | 'dusk' | 'rain'

/** Which look a moment gets: evening from 18:00 to 6:00; otherwise rain on about one day in four. */
export function weatherAt(ms: number): Weather {
  const d = new Date(ms)
  const h = d.getHours()
  if (h >= 18 || h < 6) return 'dusk'
  const day = d.getFullYear() * 400 + d.getMonth() * 32 + d.getDate()
  return (day * 2654435761) % 4 === 0 ? 'rain' : 'day'
}

const LOOKS: Record<Weather, { bg: string; hatch: string; bank: string; water: string; darkBg: string; darkBank: string; darkWater: string }> = {
  day: { bg: '#f7f8f0', hatch: '#e6ecd2', bank: '#cfe6a6', water: '#bfe3f2', darkBg: '#141b18', darkBank: '#2c3b22', darkWater: '#1f3640' },
  dusk: { bg: '#f8f1f6', hatch: '#efdfec', bank: '#c6e6a0', water: '#cdd6fa', darkBg: '#17142a', darkBank: '#26341f', darkWater: '#262d52' },
  rain: { bg: '#eef3f6', hatch: '#dde7ee', bank: '#c5e0a4', water: '#b6d9ee', darkBg: '#121a20', darkBank: '#29391f', darkWater: '#1d3444' },
}

const style = (w: Weather) => {
  const l = LOOKS[w]
  return `<style>
.bg{fill:${l.bg}}.hatch{opacity:.6}.bank{fill:${l.bank}}.water{fill:${l.water}}
@media (prefers-color-scheme: dark){.bg{fill:${l.darkBg}}.hatch{opacity:.12}.bank{fill:${l.darkBank}}.water{fill:${l.darkWater}}}
</style>`
}

// faint diagonal crayon strokes, like the paper in the reference drawings
const pattern = (w: Weather) =>
  `<pattern id="gh" width="46" height="46" patternUnits="userSpaceOnUse" patternTransform="rotate(-28)">` +
  `<path d="M4 8h14M26 20h12M10 32h16M30 40h9" stroke="${LOOKS[w].hatch}" stroke-width="2.4" stroke-linecap="round"/></pattern>`

// The desktop sidebar covers the window's left edge; the left strip starts past it.
const SIDEBAR = 300
// A tall strip pinned to one side, 400 x 1000 units, scaled to the window's height.
const strip = (side: 'left' | 'right', align: string, body: string) =>
  `<svg x="${side === 'left' ? SIDEBAR : 0}" y="0" width="100%" height="100%" viewBox="0 0 400 1000" preserveAspectRatio="${align} meet">${body}</svg>`

type Place = [string, number, number, number]
// For each look: what drifts in the air and what stands on the bank, per strip, in strip units.
const SCENERY: Record<Weather, { sky: string; leftAir: Place[]; leftGround: Place[]; rightAir: Place[]; rightGround: Place[] }> = {
  day: {
    sky: 'cloud',
    leftAir: [['heart', 190, 230, 0.7], ['fly', 90, 330, 0.85], ['sparkle', 210, 430, 0.6], ['daisy', 70, 540, 0.7], ['sparkle', 190, 660, 0.45]],
    leftGround: [['reeds', 70, 905, 1.05], ['grass', 190, 915, 0.75], ['lotus', 300, 965, 0.8], ['pad', 220, 975, 0.65], ['snail', 340, 915, 0.6]],
    rightAir: [['fly', 250, 240, 0.95], ['sparkle', 340, 330, 0.55], ['heart', 240, 440, 0.6], ['daisy', 340, 540, 0.65], ['boat', 250, 650, 0.6]],
    rightGround: [['grass', 150, 935, 0.7], ['reeds', 370, 925, 0.75], ['pad', 190, 980, 0.55]],
  },
  dusk: {
    sky: 'nCloud',
    leftAir: [['moon', 110, 230, 1.05], ['star', 240, 300, 0.6], ['firefly', 90, 430, 0.7], ['star', 200, 520, 0.45], ['firefly', 230, 640, 0.6]],
    leftGround: [['nReeds', 70, 905, 1.05], ['lantern', 190, 915, 0.85], ['bud', 300, 965, 0.75], ['nPad', 220, 980, 0.65], ['nGrass', 340, 915, 0.7]],
    rightAir: [['firefly', 250, 240, 0.75], ['star', 340, 330, 0.55], ['firefly', 330, 470, 0.6], ['star', 240, 560, 0.45], ['nHeart', 300, 660, 0.55]],
    rightGround: [['nGrass', 150, 935, 0.7], ['nReeds', 370, 925, 0.75], ['nPad', 190, 980, 0.55]],
  },
  rain: {
    sky: 'rainCloud',
    leftAir: [['rainbow', 150, 250, 1.0], ['drop', 90, 400, 0.6], ['clover', 230, 470, 0.65], ['drop', 200, 580, 0.5], ['rHeart', 90, 660, 0.55]],
    leftGround: [['mushroom', 70, 915, 0.95], ['wetGrass', 190, 920, 0.75], ['boots', 300, 935, 0.7], ['puddle', 220, 985, 0.75]],
    rightAir: [['drop', 250, 240, 0.6], ['clover', 340, 330, 0.55], ['leaf', 250, 450, 0.75], ['drop', 340, 560, 0.5], ['rSparkle', 250, 650, 0.5]],
    rightGround: [['wetGrass', 150, 935, 0.7], ['mushroom', 370, 930, 0.6], ['puddle', 190, 985, 0.6]],
  },
}

// every sticker a look can draw, the click and party stickers included (defined once in the world)
const used = (w: Weather) => {
  const s = SCENERY[w]
  const k = KINDS[w]
  return [...new Set([s.sky, k.heart, ...k.pops, ...[s.leftAir, s.leftGround, s.rightAir, s.rightGround].flat().map(p => p[0])])]
}

// a low grassy bank along the bottom of a strip, with a little pond in front of it
const BANK = `<path class="bank" d="M14 1004 C4 952 40 918 110 910 C190 900 250 898 320 910 C378 920 398 960 388 1004Z"/>`
const POND = `<ellipse class="water" cx="200" cy="992" rx="170" ry="26"/>`

// Rain: a few short streaks falling through each strip, each on its own clock.
const RAIN = Array.from({ length: 14 }, (_, i) => {
  const x = 20 + ((i * 97) % 360)
  const dur = 1.1 + (i % 4) * 0.25
  return (
    `<path d="M${x} -40 l-6 22" stroke="#8fc3e3" stroke-width="3" stroke-linecap="round" opacity=".7">` +
    `<animateTransform attributeName="transform" type="translate" values="0 0;-40 1080" dur="${dur}s" begin="${-(i * 0.37) % dur}s" repeatCount="indefinite"/></path>`
  )
}).join('')

/** The world layer: paper, the sky, floating stickers and the plants on the pond bank. */
export function worldLayer(floaters = true, w: Weather = 'day'): string {
  const s = SCENERY[w]
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">` +
    style(w) +
    `<defs>${used(w).map(def).join('')}${pattern(w)}</defs>` +
    `<rect class="bg" x="0" y="0" width="100%" height="100%"/>` +
    `<rect class="hatch" x="0" y="0" width="100%" height="100%" fill="url(#gh)"/>` +
    strip(
      'left',
      'xMinYMid',
      drifter(s.sky, 110, 0.9, 40, 260, 46, 0) +
        (w === 'rain' ? RAIN : '') +
        BANK +
        POND +
        s.leftGround.map(([n, x, y, k], i) => grower(n, x, y, k, i)).join('') +
        (floaters ? s.leftAir.map(([n, x, y, k], i) => floater(n, x, y, k, i)).join('') : ''),
    ) +
    strip(
      'right',
      'xMaxYMid',
      drifter(s.sky, 120, 0.75, 340, 130, 52, 1) +
        (w === 'rain' ? RAIN : '') +
        BANK +
        POND +
        s.rightGround.map(([n, x, y, k], i) => grower(n, x, y, k, i + 10)).join('') +
        (floaters ? s.rightAir.map(([n, x, y, k], i) => floater(n, x, y, k, i + 20)).join('') : ''),
    ) +
    `</svg>`
  )
}

// ---------- the duckling: a flipbook of Codex-drawn frames, one set per look ----------
type Mood = 'sit' | 'sleep'

export function moodOf(isAsleep: boolean): Mood {
  return isAsleep ? 'sleep' : 'sit'
}

// [frame, seconds] steps; a frame may come back more than once.
const FLIP: Record<Mood, { seq: string; steps: [number, number][] }> = {
  // frames: 0 calm, 1 blink, 2 pecking the ground, 3 flapping with a tiny quack
  sit: {
    seq: 'idle',
    steps: [[0, 3], [1, 0.18], [0, 2], [2, 0.6], [0, 0.35], [2, 0.6], [0, 2.6], [3, 0.5], [0, 0.3], [3, 0.5], [0, 2.4], [1, 0.18], [0, 1.2]],
  },
  // frames: 0 breathing out, 1 breathing in
  sleep: { seq: 'sleep', steps: [[0, 1.7], [1, 1.7]] },
}
// each look has its own frames (a nightcap at dusk, a rain hat in the rain), same poses and timing
const SUFFIX: Record<Weather, string> = { day: '', dusk: 'Dusk', rain: 'Rain' }

// still = only the first frame, no animation (light; used while testing what the app holds still)
function flipbook(mood: Mood, still = false, w: Weather = 'day'): { defs: string; body: string } {
  const { steps } = FLIP[mood]
  const seq = FLIP[mood].seq + SUFFIX[w]
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

// Height of the standing duckling in the right strip's units.
const DUCK_HEIGHT = 200
const FRAME_K = DUCK_HEIGHT / (FRAMES.idle?.[0]?.h ?? 270)
// The duckling stands on the bank low in the right margin, clear of the prompt (strip units, its feet).
const DUCK_AT = { x: 285, y: 940 }

const once = (dur: number, begin = 0) => `dur="${dur}s" begin="${begin}s" fill="freeze"`

// Hearts that rise from the duckling when it is clicked (origin: its feet, frame units).
const hearts = (heart: string) => [-80, 0, 80]
  .map(
    (dx, i) =>
      `<g transform="translate(${dx} -300) scale(1.3)" opacity="0">` +
      `<animate attributeName="opacity" values="0;1;1;0" keyTimes="0;.1;.75;1" ${once(3, i * 0.2)}/>` +
      `<g><animateTransform attributeName="transform" type="translate" values="0 0;${(i - 1) * 20} -170" ${once(3, i * 0.2)}/>${use(heart)}</g></g>`,
  )
  .join('')

// Per look: the heart a click sends up, and the stickers that pop or burst out.
const KINDS: Record<Weather, { heart: string; pops: string[] }> = {
  day: { heart: 'heart', pops: ['heart', 'sparkle', 'daisy', 'lotus', 'fly'] },
  dusk: { heart: 'nHeart', pops: ['nHeart', 'star', 'firefly', 'moon', 'nSparkle'] },
  rain: { heart: 'rHeart', pops: ['rHeart', 'drop', 'clover', 'rSparkle', 'rainbow'] },
}

// Stickers that burst out around the duckling when it celebrates.
const confetti = (pops: string[]) => [...pops, ...pops.slice(0, 3)].map((name, i, BURST) => {
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

// zzz rising from the sleeping duckling's head.
const SNORE = [0, 1, 2]
  .map(
    i =>
      `<text x="${70 + i * 18}" y="${-150 - i * 24}" font-family="sans-serif" font-weight="700" font-size="${26 + i * 8}" fill="#8a83c4" opacity="0">z` +
      `<animate attributeName="opacity" values="0;1;0" keyTimes="0;.3;1" dur="3.6s" begin="${i * 1.2}s" repeatCount="indefinite"/>` +
      `<animateTransform attributeName="transform" type="translate" values="0 0;12 -26" dur="3.6s" begin="${i * 1.2}s" repeatCount="indefinite"/></text>`,
  )
  .join('')

// A slow lean from side to side around the feet, so the standing duckling's head tilts a little.
const SWAY = `<animateTransform attributeName="transform" type="rotate" values="0;-2.2;0;1.8;0" keyTimes="0;.25;.5;.75;1" dur="7s" repeatCount="indefinite" calcMode="spline" keySplines="${Array(4).fill(EASE).join(';')}"/>`

const HOP = `<animateTransform attributeName="transform" type="translate" values="0 0;0 -30;0 0" dur=".7s" repeatCount="3"/>`

// A sticker that pops where the person clicked (x, y: 0-1 of the window).
const popAt = (x: number, y: number, n: number, pops: string[]) => {
  const name = pops[n % pops.length] ?? 'heart'
  return (
    `<svg x="${(x * 100).toFixed(1)}%" y="${(y * 100).toFixed(1)}%" overflow="visible"><g opacity="0">` +
    `<animate attributeName="opacity" values="0;1;1;0" keyTimes="0;.1;.75;1" ${once(3)}/>` +
    `<g><animateTransform attributeName="transform" type="translate" values="0 0;0 -70" ${once(3)}/>` +
    `<g><animateTransform attributeName="transform" type="scale" values=".4;1.5;1.2" keyTimes="0;.2;1" ${once(3)}/>${use(name)}</g></g></g></svg>`
  )
}

/** The duckling layer: its flipbook in the right margin, plus what a poke sets off. */
export function duckLayer(mood: Mood, poke: Poke | null = null, still = false, w: Weather = 'day'): string {
  const fb = flipbook(mood, still, w)
  const k = KINDS[w]
  const isPop = poke?.what === 'pop' && poke.x !== undefined && poke.y !== undefined
  const body =
    (poke?.what === 'party' ? confetti(k.pops) : '') +
    (poke?.what === 'party' || poke?.what === 'mascot' ? `<g>${HOP}${fb.body}</g>` : mood === 'sit' ? `<g>${SWAY}${fb.body}</g>` : fb.body) +
    (poke?.what === 'mascot' ? hearts(k.heart) : '') +
    (mood === 'sleep' ? SNORE : '')
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">` +
    // a fresh number per poke, so the one-shot animations play again
    `<!-- poke ${poke?.n ?? 0} -->` +
    `<defs>${fb.defs}</defs>` +
    strip(
      'right',
      'xMaxYMax',
      `<ellipse cx="${DUCK_AT.x}" cy="${DUCK_AT.y + 4}" rx="70" ry="9" fill="#8fb86a" opacity=".4"/>` +
        `<g transform="translate(${DUCK_AT.x} ${DUCK_AT.y}) scale(${FRAME_K.toFixed(3)})">${body}</g>`,
    ) +
    (isPop ? popAt(poke.x ?? 0, poke.y ?? 0, poke.n, k.pops) : '') +
    `</svg>`
  )
}

/** Both layers flattened into one SVG: the world defines every sticker the duckling layer uses. */
export function scene(isAsleep: boolean, poke: Poke | null = null, still = false, floaters = true, variant = 'day'): string {
  const w: Weather = variant === 'dusk' || variant === 'rain' ? variant : 'day'
  const inner = (s: string) => s.slice(s.indexOf('>') + 1, s.lastIndexOf('</svg>'))
  return `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">${inner(worldLayer(floaters, w))}${inner(duckLayer(moodOf(isAsleep), poke, still, w))}</svg>`
}

// The duckling on its own (its first idle frame), for the usage pane's header.
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

// the dragonfly bobs while its wings flap
const FL = size('fly')
const FL_BOX = `${-FL.w / 2 - 8} ${-FL.h / 2 - 10} ${FL.w + 16} ${FL.h + 20}`
const flBob = `<animateTransform attributeName="transform" type="translate" values="0 0;0 -5;0 0" dur="2.4s" repeatCount="indefinite" calcMode="spline" keySplines="${EASE};${EASE}"/>`

const FLY_STICKER =
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${FL_BOX}" width="36" height="${Math.round((36 * (FL.h + 20)) / (FL.w + 16))}">` +
  `<defs>${def('fly')}</defs>` +
  `<g>${flBob}${flap('fly')}</g></svg>`

export const STICKERS = {
  daisy: sticker('daisy'),
  heart: sticker('heart'),
  lotus: sticker('lotus'),
  boat: sticker('boat'),
  fly: FLY_STICKER,
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
  duck: spriteIcon('head', 2),
  think: spriteIcon('sparkle', 4),
  pad: spriteIcon('pad', 2),
  coin: spriteIcon('lotus', 2),
  fly: iconSvg(FL_BOX, flap('fly'), ['fly']),
}

// A glass of pond water whose level is the context window's fill (0-100).
export function juiceGlass(percent: number | null): string {
  const p = Math.max(0, Math.min(100, percent ?? 0))
  const hot = p >= 80
  const top = 10
  const bottom = 46
  const level = bottom - ((bottom - top) * p) / 100
  const juice = hot ? '#f6a5b5' : '#9fd3ec'
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

// A water ring that fills with a rate-limit window's use (0-100).
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
    `<circle cx="24" cy="24" r="${r}" fill="none" stroke="${hot ? '#f28ca0' : '#5fb0d6'}" stroke-width="7" stroke-linecap="round"` +
    ` stroke-dasharray="${((c * p) / 100).toFixed(1)} ${c.toFixed(1)}" transform="rotate(-90 24 24)"/>` +
    `<circle cx="24" cy="24" r="4" fill="#3f5a2c"/>` +
    `</svg>`
  )
}
