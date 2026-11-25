// Flat little whale in the shallows: a chubby baby-blue whale with a pale belly resting on the sandy
// sea floor, puffing a water spout now and then, with bubbles, kelp, fish, starfish and coral around.
// Hand-written kawaii vector art: a thick round-joined navy outline around every shape, flat fills with
// at most one soft shading tone, big shiny eyes, pink blush. kit/factory.ts builds the scene and the rest.

import { makeSkin } from '../kit/factory'
import type { Art, Frame, SkinSpec } from '../kit/factory'

// one palette for the whole skin, so every sprite shares its colours
const C = {
  ink: '#1f3550',
  body: '#7dc9ee',
  deep: '#5aaedd',
  light: '#b4e3f8',
  belly: '#f0fbff',
  groove: '#bfe3f3',
  cheek: '#ff9db1',
  mouth: '#8c2f45',
  tongue: '#ff8fa6',
  spout: '#c9f1fb',
  splash: '#9fe0f3',
  white: '#ffffff',
  coral: '#ff8b8f',
  coralDeep: '#ef6a77',
  coralLight: '#ffb8b4',
  pink: '#ffb7c8',
  pinkDeep: '#f592ad',
  aqua: '#6fd8cd',
  aquaDeep: '#3cbcb0',
  kelp: '#5cc898',
  kelpDeep: '#3ea97f',
  gold: '#ffc65c',
  goldDeep: '#f4a63c',
  lilac: '#cdbaf4',
  lilacDeep: '#ab95e8',
  stone: '#c4d1d9',
  stoneDeep: '#a6b7c2',
}

// ---------- outlining ----------
// A shape is an element without a fill ('path d="..."', 'circle cx=..'); `ol` draws all of them once in
// ink with a doubled stroke (the outline), then again in their fills, so touching shapes share one outline.
type Sh = [string, string]
const ol = (shapes: Sh[], w = 4.5) =>
  `<g fill="${C.ink}" stroke="${C.ink}" stroke-width="${w * 2}" stroke-linejoin="round" stroke-linecap="round">` +
  shapes.map(([el]) => `<${el}/>`).join('') +
  `</g>` +
  shapes.map(([el, fill]) => `<${el} fill="${fill}"/>`).join('')
const line = (d: string, color: string = C.ink, w = 3) =>
  `<path d="${d}" fill="none" stroke="${color}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`
/** A big dark shiny eye: one large and one small highlight. */
const eye = (cx: number, cy: number, r: number) =>
  `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${C.ink}"/>` +
  `<circle cx="${(cx - r * 0.3).toFixed(1)}" cy="${(cy - r * 0.32).toFixed(1)}" r="${(r * 0.38).toFixed(1)}" fill="${C.white}"/>` +
  `<circle cx="${(cx + r * 0.36).toFixed(1)}" cy="${(cy + r * 0.34).toFixed(1)}" r="${(r * 0.17).toFixed(1)}" fill="${C.white}"/>`
const blush = (cx: number, cy: number, rx: number) =>
  `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${(rx * 0.58).toFixed(1)}" fill="${C.cheek}" fill-opacity=".85"/>`
/** A small open smiling mouth with a pink tongue, centred on (cx, cy), about 2s wide. */
const mouth = (cx: number, cy: number, s: number) =>
  `<path d="M${cx - s} ${cy} Q${cx} ${cy + s * 1.7} ${cx + s} ${cy}Z" fill="${C.mouth}" stroke="${C.ink}" stroke-width="${(s * 0.45).toFixed(1)}" stroke-linejoin="round"/>` +
  `<path d="M${(cx - s * 0.55).toFixed(1)} ${(cy + s * 0.75).toFixed(1)} Q${cx} ${(cy + s * 0.35).toFixed(1)} ${(cx + s * 0.55).toFixed(1)} ${(cy + s * 0.75).toFixed(1)} Q${cx} ${(cy + s * 1.4).toFixed(1)} ${(cx - s * 0.55).toFixed(1)} ${(cy + s * 0.75).toFixed(1)}Z" fill="${C.tongue}"/>`
const shut = (cx: number, cy: number, r: number) => line(`M${cx - r} ${cy - 1} Q${cx} ${cy + r * 0.9} ${cx + r} ${cy - 1}`, C.ink, 3.6)

// ---------- the whale (three-quarter view facing left, 128 x 96 box, belly on the bottom edge) ----------
type Look = { eyes: 'open' | 'blink' | 'sleep'; spout?: boolean; tail?: number; bubble?: 0 | 1 | 2; breathe?: boolean }

const BUBBLE = (cx: number, cy: number, r: number, w = 3) =>
  ol([[`circle cx="${cx}" cy="${cy}" r="${r}"`, C.spout]], w) +
  `<circle cx="${(cx - r * 0.38).toFixed(1)}" cy="${(cy - r * 0.38).toFixed(1)}" r="${(r * 0.26).toFixed(1)}" fill="${C.white}"/>` +
  `<circle cx="${(cx + r * 0.4).toFixed(1)}" cy="${(cy + r * 0.36).toFixed(1)}" r="${(r * 0.12).toFixed(1)}" fill="${C.white}"/>`

const SPOUT =
  ol(
    [
      ['path d="M50 19 C48 11 49 4 52 -2 L60 -2 C63 4 63 11 61 19Z"', C.splash],
      ['path d="M56 0 C46 -12 31 -12 24 2 C34 -3 45 -1 54 6Z"', C.splash],
      ['path d="M56 0 C66 -12 81 -12 88 2 C78 -3 67 -1 58 6Z"', C.splash],
      ['circle cx="22" cy="12" r="3.6"', C.splash],
      ['circle cx="90" cy="12" r="3.6"', C.splash],
    ],
    3.5,
  ) + `<path d="M55 0 C54 -5 55 -9 56 -11 C58 -9 59 -5 58 0Z" fill="${C.white}"/>`

function whale(o: Look): string {
  const tail = o.tail ?? 0
  const tr = `transform="rotate(${tail} 96 66)"`
  const body =
    // silhouette: tail stem and flukes behind a big round body, one shared outline
    ol([
      [`path ${tr} d="M86 62 C97 58 105 50 109 38 L117 40 C115 56 104 70 90 78Z"`, C.body],
      [`path ${tr} d="M113 41 C105 37 100 29 102 20 C109 23 115 31 116 40Z"`, C.deep],
      [`path ${tr} d="M113 41 C116 31 121 25 128 24 C128 33 122 40 114 42Z"`, C.deep],
      ['path d="M10 58 C10 32 34 16 60 16 C86 16 101 34 103 52 C105 68 97 82 79 88 C68 91 56 91 44 91 C22 91 10 80 10 58Z"', C.body],
    ]) +
    // soft shading tone and a crown highlight
    `<path d="M70 20 C88 26 100 40 101 56 C102 70 94 82 80 87 C92 74 96 56 88 40 C84 32 78 26 70 20Z" fill="${C.deep}" fill-opacity=".55"/>` +
    `<path d="M28 30 C36 22 46 19 56 20 C50 24 40 28 33 35 C30 37 26 34 28 30Z" fill="${C.light}"/>` +
    // pale belly with throat grooves
    `<path d="M13 70 C19 82 30 91 46 91 C64 91 80 89 90 80 C72 83 52 82 36 78 C26 76 18 73 13 70Z" fill="${C.belly}"/>` +
    line('M13 70 C18 73 26 76 36 78 C52 82 72 83 90 80', C.deep, 2.6) +
    line('M30 84 C42 87 54 88 66 87', C.groove, 2.2) +
    // blowhole
    line('M51 19.5 Q56 16.5 61 19.5', C.ink, 2.8) +
    // little flipper, outlined on its own over the body
    ol([['path d="M64 74 C72 74 80 79 82 88 C73 90 65 86 62 79 C61 76 62 74 64 74Z"', C.deep]], 3.5) +
    // face: two big eyes, blush, open smile
    (o.eyes === 'open' ? eye(23, 50, 9) + eye(51, 50, 9) : shut(23, 52, 7.5) + shut(51, 52, 7.5)) +
    blush(14, 64, 6) +
    blush(61, 64, 6) +
    (o.eyes === 'sleep' ? line('M33 63 Q37 67 41 63', C.ink, 3) : mouth(37, 61, 5.5))
  const breathing = o.breathe === true ? `<g transform="translate(0 92) scale(1.015 1.035) translate(0 -92)">${body}</g>` : body
  const bubble = o.bubble === 1 ? BUBBLE(3, 50, 5, 2.2) : o.bubble === 2 ? BUBBLE(-3, 32, 8.5, 2.6) + BUBBLE(5, 52, 3.5, 2) : ''
  return breathing + (o.spout === true ? SPOUT : '') + bubble
}

const W = 128
const H = 96
const frame = (o: Look): Frame => ({ w: W, h: H, body: whale(o) })

// ---------- props (each in its own box, outlined like the whale) ----------
const art = (w: number, h: number, body: string): Art => ({ w, h, body })

const SPRITES: Record<string, Art> = {
  whale: art(W, H, whale({ eyes: 'open' })),
  bubble: art(60, 60, BUBBLE(30, 30, 25, 3.5)),
  bubbles: art(70, 100, BUBBLE(42, 76, 19, 3.5) + BUBBLE(20, 40, 12.5, 3.5) + BUBBLE(46, 14, 8.5, 3)),
  kelp: art(
    70,
    130,
    ol([
      ['path d="M16 130 C8 118 14 104 7 92 C3 86 3 80 5 75 C15 83 21 94 21 106 C21 116 25 124 25 130Z"', C.kelpDeep],
      ['path d="M44 130 C52 116 41 104 50 88 C58 74 51 62 58 48 C61 42 64 38 67 36 C68 52 63 62 62 74 C60 88 65 100 56 114 C53 120 53 126 53 130Z"', C.kelpDeep],
      ['path d="M30 130 C19 110 40 96 29 76 C20 58 38 44 31 22 C29 14 31 8 35 4 C42 18 45 30 40 46 C35 62 47 74 40 92 C35 106 44 118 41 130Z"', C.kelp],
    ]) + line('M35 14 C38 24 38 32 35 40', '#93e3bf', 2.6),
  ),
  fish: art(
    100,
    66,
    ol([
      ['path d="M70 33 L96 14 C93 26 93 40 96 52Z"', C.goldDeep],
      ['path d="M40 10 C45 4 54 2 60 6 C55 8 50 11 46 15Z"', C.goldDeep],
      ['path d="M6 33 C10 15 29 8 46 8 C62 8 75 19 77 33 C75 47 62 58 46 58 C29 58 10 51 6 33Z"', C.gold],
    ]) +
      `<path d="M50 10 C56 22 56 44 50 56 L58 54 C64 42 64 24 58 12Z" fill="${C.white}" fill-opacity=".8"/>` +
      line('M50 10 C56 22 56 44 50 56', C.goldDeep, 2.4) +
      eye(24, 29, 6) +
      blush(20, 42, 4.5) +
      line('M10 37 Q14 40 17 37', C.ink, 2.6),
  ),
  starfish: art(
    100,
    96,
    ol([
      ['path d="M50 6 C55 6 57 22 62 32 C72 34 92 33 94 39 C96 45 80 54 74 62 C76 72 82 88 77 92 C71 96 58 84 50 80 C42 84 29 96 23 92 C18 88 24 72 26 62 C20 54 4 45 6 39 C8 33 28 34 38 32 C43 22 45 6 50 6Z"', C.coral],
    ]) +
      `<path d="M50 18 C52 28 54 34 58 40 C52 42 48 42 42 40 C46 34 48 28 50 18Z" fill="${C.coralLight}"/>` +
      `<circle cx="76" cy="42" r="2.4" fill="${C.coralLight}"/><circle cx="24" cy="42" r="2.4" fill="${C.coralLight}"/>` +
      `<circle cx="66" cy="76" r="2.4" fill="${C.coralLight}"/><circle cx="34" cy="76" r="2.4" fill="${C.coralLight}"/>` +
      eye(41, 52, 5) +
      eye(59, 52, 5) +
      blush(35, 61, 3.6) +
      blush(65, 61, 3.6) +
      mouth(50, 59, 3.4),
  ),
  shell: art(
    100,
    88,
    ol([
      ['path d="M30 70 L36 84 L64 84 L70 70Z"', C.pinkDeep],
      ['path d="M50 6 C76 6 95 28 95 54 C95 62 91 68 85 70 L15 70 C9 68 5 62 5 54 C5 28 24 6 50 6Z"', C.pink],
    ]) +
      line('M50 66 L50 12 M50 66 L30 16 M50 66 L70 16 M50 66 L15 34 M50 66 L85 34', C.pinkDeep, 3.4) +
      `<path d="M24 22 C30 16 38 12 45 12 C39 17 33 21 28 28Z" fill="${C.white}" fill-opacity=".75"/>`,
  ),
  coral: art(
    110,
    124,
    ol([
      ['path d="M48 122 L50 92 C40 84 34 74 32 60 C22 56 14 44 16 30 C17 24 23 22 26 28 C28 38 32 46 38 50 C38 40 36 30 38 18 C39 12 46 12 47 18 C48 30 50 44 54 56 C58 46 60 34 66 24 C70 18 77 20 76 27 C74 40 68 52 62 62 C66 66 74 68 80 64 C86 58 88 50 92 44 C96 40 102 42 101 48 C98 62 90 74 76 80 C70 84 64 86 60 90 L62 122Z"', C.coral],
    ]) +
      `<path d="M52 120 L53 96 C54 90 57 88 58 94 L58 120Z" fill="${C.coralDeep}"/>` +
      `<circle cx="22" cy="28" r="2.6" fill="${C.coralLight}"/><circle cx="43" cy="17" r="2.6" fill="${C.coralLight}"/><circle cx="72" cy="25" r="2.6" fill="${C.coralLight}"/><circle cx="97" cy="46" r="2.6" fill="${C.coralLight}"/>` +
      `<circle cx="36" cy="64" r="2.6" fill="${C.coralLight}"/><circle cx="70" cy="74" r="2.6" fill="${C.coralLight}"/><circle cx="52" cy="40" r="2.6" fill="${C.coralLight}"/>`,
  ),
  anemone: art(
    90,
    96,
    ol([
      ...[-60, -36, -12, 12, 36, 60].map((a): Sh => [`path transform="rotate(${a} 45 62)" d="M41 62 C38 44 40 28 45 18 C50 28 52 44 49 62Z"`, C.lilac]),
      ...[-60, -36, -12, 12, 36, 60].map((a): Sh => [`circle transform="rotate(${a} 45 62)" cx="45" cy="18" r="5.5"`, C.pink]),
      ['path d="M28 94 C26 80 30 68 45 64 C60 68 64 80 62 94Z"', C.aquaDeep],
    ]) +
      `<ellipse cx="45" cy="66" rx="13" ry="5" fill="${C.lilacDeep}"/>` +
      line('M35 78 C37 74 40 72 44 72', C.aqua, 3),
  ),
  jelly: art(
    80,
    112,
    line('M22 52 C20 70 28 82 24 98 M34 54 C32 74 40 86 36 106 M46 54 C48 74 40 86 44 106 M58 52 C60 70 52 82 56 98', C.ink, 7.6) +
      line('M22 52 C20 70 28 82 24 98 M34 54 C32 74 40 86 36 106 M46 54 C48 74 40 86 44 106 M58 52 C60 70 52 82 56 98', C.lilacDeep, 3) +
      ol([['path d="M7 50 C7 24 22 7 40 7 C58 7 73 24 73 50 C66 56 58 52 52 56 C46 52 34 52 28 56 C22 52 14 56 7 50Z"', C.lilac]]) +
      `<path d="M17 26 C21 18 29 13 37 12 C31 18 25 24 21 32Z" fill="${C.white}" fill-opacity=".7"/>` +
      eye(30, 33, 5) +
      eye(50, 33, 5) +
      blush(22, 42, 3.8) +
      blush(58, 42, 3.8) +
      mouth(40, 40, 3.4),
  ),
  heart: art(
    100,
    90,
    ol([['path d="M50 84 C40 74 6 56 6 31 C6 15 17 6 29 6 C38 6 46 11 50 19 C54 11 62 6 71 6 C83 6 94 15 94 31 C94 56 60 74 50 84Z"', C.coral]]) +
      `<path d="M17 27 C19 19 25 14 32 14 C28 19 24 25 23 33Z" fill="${C.white}" fill-opacity=".7"/>`,
  ),
  sparkle: art(
    100,
    100,
    ol([['path d="M50 6 C54 34 66 46 94 50 C66 54 54 66 50 94 C46 66 34 54 6 50 C34 46 46 34 50 6Z"', C.gold]]) +
      `<path d="M50 28 C52 41 58 47 71 50 C58 52 52 58 50 71 C48 58 42 52 29 50 C42 48 48 41 50 28Z" fill="#fff1c2"/>`,
  ),
  wave: art(
    120,
    62,
    ol([['path d="M6 56 C6 30 23 9 50 9 C72 9 85 22 85 38 C85 48 78 54 70 52 C76 46 74 36 66 34 C56 32 50 42 54 52 C60 60 80 58 92 50 C104 44 110 46 115 50 C111 56 104 56 98 56Z"', C.aqua]]) +
      `<path d="M15 44 C17 30 29 19 44 17 C32 25 25 34 23 46Z" fill="${C.white}" fill-opacity=".6"/>`,
  ),
  pebbles: art(
    100,
    46,
    ol([
      ['ellipse cx="70" cy="32" rx="22" ry="10"', C.stoneDeep],
      ['ellipse cx="30" cy="29" rx="24" ry="13"', C.stone],
    ]) + `<ellipse cx="24" cy="23" rx="9" ry="3.5" fill="#e3eaee"/>`,
  ),
}

// sand along the bottom of each strip, with a soft rippled top
const SAND = 'M0 1004 V928 C50 914 100 912 150 920 C200 928 250 924 300 914 C340 906 370 910 400 918 V1004Z'
const RIPPLES =
  `<g fill="none" stroke="#e2c387" stroke-width="4" stroke-linecap="round" opacity=".55">` +
  `<path d="M30 958 Q50 950 70 958"/><path d="M180 972 Q204 964 228 972"/><path d="M300 952 Q318 945 336 952"/>` +
  `<path d="M96 986 Q116 979 136 986"/><path d="M250 990 Q270 983 290 990"/></g>` +
  `<g fill="#e8cd95" opacity=".7"><circle cx="120" cy="948" r="4"/><circle cx="260" cy="944" r="3"/><circle cx="352" cy="976" r="4"/><circle cx="60" cy="982" r="3"/></g>`
// faint shafts of light coming down through the water
// (the gradient is defined once in the left strip, which is drawn first, and reused by the right one)
const RAY_GRAD = `<defs><linearGradient id="flat-whale-ray" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff" stop-opacity=".4"/><stop offset="1" stop-color="#ffffff" stop-opacity="0"/></linearGradient></defs>`
const RAYS = `<g fill="url(#flat-whale-ray)"><path d="M40 0 L110 0 L240 900 L180 900Z"/><path d="M190 0 L230 0 L340 820 L305 820Z"/><path d="M300 0 L360 0 L400 300 L400 620Z"/></g>`

export const FLAT_WHALE_SPEC: SkinSpec = {
  id: 'flat-whale',
  name: { zh: '扁平小鲸鱼', en: 'Flat little whale' },
  mascot: { zh: '小鲸鱼', en: 'whale' },
  blurb: {
    zh: '粗描边扁平插画：趴在浅海沙地上喷水花的胖胖小蓝鲸，身边飘着泡泡、海草、小鱼和珊瑚',
    en: 'Outlined flat illustration: a chubby baby-blue whale puffing its spout on the sandy shallows, with bubbles, kelp, fish and coral around',
  },
  aliases: ['鲸鱼', '小鲸鱼', 'whale', 'flat-whale'],
  alt: { awake: { zh: '浅海沙地上的扁平小鲸鱼', en: 'A flat little whale on the sandy sea floor' }, asleep: { zh: '小鲸鱼闭着眼睛吐泡泡睡着了', en: 'The little whale asleep, blowing bubbles' } },
  sprites: SPRITES,
  frames: {
    idle: [frame({ eyes: 'open' }), frame({ eyes: 'blink' }), frame({ eyes: 'open', spout: true, tail: -10 })],
    sleep: [frame({ eyes: 'sleep', tail: 12, bubble: 1 }), frame({ eyes: 'sleep', tail: 12, bubble: 2, breathe: true })],
  },
  idleSteps: [[0, 3], [1, 0.16], [0, 2], [2, 1.2], [0, 2.6], [1, 0.16], [0, 0.3], [1, 0.16], [0, 1.6]],
  sleepSteps: [[0, 1.9], [1, 1.9]],
  mascotHeight: 122,
  mascotAt: { x: 282, y: 926 },
  world: {
    bg: '#def4f3',
    ground: '#f3dcab',
    hatch: '#c4e9e8',
    darkBg: '#0d2136',
    darkGround: '#2c4563',
    pattern: 'dots',
    groundPath: SAND,
    groundDetail: RIPPLES,
    leftBack: RAY_GRAD + RAYS,
    rightBack: RAYS,
    sky: [{ sprite: 'wave', y: 130, k: 0.7 }],
    leftAir: [['bubbles', 120, 250, 0.5], ['fish', 230, 360, 0.55], ['jelly', 100, 480, 0.55], ['bubble', 250, 600, 0.22], ['sparkle', 160, 700, 0.28], ['bubble', 300, 260, 0.18]],
    leftGround: [['kelp', 60, 926, 1.3], ['coral', 330, 914, 0.95], ['shell', 200, 930, 0.34], ['starfish', 140, 936, 0.32]],
    rightAir: [['fish', 220, 260, 0.45], ['bubbles', 340, 380, 0.42], ['jelly', 230, 500, 0.45], ['bubble', 330, 620, 0.2], ['heart', 200, 680, 0.26]],
    rightGround: [['kelp', 100, 926, 1.1], ['starfish', 170, 934, 0.3], ['anemone', 40, 930, 0.5]],
  },
  burst: ['bubble', 'heart', 'fish', 'starfish', 'sparkle', 'shell', 'heart', 'bubble'],
  pops: ['heart', 'bubble', 'fish', 'starfish', 'sparkle'],
  heart: 'heart',
  snore: '#4fa3d6',
  icons: { mascot: 'whale', think: 'sparkle', token: 'bubble', agents: 'fish', coin: 'shell' },
  drink: '#8fe0e6',
  ink: '#1f3550',
  paper: '#f6fdfd',
  accent: '#1f9fa6',
  userStickers: ['heart', 'starfish', 'fish', 'shell'],
  reply: 'bubbles',
  stickerAlt: { zh: '海洋小贴纸', en: 'Sea sticker' },
  replyAlt: { zh: '泡泡贴纸', en: 'Bubbles sticker' },
  garden: { flower: 'anemone', bush: 'kelp', landmark: 'coral', bloom: 'shell', ink: '#1f3550' },
  colors: {
    accent: '#1f9fa6',
    heading: '#d65a72',
    surface: ['#eef9f9', '#f5fcfc', '#fdffff'],
    text: ['#1f3142', '#3e5466', '#617587'],
    darkSurface: ['#0d2136', '#132a42', '#19334d', '#203d59'],
    darkText: ['#ecf6fb', '#c3d7e4', '#9bb3c4'],
    user: ['#ffe3e6', '#ff8b8f'],
    user2: ['#d9f4f6', '#5fd3c8'],
    assistantBorder: '#cfe9ec',
  },
  emoji: { title: '🐳🌊', mascot: '🐳', context: '🫧', token: '🐚', agents: '🐠' },
  cheers: {
    praise: { zh: ['小鲸鱼开心得喷出一朵水花～', '被夸啦，尾巴拍拍沙子！'], en: ['The little whale puffs a happy spout~', 'Praised! A happy tail-pat on the sand!'] },
    commit: { zh: ['提交成功！小鲸鱼吐了一串泡泡 🫧', '又一颗珍珠落进贝壳里！'], en: ['Committed! The whale blows a string of bubbles 🫧', 'Another pearl tucked in the shell!'] },
    tests: { zh: ['测试全绿！海草都在跳舞', '全部通过，噗～水花！'], en: ['All green! Even the kelp is dancing', 'Everything passes, splash~'] },
    yay: { zh: ['耶！小鲸鱼在浅海里转圈圈', '今天的海也很温柔，你也很棒！'], en: ['Yay! The whale twirls in the shallows', 'The sea is gentle today, and you did great!'] },
  },
}

export const FLAT_WHALE = makeSkin(FLAT_WHALE_SPEC)
