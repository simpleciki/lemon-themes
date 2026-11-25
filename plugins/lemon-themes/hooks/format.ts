// Plain text helpers for the usage band and pane. No JSX here: JSX outside a hook fails in the app.

import type { Tokens } from '../types'

export function prettyModel(id: string): string {
  const m = /claude-([a-z]+)-(\d+)(?:-(\d+))?/i.exec(id)
  if (m === null) {
    return id
  }
  const word = m[1] ?? ''
  const name = word.charAt(0).toUpperCase() + word.slice(1)
  return m[3] !== undefined && m[3].length <= 2 ? `${name} ${m[2]}.${m[3]}` : `${name} ${m[2]}`
}

const EFFORT_NAMES: Record<string, string> = { low: '低', medium: '中', high: '高', xhigh: '很高', max: '最高' }
export function effortText(v: string | null): string {
  if (v === null) return '默认'
  return EFFORT_NAMES[v] ?? v
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

export function limitName(kind: string): string {
  if (kind === 'five_hour') return '5 小时额度'
  if (kind === 'seven_day') return '7 天额度'
  if (kind === 'spend_limit') return '花费上限'
  return kind
}

export function resetText(iso: string | null): string {
  if (iso === null) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getMonth() + 1}/${d.getDate()} ${p(d.getHours())}:${p(d.getMinutes())} 重置`
}

const WEEKDAYS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
export function resetShort(iso: string | null): string {
  if (iso === null) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const p = (n: number) => String(n).padStart(2, '0')
  const hm = `${p(d.getHours())}:${p(d.getMinutes())}`
  const sameDay = d.toDateString() === new Date().toDateString()
  return sameDay ? `${hm} 重置` : `${WEEKDAYS[d.getDay()]} ${hm} 重置`
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

export function hash(text: string): number {
  let h = 0
  for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) | 0
  return Math.abs(h)
}
