import type { ThemeMessageRule, ThemeSetArgs } from 'claude-code'

import { makeColors } from '../../make-colors.js'
import type { Skin } from '../skin'
import { BADGE, ICONS, STICKERS, juiceGlass, limitRing, scene } from './art'

const { theme, problems } = makeColors({
  label: 'Lemon Bear',
  roles: { accent: '#d99a00', danger: '#cf5a4b', success: '#6f9e4c', warning: '#e0a800', pro: '#c4708f' },
  light: {
    gray: {
      anchors: {
        'surface-0': '#fbf3d9',
        'surface-1': '#fdf7e6',
        'surface-2': '#fffbef',
        'text-primary': '#3b2a19',
        'text-secondary': '#5c452e',
        'text-muted': '#735c44',
      },
    },
  },
  dark: {
    gray: {
      anchors: {
        'surface-0': '#1f1912',
        'surface-1': '#282016',
        'surface-2': '#30271b',
        'surface-3': '#362c1f',
        'text-primary': '#fbf0d6',
        'text-secondary': '#dccaa6',
        'text-muted': '#b8a585',
      },
    },
  },
})

const INK = '#3b2a19'
const soft = { y: 3, blur: 10, color: '#7a4a2c22' } as const
const userBubble: ThemeMessageRule = {
  color: INK,
  backgroundColor: '#fff2b0',
  borderColor: '#e6bf4a',
  borderWidth: 2,
  radius: 20,
  paddingX: 16,
  paddingY: 12,
  shadow: soft,
}

const base: ThemeSetArgs = { colors: theme, backdrop: { scene: 'lemon-bear' } }

export const LEMON_BEAR: Skin = {
  id: 'lemon-bear',
  name: '柠檬小熊',
  mascot: '小熊',
  blurb: '彩铅绘本：抱着柠檬的蜂蜜小熊、飘浮的柠檬和小蜜蜂',
  base,
  look: {
    ...base,
    style: {
      Text: { fontSize: 15, lineHeight: 24 },
      Heading: { fontFamily: ['cursive'], color: '#b9781a' },
      UserMessage: [
        { ...userBubble, rotate: -0.6 },
        { ...userBubble, backgroundColor: '#fde7ea', borderColor: '#eaa3b1', rotate: 0.5 },
      ],
      AssistantMessage: {
        color: INK,
        backgroundColor: '#fffcf2',
        borderColor: '#f0d98f',
        borderWidth: 1.5,
        radius: 18,
        paddingX: 18,
        paddingY: 14,
        shadow: soft,
      },
      ToolUse: { color: '#5c452e', backgroundColor: '#fff6d6', radius: 10, paddingX: 10, paddingY: 4 },
    },
  },
  problems,
  scene,
  alt: { awake: '漂浮的柠檬贴纸和抱着柠檬的小熊', asleep: '小熊趴着睡着了' },
  userStickers: [STICKERS.lemon, STICKERS.slice, STICKERS.daisy, STICKERS.heart],
  userStickerAlt: '柠檬小贴纸',
  reply: { svg: STICKERS.bee, alt: '小蜜蜂贴纸', width: 32, height: 34 },
  icons: { mascot: ICONS.bear, think: ICONS.think, token: ICONS.honey, agents: ICONS.bee, coin: ICONS.coin },
  juiceGlass,
  limitRing,
  badge: BADGE,
  ink: { heading: '#b9781a', gauge: '#d99a00', border: '#e6bf4a', ok: '#6f9e4c' },
  emoji: { title: '🍋🐻', mascot: '🐻', context: '🍋', token: '🍯', agents: '🐝' },
  cheers: {
    praise: ['小熊收到夸夸啦，开心转圈！', '柠檬汁加满，继续冲！', '这个点子闪闪发光～'],
    commit: ['提交成功！小熊给你盖了个章 🍋', '又一块砖稳稳放好了！'],
    tests: ['测试全绿，小熊跳起来了！', '全部通过，奖励一片柠檬～'],
    yay: ['耶！小熊为你撒花～', '今天也很棒！'],
  },
}
