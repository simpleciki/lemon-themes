import { expect, test } from 'claude-code/testing'
import type { On } from 'claude-code/testing'

// An in-memory $.store whose writes the test can read back.
function fakeStore(on: On, start: Record<string, unknown> = {}) {
  const box: Record<string, unknown> = { ...start }
  on('store.get', (_, e) => ({ value: box[e.key] }))
  on('store.set', (_, e) => {
    box[e.key] = JSON.parse(JSON.stringify(e.value))
    return { value: undefined }
  })
  on('store.delete', (_, e) => {
    delete box[e.key]
    return { value: undefined }
  })
  on('store.keys', () => ({ value: Object.keys(box) }))
  return box
}

const P = 'lemon-themes'

const PANE = {
  plugin: P,
  surface: 'desktop',
  component: 'Pane',
  requestId: 'lemon-themes-skins',
  props: {
    title: '皮肤',
    isFocused: false,
    bodyColumns: 60,
    placement: 'dock',
    scroll: { offset: 0, bodyRows: 40 },
    view: {},
  },
} as const

const backdrop = (scene: string) =>
  ({ plugin: P, surface: 'desktop', component: 'Backdrop', props: { scene, glass: false } }) as const

test('/skin 小羊 switches the skin, saves it and repaints with its scene', async ($, on) => {
  const box = fakeStore(on)
  const scenes: string[] = []
  on('theme.set', (_, e) => {
    scenes.push(String(e.backdrop?.scene ?? ''))
    return { value: { isDrawn: true } }
  })

  const out = await $.command.run({ command: 'skin', args: '小羊' })

  expect(out.text).toContain('草地小羊')
  expect(box.skin).toBe('meadow-sheep')
  expect(scenes).toEqual(['meadow-sheep'])
})

test('the pane switches animation off, saves it, and the backdrop then holds still', async ($, on) => {
  const box = fakeStore(on)

  const before = await $.ui.mount(backdrop('meadow-sheep'))
  const moving = await before.find({ type: 'Svg' })
  expect(String(moving?.props.source)).toContain('<animate')
  await before.unmount()

  const pane = await $.ui.mount(PANE)
  await pane.press({ key: 'sw-motion' })
  await pane.unmount()

  expect(box.options).toMatchObject({ motion: false, floaters: true })

  const after = await $.ui.mount(backdrop('meadow-sheep'))
  const still = await after.find({ type: 'Svg' })
  expect(String(still?.props.source)).not.toContain('<animate')
  expect(String(still?.props.source).length).toBeLessThanOrEqual(131072)
  await after.unmount()
})

test('turning the floating stickers off leaves fewer drawings in the backdrop', async ($, on) => {
  fakeStore(on)

  const full = await $.ui.mount(backdrop('lemon-bear'))
  const a = String((await full.find({ type: 'Svg' }))?.props.source)
  await full.unmount()

  const pane = await $.ui.mount(PANE)
  await pane.press({ key: 'sw-floaters' })
  await pane.unmount()

  const calm = await $.ui.mount(backdrop('lemon-bear'))
  const b = String((await calm.find({ type: 'Svg' }))?.props.source)
  await calm.unmount()

  expect(b.length).toBeLessThan(a.length)
})

test('the awake backdrop of every skin stays under the app limit of 131,072 characters', async ($, on) => {
  fakeStore(on)
  // noon on an ordinary day: the duckling's sunny look
  on('clock.now', () => ({ value: new Date(2026, 10, 24, 12, 0).getTime() }))
  for (const scene of ['lemon-bear', 'meadow-sheep', 'pond-duck']) {
    const ui = await $.ui.mount(backdrop(scene))
    const src = String((await ui.find({ type: 'Svg' }))?.props.source)
    expect(src.length, scene).toBeLessThanOrEqual(131072)
    await ui.unmount()
  }
})

test('a scene that is not ours is left to the engine', async ($, on) => {
  on('ui.render', ($, e) => {
    const { Text } = $.ui.resolve(e)
    return <Text>engine</Text>
  })
  const ui = await $.ui.mount(backdrop('someone-else'))
  expect((await ui.find({ type: 'Text' }))?.text).toBe('engine')
  await ui.unmount()
})

test('/skin en turns the pane, switches and skin names to English, and saves the choice', async ($, on) => {
  const box = fakeStore(on)

  const out = await $.command.run({ command: 'skin', args: 'en' })
  expect(out.text).toBe('Language: English.')
  expect(box.lang).toBe('en')

  const pane = await $.ui.mount(PANE)
  expect(await pane.find({ type: 'Text', text: 'Pick a skin' })).toBeDefined()
  expect(await pane.find({ type: 'Text', text: 'Meadow lamb' })).toBeDefined()
  expect(await pane.find({ type: 'Text', text: 'Backdrop motion' })).toBeDefined()
  expect(await pane.find({ type: 'Text', text: '选皮肤' })).toBeUndefined()
  await pane.press({ key: 'lang-zh' })
  await pane.unmount()

  expect(box.lang).toBe('zh')
  const again = await $.ui.mount(PANE)
  expect(await again.find({ type: 'Text', text: '选皮肤' })).toBeDefined()
  await again.unmount()
})

test('/skin lamb switches in English too', async ($, on) => {
  const box = fakeStore(on)
  on('theme.set', () => ({ value: { isDrawn: true } }))
  await $.command.run({ command: 'skin', args: 'english' })
  const out = await $.command.run({ command: 'skin', args: 'lamb' })
  expect(out.text).toBe('Switched to Meadow lamb.')
  expect(box.skin).toBe('meadow-sheep')
})

test('the duckling has a day, dusk and rain look; /skin dusk pins one, each stays under the limit', async ($, on) => {
  const box = fakeStore(on)
  on('theme.set', () => ({ value: { isDrawn: true } }))
  on('clock.now', () => ({ value: new Date(2026, 10, 24, 12, 0).getTime() }))
  await $.command.run({ command: 'skin', args: 'duck' })
  expect(box.skin).toBe('pond-duck')
  for (const lookId of ['day', 'dusk', 'rain']) {
    await $.command.run({ command: 'skin', args: lookId })
    expect(box.pin).toBe(lookId)
    const ui = await $.ui.mount(backdrop('pond-duck'))
    const src = String((await ui.find({ type: 'Svg' }))?.props.source)
    expect(src.length, lookId).toBeLessThanOrEqual(131072)
    // each look draws its own frames: the nightcap at dusk, the rain hat in the rain
    expect(src).toContain(lookId === 'day' ? 'f-idle-0' : lookId === 'dusk' ? 'f-idleDusk-0' : 'f-idleRain-0')
    await ui.unmount()
  }
  await $.command.run({ command: 'skin', args: 'auto' })
  expect(box.pin).toBe('auto')
})
