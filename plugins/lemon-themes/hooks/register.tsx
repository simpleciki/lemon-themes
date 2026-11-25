// Lemon Themes: every skin in one plugin, chosen and tuned from the /skin pane.
// The skins themselves live in ./skins (art traced from Codex drawings); this file is the engine:
// the backdrop, the stickers, the usage band and pane, and the switches.

import { atom, read, update } from 'claude-code'
import type { Hook, Register, RenderChildren } from 'claude-code'

import type { Busy, Garden, Options, Poke, Snap, Talk, Tokens } from '../types'
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
import { cardFacts, cardSvg, cardText } from './card'
import { EMPTY_GARDEN, GARDEN_KEY, SVG_LIMIT, gardenLayer, localDay, overlay, parseGarden, plant, storedGarden, totals } from './garden'
import { WORDS, langFromEnv, pick } from './i18n'
import type { Lang, Words } from './i18n'
import { SKINS, skinById } from './skins/index'
import type { Cheer, Skin } from './skins/skin'
import { DEFAULT_OPTIONS, SWITCHES, savedOptions } from './state'
import { statusLayer, statusWhileCalling } from './status'
import { afterPlant, calmDown, greeting, lateNight, talkLayer } from './talk'

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
export const lang = atom({ plugin: 'lemon-themes', key: 'lang' } as const, 'zh')
// a skin with several looks: 'auto' follows the time, or the id of a look the person pinned
export const pin = atom({ plugin: 'lemon-themes', key: 'pin' } as const, 'auto')
// the look the clock gives now, refreshed each minute so the backdrop redraws at 18:00 and 6:00
export const look = atom({ plugin: 'lemon-themes', key: 'look' } as const, '')
// the garden as last read from $.store (one row per local day); ok: false = could not be read
export const garden = atom({ plugin: 'lemon-themes', key: 'garden' } as const, EMPTY_GARDEN)
// what the mascot shows Claude doing
export const busy = atom({ plugin: 'lemon-themes', key: 'busy' } as const, 'idle')
// the line the mascot is saying now, if any
export const talk = atom({ plugin: 'lemon-themes', key: 'talk' } as const, null)


const PRAISE = /(太好了|太棒|好棒|很棒|真棒|棒棒|好主意|好点子|完美|厉害|绝了|好看|喜欢|可爱|nice|great|awesome|perfect|love it|amazing|well done)/i
// How long each one-shot animation runs; the poke clears after it.
const POKE_MS: Record<Poke['what'], number> = { mascot: 3600, party: 3600, pop: 3400 }
// The mascot naps after this long without a message from the person.
const NAP_AFTER_MS = 10 * 60 * 1000
const USAGE = 'lemon-themes-usage'
const SKIN_PANE = 'lemon-themes-skins'
const CARD = 'lemon-themes-card'
// Assumed exchange rate for the CNY line; shown on the pane as an assumption.
const USD_TO_CNY = 7.1
const SCENES = new Set(SKINS.map(s => s.id))
const TESTS = /\b(npm|pnpm|yarn|bun)\s+(run\s+)?test\b|\bpytest\b|\bvitest\b|\bjest\b|\bcargo\s+test\b|\bgo\s+test\b|\bclaude\s+plugin\s+test\b|\/claude\s+plugin\s+test\b/
const COMMIT = /\bgit\s+commit\b/
// How long the worried face stays after a failed tool, before it goes back to busy.
const WORRY_MS = 5000
// How long a line stays up, and the least time between two ordinary lines (milestones skip the wait).
const TALK_MS = 9000
const TALK_GAP_MS = 10 * 60 * 1000

async function current($: Api): Promise<{ s: Skin; o: Options; lg: Lang; w: Words }> {
  const lg: Lang = (await read($, lang)) === 'en' ? 'en' : 'zh'
  return { s: skinById(await read($, skin)), o: await read($, options), lg, w: WORDS[lg] }
}

async function usePin($: Api, next: string) {
  await update($, pin, () => next)
  await $.store.set('pin', next)
}

/** The look a skin should draw now: the pinned one, else what the clock gives, else none. */
async function lookOf($: Api, s: Skin): Promise<string | undefined> {
  const p = await read($, pin)
  if (p !== 'auto' && s.variants?.some(v => v.id === p)) return p
  if (s.variantAt === undefined) return undefined
  return s.variantAt(await $.clock.now())
}

async function useLang($: Api, next: Lang) {
  await update($, lang, () => next)
  await $.store.set('lang', next)
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
  const { s, o, lg, w } = await current($)
  if (!o.cheers) return
  const lines = s.cheers[why][lg]
  const line = lines[Math.floor(Math.random() * lines.length)] ?? w.yay
  await update($, isAsleep, () => false)
  await play($, 'party')
  $.ui.toast(line)
}

// A click on the bare backdrop: on the mascot (lower right) it hops and sends up hearts;
// anywhere else a little sticker pops where the click landed.
function hit(x: number, y: number): 'mascot' | 'pop' {
  return y > 0.55 && x > 0.85 ? 'mascot' : 'pop'
}

/** Reads the garden from the store; an unreadable one is kept as { ok: false }, never as empty. */
async function readGarden($: Api): Promise<Garden> {
  try {
    return parseGarden(await $.store.get(GARDEN_KEY))
  } catch {
    return { ok: false, days: {}, why: 'read' }
  }
}

/** One more flower (a commit) or patch (an all-green test run) on today's row. Reads the store
 *  again first, so two sessions open at once both count; writes nothing over an unreadable record. */
async function recordGarden($: Api, what: 'commit' | 'green'): Promise<Garden | null> {
  const fresh = await readGarden($)
  if (!fresh.ok) {
    await update($, garden, () => fresh)
    return null
  }
  const grown = plant(fresh, localDay(await $.clock.now()), what)
  try {
    await $.store.set(GARDEN_KEY, storedGarden(grown))
    await update($, garden, () => grown)
    return grown
  } catch {
    await update($, garden, () => ({ ...grown, ok: false, why: 'write' as const }))
    return null
  }
}

// What the bubble shows now, kept here and not read back from `busy`: reads in one dispatch see
// the moment it started, and a permission prompt changes the bubble in the middle of a tool call.
let shown: Busy = 'idle'
let worryN = 0
async function setBusy($: Api, next: Busy) {
  if (shown === next) return
  shown = next
  await update($, busy, () => next)
  if (next === 'wait') await update($, isAsleep, () => false)
}

let lastTalk = -Infinity
let lastLate = -Infinity
let failsInRow = 0
/** Says a line for a while. An ordinary line waits its turn; a milestone always speaks. */
async function speak($: Api, text: string | null, isMilestone = false) {
  if (text === null || !(await read($, options)).talk) return
  const now = await $.clock.now()
  if (!isMilestone && now - lastTalk < TALK_GAP_MS) return
  lastTalk = now
  let mine = 0
  await update($, talk, (t: Talk | null) => {
    mine = (t?.n ?? 0) + 1
    return { text, n: mine }
  })
  $.clock.after(TALK_MS, () => {
    void update($, talk, (t: Talk | null) => (t !== null && t.n === mine ? null : t))
  })
}

/** A failure: the worried face for a few seconds, then back to busy if nothing else came since. */
async function worry($: Api) {
  const mine = ++worryN
  await setBusy($, 'worry')
  $.clock.after(WORRY_MS, () => {
    void (async () => {
      if (worryN === mine && shown === 'worry') await setBusy($, 'busy')
    })()
  })
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
    await setBusy($, 'busy')
    if (lastActive - lastLate > 60 * 60 * 1000) {
      const line = lateNight(lastActive, (await read($, lang)) === 'en' ? 'en' : 'zh')
      if (line !== null) {
        lastLate = lastActive
        await speak($, line, true)
      }
    }
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
    // the language chosen in /skin; before any choice, the system's (LANG)
    const savedLang = await $.store.get('lang')
    const startLang: Lang = savedLang === 'en' || savedLang === 'zh' ? savedLang : langFromEnv(await $.env.get('LANG'))
    await update($, lang, () => startLang)
    const savedPin = await $.store.get('pin')
    await update($, pin, () => (typeof savedPin === 'string' ? savedPin : 'auto'))
    await applyLook($, skinById(await read($, skin)))
    shown = 'idle'
    await update($, busy, () => 'idle')
    const g = await readGarden($)
    await update($, garden, () => g)
    lastTalk = -Infinity
    await speak($, greeting(g, await $.clock.now(), startLang))

    await $.command.register({ name: 'skin', description: WORDS[startLang].commandHelp })
    await refresh($)
    $.clock.every(5000, () => {
      void refresh($)
    })
    lastActive = await $.clock.now()
    $.clock.every(60 * 1000, () => {
      void (async () => {
        const o = await read($, options)
        const now = skinById(await read($, skin))
        const at = now.variantAt === undefined ? '' : now.variantAt(await $.clock.now())
        if (at !== (await read($, look))) await update($, look, () => at)
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
    if (/^(en|english|英文)$/i.test(arg)) await useLang($, 'en')
    if (/^(zh|chinese|中文)$/i.test(arg)) await useLang($, 'zh')
    const { s, lg, w } = await current($)
    if (/^(en|english|英文|zh|chinese|中文)$/i.test(arg)) {
      return { text: lg === 'en' ? 'Language: English.' : '语言：中文。' }
    }
    if (/^(auto|自动)$/i.test(arg)) {
      await usePin($, 'auto')
      return { text: w.lookAutoSet }
    }
    const pinned = s.variants?.find(v => v.id === arg.toLowerCase() || v.name.zh === arg)
    if (pinned !== undefined) {
      await usePin($, pinned.id)
      return { text: w.lookSet(pick(pinned.name, lg)) }
    }
    if (/^(usage|用量)/.test(arg)) {
      await refresh($)
      await update($, isBandHidden, () => false)
      await $.ui.open({ id: USAGE, title: w.usageTitle(pick(s.mascot, lg)) })
      return { text: w.usageOpened }
    }
    if (/^(share|card|小结|分享|卡片)/i.test(arg)) {
      await $.ui.open({ id: CARD, title: w.cardTitle })
      return { text: w.cardOpened }
    }
    if (/yay|撒花|庆祝/.test(arg)) {
      await celebrate($, 'yay')
      return { text: w.cheering(pick(s.mascot, lg)) }
    }
    if (/nap|sleep|睡|盹/.test(arg)) {
      await update($, isAsleep, () => true)
      return { text: w.napping(pick(s.mascot, lg)) }
    }
    const a = arg.toLowerCase()
    const chosen = SKINS.find(k => a !== '' && (k.id === a || k.aliases.some(x => a.includes(x.toLowerCase())) || k.name.zh.includes(arg)))
    if (chosen !== undefined) {
      await useSkin($, chosen.id)
      return { text: w.switched(pick(chosen.name, lg)) }
    }
    await $.ui.open({ id: SKIN_PANE, title: w.paneTitle })
    return { text: w.paneOpened }
  })

  on('tool.call', async ($, e, next) => {
    if (e.tool === 'Agent') {
      await update($, agentCalls, n => n + 1)
    }
    // a question Claude asks you holds the call until you answer: wave meanwhile
    await setBusy($, statusWhileCalling(e.tool))
    const ran = await next(e)
    if (ran.isError === true && ran.deny === undefined) {
      await worry($)
      failsInRow++
      if (failsInRow === 3) await speak($, calmDown((await read($, lang)) === 'en' ? 'en' : 'zh'))
    } else {
      failsInRow = 0
      // the prompt or question was answered: back to work
      await setBusy($, 'busy')
    }
    if (e.tool === 'Bash' && ran.deny === undefined && ran.isError !== true) {
      const cmd = e.command
      const what = COMMIT.test(cmd) ? 'commit' : TESTS.test(cmd) ? 'green' : null
      if (what !== null) {
        const grown = await recordGarden($, what)
        await celebrate($, what === 'commit' ? 'commit' : 'tests')
        if (grown !== null) {
          const lg: Lang = (await read($, lang)) === 'en' ? 'en' : 'zh'
          await speak($, afterPlant(grown, localDay(await $.clock.now()), what, lg), true)
        }
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

  // A permission prompt is about to ask you: the mascot waves until the call goes on (tool.call above).
  on('classic.PermissionRequest', async ($, e, next) => {
    await setBusy($, 'wait')
    return next(e)
  })

  // The thinking effort the main conversation's latest request carried.
  on('turn.step', async function* ($, e, next) {
    if (e.agentId === undefined) {
      const level = e.effort === undefined ? null : String(e.effort)
      await update($, effort, () => level)
      if (shown !== 'worry') await setBusy($, 'busy')
    }

    return yield* next(e)
  })

  on('turn.complete', async ($, e, next) => {
    if (e.agentId === undefined) {
      if (e.reason === 'error') await worry($)
      else await setBusy($, 'idle')
    }
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
    const lg: Lang = (await read($, lang)) === 'en' ? 'en' : 'zh'
    const asleep = o.nap && (await read($, isAsleep))
    const p = o.cheers && o.motion ? await read($, poke) : null
    await read($, look) // redraw when the clock moves to another look
    const variant = await lookOf($, s)
    const scene = s.scene(asleep, p, !o.motion, o.floaters, variant)
    // the status bubble, then the garden in whatever room is left under the app's limit
    // what is said: waiting for you first, then a line the mascot is saying, then worry or busy
    const state = o.status ? await read($, busy) : 'idle'
    const line = o.talk ? await read($, talk) : null
    const bubble = state === 'wait' || line === null ? statusLayer(state, lg) : talkLayer(line.text)
    const g = o.garden ? await read($, garden) : null
    const today = localDay(await $.clock.now())
    const flowers = g === null ? '' : gardenLayer(g, today, s.garden(variant), lg, SVG_LIMIT - scene.length - bubble.length)
    const svg = overlay(scene, flowers + bubble)

    // One SVG: the app plays SMIL in a single backdrop Svg (two stacked layers stayed still).
    // isInteractive: without it the app did not pass clicks on the backdrop to ui.pointer.
    return <Svg isInteractive source={o.motion ? svg : stillSvg(svg)} alt={pick(asleep ? s.alt.asleep : s.alt.awake, lg)} />
  })

  // A little sticker on each of the person's bubbles.
  on('ui.render', { component: 'UserMessage' }, async ($, e, next) => {
    const kind = e.props.origin.kind
    const isOwn = kind === 'composer' || kind === 'bridge' || kind === 'sdk'
    if ((e.surface !== 'desktop' && e.surface !== 'mobile') || !isOwn) {
      return next(e)
    }
    const { s, o, lg } = await current($)
    if (!o.bubbles) {
      return next(e)
    }
    const { Box, Svg } = $.ui.resolve(e)
    const sticker = s.userStickers[hash(e.props.text) % s.userStickers.length] ?? s.userStickers[0] ?? ''
    const source = o.motion ? sticker : stillSvg(sticker)

    return (
      <Box flexDirection="column">
        <Box flexDirection="row" justifyContent="flex-end" marginBottom={-1}>
          <Svg source={source} alt={pick(s.userStickerAlt, lg)} width={30} height={30} />
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
    const { s, o, lg } = await current($)
    if (!o.bubbles) {
      return next(e)
    }
    const { Box, Svg } = $.ui.resolve(e)

    return (
      <Box flexDirection="column">
        <Box flexDirection="row" marginBottom={-1}>
          <Svg source={o.motion ? s.reply.svg : stillSvg(s.reply.svg)} alt={pick(s.reply.alt, lg)} width={s.reply.width} height={s.reply.height} />
        </Box>
        {await next(e)}
      </Box>
    )
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    const st = await read($, snap)
    const hidden = await read($, isBandHidden)
    const { s, o, lg, w } = await current($)
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
          ic(s.icons.mascot, w.model, 20),
          <Text color={s.ink.heading} bold>
            {prettyModel(st.model)}
          </Text>,
        )}
        {item('effort', ic(s.icons.think, w.effort, 16), <Text>{w.effortShort(effortText(level, w))}</Text>)}
        {item(
          'ctx',
          rich ? ic(s.juiceGlass(pct), w.context, 20) : <Text color={(pct ?? 0) >= 80 ? 'danger' : s.ink.gauge}>{cells(pct)}</Text>,
          <Text color={(pct ?? 0) >= 80 ? 'danger' : undefined}>{w.contextShort(pct === null ? '—' : `${pct}%`)}</Text>,
        )}
        {item('tok', ic(s.icons.token, 'Token', 18), <Text>{short(totalTokens(t))} tok</Text>)}
        {item(
          'agents',
          ic(s.icons.agents, w.agents, 20),
          <Text>{w.agentsShort(calls, st.running.length)}</Text>,
        )}
        {item('usd', ic(s.icons.coin, w.cost, 18), <Text bold>≈ {money(st.usd)}</Text>)}
        {st.limits
          .filter(l => l.kind === 'five_hour' || l.kind === 'seven_day')
          .map(l =>
            item(
              l.kind,
              ic(s.limitRing(l.percentUsed), limitName(l.kind, w), 18),
              <Text color={l.percentUsed >= 80 ? 'danger' : undefined}>
                {l.kind === 'five_hour' ? w.fiveHour : w.week} {l.percentUsed}%
                <Text dimColor> · {resetShort(l.resetsAt, w)}</Text>
              </Text>,
            ),
          )}
        <Box flexDirection="row" gap={1} marginLeft={1}>
          <Button key="open" label={w.details} onPress={() => $.ui.open({ id: USAGE, title: w.usageTitle(pick(s.mascot, lg)) })} />
          <Button key="skin" label={w.skin} onPress={() => $.ui.open({ id: SKIN_PANE, title: w.paneTitle })} />
          <Button key="hide" label={w.hide} onPress={() => update($, isBandHidden, () => true)} />
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
    const pinNow = await read($, pin)
    const { o, lg, w } = await current($)

    return (
      <Box flexDirection="column" gap={1}>
        <Box flexDirection="row" alignItems="center" gap={1}>
          <Text weight="semibold">{w.language}</Text>
          {lg === 'zh' ? <Text dimColor>中文 ✓</Text> : <Button key="lang-zh" label="中文" onPress={() => useLang($, 'zh')} />}
          {lg === 'en' ? <Text dimColor>English ✓</Text> : <Button key="lang-en" label="English" onPress={() => useLang($, 'en')} />}
        </Box>
        <Text weight="semibold">{w.pickSkin}</Text>
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
            {isRich ? <ui.Svg source={stillSvg(k.badge)} alt={pick(k.name, lg)} width={48} height={48} /> : null}
            <Box flexDirection="column" flexGrow={1}>
              <Text bold color={k.ink.heading}>
                {pick(k.name, lg)}
              </Text>
              <Text dimColor size="footnote">
                {pick(k.blurb, lg)}
              </Text>
            </Box>
            {k.id === now ? (
              <Text dimColor>{w.inUse}</Text>
            ) : (
              <Button key={`use-${k.id}`} label={w.useThis} onPress={() => useSkin($, k.id)} />
            )}
          </Box>
        ))}

        {(() => {
          const cur = SKINS.find(k => k.id === now)
          if (cur?.variants === undefined) return null
          return (
            <Box flexDirection="row" alignItems="center" gap={1} flexWrap="wrap">
              <Text weight="semibold">{w.lookRow}</Text>
              {[{ id: 'auto', name: { zh: w.lookAuto, en: w.lookAuto } }, ...cur.variants].map(v =>
                pinNow === v.id ? (
                  <Text key={`look-${v.id}`} dimColor>
                    {pick(v.name, lg)} ✓
                  </Text>
                ) : (
                  <Button key={`look-${v.id}`} label={pick(v.name, lg)} onPress={() => usePin($, v.id)} />
                ),
              )}
            </Box>
          )
        })()}
        {await (async () => {
          const g = await read($, garden)
          const t = totals(g, localDay(await $.clock.now()))
          return (
            <Box flexDirection="column">
              <Text weight="semibold">{w.gardenTitle}</Text>
              {g.ok ? (
                <Text>{w.gardenStats(t.commits, t.today[0], t.green, t.days)}</Text>
              ) : (
                <Text color="danger">{g.why === 'write' ? w.gardenUnwritable : w.gardenUnreadable}</Text>
              )}
              <Text dimColor size="footnote">
                {w.gardenLocal}
              </Text>
            </Box>
          )
        })()}
        <Text weight="semibold">{w.switches}</Text>
        {SWITCHES.map(sw => (
          <Box key={sw.key} flexDirection="row" alignItems="center" justifyContent="space-between" gap={1}>
            <Box flexDirection="column" flexShrink={1}>
              <Text>{pick(sw.label, lg)}</Text>
              <Text dimColor size="footnote">
                {pick(sw.off, lg)}
              </Text>
            </Box>
            <Button key={`sw-${sw.key}`} label={o[sw.key] ? w.on : w.off} onPress={() => setOption($, sw.key, !o[sw.key])} />
          </Box>
        ))}
        <Box flexDirection="row" gap={1}>
          <Button key="all-on" label={w.allOn} onPress={() => SWITCHES.reduce((p, sw) => p.then(() => setOption($, sw.key, true)), Promise.resolve())} />
          <Button
            key="light"
            label={w.saver}
            onPress={() =>
              ['motion', 'floaters', 'cheers'].reduce((p, k) => p.then(() => setOption($, k as keyof Options, false)), Promise.resolve())
            }
          />
        </Box>
        <Text dimColor size="footnote">
          {w.footer}
        </Text>
      </Box>
    )
  })

  // /skin share: today's card, to screenshot and post, with its text one press from the clipboard.
  on('ui.render', { component: 'Pane', requestId: CARD }, async ($, e) => {
    const ui = $.ui.resolve(e)
    const { Box, Text, Button } = ui
    const { s, lg, w } = await current($)
    const g = await read($, garden)
    if (!g.ok) {
      return <Text color="danger">{g.why === 'write' ? w.gardenUnwritable : w.gardenUnreadable}</Text>
    }
    const now = await $.clock.now()
    const f = cardFacts(g, localDay(now))
    const words = cardText(f, lg)
    const isRich = (e.surface === 'desktop' || e.surface === 'mobile') && 'Svg' in ui
    const look = { name: pick(s.name, lg), badge: s.badge, kit: s.garden(await lookOf($, s)), heading: s.ink.heading, border: s.ink.border }

    return (
      <Box flexDirection="column" gap={1}>
        {isRich ? <ui.Svg source={stillSvg(cardSvg(f, look, lg))} alt={words} width={640} height={360} /> : <Text>{words}</Text>}
        <Box flexDirection="row" gap={1} alignItems="center">
          <Button key="copy" label={w.cardCopy} onPress={async () => {
            const r = await $.ui.copy({ text: words, surface: e.surface })
            $.ui.toast(r.isCopied ? w.cardCopied : w.cardNotCopied)
          }} />
        </Box>
        <Text dimColor size="footnote">
          {w.cardHow}
        </Text>
      </Box>
    )
  })

  on('ui.render', { component: 'Pane', requestId: USAGE }, async ($, e) => {
    const st = await read($, snap)
    const t = await read($, tokens)
    const calls = await read($, agentCalls)
    const level = await read($, effort)
    const { s, lg, w } = await current($)
    const ui = $.ui.resolve(e)
    const { Box, Text, Progress } = ui
    const isRich = e.surface === 'desktop' || e.surface === 'mobile'

    if (st === null) {
      return <Text dimColor>{w.counting(pick(s.mascot, lg))}</Text>
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
            <ui.Svg source={s.badge} alt={pick(s.name, lg)} isInteractive />
            <Box flexDirection="column">
              <Text size="heading" weight="bold" color={s.ink.heading}>
                {pick(s.name, lg)}
              </Text>
              <Text dimColor>{w.ledger}</Text>
            </Box>
          </Box>
        ) : (
          <Text bold>
            {s.emoji.title} {pick(s.name, lg)} {w.usageWord}
          </Text>
        )}

        {card(
          `${s.emoji.mascot} ${w.cardModel}`,
          <Box flexDirection="column">
            <Text size="title" weight="bold">
              {prettyModel(st.model)}
            </Text>
            {row(w.effort, level === null ? w.effortNone : `${effortText(level, w)} (${level})`)}
          </Box>,
        )}

        {card(
          `${s.emoji.context} ${w.cardContext}`,
          <Box flexDirection="column" gap={1}>
            <Progress
              label={w.used}
              value={st.contextPercent ?? 0}
              max={100}
              valueText={st.contextPercent === null ? w.noReading : `${st.contextPercent}%`}
              color={(st.contextPercent ?? 0) >= 80 ? 'danger' : s.ink.gauge}
            />
            {row(w.usedOfWindow, `${st.contextTokens === null ? '—' : short(st.contextTokens)} / ${short(st.contextWindow)} tokens`)}
          </Box>,
        )}

        {card(
          `${s.emoji.token} ${w.cardTokens}`,
          <Box flexDirection="column">
            {row(w.total, short(totalTokens(t)))}
            {row(w.input, short(t.input))}
            {row(w.output, short(t.output))}
            {row(w.cacheRead, short(t.cacheRead))}
            {row(w.cacheWrite, short(t.cacheWrite))}
          </Box>,
        )}

        {card(
          `${s.emoji.agents} ${w.cardAgents}`,
          <Box flexDirection="column" gap={1}>
            {row(w.sent, w.times(calls))}
            {row(w.running, w.count(st.running.length))}
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
          w.cardCost,
          <Box flexDirection="column" gap={1}>
            <Text size="title" weight="bold">
              ≈ {money(st.usd)}
              {cny === null ? '' : `  ≈ ¥${cny.toFixed(2)}`}
            </Text>
            <Text dimColor size="footnote">
              {w.costNote(USD_TO_CNY)}
              {st.hasUnknownPrice ? w.unknownPrice : ''}
            </Text>
          </Box>,
        )}

        {st.limits.length > 0 &&
          card(
            w.cardLimits,
            <Box flexDirection="column" gap={1}>
              {st.limits.map(l => (
                <Progress
                  label={`${limitName(l.kind, w)} ${resetText(l.resetsAt, w)}`}
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
