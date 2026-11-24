// Builds the README's animated pictures from a theme's own vector data.
//
//     npx tsx tools/build_site.mts lemon-bear
//
// Writes assets/<theme>/hero-light.svg, hero-dark.svg and the state cards (sit, sleep, hearts,
// party, band). GitHub shows an SVG in an <img> with its SMIL animation running, so the README
// moves without any GIF. No scripts, no web fonts (an <img> loads neither).

import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const theme = process.argv[2] ?? 'lemon-bear'
const hooks = join(ROOT, 'plugins', theme, 'hooks')
const { SPRITES } = await import(join(hooks, 'sprites.ts'))
const { FRAMES } = await import(join(hooks, 'frames.ts'))
const { ICONS, juiceGlass, limitRing } = await import(join(hooks, 'art.ts'))

type Sprite = { w: number; h: number; body: string }
type Frame = Sprite & { dy: number }

const OUT = join(ROOT, 'assets', theme)
mkdirSync(OUT, { recursive: true })

// ---------- palette ----------
const LIGHT = { bg: '#fbf3d9', check: '#ffe99a', checkOpacity: 0.45, ink: '#5a3b22', soft: '#8a6a4a', card: '#fffaf0', line: '#efd9a4' }
const DARK = { bg: '#1f1912', check: '#ffe99a', checkOpacity: 0.07, ink: '#fbf0d6', soft: '#d8c4a0', card: '#2a2219', line: '#4a3a26' }
type Pal = typeof LIGHT
const FONT = "ui-rounded, 'SF Pro Rounded', 'Hiragino Maru Gothic ProN', 'PingFang SC', 'Nunito', 'Segoe UI', sans-serif"

// ---------- sprites and motion ----------
const EASE = '.45 0 .55 1'
const sprite = (name: string): Sprite => SPRITES[name] ?? { w: 0, h: 0, body: '' }
const defs = (names: string[]) => names.map(n => `<g id="s-${n}">${sprite(n).body}</g>`).join('')
const use = (name: string) => {
  const s = sprite(name)
  return `<use href="#s-${name}" x="${-s.w / 2}" y="${-s.h / 2}"/>`
}
const loop = (type: string, values: string, dur: number, begin: number) =>
  `<animateTransform attributeName="transform" type="${type}" values="${values}" dur="${dur}s" begin="${-begin}s" repeatCount="indefinite" calcMode="spline" keySplines="${EASE};${EASE}"/>`

const BEE = sprite('bee')
const WINGS = sprite('wings')
const beeBody =
  `<g transform="translate(${BEE.w * 0.06} ${-BEE.h * 0.18})"><g>` +
  `<animateTransform attributeName="transform" type="scale" values="1 1;1 .7;1 1" dur=".5s" repeatCount="indefinite"/>` +
  `<use href="#s-wings" x="${-WINGS.w / 2}" y="${-WINGS.h}"/></g></g>` +
  `<use href="#s-bee" x="${-BEE.w / 2}" y="${-BEE.h / 2}"/>`

// A floating sticker: drifts and sways on its own clock.
const floater = (name: string, x: number, y: number, k: number, i: number) => {
  const dur = 5 + ((i * 37) % 6)
  const off = (i * 1.7) % dur
  return (
    `<g transform="translate(${x} ${y}) scale(${k})"><g>${loop('translate', `0 0;${i % 2 ? 12 : -12} -28;0 0`, dur, off)}` +
    `<g>${loop('rotate', '-10;10;-10', dur * 0.8, off)}${name === 'bee' ? beeBody : use(name)}</g></g></g>`
  )
}

// The bear's flipbook: [frame, seconds] steps, a frame may come back.
const flipbook = (seq: string, steps: [number, number][]) => {
  const frames: Frame[] = FRAMES[seq] ?? []
  const total = steps.reduce((a, [, t]) => a + t, 0)
  let at = 0
  const keyTimes = steps.map(([, t]) => ((at += t) - t) / total).map(k => k.toFixed(4)).join(';')
  const body = frames
    .map((f, i) => {
      const values = steps.map(([fi]) => (fi === i ? 1 : 0)).join(';')
      return (
        `<g opacity="${i === 0 ? 1 : 0}"><animate attributeName="opacity" values="${values}" keyTimes="${keyTimes}" calcMode="discrete" dur="${total}s" repeatCount="indefinite"/>` +
        `<use href="#f-${seq}-${i}" x="${-f.w / 2}" y="${-f.h + f.dy}"/></g>`
      )
    })
    .join('')
  return { defs: frames.map((f, i) => `<g id="f-${seq}-${i}">${f.body}</g>`).join(''), body }
}
const SIT: [number, number][] = [[0, 3.2], [1, 0.18], [0, 2.4], [1, 0.18]]
const SLEEP: [number, number][] = [[0, 1.7], [1, 1.7]]
const SWAY = `<animateTransform attributeName="transform" type="rotate" values="0;-2.2;0;1.8;0" keyTimes="0;.25;.5;.75;1" dur="7s" repeatCount="indefinite" calcMode="spline" keySplines="${Array(4).fill(EASE).join(';')}"/>`

// The bear at (x, y) = its feet, `height` tall.
const bear = (x: number, y: number, height: number, inner: string) => {
  const k = height / (FRAMES.idle?.[0]?.h ?? 270)
  return `<g transform="translate(${x} ${y}) scale(${k.toFixed(3)})">${inner}</g>`
}

const SNORE = [0, 1, 2]
  .map(
    i =>
      `<text x="${70 + i * 18}" y="${-150 - i * 24}" font-family="${FONT}" font-weight="700" font-size="${26 + i * 8}" fill="#9a6a3a" opacity="0">z` +
      `<animate attributeName="opacity" values="0;1;0" keyTimes="0;.3;1" dur="3.6s" begin="${i * 1.2}s" repeatCount="indefinite"/>` +
      `<animateTransform attributeName="transform" type="translate" values="0 0;12 -26" dur="3.6s" begin="${i * 1.2}s" repeatCount="indefinite"/></text>`,
  )
  .join('')

// Repeating versions of the click hearts and the celebration burst, for the README.
const HEARTS = [-80, 0, 80]
  .map(
    (dx, i) =>
      `<g transform="translate(${dx} -300) scale(1.3)" opacity="0">` +
      `<animate attributeName="opacity" values="0;1;1;0;0" keyTimes="0;.08;.5;.7;1" dur="3.2s" begin="${i * 0.2}s" repeatCount="indefinite"/>` +
      `<g><animateTransform attributeName="transform" type="translate" values="0 0;${(i - 1) * 20} -170;${(i - 1) * 20} -170" keyTimes="0;.7;1" dur="3.2s" begin="${i * 0.2}s" repeatCount="indefinite"/>${use('heart')}</g></g>`,
  )
  .join('')
const BURST = ['slice', 'heart', 'sparkle', 'daisy', 'lemon', 'heart', 'sparkle', 'slice']
const CONFETTI = BURST.map((name, i) => {
  const a = (-165 + (i * 150) / (BURST.length - 1)) * (Math.PI / 180)
  const dx = Math.round(Math.cos(a) * 260)
  const dy = Math.round(Math.sin(a) * 230)
  const b = (i % 3) * 0.08
  return (
    `<g transform="translate(0 -150)" opacity="0">` +
    `<animate attributeName="opacity" values="0;1;1;0;0" keyTimes="0;.06;.45;.6;1" dur="3s" begin="${b}s" repeatCount="indefinite"/>` +
    `<g><animateTransform attributeName="transform" type="translate" values="0 0;${dx} ${dy};${dx} ${dy}" keyTimes="0;.6;1" dur="3s" begin="${b}s" repeatCount="indefinite" calcMode="spline" keySplines=".2 .7 .3 1;0 0 1 1"/>` +
    `<g><animateTransform attributeName="transform" type="rotate" values="0;200;200" keyTimes="0;.6;1" dur="3s" begin="${b}s" repeatCount="indefinite"/>${use(name)}</g></g></g>`
  )
}).join('')
const HOP_LOOP = `<animateTransform attributeName="transform" type="translate" values="0 0;0 -30;0 0;0 -18;0 0;0 0" keyTimes="0;.08;.16;.22;.28;1" dur="3s" repeatCount="indefinite"/>`

const ground = (p: Pal) =>
  `<pattern id="gh" width="40" height="40" patternUnits="userSpaceOnUse">` +
  `<rect width="20" height="40" fill="${p.check}" opacity="${p.checkOpacity}"/><rect width="40" height="20" fill="${p.check}" opacity="${p.checkOpacity}"/></pattern>`

const svg = (w: number, h: number, alt: string, body: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-label="${alt}">${body}</svg>`

// ---------- hero ----------
const HERO_FLOAT: [string, number, number, number][] = [
  ['slice', 70, 70, 0.55], ['heart', 300, 46, 0.45], ['sparkle', 520, 60, 0.4], ['leaf', 700, 80, 0.5],
  ['bee', 860, 92, 0.6], ['daisy', 40, 330, 0.5], ['lemon', 640, 345, 0.55], ['sparkle', 760, 300, 0.35],
  ['heart', 1230, 70, 0.42], ['jar', 1210, 330, 0.5], ['lemonade', 930, 330, 0.5], ['sparkle', 1250, 220, 0.35],
  ['daisy', 470, 360, 0.42], ['slice', 1150, 170, 0.45],
]
function hero(p: Pal, dark: boolean) {
  const fb = flipbook('idle', SIT)
  const floats = HERO_FLOAT.map(([n, x, y, k], i) => floater(n, x, y, k, i)).join('')
  const title =
    `<text x="80" y="196" font-family="${FONT}" font-weight="800" font-size="78" fill="${p.ink}" stroke="${dark ? '#1f1912' : '#ffffff'}" stroke-width="10" paint-order="stroke" stroke-linejoin="round">Lemon Themes</text>` +
    `<text x="84" y="248" font-family="${FONT}" font-weight="600" font-size="26" fill="${p.soft}">会动的绘本皮肤 · storybook skins for the Claude desktop app</text>` +
    `<g transform="translate(84 276)"><rect width="220" height="36" rx="18" fill="${dark ? '#3a2e1f' : '#fff2b0'}" stroke="#e6bf4a" stroke-width="2"/>` +
    `<text x="110" y="24" text-anchor="middle" font-family="${FONT}" font-weight="700" font-size="17" fill="${p.ink}">lemon-bear 柠檬小熊</text></g>` +
    `<g transform="translate(318 276)"><rect width="92" height="36" rx="18" fill="none" stroke="${p.line}" stroke-width="2"/>` +
    `<text x="46" y="24" text-anchor="middle" font-family="${FONT}" font-weight="700" font-size="17" fill="${p.soft}">MIT</text></g>`
  return svg(
    1280,
    400,
    'Lemon Themes: a honey bear in a yellow beret blinks beside floating lemon stickers',
    `<defs>${ground(p)}${defs(['slice', 'heart', 'sparkle', 'leaf', 'bee', 'wings', 'daisy', 'lemon', 'jar', 'lemonade'])}${fb.defs}</defs>` +
      `<rect width="1280" height="400" rx="28" fill="${p.bg}"/><rect width="1280" height="400" rx="28" fill="url(#gh)"/>` +
      floats +
      title +
      `<ellipse cx="1060" cy="368" rx="110" ry="14" fill="#e8d6a6" opacity="${dark ? 0.25 : 0.6}"/>` +
      bear(1060, 366, 290, `<g>${SWAY}${fb.body}</g>`),
  )
}

// ---------- state cards ----------
function card(p: Pal, label: string, alt: string, inner: string, extraDefs: string[], seq: string, steps: [number, number][]) {
  const fb = flipbook(seq, steps)
  return svg(
    400,
    320,
    alt,
    `<defs>${ground(p)}${defs(extraDefs)}${fb.defs}</defs>` +
      `<rect width="400" height="320" rx="24" fill="${p.bg}"/><rect width="400" height="320" rx="24" fill="url(#gh)"/>` +
      `<ellipse cx="200" cy="268" rx="90" ry="11" fill="#e8d6a6" opacity=".6"/>` +
      inner.replace('%BEAR%', fb.body) +
      `<text x="200" y="304" text-anchor="middle" font-family="${FONT}" font-weight="700" font-size="18" fill="${p.soft}">${label}</text>`,
  )
}
function cards(p: Pal) {
  return {
    sit: card(p, '坐着：眨眼、轻轻摇', 'The bear sits, blinks and sways', bear(200, 266, 200, `<g>${SWAY}%BEAR%</g>`), [], 'idle', SIT),
    sleep: card(p, '10 分钟没动静就打盹', 'The bear naps and snores', bear(200, 266, 150, `%BEAR%${SNORE}`), [], 'sleep', SLEEP),
    hearts: card(p, '点它：跳一下，冒爱心', 'Click the bear: it hops and sends up hearts', bear(200, 266, 200, `<g>${HOP_LOOP}%BEAR%</g>${HEARTS}`), ['heart'], 'idle', SIT),
    party: card(p, '夸它、提交成功、测试通过：撒花', 'Praise, a commit or passing tests: the bear throws stickers', bear(200, 266, 200, `${CONFETTI}<g>${HOP_LOOP}%BEAR%</g>`), ['slice', 'heart', 'sparkle', 'daisy', 'lemon'], 'idle', SIT),
  }
}

// ---------- the usage band ----------
// What one skin's band is drawn from; the bear's own module by default.
type BandArt = { mascot: string; think: string; token: string; agents: string; coin: string; juiceGlass: (n: number) => string; limitRing: (n: number) => string }
const BEAR_BAND: BandArt = { mascot: ICONS.bear, think: ICONS.think, token: ICONS.honey, agents: ICONS.bee, coin: ICONS.coin, juiceGlass, limitRing }

function band(p: Pal, en = false, k: BandArt = BEAR_BAND) {
  const icon = (src: string, x: number, size = 30) =>
    src.replace('<svg ', `<svg x="${x}" y="${(64 - size) / 2}" width="${size}" height="${size}" `)
  const items: [string, string, number][] = [
    [k.mascot, 'Opus 5.5', 34], [k.think, en ? 'Effort med' : '思考 中', 26], [k.juiceGlass(42), en ? 'Context 42%' : '上下文 42%', 32], [k.token, '1.2M tok', 30],
    [k.agents, en ? '3 subagents' : '子 agent 3 次', 32], [k.coin, '≈ $4.20', 28],
    [k.limitRing(27), en ? '5h 27% · resets 11:00' : '5 小时 27% · 11:00 重置', 28], [k.limitRing(61), en ? 'Week 61% · resets Wed 15:00' : '每周 61% · 周三 15:00 重置', 28],
  ]
  let x = 26
  let body = ''
  let row = 0
  const rowW = 1228
  const parts: string[] = []
  for (const [src, label, size] of items) {
    // CJK glyphs are about twice as wide as Latin ones at this size
    const textW = [...label].reduce((a, ch) => a + (/[\u2E80-\u9FFF\uFF00-\uFFEF]/.test(ch) ? 22 : 12.5), 0)
    const w = size + 10 + textW + 34
    if (x + w > rowW) {
      row++
      x = 26
    }
    parts.push(`<g transform="translate(0 ${row * 60})">${icon(src, x, size)}<text x="${x + size + 10}" y="40" font-family="${FONT}" font-weight="600" font-size="22" fill="${p.ink}">${label}</text></g>`)
    x += w
  }
  body = parts.join('')
  const h = 64 + row * 60 + 8
  return svg(
    1280,
    h + 20,
    'The usage band: model, thinking effort, context, tokens, subagents, estimated cost and limits',
    `<rect x="10" y="10" width="1260" height="${h}" rx="20" fill="${p.card}" stroke="${p.line}" stroke-width="2"/>` +
      `<g transform="translate(0 12)">${body}</g>`,
  )
}

// ---------- write ----------
const write = (name: string, text: string) => {
  writeFileSync(join(OUT, name), text)
  console.log(`${name.padEnd(22)} ${(text.length / 1024).toFixed(0).padStart(4)} KB`)
}
for (const [mode, p, dark] of [['light', LIGHT, false], ['dark', DARK, true]] as const) {
  write(`hero-${mode}.svg`, hero(p, dark))
  for (const [k, v] of Object.entries(cards(p))) write(`state-${k}-${mode}.svg`, v)
  write(`band-${mode}.svg`, band(p))
  write(`band-en-${mode}.svg`, band(p, true))
}

// ---------- docs/index.html: the try-on page ----------
// The plugin's own backdrop (same code as in the app) behind a mock of the app's window:
// click the bear, click the margins, nap, celebrate, go dark.
// Every skin of the combined plugin, drawn by its own art.ts; the page switches between them.
const uri = (s: string) => 'data:image/svg+xml;utf8,' + encodeURIComponent(s)
const SKIN_DEFS = [
  { id: 'lemon-bear', cls: 'bear', name: ['柠檬小熊', 'Lemon bear'], pops: ['lemon', 'slice', 'daisy', 'heart', 'bee'], msg: ['lemon', 'bee', 'heart'],
    light: '.bg{fill:#fbf3d9}.gingham{opacity:.32}', dark: '.bg{fill:#1f1912}.gingham{opacity:.07}' },
  { id: 'meadow-sheep', cls: 'meadow', name: ['草地小羊', 'Meadow lamb'], pops: ['daisy', 'clover', 'heart', 'butterfly', 'wool'], msg: ['daisy', 'butterfly', 'heart'],
    light: '.bg{fill:#f5f8ec}.hatch{opacity:.55}.hill{fill:#cfe6a6}', dark: '.bg{fill:#151c14}.hatch{opacity:.12}.hill{fill:#2c3b22}' },
]
const SKINS: Record<string, unknown> = {}
for (const d of SKIN_DEFS) {
  const art = await import(join(ROOT, 'plugins', 'lemon-themes', 'hooks', 'skins', d.id, 'art.ts'))
  SKINS[d.id] = {
    cls: d.cls, name: d.name, light: d.light, dark: d.dark,
    scenes: { sit: art.scene(false), sleep: art.scene(true), bear: art.scene(false, { what: 'mascot', n: 1 }), party: art.scene(false, { what: 'party', n: 2 }) },
    pops: d.pops.map(k => uri(art.STICKERS[k])),
    msg: d.msg.map(k => uri(art.STICKERS[k])),
    badge: uri(art.BADGE),
    bands: d.id === 'lemon-bear' ? null : (() => {
      const I = art.ICONS
      const k: BandArt = { mascot: I.lamb, think: I.think, token: I.wool, agents: I.butterfly, coin: I.coin, juiceGlass: art.juiceGlass, limitRing: art.limitRing }
      const L: Pal = { ...LIGHT, ink: '#2f3a24', soft: '#5f6e4f', card: '#fdfef8', line: '#cfe3b0' }
      const D: Pal = { ...DARK, ink: '#eef4e2', soft: '#b5c4a0', card: '#1c251a', line: '#33432c' }
      return { 'light-zh': uri(band(L, false, k)), 'dark-zh': uri(band(D, false, k)), 'light-en': uri(band(L, true, k)), 'dark-en': uri(band(D, true, k)) }
    })(),
  }
}
const first = SKINS['lemon-bear'] as { msg: string[]; badge: string }
const sticker = (i: number) => first.msg[i] ?? ''
const BANDS = { 'light-zh': uri(band(LIGHT)), 'dark-zh': uri(band(DARK)), 'light-en': uri(band(LIGHT, true)), 'dark-en': uri(band(DARK, true)) }
// Every string on the page in both languages; data-t="key" picks one.
const TEXT: Record<string, [string, string]> = {
  title: ['Lemon Themes · 皮肤试穿', 'Lemon Themes · skin try-on'],
  h1: ['Lemon Themes', 'Lemon Themes'],
  hint: ['点右下角的吉祥物、点两边空白处，或者按右边的按钮换皮肤。它睡着时点哪里都能叫醒。', 'Click the mascot, click the margins, or switch skins with the buttons. A click anywhere wakes it up.'],
  skin: ['换皮肤', 'Switch skin'],
  nap: ['打个盹', 'Nap'],
  party: ['撒花', 'Celebrate'],
  dark: ['深色', 'Dark'],
  lang: ['English', '中文'],
  s1: ['Claude 桌面皮肤', 'Desktop app skins'],
  s2: ['周末做个小游戏', 'A weekend game'],
  s3: ['整理照片和相册', 'Sort the photo albums'],
  s4: ['读论文笔记', 'Paper reading notes'],
  m1: ['帮我给 App 换个皮肤 🌼', 'Give my app a new skin 🌼'],
  m2: ['好的！输入 /skin 就能选：柠檬小熊或草地小羊，还能关掉背景动画和特效。右下角的吉祥物会眨眼，十分钟没动静会睡觉。', 'Done! Type /skin to pick one: the lemon bear or the meadow lamb, and switch off motion or effects. The mascot in the corner blinks and naps after ten quiet minutes.'],
  m3: ['太可爱了！', 'So cute!'],
  m4: ['被夸了，它在撒花呢。输入框上面那条是用量：模型、思考强度、上下文、Token、子 agent、按 API 价折算的金额，还有 5 小时和每周额度。', 'You praised it, so it throws stickers. The band above the prompt is your usage: model, thinking effort, context, tokens, subagents, the equivalent cost at API prices, and the 5-hour and weekly limits.'],
  prompt: ['输入 / 以使用命令', 'Type / for commands'],
  install: ['安装：', 'Install: '],
  needs: ['需要 Claude Code 2.1.330+ · MIT', 'Needs Claude Code 2.1.330+ · MIT'],
}
const t = (k: string) => `<span data-t="${k}">${TEXT[k][0]}</span>`
const badge = first.badge

const page = `<!doctype html>
<html lang="zh">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${TEXT.title[0]}</title>
<meta name="description" content="Try on the Lemon Themes skins for the Claude desktop app: a lemon bear and a meadow lamb on storybook backdrops.">
<link rel="icon" href="${badge}">
<style>
  :root { --ink:#3b2a19; --soft:#7a6248; --card:#fffcf2; --line:#f0d98f; --user:#fff2b0; --user-line:#e6bf4a; --side:#fdf7e6ee; --glass:#fffbefcc; }
  .meadow { --ink:#2f3a24; --soft:#5f6e4f; --card:#fdfef8; --line:#cfe3b0; --user:#e6f3cf; --user-line:#a9cf7d; --side:#f9fbf2ee; --glass:#fdfef8cc; }
  .dark.meadow { --ink:#eef4e2; --soft:#b5c4a0; --card:#1c251a; --line:#33432c; --user:#2d3d22; --user-line:#5f8a3a; --side:#1c251aee; --glass:#232d20cc; }
  .dark { --ink:#fbf0d6; --soft:#cdb995; --card:#2a2219; --line:#4a3a26; --user:#4a3c1c; --user-line:#8a6d26; --side:#282016ee; --glass:#30271bcc; }
  * { box-sizing: border-box; }
  body { margin:0; font-family: ui-rounded, 'SF Pro Rounded', 'PingFang SC', 'Hiragino Maru Gothic ProN', system-ui, sans-serif; color: var(--ink); background:#e9dcb6; }
  .dark body, body.dark { background:#14100b; }
  body.meadow { background:#dfe9c8; } body.dark.meadow { background:#0f150d; }
  header { max-width: 1240px; margin: 28px auto 14px; padding: 0 20px; display:flex; align-items:center; gap:16px; flex-wrap:wrap; }
  header h1 { margin:0; font-size: 30px; letter-spacing:.5px; }
  header p { margin:0; color: var(--soft); }
  .controls { margin-left:auto; display:flex; gap:10px; }
  .controls button, .controls a { font: inherit; font-weight:700; border:2px solid var(--user-line); background: var(--user); color: var(--ink); padding: 8px 16px; border-radius: 999px; cursor:pointer; text-decoration:none; }
  .controls button[aria-pressed="true"] { box-shadow: inset 0 0 0 2px var(--user-line); }
  .window { position:relative; max-width:1240px; height: 720px; margin: 0 auto 28px; border-radius: 22px; overflow:hidden; box-shadow: 0 30px 80px #5a3b2240; border: 1px solid #00000014; }
  .backdrop { position:absolute; inset:0; }
  .backdrop svg { display:block; width:100%; height:100%; }
  .chrome { position:absolute; inset:0; display:grid; grid-template-columns: 240px 1fr; pointer-events:none; }
  .side { background: var(--side); backdrop-filter: blur(6px); padding: 54px 16px 16px; border-right: 1px solid #0000000f; pointer-events:auto; }
  .dots { position:absolute; top:16px; left:18px; display:flex; gap:8px; }
  .dots i { width:12px; height:12px; border-radius:50%; display:block; }
  .side .item { padding: 9px 12px; border-radius: 10px; color: var(--soft); font-size: 14px; }
  .side .item.on { background: #e6bf4a33; color: var(--ink); font-weight:700; }
  .main { position:relative; display:flex; flex-direction:column; align-items:center; padding: 40px 0 18px; }
  .chat { width: min(640px, 70%); display:flex; flex-direction:column; gap: 16px; pointer-events:auto; }
  .msg { position:relative; padding: 13px 18px; border-radius: 18px; line-height: 1.6; font-size: 15px; box-shadow: 0 3px 10px #7a4a2c22; }
  .msg.user { align-self:flex-end; background: var(--user); border: 2px solid var(--user-line); transform: rotate(-.6deg); max-width: 80%; }
  .msg.user.pink { background:#fde7ea; border-color:#eaa3b1; color:#3b2a19; transform: rotate(.5deg); }
  .msg.bot { background: var(--card); border: 1.5px solid var(--line); }
  .msg img.st { position:absolute; width: 34px; top:-22px; }
  .msg.user img.st { right: -10px; } .msg.bot img.st { left: -8px; }
  .dock { margin-top:auto; width: min(680px, 74%); pointer-events:auto; }
  .dock img { width:100%; display:block; }
  .prompt { margin-top: 8px; background: var(--card); border: 1.5px solid var(--line); border-radius: 16px; padding: 14px 18px; color: var(--soft); font-size: 15px; }
  .pop { position:absolute; width: 56px; pointer-events:none; animation: pop 1.6s ease-out forwards; }
  @keyframes pop { 0%{ transform: translate(-50%,-50%) scale(.3); opacity:0 } 15%{ transform: translate(-50%,-80%) scale(1.2); opacity:1 } 70%{ opacity:1 } 100%{ transform: translate(-50%,-160%) scale(1); opacity:0 } }
  footer { max-width:1240px; margin: 0 auto 40px; padding: 0 20px; color: var(--soft); font-size: 14px; display:flex; gap: 20px; flex-wrap:wrap; }
  footer code { background: var(--card); border: 1px solid var(--line); padding: 3px 8px; border-radius: 8px; color: var(--ink); }
  @media (max-width: 820px) { .chrome { grid-template-columns: 1fr; } .side { display:none; } .window { height: 640px; border-radius: 0; } }
</style>
</head>
<body>
<header>
  <img id="badge" src="${badge}" width="46" alt="">
  <div><h1>${t('h1')}</h1><p>${t('hint')}</p></div>
  <div class="controls">
    <button id="skin">${t('skin')}</button>
    <button id="nap" aria-pressed="false">${t('nap')}</button>
    <button id="party">${t('party')}</button>
    <button id="dark" aria-pressed="false">${t('dark')}</button>
    <button id="lang" lang="en">${t('lang')}</button>
    <a href="https://github.com/simpleciki/lemon-themes">GitHub</a>
  </div>
</header>
<div class="window" id="win">
  <div class="backdrop" id="bd"></div>
  <div class="chrome">
    <div class="side">
      <div class="dots"><i style="background:#ff5f57"></i><i style="background:#febc2e"></i><i style="background:#28c840"></i></div>
      <div class="item on">${t('s1')}</div><div class="item">${t('s2')}</div><div class="item">${t('s3')}</div><div class="item">${t('s4')}</div>
    </div>
    <div class="main" id="main">
      <div class="chat">
        <div class="msg user"><img class="st" src="${sticker(0)}" alt="">${t('m1')}</div>
        <div class="msg bot"><img class="st" src="${sticker(1)}" alt="">${t('m2')}</div>
        <div class="msg user pink"><img class="st" src="${sticker(2)}" alt="">${t('m3')}</div>
        <div class="msg bot">${t('m4')}</div>
      </div>
      <div class="dock"><img id="band" src="${BANDS['light-zh']}" alt="usage band"><div class="prompt">${t('prompt')}</div></div>
    </div>
  </div>
</div>
<footer>
  <span>${t('install')}<code>/plugin install lemon-themes --marketplace simpleciki/lemon-themes</code></span>
  <span>${t('needs')}</span>
</footer>
<script>
const SKINS = ${JSON.stringify(SKINS)};
const ORDER = ${JSON.stringify(SKIN_DEFS.map(d => d.id))};
let skin = new URLSearchParams(location.search).get('skin');
if (!ORDER.includes(skin)) skin = ORDER[0];
const BANDS = ${JSON.stringify(BANDS)};
const TEXT = ${JSON.stringify(TEXT)};
const bd = document.getElementById('bd'), win = document.getElementById('win');
let asleep = false, dark = false, timer = 0, pops = 0;
const q = new URLSearchParams(location.search).get('lang');
let en = q ? q === 'en' : !/^zh/i.test(navigator.language || '');
const setBand = () => { const B = SKINS[skin].bands || BANDS; document.getElementById('band').src = B[(dark ? 'dark' : 'light') + '-' + (en ? 'en' : 'zh')]; };
function setLang() {
  const i = en ? 1 : 0;
  document.documentElement.lang = en ? 'en' : 'zh';
  document.title = TEXT.title[i];
  document.querySelectorAll('[data-t]').forEach(el => { el.textContent = TEXT[el.dataset.t][i]; });
  document.getElementById('lang').lang = en ? 'zh' : 'en';
  setBand();
}
setLang();
const darken = s => dark ? s.replace(SKINS[skin].light, SKINS[skin].dark) : s;
function show(name, ms) {
  bd.innerHTML = darken(SKINS[skin].scenes[name]);
  clearTimeout(timer);
  if (ms) timer = setTimeout(() => show(asleep ? 'sleep' : 'sit'), ms);
}
function setSkin() {
  const k = SKINS[skin];
  ORDER.forEach(id => { document.body.classList.toggle(SKINS[id].cls, id === skin); document.documentElement.classList.toggle(SKINS[id].cls, id === skin); });
  document.getElementById('badge').src = k.badge;
  document.querySelectorAll('.msg img.st').forEach((im, i) => { im.src = k.msg[i] || k.msg[0]; });
  const next = SKINS[ORDER[(ORDER.indexOf(skin) + 1) % ORDER.length]];
  document.getElementById('skin').textContent = (en ? 'Switch to ' : '换成') + next.name[en ? 1 : 0];
  setBand();
  show(asleep ? 'sleep' : 'sit');
}
setSkin();
document.getElementById('skin').onclick = () => {
  skin = ORDER[(ORDER.indexOf(skin) + 1) % ORDER.length];
  const u = new URL(location.href); u.searchParams.set('skin', skin); history.replaceState(null, '', u);
  setSkin();
};
win.addEventListener('click', e => {
  if (e.target.closest('.chat, .dock, .side')) return;
  const r = win.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
  // as in the app: while the bear sleeps, a click anywhere on the margins wakes it
  if (asleep || (x > 0.84 && y > 0.5)) { asleep = false; napBtn(); show('bear', 3600); return; }
  const img = document.createElement('img');
  const P = SKINS[skin].pops; img.src = P[pops++ % P.length]; img.className = 'pop';
  img.style.left = (e.clientX - r.left) + 'px'; img.style.top = (e.clientY - r.top) + 'px';
  win.appendChild(img); setTimeout(() => img.remove(), 1700);
});
const napBtn = () => document.getElementById('nap').setAttribute('aria-pressed', String(asleep));
document.getElementById('nap').onclick = () => { asleep = !asleep; napBtn(); show(asleep ? 'sleep' : 'sit'); };
document.getElementById('party').onclick = () => { asleep = false; napBtn(); show('party', 3600); };
document.getElementById('dark').onclick = e => {
  dark = !dark; document.documentElement.classList.toggle('dark', dark); document.body.classList.toggle('dark', dark);
  e.currentTarget.setAttribute('aria-pressed', String(dark)); setBand();
  show(asleep ? 'sleep' : 'sit');
};
document.getElementById('lang').onclick = () => {
  en = !en; setLang(); setSkin();
  const u = new URL(location.href); u.searchParams.set('lang', en ? 'en' : 'zh'); history.replaceState(null, '', u);
};
</script>
</body>
</html>
`
// ---------- README pictures for the newer skins, cut straight from their backdrops ----------
// Their scenes follow the reader's light or dark mode by themselves (prefers-color-scheme inside).
const inside = (s: string) => s.slice(s.indexOf('>') + 1, s.lastIndexOf('</svg>'))
const frame = (s: string, vb: string, w: number, h: number) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" width="${w}" height="${h}"><svg x="0" y="0" width="1400" height="820">${inside(s)}</svg></svg>`
for (const d of SKIN_DEFS.filter(x => x.id !== 'lemon-bear')) {
  const k = SKINS[d.id] as { scenes: Record<string, string> }
  const dir = join(ROOT, 'assets', d.id)
  mkdirSync(dir, { recursive: true })
  const card = (name: string) => frame(k.scenes[name] ?? '', '1080 500 320 320', 320, 320)
  const files: [string, string][] = [
    ['hero.svg', frame(k.scenes.sit ?? '', '0 0 1400 820', 1400, 820)],
    ['state-sit.svg', card('sit')],
    ['state-sleep.svg', card('sleep')],
  ]
  for (const [f, text] of files) {
    writeFileSync(join(dir, f), text)
    console.log(`assets/${d.id}/${f.padEnd(16)} ${(text.length / 1024).toFixed(0).padStart(4)} KB`)
  }
}

mkdirSync(join(ROOT, 'docs'), { recursive: true })
writeFileSync(join(ROOT, 'docs', 'index.html'), page)
console.log(`docs/index.html        ${(page.length / 1024).toFixed(0).padStart(4)} KB`)
