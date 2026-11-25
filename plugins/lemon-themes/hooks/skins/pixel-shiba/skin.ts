// Street-corner pixel shiba: a red-orange shiba with cream cheeks and a curled tail, sitting on a city
// sidewalk under a cherry tree, with a vending machine, a street lamp and petals drifting by. Every
// sprite is a character grid drawn here and turned into vector art by kit/pixel.ts (one unit per
// pixel); kit/factory.ts builds the scene and the rest.

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
  O: '#e8914a', // shiba fur
  D: '#c96f2e', // fur shade
  W: '#fff1d8', // cream fur
  P: '#f4a0b4', // pink
  p: '#e0738f', // dark pink
  E: '#2b1d18', // eyes
  C: '#ffffff', // white
  c: '#e2e6ee', // white shade
  Y: '#ffd84d', // yellow
  y: '#f2b632', // dark yellow
  R: '#e0564f', // red
  r: '#b33f38', // dark red
  G: '#7cc46a', // green
  g: '#4c9a45', // dark green
  N: '#9a6440', // bark
  n: '#6b4029', // dark bark
  B: '#7ec4e8', // blue
  b: '#4f8fbf', // dark blue
  S: '#a3abb8', // steel
  s: '#6c7480', // dark steel
  L: '#fff3a8', // lamp light
  A: '#2e3a52', // nori
}

// ---------- the shiba (big square head with pointed ears on its corners, cream cheeks,
// a narrower body under it and the curled tail beside it) ----------
// SIT: calm. BLINK: eyes shut. WAG: tongue out, tail lifted. SLEEP_A/B: curled up, breathing.
const SIT = [
  '...KK...............KK......',
  '...KWK.............KWK......',
  '...KWPK...........KPWK......',
  '...KWPOKKKKKKKKKKKOPWK......',
  '...KOOOOOOOOOOOOOOOOOK......',
  '...KOOOOWWOOOOOWWOOOOK......',
  '...KOOOOCEOOOOOCEOOOOK......',
  '...KOOOOEEOWWWOEEOOOOK......',
  '...KOWWWOOWWWWWOOWWWOK......',
  '..KWWWWWWWWWEWWWWWWWWWK.....',
  '..KWWPPWWWWEPEWWWWPPWWK.....',
  '...KKWWWWWWWWWWWWWWWKK......',
  '.....KKKWWWWWWWWWKKK........',
  '.......KOOWWWWWOOK.KKKK.....',
  '.......KOOWWWWWOOKKWWWWK....',
  '.......KOOWWWWWOOKWOOOOWK...',
  '.......KDOWWWWWODKWOWWOWK...',
  '.......KDOWWWWWODKWOWKOWK...',
  '.......KDOWWKWWODKWWOOOWK...',
  '.......KDOWWKWWODKKWWWWK....',
  '.......KDOWWKWWODK.KKKK.....',
  '........KKKKKKKKK...........',
]
const BLINK = [
  '...KK...............KK......',
  '...KWK.............KWK......',
  '...KWPK...........KPWK......',
  '...KWPOKKKKKKKKKKKOPWK......',
  '...KOOOOOOOOOOOOOOOOOK......',
  '...KOOOOWWOOOOOWWOOOOK......',
  '...KOOOOOOOOOOOOOOOOOK......',
  '...KOOOEEEOWWWOEEEOOOK......',
  '...KOWWWOOWWWWWOOWWWOK......',
  '..KWWWWWWWWWEWWWWWWWWWK.....',
  '..KWWPPWWWWEPEWWWWPPWWK.....',
  '...KKWWWWWWWWWWWWWWWKK......',
  '.....KKKWWWWWWWWWKKK........',
  '.......KOOWWWWWOOK.KKKK.....',
  '.......KOOWWWWWOOKKWWWWK....',
  '.......KOOWWWWWOOKWOOOOWK...',
  '.......KDOWWWWWODKWOWWOWK...',
  '.......KDOWWWWWODKWOWKOWK...',
  '.......KDOWWKWWODKWWOOOWK...',
  '.......KDOWWKWWODKKWWWWK....',
  '.......KDOWWKWWODK.KKKK.....',
  '........KKKKKKKKK...........',
]
const WAG = [
  '...KK...............KK......',
  '...KWK.............KWK......',
  '...KWPK...........KPWK......',
  '...KWPOKKKKKKKKKKKOPWK......',
  '...KOOOOOOOOOOOOOOOOOK......',
  '...KOOOOWWOOOOOWWOOOOK......',
  '...KOOOOCEOOOOOCEOOOOK......',
  '...KOOOOEEOWWWOEEOOOOK......',
  '...KOWWWOOWWWWWOOWWWOK......',
  '..KWWWWWWWWWEWWWWWWWWWK.....',
  '..KWWPPWWWWEPEWWWWPPWWK.....',
  '...KKWWWWWWWPWWWWWWWKK......',
  '.....KKKWWWWWWWWWKKKKKKK....',
  '.......KOOWWWWWOOK.KWWWWK...',
  '.......KOOWWWWWOOKKWOOOOWK..',
  '.......KOOWWWWWOOKKWOWWOWK..',
  '.......KDOWWWWWODKKWOWKOWK..',
  '.......KDOWWWWWODKKWWOOOWK..',
  '.......KDOWWKWWODK.KWWWWK...',
  '.......KDOWWKWWODK..KKKK....',
  '.......KDOWWKWWODK..........',
  '........KKKKKKKKK...........',
]
const SLEEP_A = [
  '............................',
  '............................',
  '............................',
  '............................',
  '............................',
  '............................',
  '............................',
  '............................',
  '.KK...............KK........',
  '.KWK.............KWK........',
  '.KWPK...........KPWK........',
  '.KWPOKKKKKKKKKKKOPWK........',
  '.KOOOOOOOOOOOOOOOOOKKKKKK...',
  '.KOOOOWWOOOOOWWOOOOKOOOOOK..',
  '.KOOOOOOOOOOOOOOOOOKKKKKOOK.',
  '.KOOOEEEOWWWOEEEOOOKWWWWKOK.',
  '.KOWWWOOWWWWWOOWWWOKWOOWKOK.',
  'KWWWWWWWWWEWWWWWWWWWKOKWKOK.',
  'KWWPPWWWWEWEWWWWPPWWKWWOKOK.',
  '.KKWWWWWWWWWWWWWWWKKKKKKOOK.',
  '...KKKWWWWWWWWWKKKDDDDDDDDK.',
  '.....KKKKKKKKKKKKKKKKKKKKKK.',
]
const SLEEP_B = [
  '............................',
  '............................',
  '............................',
  '............................',
  '............................',
  '............................',
  '............................',
  '............................',
  '.KK...............KK........',
  '.KWK.............KWK........',
  '.KWPK...........KPWK........',
  '.KWPOKKKKKKKKKKKOPWKKKKKK...',
  '.KOOOOOOOOOOOOOOOOOKOOOOOK..',
  '.KOOOOWWOOOOOWWOOOOKKKKKOOK.',
  '.KOOOOOOOOOOOOOOOOOKWWWWKOK.',
  '.KOOOEEEOWWWOEEEOOOKWOOWKOK.',
  '.KOWWWOOWWWWWOOWWWOKWOKWKOK.',
  'KWWWWWWWWWEWWWWWWWWWKWWOKOK.',
  'KWWPPWWWWEWEWWWWPPWWKKKKOOK.',
  '.KKWWWWWWWWWWWWWWWKKOOOOOOK.',
  '...KKKWWWWWWWWWKKKDDDDDDDDK.',
  '.....KKKKKKKKKKKKKKKKKKKKKK.',
]

const frame = (grid: string[]): Frame => pixels(grid, P)

// ---------- stickers (white sticker edge added) ----------
const art = (grid: string[]): Art => sticker(grid, P)
const SPRITES: Record<string, Art> = {
  head: art(['.KK...............KK.', '.KWK.............KWK.', '.KWPK...........KPWK.', '.KWPOKKKKKKKKKKKOPWK.', '.KOOOOOOOOOOOOOOOOOK.', '.KOOOOWWOOOOOWWOOOOK.', '.KOOOOCEOOOOOCEOOOOK.', '.KOOOOEEOWWWOEEOOOOK.', '.KOWWWOOWWWWWOOWWWOK.', 'KWWWWWWWWWEWWWWWWWWWK', 'KWWPPWWWWEPEWWWWPPWWK', '.KKWWWWWWWWWWWWWWWKK.', '...KKKWWWWWWWWWKKK...']),
  sakura: art(['....pPPPPp....', '..pPPPCPPPPp..', '.pPPPPPPPPCPp.', 'pPPCPPPPPPPPPp', 'pPPPPPPPpPPPPp', 'pPPPPPPPPPPCPp', '.pPPPPPPPPPPp.', '..ppPPNNPPpp..', '....ppNNpp....', '......NN......', '......NN......', '.....NNn......', '.....NNn......', '....NNNnN.....']),
  blossom: art(['.PP.PP.', 'PPPPPPP', 'PPpYpPP', '.PYyYP.', 'PPpYpPP', 'PPPPPPP', '.PP.PP.', '...g...', '.Ggg...', '..Gg.G.', '...gGG.', '...g...']),
  petal: art(['..PP.', '.PPPP', 'PPPPp', 'PPPp.', '.Pp..']),
  hedge: art(['...GGG.GGG..', '.GGGGGGGGGG.', 'GGPGGGGGPGGG', 'GGGGGgGGGGGG', 'GgGGPGGGGgGG', 'gGGGgGGGGPGg', '.gggggggggg.']),
  bike: art(['....KKK....KKK..', '.....R.....R....', '.....RRRRRRR....', '..KKK.R...RRKK..', '.K...RR..RKR..K.', 'K...R.KRRK..R..K', 'K..sRRRK.K..s..K', 'K.....K.KK.....K', '.K...K....K...K.', '..KKK......KKK..']),
  vending: art(['KKKKKKKKKK', 'KRRRRRRRRK', 'KRccccccRK', 'KRBcYcGcRK', 'KRBcYcGcRK', 'KRccccccRK', 'KRGcBcRcRK', 'KRGcBcRcRK', 'KRccccccRK', 'KRRRRRRRRK', 'KRYYRRsRRK', 'KRRRRRsRRK', 'KRRRRRRRRK', 'KRKKKKKKRK', 'KRRRRRRRRK', 'KKKKKKKKKK']),
  bone: art(['.KK......KK.', 'KWWKKKKKKWWK', 'KWWWWWWWWWcK', 'KWcWWWWWWWcK', 'KWcKKKKKKccK', '.KK......KK.']),
  onigiri: art(['....KK....', '...KCCK...', '..KCCCCK..', '.KCCCCCCK.', '.KCCCCCCK.', 'KCCAAAACCK', 'KCAAAAAACK', 'KCAAAAAACK', '.KKKKKKKK.']),
  lamp: art(['..KKK..', '.KsssK.', 'KLLLLLK', 'KLYLLLK', 'KLLLLLK', '.KsssK.', '...s...', '...s...', '...s...', '...s...', '...s...', '...s...', '...s...', '...s...', '..sss..', '.sssss.']),
  cone: art(['...RR...', '...RR...', '..RCCR..', '..RRRR..', '.RRRRRR.', '.RCCCCR.', 'rRRRRRRr', 'rrrrrrrr']),
  mailbox: art(['..RRRR..', '.RRRRRR.', 'RRRRRRRR', 'RRKKKKRR', 'RRRRRRRR', 'RRCCCCRR', 'RRRRRRRR', 'rRRRRRRr', 'rRRRRRRr', 'rrrrrrrr', '...ss...', '...ss...', '..ssss..']),
  heart: art(['.RR.RR.', 'RRRRRRR', 'RRRRRRR', '.RRRRR.', '..RRR..', '...R...']),
  sparkle: art(['...Y...', '...Y...', '..YYY..', 'YYYYYYY', '..YYY..', '...Y...', '...Y...']),
  cloud: art(['...CCC.....', '..CCCCC.CC.', '.CCCCCCCCCC', 'CCCCCCCCCCC', 'ccccccccccc']),
}

// a sidewalk along the bottom of each strip, in strip units: a curb lip, then paving slabs
const WALK = 'M0 1004 V918 H400 V1004Z'
const SLABS =
  `<path d="M0 926 H400" stroke="#ffffff" stroke-width="8" opacity=".35"/>` +
  `<path d="M0 964 H400" stroke="#8a7f78" stroke-width="3" opacity=".35"/>` +
  Array.from({ length: 5 }, (_, i) => `<path d="M${40 + i * 80} 932 V964" stroke="#8a7f78" stroke-width="3" opacity=".35"/>`).join('') +
  Array.from({ length: 5 }, (_, i) => `<path d="M${i * 80} 964 V1004" stroke="#8a7f78" stroke-width="3" opacity=".35"/>`).join('')
// the street lamp's glow, only at night
const GLOW =
  `<style>.lampglow{opacity:0}@media (prefers-color-scheme: dark){.lampglow{opacity:.5}}</style>` +
  `<defs><radialGradient id="lampglow"><stop offset="0" stop-color="#ffe9a0"/><stop offset="1" stop-color="#ffe9a0" stop-opacity="0"/></radialGradient></defs>` +
  `<circle class="lampglow" cx="120" cy="850" r="95" fill="url(#lampglow)"/>`

export const PIXEL_SHIBA_SPEC: SkinSpec = {
  id: 'pixel-shiba',
  name: { zh: '街角像素柴犬', en: 'Street pixel shiba' },
  mascot: { zh: '小柴犬', en: 'shiba' },
  blurb: { zh: '像素风：坐在街角人行道上摇尾巴的小柴犬，樱花瓣、饭团和小骨头飘过', en: 'Pixel art: a shiba wagging its curled tail on a street corner, with cherry petals, onigiri and bones drifting by' },
  aliases: ['柴犬', '小柴', 'shiba', 'dog', 'pixel-shiba'],
  alt: { awake: { zh: '街角人行道上的像素小柴犬', en: 'A pixel shiba on a street-corner sidewalk' }, asleep: { zh: '小柴犬蜷成一团睡着了', en: 'The shiba curled up asleep' } },
  crisp: true,
  // the band's head icon: the top of the copied mascot
  sprites: { ...SPRITES, head: pixels(FRAMES[0]!.slice(0, Math.round(FRAMES[0]!.length * 0.62)), PAL) },
  frames: { idle: [MF(FRAMES[0]!), MF(FRAMES[1]!)], sleep: [MF(FRAMES[2]!), MF(breathe(FRAMES[2]!))] },
  idleSteps: [[0, 3.2], [1, 0.18], [0, 2.6], [1, 0.18], [0, 0.4], [1, 0.18], [0, 2]],
  mascotHeight: 160,
  mascotAt: { x: 285, y: 922 },
  world: {
    bg: '#fdf0ee',
    ground: '#ddd2c8',
    hatch: '#f8d8df',
    darkBg: '#1a2038',
    darkGround: '#3d3a4c',
    pattern: 'dots',
    groundPath: WALK,
    groundDetail: SLABS,
    rightBack: GLOW,
    sky: [{ sprite: 'cloud', y: 120, k: 0.95 }],
    leftAir: [['petal', 190, 230, 0.3], ['onigiri', 90, 340, 0.5], ['petal', 250, 440, 0.25], ['bone', 120, 560, 0.55], ['sparkle', 220, 690, 0.3]],
    leftGround: [['sakura', 100, 922, 1.15], ['vending', 250, 922, 0.8], ['cone', 345, 924, 0.32]],
    rightAir: [['petal', 250, 240, 0.28], ['heart', 340, 340, 0.35], ['onigiri', 240, 450, 0.45], ['petal', 330, 560, 0.25], ['sparkle', 250, 650, 0.3]],
    rightGround: [['lamp', 120, 924, 1.0], ['mailbox', 40, 924, 0.5]],
  },
  burst: ['petal', 'heart', 'bone', 'sparkle', 'onigiri', 'petal', 'heart', 'blossom'],
  pops: ['heart', 'petal', 'bone', 'sparkle', 'onigiri'],
  heart: 'heart',
  snore: '#c96f2e',
  icons: { mascot: 'head', think: 'sparkle', token: 'onigiri', agents: 'bike', coin: 'bone' },
  drink: '#f7c6d2',
  ink: '#4a2f25',
  paper: '#fffaf5',
  accent: '#e0794a',
  userStickers: ['bone', 'heart', 'onigiri', 'blossom'],
  reply: 'bone',
  stickerAlt: { zh: '像素小贴纸', en: 'Pixel sticker' },
  replyAlt: { zh: '小骨头贴纸', en: 'Bone sticker' },
  garden: { flower: 'blossom', bush: 'hedge', landmark: 'sakura', bloom: 'petal', ink: '#8a5a4a' },
  colors: {
    accent: '#e0794a',
    heading: '#c25a3a',
    surface: ['#fdf6f3', '#fefaf8', '#ffffff'],
    text: ['#3a2c2a', '#5a4a46', '#7a6a66'],
    darkSurface: ['#161b30', '#1d233b', '#252c46', '#2d3552'],
    darkText: ['#f3eef0', '#cfc6cc', '#a9a0aa'],
    user: ['#ffe6d2', '#e8914a'],
    user2: ['#ffe3ea', '#f4a0b4'],
    assistantBorder: '#efdcd8',
  },
  emoji: { title: '🐕🌸', mascot: '🐕', context: '🍵', token: '🍙', agents: '🚲' },
  cheers: {
    praise: { zh: ['小柴被夸得尾巴转圈圈～', '耳朵都竖起来了！'], en: ['The shiba wags its curly tail at the praise~', 'Ears straight up!'] },
    commit: { zh: ['提交成功！小柴叼来一根小骨头 🦴', '又走过一个路口！'], en: ['Committed! The shiba brings you a bone 🦴', 'Another street corner crossed!'] },
    tests: { zh: ['测试全绿！小柴在樱花树下打了个滚', '全部通过，汪～'], en: ['All green! The shiba rolls under the cherry tree', 'Everything passes, woof~'] },
    yay: { zh: ['耶！小柴在人行道上蹦蹦跳跳', '今天也很棒！分你一个饭团 🍙'], en: ['Yay! The shiba hops along the sidewalk', 'Great work today! Have an onigiri 🍙'] },
  },
}

export const PIXEL_SHIBA = makeSkin(PIXEL_SHIBA_SPEC)
