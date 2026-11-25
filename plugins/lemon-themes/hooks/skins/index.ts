// Every skin the /skin pane offers, in its order. The first is the default for a new install.

import { LEMON_BEAR } from './lemon-bear/skin'
import { MEADOW_SHEEP } from './meadow-sheep/skin'
import { POND_DUCK } from './pond-duck/skin'
import type { Skin } from './skin'

export const SKINS: readonly Skin[] = [LEMON_BEAR, MEADOW_SHEEP, POND_DUCK]

export function skinById(id: string): Skin {
  return SKINS.find(s => s.id === id) ?? LEMON_BEAR
}
