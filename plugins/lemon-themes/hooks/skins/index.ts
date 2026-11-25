// Every skin the /skin pane offers, in its order. The first is the default for a new install.

import { LEMON_BEAR } from './lemon-bear/skin'
import { MEADOW_SHEEP } from './meadow-sheep/skin'
import { PIXEL_CAT } from './pixel-cat/skin'
import { PIXEL_FOX } from './pixel-fox/skin'
import { PIXEL_PENGUIN } from './pixel-penguin/skin'
import { PIXEL_SHIBA } from './pixel-shiba/skin'
import { PAPER_RABBIT } from './paper-rabbit/skin'
import { FLAT_WHALE } from './flat-whale/skin'
import { LINE_CAT } from './line-cat/skin'
import { POND_DUCK } from './pond-duck/skin'
import type { Skin } from './skin'

export const SKINS: readonly Skin[] = [LEMON_BEAR, MEADOW_SHEEP, POND_DUCK, PIXEL_CAT, PIXEL_FOX, PIXEL_PENGUIN, PIXEL_SHIBA, PAPER_RABBIT, FLAT_WHALE, LINE_CAT]

export function skinById(id: string): Skin {
  return SKINS.find(s => s.id === id) ?? LEMON_BEAR
}
