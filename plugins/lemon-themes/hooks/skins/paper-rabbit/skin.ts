// Paper-cut moon rabbit: a cream paper bunny sitting on layered paper hills under a big pale moon,
// with paper stars, clouds, a lantern, carrots and a mooncake drifting by. Everything is cut by hand
// in code (paper.ts): flat shapes with slightly uneven edges, each layer casting a soft shadow on the
// one below. The bunny's frames are in rabbit.ts; kit/factory.ts builds the scene and the rest.

import { makeSkin } from '../kit/factory'
import type { Art, SkinSpec } from '../kit/factory'
import { arc, blob, circle, poly, rot, sheet, smooth } from './paper'
import type { Pt } from './paper'
import { headArt, sit, sleep } from './rabbit'

import { FRAMES as TRACED } from './traced/frames'

// the mascot is traced from the Codex sheet in art-src (tools/build_theme.py): [0] calm, [1] blink,
// [2] asleep; asleep breathes by rising a little on the second frame
const T = TRACED.all ?? []
const T0 = T[0]!
const T1 = T[1]!
const T2 = T[2]!
const T2b = { ...T2, dy: T2.dy - 1.5 }
const topOf = (f: typeof T0, part: number) => ({ w: f.w, h: Math.round(f.h * part), body: f.body })

const { cut, blobs, tone, line } = sheet(4.5)

const C = {
  moon: '#fff0c2',
  moon2: '#ffe08a',
  star: '#ffd86b',
  star2: '#fff3bf',
  cloud: '#ffffff',
  cloud2: '#e6e0f7',
  carrot: '#f39a4a',
  carrot2: '#e07a32',
  leaf: '#7fb68f',
  leaf2: '#5e9a78',
  cake: '#d9944a',
  cake2: '#eab26a',
  cake3: '#c57d34',
  pink: '#f48fab',
  pink2: '#f9bccb',
  red: '#e8574f',
  red2: '#f27f6c',
  rib: '#c33f3c',
  gold: '#f4b844',
  bark: '#a8785a',
  osm: '#f7a937',
  osm2: '#ffd36a',
  ink: '#3b2f4f',
}

const art = (w: number, h: number, body: string): Art => ({ w, h, body })

// ---------- sky ----------
/** A crescent opening to the right: the rim of a circle (centre cx, cy, radius R) from `open`° round the
 * left to -`open`°, back along a second circle through the same two tips whose left edge is `thick` in. */
function crescent(cx: number, cy: number, R: number, open: number, thick: number): Pt[] {
  const outer = arc(cx, cy, R, open, 360 - open, 10)
  const tx = cx + R * Math.cos((open * Math.PI) / 180) // the tips' x
  const ty = R * Math.sin((open * Math.PI) / 180) // the tips' height from the middle
  const left = cx - R + thick
  const c = ((tx * tx - left * left + ty * ty) / (2 * (tx - left))) // inner centre: same distance to a tip and to `left`
  const r = c - left
  const a = (Math.atan2(-ty, tx - c) * 180) / Math.PI + 360
  const inner = arc(c, cy, r, a, 360 - a, 6)
  return [...outer, ...inner.slice(1, -1)]
}

function moon(): Art {
  return art(
    100,
    100,
    cut(C.moon2, smooth(crescent(50, 50, 42, 52, 24))) +
      tone(C.moon, smooth(crescent(48, 50, 34, 68, 15))) +
      line(C.ink, 'M16 46q4.5 4 9 0', 2.6) +
      `<ellipse cx="20" cy="57" rx="4" ry="2.4" fill="${C.pink}" opacity=".6"/>` +
      tone(C.moon2, circle(30, 24, 2.6) + circle(30, 78, 2.4)),
  )
}

function star(): Art {
  const p = (r1: number, r2: number): Pt[] => Array.from({ length: 10 }, (_, i) => {
    const a = ((-90 + i * 36) * Math.PI) / 180
    const r = i % 2 ? r2 : r1
    return [50 + r * Math.cos(a), 54 + r * Math.sin(a)] as Pt
  })
  return art(100, 100, cut(C.star, poly(p(46, 21), 61, 2.4)) + tone(C.star2, poly(p(20, 9), 62, 1.2)))
}

function sparkle(): Art {
  const four = (cx: number, cy: number, r: number, w: number): Pt[] => [
    [cx, cy - r], [cx + w, cy - w], [cx + r, cy], [cx + w, cy + w], [cx, cy + r], [cx - w, cy + w], [cx - r, cy], [cx - w, cy - w],
  ]
  return art(100, 100, cut(C.star, poly(four(46, 54, 42, 9), 71, 2)) + tone(C.star2, poly(four(46, 54, 18, 4), 72, 1)) + cut(C.star, poly(four(84, 16, 13, 3.5), 73, 1)))
}

function cloud(): Art {
  const back = blob(36, 30, 18, 15, 81) + blob(62, 24, 22, 19, 82) + blob(84, 36, 14, 12, 83) + blob(56, 40, 40, 12, 84, 0, 0.03, 12)
  const front = blob(22, 44, 15, 11, 85) + blob(44, 36, 18, 15, 86) + blob(68, 42, 16, 12, 87) + blob(48, 50, 38, 9, 88, 0, 0.03, 12)
  return art(110, 64, blobs(C.cloud2, back) + blobs(C.cloud, front))
}

function heart(): Art {
  const p: Pt[] = Array.from({ length: 18 }, (_, i) => {
    const t = (i / 18) * Math.PI * 2
    return [50 + 2.7 * 16 * Math.sin(t) ** 3, 46 - 2.7 * (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t))] as Pt
  })
  const small = p.map(([x, y]) => [50 + (x - 50) * 0.52, 40 + (y - 46) * 0.52] as Pt)
  return art(100, 92, cut(C.pink, smooth(p)) + tone(C.pink2, smooth(small)))
}

// ---------- treats ----------
function carrot(): Art {
  const body: Pt[] = [[34, 34], [50, 27], [66, 34], [63, 54], [57, 76], [51, 97], [46, 78], [38, 56]]
  const leaves = blob(41, 17, 5, 13, 91, -28) + blob(51, 12, 5.4, 14, 92) + blob(61, 17, 5, 13, 93, 28)
  const g =
    blobs(C.leaf, leaves) +
    cut(C.carrot, smooth(body)) +
    line(C.carrot2, 'M40 44l8 1M55 54l7-1M43 64l7 1M50 80l5-1', 2.6)
  return art(100, 100, `<g transform="rotate(-22 50 52)">${g}</g>`)
}

function mooncake(): Art {
  const scallop: Pt[] = Array.from({ length: 28 }, (_, i) => {
    const a = (i / 28) * Math.PI * 2
    const r = i % 2 ? 41 : 46
    return [50 + r * Math.cos(a), 50 + r * Math.sin(a)] as Pt
  })
  const petal = (deg: number) => smooth(rot([[50, 50], [56, 38], [50, 24], [44, 38]], 50, 50, deg))
  return art(
    100,
    100,
    cut(C.cake, smooth(scallop)) +
      cut(C.cake2, blob(50, 50, 33, 33, 101, 0, 0.025, 12), 2.6) +
      tone(C.cake3, [0, 90, 180, 270].map(petal).join('') + circle(50, 50, 5)) +
      tone(C.cake3, [45, 135, 225, 315].map(a => circle(50 + 22 * Math.cos((a * Math.PI) / 180), 50 + 22 * Math.sin((a * Math.PI) / 180), 2.6)).join('')),
  )
}

function lantern(): Art {
  const ribs = line(C.rib, 'M50 24V74M39 26Q30 49 39 72M61 26Q70 49 61 72', 2.4)
  return art(
    100,
    100,
    line(C.ink, 'M50 2V14', 3) +
      cut(C.gold, poly([[40, 13], [60, 13], [61, 22], [39, 22]], 111, 0.6)) +
      cut(C.red, blob(50, 49, 31, 27, 112, 0, 0.03, 12)) +
      tone(C.red2, blob(50, 49, 15, 22, 113)) +
      ribs +
      cut(C.gold, poly([[41, 75], [59, 75], [58, 82], [42, 82]], 114, 0.6)) +
      line(C.ink, 'M45.5 84V97M50 84V99M54.5 84V97', 6) + line(C.gold, 'M45.5 84V97M50 84V99M54.5 84V97', 2.4),
  )
}

// ---------- ground ----------
function tree(): Art {
  return art(
    100,
    112,
    cut(C.bark, poly([[45, 70], [55, 70], [57, 112], [43, 112]], 121, 1)) +
      cut('#5f9a8c', blob(50, 80, 36, 15, 122, 0, 0.04, 12)) +
      cut('#78b3a2', blob(50, 60, 30, 15, 123, 0, 0.04, 12)) +
      cut('#93c9b4', blob(50, 40, 23, 14, 124)) +
      cut('#b2dcc8', blob(50, 22, 14, 11, 125)) +
      tone(C.star, circle(30, 82, 2.6) + circle(66, 78, 2.6) + circle(42, 62, 2.4) + circle(62, 56, 2.2) + circle(50, 36, 2.2) + circle(52, 10, 3)),
  )
}

function grass(): Art {
  const blade = (x: number, w: number, tx: number, ty: number): Pt[] => [[x, 70], [x + w * 0.2 + (tx - x) * 0.4, (70 + ty) / 2], [tx, ty], [x + w * 0.8 + (tx - x) * 0.45, (70 + ty) / 2 + 4], [x + w, 70]]
  const back = poly(blade(18, 16, 14, 20), 131, 1) + poly(blade(40, 16, 46, 6), 132, 1) + poly(blade(62, 16, 80, 18), 133, 1)
  const front = poly(blade(28, 16, 26, 28), 134, 1) + poly(blade(50, 16, 60, 24), 135, 1) + poly(blade(8, 14, 2, 40), 136, 1) + poly(blade(76, 14, 94, 38), 137, 1)
  return art(100, 70, blobs(C.leaf2, back, 3.6) + blobs(C.leaf, front, 3.6))
}

function flower(): Art {
  const petals = [0, 72, 144, 216, 288].map((a, i) => {
    const r = (a * Math.PI) / 180
    return blob(50 + 11 * Math.cos(r - Math.PI / 2), 36 + 11 * Math.sin(r - Math.PI / 2), 9.5, 7.5, 141 + i, a + 90)
  })
  return art(
    100,
    100,
    line(C.ink, 'M50 98Q48 72 50 44', 10) + line(C.leaf2, 'M50 98Q48 72 50 44', 3.6) +
      blobs(C.leaf, blob(38, 80, 11, 4.8, 147, -35) + blob(62, 70, 11, 4.8, 148, 35)) +
      blobs(C.pink, petals.join('')) +
      cut(C.star, blob(50, 36, 6.5, 6.5, 149)),
  )
}

function osmanthus(): Art {
  const bloom = (cx: number, cy: number, s: number) =>
    [0, 90, 180, 270].map(a => circle(cx + 3.4 * s * Math.cos((a * Math.PI) / 180), cy + 3.4 * s * Math.sin((a * Math.PI) / 180), 3.3 * s)).join('')
  const spots: [number, number, number][] = [[30, 30, 1.1], [46, 20, 1], [62, 32, 1.15], [74, 18, 0.95], [52, 44, 1], [36, 50, 0.9], [68, 50, 0.9]]
  return art(
    100,
    90,
    line(C.ink, 'M50 88Q48 64 54 44M51 64Q40 52 32 44M53 54Q64 46 70 34', 8) + line(C.bark, 'M50 90Q48 64 54 44M51 64Q40 52 32 44M53 54Q64 46 70 34', 3.4) +
      blobs(C.leaf, blob(26, 58, 12, 5, 151, -30) + blob(76, 60, 12, 5, 152, 30) + blob(84, 34, 10, 4.4, 153, -50) + blob(16, 36, 10, 4.4, 154, 50)) +
      blobs(C.osm, spots.map(([x, y, s]) => bloom(x, y, s)).join('')) +
      spots.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.6" fill="${C.osm2}"/>`).join(''),
  )
}

const SPRITES: Record<string, Art> = {
  head: headArt(),
  moon: moon(),
  star: star(),
  sparkle: sparkle(),
  cloud: cloud(),
  heart: heart(),
  carrot: carrot(),
  mooncake: mooncake(),
  lantern: lantern(),
  tree: tree(),
  grass: grass(),
  flower: flower(),
  osmanthus: osmanthus(),
}

// ---------- the hills: three layers of paper, back to front, in strip units ----------
const hill = (top: Pt[]) => `${smooth(top, false)}L410 1004L-10 1004Z`
const BACK_HILL = hill([[-10, 880], [60, 858], [140, 874], [210, 852], [290, 868], [360, 846], [410, 858]])
const MID_HILL = hill([[-10, 936], [50, 921], [120, 907], [190, 913], [250, 917], [300, 911], [350, 901], [410, 909]])
const FRONT_HILL = hill([[-10, 968], [70, 955], [150, 969], [230, 960], [320, 973], [410, 958]])
const HILL_STYLE =
  '<style>.pr-h1{fill:#f8dcc8}.pr-h3{fill:#e9ad8f}@media (prefers-color-scheme: dark){.pr-h1{fill:#33336b}.pr-h3{fill:#5d59a3}}</style>'
const SH = (d: string, op = 0.16) => `<path d="${d}" fill="#2b2350" fill-opacity="${op}" transform="translate(3 5)"/>`
// the back hill and the shadow the middle hill (the ground) casts on it
const BACK = `<path class="pr-h1" d="${BACK_HILL}"/>` + SH(MID_HILL)
// the big pale moon behind the bunny, two paper discs and a halo
const BIG_MOON =
  `<circle cx="236" cy="610" r="128" fill="#fff6dc" opacity=".35"/>` +
  `<circle cx="239" cy="614" r="98" fill="#2b2350" fill-opacity=".14"/>` +
  `<path fill="#fff3d2" d="${blob(236, 610, 98, 98, 161, 0, 0.012, 16)}"/>` +
  `<path fill="#ffe9b0" opacity=".7" d="${blob(206, 580, 18, 14, 162) + blob(268, 640, 24, 18, 163) + blob(250, 566, 10, 8, 164) + blob(206, 652, 11, 9, 165)}"/>`

export const PAPER_RABBIT_SPEC: SkinSpec = {
  id: 'paper-rabbit',
  name: { zh: '剪纸月兔', en: 'Paper moon rabbit' },
  mascot: { zh: '小兔', en: 'bunny' },
  blurb: {
    zh: 'Q 版贴纸风：一层层剪纸山坡上坐着大眼睛长耳朵小白兔，头顶一轮大月亮，飘着星星、灯笼、胡萝卜和月饼',
    en: 'Chibi sticker style: a big-eyed, long-eared white bunny on layered paper hills under a big pale moon, with stars, lanterns, carrots and mooncakes drifting by',
  },
  aliases: ['兔', '小兔', '兔子', 'rabbit', 'bunny', 'paper-rabbit'],
  alt: { awake: { zh: '月亮下纸山坡上的剪纸小兔', en: 'A paper-cut bunny on paper hills under the moon' }, asleep: { zh: '小兔团成一团睡着了', en: 'The bunny curled up asleep' } },
  sprites: { ...SPRITES, head: topOf(T0, 0.62) },
  frames: { idle: [T0, T1], sleep: [T2, T2b] },
  idleSteps: [[0, 3.2], [1, 0.18], [0, 2.6], [1, 0.18], [0, 0.4], [1, 0.18], [0, 2]],
  sleepSteps: [[0, 1.8], [1, 1.8]],
  mascotHeight: 168,
  mascotAt: { x: 285, y: 914 },
  world: {
    bg: '#fdf0e3',
    ground: '#f2c3a6',
    hatch: '#f3d9c4',
    darkBg: '#22224a',
    darkGround: '#46458a',
    pattern: 'dots',
    groundPath: MID_HILL,
    groundDetail: SH(FRONT_HILL, 0.2) + `<path class="pr-h3" d="${FRONT_HILL}"/>`,
    leftBack: HILL_STYLE + BACK,
    rightBack: BIG_MOON + BACK,
    sky: [{ sprite: 'cloud', y: 130, k: 0.95 }],
    leftAir: [['star', 200, 230, 0.32], ['moon', 100, 350, 0.6], ['lantern', 270, 470, 0.5], ['carrot', 110, 610, 0.45], ['sparkle', 240, 720, 0.3]],
    leftGround: [['tree', 80, 934, 0.95], ['grass', 210, 930, 0.42], ['flower', 320, 924, 0.42]],
    rightAir: [['sparkle', 340, 300, 0.28], ['lantern', 100, 360, 0.45], ['star', 360, 440, 0.3], ['mooncake', 80, 560, 0.42], ['heart', 120, 720, 0.32]],
    rightGround: [['osmanthus', 150, 934, 0.5], ['grass', 50, 940, 0.4]],
  },
  burst: ['star', 'heart', 'carrot', 'sparkle', 'moon', 'heart', 'star', 'mooncake'],
  pops: ['heart', 'star', 'carrot', 'sparkle', 'mooncake'],
  heart: 'heart',
  snore: '#8c7ad6',
  icons: { mascot: 'head', think: 'sparkle', token: 'carrot', agents: 'lantern', coin: 'mooncake' },
  drink: '#f6c77a',
  ink: '#3b2f4f',
  paper: '#fffaf2',
  accent: '#8c7ad6',
  userStickers: ['carrot', 'heart', 'moon', 'star'],
  reply: 'mooncake',
  stickerAlt: { zh: '剪纸小贴纸', en: 'Paper-cut sticker' },
  replyAlt: { zh: '月饼贴纸', en: 'Mooncake sticker' },
  garden: { flower: 'flower', bush: 'grass', landmark: 'tree', bloom: 'osmanthus', ink: '#5d4a8a' },
  colors: {
    accent: '#8c7ad6',
    heading: '#6c5bb8',
    surface: ['#fdf5ee', '#fffaf5', '#fffdfb'],
    text: ['#3a3350', '#5a5270', '#7a7290'],
    darkSurface: ['#1d1d40', '#25254c', '#2c2c57', '#353563'],
    darkText: ['#f1effb', '#cfcbe8', '#a9a4c8'],
    user: ['#fde4d8', '#efb196'],
    user2: ['#ece7fb', '#a99be0'],
    assistantBorder: '#f0ddd0',
  },
  emoji: { title: '🐰🌕', mascot: '🐰', context: '🍵', token: '🥕', agents: '🏮' },
  cheers: {
    praise: { zh: ['小兔被夸得耳朵都竖起来啦～', '小兔害羞地揉揉脸蛋'], en: ['The bunny’s ears shoot straight up~', 'The bunny rubs its blushing cheeks'] },
    commit: { zh: ['提交成功！小兔送你一根胡萝卜 🥕', '月亮又亮了一点点！'], en: ['Committed! The bunny brings you a carrot 🥕', 'The moon glows a little brighter!'] },
    tests: { zh: ['测试全绿！小兔在山坡上蹦蹦跳', '全部通过，月亮都在笑～'], en: ['All green! The bunny hops on the hill', 'Everything passes, even the moon smiles~'] },
    yay: { zh: ['耶！小兔抱着月饼转圈圈', '今天也很棒，月亮看见啦！'], en: ['Yay! The bunny spins with a mooncake', 'Great work today, the moon saw it!'] },
  },
}

export const PAPER_RABBIT = makeSkin(PAPER_RABBIT_SPEC)
