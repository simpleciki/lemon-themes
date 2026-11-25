import type { ThemeMessageRule, ThemeSetArgs } from 'claude-code'

import { makeColors } from '../../make-colors.js'
import type { Skin } from '../skin'
import { BADGE, ICONS, STICKERS, juiceGlass, limitRing, scene, weatherAt } from './art'

const { theme, problems } = makeColors({
  label: 'Pond Duck',
  roles: { accent: '#3f9ac4', danger: '#cf5a4b', success: '#4f9a5a', warning: '#e0a800', pro: '#9b86d6' },
  light: {
    gray: {
      anchors: {
        'surface-0': '#f7f8f0',
        'surface-1': '#fbfbf5',
        'surface-2': '#fefefb',
        'text-primary': '#2d3440',
        'text-secondary': '#4a5260',
        'text-muted': '#636b78',
      },
    },
  },
  dark: {
    gray: {
      anchors: {
        'surface-0': '#141b18',
        'surface-1': '#1a2320',
        'surface-2': '#212b28',
        'surface-3': '#27322e',
        'text-primary': '#eef3f0',
        'text-secondary': '#c6d2cc',
        'text-muted': '#a2b0aa',
      },
    },
  },
})

const INK = '#2d3440'
const soft = { y: 3, blur: 10, color: '#3f6a8a22' } as const
const userBubble: ThemeMessageRule = {
  color: INK,
  backgroundColor: '#fff4bf',
  borderColor: '#f0c64a',
  borderWidth: 2,
  radius: 20,
  paddingX: 16,
  paddingY: 12,
  shadow: soft,
}

const base: ThemeSetArgs = { colors: theme, backdrop: { scene: 'pond-duck' } }

export const POND_DUCK: Skin = {
  id: 'pond-duck',
  name: { zh: '池塘小鸭', en: 'Pond duckling' },
  mascot: { zh: '小鸭', en: 'duckling' },
  blurb: {
    zh: '油画棒蜡笔：白天在池塘边啄草、傍晚戴睡帽看萤火虫，偶尔下雨就戴雨帽',
    en: 'Oil pastels: pecking by the pond by day, a nightcap and fireflies in the evening, a rain hat on rainy days',
  },
  aliases: ['小鸭', '鸭子', '池塘', 'duck', 'duckling', 'pond'],
  base,
  look: {
    ...base,
    style: {
      Text: { fontSize: 15, lineHeight: 24 },
      Heading: { fontFamily: ['cursive'], color: '#3a86ad' },
      UserMessage: [
        { ...userBubble, rotate: -0.6 },
        { ...userBubble, backgroundColor: '#e2f2fb', borderColor: '#9fd3ec', rotate: 0.5 },
      ],
      AssistantMessage: {
        color: INK,
        backgroundColor: '#fefefb',
        borderColor: '#d6e9f2',
        borderWidth: 1.5,
        radius: 18,
        paddingX: 18,
        paddingY: 14,
        shadow: soft,
      },
      ToolUse: { color: '#4a5260', backgroundColor: '#eef6fa', radius: 10, paddingX: 10, paddingY: 4 },
    },
  },
  problems,
  scene,
  variantAt: weatherAt,
  variants: [
    { id: 'day', name: { zh: '白天池塘', en: 'Sunny pond' } },
    { id: 'dusk', name: { zh: '傍晚萤火虫', en: 'Evening fireflies' } },
    { id: 'rain', name: { zh: '下雨天', en: 'Rainy day' } },
  ],
  alt: {
    awake: { zh: '池塘边的小鸭子，飘着蜻蜓和小花', en: 'A duckling by the pond, with dragonflies and flowers' },
    asleep: { zh: '小鸭子团成一团睡着了', en: 'The duckling is curled up asleep' },
  },
  userStickers: [STICKERS.daisy, STICKERS.heart, STICKERS.lotus, STICKERS.boat],
  userStickerAlt: { zh: '池塘小贴纸', en: 'Pond sticker' },
  reply: { svg: STICKERS.fly, alt: { zh: '小蜻蜓贴纸', en: 'Dragonfly sticker' }, width: 34, height: 28 },
  icons: { mascot: ICONS.duck, think: ICONS.think, token: ICONS.pad, agents: ICONS.fly, coin: ICONS.coin },
  juiceGlass,
  limitRing,
  badge: BADGE,
  ink: { heading: '#3a86ad', gauge: '#3f9ac4', border: '#9fd3ec', ok: '#4f9a5a' },
  emoji: { title: '🌼🐥', mascot: '🐥', context: '💧', token: '🪷', agents: '🪰' },
  cheers: {
    praise: { zh: ['小鸭收到夸夸啦，嘎嘎嘎！', '池塘里的荷花都开了～', '这个点子亮晶晶的！'], en: ['The duckling got a compliment: quack quack!', 'Every lotus on the pond just opened~', 'What a shiny idea!'] },
    commit: { zh: ['提交成功！小鸭给你叼来一片荷叶 🪷', '又一块砖稳稳放好了！'], en: ['Committed! The duckling brings you a lily pad 🪷', 'Another brick, firmly in place!'] },
    tests: { zh: ['测试全绿，小鸭扑腾着翅膀！', '全部通过，嘎！'], en: ['All green, the duckling flaps with joy!', 'Every test passes: quack!'] },
    yay: { zh: ['耶！小鸭为你撒花～', '今天也很棒！'], en: ['Yay! The duckling throws confetti for you~', 'Great work today!'] },
  },
}
