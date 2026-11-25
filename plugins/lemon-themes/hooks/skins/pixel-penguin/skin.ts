// Ice pixel penguin: a round navy-and-white penguin in a red scarf standing on an ice floe, snowflakes,
// fish and ice crystals drifting by, an igloo and snowy pines on the ice. Every sprite is a character
// grid drawn here and turned into vector art by kit/pixel.ts (one unit per pixel); kit/factory.ts
// builds the scene and the rest.

import { makeSkin } from '../kit/factory'
import type { Art, Frame, SkinSpec } from '../kit/factory'
import { pixels, sticker } from '../kit/pixel'

// one palette for the whole skin, so every sprite shares its colours
const P = {
  K: '#18213a', // outline
  N: '#34497a', // navy back
  n: '#5670a8', // navy highlight
  M: '#24325a', // flipper
  W: '#ffffff', // white belly
  w: '#dbe8f5', // belly shade
  E: '#141a2e', // eyes
  O: '#f59a3c', // orange beak and feet
  o: '#d9742a', // dark orange
  P: '#f7a8b8', // cheeks
  R: '#e0505a', // red scarf
  r: '#b0384a', // dark red
  I: '#eef8ff', // snow / ice white
  i: '#c2dcef', // snow shade
  B: '#8fcdee', // ice blue
  b: '#4f8fbf', // deep ice blue
  Y: '#ffd84d', // yellow
  y: '#f2b632', // dark yellow
  G: '#4f9a7a', // pine green
  g: '#2f6f5a', // dark pine
  T: '#8a5a3c', // trunk
  D: '#2f3f6b', // igloo door
  C: '#ffffff', // cloud white
  c: '#dfe8f2', // cloud shade
}

const put = (row: string, x: number, s: string) => row.slice(0, x) + s + row.slice(x + s.length)

// ---------- the penguin (one round head-body egg, 1-px outline, flippers out at the sides) ----------
const HEAD = [
  '........KKKKKKKK........',
  '......KKNNNNNNNNKK......',
  '.....KNnnNNNNNNNNNK.....',
  '....KNnNNNNNNNNNNNNK....',
  '...KNNNWWWWNNWWWWNNNK...',
  '...KNNWWWWWWWWWWWWNNK...',
  '...KNNWWWEWWWWEWWWNNK...',
  '...KNNWWWEWWWWEWWWNNK...',
  '...KNNWPWWWOOWWWPWNNK...',
  '...KNNWWWWWooWWWWWNNK...',
  '...KRRRRRRRRRRRRRRRRK...',
]
const FEET = ['....KOOOOOKKKKOOOOOK....', '....KKKKKKK..KKKKKKK....']
const SIT = [
  ...HEAD,
  '..KKNNRrWWWWWWWWWWNNKK..',
  '.KMKNRRWWWWWWWWWWWWNKMK.',
  '.KMKNrrWWWWWWWWWWWWNKMK.',
  'KMMKNWWWWWWWWWWWWWWNKMMK',
  'KMKKNWWWWWWWWWWWWWWNKKMK',
  'KK.KNWWWWWWWWWWWWWWNK.KK',
  '...KNNWWWWWWWWWWWWNNK...',
  '...KNNNwwwwwwwwwwNNNK...',
  '....KNNNNNNNNNNNNNNK....',
  ...FEET,
]
// eyes shut: the 2-px eyes become short flat lines
const shut = (row: string, y: number) => (y === 6 ? row.replace(/E/g, 'W') : y === 7 ? put(put(row.replace(/E/g, 'W'), 8, 'EE'), 14, 'EE') : row)
const BLINK = SIT.map(shut)
// a hello: the right flipper waves up and out
const RAISE: Record<number, string> = { 9: '.KK', 10: 'KMK', 11: 'MMK', 12: 'MK.', 13: 'K..', 14: '...', 15: '...', 16: '...' }
const WAVE = SIT.map((row, y) => (RAISE[y] === undefined ? row : put(row, 21, RAISE[y]!)))
// tucked in asleep: flippers folded, a little lower and rounder, eyes shut
const SLEEP_HEAD = HEAD.map(shut)
const EMPTY = '........................'
const SLEEP_BODY = [
  '...KNMWWWWWWWWWWWWMNK...',
  '...KNMWWWWWWWWWWWWMNK...',
  '...KNNMwwwwwwwwwwMNNK...',
  '....KNNNNNNNNNNNNNNK....',
]
const SLEEP_A = [...Array(5).fill(EMPTY), ...SLEEP_HEAD, ...SLEEP_BODY, ...FEET]
// breathing in: one row taller
const SLEEP_B = [...Array(4).fill(EMPTY), ...SLEEP_HEAD, SLEEP_BODY[0]!, ...SLEEP_BODY, ...FEET]

const frame = (grid: string[]): Frame => pixels(grid, P)

// ---------- stickers (white sticker edge added) ----------
const art = (grid: string[]): Art => sticker(grid, P)
const SPRITES: Record<string, Art> = {
  head: art(HEAD.map(r => r.slice(2, 22))),
  snowflake: art([
    '....b....',
    '.b..b..b.',
    '..b.b.b..',
    '...bBb...',
    'bbbBIBbbb',
    '...bBb...',
    '..b.b.b..',
    '.b..b..b.',
    '....b....',
  ]),
  fish: art(['..BBBB...b', '.BBBBBB.bb', 'BEBBBBBBBb', 'BBBBBBBBBb', '.bbbbbb.bb', '..bbbb...b']),
  igloo: art([
    '....bbbbbb....',
    '..bbIIIIIIbb..',
    '.bIIIiIIIIiIb.',
    '.biiiiiiiiiib.',
    'bIIiIIbbIIiIIb',
    'bIiIIbDDbIIiIb',
    'biiibDDDDbiiib',
    'bIIIbDDDDbIIIb',
    'bbbbbbbbbbbbbb',
  ]),
  crystal: art(['...b...', '..bIb..', '.bIBBb.', 'bIBBBBb', 'bIBBBbb', 'bIBBBbb', 'bIBBBbb', '.bBBbb.', '..bbb..', '...b...']),
  pine: art([
    '....I....',
    '...III...',
    '...GGg...',
    '..IIIGg..',
    '..GGGGg..',
    '.IIIIGGg.',
    '.GGGGGGg.',
    'IIIIIIGGg',
    'GGGGGGGGg',
    '....T....',
    '....T....',
  ]),
  snowman: art([
    '...KKK...',
    '..KKKKK..',
    '..IIIIi..',
    '.IIEIEIi.',
    '.IIIOOIi.',
    '..IIIIi..',
    '.RRRRRrR.',
    '.IIIIIIi.',
    'IIIIEIIii',
    'IIIIIIIii',
    'IIIIEIIii',
    '.IIIIIii.',
  ]),
  snowball: art(['..bbb..', '.bIIib.', 'bIIIIib', 'bIIIiib', 'biiiiBb', '.bBBBb.', '..bbb..']),
  star: art(['...Y...', '...Y...', '..YYY..', 'YYYYYYY', '.YYYYY.', '.YY.YY.', 'Y.....Y']),
  heart: art(['.RR.RR.', 'RRRRRRR', 'RRRRRRR', '.RRRRR.', '..RRR..', '...R...']),
  sparkle: art(['...Y...', '...Y...', '..YYY..', 'YYYYYYY', '..YYY..', '...Y...', '...Y...']),
  cloud: art(['...CCC.....', '..CCCCC.CC.', '.CCCCCCCCCC', 'CCCCCCCCCCC', 'ccccccccccc']),
  scarf: art(['RRRRRRRR', 'rRRRRRRr', '....RRr.', '....RRr.', '....rRr.', '....r.r.']),
}

// the ice floe along the bottom of each strip, in strip units (a pixel-y stair outline)
const FLOE = 'M0 1004 V944 H30 V932 H70 V920 H330 V932 H370 V944 H400 V1004Z'
const ICE =
  // a bright rim on the top step, a few shine dashes and blue cracks
  `<path d="M70 920 H330 V928 H70Z" fill="#f4fbff" opacity=".85"/>` +
  [[40, 962], [120, 952], [220, 966], [310, 950], [360, 975], [160, 985]].map(([x, y]) => `<path d="M${x} ${y} h26" stroke="#ffffff" stroke-width="5" opacity=".7"/>`).join('') +
  `<path d="M96 942 l10 8 l-4 10 l12 8 M262 948 l-8 9 l10 6 l-6 10" fill="none" stroke="#6fb0d8" stroke-width="4" opacity=".5"/>`

export const PIXEL_PENGUIN_SPEC: SkinSpec = {
  id: 'pixel-penguin',
  name: { zh: '冰面像素企鹅', en: 'Ice pixel penguin' },
  mascot: { zh: '小企鹅', en: 'penguin' },
  blurb: {
    zh: '像素风：围着红围巾的圆滚滚小企鹅站在冰面上挥鳍，雪花、小鱼和冰晶飘过，旁边有冰屋和雪松',
    en: 'Pixel art: a round penguin in a red scarf waving on an ice floe, with snowflakes, fish and ice crystals drifting by',
  },
  aliases: ['企鹅', '小企鹅', 'penguin', 'pixel-penguin'],
  alt: { awake: { zh: '冰面上的像素小企鹅', en: 'A pixel penguin on an ice floe' }, asleep: { zh: '小企鹅缩成一团睡着了', en: 'The penguin tucked in asleep' } },
  crisp: true,
  sprites: SPRITES,
  frames: { idle: [frame(SIT), frame(BLINK), frame(WAVE)], sleep: [frame(SLEEP_A), frame(SLEEP_B)] },
  idleSteps: [[0, 3], [1, 0.16], [0, 1.6], [2, 0.45], [0, 0.35], [2, 0.45], [0, 2.4], [1, 0.16], [0, 1.4]],
  mascotHeight: 150,
  mascotAt: { x: 285, y: 924 },
  world: {
    bg: '#e8f4fc',
    ground: '#cfe8f6',
    hatch: '#ffffff',
    darkBg: '#0f1a2e',
    darkGround: '#2a4a6b',
    pattern: 'dots',
    groundPath: FLOE,
    groundDetail: ICE,
    sky: [{ sprite: 'cloud', y: 120, k: 0.95 }],
    leftAir: [['snowflake', 190, 230, 0.4], ['fish', 90, 340, 0.6], ['star', 230, 450, 0.4], ['crystal', 110, 600, 0.4], ['sparkle', 220, 700, 0.3]],
    leftGround: [['igloo', 120, 924, 0.95], ['pine', 262, 924, 0.62], ['snowman', 350, 936, 0.42]],
    rightAir: [['snowflake', 250, 240, 0.45], ['star', 340, 340, 0.35], ['heart', 240, 450, 0.4], ['fish', 330, 560, 0.5], ['snowflake', 250, 660, 0.3]],
    rightGround: [['pine', 120, 924, 0.55], ['snowball', 50, 942, 0.22]],
  },
  burst: ['snowflake', 'heart', 'fish', 'star', 'sparkle', 'snowball', 'heart', 'crystal'],
  pops: ['heart', 'snowflake', 'fish', 'star', 'sparkle'],
  heart: 'heart',
  snore: '#4f8fbf',
  icons: { mascot: 'head', think: 'sparkle', token: 'snowflake', agents: 'snowman', coin: 'fish' },
  drink: '#9fd3f0',
  ink: '#2f3f6b',
  paper: '#f7fbff',
  accent: '#2f7fc1',
  userStickers: ['fish', 'heart', 'snowflake', 'star'],
  reply: 'fish',
  stickerAlt: { zh: '像素小贴纸', en: 'Pixel sticker' },
  replyAlt: { zh: '小鱼贴纸', en: 'Fish sticker' },
  garden: { flower: 'crystal', bush: 'pine', landmark: 'igloo', bloom: 'snowflake', ink: '#2f3f6b' },
  colors: {
    accent: '#2f7fc1',
    heading: '#2a5f9e',
    surface: ['#f3f8fc', '#f8fbfe', '#fefefe'],
    text: ['#24303f', '#45526a', '#66728a'],
    darkSurface: ['#0f1a2e', '#152238', '#1c2a44', '#233350'],
    darkText: ['#eaf2fb', '#c2cfe3', '#9dabc4'],
    user: ['#e3f2fc', '#7ec4e8'],
    user2: ['#fff1e0', '#f59a3c'],
    assistantBorder: '#d3e4f1',
  },
  emoji: { title: '🐧🧊', mascot: '🐧', context: '🥛', token: '❄️', agents: '⛄' },
  cheers: {
    praise: { zh: ['小企鹅被夸得拍拍小翅膀～', '围巾都飘起来了！'], en: ['The penguin flaps its little flippers~', 'Its scarf is fluttering!'] },
    commit: { zh: ['提交成功！小企鹅叼来一条小鱼 🐟', '又在冰面上站稳了一步！'], en: ['Committed! The penguin brings you a fish 🐟', 'Another steady step on the ice!'] },
    tests: { zh: ['测试全绿！小企鹅在冰上滑了一圈', '全部通过，嘎嘎～'], en: ['All green! The penguin slides a lap on the ice', 'Everything passes, honk honk~'] },
    yay: { zh: ['耶！小企鹅在冰面上摇摇摆摆转圈圈', '今天也很棒！'], en: ['Yay! The penguin waddles in a happy circle', 'Great work today!'] },
  },
}

export const PIXEL_PENGUIN = makeSkin(PIXEL_PENGUIN_SPEC)
