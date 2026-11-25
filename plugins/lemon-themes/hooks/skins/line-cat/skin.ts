// Line-art cat: a calm little cat drawn in one dark ink line, with soft flat colour shapes set slightly
// off the lines (peach, sage, mustard), like a risograph print. Every sprite is hand-written SVG in its
// own box; kit/factory.ts builds the scene and the rest. Sprites have no dark mode, so each ink line
// carries a thin off-white halo underneath and still reads on the charcoal background.

import { makeSkin } from '../kit/factory'
import type { Art, Frame, SkinSpec } from '../kit/factory'

const INK = '#2b2b2b'
const HALO = '#fbf7ef'
const SW = 3 // main line
const FW = 2.3 // face and fine detail

// the colour shapes
const C = {
  peach: '#f6c9a8',
  sage: '#bcd1b0',
  mustard: '#e8b84a',
  blush: '#f2b1a6',
  sky: '#bcd6e2',
  cream: '#f3e6cf',
}

const ROUND = 'fill="none" stroke-linecap="round" stroke-linejoin="round"'

type Dot = [number, number, number]

/** Colour shapes first, then the ink line over a halo of off-white. */
function draw(w: number, h: number, blobs: string, lines: string[], fine: string[] = [], dots: Dot[] = []): Art {
  const L = lines.join('')
  const F = fine.join('')
  const halo =
    `<g ${ROUND} stroke="${HALO}">` +
    `<path stroke-width="${SW + 3.5}" d="${L}"/>` +
    (F === '' ? '' : `<path stroke-width="${FW + 3.5}" d="${F}"/>`) +
    `</g>` +
    dots.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r + 2}" fill="${HALO}"/>`).join('')
  const ink =
    `<g ${ROUND} stroke="${INK}">` +
    `<path stroke-width="${SW}" d="${L}"/>` +
    (F === '' ? '' : `<path stroke-width="${FW}" d="${F}"/>`) +
    `</g>` +
    dots.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${INK}"/>`).join('')
  return { w, h, body: blobs + halo + ink }
}
const fill = (color: string, d: string, o = 1) => `<path d="${d}" fill="${color}"${o < 1 ? ` opacity="${o}"` : ''}/>`
const disc = (color: string, x: number, y: number, r: number, o = 1) =>
  `<circle cx="${x}" cy="${y}" r="${r}" fill="${color}"${o < 1 ? ` opacity="${o}"` : ''}/>`

// ---------- the cat (100 x 108, floor at y 104) ----------
const CW = 100
const CH = 108
const HEAD = 'M36 40C31 33 32 25 35 20L37 7L47 16Q50 15.5 53 16L63 7L65 20C68 25 69 33 64 40C59 47 41 47 36 40Z'
const BODY = [
  HEAD,
  'M40 46C33 58 33 80 37 104H52', // chest to the front paws
  'M52 104C51 92 52 82 55 72', // inner foreleg
  'M63 45C77 52 87 72 85 90C84 100 77 104 67 104H54', // back round to the haunch
  'M67 104C62 93 66 81 76 77', // thigh
]
const WHISKERS = 'M33 33L23 31M33 37L23 38M67 33L77 31M67 37L77 38'
const NOSE = 'M48 35.5L50 37.5L52 35.5M50 37.5Q48.5 40.5 46 39.5M50 37.5Q51.5 40.5 54 39.5'
const TAIL_DOWN = 'M84 99C94 102 98 94 96 86C95 80 89 80 89 85'
const TAIL_UP = 'M84 96C97 91 99 72 93 61C90 55 83 57 85 63'
const CAT_BLOBS =
  fill(C.peach, 'M48 66C56 54 80 56 90 70C98 82 96 102 82 106C68 110 46 106 42 92C39 82 42 74 48 66Z') +
  disc(C.sage, 37, 19, 14) +
  disc(C.mustard, 84, 38, 5.5)

const sit = (eyes: 'open' | 'shut' | 'side', tail: string): Frame => {
  const eyeLines = eyes === 'shut' ? ['M41 29.5Q44 32 47 29.5M53 29.5Q56 32 59 29.5'] : []
  const eyeDots: Dot[] = eyes === 'open' ? [[44, 29.5, 2.3], [56, 29.5, 2.3]] : eyes === 'side' ? [[46, 29, 2.3], [58, 29, 2.3]] : []
  return draw(CW, CH, CAT_BLOBS, [...BODY, tail], [WHISKERS, NOSE, ...eyeLines], eyeDots)
}

// curled up asleep: one loop of body, the tail drawn round the front, head tucked in on the left
const curl = (breath: number): Frame => {
  const b = breath
  return draw(
    CW,
    CH,
    fill(C.peach, `M30 ${80 - b}C50 ${68 - b} 80 ${68 - b} 92 84C100 98 92 108 76 108H26C14 106 14 90 30 ${80 - b}Z`) +
      disc(C.sage, 22, 74, 11) +
      disc(C.mustard, 80, 50, 5.5),
    [
      `M18 104C10 98 9 86 14 79L15 66L25 73Q31 71 36 72L44 64L46 76C58 ${69 - b} 76 ${67 - b} 87 ${78 - b}C96 ${88 - b * 0.5} 95 101 86 104H18`,
      'M86 103C76 94 60 92 50 96C44 99 44 104 49 102',
    ],
    ['M19 86Q22 88.5 25 86M31 86Q34 88.5 37 86', 'M26.5 91L28 92.5L29.5 91'],
  )
}

// ---------- props (each in a 100 x 100 box) ----------
const SPRITES: Record<string, Art> = {
  head: draw(
    100,
    70,
    disc(C.sage, 34, 26, 20) + disc(C.mustard, 82, 18, 6),
    ['M24 52C17 43 18 32 22 25L25 6L39 18Q50 16 61 18L75 6L78 25C82 32 83 43 76 52C68 63 32 63 24 52Z'],
    ['M44 43.5L50 47.5L56 43.5M50 47.5Q47 52 43 50.5M50 47.5Q53 52 57 50.5', 'M19 40L6 37M19 46L6 48M81 40L94 37M81 46L94 48'],
    [[40, 35, 3.2], [60, 35, 3.2]],
  ),
  plant: draw(
    100,
    100,
    disc(C.sage, 52, 34, 24) + fill(C.peach, 'M36 68H74L69 98H42Z'),
    [
      'M28 64H72',
      'M32 64L37 96H63L68 64',
      'M50 64C50 50 48 38 50 22',
      'M50 46C40 45 30 37 29 26C40 27 48 35 50 46Z',
      'M50 36C59 32 67 23 70 12C60 14 52 23 50 36Z',
      'M50 56C60 55 70 49 75 40C64 39 54 45 50 56Z',
    ],
  ),
  cup: draw(
    100,
    100,
    disc(C.peach, 54, 66, 24) + disc(C.mustard, 30, 28, 5),
    [
      'M26 46H66V62C66 77 58 86 46 86C34 86 26 77 26 62Z',
      'M66 52C79 51 80 67 66 69',
      'M16 92H78',
    ],
    ['M38 38C32 30 44 25 38 15', 'M52 38C46 30 58 25 52 16'],
  ),
  yarn: draw(
    100,
    100,
    disc(C.blush, 56, 58, 28),
    [
      'M50 22C66 22 78 34 78 50C78 66 66 78 50 78C34 78 22 66 22 50C22 34 34 22 50 22Z',
      'M78 70C84 80 88 90 96 90',
    ],
    ['M30 34C44 42 52 60 48 77', 'M42 23C58 32 70 50 68 72', 'M23 56C38 52 58 60 72 72'],
  ),
  book: draw(
    100,
    100,
    fill(C.sky, 'M20 34C34 28 46 30 56 36L56 86C44 80 30 80 20 84Z') + disc(C.mustard, 80, 24, 6),
    ['M50 30C40 24 24 24 12 28V78C24 74 40 74 50 80C60 74 76 74 88 78V28C76 24 60 24 50 30Z', 'M50 30V80'],
    ['M20 40C28 38 36 38 42 41M20 50C28 48 36 48 42 51M58 41C64 38 72 38 80 40M58 51C64 48 72 48 80 50'],
  ),
  fish: draw(
    100,
    100,
    fill(C.sky, 'M22 56C34 40 60 40 74 56C60 72 34 72 22 56Z') + disc(C.mustard, 86, 30, 5),
    ['M16 50C28 32 56 30 70 50C56 70 28 68 16 50Z', 'M70 50L88 37C84 45 84 55 88 63Z'],
    ['M42 39C46 45 46 55 42 61'],
    [[30, 47, 2.6]],
  ),
  sprig: draw(
    100,
    100,
    disc(C.sage, 46, 54, 24) + disc(C.mustard, 54, 14, 6),
    [
      'M50 98C47 78 52 56 50 26',
      'M50 76C40 76 32 70 30 62C40 61 48 66 50 76Z',
      'M50 62C60 62 68 56 70 48C60 47 52 52 50 62Z',
      'M50 46C41 46 35 40 34 33C43 33 49 38 50 46Z',
    ],
  ),
  bloom: draw(
    100,
    100,
    disc(C.blush, 54, 40, 22) + disc(C.sage, 36, 84, 9),
    [
      'M50 98C50 80 49 66 50 52',
      'M50 80C42 80 36 76 34 70C42 69 48 73 50 80Z',
      'M50 40C40 34 38 18 50 16C62 18 60 34 50 40C56 30 72 30 72 42C70 52 56 48 50 40C56 50 50 64 40 60C32 54 42 44 50 40C40 46 28 40 30 30C34 20 46 30 50 40Z',
    ],
    [],
    [[50, 40, 3.2]],
  ),
  bush: draw(
    100,
    100,
    fill(C.sage, 'M20 86C12 72 22 58 34 62C34 46 54 40 62 52C70 42 90 48 86 64C96 68 94 88 84 90Z') + disc(C.mustard, 72, 30, 5),
    ['M14 82C8 68 18 54 30 58C30 42 50 36 58 48C66 36 88 42 84 60C94 62 94 82 84 84Z', 'M8 94H92'],
    ['M44 84C46 74 52 68 58 66'],
  ),
  sun: draw(
    100,
    100,
    disc(C.mustard, 55, 55, 21),
    ['M50 32C60 32 68 40 68 50C68 60 60 68 50 68C40 68 32 60 32 50C32 40 40 32 50 32Z'],
    ['M50 10V20M50 80V90M10 50H20M80 50H90M22 22L29 29M71 71L78 78M78 22L71 29M29 71L22 78'],
  ),
  heart: draw(
    100,
    100,
    fill(C.blush, 'M55 86C35 70 23 58 23 44C23 32 33 26 41 26C49 26 53 32 55 38C57 32 61 26 69 26C77 26 87 32 87 44C87 58 75 70 55 86Z'),
    ['M50 80C30 64 18 52 18 38C18 26 28 20 36 20C44 20 48 26 50 32C52 26 56 20 64 20C72 20 82 26 82 38C82 52 70 64 50 80Z'],
  ),
  sparkle: draw(
    100,
    100,
    fill(C.mustard, 'M55 20C58 44 64 50 88 54C64 58 58 64 55 88C52 64 46 58 22 54C46 50 52 44 55 20Z'),
    ['M50 14C53 40 60 47 86 50C60 53 53 60 50 86C47 60 40 53 14 50C40 47 47 40 50 14Z'],
  ),
  plane: draw(
    100,
    100,
    fill(C.sky, 'M18 58L90 30L68 86L52 64Z') + disc(C.peach, 22, 26, 7),
    ['M12 52L88 22L64 82L48 58Z', 'M88 22L48 58V78L58 68'],
    ['M10 84C18 80 24 84 32 80'],
  ),
  cloud: draw(
    100,
    70,
    fill(C.cream, 'M24 60C12 60 12 44 26 44C26 30 46 26 52 38C58 26 80 30 78 46C90 46 92 60 80 60Z'),
    ['M20 54C8 54 8 38 22 38C22 24 42 20 48 32C54 20 76 24 74 40C86 40 88 54 76 54Z'],
  ),
}

// soft ground: a pale blob, with one ink line drawn across it and a few dots
const GROUND = 'M0 1004V952C60 930 140 942 210 934C290 926 350 938 400 948V1004Z'
const DETAIL =
  `<path d="M24 960C110 948 190 956 260 950C310 946 350 952 378 958" fill="none" stroke="#9a8f80" stroke-width="3" stroke-linecap="round" opacity=".7"/>` +
  `<circle cx="70" cy="980" r="5" fill="${C.mustard}" opacity=".8"/><circle cx="330" cy="984" r="4" fill="${C.sage}"/><circle cx="200" cy="990" r="3" fill="#9a8f80" opacity=".6"/>`
const BACK = (a: number, b: number) =>
  `<circle cx="${a}" cy="230" r="96" fill="${C.peach}" opacity=".32"/>` +
  `<path d="M${b - 80} 640C${b - 60} 580 ${b + 40} 570 ${b + 70} 620C${b + 100} 680 ${b + 20} 730 ${b - 40} 710C${b - 90} 694 ${b - 96} 668 ${b - 80} 640Z" fill="${C.sage}" opacity=".26"/>`

export const LINE_CAT_SPEC: SkinSpec = {
  id: 'line-cat',
  name: { zh: '线条小猫', en: 'Line-art cat' },
  mascot: { zh: '小猫', en: 'cat' },
  blurb: {
    zh: '极简线条：一笔墨线画的小猫，身后衬着蜜桃、鼠尾草绿和芥末黄的色块，安静又透气',
    en: 'Minimal line art: a cat drawn in one ink line over soft peach, sage and mustard shapes, calm and airy',
  },
  aliases: ['线条猫', '线条', 'line', 'line-cat', 'lineart'],
  alt: { awake: { zh: '一笔画成的线条小猫', en: 'A cat drawn in a single ink line' }, asleep: { zh: '线条小猫团成一圈睡着了', en: 'The line-art cat curled up asleep' } },
  sprites: SPRITES,
  frames: {
    idle: [sit('open', TAIL_DOWN), sit('shut', TAIL_DOWN), sit('side', TAIL_UP)],
    sleep: [curl(0), curl(2.5)],
  },
  idleSteps: [[0, 3.2], [1, 0.18], [0, 2], [2, 1.6], [0, 2.4], [1, 0.18], [0, 1.6]],
  sleepSteps: [[0, 2], [1, 2]],
  mascotHeight: 170,
  mascotAt: { x: 285, y: 948 },
  world: {
    bg: '#f7f2e9',
    ground: '#ece2d0',
    hatch: '#ebe2d3',
    darkBg: '#21201e',
    darkGround: '#2d2b28',
    pattern: 'dots',
    groundPath: GROUND,
    groundDetail: DETAIL,
    leftBack: BACK(300, 110),
    rightBack: BACK(110, 300),
    sky: [{ sprite: 'cloud', y: 130, k: 0.9 }],
    leftAir: [['sun', 300, 230, 0.55], ['fish', 110, 360, 0.5], ['plane', 250, 480, 0.5], ['yarn', 110, 620, 0.42], ['sparkle', 240, 730, 0.3]],
    leftGround: [['plant', 90, 948, 0.8], ['cup', 220, 944, 0.42], ['sprig', 330, 950, 0.45]],
    rightAir: [['sparkle', 250, 250, 0.3], ['heart', 330, 360, 0.35], ['book', 240, 470, 0.5], ['fish', 330, 590, 0.42], ['sun', 250, 700, 0.3]],
    rightGround: [['plant', 130, 944, 0.62], ['sprig', 50, 950, 0.4]],
  },
  burst: ['heart', 'sparkle', 'fish', 'yarn', 'sun', 'heart', 'plane', 'sprig'],
  pops: ['heart', 'sparkle', 'fish', 'sun', 'yarn'],
  heart: 'heart',
  snore: '#8a8075',
  icons: { mascot: 'head', think: 'sparkle', token: 'yarn', agents: 'plane', coin: 'fish' },
  drink: '#c9a27a',
  ink: INK,
  paper: '#fffdf8',
  accent: '#c9744f',
  userStickers: ['heart', 'fish', 'sparkle', 'cup'],
  reply: 'yarn',
  stickerAlt: { zh: '线条小贴纸', en: 'Line-art sticker' },
  replyAlt: { zh: '毛线团贴纸', en: 'Yarn ball sticker' },
  garden: { flower: 'sprig', bush: 'bush', landmark: 'plant', bloom: 'bloom', ink: '#6f6658' },
  colors: {
    accent: '#c9744f',
    heading: '#a95d3c',
    surface: ['#f7f2e9', '#faf6ef', '#fffdf8'],
    text: ['#2b2b2b', '#4a4640', '#6e685f'],
    darkSurface: ['#21201e', '#282725', '#2f2e2b', '#373532'],
    darkText: ['#f2ede4', '#cfc8bc', '#a59e92'],
    user: ['#fbe3d2', '#e8b08e'],
    user2: ['#e3ecdc', '#a9c29b'],
    assistantBorder: '#e6ddcf',
  },
  emoji: { title: '🐈🌿', mascot: '🐈', context: '☕', token: '🧶', agents: '✈️' },
  cheers: {
    praise: { zh: ['小猫眯起眼睛，轻轻呼噜了一声', '尾巴慢慢绕了个圈'], en: ['The cat narrows its eyes and purrs softly', 'Its tail draws a slow little circle'] },
    commit: { zh: ['提交好了，小猫在旁边安静地陪着', '又一笔，落得很稳'], en: ['Committed. The cat sits quietly beside you', 'Another line, drawn steady'] },
    tests: { zh: ['测试全绿，小猫伸了个长长的懒腰', '都通过了，喝口咖啡吧'], en: ['All green. The cat stretches, long and slow', 'Everything passes. Time for a sip of coffee'] },
    yay: { zh: ['小猫轻轻跳了一下，又坐好了', '今天也画得很好看'], en: ['The cat gives one small hop, then settles again', 'A lovely day of work'] },
  },
}

export const LINE_CAT = makeSkin(LINE_CAT_SPEC)
