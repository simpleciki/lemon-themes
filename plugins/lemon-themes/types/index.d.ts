export type Tokens = {
  input: number
  output: number
  cacheRead: number
  cacheWrite: number
}

export type RunningAgent = {
  id: string
  label: string
  model: string
  tokenCount: number
  usd: number | null
}

export type Poke = { what: 'mascot' | 'party' | 'pop'; n: number; x?: number; y?: number }

/** What the person can switch off, from the /skin pane; kept between sessions. */
export type Options = {
  motion: boolean
  floaters: boolean
  bubbles: boolean
  band: boolean
  cheers: boolean
  nap: boolean
}

export type Limit = { kind: string; percentUsed: number; resetsAt: string | null }

export type Snap = {
  model: string
  contextTokens: number | null
  contextWindow: number
  contextPercent: number | null
  usd: number | null
  hasUnknownPrice: boolean
  limits: Limit[]
  running: RunningAgent[]
  startedAt: number
}

declare module 'claude-code' {
  interface PluginState {
    'lemon-themes': {
      skin: string
      options: Options
      snap: Snap | null
      tokens: Tokens
      agentCalls: number
      isBandHidden: boolean
      effort: string | null
      isAsleep: boolean
      poke: Poke | null
      lang: 'zh' | 'en'
    }
  }
}
