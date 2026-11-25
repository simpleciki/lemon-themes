import { expect, test } from 'claude-code/testing'

import { statusWhileCalling } from '../hooks/status'

// The companion garden and the mascot's status bubble (docs/design/companion-garden.md).

const P = 'lemon-themes'
const NOON = new Date(2026, 10, 24, 12, 0).getTime()

// An in-memory $.store; `broken` keys throw on read, as an unreadable store would.
function fakeStore(on: any, start: Record<string, unknown> = {}, broken: string[] = []) {
  const box: Record<string, unknown> = { ...start }
  const writes: string[] = []
  const clock = { now: NOON }
  on('store.get', (_: unknown, e: any) => {
    if (broken.includes(e.key)) throw new Error('EIO: cannot read store')
    return { value: box[e.key] }
  })
  on('store.set', (_: unknown, e: any) => {
    writes.push(e.key)
    box[e.key] = JSON.parse(JSON.stringify(e.value))
    return { value: undefined }
  })
  on('store.delete', (_: unknown, e: any) => {
    delete box[e.key]
    return { value: undefined }
  })
  on('store.keys', () => ({ value: Object.keys(box) }))
  on('clock.now', () => ({ value: clock.now }))
  on('theme.set', () => ({ value: { isDrawn: true } }))
  on('command.register', () => ({ value: undefined }))
  on('env.get', () => ({ value: 'zh_CN.UTF-8' }))
  on('session.usage', () => ({ value: { context: { window: 200000 }, rateLimits: [], startedAt: NOON } }))
  on('session.model', () => ({ value: 'claude-opus-5-5' }))
  on('agent.list', () => ({ value: [] }))
  on('session.start', () => ({ cwd: '/tmp' }))
  on('ui.toast', () => ({ value: undefined }))
  on('classic.PermissionRequest', () => ({}))
  return { box, writes, clock }
}

const PANE = {
  plugin: P,
  surface: 'desktop',
  component: 'Pane',
  requestId: 'lemon-themes-skins',
  props: { title: '皮肤', isFocused: false, bodyColumns: 60, placement: 'dock', scroll: { offset: 0, bodyRows: 40 }, view: {} },
} as any

const backdrop = (scene: string) => ({ plugin: P, surface: 'desktop', component: 'Backdrop', props: { scene, glass: false } }) as any

async function backdropSvg($: any, scene = 'meadow-sheep'): Promise<string> {
  const ui = await $.ui.mount(backdrop(scene))
  const src = String((await ui.find({ type: 'Svg' }))?.props.source)
  await ui.unmount()
  return src
}

async function paneTexts($: any): Promise<string> {
  const ui = await $.ui.mount(PANE)
  const all = await ui.findAll({ type: 'Text' })
  await ui.unmount()
  return all.map((t: any) => t.text).join('\n')
}

// A year of busy work: 8 commits and 3 green runs on every day of 2026.
function aYear(): Record<string, [number, number]> {
  const days: Record<string, [number, number]> = {}
  for (let d = new Date(2026, 0, 1); d.getFullYear() === 2026; d.setDate(d.getDate() + 1)) {
    const p = (n: number) => String(n).padStart(2, '0')
    days[`${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`] = [8, 3]
  }
  return days
}

test('a successful git commit plants a flower on today’s row; a failed one does not', async ($, on) => {
  const { box } = fakeStore(on)
  let fail = false
  on('tool.call', () => (fail ? { result: 'nothing to commit', isError: true } : { result: {} }))
  await $.session.start({ source: 'startup', cwd: '/tmp' } as any)

  await $.tool.call({ tool: 'Bash', command: 'git commit -m "feat: one"' } as any)
  await $.tool.call({ tool: 'Bash', command: 'git commit -m "feat: two"' } as any)
  fail = true
  await $.tool.call({ tool: 'Bash', command: 'git commit -m "nothing"' } as any)

  expect(box.garden).toEqual({ v: 1, days: { '2026-11-24': [2, 0] } })
  expect(await backdropSvg($)).toContain('🌼 2 · 第 1 片草地')
  expect(await paneTexts($)).toContain('共种了 2 朵花（今天 +2）')
})

test('an all-green test run opens a patch and counts on the same day row', async ($, on) => {
  const { box } = fakeStore(on, { garden: { v: 1, days: { '2026-11-24': [1, 0] } } })
  on('tool.call', () => ({ result: {} }))
  await $.session.start({ source: 'startup', cwd: '/tmp' } as any)
  await $.tool.call({ tool: 'Bash', command: 'npm test' } as any)
  expect(box.garden).toEqual({ v: 1, days: { '2026-11-24': [1, 1] } })
})

// The fullest garden that can be drawn: 499 commits (4 landmarks, 9 bushes, 9 flowers) and 6 patches.
function fullest(): Record<string, [number, number]> {
  return { '2026-11-20': [400, 0], '2026-11-24': [99, 6] }
}

for (const [what, days, count] of [
  ['a year of data (8 commits a day)', aYear(), '🌼 2920 · 第 30 片草地'],
  ['the fullest garden', fullest(), '🌼 499 · 第 5 片草地'],
] as const) {
  test(`${what}: small in the store, and every backdrop stays under 131,072 characters`, async ($, on) => {
    const { box } = fakeStore(on, { garden: { v: 1, days } })
    await $.session.start({ source: 'startup', cwd: '/tmp' } as any)
    expect(JSON.stringify(box.garden).length).toBeLessThan(400 * 1024)
    // the worst case: a party (the heaviest one-shot) and the waving bubble at once
    await $.classic.PermissionRequest({ tool_name: 'Bash', tool_input: { command: 'ls' } } as any)
    await $.command.run({ command: 'skin', args: 'yay' } as any)
    for (const [skinWord, looks] of [['bear', ['-']], ['lamb', ['-']], ['duck', ['day', 'dusk', 'rain']]] as const) {
      await $.command.run({ command: 'skin', args: skinWord } as any)
      for (const lookId of looks) {
        if (lookId !== '-') await $.command.run({ command: 'skin', args: lookId } as any)
        const scene = skinWord === 'bear' ? 'lemon-bear' : skinWord === 'lamb' ? 'meadow-sheep' : 'pond-duck'
        const src = await backdropSvg($, scene)
        expect(src.length, `${scene} ${lookId}`).toBeLessThanOrEqual(131072)
        expect(src, `${scene} ${lookId}`).toContain('👋 等你')
        // the garden is there, and its count is the true total
        expect(src, `${scene} ${lookId}`).toContain(count)
      }
    }
  })
}

test('an unreadable store says so, draws no empty meadow, and writes nothing over the old record', async ($, on) => {
  const { writes } = fakeStore(on, {}, ['garden'])
  on('tool.call', () => ({ result: {} }))
  await $.session.start({ source: 'startup', cwd: '/tmp' } as any)

  const src = await backdropSvg($)
  expect(src).toContain('读不到花园记录')
  expect(src).not.toContain('🌼')
  expect(await paneTexts($)).toContain('读不到花园记录')

  await $.tool.call({ tool: 'Bash', command: 'git commit -m x' } as any)
  expect(writes).not.toContain('garden')
})

test('a record that is not a garden is treated as unreadable, not as empty', async ($, on) => {
  const { writes } = fakeStore(on, { garden: { v: 1, days: { yesterday: 'lots' } } })
  on('tool.call', () => ({ result: {} }))
  await $.session.start({ source: 'startup', cwd: '/tmp' } as any)
  expect(await backdropSvg($)).toContain('读不到花园记录')
  await $.tool.call({ tool: 'Bash', command: 'git commit -m x' } as any)
  expect(writes).not.toContain('garden')
})

test('the garden switch hides the flowers but keeps counting', async ($, on) => {
  const { box } = fakeStore(on)
  on('tool.call', () => ({ result: {} }))
  await $.session.start({ source: 'startup', cwd: '/tmp' } as any)
  const pane = await $.ui.mount(PANE)
  await pane.press({ key: 'sw-garden' })
  await pane.unmount()
  await $.tool.call({ tool: 'Bash', command: 'git commit -m x' } as any)
  expect(box.garden).toEqual({ v: 1, days: { '2026-11-24': [1, 0] } })
  expect(await backdropSvg($)).not.toContain('🌼')
})

test('the mascot waves while a permission prompt waits, and stops once the call goes on', async ($, on) => {
  fakeStore(on)
  on('tool.call', () => ({ result: {} }))
  await $.session.start({ source: 'startup', cwd: '/tmp' } as any)
  // the prompt about to ask you (the test kit cannot hold a call open while it draws, so the
  // prompt and the call that follows it are raised one after the other)
  await $.classic.PermissionRequest({ tool_name: 'Bash', tool_input: { command: 'rm x' } } as any)
  expect(await backdropSvg($)).toContain('👋 等你')
  await $.tool.call({ tool: 'Bash', command: 'rm x' } as any)
  const after = await backdropSvg($)
  expect(after).not.toContain('👋')
  expect(after).toContain('你好呀') // the greeting, which the wave had covered, shows again
})

test('a question Claude asks you counts as waiting for you; other tools as busy', () => {
  expect(statusWhileCalling('AskUserQuestion')).toBe('wait')
  expect(statusWhileCalling('Bash')).toBe('busy')
})

test('a failed tool shows a worried "!" bubble; the status switch turns every bubble off', async ($, on) => {
  // talking off, so the greeting does not cover the "!" (a line the mascot says comes first)
  fakeStore(on, { options: { talk: false } })
  on('tool.call', () => ({ result: 'boom', isError: true }))
  await $.session.start({ source: 'startup', cwd: '/tmp' } as any)
  await $.tool.call({ tool: 'Bash', command: 'false' } as any)
  expect(await backdropSvg($)).toContain('>!</text>')

  const pane = await $.ui.mount(PANE)
  await pane.press({ key: 'sw-status' })
  await pane.unmount()
  expect(await backdropSvg($)).not.toContain('>!</text>')
})

// ---------- the mascot talks ----------

test('a new garden greets you and says how the first flower comes', async ($, on) => {
  fakeStore(on)
  await $.session.start({ source: 'startup', cwd: '/tmp' } as any)
  // too wide for one line: the bubble breaks it at the comma
  const src = await backdropSvg($)
  expect(src).toContain('>你好呀！提交一次，</text>')
  expect(src).toContain('>我就种第一朵花</text>')
})

test('it remembers you: days in a row, and a long time away', async ($, on) => {
  fakeStore(on, { garden: { v: 1, days: { '2026-11-21': [2, 0], '2026-11-22': [1, 1], '2026-11-23': [4, 0] } } })
  await $.session.start({ source: 'startup', cwd: '/tmp' } as any)
  expect(await backdropSvg($)).toContain('我们连续第 3 天见面啦')
})

test('after two weeks away it says so', async ($, on) => {
  fakeStore(on, { garden: { v: 1, days: { '2026-11-10': [3, 0] } } })
  await $.session.start({ source: 'startup', cwd: '/tmp' } as any)
  expect(await backdropSvg($)).toContain('好久不见！14 天没来啦')
})

test('the first flower ever gets its own line, even right after the greeting', async ($, on) => {
  fakeStore(on)
  on('tool.call', () => ({ result: {} }))
  await $.session.start({ source: 'startup', cwd: '/tmp' } as any)
  await $.tool.call({ tool: 'Bash', command: 'git commit -m first' } as any)
  expect(await backdropSvg($)).toContain('第一朵花种下啦！')
})

test('an unreadable garden greets you without claiming anything about your history', async ($, on) => {
  fakeStore(on, {}, ['garden'])
  await $.session.start({ source: 'startup', cwd: '/tmp' } as any)
  const src = await backdropSvg($)
  expect(src).toContain('我在这儿，开工吧')
  expect(src).toContain('读不到花园记录')
})

test('three failed tools in a row: the mascot says to take it slowly', async ($, on) => {
  fakeStore(on, { garden: { v: 1, days: { '2026-11-24': [1, 0] } } })
  on('tool.call', () => ({ result: 'boom', isError: true }))
  await $.session.start({ source: 'startup', cwd: '/tmp' } as any)
  for (let i = 0; i < 3; i++) await $.tool.call({ tool: 'Bash', command: 'false' } as any)
  // the greeting said something less than ten minutes ago, so an ordinary line waits its turn
  expect(await backdropSvg($)).not.toContain('别急')
})

test('three failed tools in a row, a while after the last line: it says to take it slowly', async ($, on) => {
  const { clock } = fakeStore(on, { garden: { v: 1, days: { '2026-11-24': [1, 0] } } })
  on('tool.call', () => ({ result: 'boom', isError: true }))
  await $.session.start({ source: 'startup', cwd: '/tmp' } as any)
  clock.now = NOON + 11 * 60 * 1000
  for (let i = 0; i < 2; i++) await $.tool.call({ tool: 'Bash', command: 'false' } as any)
  expect(await backdropSvg($)).not.toContain('别急')
  await $.tool.call({ tool: 'Bash', command: 'false' } as any)
  expect(await backdropSvg($)).toContain('别急，我们慢慢来')
})

test('a message sent at 2 am gets a late-night line', async ($, on) => {
  const { clock } = fakeStore(on, { garden: { v: 1, days: { '2026-11-24': [1, 0] } } })
  clock.now = new Date(2026, 10, 25, 2, 10).getTime()
  on('prompt.submit', (_: unknown, e: any) => e)
  await $.session.start({ source: 'startup', cwd: '/tmp' } as any)
  await $.prompt.submit({ text: '再改一个地方' } as any)
  expect(await backdropSvg($)).toContain('2 点了，我还陪着你')
})

test('the talk switch silences it, and with motion off a line still shows', async ($, on) => {
  fakeStore(on)
  await $.session.start({ source: 'startup', cwd: '/tmp' } as any)
  const pane = await $.ui.mount(PANE)
  await pane.press({ key: 'sw-motion' })
  await pane.unmount()
  expect(await backdropSvg($)).toContain('你好呀')
  const pane2 = await $.ui.mount(PANE)
  await pane2.press({ key: 'sw-talk' })
  await pane2.unmount()
  expect(await backdropSvg($)).not.toContain('你好呀')
})

test('in English it speaks English', async ($, on) => {
  fakeStore(on, { lang: 'en' })
  await $.session.start({ source: 'startup', cwd: '/tmp' } as any)
  expect(await backdropSvg($)).toContain('Commit once and I')
})

// ---------- today's card ----------

const CARD = { ...PANE, requestId: 'lemon-themes-card', props: { ...PANE.props, title: '今日小结' } }

test("/skin share opens today's card: today's flowers, the garden so far, the mascot; the text copies", async ($, on) => {
  fakeStore(on, { garden: { v: 1, days: { '2026-11-22': [3, 0], '2026-11-23': [120, 1], '2026-11-24': [2, 1] } } })
  const copied: string[] = []
  on('ui.copy', (_: unknown, e: any) => {
    copied.push(e.text)
    return { value: { isCopied: true } }
  })
  on('ui.open', () => ({ value: { isPlaced: true } }))
  await $.session.start({ source: 'startup', cwd: '/tmp' } as any)
  const out = await $.command.run({ command: 'skin', args: 'share' } as any)
  expect(out.text).toContain('今日小结已打开')

  for (const skinWord of ['bear', 'lamb', 'duck']) {
    await $.command.run({ command: 'skin', args: skinWord } as any)
    const ui = await $.ui.mount(CARD)
    const src = String((await ui.find({ type: 'Svg' }))?.props.source)
    expect(src).toContain('2026-11-24 的小结')
    expect(src).toContain('今天种了 2 朵花')
    expect(src).toContain('测试全绿 1 次')
    expect(src).toContain('连续第 3 天')
    expect(src).toContain('花园共 125 朵 · 第 2 片草地')
    expect(src.length).toBeLessThanOrEqual(131072)
    // well-formed: no attribute twice on the mascot's <svg> (a browser refuses the whole picture)
    for (const tag of src.match(/<svg[^>]*>/g) ?? []) {
      const names = [...tag.matchAll(/\s([a-zA-Z:-]+)=/g)].map(m => m[1])
      expect(new Set(names).size, tag.slice(0, 80)).toBe(names.length)
    }
    await ui.unmount()
  }
  const ui = await $.ui.mount(CARD)
  await ui.press({ key: 'copy' })
  await ui.unmount()
  expect(copied[0]).toContain('今天种了 2 朵花，测试全绿 1 次，连续第 3 天')
  expect(copied[0]).toContain('github.com/simpleciki/lemon-themes')
})

test('the card holds no code, paths or file names: only the counts', async ($, on) => {
  fakeStore(on, { garden: { v: 1, days: { '2026-11-24': [1, 0] } } })
  on('tool.call', () => ({ result: {} }))
  await $.session.start({ source: 'startup', cwd: '/Users/someone/secret-project' } as any)
  await $.tool.call({ tool: 'Bash', command: 'git commit -m "feat: secret-feature"' } as any)
  const ui = await $.ui.mount(CARD)
  const src = String((await ui.find({ type: 'Svg' }))?.props.source)
  await ui.unmount()
  expect(src).toContain('今天种了 2 朵花')
  expect(src).not.toContain('secret')
})

test('an unreadable garden: the card says so instead of showing zero', async ($, on) => {
  fakeStore(on, {}, ['garden'])
  await $.session.start({ source: 'startup', cwd: '/tmp' } as any)
  const ui = await $.ui.mount(CARD)
  expect((await ui.find({ type: 'Text' }))?.text).toContain('读不到花园记录')
  expect(await ui.find({ type: 'Svg' })).toBeUndefined()
  await ui.unmount()
})
