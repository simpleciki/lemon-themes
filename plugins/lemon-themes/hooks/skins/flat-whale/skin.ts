// Flat little whale in the shallows: a chubby baby-blue whale with a pale belly resting on the sandy
// sea floor, puffing a water spout now and then, with bubbles, kelp, fish, starfish and coral around.
// Hand-written flat vector art (smooth curves, flat fills, one lighter tone for highlights);
// kit/factory.ts builds the scene and the rest.

import { makeSkin } from '../kit/factory'
import type { Art, Frame, SkinSpec } from '../kit/factory'

// one palette for the whole skin, so every sprite shares its colours
const C = {
  body: '#78c6ec',
  deep: '#4fa3d6',
  light: '#a9ddf6',
  belly: '#eefbff',
  groove: '#cdeaf6',
  eye: '#21405a',
  cheek: '#ff9db1',
  spout: '#c9f1fb',
  splash: '#8fd9f0',
  white: '#ffffff',
  coral: '#ff8b8f',
  coralDeep: '#ef6a77',
  coralLight: '#ffb3b0',
  pink: '#ffb7c8',
  aqua: '#5fd3c8',
  aquaDeep: '#2fb3a8',
  kelp: '#4cbf8f',
  kelpDeep: '#33a077',
  sand: '#f3dcab',
  gold: '#ffc65c',
  goldDeep: '#f4a63c',
  lilac: '#c9b6f2',
  lilacDeep: '#a993e6',
}

// ---------- the whale (faces left, 128 x 96 box, belly on the bottom edge) ----------
type Look = { eyes: 'open' | 'blink' | 'sleep'; spout?: boolean; tail?: number; bubble?: 0 | 1 | 2; breathe?: boolean }

const eyeOpen = `<circle cx="36" cy="52" r="5" fill="${C.eye}"/><circle cx="37.6" cy="50.2" r="1.8" fill="${C.white}"/>`
const eyeShut = `<path d="M30.5 52.5 Q36 57 41.5 52.5" fill="none" stroke="${C.eye}" stroke-width="2.6" stroke-linecap="round"/>`
const eyeSleep = `<path d="M30.5 53 Q36 57.5 41.5 53" fill="none" stroke="${C.eye}" stroke-width="2.6" stroke-linecap="round"/>`

const SPOUT =
  `<path d="M51 22 C49 13 50 6 53 0 L59 0 C61 7 61 14 59 22Z" fill="${C.splash}"/>` +
  `<path d="M56 2 C46 -11 32 -10 26 3 C36 -3 46 -2 56 5Z" fill="${C.splash}"/>` +
  `<path d="M56 2 C66 -11 80 -10 86 3 C76 -3 66 -2 56 5Z" fill="${C.splash}"/>` +
  `<path d="M55 1 C53 -5 55 -10 57 -12 C59 -10 61 -5 59 1Z" fill="${C.white}"/>` +
  `<circle cx="26" cy="9" r="3" fill="${C.splash}"/><circle cx="86" cy="9" r="3" fill="${C.splash}"/>` +
  `<circle cx="40" cy="-12" r="2.4" fill="${C.splash}"/><circle cx="72" cy="-12" r="2.4" fill="${C.splash}"/>`

const BUBBLE = (cx: number, cy: number, r: number) =>
  `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${C.spout}" fill-opacity=".55" stroke="#8ed6e6" stroke-width="${Math.max(1.4, r * 0.09).toFixed(1)}"/>` +
  `<circle cx="${cx - r * 0.35}" cy="${cy - r * 0.35}" r="${r * 0.28}" fill="${C.white}"/>`

function whale(o: Look): string {
  const tail = o.tail ?? 0
  const body =
    // tail: a short stem curling up behind, two round flukes
    `<g transform="rotate(${tail} 96 70)">` +
    `<path d="M88 64 C98 60 106 52 110 40 L117 42 C114 58 104 72 92 80Z" fill="${C.body}"/>` +
    `<path d="M113 42 C106 38 101 30 103 22 C109 25 114 32 115 41Z" fill="${C.deep}"/>` +
    `<path d="M113 42 C116 33 121 27 128 26 C127 34 121 40 114 43Z" fill="${C.deep}"/>` +
    `</g>` +
    // body: big round head, small behind
    `<path d="M8 62 C8 36 32 20 58 20 C84 20 98 38 101 56 C103 72 96 86 78 92 C68 95 56 95 44 95 C22 95 8 82 8 62Z" fill="${C.body}"/>` +
    // highlight on the crown
    `<path d="M26 34 C34 26 46 23 56 24 C50 28 40 32 30 39 C27 40 24 38 26 34Z" fill="${C.light}"/>` +
    // pale belly with throat grooves
    `<path d="M9 68 C14 84 30 95 48 95 C66 95 82 92 90 84 C72 86 52 85 36 80 C24 76 14 72 9 68Z" fill="${C.belly}"/>` +
    `<path d="M22 80 C34 85 50 88 66 88 M30 86 C42 90 54 91 64 91" fill="none" stroke="${C.groove}" stroke-width="1.8" stroke-linecap="round"/>` +
    // blowhole
    `<path d="M51 22.5 Q55 20 59 22.5" fill="none" stroke="${C.deep}" stroke-width="2" stroke-linecap="round"/>` +
    // flipper
    `<path d="M52 76 C60 77 68 82 71 92 C62 93 54 88 50 80 C49 78 50 76 52 76Z" fill="${C.deep}"/>` +
    // face
    (o.eyes === 'open' ? eyeOpen : o.eyes === 'blink' ? eyeShut : eyeSleep) +
    `<ellipse cx="30" cy="64" rx="6.5" ry="3.8" fill="${C.cheek}" fill-opacity=".75"/>` +
    `<path d="M13 61 Q18 67.5 24 62" fill="none" stroke="${C.eye}" stroke-width="2.2" stroke-linecap="round"/>`
  const breathing = o.breathe === true ? `<g transform="translate(0 95) scale(1.015 1.035) translate(0 -95)">${body}</g>` : body
  const bubble = o.bubble === 1 ? BUBBLE(4, 50, 5) : o.bubble === 2 ? BUBBLE(-2, 34, 8) + BUBBLE(6, 52, 3.5) : ''
  return breathing + (o.spout === true ? SPOUT : '') + bubble
}

const W = 128
const H = 96
const frame = (o: Look): Frame => ({ w: W, h: H, body: whale(o) })

// ---------- props (each in its own box) ----------
const art = (w: number, h: number, body: string): Art => ({ w, h, body })

const SPRITES: Record<string, Art> = {
  whale: art(W, H, whale({ eyes: 'open' })),
  bubble: art(60, 60, BUBBLE(30, 30, 26)),
  bubbles: art(70, 100, BUBBLE(42, 76, 20) + BUBBLE(20, 40, 13) + BUBBLE(46, 14, 9)),
  kelp: art(
    70,
    130,
    `<path d="M30 130 C18 110 40 96 28 76 C18 58 38 44 30 22 C28 14 30 6 34 0 C42 16 46 30 40 46 C34 62 48 74 40 92 C34 106 44 118 40 130Z" fill="${C.kelp}"/>` +
      `<path d="M44 130 C52 116 40 104 50 88 C58 74 50 62 58 48 C62 42 66 38 70 36 C70 52 64 62 62 74 C60 88 66 100 56 114 C52 120 52 126 52 130Z" fill="${C.kelpDeep}"/>` +
      `<path d="M16 130 C8 118 14 104 6 92 C2 86 0 80 2 74 C14 82 20 94 20 106 C20 116 24 124 24 130Z" fill="${C.kelpDeep}"/>` +
      `<path d="M33 10 C37 22 38 32 34 42" fill="none" stroke="#7fdab0" stroke-width="2.5" stroke-linecap="round"/>`,
  ),
  fish: art(
    100,
    64,
    `<path d="M72 32 L98 12 C96 24 96 40 98 52Z" fill="${C.goldDeep}"/>` +
      `<path d="M6 32 C10 14 30 6 48 6 C64 6 76 18 78 32 C76 46 64 58 48 58 C30 58 10 50 6 32Z" fill="${C.gold}"/>` +
      `<path d="M38 7 C44 2 54 0 60 4 C54 6 48 8 44 12Z" fill="${C.goldDeep}"/>` +
      `<path d="M46 8 C52 20 52 44 46 56 L56 54 C62 42 62 22 56 10Z" fill="${C.white}" fill-opacity=".7"/>` +
      `<circle cx="22" cy="27" r="4.5" fill="${C.eye}"/><circle cx="23.4" cy="25.6" r="1.5" fill="${C.white}"/>` +
      `<ellipse cx="21" cy="38" rx="4" ry="2.4" fill="${C.cheek}" fill-opacity=".8"/>`,
  ),
  starfish: art(
    100,
    96,
    `<path d="M50 4 C55 4 57 22 62 32 C72 34 94 32 96 38 C98 44 80 54 74 62 C76 72 84 90 78 94 C72 98 58 84 50 80 C42 84 28 98 22 94 C16 90 24 72 26 62 C20 54 2 44 4 38 C6 32 28 34 38 32 C43 22 45 4 50 4Z" fill="${C.coral}"/>` +
      `<path d="M50 18 C52 28 54 34 58 40 C52 42 48 42 42 40 C46 34 48 28 50 18Z" fill="${C.coralLight}"/>` +
      `<circle cx="50" cy="30" r="2.2" fill="${C.coralLight}"/><circle cx="76" cy="42" r="2.2" fill="${C.coralLight}"/><circle cx="24" cy="42" r="2.2" fill="${C.coralLight}"/>` +
      `<circle cx="66" cy="76" r="2.2" fill="${C.coralLight}"/><circle cx="34" cy="76" r="2.2" fill="${C.coralLight}"/>` +
      `<circle cx="43" cy="52" r="3" fill="${C.eye}"/><circle cx="57" cy="52" r="3" fill="${C.eye}"/>` +
      `<path d="M46 59 Q50 63 54 59" fill="none" stroke="${C.eye}" stroke-width="2" stroke-linecap="round"/>`,
  ),
  shell: art(
    100,
    86,
    `<path d="M50 6 C76 6 96 28 96 54 C96 62 92 68 86 70 L14 70 C8 68 4 62 4 54 C4 28 24 6 50 6Z" fill="${C.pink}"/>` +
      `<path d="M50 70 L50 8 M50 70 L28 12 M50 70 L72 12 M50 70 L12 30 M50 70 L88 30" stroke="#ff9cb4" stroke-width="5" stroke-linecap="round"/>` +
      `<path d="M30 70 L36 84 L64 84 L70 70Z" fill="#ff9cb4"/>` +
      `<path d="M26 20 C32 14 40 11 46 11 C40 16 34 20 30 26Z" fill="${C.white}" fill-opacity=".7"/>`,
  ),
  coral: art(
    110,
    124,
    `<path d="M48 124 L50 92 C40 84 34 74 32 60 C22 56 14 44 16 30 C17 24 23 22 26 28 C28 38 32 46 38 50 C38 40 36 30 38 18 C39 12 46 12 47 18 C48 30 50 44 54 56 C58 46 60 34 66 24 C70 18 77 20 76 27 C74 40 68 52 62 62 C66 66 74 68 80 64 C86 58 88 50 92 44 C96 40 102 42 101 48 C98 62 90 74 76 80 C70 84 64 86 60 90 L62 124Z" fill="${C.coral}"/>` +
      `<path d="M21 26 C24 22 28 24 27 30 C25 32 22 31 21 26Z M40 14 C43 10 47 12 46 18 C44 20 40 19 40 14Z M70 22 C74 19 78 22 75 27 C72 28 69 26 70 22Z M95 42 C99 40 102 44 99 48 C96 49 94 46 95 42Z" fill="${C.coralLight}"/>` +
      `<path d="M52 122 L53 96 C54 90 57 88 58 94 L58 122Z" fill="${C.coralDeep}"/>` +
      `<circle cx="36" cy="64" r="2.5" fill="${C.coralLight}"/><circle cx="70" cy="74" r="2.5" fill="${C.coralLight}"/><circle cx="52" cy="40" r="2.5" fill="${C.coralLight}"/>`,
  ),
  anemone: art(
    90,
    96,
    `<path d="M28 96 C26 80 30 66 45 62 C60 66 64 80 62 96Z" fill="${C.aquaDeep}"/>` +
      [-60, -36, -12, 12, 36, 60]
        .map(a => `<g transform="rotate(${a} 45 62)"><path d="M41 62 C38 44 40 26 45 14 C50 26 52 44 49 62Z" fill="${C.lilac}"/><circle cx="45" cy="16" r="5" fill="${C.pink}"/></g>`)
        .join('') +
      `<ellipse cx="45" cy="64" rx="14" ry="6" fill="${C.lilacDeep}"/>` +
      `<path d="M34 76 C36 72 40 70 44 70" fill="none" stroke="${C.aqua}" stroke-width="3" stroke-linecap="round"/>`,
  ),
  jelly: art(
    80,
    112,
    `<path d="M22 54 C20 72 28 84 24 100 M34 56 C32 76 40 88 36 110 M46 56 C48 76 40 88 44 110 M58 54 C60 72 52 84 56 100" fill="none" stroke="${C.lilacDeep}" stroke-width="3.2" stroke-linecap="round"/>` +
      `<path d="M6 50 C6 24 22 6 40 6 C58 6 74 24 74 50 C66 56 58 52 52 56 C46 52 34 52 28 56 C22 52 14 56 6 50Z" fill="${C.lilac}"/>` +
      `<path d="M18 26 C22 18 30 13 38 12 C32 18 26 24 22 32Z" fill="${C.white}" fill-opacity=".6"/>` +
      `<circle cx="31" cy="34" r="3" fill="${C.eye}"/><circle cx="49" cy="34" r="3" fill="${C.eye}"/>` +
      `<ellipse cx="25" cy="42" rx="4" ry="2.4" fill="${C.cheek}" fill-opacity=".8"/><ellipse cx="55" cy="42" rx="4" ry="2.4" fill="${C.cheek}" fill-opacity=".8"/>` +
      `<path d="M36 41 Q40 45 44 41" fill="none" stroke="${C.eye}" stroke-width="2" stroke-linecap="round"/>`,
  ),
  heart: art(
    100,
    90,
    `<path d="M50 86 C40 76 4 56 4 30 C4 14 16 4 29 4 C38 4 46 9 50 18 C54 9 62 4 71 4 C84 4 96 14 96 30 C96 56 60 76 50 86Z" fill="${C.coral}"/>` +
      `<path d="M16 26 C18 18 24 13 31 13 C27 18 23 24 22 32Z" fill="${C.white}" fill-opacity=".6"/>`,
  ),
  sparkle: art(
    100,
    100,
    `<path d="M50 2 C54 34 66 46 98 50 C66 54 54 66 50 98 C46 66 34 54 2 50 C34 46 46 34 50 2Z" fill="${C.gold}"/>` +
      `<path d="M50 24 C52 40 58 46 74 50 C58 52 52 58 50 74 C48 58 42 52 26 50 C42 48 48 40 50 24Z" fill="#fff1c2"/>`,
  ),
  wave: art(
    120,
    60,
    `<path d="M4 56 C4 30 22 8 50 8 C72 8 86 22 86 38 C86 48 78 54 70 52 C76 46 74 36 66 34 C56 32 50 42 54 52 C60 60 80 58 92 50 C104 44 110 46 116 50 C112 56 104 56 98 56Z" fill="${C.aqua}"/>` +
      `<path d="M14 44 C16 30 28 18 44 16 C32 24 24 34 22 46Z" fill="${C.white}" fill-opacity=".55"/>`,
  ),
  pebbles: art(
    100,
    44,
    `<ellipse cx="30" cy="30" rx="26" ry="14" fill="#b8c6cf"/><ellipse cx="70" cy="34" rx="22" ry="10" fill="#9fb0bb"/>` +
      `<ellipse cx="22" cy="24" rx="10" ry="4" fill="#d6e0e6"/><ellipse cx="86" cy="18" rx="10" ry="8" fill="#c9d4db"/>`,
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
    zh: '扁平插画：趴在浅海沙地上喷水花的胖胖小蓝鲸，身边飘着泡泡、海草、小鱼和珊瑚',
    en: 'Flat illustration: a chubby baby-blue whale puffing its spout on the sandy shallows, with bubbles, kelp, fish and coral around',
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
  ink: '#21405a',
  paper: '#f6fdfd',
  accent: '#1f9fa6',
  userStickers: ['heart', 'starfish', 'fish', 'shell'],
  reply: 'bubbles',
  stickerAlt: { zh: '海洋小贴纸', en: 'Sea sticker' },
  replyAlt: { zh: '泡泡贴纸', en: 'Bubbles sticker' },
  garden: { flower: 'anemone', bush: 'kelp', landmark: 'coral', bloom: 'shell', ink: '#21405a' },
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
