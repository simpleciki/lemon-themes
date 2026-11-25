// Forest pixel fox: a little orange fox (cream chest, dark paws, bushy white-tipped tail) sitting on
// a mossy forest floor, with mushrooms, fireflies, falling leaves, acorns and a pine tree around it.
// Every sprite is a character grid drawn here and turned into vector art by kit/pixel.ts (one unit
// per pixel); kit/factory.ts builds the scene and the rest.

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
  K: '#3b2a22', // outline
  O: '#ee8a3c', // orange fur
  o: '#c9652b', // dark orange
  W: '#fff4e2', // cream fur
  w: '#ecd9bd', // cream shade
  N: '#4a3028', // dark paws, ear backs
  E: '#24160f', // eyes, nose
  P: '#f4a8b0', // pink
  R: '#e0503f', // mushroom red
  r: '#ad3328', // dark red
  C: '#ffffff', // white
  Y: '#ffd451', // yellow
  y: '#e9a531', // dark yellow
  L: '#fff7b0', // firefly glow
  G: '#7fb05a', // green
  g: '#4c7f3b', // dark green
  T: '#8a5a3a', // bark
  t: '#62402a', // dark bark
  A: '#d9a05b', // acorn
  a: '#b07a3c', // acorn shade
  B: '#c8365e', // berry
  b: '#8f2346', // dark berry
  c: '#cfe3f0', // firefly wings
}

// ---------- the fox (big square head, pointed ears on its corners, narrow body, tail curling up) ----------
const SIT = [
  '...KK............KK.........',
  '...KWK..........KWK.........',
  '...KWWK........KWWK.........',
  '...KWWOKKKKKKKKOWWK.........',
  '...KOOOOOOOOOOOOOOK.........',
  '...KOOOOOOOOOOOOOOK.........',
  '...KOOOEOOOOOOEOOOK.........',
  '...KOOOEOOOOOOEOOOK.........',
  '..KWWWWOOOEEOOOWWWWK........',
  '..KWWWWWWWWWWWWWWWWK........',
  '...KKWWWWWWWWWWWWKK.........',
  '.....KKKWWWWWWKKK...........',
  '......KOOWWWWOOK............',
  '......KOOWWWWOOK.........KK.',
  '......KOOWWWWOOK........KWWK',
  '......KOOOWWWOOOK......KWWWK',
  '......KOOOWWWWOOOK....KOWWK.',
  '......KOOOOWWWOOOOK..KOOOK..',
  '......KOOOOWWWOOOOOKKOOOK...',
  '......KNNKOOOKNNOOOOOOOOK...',
  '......KNNKOOOKNNOOOOOOKKK...',
  '.......KKKKKKKKKKKKKKK......',
]
// eyes shut for a blink
const BLINK = SIT.map((row, y) => (y === 6 ? row.replace(/E/g, 'O') : y === 7 ? row.replace(/E/g, 'K') : row))
// the right ear twitches outward
const EAR = SIT.map((row, y) => (y === 0 ? '...KK.............KK........' : y === 1 ? '...KWK.........KWWK.........' : row))
// the tail swishes down
const SWISH_ROWS: Record<number, string> = {
  13: '......KOOWWWWOOK............',
  14: '......KOOWWWWOOK.........KK.',
  15: '......KOOOWWWOOOK.......KWWK',
  16: '......KOOOWWWWOOOK....KWWWK.',
  17: '......KOOOOWWWOOOOK..KOOWK..',
}
const SWISH = SIT.map((row, y) => SWISH_ROWS[y] ?? row)

// curled up asleep: head resting, tail wrapped round the front with its white tip by the nose
const BLANK = '.'.repeat(28)
const SLEEP_A = [
  ...Array.from({ length: 8 }, () => BLANK),
  '....KK......KK..............',
  '....KWK....KWK..............',
  '....KWOKKKKOWK..............',
  '...KOOOOOOOOOOKKKKKKK.......',
  '...KOOOOOOOOOOOOOOOOOKK.....',
  '...KOKKOOOOKKOOOOOOOOOOK....',
  '..KWWWWOEEOWWWWOOOOOOOOOK...',
  '..KWWWWWWWWWWWWOOOOOOOOOK...',
  '...KWWWWWWWWWWKOOOOOOOOOOK..',
  '..KWWWKKKKKKKKOOOOOOOOOOOK..',
  '.KWWWWOOOOOOOOOOOOOOOOOOOK..',
  '.KWWWWOOOOOOOOOOOOOOOOOOK...',
  '..KWWKOOOOOOOOOOOOOOOOOK....',
  '...KKKKKKKKKKKKKKKKKKKK.....',
]
// breathing in: the back rises a pixel
const SLEEP_B = SLEEP_A.map((row, y) => (y === 10 ? '....KWOKKKKOWKKKKKKK........' : y === 11 ? '...KOOOOOOOOOOOOOOOOKK......' : row))

const frame = (grid: string[]): Frame => pixels(grid, P)

// ---------- stickers (white sticker edge added) ----------
const art = (grid: string[]): Art => sticker(grid, P)
const SPRITES: Record<string, Art> = {
  head: art(SIT.slice(0, 12).map(r => r.slice(0, 21))),
  mushroom: art([
    '...KKKK...',
    '.KKRRRRKK.',
    'KRRCCRRRRK',
    'KRRCCRRCRK',
    'KRRRRRRRRK',
    'KrrrrrrrrK',
    '.KKWWWWKK.',
    '...KWWK...',
    '...KWwK...',
    '..KWWWwK..',
    '..KKKKKK..',
  ]),
  firefly: art([
    '.KK...KK.',
    'KccK.KccK',
    '.KccKccK.',
    '...KKK...',
    '..LYYYL..',
    '.LYYYYYL.',
    '..LYYYL..',
    '...LLL...',
  ]),
  leaf: art([
    '......KK',
    '...KKKOK',
    '..KOOOoK',
    '.KOOOoOK',
    '.KOOoOOK',
    '.KOoOOK.',
    'KKoKKK..',
    'K.......',
  ]),
  maple: art([
    '....K....',
    '...KYK...',
    '.K.KYK.K.',
    'KYKYYYKYK',
    '.KYYyYYK.',
    'KYYYyYYYK',
    '.KKYyYKK.',
    '...KyK...',
    '....y....',
  ]),
  acorn: art([
    '....t...',
    '..KKtKK.',
    '.KTtTtTK',
    'KTtTtTtK',
    'KKKKKKKK',
    '.KAAAAK.',
    '.KAAAaK.',
    '.KAAAaK.',
    '..KAaK..',
    '...KK...',
  ]),
  pine: art([
    '.....K.....',
    '....KGK....',
    '...KGGgK...',
    '..KGGGGgK..',
    '...KGGgK...',
    '..KGGGGgK..',
    '.KGGGGGGgK.',
    '..KGGGGgK..',
    '.KGGGGGGgK.',
    'KGGGGGGGGgK',
    'KKKKKKKKKKK',
    '....KTK....',
    '....KTK....',
    '....KtK....',
  ]),
  fern: art([
    '....KGK....',
    '.KKKGgGKKK.',
    'KGGGKgKGGGK',
    '.KKGGgGGKK.',
    'KGGGKgKGGGK',
    '.KKGGgGGKK.',
    '..KKKgKKK..',
    '....KgK....',
    '....KKK....',
  ]),
  berries: art([
    '.....gg..',
    '....g.GG.',
    '...g..g..',
    '.KKK.KKK.',
    'KBCBKBCBK',
    'KBBBKBBBK',
    'KbBbKbBbK',
    '.KKKKKKK.',
    '..KBCBK..',
    '..KbBbK..',
    '...KKK...',
  ]),
  heart: art(['.KK.KK.', 'KRRKRRK', 'KRCRRRK', 'KRRRRRK', '.KRRRK.', '..KRK..', '...K...']),
  sparkle: art(['...Y...', '...Y...', '..YLY..', 'YYLLLYY', '..YLY..', '...Y...', '...Y...']),
  moon: art(['..YYY...', '.YYy....', 'YYy.....', 'YYy.....', 'YYy.....', 'YYYy....', '.YYYy..Y', '..YYYYY.']),
  paw: art(['.N.N.N.', '.N.N.N.', '.......', '..NNN..', '.NNNNN.', '.NNNNN.']),
}

// a mossy mound along the bottom of each strip, in strip units (a pixel-y stair outline)
const MOSS = 'M0 1004 V934 H40 V926 H90 V918 H310 V926 H360 V934 H400 V1004Z'
const TUFTS =
  Array.from({ length: 9 }, (_, i) => `<path d="M${18 + i * 44} ${952 + (i % 2) * 22}h8v-8h8v8h8" fill="none" stroke="#4c7f3b" stroke-width="5" opacity=".55"/>`).join('') +
  Array.from({ length: 6 }, (_, i) => `<rect x="${40 + i * 62}" y="${978 - (i % 2) * 14}" width="10" height="8" fill="#a0c47a" opacity=".6"/>`).join('')

export const PIXEL_FOX_SPEC: SkinSpec = {
  id: 'pixel-fox',
  name: { zh: '森林像素狐', en: 'Forest pixel fox' },
  mascot: { zh: '小狐狸', en: 'fox' },
  blurb: {
    zh: '像素风：坐在青苔上甩大尾巴的小狐狸，身边有蘑菇、萤火虫、橡果和飘落的秋叶',
    en: 'Pixel art: a little fox swishing its bushy tail on a mossy forest floor, with mushrooms, fireflies, acorns and falling leaves',
  },
  aliases: ['狐狸', '小狐狸', 'fox', 'pixel-fox'],
  alt: { awake: { zh: '森林青苔上的像素小狐狸', en: 'A pixel fox on a mossy forest floor' }, asleep: { zh: '小狐狸蜷着大尾巴睡着了', en: 'The fox curled up in its tail, asleep' } },
  crisp: true,
  // the band's head icon: the top of the copied mascot
  sprites: { ...SPRITES, head: pixels(FRAMES[0]!.slice(0, Math.round(FRAMES[0]!.length * 0.62)), PAL) },
  frames: { idle: [MF(FRAMES[0]!), MF(FRAMES[1]!)], sleep: [MF(FRAMES[2]!), MF(breathe(FRAMES[2]!))] },
  idleSteps: [[0, 3.2], [1, 0.18], [0, 2.6], [1, 0.18], [0, 0.4], [1, 0.18], [0, 2]],
  mascotHeight: 150,
  mascotAt: { x: 285, y: 920 },
  world: {
    bg: '#eef3e2',
    ground: '#7fa95a',
    hatch: '#dbe6cb',
    darkBg: '#132226',
    darkGround: '#2e4a34',
    pattern: 'dots',
    groundPath: MOSS,
    groundDetail: TUFTS,
    sky: [{ sprite: 'maple', y: 130, k: 0.4 }],
    leftAir: [['leaf', 190, 230, 0.4], ['firefly', 90, 340, 0.4], ['moon', 240, 440, 0.5], ['maple', 110, 590, 0.4], ['firefly', 230, 700, 0.35]],
    leftGround: [['pine', 80, 924, 1.1], ['mushroom', 215, 918, 0.45], ['fern', 320, 922, 0.45]],
    rightAir: [['firefly', 250, 240, 0.4], ['leaf', 340, 340, 0.38], ['sparkle', 240, 450, 0.3], ['maple', 330, 560, 0.4], ['firefly', 250, 660, 0.32]],
    rightGround: [['mushroom', 140, 922, 0.42], ['acorn', 60, 930, 0.3], ['berries', 380, 932, 0.3]],
  },
  burst: ['leaf', 'heart', 'acorn', 'sparkle', 'maple', 'heart', 'mushroom', 'paw'],
  pops: ['heart', 'leaf', 'paw', 'acorn', 'sparkle'],
  heart: 'heart',
  snore: '#c9652b',
  icons: { mascot: 'head', think: 'firefly', token: 'acorn', agents: 'mushroom', coin: 'maple' },
  drink: '#f2b46a',
  ink: '#3b2a22',
  paper: '#fffaf0',
  accent: '#e07a34',
  userStickers: ['paw', 'heart', 'acorn', 'leaf'],
  reply: 'mushroom',
  stickerAlt: { zh: '像素小贴纸', en: 'Pixel sticker' },
  replyAlt: { zh: '小蘑菇贴纸', en: 'Mushroom sticker' },
  garden: { flower: 'mushroom', bush: 'fern', landmark: 'pine', bloom: 'berries', ink: '#2e4a34' },
  colors: {
    accent: '#e07a34',
    heading: '#b65a22',
    surface: ['#f3f6ee', '#f8faf4', '#fefefd'],
    text: ['#2b2f26', '#474c40', '#666b5e'],
    darkSurface: ['#132226', '#1a2b2e', '#213437', '#283d40'],
    darkText: ['#eef3ea', '#c8d2c6', '#a3afa2'],
    user: ['#ffe3c4', '#ee8a3c'],
    user2: ['#e3efd6', '#7fb05a'],
    assistantBorder: '#d9e3cf',
  },
  emoji: { title: '🦊🌲', mascot: '🦊', context: '🍵', token: '🌰', agents: '🍄' },
  cheers: {
    praise: { zh: ['小狐狸被夸得尾巴摇成了扇子～', '耳朵竖起来了！'], en: ['The fox wags its tail like a fan~', 'Ears straight up!'] },
    commit: { zh: ['提交成功！小狐狸叼来一颗橡果 🌰', '又在森林里藏好了一颗松果！'], en: ['Committed! The fox brings you an acorn 🌰', 'Another treasure tucked away in the forest!'] },
    tests: { zh: ['测试全绿！和青苔一样绿', '全部通过，萤火虫都亮起来啦'], en: ['All green! Green as the moss', 'Everything passes, the fireflies light up'] },
    yay: { zh: ['耶！小狐狸在落叶堆里打滚', '今天也很棒！'], en: ['Yay! The fox rolls in the fallen leaves', 'Great work today!'] },
  },
}

export const PIXEL_FOX = makeSkin(PIXEL_FOX_SPEC)
