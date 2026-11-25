// Pixel kitten on the rooftop: a white cat sitting on red roof tiles, stars and a moon drifting by,
// fish and yarn floating. Every sprite is a character grid drawn here and turned into vector art by
// kit/pixel.ts (one unit per pixel); kit/factory.ts builds the scene and the rest.

import { makeSkin } from '../kit/factory'
import type { Art, Frame, SkinSpec } from '../kit/factory'
import { pixels, sticker } from '../kit/pixel'
import { FRAMES, PAL } from './mascot'

// the mascot is copied cell by cell from the Codex sheet in art-src (tools/pixel_from_png.py);
// sleeping breathes by standing one row taller
const MF = (grid: string[]) => pixels(grid, PAL)
const breathe = (grid: string[]) => [grid[0]!, ...grid]

// one palette for the whole skin, so every sprite shares its colours
const P = {
  K: '#4a2f25', // outline
  O: '#f2a65a', // orange fur
  D: '#d9823b', // tabby stripes
  W: '#ffffff', // white fur
  P: '#f4a6b8', // pink
  E: '#2b1d18', // nose
  N: '#4cc3f5', // eye blue
  Y: '#ffd84d', // yellow
  y: '#f2b632', // dark yellow
  B: '#7ec4e8', // blue
  b: '#4f8fbf', // dark blue
  G: '#7cc46a', // green
  g: '#4c9a45', // dark green
  R: '#e0664f', // red
  r: '#b8473a', // dark red
  T: '#c98a5a', // terracotta pot
  C: '#ffffff', // cloud white
  c: '#dfe8f2', // cloud shade
  L: '#c7b7f0', // lilac
}

// ---------- the kitten (after Ciki's reference: a big square head with ears on its corners,
// whiskers poking out past the head, a narrow body and a tail curling up behind) ----------
const SIT = [
  '...KK...KK......',
  '..KPPKKKPPK.....',
  '..KPWWWWWPK.....',
  '..KWWWWWWWK.....',
  '..KWNWWWNWK.....',
  'KKKWKWKWKWKKK...',
  '..KWWWWWWWK.....',
  'KKKWWWWWWWKKK...',
  '...KKWWWKKK..KK.',
  '....KWWWWK..KWWK',
  '....KWWWWWK.KWWK',
  '....KWWWWWWKWWK.',
  '....KWKWKWWWWK..',
  '....KKKKKKKKKK..',
]
// eyes shut for a blink: only the black under each eye is left
const BLINK = SIT.map((row, y) => (y === 4 ? row.replace(/N/g, 'W') : row))
// the whiskers twitch up a pixel
const FLICK = SIT.map((row, y) =>
  y === 4 ? 'KK' + row.slice(2, 11) + 'KK' + row.slice(13) : y === 5 ? '..' + row.slice(2, 11) + '..' + row.slice(13) : y === 6 ? 'KK' + row.slice(2, 11) + 'KK' + row.slice(13) : y === 7 ? '..' + row.slice(2, 11) + '..' + row.slice(13) : row,
)
// asleep: lying down, eyes shut, tail along its side
const SLEEP_A = [
  '................',
  '................',
  '................',
  '................',
  '................',
  '................',
  '...KK...KK......',
  '..KPPKKKPPKKKKK.',
  '..KWWWWWWWKWWWWK',
  'KKKWKWKWKWKWWWWK',
  '..KWWWWWWWWWWWWK',
  'KKKWWWWWWWWKKKWK',
  '..KWWWWWWWWWWWWK',
  '...KKKKKKKKKKKK.',
]
// breathing in: the back rises one pixel
const SLEEP_B = [...SLEEP_A.slice(1, 9), SLEEP_A[8]!, ...SLEEP_A.slice(9)]

const frame = (grid: string[]): Frame => pixels(grid, P)

// ---------- stickers (white sticker edge added) ----------
const art = (grid: string[]): Art => sticker(grid, P)
const SPRITES: Record<string, Art> = {
  head: art(SIT.slice(0, 8)),
  star: art(['...Y...', '...Y...', '..YYY..', 'YYYYYYY', '.YYYYY.', '.YY.YY.', 'Y.....Y']),
  moon: art(['..YYY...', '.YYy....', 'YYy.....', 'YYy.....', 'YYy.....', 'YYYy....', '.YYYy..Y', '..YYYYY.']),
  cloud: art(['...CCC.....', '..CCCCC.CC.', '.CCCCCCCCCC', 'CCCCCCCCCCC', 'ccccccccccc']),
  fish: art(['..BBBB...B', '.BBBBBB.BB', 'BEBBBBBBBB', 'BBBBBBBBBB', '.bbbbbb.bb', '..bbbb...b']),
  yarn: art(['..LLLL..', '.LLLLLL.', 'LLKLLKLL', 'LLLKKLLL', 'LLKLLKLL', '.LLLLLL.', '..LLLLK.', '......KK']),
  heart: art(['.RR.RR.', 'RRRRRRR', 'RRRRRRR', '.RRRRR.', '..RRR..', '...R...']),
  sparkle: art(['...Y...', '...Y...', '..YYY..', 'YYYYYYY', '..YYY..', '...Y...', '...Y...']),
  paw: art(['.O.O.O.', '.O.O.O.', '.......', '..OOO..', '.OOOOO.', '.OOOOO.']),
  pot: art(['..R.R..', '.RYRYR.', '..RRR..', '...G...', '.GGGGG.', 'TTTTTTT', '.TTTTT.', '.TTTTT.']),
  sprout: art(['..G.G..', '.GGgGG.', '..GgG..', '...g...', '...g...']),
  chimney: art(['.KKKKKK.', '.KrrrrK.', 'KKKKKKKK', 'KRRrRRRK', 'KRRRrRRK', 'KrRRRRrK', 'KRRRrRRK', 'KRrRRRRK']),
  bird: art(['..bbb...', '.bbbbbY.', 'bbbbbb..', '.bBBb...', '..b.b...']),
}

// red roof tiles along the bottom of each strip, in strip units (a pixel-y stair outline)
const ROOF = 'M0 1004 V930 H40 V922 H80 V914 H120 V906 H280 V914 H320 V922 H360 V930 H400 V1004Z'
const TILES = Array.from({ length: 9 }, (_, i) => `<path d="M${10 + i * 44} ${960} h30" stroke="#b8473a" stroke-width="5" opacity=".5"/>`).join('') +
  Array.from({ length: 8 }, (_, i) => `<path d="M${32 + i * 44} ${985} h30" stroke="#b8473a" stroke-width="5" opacity=".5"/>`).join('')

export const PIXEL_CAT_SPEC: SkinSpec = {
  id: 'pixel-cat',
  name: { zh: '屋顶像素猫', en: 'Rooftop pixel cat' },
  mascot: { zh: '小猫', en: 'kitten' },
  blurb: { zh: '像素风：坐在红瓦屋顶上的小白猫，耳朵会动，飘着星星、小鱼和毛线团', en: 'Pixel art: a little white cat twitching its ears on a red-tiled roof, with stars, fish and yarn drifting by' },
  aliases: ['小猫', '像素猫', '屋顶', 'cat', 'kitten', 'pixel'],
  alt: { awake: { zh: '红瓦屋顶上的像素小猫', en: 'A pixel kitten on a red-tiled roof' }, asleep: { zh: '小猫团成一团睡着了', en: 'The kitten curled up asleep' } },
  crisp: true,
  // the band's head icon: the top of the copied mascot
  sprites: { ...SPRITES, head: pixels(FRAMES[0]!.slice(0, Math.round(FRAMES[0]!.length * 0.62)), PAL) },
  frames: { idle: [MF(FRAMES[0]!), MF(FRAMES[1]!)], sleep: [MF(FRAMES[2]!), MF(breathe(FRAMES[2]!))] },
  idleSteps: [[0, 3.2], [1, 0.18], [0, 2.6], [1, 0.18], [0, 0.4], [1, 0.18], [0, 2]],
  mascotHeight: 170,
  mascotAt: { x: 285, y: 912 },
  world: {
    bg: '#eaf4fb',
    ground: '#e0664f',
    hatch: '#d3e6f3',
    darkBg: '#141a2e',
    darkGround: '#7a3329',
    pattern: 'dots',
    groundPath: ROOF,
    groundDetail: TILES,
    sky: [{ sprite: 'cloud', y: 120, k: 0.95 }],
    leftAir: [['star', 190, 230, 0.4], ['fish', 90, 340, 0.6], ['moon', 230, 450, 0.55], ['yarn', 110, 600, 0.45], ['sparkle', 220, 700, 0.3]],
    leftGround: [['chimney', 80, 922, 0.85], ['pot', 220, 912, 0.55], ['sprout', 330, 918, 0.4]],
    rightAir: [['bird', 250, 240, 0.55], ['star', 340, 340, 0.35], ['heart', 240, 450, 0.4], ['fish', 330, 560, 0.5], ['sparkle', 250, 650, 0.3]],
    rightGround: [['pot', 140, 918, 0.5], ['sprout', 60, 926, 0.35]],
  },
  burst: ['star', 'heart', 'fish', 'sparkle', 'paw', 'heart', 'star', 'yarn'],
  pops: ['heart', 'star', 'paw', 'fish', 'sparkle'],
  heart: 'heart',
  snore: '#b8473a',
  icons: { mascot: 'head', think: 'sparkle', token: 'yarn', agents: 'bird', coin: 'fish' },
  drink: '#9fd3f0',
  ink: '#4a2f25',
  paper: '#fffaf0',
  accent: '#e0664f',
  userStickers: ['paw', 'heart', 'fish', 'star'],
  reply: 'yarn',
  stickerAlt: { zh: '像素小贴纸', en: 'Pixel sticker' },
  replyAlt: { zh: '毛线团贴纸', en: 'Yarn ball sticker' },
  garden: { flower: 'pot', bush: 'sprout', landmark: 'chimney', bloom: 'sparkle', ink: '#7a3329' },
  colors: {
    accent: '#e0664f',
    heading: '#c2553f',
    surface: ['#f4f8fb', '#f9fbfd', '#fefefe'],
    text: ['#2e2a33', '#4b4652', '#6a6472'],
    darkSurface: ['#141a2e', '#1b2238', '#222a42', '#29324c'],
    darkText: ['#eef1f8', '#c6cbe0', '#a1a7c0'],
    user: ['#ffe7e0', '#f4a6b8'],
    user2: ['#dff0fb', '#7ec4e8'],
    assistantBorder: '#d6e3ee',
  },
  emoji: { title: '🐱🏠', mascot: '🐱', context: '🥛', token: '🧶', agents: '🐦' },
  cheers: {
    praise: { zh: ['小猫被夸得呼噜呼噜～', '尾巴翘起来了！'], en: ['The kitten purrs at the praise~', 'Tail straight up!'] },
    commit: { zh: ['提交成功！小猫叼来一条小鱼 🐟', '又踩稳了一片瓦！'], en: ['Committed! The kitten brings you a fish 🐟', 'Another tile, firmly in place!'] },
    tests: { zh: ['测试全绿！小猫伸了个懒腰', '全部通过，喵～'], en: ['All green! The kitten stretches', 'Everything passes, meow~'] },
    yay: { zh: ['耶！小猫在屋顶上转圈圈', '今天也很棒！'], en: ['Yay! The kitten spins on the roof', 'Great work today!'] },
  },
}

export const PIXEL_CAT = makeSkin(PIXEL_CAT_SPEC)
