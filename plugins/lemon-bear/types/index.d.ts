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

export type Poke = { what: 'bear' | 'party' | 'pop'; n: number; x?: number; y?: number }

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
    'lemon-bear': {
      snap: Snap | null
      tokens: Tokens
      agentCalls: number
      isBandHidden: boolean
      effort: string | null
      isAsleep: boolean
      poke: Poke | null
    }
  }
}
