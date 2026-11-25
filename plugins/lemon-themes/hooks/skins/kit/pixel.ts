// Pixel art as SVG. A drawing is a grid of characters, one per pixel ('.' or ' ' = empty), and a
// palette from character to colour. Each colour becomes one <path> of merged horizontal runs, so a
// 32 x 32 sprite costs a few kilobytes. The app's backdrop takes vector art only, so this is how a
// pixel skin draws natively.

import type { Art } from './factory'

export type Palette = Record<string, string>

const EMPTY = new Set(['.', ' '])

/** Adds a sticker outline: every empty pixel touching the drawing (8 ways) becomes `edge`. */
export function outline(grid: string[], edge = 'W', thick = 1): string[] {
  let g = grid.map(r => r.split(''))
  for (let t = 0; t < thick; t++) {
    const h = g.length + 2
    const w = Math.max(...g.map(r => r.length)) + 2
    const pad = Array.from({ length: h }, (_, y) => Array.from({ length: w }, (_, x) => g[y - 1]?.[x - 1] ?? '.'))
    const out = pad.map(r => [...r])
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        if (!EMPTY.has(pad[y]![x]!)) continue
        let near = false
        for (let dy = -1; dy <= 1 && !near; dy++) for (let dx = -1; dx <= 1 && !near; dx++) {
          const c = pad[y + dy]?.[x + dx]
          if (c !== undefined && !EMPTY.has(c) && c !== edge) near = true
          if (c === edge && t > 0) near = true
        }
        if (near) out[y]![x] = edge
      }
    }
    g = out
  }
  return g.map(r => r.join(''))
}

/** A pixel drawing as vector art, one unit per pixel. */
export function pixels(grid: string[], pal: Palette): Art {
  const h = grid.length
  const w = Math.max(...grid.map(r => r.length))
  const runs: Record<string, string[]> = {}
  grid.forEach((row, y) => {
    let x = 0
    while (x < row.length) {
      const c = row[x]!
      if (EMPTY.has(c)) {
        x++
        continue
      }
      let n = 1
      while (row[x + n] === c) n++
      ;(runs[c] ??= []).push(`M${x} ${y}h${n}v1h-${n}z`)
      x += n
    }
  })
  const body = Object.entries(runs)
    .map(([c, d]) => {
      const fill = pal[c]
      if (fill === undefined) throw new Error(`pixel colour "${c}" is not in the palette`)
      return `<path fill="${fill}" d="${d.join('')}"/>`
    })
    .join('')
  return { w, h, body: `<g shape-rendering="crispEdges">${body}</g>` }
}

/** A pixel sticker: the drawing with a white outline, as art. */
export const sticker = (grid: string[], pal: Palette, edge = '#ffffff') => pixels(outline(grid, '@'), { ...pal, '@': edge })
