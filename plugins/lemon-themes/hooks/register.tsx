// Lemon Themes: every skin in one plugin, chosen and tuned from the /skin pane.
// The skins themselves live in ./skins (art traced from Codex drawings); this file is the engine:
// the backdrop, the stickers, the usage band and pane, and the switches.

import { atom, read, update } from 'claude-code'
import type { Hook, Register, RenderChildren } from 'claude-code'

import type { Options, Poke, Snap, Tokens } from '../types'
import {
  cells,
  effortText,
  hash,
  limitName,
  money,
  prettyModel,
  resetShort,
  resetText,
  short,
  stillSvg,
  totalTokens,
} from './format'
import { SKINS, skinById } from './skins/index'
import type { Cheer, Skin } from './skins/skin'
import { DEFAULT_OPTIONS, SWITCHES, savedOptions } from './state'

type Api = Parameters<Hook<'session.start'>>[0]

// The engine lists every value a module reads and writes from atoms declared in this file.
const NONE: Tokens = { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }

export const skin = atom({ plugin: 'lemon-themes', key: 'skin' } as const, 'lemon-bear')
export const options = atom({ plugin: 'lemon-themes', key: 'options' } as const, DEFAULT_OPTIONS)
export const snap = atom({ plugin: 'lemon-themes', key: 'snap' } as const, null)
export const tokens = atom({ plugin: 'lemon-themes', key: 'tokens' } as const, NONE)
export const agentCalls = atom({ plugin: 'lemon-themes', key: 'agentCalls' } as const, 0)
export const isBandHidden = atom({ plugin: 'lemon-themes', key: 'isBandHidden' } as const, false)
export const effort = atom({ plugin: 'lemon-themes', key: 'effort' } as const, null)
export const isAsleep = atom({ plugin: 'lemon-themes', key: 'isAsleep' } as const, false)
export const poke = atom({ plugin: 'lemon-themes', key: 'poke' } as const, null)


const PRAISE = /(太好了|太棒|好棒|很棒|真棒|棒棒|好主意|好点子|完美|厉害|绝了|好看|喜欢|可爱|nice|great|awesome|perfect|love it|amazing|well done)/i
// How long each one-shot animation runs; the poke clears after it.
const POKE_MS: Record<Poke['what'], number> = { mascot: 3600, party: 3600, pop: 3400 }
// The mascot naps after this long without a message from the person.
const NAP_AFTER_MS = 10 * 60 * 1000
const USAGE = 'lemon-themes-usage'
const SKIN_PANE = 'lemon-themes-skins'
// Assumed exchange rate for the CNY line; shown on the pane as an assumption.
const USD_TO_CNY = 7.1
const SCENES = new Set(SKINS.map(s => s.id))

async function current($: Api): Promise<{ s: Skin; o: Options }> {
  return { s: skinById(await read($, skin)), o: await read($, options) }
}

async function applyLook($: Api, s: Skin) {
  const unpainted = s.problems.find(line => line.startsWith("Desktop won't paint"))
  if (unpainted !== undefined) {
    $.ui.log(`lemon-themes/${s.id}: ${unpainted}`)
  }
  try {
    const set = await $.theme.set(s.look)
    if (!set.isDrawn) {
      $.ui.log(`lemon-themes/${s.id}: ${set.reason}`)
    }
  } catch (error) {
    $.ui.log(`lemon-themes/${s.id}: style refused, using colours + scene only: ${String(error)}`)
    await $.theme.set(s.base)
  }
}

async function useSkin($: Api, id: string) {
  const s = skinById(id)
  await update($, skin, () => s.id)
  await $.store.set('skin', s.id)
  await applyLook($, s)
}

async function setOption($: Api, key: keyof Options, value: boolean) {
  await update($, options, o => ({ ...o, [key]: value }))
  await $.store.set('options', await read($, options))
  if (key === 'nap' && !value) {
    await update($, isAsleep, () => false)
  }
}

async function play($: Api, what: Poke['what'], x?: number, y?: number) {
  let mine = 0
  await update($, poke, (p: Poke | null) => {
    mine = (p?.n ?? 0) + 1
    return x === undefined || y === undefined ? { what, n: mine } : { what, n: mine, x, y }
  })
  $.clock.after(POKE_MS[what], () => {
    void update($, poke, (p: Poke | null) => (p !== null && p.n === mine ? null : p))
  })
}

async function celebrate($: Api, why: Cheer) {
  const { s, o } = await current($)
  if (!o.cheers) return
  const lines = s.cheers[why]
  const line = lines[Math.floor(Math.random() * lines.length)] ?? '耶！'
  await update($, isAsleep, () => false)
  await play($, 'party')
  $.ui.toast(line)
}

// A click on the bare backdrop: on the mascot (lower right) it hops and sends up hearts;
// anywhere else a little sticker pops where the click landed.
function hit(x: number, y: number): 'mascot' | 'pop' {
  return y > 0.55 && x > 0.85 ? 'mascot' : 'pop'
}

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
    // what the person chose last time, kept by $.store between sessions
    const savedSkin = await $.store.get('skin')
    await update($, skin, () => skinById(typeof savedSkin === 'string' ? savedSkin : SKINS[0]?.id ?? '').id)
    const savedOpts = await $.store.get('options')
    await update($, options, () => savedOptions(savedOpts))
    await applyLook($, skinById(await read($, skin)))

    await $.command.register({ name: 'skin', description: '换皮肤、开关动画和特效（Lemon Themes）' })
    await refresh($)
    $.clock.every(5000, () => {
      void refresh($)
    })
    lastActive = await $.clock.now()
    $.clock.every(60 * 1000, () => {
      void (async () => {
        const o = await read($, options)
        if (o.nap && (await $.clock.now()) - lastActive > NAP_AFTER_MS) {
          await update($, isAsleep, () => true)
        }
      })()
    })

    return next(e)
  })

  // /skin opens the pane; /skin <name> switches; /skin usage, /skin nap, /skin yay
  on('command.run', { command: 'skin' }, async ($, e) => {
    const arg = (e.args ?? '').trim()
    const { s } = await current($)
    if (/^(usage|用量)/.test(arg)) {
      await refresh($)
      await update($, isBandHidden, () => false)
      await $.ui.open({ id: USAGE, title: `${s.mascot}用量` })
      return { text: '用量面板已打开。' }
    }
    if (/yay|撒花|庆祝/.test(arg)) {
      await celebrate($, 'yay')
      return { text: `${s.mascot}撒花中～` }
    }
    if (/nap|sleep|睡|盹/.test(arg)) {
      await update($, isAsleep, () => true)
      return { text: `${s.mascot}睡了，点两边空白处就会醒。` }
    }
    const pick = SKINS.find(k => arg !== '' && (k.id === arg || k.name.includes(arg) || k.mascot.includes(arg)))
    if (pick !== undefined) {
      await useSkin($, pick.id)
      return { text: `已换成「${pick.name}」。` }
    }
    await $.ui.open({ id: SKIN_PANE, title: '皮肤' })
    return { text: '皮肤面板已打开：选皮肤，或者关掉不想要的动画和特效。' }
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
    const wasAsleep = await read($, isAsleep)
    const { o } = await current($)
    const what = wasAsleep ? 'mascot' : hit(e.x, e.y)
    if (what === 'mascot') {
      // waking the mascot counts as activity, or the nap timer puts it straight back to sleep
      lastActive = await $.clock.now()
      await update($, isAsleep, () => false)
    }
    if (o.cheers && o.motion) {
      await play($, what, what === 'pop' ? e.x : undefined, what === 'pop' ? e.y : undefined)
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
    if (!SCENES.has(e.props.scene ?? '') || (e.surface !== 'desktop' && e.surface !== 'mobile')) {
      return next(e)
    }
    const { Svg } = $.ui.resolve(e)
    const s = skinById(e.props.scene ?? '')
    const o = await read($, options)
    const asleep = o.nap && (await read($, isAsleep))
    const p = o.cheers && o.motion ? await read($, poke) : null
    const svg = s.scene(asleep, p, !o.motion, o.floaters)

    // One SVG: the app plays SMIL in a single backdrop Svg (two stacked layers stayed still).
    // isInteractive: without it the app did not pass clicks on the backdrop to ui.pointer.
    return <Svg isInteractive source={o.motion ? svg : stillSvg(svg)} alt={asleep ? s.alt.asleep : s.alt.awake} />
  })

  // A little sticker on each of the person's bubbles.
  on('ui.render', { component: 'UserMessage' }, async ($, e, next) => {
    const kind = e.props.origin.kind
    const isOwn = kind === 'composer' || kind === 'bridge' || kind === 'sdk'
    if ((e.surface !== 'desktop' && e.surface !== 'mobile') || !isOwn) {
      return next(e)
    }
    const { s, o } = await current($)
    if (!o.bubbles) {
      return next(e)
    }
    const { Box, Svg } = $.ui.resolve(e)
    const sticker = s.userStickers[hash(e.props.text) % s.userStickers.length] ?? s.userStickers[0] ?? ''
    const source = o.motion ? sticker : stillSvg(sticker)

    return (
      <Box flexDirection="column">
        <Box flexDirection="row" justifyContent="flex-end" marginBottom={-1}>
          <Svg source={source} alt={s.userStickerAlt} width={30} height={30} />
        </Box>
        {await next(e)}
      </Box>
    )
  })

  // A sticker on the first block of each reply.
  on('ui.render', { component: 'AssistantMessage' }, async ($, e, next) => {
    if ((e.surface !== 'desktop' && e.surface !== 'mobile') || !e.props.isFirstOfReply) {
      return next(e)
    }
    const { s, o } = await current($)
    if (!o.bubbles) {
      return next(e)
    }
    const { Box, Svg } = $.ui.resolve(e)

    return (
      <Box flexDirection="column">
        <Box flexDirection="row" marginBottom={-1}>
          <Svg source={o.motion ? s.reply.svg : stillSvg(s.reply.svg)} alt={s.reply.alt} width={s.reply.width} height={s.reply.height} />
        </Box>
        {await next(e)}
      </Box>
    )
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    const st = await read($, snap)
    const hidden = await read($, isBandHidden)
    const { s, o } = await current($)
    if (e.props.hasSurvey || hidden || !o.band || st === null) {
      return next(e)
    }
    const t = await read($, tokens)
    const calls = await read($, agentCalls)
    const level = await read($, effort)
    const ui = $.ui.resolve(e)
    const { Box, Text, Button } = ui
    const pct = st.contextPercent
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
          ic(s.icons.mascot, '模型', 20),
          <Text color={s.ink.heading} bold>
            {prettyModel(st.model)}
          </Text>,
        )}
        {item('effort', ic(s.icons.think, '思考强度', 16), <Text>思考 {effortText(level)}</Text>)}
        {item(
          'ctx',
          rich ? ic(s.juiceGlass(pct), '上下文用量', 20) : <Text color={(pct ?? 0) >= 80 ? 'danger' : s.ink.gauge}>{cells(pct)}</Text>,
          <Text color={(pct ?? 0) >= 80 ? 'danger' : undefined}>上下文 {pct === null ? '—' : `${pct}%`}</Text>,
        )}
        {item('tok', ic(s.icons.token, 'Token', 18), <Text>{short(totalTokens(t))} tok</Text>)}
        {item(
          'agents',
          ic(s.icons.agents, '子 agent', 20),
          <Text>
            子 agent {calls} 次{st.running.length > 0 ? `（${st.running.length} 个在跑）` : ''}
          </Text>,
        )}
        {item('usd', ic(s.icons.coin, '等价金额', 18), <Text bold>≈ {money(st.usd)}</Text>)}
        {st.limits
          .filter(l => l.kind === 'five_hour' || l.kind === 'seven_day')
          .map(l =>
            item(
              l.kind,
              ic(s.limitRing(l.percentUsed), limitName(l.kind), 18),
              <Text color={l.percentUsed >= 80 ? 'danger' : undefined}>
                {l.kind === 'five_hour' ? '5 小时' : '每周'} {l.percentUsed}%
                <Text dimColor> · {resetShort(l.resetsAt)}</Text>
              </Text>,
            ),
          )}
        <Box flexDirection="row" gap={1} marginLeft={1}>
          <Button key="open" label="详情" onPress={() => $.ui.open({ id: USAGE, title: `${s.mascot}用量` })} />
          <Button key="skin" label="皮肤" onPress={() => $.ui.open({ id: SKIN_PANE, title: '皮肤' })} />
          <Button key="hide" label="收起" onPress={() => update($, isBandHidden, () => true)} />
        </Box>
      </Box>
    )
  })

  // The /skin pane: pick a skin, and switch parts of it off.
  on('ui.render', { component: 'Pane', requestId: SKIN_PANE }, async ($, e) => {
    const ui = $.ui.resolve(e)
    const { Box, Text, Button } = ui
    const isRich = (e.surface === 'desktop' || e.surface === 'mobile') && 'Svg' in ui
    const now = await read($, skin)
    const o = await read($, options)

    return (
      <Box flexDirection="column" gap={1}>
        <Text weight="semibold">选皮肤</Text>
        {SKINS.map(k => (
          <Box
            key={k.id}
            flexDirection="row"
            alignItems="center"
            gap={1}
            padding={1}
            borderStyle="round"
            borderColor={k.id === now ? k.ink.border : undefined}
            backgroundColor={isRich && k.id === now ? 'surface-1' : undefined}
          >
            {isRich ? <ui.Svg source={stillSvg(k.badge)} alt={k.name} width={48} height={48} /> : null}
            <Box flexDirection="column" flexGrow={1}>
              <Text bold color={k.ink.heading}>
                {k.name}
              </Text>
              <Text dimColor size="footnote">
                {k.blurb}
              </Text>
            </Box>
            {k.id === now ? (
              <Text dimColor>使用中</Text>
            ) : (
              <Button key={`use-${k.id}`} label="换成这个" onPress={() => useSkin($, k.id)} />
            )}
          </Box>
        ))}

        <Text weight="semibold">开关</Text>
        {SWITCHES.map(sw => (
          <Box key={sw.key} flexDirection="row" alignItems="center" justifyContent="space-between" gap={1}>
            <Box flexDirection="column" flexShrink={1}>
              <Text>{sw.label}</Text>
              <Text dimColor size="footnote">
                {sw.off}
              </Text>
            </Box>
            <Button key={`sw-${sw.key}`} label={o[sw.key] ? '开 · 点一下关掉' : '关 · 点一下打开'} onPress={() => setOption($, sw.key, !o[sw.key])} />
          </Box>
        ))}
        <Box flexDirection="row" gap={1}>
          <Button key="all-on" label="全部打开" onPress={() => SWITCHES.reduce((p, sw) => p.then(() => setOption($, sw.key, true)), Promise.resolve())} />
          <Button
            key="light"
            label="省电模式"
            onPress={() =>
              ['motion', 'floaters', 'cheers'].reduce((p, k) => p.then(() => setOption($, k as keyof Options, false)), Promise.resolve())
            }
          />
        </Box>
        <Text dimColor size="footnote">
          设置会记住，下次打开 App 还在。命令：/skin 小羊、/skin 小熊、/skin usage、/skin nap。
        </Text>
      </Box>
    )
  })

  on('ui.render', { component: 'Pane', requestId: USAGE }, async ($, e) => {
    const st = await read($, snap)
    const t = await read($, tokens)
    const calls = await read($, agentCalls)
    const level = await read($, effort)
    const { s } = await current($)
    const ui = $.ui.resolve(e)
    const { Box, Text, Progress } = ui
    const isRich = e.surface === 'desktop' || e.surface === 'mobile'

    if (st === null) {
      return <Text dimColor>{s.mascot}正在数数…（等第一次回复后就有数字）</Text>
    }

    const card = (title: string, body: RenderChildren) => (
      <Box flexDirection="column" gap={1} padding={1} borderStyle="round" borderColor={s.ink.border} backgroundColor={isRich ? 'surface-1' : undefined}>
        <Text weight="semibold" color={s.ink.heading}>
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

    const cny = st.usd === null ? null : st.usd * USD_TO_CNY

    return (
      <Box flexDirection="column" gap={1}>
        {isRich && 'Svg' in ui ? (
          <Box flexDirection="row" alignItems="center" gap={1}>
            <ui.Svg source={s.badge} alt={s.name} isInteractive />
            <Box flexDirection="column">
              <Text size="heading" weight="bold" color={s.ink.heading}>
                {s.name}
              </Text>
              <Text dimColor>本 session 的用量小账本</Text>
            </Box>
          </Box>
        ) : (
          <Text bold>
            {s.emoji.title} {s.name} 用量
          </Text>
        )}

        {card(
          `${s.emoji.mascot} 模型`,
          <Box flexDirection="column">
            <Text size="title" weight="bold">
              {prettyModel(st.model)}
            </Text>
            {row('思考强度', level === null ? '默认（还没读数）' : `${effortText(level)}（${level}）`)}
          </Box>,
        )}

        {card(
          `${s.emoji.context} 上下文`,
          <Box flexDirection="column" gap={1}>
            <Progress
              label="已用"
              value={st.contextPercent ?? 0}
              max={100}
              valueText={st.contextPercent === null ? '还没读数' : `${st.contextPercent}%`}
              color={(st.contextPercent ?? 0) >= 80 ? 'danger' : s.ink.gauge}
            />
            {row('已用 / 窗口', `${st.contextTokens === null ? '—' : short(st.contextTokens)} / ${short(st.contextWindow)} tokens`)}
          </Box>,
        )}

        {card(
          `${s.emoji.token} Token（主对话 + 子 agent，本次加载起累计）`,
          <Box flexDirection="column">
            {row('合计', short(totalTokens(t)))}
            {row('输入', short(t.input))}
            {row('输出', short(t.output))}
            {row('缓存读', short(t.cacheRead))}
            {row('缓存写', short(t.cacheWrite))}
          </Box>,
        )}

        {card(
          `${s.emoji.agents} 子 agent`,
          <Box flexDirection="column" gap={1}>
            {row('本 session 派出', `${calls} 次`)}
            {row('正在跑', `${st.running.length} 个`)}
            {st.running.slice(0, 6).map(a => (
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
              ≈ {money(st.usd)}
              {cny === null ? '' : `  ≈ ¥${cny.toFixed(2)}`}
            </Text>
            <Text dimColor size="footnote">
              估算值，不是账单。订阅额度内不按美元扣钱；人民币按 1 美元≈{USD_TO_CNY} 元粗算。
              {st.hasUnknownPrice ? ' 含未知定价的模型，按其他模型价格估。' : ''}
            </Text>
          </Box>,
        )}

        {st.limits.length > 0 &&
          card(
            '⏳ 订阅额度',
            <Box flexDirection="column" gap={1}>
              {st.limits.map(l => (
                <Progress
                  label={`${limitName(l.kind)} ${resetText(l.resetsAt)}`}
                  value={Math.min(100, l.percentUsed)}
                  max={100}
                  valueText={`${l.percentUsed}%`}
                  color={l.percentUsed >= 80 ? 'danger' : s.ink.ok}
                />
              ))}
            </Box>,
          )}
      </Box>
    )
  })
}
