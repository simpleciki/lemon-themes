// What every skin hands the engine (register.tsx). A new skin is a folder here with its traced
// art (art.ts, sprites.ts, frames.ts) and one skin.ts that fills this in; then add it to index.ts.

import type { ThemeSetArgs } from 'claude-code'

import type { Poke } from '../../types'

export type Cheer = 'praise' | 'commit' | 'tests' | 'yay'

export type Skin = {
  /** The id saved in the store and used as the backdrop scene's name. */
  id: string
  /** Shown in the /skin pane. */
  name: string
  /** The mascot, as the band and the replies call it: 小熊, 小羊. */
  mascot: string
  /** One line for the /skin pane. */
  blurb: string
  /** Colours and message styles; `base` is the fallback with colours and the scene only. */
  look: ThemeSetArgs
  base: ThemeSetArgs
  /** What make-colors found wrong with the colours, logged once. */
  problems: string[]
  /** The whole backdrop: still = no motion and the mascot's first frame only. */
  scene: (isAsleep: boolean, poke: Poke | null, still: boolean, floaters: boolean) => string
  alt: { awake: string; asleep: string }
  /** Small stickers over the person's bubbles, one picked per message. */
  userStickers: string[]
  userStickerAlt: string
  /** A sticker on the first block of each reply. */
  reply: { svg: string; alt: string; width: number; height: number }
  icons: { mascot: string; think: string; token: string; agents: string; coin: string }
  juiceGlass: (percent: number | null) => string
  limitRing: (percent: number) => string
  /** The mascot alone, for the pane header and the /skin list. */
  badge: string
  /** Text colours the band and pane use. */
  ink: { heading: string; gauge: string; border: string; ok: string }
  /** Emoji on the pane's cards (the terminal shows these instead of icons). */
  emoji: { title: string; mascot: string; context: string; token: string; agents: string }
  cheers: Record<Cheer, string[]>
}
