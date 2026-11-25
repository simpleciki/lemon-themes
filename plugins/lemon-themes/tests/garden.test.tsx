import { expect, test } from 'claude-code/testing'

import { statusWhileCalling } from '../hooks/status'

// The companion garden and the mascot's status bubble (docs/design/companion-garden.md).

const P = 'lemon-themes'
const NOON = new Date(2026, 10, 24, 12, 0).getTime()

// An in-memory $.store; `broken` keys throw on read, as an unreadable store would.
function fakeStore(on: any, start: Record<string, unknown> = {}, broken: string[] = []) {
  const box: Record<string, unknown> = { ...start }
  const writes: string[] = []
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
  on('clock.now', () => ({ value: NOON }))
  on('theme.set', () => ({ value: { isDrawn: true } }))
  on('command.register', () => ({ value: undefined }))
  on('env.get', () => ({ value: 'zh_CN.UTF-8' }))
  on('session.usage', () => ({ value: { context: { window: 200000 }, rateLimits: [], startedAt: NOON } }))
  on('session.model', () => ({ value: 'claude-opus-5-5' }))
  on('agent.list', () => ({ value: [] }))
  on('session.start', () => ({ cwd: '/tmp' }))
  on('ui.toast', () => ({ value: undefined }))
  on('classic.PermissionRequest', () => ({}))
  return { box, writes }
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
  expect(after).toContain('<circle cx="-22"') // back to the busy dots
})

test('a question Claude asks you counts as waiting for you; other tools as busy', () => {
  expect(statusWhileCalling('AskUserQuestion')).toBe('wait')
  expect(statusWhileCalling('Bash')).toBe('busy')
})

test('a failed tool shows a worried "!" bubble; the status switch turns every bubble off', async ($, on) => {
  fakeStore(on)
  on('tool.call', () => ({ result: 'boom', isError: true }))
  await $.session.start({ source: 'startup', cwd: '/tmp' } as any)
  await $.tool.call({ tool: 'Bash', command: 'false' } as any)
  expect(await backdropSvg($)).toContain('>!</text>')

  const pane = await $.ui.mount(PANE)
  await pane.press({ key: 'sw-status' })
  await pane.unmount()
  expect(await backdropSvg($)).not.toContain('>!</text>')
})
