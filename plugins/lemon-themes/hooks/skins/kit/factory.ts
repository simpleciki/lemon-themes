// A whole skin from data: sprites, the mascot's frames, where things stand, colours and words.
// The traced skins (lemon-bear, meadow-sheep, pond-duck) each wrote this by hand; the code-drawn ones
// (pixel and vector) describe themselves with a SkinSpec and get the scene, stickers, icons and the
// Skin object from here. Same rules as the traced ones (docs/LESSONS.md): SMIL only, one Svg, nothing
// visible only because of an <animate>, under 131,072 characters.

import type { ThemeMessageRule, ThemeSetArgs } from 'claude-code'

import type { Poke } from '../../../types'
import type { L } from '../../i18n'
import { makeColors } from '../../make-colors.js'
import type { Cheer, Skin } from '../skin'

export type Art = { w: number; h: number; body: string }
/** A mascot frame: art standing on its bottom edge (dy moves it up or down). */
export type Frame = Art & { dy?: number }
/** [sprite, x, y, scale] in a side strip's 400 x 1000 units. */
export type Place = [string, number, number, number]

export type SkinSpec = {
  id: string
  name: L
  mascot: L
  blurb: L
  aliases: string[]
  alt: { awake: L; asleep: L }
  sprites: Record<string, Art>
  /** idle: [0] calm, then any others; sleep: breathing frames. Steps are [frame, seconds]. */
  frames: { idle: Frame[]; sleep: Frame[] }
  idleSteps: [number, number][]
  sleepSteps?: [number, number][]
  /** The mascot's height and where its feet stand, in the right strip's units. */
  mascotHeight: number
  mascotAt?: { x: number; y: number }
  /** Pixel skins: keep pixels square-edged when scaled. */
  crisp?: boolean
  world: {
    /** Background, ground and paper colours, light and dark. */
    bg: string
    ground: string
    hatch: string
    darkBg: string
    darkGround: string
    /** Hatch pattern strokes, or none. */
    pattern?: 'hatch' | 'dots' | 'grid' | 'none'
    /** The ground each strip stands on (a path in strip units), or the default soft hill. */
    groundPath?: string
    /** Marks drawn on the ground (tiles, pebbles), the same in both strips, in strip units. */
    groundDetail?: string
    /** Extra scenery under everything else, per strip (an SVG string in strip units). */
    leftBack?: string
    rightBack?: string
    sky?: { sprite: string; y: number; k: number }[]
    leftAir: Place[]
    leftGround: Place[]
    rightAir: Place[]
    rightGround: Place[]
  }
  /** Stickers that burst out in a party, pop on a click, and float up as hearts. */
  burst: string[]
  pops: string[]
  heart: string
  snore: string
  /** Sprites for the band's icons. */
  icons: { mascot: string; think: string; token: string; agents: string; coin: string }
  /** The context glass's drink, and the colours of the glass and ring. */
  drink: string
  ink: string
  paper: string
  accent: string
  /** The person's bubble stickers and the reply sticker (sprite names). */
  userStickers: string[]
  reply: string
  stickerAlt: L
  replyAlt: L
  garden: { flower: string; bush: string; landmark: string; bloom: string; ink: string; mound?: string }
  colors: {
    accent: string
    heading: string
    surface: [string, string, string]
    text: [string, string, string]
    darkSurface: [string, string, string, string]
    darkText: [string, string, string]
    user: [string, string]
    user2: [string, string]
    assistantBorder: string
  }
  emoji: Skin['emoji']
  cheers: Record<Cheer, { zh: string[]; en: string[] }>
}

const EASE = '.45 0 .55 1'
type Hex = `#${string}`
const hx = (c: string) => c as Hex
const SIDEBAR = 300
const HILL = 'M14 1004 C4 952 40 918 110 910 C190 900 250 898 320 910 C378 920 398 960 388 1004Z'

/** Everything a skin's art module would export, built from the spec. */
export function buildArt(spec: SkinSpec) {
  const S = spec.sprites
  const size = (name: string) => S[name] ?? { w: 0, h: 0, body: '' }
  const crisp = spec.crisp === true ? ' shape-rendering="crispEdges"' : ''
  const def = (name: string) => {
    const s = S[name]
    return s === undefined ? '' : `<g id="s-${name}">${s.body}</g>`
  }
  const use = (name: string) => {
    const s = size(name)
    return `<use href="#s-${name}" x="${-s.w / 2}" y="${-s.h / 2}"/>`
  }
  const loop = (type: string, values: string, dur: number, begin: number) =>
    `<animateTransform attributeName="transform" type="${type}" values="${values}" dur="${dur}s" begin="${-begin}s" repeatCount="indefinite" calcMode="spline" keySplines="${EASE};${EASE}"/>`

  // sprites are drawn in their own pixel units; scale them so a sprite is about `k * 100` units wide
  const norm = (name: string) => 100 / Math.max(1, Math.max(size(name).w, size(name).h))

  const floater = (name: string, x: number, y: number, k: number, i: number) => {
    const dur = 5 + ((i * 37) % 6)
    const off = (i * 1.7) % dur
    const sk = (k * norm(name)).toFixed(3)
    return (
      `<g transform="translate(${x} ${y})"><g>${loop('translate', `0 0;${i % 2 ? 14 : -14} -32;0 0`, dur, off)}` +
      `<g>${loop('rotate', '-10;10;-10', dur * 0.8, off)}<g transform="scale(${sk})">${use(name)}</g></g></g></g>`
    )
  }
  const grower = (name: string, x: number, y: number, k: number, i: number) => {
    const s = size(name)
    const dur = 4 + ((i * 29) % 4)
    return (
      `<g transform="translate(${x} ${y})"><g>${loop('rotate', '-2.5;2.5;-2.5', dur, i * 0.9)}` +
      `<g transform="scale(${(k * norm(name)).toFixed(3)})"><use href="#s-${name}" x="${-s.w / 2}" y="${-s.h}"/></g></g></g>`
    )
  }
  const drifter = (name: string, y: number, k: number, from: number, to: number, dur: number, i: number) =>
    `<g transform="translate(0 ${y})"><g>${loop('translate', `${from} 0;${to} 0;${from} 0`, dur, i * 7)}<g transform="scale(${(k * norm(name)).toFixed(3)})">${use(name)}</g></g></g>`

  const W = spec.world
  const STYLE =
    `<style>.bg{fill:${W.bg}}.hatch{opacity:.6}.ground{fill:${W.ground}}` +
    `@media (prefers-color-scheme: dark){.bg{fill:${W.darkBg}}.hatch{opacity:.12}.ground{fill:${W.darkGround}}}</style>`
  const kind = W.pattern ?? 'hatch'
  const PATTERN =
    kind === 'none'
      ? ''
      : kind === 'dots'
        ? `<pattern id="gh" width="34" height="34" patternUnits="userSpaceOnUse"><circle cx="8" cy="8" r="2.2" fill="${W.hatch}"/><circle cx="25" cy="25" r="2.2" fill="${W.hatch}"/></pattern>`
        : kind === 'grid'
          ? `<pattern id="gh" width="24" height="24" patternUnits="userSpaceOnUse"><path d="M0 0H24V24" fill="none" stroke="${W.hatch}" stroke-width="1.4"/></pattern>`
          : `<pattern id="gh" width="46" height="46" patternUnits="userSpaceOnUse" patternTransform="rotate(-28)"><path d="M4 8h14M26 20h12M10 32h16M30 40h9" stroke="${W.hatch}" stroke-width="2.4" stroke-linecap="round"/></pattern>`
  const strip = (side: 'left' | 'right', align: string, body: string) =>
    `<svg x="${side === 'left' ? SIDEBAR : 0}" y="0" width="100%" height="100%" viewBox="0 0 400 1000" preserveAspectRatio="${align} meet">${body}</svg>`
  const GROUND = `<path class="ground" d="${W.groundPath ?? HILL}"/>${W.groundDetail ?? ''}`
  const SKY = (side: 0 | 1) =>
    (W.sky ?? []).map((c, i) => drifter(c.sprite, c.y + side * 20, c.k, side ? 340 : 40, side ? 130 : 260, 46 + i * 6, i + side)).join('')

  const used = [
    ...new Set([
      ...(W.sky ?? []).map(c => c.sprite),
      ...[W.leftAir, W.leftGround, W.rightAir, W.rightGround].flat().map(p => p[0]),
      ...spec.burst,
      ...spec.pops,
      spec.heart,
      spec.garden.flower,
      spec.garden.bush,
      spec.garden.landmark,
      spec.garden.bloom,
    ]),
  ]

  function worldLayer(floaters = true): string {
    return (
      `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%"${crisp}>` +
      STYLE +
      `<defs>${used.map(def).join('')}${PATTERN}</defs>` +
      `<rect class="bg" x="0" y="0" width="100%" height="100%"/>` +
      (PATTERN === '' ? '' : `<rect class="hatch" x="0" y="0" width="100%" height="100%" fill="url(#gh)"/>`) +
      strip(
        'left',
        'xMinYMid',
        (W.leftBack ?? '') +
          SKY(0) +
          GROUND +
          W.leftGround.map(([n, x, y, k], i) => grower(n, x, y, k, i)).join('') +
          (floaters ? W.leftAir.map(([n, x, y, k], i) => floater(n, x, y, k, i)).join('') : ''),
      ) +
      strip(
        'right',
        'xMaxYMid',
        (W.rightBack ?? '') +
          SKY(1) +
          GROUND +
          W.rightGround.map(([n, x, y, k], i) => grower(n, x, y, k, i + 10)).join('') +
          (floaters ? W.rightAir.map(([n, x, y, k], i) => floater(n, x, y, k, i + 20)).join('') : ''),
      ) +
      `</svg>`
    )
  }

  // ---------- the mascot: a flipbook of frames ----------
  type Mood = 'sit' | 'sleep'
  const FLIP: Record<Mood, { seq: 'idle' | 'sleep'; steps: [number, number][] }> = {
    sit: { seq: 'idle', steps: spec.idleSteps },
    sleep: { seq: 'sleep', steps: spec.sleepSteps ?? [[0, 1.7], [1, 1.7]] },
  }
  function flipbook(mood: Mood, still = false) {
    const { seq, steps } = FLIP[mood]
    const all = spec.frames[seq]
    const usedFrames = new Set(steps.map(([fi]) => fi))
    const frames = all.map((f, i) => ({ f, i })).filter(({ i }) => usedFrames.has(i) && (!still || i === 0))
    const total = steps.reduce((a, [, t]) => a + t, 0)
    let at = 0
    const keyTimes = steps.map(([, t]) => {
      const k = (at / total).toFixed(4)
      at += t
      return k
    })
    const body = frames
      .map(({ f, i }) => {
        const values = steps.map(([fi]) => (fi === i ? 1 : 0)).join(';')
        return (
          `<g opacity="${i === 0 ? 1 : 0}">` +
          (still ? '' : `<animate attributeName="opacity" values="${values}" keyTimes="${keyTimes.join(';')}" calcMode="discrete" dur="${total}s" repeatCount="indefinite"/>`) +
          `<use href="#f-${seq}-${i}" x="${-f.w / 2}" y="${-f.h + (f.dy ?? 0)}"/></g>`
        )
      })
      .join('')
    return { defs: frames.map(({ f, i }) => `<g id="f-${seq}-${i}">${f.body}</g>`).join(''), body }
  }

  const F0 = spec.frames.idle[0] ?? { w: 1, h: 1, body: '' }
  const K = spec.mascotHeight / F0.h
  const AT = spec.mascotAt ?? { x: 285, y: 930 }
  const once = (dur: number, begin = 0) => `dur="${dur}s" begin="${begin}s" fill="freeze"`
  // one-shots below are drawn in strip units around the mascot's feet, outside its frame scale
  const hearts = [-60, 0, 60]
    .map(
      (dx, i) =>
        `<g transform="translate(${dx} ${-spec.mascotHeight - 20})" opacity="0">` +
        `<animate attributeName="opacity" values="0;1;1;0" keyTimes="0;.1;.75;1" ${once(3, i * 0.2)}/>` +
        `<g><animateTransform attributeName="transform" type="translate" values="0 0;${(i - 1) * 16} -130" ${once(3, i * 0.2)}/>` +
        `<g transform="scale(${(0.5 * norm(spec.heart)).toFixed(3)})">${use(spec.heart)}</g></g></g>`,
    )
    .join('')
  const confetti = spec.burst
    .map((name, i) => {
      const a = (-165 + (i * 150) / Math.max(1, spec.burst.length - 1)) * (Math.PI / 180)
      const dx = Math.round(Math.cos(a) * 200)
      const dy = Math.round(Math.sin(a) * 180)
      const d = (i % 3) * 0.08
      return (
        `<g transform="translate(0 ${-spec.mascotHeight / 2})" opacity="0">` +
        `<animate attributeName="opacity" values="0;1;1;0" keyTimes="0;.12;.75;1" ${once(1.8, d)}/>` +
        `<g><animateTransform attributeName="transform" type="translate" values="0 0;${dx} ${dy}" calcMode="spline" keySplines=".2 .7 .3 1" ${once(1.8, d)}/>` +
        `<g><animateTransform attributeName="transform" type="rotate" values="0;200" ${once(1.8, d)}/><g transform="scale(${(0.45 * norm(name)).toFixed(3)})">${use(name)}</g></g></g></g>`
      )
    })
    .join('')
  const snore = [0, 1, 2]
    .map(
      i =>
        `<text x="${40 + i * 14}" y="${-spec.mascotHeight * 0.75 - i * 20}" font-family="sans-serif" font-weight="700" font-size="${22 + i * 7}" fill="${spec.snore}" opacity="0">z` +
        `<animate attributeName="opacity" values="0;1;0" keyTimes="0;.3;1" dur="3.6s" begin="${i * 1.2}s" repeatCount="indefinite"/>` +
        `<animateTransform attributeName="transform" type="translate" values="0 0;12 -26" dur="3.6s" begin="${i * 1.2}s" repeatCount="indefinite"/></text>`,
    )
    .join('')
  const SWAY = `<animateTransform attributeName="transform" type="rotate" values="0;-2.2;0;1.8;0" keyTimes="0;.25;.5;.75;1" dur="7s" repeatCount="indefinite" calcMode="spline" keySplines="${Array(4).fill(EASE).join(';')}"/>`
  const HOP = `<animateTransform attributeName="transform" type="translate" values="0 0;0 -30;0 0" dur=".7s" repeatCount="3"/>`
  const popAt = (x: number, y: number, n: number) => {
    const name = spec.pops[n % spec.pops.length] ?? spec.heart
    return (
      `<svg x="${(x * 100).toFixed(1)}%" y="${(y * 100).toFixed(1)}%" overflow="visible"><g opacity="0">` +
      `<animate attributeName="opacity" values="0;1;1;0" keyTimes="0;.1;.75;1" ${once(3)}/>` +
      `<g><animateTransform attributeName="transform" type="translate" values="0 0;0 -70" ${once(3)}/>` +
      `<g><animateTransform attributeName="transform" type="scale" values=".4;1.5;1.2" keyTimes="0;.2;1" ${once(3)}/><g transform="scale(${(0.5 * norm(name)).toFixed(3)})">${use(name)}</g></g></g></g></svg>`
    )
  }

  function mascotLayer(mood: Mood, poke: Poke | null = null, still = false): string {
    const fb = flipbook(mood, still)
    const isPop = poke?.what === 'pop' && poke.x !== undefined && poke.y !== undefined
    const figure = `<g transform="scale(${K.toFixed(4)})">${fb.body}</g>`
    const body =
      (poke?.what === 'party' ? confetti : '') +
      (poke?.what === 'party' || poke?.what === 'mascot' ? `<g>${HOP}${figure}</g>` : mood === 'sit' ? `<g>${SWAY}${figure}</g>` : figure) +
      (poke?.what === 'mascot' ? hearts : '') +
      (mood === 'sleep' ? snore : '')
    return (
      `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%"${crisp}>` +
      `<!-- poke ${poke?.n ?? 0} -->` +
      `<defs>${fb.defs}</defs>` +
      strip(
        'right',
        'xMaxYMax',
        `<ellipse cx="${AT.x}" cy="${AT.y + 4}" rx="70" ry="9" fill="${spec.ink}" opacity=".12"/>` + `<g transform="translate(${AT.x} ${AT.y})">${body}</g>`,
      ) +
      (isPop ? popAt(poke.x ?? 0, poke.y ?? 0, poke.n) : '') +
      `</svg>`
    )
  }

  function scene(isAsleep: boolean, poke: Poke | null = null, still = false, floaters = true): string {
    const inner = (s: string) => s.slice(s.indexOf('>') + 1, s.lastIndexOf('</svg>'))
    return `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%"${crisp}>${inner(worldLayer(floaters))}${inner(mascotLayer(isAsleep ? 'sleep' : 'sit', poke, still))}</svg>`
  }

  const BADGE =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-4 -4 ${F0.w + 8} ${F0.h + 8}" width="84" height="${Math.round((84 * (F0.h + 8)) / (F0.w + 8))}"${crisp}>` +
    F0.body +
    `</svg>`

  const swayLoop = `<animateTransform attributeName="transform" type="rotate" values="-6;6;-6" dur="4s" repeatCount="indefinite" calcMode="spline" keySplines="${EASE};${EASE}"/>`
  const sticker = (name: string, px = 34) => {
    const s = size(name)
    const pad = Math.max(s.w, s.h) * 0.08
    return (
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${-s.w / 2 - pad} ${-s.h / 2 - pad} ${s.w + pad * 2} ${s.h + pad * 2}" width="${px}" height="${Math.round((px * (s.h + pad * 2)) / (s.w + pad * 2))}"${crisp}>` +
      `<defs>${def(name)}</defs><g>${swayLoop}${use(name)}</g></svg>`
    )
  }
  const icon = (name: string) => {
    const s = size(name)
    const side = Math.max(s.w, s.h) * 1.08
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${-(side - s.w) / 2} ${-(side - s.h) / 2} ${side} ${side}"${crisp}><defs>${def(name)}</defs><use href="#s-${name}"/></svg>`
  }

  function juiceGlass(percent: number | null): string {
    const p = Math.max(0, Math.min(100, percent ?? 0))
    const level = 46 - (36 * p) / 100
    return (
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 52">` +
      `<defs><clipPath id="g"><path d="M10 8 L38 8 L35 46 Q24 50 13 46Z"/></clipPath></defs>` +
      `<path d="M10 8 L38 8 L35 46 Q24 50 13 46Z" fill="${spec.paper}" stroke="#ffffff" stroke-width="7" stroke-linejoin="round"/>` +
      `<g clip-path="url(#g)"><rect x="0" y="${level.toFixed(1)}" width="48" height="52" fill="${p >= 80 ? '#f28ca0' : spec.drink}"/></g>` +
      `<path d="M10 8 L38 8 L35 46 Q24 50 13 46Z" fill="none" stroke="${spec.ink}" stroke-width="2.8" stroke-linejoin="round"/>` +
      `<path d="M30 8 L36 0" stroke="${spec.accent}" stroke-width="3" stroke-linecap="round"/></svg>`
    )
  }
  function limitRing(percent: number): string {
    const p = Math.max(0, Math.min(100, percent))
    const r = 16
    const c = 2 * Math.PI * r
    return (
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">` +
      `<circle cx="24" cy="24" r="21" fill="${spec.paper}" stroke="${spec.ink}" stroke-width="2.6"/>` +
      `<circle cx="24" cy="24" r="${r}" fill="none" stroke="${spec.ink}" stroke-opacity=".12" stroke-width="7"/>` +
      `<circle cx="24" cy="24" r="${r}" fill="none" stroke="${p >= 80 ? '#f28ca0' : spec.accent}" stroke-width="7" stroke-linecap="round"` +
      ` stroke-dasharray="${((c * p) / 100).toFixed(1)} ${c.toFixed(1)}" transform="rotate(-90 24 24)"/>` +
      `<circle cx="24" cy="24" r="4" fill="${spec.ink}"/></svg>`
    )
  }

  return { scene, worldLayer, BADGE, sticker, icon, juiceGlass, limitRing, sizeOf: size, defOf: def }
}

/** The Skin the engine uses, from a spec. */
export function makeSkin(spec: SkinSpec): Skin {
  const art = buildArt(spec)
  const c = spec.colors
  const { theme, problems } = makeColors({
    label: spec.name.en,
    roles: { accent: c.accent, danger: '#cf5a4b', success: '#4f9a5a', warning: '#d9a400', pro: '#9b86d6' },
    light: {
      gray: {
        anchors: {
          'surface-0': c.surface[0],
          'surface-1': c.surface[1],
          'surface-2': c.surface[2],
          'text-primary': c.text[0],
          'text-secondary': c.text[1],
          'text-muted': c.text[2],
        },
      },
    },
    dark: {
      gray: {
        anchors: {
          'surface-0': c.darkSurface[0],
          'surface-1': c.darkSurface[1],
          'surface-2': c.darkSurface[2],
          'surface-3': c.darkSurface[3],
          'text-primary': c.darkText[0],
          'text-secondary': c.darkText[1],
          'text-muted': c.darkText[2],
        },
      },
    },
  })
  const soft = { y: 3, blur: 10, color: hx(`${c.text[0]}22`) } as const
  const userBubble: ThemeMessageRule = {
    color: hx(c.text[0]),
    backgroundColor: hx(c.user[0]),
    borderColor: hx(c.user[1]),
    borderWidth: 2,
    radius: spec.crisp === true ? 6 : 20,
    paddingX: 16,
    paddingY: 12,
    shadow: soft,
  }
  const base: ThemeSetArgs = { colors: theme, backdrop: { scene: spec.id } }
  return {
    id: spec.id,
    name: spec.name,
    mascot: spec.mascot,
    blurb: spec.blurb,
    aliases: spec.aliases,
    base,
    look: {
      ...base,
      style: {
        Text: { fontSize: 15, lineHeight: 24 },
        Heading: { color: hx(c.heading) },
        UserMessage: [
          { ...userBubble, rotate: spec.crisp === true ? 0 : -0.6 },
          { ...userBubble, backgroundColor: hx(c.user2[0]), borderColor: hx(c.user2[1]), rotate: spec.crisp === true ? 0 : 0.5 },
        ],
        AssistantMessage: {
          color: hx(c.text[0]),
          backgroundColor: hx(c.surface[2]),
          borderColor: hx(c.assistantBorder),
          borderWidth: 1.5,
          radius: spec.crisp === true ? 6 : 18,
          paddingX: 18,
          paddingY: 14,
          shadow: soft,
        },
        ToolUse: { color: hx(c.text[1]), backgroundColor: hx(c.surface[1]), radius: spec.crisp === true ? 4 : 10, paddingX: 10, paddingY: 4 },
      },
    },
    problems,
    scene: (isAsleep, poke, still, floaters) => art.scene(isAsleep, poke, still, floaters),
    alt: spec.alt,
    userStickers: spec.userStickers.map(n => art.sticker(n)),
    userStickerAlt: spec.stickerAlt,
    reply: { svg: art.sticker(spec.reply), alt: spec.replyAlt, width: 34, height: 34 },
    icons: {
      mascot: art.icon(spec.icons.mascot),
      think: art.icon(spec.icons.think),
      token: art.icon(spec.icons.token),
      agents: art.icon(spec.icons.agents),
      coin: art.icon(spec.icons.coin),
    },
    juiceGlass: art.juiceGlass,
    limitRing: art.limitRing,
    badge: art.BADGE,
    ink: { heading: c.heading, gauge: c.accent, border: c.user[1], ok: '#4f9a5a' },
    emoji: spec.emoji,
    garden: () => ({ ...spec.garden, size: art.sizeOf, def: art.defOf }),
    cheers: spec.cheers,
  }
}
