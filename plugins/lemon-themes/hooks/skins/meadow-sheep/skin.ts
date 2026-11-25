import type { ThemeMessageRule, ThemeSetArgs } from 'claude-code'

import { makeColors } from '../../make-colors.js'
import type { Skin } from '../skin'
import { BADGE, ICONS, STICKERS, juiceGlass, limitRing, scene, defOf, sizeOf } from './art'

const { theme, problems } = makeColors({
  label: 'Meadow Sheep',
  roles: { accent: '#5f9a3a', danger: '#cf5a4b', success: '#4f8a3a', warning: '#d9a400', pro: '#c4708f' },
  light: {
    gray: {
      anchors: {
        'surface-0': '#f5f8ec',
        'surface-1': '#f9fbf2',
        'surface-2': '#fdfef8',
        'text-primary': '#2f3a24',
        'text-secondary': '#4c5a3c',
        'text-muted': '#647253',
      },
    },
  },
  dark: {
    gray: {
      anchors: {
        'surface-0': '#151c14',
        'surface-1': '#1c251a',
        'surface-2': '#232d20',
        'surface-3': '#293425',
        'text-primary': '#eef4e2',
        'text-secondary': '#c9d6b4',
        'text-muted': '#a3b292',
      },
    },
  },
})

const INK = '#2f3a24'
const soft = { y: 3, blur: 10, color: '#4f6b3a22' } as const
const userBubble: ThemeMessageRule = {
  color: INK,
  backgroundColor: '#e6f3cf',
  borderColor: '#a9cf7d',
  borderWidth: 2,
  radius: 20,
  paddingX: 16,
  paddingY: 12,
  shadow: soft,
}

const base: ThemeSetArgs = { colors: theme, backdrop: { scene: 'meadow-sheep' } }

export const MEADOW_SHEEP: Skin = {
  id: 'meadow-sheep',
  name: { zh: '草地小羊', en: 'Meadow lamb' },
  mascot: { zh: '小羊', en: 'lamb' },
  blurb: { zh: '毛毡软球：在草坡上吃草、团成一团打盹的小羊，飘着蝴蝶和四叶草', en: 'Felt balls: a lamb grazing on a grassy hill and curling up to nap, with butterflies and clovers' },
  aliases: ['小羊', '草地', 'lamb', 'sheep', 'meadow'],
  base,
  look: {
    ...base,
    style: {
      Text: { fontSize: 15, lineHeight: 24 },
      Heading: { fontFamily: ['cursive'], color: '#5f8a3a' },
      UserMessage: [
        { ...userBubble, rotate: -0.6 },
        { ...userBubble, backgroundColor: '#fde7ea', borderColor: '#eaa3b1', rotate: 0.5 },
      ],
      AssistantMessage: {
        color: INK,
        backgroundColor: '#fdfef8',
        borderColor: '#cfe3b0',
        borderWidth: 1.5,
        radius: 18,
        paddingX: 18,
        paddingY: 14,
        shadow: soft,
      },
      ToolUse: { color: '#4c5a3c', backgroundColor: '#eef6de', radius: 10, paddingX: 10, paddingY: 4 },
    },
  },
  problems,
  scene,
  alt: { awake: { zh: '草地、飘着的小花贴纸和正在吃草的小羊', en: 'A meadow, floating flower stickers and a grazing lamb' }, asleep: { zh: '小羊团成一团睡着了', en: 'The lamb is curled up asleep' } },
  userStickers: [STICKERS.daisy, STICKERS.clover, STICKERS.heart, STICKERS.wool],
  userStickerAlt: { zh: '草地小贴纸', en: 'Meadow sticker' },
  reply: { svg: STICKERS.butterfly, alt: { zh: '小蝴蝶贴纸', en: 'Butterfly sticker' }, width: 34, height: 30 },
  icons: { mascot: ICONS.lamb, think: ICONS.think, token: ICONS.wool, agents: ICONS.butterfly, coin: ICONS.coin },
  juiceGlass,
  limitRing,
  badge: BADGE,
  ink: { heading: '#5f8a3a', gauge: '#5f9a3a', border: '#a9cf7d', ok: '#4f8a3a' },
  emoji: { title: '🌱🐑', mascot: '🐑', context: '🥛', token: '🧶', agents: '🦋' },
  garden: () => ({ flower: 'daisy', bush: 'blossom', landmark: 'tree', bloom: 'clover', size: sizeOf, def: defOf, ink: '#5f8a3a' }),
  cheers: {
    praise: { zh: ['小羊收到夸夸啦，开心蹦了一下！', '草地上的小花都开了～', '这个点子软软的，好喜欢！'], en: ['The lamb got a compliment and does a little hop!', 'All the meadow flowers just opened~', 'Such a soft, lovely idea!'] },
    commit: { zh: ['提交成功！小羊给你叼来一朵小雏菊 🌼', '又一块砖稳稳放好了！'], en: ['Committed! The lamb brings you a daisy 🌼', 'Another brick, firmly in place!'] },
    tests: { zh: ['测试全绿，像这片草地一样！', '全部通过，小羊奖励你一颗四叶草～'], en: ['All green, just like the meadow!', 'Every test passes: have a four-leaf clover~'] },
    yay: { zh: ['耶！小羊为你撒花～', '今天也很棒！'], en: ['Yay! The lamb throws confetti for you~', 'Great work today!'] },
  },
}
