// Peeking sticker cat: a bold black-and-white cat leaning out from behind a vertical edge, as if it
// were peeking into the conversation. Thick solid outlines, black patches, big round eyes with white
// highlights, an ω mouth. Props share the look: bold outline, flat fills (peach, sage, mustard).
// Every sprite is hand-written SVG; each shape sits on a white sticker edge, so it reads on dark mode.

import { makeSkin } from '../kit/factory'
import type { Art, Frame, SkinSpec } from '../kit/factory'

const INK = '#1f1f1f'
const EDGE = '#ffffff'
const LW = 7 // outline
const FW = 4 // face and fine detail

const C = {
  peach: '#f6c3a0',
  sage: '#b6cfa6',
  mustard: '#efbf47',
  blush: '#f3a99c',
  sky: '#b5d3e3',
  white: '#ffffff',
}

const ROUND = 'stroke-linecap="round" stroke-linejoin="round"'

type Shape = [d: string, fill: string]
type Dot = [x: number, y: number, r: number, fill?: string]
type Layer = { shapes?: Shape[]; lines?: string[]; fine?: string[]; dots?: Dot[]; at?: string }

/** One sticker layer: a white edge under everything, then outlined fills, lines and dots. */
function layer({ shapes = [], lines = [], fine = [], dots = [], at }: Layer): string {
  const S = shapes.map(s => s[0]).join('')
  const L = lines.join('')
  const F = fine.join('')
  const edge =
    (S === '' ? '' : `<path d="${S}" fill="${EDGE}" stroke="${EDGE}" stroke-width="${LW + 7}" ${ROUND}/>`) +
    (L === '' ? '' : `<path d="${L}" fill="none" stroke="${EDGE}" stroke-width="${LW + 7}" ${ROUND}/>`) +
    (F === '' ? '' : `<path d="${F}" fill="none" stroke="${EDGE}" stroke-width="${FW + 6}" ${ROUND}/>`)
  const ink =
    `<g stroke="${INK}" ${ROUND}>` +
    shapes.map(([d, f]) => `<path d="${d}" fill="${f}" stroke-width="${LW}"/>`).join('') +
    (L === '' ? '' : `<path d="${L}" fill="none" stroke-width="${LW}"/>`) +
    (F === '' ? '' : `<path d="${F}" fill="none" stroke-width="${FW}"/>`) +
    `</g>` +
    dots.map(([x, y, r, f]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${f ?? INK}"/>`).join('')
  const body = edge + ink
  return at === undefined ? body : `<g transform="${at}">${body}</g>`
}
const art = (w: number, h: number, ...layers: Layer[]): Art => ({ w, h, body: layers.map(layer).join('') })

// ---------- the cat (104 x 140, floor at y 136, the edge it peeks from at x 12) ----------
const CW = 104
const CH = 140
const BAR: Layer = { lines: ['M12 4V136'] }
const PAW = (y: number): Layer => ({
  shapes: [[`M18 ${y}C6 ${y - 2} 0 ${y + 8} 0 ${y + 16}C0 ${y + 26} 10 ${y + 30} 20 ${y + 28}C30 ${y + 26} 32 ${y + 14} 28 ${y + 7}C25 ${y + 2} 22 ${y} 18 ${y}Z`, C.white]],
  fine: [`M10 ${y + 4}V${y + 10}M18 ${y + 3}V${y + 9}`],
})
const BODY: Layer = {
  shapes: [
    ['M12 84C30 92 50 92 62 86C80 92 88 112 82 136H12Z', C.white],
    ['M70 132C84 138 98 132 99 118C100 108 92 104 88 110C93 114 91 124 82 124C76 124 72 128 70 132Z', INK],
  ],
  fine: ['M42 136C42 122 52 114 62 116'],
}
// head outline runs from the edge, round the ears, back to the edge
const HEAD = 'M12 30L20 6L38 20C48 17 58 18 66 22L88 14L86 40C92 54 90 70 80 80C68 90 36 92 12 86'
const PATCH_L = 'M12 30L20 6L38 20C34 28 28 34 20 38C16 40 13 40 12 40Z'
const PATCH_R = 'M66 22L88 14L86 40C88 50 86 58 82 64C78 54 72 44 68 36C66 30 66 26 66 22Z'
const EAR_IN = 'M23 13L31 19L24 23ZM76 22L84 20L83 31Z'
type Eyes = 'open' | 'shut'
const head = (eyes: Eyes, at?: string): Layer[] => [
  { shapes: [[HEAD, C.white]], at },
  {
    shapes: [[PATCH_L, INK], [PATCH_R, INK], [EAR_IN, C.white]],
    fine: [
      'M41 62L47 62L44 65Z',
      'M36 67Q40 72 44 67Q48 72 52 67',
      'M82 74L93 79M79 81L86 90',
      ...(eyes === 'shut' ? ['M23 55Q30 60 37 55M51 57Q58 62 65 57'] : []),
    ],
    dots: eyes === 'open' ? [[30, 54, 8.5], [58, 56, 8.5], [33, 51, 3.2, C.white], [61, 53, 3.2, C.white]] : [],
    at,
  },
]
const peek = (eyes: Eyes, tilt = 0, pawY = 98): Frame => {
  const at = tilt === 0 ? undefined : `rotate(${tilt} 40 100)`
  return art(CW, CH, BODY, ...head(eyes, at), BAR, PAW(pawY))
}

// curled up asleep beside the edge, eyes shut, tail wrapped round the front
const curl = (b: number): Frame =>
  art(
    CW,
    CH,
    {
      shapes: [
        [`M18 136C14 110 34 ${92 - b} 62 ${92 - b}C86 ${92 - b} 102 108 98 126C97 133 92 136 86 136Z`, C.white],
      ],
    },
    {
      shapes: [
        ['M18 114C16 100 22 92 26 89L27 74L40 84C46 82 52 82 56 84L69 76L67 92C71 100 69 114 60 121C49 129 24 128 18 114Z', C.white],
        ['M26 89L27 74L40 84C37 87 33 89 29 91Z', INK],
        ['M56 84L69 76L67 92C62 92 58 88 56 84Z', INK],
      ],
      fine: ['M26 106Q31 110 36 106M46 107Q51 111 56 107', 'M38 113Q41 117 44 113Q47 117 50 113'],
      at: 'translate(18 132) scale(.8) translate(-18 -132)',
    },
    { shapes: [['M62 132C76 136 92 132 94 122C94 116 88 114 86 118C88 124 82 128 72 128C66 128 62 130 62 132Z', INK]] },
    BAR,
  )

// ---------- props (each in a 100 x 100 box) ----------
const SPRITES: Record<string, Art> = {
  head: art(
    100,
    92,
    {
      shapes: [['M8 30L18 6L38 22C50 20 60 22 70 28L95 25L90 52C96 68 92 86 78 94C62 102 30 104 14 94C2 84 2 50 8 30Z', C.white]],
    },
    {
      shapes: [
        ['M8 30L18 6L38 22C34 32 28 40 20 46C14 50 8 52 6 52C4 44 6 36 8 30Z', INK],
        ['M70 28L95 25L90 52C93 64 92 76 86 84C80 74 78 60 72 48C70 40 70 34 70 28Z', INK],
        ['M20 17L29 23L21 27ZM79 32L88 31L86 43Z', C.white],
      ],
      fine: ['M40 71L46 71L43 74Z', 'M35 76Q39 81 43 76Q47 81 51 76'],
      dots: [[28, 62, 9.5], [58, 65, 9.5], [31.5, 58.5, 3.6, C.white], [61.5, 61.5, 3.6, C.white]],
    },
  ),
  plant: art(
    100,
    100,
    { shapes: [['M50 64C46 48 32 44 18 46C22 60 36 66 50 64Z', C.sage], ['M50 58C54 40 68 32 84 32C80 50 66 58 50 58Z', C.sage], ['M50 50C42 36 44 20 52 8C60 22 58 38 50 50Z', C.sage]] },
    { shapes: [['M26 64H74L68 96H32Z', C.peach]], lines: ['M24 64H76'] },
  ),
  cup: art(
    100,
    100,
    { lines: ['M68 52C82 50 84 70 68 72'] },
    { shapes: [['M24 44H70V62C70 78 60 88 47 88C34 88 24 78 24 62Z', C.white], ['M30 50H64V60C64 70 58 76 47 76C36 76 30 70 30 60Z', C.peach]], lines: ['M14 94H82'] },
    { fine: ['M38 32C32 24 44 20 38 10', 'M54 32C48 24 60 20 54 10'] },
  ),
  yarn: art(
    100,
    100,
    { lines: ['M74 74C80 84 86 92 96 90'] },
    { shapes: [['M50 20C67 20 80 33 80 50C80 67 67 80 50 80C33 80 20 67 20 50C20 33 33 20 50 20Z', C.blush]], fine: ['M30 32C44 40 54 58 48 78', 'M42 21C58 30 70 48 68 72', 'M21 56C36 52 58 60 72 72'] },
  ),
  book: art(
    100,
    100,
    { shapes: [['M50 30C40 24 24 24 10 28V80C24 76 40 76 50 82C60 76 76 76 90 80V28C76 24 60 24 50 30Z', C.white], ['M50 30C40 24 24 24 10 28V80C24 76 40 76 50 82Z', C.mustard]], lines: ['M50 30V82'] },
    { fine: ['M60 42C66 40 74 40 80 42M60 54C66 52 74 52 80 54'] },
  ),
  fish: art(
    100,
    100,
    { shapes: [['M70 50L90 34C86 44 86 56 90 66Z', C.sky], ['M12 50C26 30 56 28 72 50C56 72 26 70 12 50Z', C.sky]], fine: ['M42 38C47 44 47 56 42 62'], dots: [[28, 47, 4.5]] },
  ),
  sprig: art(
    100,
    100,
    { lines: ['M50 98C46 78 52 56 50 24'] },
    { shapes: [['M50 78C38 78 28 70 26 60C38 58 48 66 50 78Z', C.sage], ['M50 60C62 60 72 52 74 42C62 40 52 48 50 60Z', C.sage], ['M50 40C42 34 40 22 46 12C54 20 56 32 50 40Z', C.sage]] },
  ),
  bloom: art(
    100,
    100,
    { lines: ['M50 98V60'] },
    {
      shapes: [
        ['M50 40C40 30 40 12 50 10C60 12 60 30 50 40C60 30 78 32 76 44C74 54 58 50 50 40C58 50 54 66 44 64C34 60 42 46 50 40C40 46 24 42 26 30C30 20 44 28 50 40Z', C.white],
        ['M50 32C55 32 58 36 58 40C58 45 55 48 50 48C45 48 42 45 42 40C42 36 45 32 50 32Z', C.mustard],
      ],
    },
  ),
  bush: art(100, 100, { shapes: [['M16 88C6 74 16 56 30 60C30 42 52 36 60 50C68 38 92 44 88 62C98 66 98 88 86 88Z', C.sage]], fine: ['M46 86C48 76 54 70 60 68'] }),
  sun: art(
    100,
    100,
    { fine: ['M50 6V16M50 84V94M6 50H16M84 50H94M19 19L26 26M74 74L81 81M81 19L74 26M26 74L19 81'] },
    { shapes: [['M50 28C62 28 72 38 72 50C72 62 62 72 50 72C38 72 28 62 28 50C28 38 38 28 50 28Z', C.mustard]] },
  ),
  heart: art(100, 100, {
    shapes: [['M50 84C28 68 14 54 14 38C14 25 25 18 34 18C42 18 47 24 50 30C53 24 58 18 66 18C75 18 86 25 86 38C86 54 72 68 50 84Z', C.blush]],
    dots: [[32, 34, 4.5, C.white]],
  }),
  sparkle: art(100, 100, { shapes: [['M50 10C54 38 62 46 90 50C62 54 54 62 50 90C46 62 38 54 10 50C38 46 46 38 50 10Z', C.mustard]] }),
  plane: art(100, 100, { shapes: [['M10 52L90 20L64 84L48 60Z', C.white], ['M90 20L48 60V80L58 70Z', C.sky]] }),
  cloud: art(100, 64, { shapes: [['M22 54C8 54 8 34 24 34C24 18 46 12 52 28C60 14 84 20 80 38C94 38 96 54 82 54Z', C.white]] }),
}

// soft ground: a pale blob, with one ink line drawn across it and a few dots
const GROUND = 'M0 1004V952C60 930 140 942 210 934C290 926 350 938 400 948V1004Z'
const DETAIL =
  `<path d="M24 960C110 948 190 956 260 950C310 946 350 952 378 958" fill="none" stroke="#1f1f1f" stroke-width="4" stroke-linecap="round" opacity=".7"/>` +
  `<circle cx="70" cy="980" r="5" fill="${C.mustard}" opacity=".8"/><circle cx="330" cy="984" r="4" fill="${C.sage}"/><circle cx="200" cy="990" r="3" fill="#9a8f80" opacity=".6"/>`
const BACK = (a: number, b: number) =>
  `<circle cx="${a}" cy="230" r="96" fill="${C.peach}" opacity=".32"/>` +
  `<path d="M${b - 80} 640C${b - 60} 580 ${b + 40} 570 ${b + 70} 620C${b + 100} 680 ${b + 20} 730 ${b - 40} 710C${b - 90} 694 ${b - 96} 668 ${b - 80} 640Z" fill="${C.sage}" opacity=".26"/>`


import { FRAMES as TRACED } from './traced/frames'

// the mascot is traced from the Codex sheet in art-src (tools/build_theme.py): [0] calm, [1] blink,
// [2] asleep; asleep breathes by rising a little on the second frame
const T = TRACED.all ?? []
const T0 = T[0]!
const T1 = T[1]!
const T2 = T[2]!
const T2b = { ...T2, dy: T2.dy - 1.5 }
const topOf = (f: typeof T0, part: number) => ({ w: f.w, h: Math.round(f.h * part), body: f.body })


export const LINE_CAT_SPEC: SkinSpec = {
  id: 'line-cat',
  name: { zh: '小黑猫', en: 'Little black cat' },
  mascot: { zh: '小猫', en: 'cat' },
  blurb: {
    zh: '圆润的小黑猫剪影：白圈大眼睛、爱心小鼻子，道具配蜜桃、鼠尾草绿和芥末黄',
    en: 'A smooth little black cat silhouette with white-ring eyes and a heart nose, with peach, sage and mustard props',
  },
  aliases: ['黑猫', '小黑猫', '线条猫', 'black', 'line-cat'],
  alt: { awake: { zh: '圆眼睛的小黑猫坐着看你', en: 'A little black cat with round eyes sitting and watching you' }, asleep: { zh: '小黑猫闭着眼睛打盹', en: 'The little black cat dozing with its eyes shut' } },
  // the band's head icon: the black cat's head (its box crops the body away)
  sprites: { ...SPRITES, catHead: topOf(T0, 0.6) },
  frames: { idle: [T0, T1], sleep: [T2, T2b] },
  idleSteps: [[0, 3.2], [1, 0.18], [0, 2.6], [1, 0.18], [0, 0.4], [1, 0.18], [0, 2]],
  sleepSteps: [[0, 2], [1, 2]],
  mascotHeight: 175,
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
  snore: '#1f1f1f',
  icons: { mascot: 'catHead', think: 'sparkle', token: 'yarn', agents: 'plane', coin: 'fish' },
  drink: '#c9a27a',
  ink: INK,
  paper: '#fffdf8',
  accent: '#c9744f',
  userStickers: ['heart', 'fish', 'sparkle', 'cup'],
  reply: 'yarn',
  stickerAlt: { zh: '黑白小贴纸', en: 'Bold sticker' },
  replyAlt: { zh: '毛线团贴纸', en: 'Yarn ball sticker' },
  garden: { flower: 'sprig', bush: 'bush', landmark: 'plant', bloom: 'bloom', ink: '#1f1f1f' },
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
