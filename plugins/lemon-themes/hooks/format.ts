// Plain text helpers for the usage band and pane. No JSX here: JSX outside a hook fails in the app.

import type { Tokens } from '../types'
import type { Words } from './i18n'

export function prettyModel(id: string): string {
  const m = /claude-([a-z]+)-(\d+)(?:-(\d+))?/i.exec(id)
  if (m === null) {
    return id
  }
  const word = m[1] ?? ''
  const name = word.charAt(0).toUpperCase() + word.slice(1)
  return m[3] !== undefined && m[3].length <= 2 ? `${name} ${m[2]}.${m[3]}` : `${name} ${m[2]}`
}

export function effortText(v: string | null, w: Words): string {
  if (v === null) return w.effortNames.default ?? ''
  return w.effortNames[v] ?? v
}

export function short(n: number): string {
  if (n >= 1e6) return `${(n / 1e6).toFixed(n >= 1e7 ? 0 : 1)}M`
  if (n >= 1e3) return `${(n / 1e3).toFixed(n >= 1e4 ? 0 : 1)}k`
  return String(n)
}

export function money(usd: number | null): string {
  if (usd === null) return '—'
  return usd < 10 ? `$${usd.toFixed(2)}` : `$${usd.toFixed(1)}`
}

export function limitName(kind: string, w: Words): string {
  return w.limitNames[kind] ?? kind
}

export function resetText(iso: string | null, w: Words): string {
  if (iso === null) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const p = (n: number) => String(n).padStart(2, '0')
  return w.reset(`${d.getMonth() + 1}/${d.getDate()} ${p(d.getHours())}:${p(d.getMinutes())}`)
}

export function resetShort(iso: string | null, w: Words): string {
  if (iso === null) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const p = (n: number) => String(n).padStart(2, '0')
  const hm = `${p(d.getHours())}:${p(d.getMinutes())}`
  const sameDay = d.toDateString() === new Date().toDateString()
  return w.reset(sameDay ? hm : `${w.weekdays[d.getDay()] ?? ''} ${hm}`)
}

export const totalTokens = (t: Tokens) => t.input + t.output + t.cacheRead + t.cacheWrite

/** Ten cells, a cheap text gauge for the band where no icon is drawn. */
export function cells(percent: number | null): string {
  const filled = Math.round((percent ?? 0) / 10)
  return '●'.repeat(filled) + '○'.repeat(10 - filled)
}

/** The backdrop with every SMIL animation taken out, for "motion off". */
export function stillSvg(svg: string): string {
  return svg.replace(/<animate(?:Transform|Motion)?\b[^>]*\/>/g, '')
}

const DARK_RULE = '@media (prefers-color-scheme: dark){'

/** A scene drawn for one mode whatever the app's own: light drops each dark rule, dark keeps its
 *  rules unconditionally (they sit after the light ones, so they win). */
export function forceScheme(svg: string, mode: 'light' | 'dark'): string {
  let out = ''
  let i = 0
  for (;;) {
    const at = svg.indexOf(DARK_RULE, i)
    if (at < 0) return out + svg.slice(i)
    let depth = 1
    let j = at + DARK_RULE.length
    while (j < svg.length && depth > 0) {
      if (svg[j] === '{') depth++
      else if (svg[j] === '}') depth--
      j++
    }
    out += svg.slice(i, at) + (mode === 'dark' ? svg.slice(at + DARK_RULE.length, j - 1) : '')
    i = j
  }
}

export function hash(text: string): number {
  let h = 0
  for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) | 0
  return Math.abs(h)
}
