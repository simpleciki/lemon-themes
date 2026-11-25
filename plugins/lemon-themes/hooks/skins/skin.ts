// What every skin hands the engine (register.tsx). A new skin is a folder here with its traced
// art (art.ts, sprites.ts, frames.ts) and one skin.ts that fills this in; then add it to index.ts.

import type { ThemeSetArgs } from 'claude-code'

import type { Poke } from '../../types'
import type { GardenKit } from '../garden'
import type { L } from '../i18n'

export type Cheer = 'praise' | 'commit' | 'tests' | 'yay'

export type Skin = {
  /** The id saved in the store and used as the backdrop scene's name. */
  id: string
  /** Shown in the /skin pane. */
  name: L
  /** The mascot, as the band and the replies call it: 小熊 / bear. */
  mascot: L
  /** One line for the /skin pane. */
  blurb: L
  /** Words /skin <word> accepts for this skin, besides its id. */
  aliases: string[]
  /** Colours and message styles; `base` is the fallback with colours and the scene only. */
  look: ThemeSetArgs
  base: ThemeSetArgs
  /** What make-colors found wrong with the colours, logged once. */
  problems: string[]
  /** The whole backdrop: still = no motion and the mascot's first frame only; variant = a look of
   *  the skin's own (see variantAt), when it has more than one. */
  scene: (isAsleep: boolean, poke: Poke | null, still: boolean, floaters: boolean, variant?: string) => string
  /** For a skin that changes with the time of day or the weather: its look at this moment. */
  variantAt?: (ms: number) => string
  /** The looks a person can pin from /skin, with their names; absent for a skin with one look. */
  variants?: { id: string; name: L }[]
  alt: { awake: L; asleep: L }
  /** Small stickers over the person's bubbles, one picked per message. */
  userStickers: string[]
  userStickerAlt: L
  /** A sticker on the first block of each reply. */
  reply: { svg: string; alt: L; width: number; height: number }
  icons: { mascot: string; think: string; token: string; agents: string; coin: string }
  juiceGlass: (percent: number | null) => string
  limitRing: (percent: number) => string
  /** The mascot alone, for the pane header and the /skin list. */
  badge: string
  /** Text colours the band and pane use. */
  ink: { heading: string; gauge: string; border: string; ok: string }
  /** Emoji on the pane's cards (the terminal shows these instead of icons). */
  emoji: { title: string; mascot: string; context: string; token: string; agents: string }
  /** Where the top of the mascot's head is, in the right strip's units (400 x 1000): bubbles stand on it. */
  headTop?: number
  /** What the garden plants on this skin's bank, for a look (see variants). */
  garden: (variant?: string) => GardenKit
  cheers: Record<Cheer, { zh: string[]; en: string[] }>
}
