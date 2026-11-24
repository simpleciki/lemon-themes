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
  for (const scene of ['lemon-bear', 'meadow-sheep']) {
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
