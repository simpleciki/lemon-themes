import { atom, read, update } from 'claude-code'
import type { Hook, Register, RenderChildren, ThemeMessageRule, ThemeSetArgs } from 'claude-code'

import type { Poke, Snap, Tokens } from '../types'
import { BADGE, ICONS, STICKERS, juiceGlass, limitRing, scene } from './art'

const USER_STICKERS = [STICKERS.lemon, STICKERS.slice, STICKERS.daisy, STICKERS.heart]

function hash(text: string): number {
  let h = 0
  for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) | 0
  return Math.abs(h)
}

// The same message always gets the same sticker.
function pick(text: string): string {
  return USER_STICKERS[hash(text) % USER_STICKERS.length] ?? STICKERS.lemon
}

// Message-row stickers sway (SMIL). No hover or click on them: pointer events never reach an Svg in
// a message row, and the hover-by-Box version blanked whole replies in the app.
import { makeColors } from './make-colors.js'

// ---------- look ----------

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

const BASE: ThemeSetArgs = {
  colors: theme,
  backdrop: { scene: 'lemon-bear' },
}

const LOOK: ThemeSetArgs = {
  ...BASE,
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
}

// ---------- state ----------

const NONE: Tokens = { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }
const snap = atom({ plugin: 'lemon-bear', key: 'snap' } as const, null)
const tokens = atom({ plugin: 'lemon-bear', key: 'tokens' } as const, NONE)
const agentCalls = atom({ plugin: 'lemon-bear', key: 'agentCalls' } as const, 0)
const isBandHidden = atom({ plugin: 'lemon-bear', key: 'isBandHidden' } as const, false)
const effort = atom({ plugin: 'lemon-bear', key: 'effort' } as const, null)
const isAsleep = atom({ plugin: 'lemon-bear', key: 'isAsleep' } as const, false)
const poke = atom({ plugin: 'lemon-bear', key: 'poke' } as const, null)

// ---------- happy moments ----------
const PRAISE = /(太好了|太棒|好棒|很棒|真棒|棒棒|好主意|好点子|完美|厉害|绝了|好看|喜欢|可爱|nice|great|awesome|perfect|love it|amazing|well done)/i
const CHEERS: Record<string, string[]> = {
  praise: ['小熊收到夸夸啦，开心转圈！', '柠檬汁加满，继续冲！', '这个点子闪闪发光～'],
  commit: ['提交成功！小熊给你盖了个章 🍋', '又一块砖稳稳放好了！'],
  tests: ['测试全绿，小熊跳起来了！', '全部通过，奖励一片柠檬～'],
  yay: ['耶！小熊为你撒花～', '今天也很棒！'],
}

type Api2 = Parameters<Hook<'session.start'>>[0]
// How long each part's one-shot animation runs; the poke clears after it.
const POKE_MS: Record<Poke['what'], number> = { bear: 3600, party: 3600, pop: 3400 }

async function play($: Api2, what: Poke['what'], x?: number, y?: number) {
  let mine = 0
  await update($, poke, (p: Poke | null) => {
    mine = (p?.n ?? 0) + 1
    return x === undefined || y === undefined ? { what, n: mine } : { what, n: mine, x, y }
  })
  $.clock.after(POKE_MS[what], () => {
    void update($, poke, (p: Poke | null) => (p !== null && p.n === mine ? null : p))
  })
}

async function celebrate($: Api2, why: keyof typeof CHEERS) {
  const lines = CHEERS[why] ?? CHEERS.yay ?? ['耶！']
  const line = lines[Math.floor(Math.random() * lines.length)] ?? '耶！'
  await update($, isAsleep, () => false)
  await play($, 'party')
  $.ui.toast(line)
}

// A click on the bare backdrop: on the bear (lower right) it hops and sends up hearts;
// anywhere else a little sticker pops where the click landed.
function hit(x: number, y: number): 'bear' | 'pop' {
  return y > 0.55 && x > 0.85 ? 'bear' : 'pop'
}

// The bear naps after this long without a message from the person.
const NAP_AFTER_MS = 10 * 60 * 1000

const PANE = 'lemon-bear-usage'
// Assumed exchange rate for the CNY line; shown on the pane as an assumption.
const USD_TO_CNY = 7.1

type Api = Parameters<Hook<'session.start'>>[0]

async function refresh($: Api) {
  const [usage, model, agents] = await Promise.all([$.session.usage(), $.session.model(), $.agent.list()])
  const next: Snap = {
    model,
    contextTokens: usage.context.tokens ?? null,
    contextWindow: usage.context.window,
    contextPercent: usage.context.percent ?? null,
    usd: usage.cost?.usd ?? null,
    hasUnknownPrice: usage.cost?.hasUnknownPrice === true,
    limits: usage.rateLimits.map(l => ({ kind: l.kind, percentUsed: l.percentUsed, resetsAt: l.resetsAt ?? null })),
    running: agents
      .filter(a => a.taskStatus === 'running' || a.taskStatus === 'pending')
      .map(a => ({
        id: a.id,
        label: a.description || a.label,
        model: a.model ?? '',
        tokenCount: a.tokenCount,
        usd: a.cost?.usd ?? null,
      })),
    startedAt: usage.startedAt,
  }
  await update($, snap, () => next)
}

// ---------- formatting ----------

function prettyModel(id: string): string {
  const m = /claude-([a-z]+)-(\d+)(?:-(\d+))?/i.exec(id)
  if (m === null) {
    return id
  }
  const word = m[1] ?? ''
  const name = word.charAt(0).toUpperCase() + word.slice(1)
  return m[3] !== undefined && m[3].length <= 2 ? `${name} ${m[2]}.${m[3]}` : `${name} ${m[2]}`
}

const EFFORT_NAMES: Record<string, string> = { low: '低', medium: '中', high: '高', xhigh: '很高', max: '最高' }
function effortText(v: string | null): string {
  if (v === null) return '默认'
  return EFFORT_NAMES[v] ?? v
}

function short(n: number): string {
  if (n >= 1e6) return `${(n / 1e6).toFixed(n >= 1e7 ? 0 : 1)}M`
  if (n >= 1e3) return `${(n / 1e3).toFixed(n >= 1e4 ? 0 : 1)}k`
  return String(n)
}

function money(usd: number | null): string {
  if (usd === null) return '—'
  return usd < 10 ? `$${usd.toFixed(2)}` : `$${usd.toFixed(1)}`
}

function limitName(kind: string): string {
  if (kind === 'five_hour') return '5 小时额度'
  if (kind === 'seven_day') return '7 天额度'
  if (kind === 'spend_limit') return '花费上限'
  return kind
}

function resetText(iso: string | null): string {
  if (iso === null) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getMonth() + 1}/${d.getDate()} ${p(d.getHours())}:${p(d.getMinutes())} 重置`
}

const WEEKDAYS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
function resetShort(iso: string | null): string {
  if (iso === null) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const p = (n: number) => String(n).padStart(2, '0')
  const hm = `${p(d.getHours())}:${p(d.getMinutes())}`
  const sameDay = d.toDateString() === new Date().toDateString()
  return sameDay ? `${hm} 重置` : `${WEEKDAYS[d.getDay()]} ${hm} 重置`
}

const totalTokens = (t: Tokens) => t.input + t.output + t.cacheRead + t.cacheWrite

function juice(percent: number | null): string {
  // ten lemon-juice cells, a cheap text gauge for the band
  const filled = Math.round((percent ?? 0) / 10)
  return '●'.repeat(filled) + '○'.repeat(10 - filled)
}

// ---------- hooks ----------

export const register: Register = on => {
  let lastActive = 0

  on('prompt.submit', async ($, e, next) => {
    lastActive = await $.clock.now()
    await update($, isAsleep, () => false)
    if (PRAISE.test(e.text)) {
      await celebrate($, 'praise')
    }

    return next(e)
  })

  on('session.start', async ($, e, next) => {
    const unpainted = problems.find(line => line.startsWith("Desktop won't paint"))
    if (unpainted !== undefined) {
      $.ui.log(`lemon-bear: ${unpainted}`)
    }
    try {
      const set = await $.theme.set(LOOK)
      if (!set.isDrawn) {
        $.ui.log(`lemon-bear: ${set.reason}`)
      }
    } catch (error) {
      $.ui.log(`lemon-bear: style refused, using colours + scene only: ${String(error)}`)
      await $.theme.set(BASE)
    }
    await $.command.register({ name: 'lemon', description: '打开柠檬小熊用量面板' })
    await refresh($)
    $.clock.every(5000, () => {
      void refresh($)
    })
    lastActive = await $.clock.now()
    $.clock.every(60 * 1000, () => {
      void (async () => {
        if ((await $.clock.now()) - lastActive > NAP_AFTER_MS) {
          await update($, isAsleep, () => true)
        }
      })()
    })

    return next(e)
  })

  on('command.run', { command: 'lemon' }, async ($, e) => {
    if (/yay|撒花|庆祝/.test(e.args ?? '')) {
      await celebrate($, 'yay')

      return { text: '小熊撒花中～' }
    }
    if (/nap|sleep|睡|盹/.test(e.args ?? '')) {
      await update($, isAsleep, () => true)

      return { text: '小熊趴下睡了，点两边空白处就会醒。' }
    }
    await refresh($)
    await update($, isBandHidden, () => false)
    await $.ui.open({ id: PANE, title: '小熊用量' })

    return { text: '柠檬小熊用量面板已打开。' }
  })

  on('tool.call', async ($, e, next) => {
    if (e.tool === 'Agent') {
      await update($, agentCalls, n => n + 1)
    }
    const ran = await next(e)
    if (e.tool === 'Bash' && ran.deny === undefined && ran.isError !== true) {
      const cmd = e.command
      if (/\bgit\s+commit\b/.test(cmd)) {
        await celebrate($, 'commit')
      } else if (/\b(npm|pnpm|yarn|bun)\s+(run\s+)?test\b|\bpytest\b|\bvitest\b|\bjest\b|\bcargo\s+test\b|\bgo\s+test\b/.test(cmd)) {
        await celebrate($, 'tests')
      }
    }

    return ran
  })

  // A click on the bare backdrop: work out what it landed on and play that part once.
  on('ui.pointer', async ($, e, next) => {
    // While the bear sleeps, a click anywhere on the margins wakes it.
    const wasAsleep = await read($, isAsleep)
    const what = wasAsleep ? 'bear' : hit(e.x, e.y)
    {
      await play($, what, what === 'pop' ? e.x : undefined, what === 'pop' ? e.y : undefined)
      if (what === 'bear') {
        // waking the bear counts as activity, or the nap timer puts it straight back to sleep
        lastActive = await $.clock.now()
        await update($, isAsleep, () => false)
      }
    }

    return next(e)
  })

  // The thinking effort the main conversation's latest request carried.
  on('turn.step', async function* ($, e, next) {
    if (e.agentId === undefined) {
      const level = e.effort === undefined ? null : String(e.effort)
      await update($, effort, () => level)
    }

    return yield* next(e)
  })

  on('turn.complete', async ($, e, next) => {
    const u = e.usage
    if (u !== undefined) {
      await update($, tokens, t => ({
        input: t.input + u.input_tokens,
        output: t.output + u.output_tokens,
        cacheRead: t.cacheRead + u.cache_read_input_tokens,
        cacheWrite: t.cacheWrite + u.cache_creation_input_tokens,
      }))
    }
    await refresh($)

    return next(e)
  })

  on('ui.render', { component: 'Backdrop' }, async ($, e, next) => {
    if (e.props.scene !== 'lemon-bear' || (e.surface !== 'desktop' && e.surface !== 'mobile')) {
      return next(e)
    }
    const { Svg } = $.ui.resolve(e)
    const asleep = await read($, isAsleep)
    const p = await read($, poke)

    // One SVG: the app plays SMIL in a single backdrop Svg (two stacked layers stayed still).
    // isInteractive: without it the app did not pass clicks on the backdrop to ui.pointer.
    return <Svg isInteractive source={scene(asleep, p)} alt={asleep ? '小熊趴着睡着了' : '漂浮的柠檬贴纸和抱着柠檬的小熊'} />
  })

  // A little sticker on each of the person's bubbles: sways, hops on hover, spins on click.
  on('ui.render', { component: 'UserMessage' }, async ($, e, next) => {
    const kind = e.props.origin.kind
    const isOwn = kind === 'composer' || kind === 'bridge' || kind === 'sdk'
    if ((e.surface !== 'desktop' && e.surface !== 'mobile') || !isOwn) {
      return next(e)
    }
    const { Box, Svg } = $.ui.resolve(e)

    return (
      <Box flexDirection="column">
        <Box flexDirection="row" justifyContent="flex-end" marginBottom={-1}>
          <Svg source={pick(e.props.text)} alt="柠檬小贴纸" width={30} height={30} />
        </Box>
        {await next(e)}
      </Box>
    )
  })

  // A bee on the first block of each reply.
  on('ui.render', { component: 'AssistantMessage' }, async ($, e, next) => {
    if ((e.surface !== 'desktop' && e.surface !== 'mobile') || !e.props.isFirstOfReply) {
      return next(e)
    }
    const { Box, Svg } = $.ui.resolve(e)

    return (
      <Box flexDirection="column">
        <Box flexDirection="row" marginBottom={-1}>
          <Svg source={STICKERS.bee} alt="小蜜蜂贴纸" width={32} height={34} />
        </Box>
        {await next(e)}
      </Box>
    )
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    const s = await read($, snap)
    const hidden = await read($, isBandHidden)
    if (e.props.hasSurvey || hidden || s === null) {
      return next(e)
    }
    const t = await read($, tokens)
    const calls = await read($, agentCalls)
    const level = await read($, effort)
    const ui = $.ui.resolve(e)
    const { Box, Text, Button } = ui
    const pct = s.contextPercent
    const rich = (e.surface === 'desktop' || e.surface === 'mobile') && 'Svg' in ui
    const ic = (src: string, alt: string, px = 18) => (rich ? <ui.Svg source={src} alt={alt} width={px} height={px} /> : null)

    const item = (key: string, icon: RenderChildren, text: RenderChildren) => (
      <Box key={key} flexDirection="row" alignItems="center" gap={1}>
        {icon}
        {text}
      </Box>
    )

    return (
      <Box flexDirection="row" columnGap={2} rowGap={1} alignItems="center" flexWrap="wrap">
        {item(
          'model',
          ic(ICONS.bear, '模型', 20),
          <Text color="#b9781a" bold>
            {prettyModel(s.model)}
          </Text>,
        )}
        {item('effort', ic(ICONS.think, '思考强度', 16), <Text>思考 {effortText(level)}</Text>)}
        {item(
          'ctx',
          rich ? ic(juiceGlass(pct), '上下文用量', 20) : <Text color={(pct ?? 0) >= 80 ? 'danger' : '#d99a00'}>{juice(pct)}</Text>,
          <Text color={(pct ?? 0) >= 80 ? 'danger' : undefined}>上下文 {pct === null ? '—' : `${pct}%`}</Text>,
        )}
        {item('tok', ic(ICONS.honey, 'Token', 18), <Text>{short(totalTokens(t))} tok</Text>)}
        {item(
          'agents',
          ic(ICONS.bee, '子 agent', 20),
          <Text>
            子 agent {calls} 次{s.running.length > 0 ? `（${s.running.length} 个在跑）` : ''}
          </Text>,
        )}
        {item('usd', ic(ICONS.coin, '等价金额', 18), <Text bold>≈ {money(s.usd)}</Text>)}
        {s.limits
          .filter(l => l.kind === 'five_hour' || l.kind === 'seven_day')
          .map(l =>
            item(
              l.kind,
              ic(limitRing(l.percentUsed), limitName(l.kind), 18),
              <Text color={l.percentUsed >= 80 ? 'danger' : undefined}>
                {l.kind === 'five_hour' ? '5 小时' : '每周'} {l.percentUsed}%
                <Text dimColor> · {resetShort(l.resetsAt)}</Text>
              </Text>,
            ),
          )}
        <Box flexDirection="row" gap={1} marginLeft={1}>
          <Button key="open" label="详情" onPress={() => $.ui.open({ id: PANE, title: '小熊用量' })} />
          <Button key="hide" label="收起" onPress={() => update($, isBandHidden, () => true)} />
        </Box>
      </Box>
    )
  })

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const s = await read($, snap)
    const t = await read($, tokens)
    const calls = await read($, agentCalls)
    const level = await read($, effort)
    const ui = $.ui.resolve(e)
    const { Box, Text, Progress } = ui
    const isRich = e.surface === 'desktop' || e.surface === 'mobile'

    if (s === null) {
      return <Text dimColor>小熊正在榨柠檬汁…（等第一次回复后就有数字）</Text>
    }

    const card = (title: string, body: RenderChildren) => (
      <Box
        flexDirection="column"
        gap={1}
        padding={1}
        borderStyle="round"
        borderColor="#e6bf4a"
        backgroundColor={isRich ? 'surface-1' : undefined}
      >
        <Text weight="semibold" color="#b9781a">
          {title}
        </Text>
        {body}
      </Box>
    )

    const row = (label: string, value: string) => (
      <Box flexDirection="row" justifyContent="space-between">
        <Text dimColor>{label}</Text>
        <Text tabular>{value}</Text>
      </Box>
    )

    const cny = s.usd === null ? null : s.usd * USD_TO_CNY

    return (
      <Box flexDirection="column" gap={1}>
        {isRich && 'Svg' in ui ? (
          <Box flexDirection="row" alignItems="center" gap={1}>
            <ui.Svg source={BADGE} alt="小熊抱柠檬" isInteractive />
            <Box flexDirection="column">
              <Text size="heading" weight="bold" color="#b9781a">
                Lemon Bear
              </Text>
              <Text dimColor>本 session 的用量小账本</Text>
            </Box>
          </Box>
        ) : (
          <Text bold>🍋🐻 Lemon Bear 用量</Text>
        )}

        {card(
          '🐻 模型',
          <Box flexDirection="column">
            <Text size="title" weight="bold">
              {prettyModel(s.model)}
            </Text>
            {row('思考强度', level === null ? '默认（还没读数）' : `${effortText(level)}（${level}）`)}
          </Box>,
        )}

        {card(
          '🍋 上下文',
          <Box flexDirection="column" gap={1}>
            <Progress
              label="已用"
              value={s.contextPercent ?? 0}
              max={100}
              valueText={s.contextPercent === null ? '还没读数' : `${s.contextPercent}%`}
              color={(s.contextPercent ?? 0) >= 80 ? 'danger' : '#e0a800'}
            />
            {row('已用 / 窗口', `${s.contextTokens === null ? '—' : short(s.contextTokens)} / ${short(s.contextWindow)} tokens`)}
          </Box>,
        )}

        {card(
          '🍯 Token（主对话 + 子 agent，本次加载起累计）',
          <Box flexDirection="column">
            {row('合计', short(totalTokens(t)))}
            {row('输入', short(t.input))}
            {row('输出', short(t.output))}
            {row('缓存读', short(t.cacheRead))}
            {row('缓存写', short(t.cacheWrite))}
          </Box>,
        )}

        {card(
          '🐝 子 agent',
          <Box flexDirection="column" gap={1}>
            {row('本 session 派出', `${calls} 次`)}
            {row('正在跑', `${s.running.length} 个`)}
            {s.running.slice(0, 6).map(a => (
              <Box key={a.id} flexDirection="row" justifyContent="space-between">
                <Text wrap="truncate-end">• {a.label}</Text>
                <Text dimColor tabular>
                  {short(a.tokenCount)} · {money(a.usd)}
                </Text>
              </Box>
            ))}
          </Box>,
        )}

        {card(
          '💰 等价金额（按 API 定价折算）',
          <Box flexDirection="column" gap={1}>
            <Text size="title" weight="bold">
              ≈ {money(s.usd)}
              {cny === null ? '' : `  ≈ ¥${cny.toFixed(2)}`}
            </Text>
            <Text dimColor size="footnote">
              估算值，不是账单。订阅额度内不按美元扣钱；人民币按 1 美元≈{USD_TO_CNY} 元粗算。
              {s.hasUnknownPrice ? ' 含未知定价的模型，按其他模型价格估。' : ''}
            </Text>
          </Box>,
        )}

        {s.limits.length > 0 &&
          card(
            '⏳ 订阅额度',
            <Box flexDirection="column" gap={1}>
              {s.limits.map(l => (
                <Progress
                  label={`${limitName(l.kind)} ${resetText(l.resetsAt)}`}
                  value={Math.min(100, l.percentUsed)}
                  max={100}
                  valueText={`${l.percentUsed}%`}
                  color={l.percentUsed >= 80 ? 'danger' : '#6f9e4c'}
                />
              ))}
            </Box>,
          )}
      </Box>
    )
  })
}
