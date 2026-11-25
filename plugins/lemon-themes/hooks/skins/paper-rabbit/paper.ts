// Paper-cut drawing helpers: shapes with slightly uneven, hand-cut edges, each laid on the page with
// a soft shadow under it (a darker, see-through copy shifted down and right). Each layer's outline is
// written once and its shadow is a <use> of it, so a layer costs one path. A seeded random keeps every
// render the same.

export type Pt = [number, number]

/** A small seeded random (mulberry32), so the hand-cut wobble is the same on every render. */
export function rng(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** One decimal at most, no trailing ".0". */
export const n = (v: number) => String(Math.round(v * 10) / 10)
const pt = (p: Pt) => `${n(p[0])} ${n(p[1])}`

/** A smooth curve through the points (Catmull-Rom as cubic Béziers). */
export function smooth(p: Pt[], closed = true): string {
  const len = p.length
  const at = (i: number): Pt => (closed ? p[(i + len) % len]! : p[Math.max(0, Math.min(len - 1, i))]!)
  let d = `M${pt(p[0]!)}`
  for (let i = 0; i < (closed ? len : len - 1); i++) {
    const p0 = at(i - 1)
    const p1 = at(i)
    const p2 = at(i + 1)
    const p3 = at(i + 2)
    const c1: Pt = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6]
    const c2: Pt = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6]
    d += `C${pt(c1)} ${pt(c2)} ${pt(p2)}`
  }
  return d + (closed ? 'Z' : '')
}

/** Straight cuts between the points, each edge nicked a little in the middle (scissors, not a ruler). */
export function poly(p: Pt[], seed: number, j = 1): string {
  const r = rng(seed)
  const out: Pt[] = []
  p.forEach((a, i) => {
    const b = p[(i + 1) % p.length]!
    out.push([a[0] + (r() - 0.5) * j, a[1] + (r() - 0.5) * j])
    out.push([(a[0] + b[0]) / 2 + (r() - 0.5) * j * 1.6, (a[1] + b[1]) / 2 + (r() - 0.5) * j * 1.6])
  })
  return `M${out.map(pt).join('L')}Z`
}

/** Rotates points around a centre, in degrees. */
export function rot(p: Pt[], cx: number, cy: number, deg: number): Pt[] {
  const a = (deg * Math.PI) / 180
  const c = Math.cos(a)
  const s = Math.sin(a)
  return p.map(([x, y]) => [cx + (x - cx) * c - (y - cy) * s, cy + (x - cx) * s + (y - cy) * c])
}

/** Points on a circle from angle a0 to a1 (degrees, y down), inclusive. */
export function arc(cx: number, cy: number, r: number, a0: number, a1: number, steps: number): Pt[] {
  return Array.from({ length: steps + 1 }, (_, i) => {
    const a = ((a0 + ((a1 - a0) * i) / steps) * Math.PI) / 180
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)] as Pt
  })
}

/** Points round an ellipse, slightly uneven, as if cut by hand. */
export function blobPts(cx: number, cy: number, rx: number, ry: number, seed: number, j = 0.05, steps = 10): Pt[] {
  const r = rng(seed)
  return Array.from({ length: steps }, (_, i) => {
    const a = ((i + (r() - 0.5) * 0.3) / steps) * Math.PI * 2
    const k = 1 + (r() - 0.5) * 2 * j
    return [cx + rx * k * Math.cos(a), cy + ry * k * Math.sin(a)] as Pt
  })
}

/** An ellipse cut by hand: a smooth loop through slightly uneven points, turned by deg. */
export function blob(cx: number, cy: number, rx: number, ry: number, seed: number, deg = 0, j = 0.05, steps = 10): string {
  const p = blobPts(cx, cy, rx, ry, seed, j, steps)
  return smooth(deg === 0 ? p : rot(p, cx, cy, deg))
}

/** The shadow colour every paper layer casts. */
export const SHADOW = '#2b2350'

/**
 * Paper layers for one drawing. `cut(fill, d)` lays a shape with its shadow; `ink(fill, d)` draws
 * flat details (eyes, stitches) with no shadow. Ids start with `prefix`, unique across all sprites.
 */
export function sheet(prefix: string, dx = 1.2, dy = 1.8, op = 0.24) {
  let i = 0
  const cut = (fill: string, d: string) => {
    const id = `${prefix}${i++}`
    return `<use href="#${id}" x="${dx}" y="${dy}" fill="${SHADOW}" fill-opacity="${op}"/><g fill="${fill}"><path id="${id}" d="${d}"/></g>`
  }
  const ink = (fill: string, d: string, extra = '') => `<path fill="${fill}" d="${d}"${extra}/>`
  const line = (color: string, d: string, w = 1.4) => `<path d="${d}" fill="none" stroke="${color}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`
  return { cut, ink, line }
}

/** A circle as a path (for joining several into one layer). */
export const circle = (cx: number, cy: number, r: number) => `M${n(cx - r)} ${n(cy)}a${n(r)} ${n(r)} 0 1 0 ${n(r * 2)} 0a${n(r)} ${n(r)} 0 1 0 ${n(-r * 2)} 0Z`
