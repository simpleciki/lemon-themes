// The bunny, cut from cream paper: long ears with pink linings, a round head a touch wider than its
// round body, paws tucked on its chest. Every frame is drawn whole here in one 100 x 111 box standing
// on its bottom edge, so the frames line up and only the face or an ear changes between them.

import type { Art, Frame } from '../kit/factory'
import { blobPts, blob, rot, sheet, smooth } from './paper'

export const FUR = '#fffaf2'
const BELLY = '#ffffff'
const LINING = '#f7b2c2'
const NOSE = '#ee8aa2'
const EYE = '#3b2f4f'
const CHEEK = '#f8b9c6'
const W = 100
const H = 111

/** An ear standing on its base (bx, by): `len` long, leaning `tilt` degrees (positive = to the right). */
function ear(cut: (f: string, d: string) => string, bx: number, by: number, len: number, wid: number, tilt: number, seed: number) {
  const outer = rot(blobPts(bx, by - len / 2, wid, len / 2, seed, 0.04, 10), bx, by, tilt)
  const inner = rot(blobPts(bx, by - len / 2 - 2, wid * 0.48, len * 0.34, seed + 1, 0.05, 9), bx, by, tilt)
  return cut(FUR, smooth(outer)) + cut(LINING, smooth(inner))
}

export type Face = 'calm' | 'blink' | 'flop' | 'twitch'

/** Ears, head and face, used by every sitting frame and by the head icon. */
function head(prefix: string, face: Face) {
  const { cut, ink, line } = sheet(prefix)
  const eyes =
    face === 'blink'
      ? line(EYE, 'M35.6 56.8q3.4 2.8 6.8 0M57.6 56.8q3.4 2.8 6.8 0', 1.7)
      : `<ellipse cx="39" cy="56" rx="3.3" ry="4.1" fill="${EYE}"/><ellipse cx="61" cy="56" rx="3.3" ry="4.1" fill="${EYE}"/>` +
        `<circle cx="40.2" cy="54.5" r="1.2" fill="#fff"/><circle cx="62.2" cy="54.5" r="1.2" fill="#fff"/>`
  const up = face === 'twitch' ? -1.2 : 0
  const nose = ink(NOSE, `M47.2 ${61.6 + up}Q50 ${59.6 + up} 52.8 ${61.6 + up}Q50 ${65.4 + up} 47.2 ${61.6 + up}Z`)
  const mouth =
    face === 'twitch'
      ? line(EYE, 'M50 63.2v1.6M46.8 64.6q1.6 1.4 3.2 .2q1.6 1.2 3.2-.2', 1.1)
      : line(EYE, 'M50 63.8v1.8M46.5 65.6q1.75 1.8 3.5 0q1.75 1.8 3.5 0', 1.1)
  return (
    ear(cut, 37, 45, 44, 10, face === 'flop' ? -16 : -12, 11) +
    ear(cut, 63, 45, face === 'flop' ? 40 : 44, 10, face === 'flop' ? 52 : 12, 21) +
    cut(FUR, blob(50, 56, 30, 25, 31, 0, 0.035, 12)) +
    `<ellipse cx="33" cy="63.5" rx="5" ry="3" fill="${CHEEK}" opacity=".85"/><ellipse cx="67" cy="63.5" rx="5" ry="3" fill="${CHEEK}" opacity=".85"/>` +
    eyes +
    nose +
    mouth
  )
}

/** A sitting frame. */
export function sit(prefix: string, face: Face): Frame {
  const { cut } = sheet(prefix + 'b')
  const body =
    cut(FUR, blob(75, 99, 6.5, 6, 41)) +
    cut(FUR, blob(50, 86, 28, 22, 42, 0, 0.035, 12)) +
    cut(BELLY, blob(50, 91, 16, 13.5, 43)) +
    cut(FUR, blob(39, 106, 8.5, 4.6, 44)) +
    cut(FUR, blob(61, 106, 8.5, 4.6, 45)) +
    cut(FUR, blob(43, 93, 4.6, 5.6, 46, -8)) +
    cut(FUR, blob(57, 93, 4.6, 5.6, 47, 8))
  return { w: W, h: H, body: body + head(prefix + 'h', face) }
}

/** The head on its own, for the band's icon (cropped to the head). */
export function headArt(prefix: string): Art {
  return { w: W, h: 82, body: head(prefix, 'calm') }
}

/** Curled up asleep: ears laid back along its back, eyes shut. `breath` lifts the back a little. */
export function sleep(prefix: string, breath: boolean): Frame {
  const { cut, line } = sheet(prefix)
  const b = breath ? 1 : 0
  const body =
    cut(FUR, blob(85, 99, 6, 5.5, 51)) +
    cut(FUR, blob(61, 94 - b, 28, 16 + b, 52, 0, 0.035, 12)) +
    ear(cut, 54, 76 - b, 42, 9, 76, 53) +
    cut(FUR, blob(40, 90 - b * 0.5, 26, 20, 55, 0, 0.035, 12)) +
    ear(cut, 49, 78 - b, 40, 8.6, 86, 56) +
    cut(FUR, blob(31, 106.5, 7, 3.6, 58)) +
    `<ellipse cx="25" cy="${96.5 - b * 0.5}" rx="4.6" ry="2.6" fill="${CHEEK}" opacity=".85"/><ellipse cx="55" cy="${96.5 - b * 0.5}" rx="4.6" ry="2.6" fill="${CHEEK}" opacity=".85"/>` +
    line(EYE, `M27 ${91 - b * 0.5}q3.5 2.6 7 0M46 ${91 - b * 0.5}q3.5 2.6 7 0`, 1.7) +
    `<path fill="${NOSE}" d="M38 ${95 - b * 0.5}q2-1.4 4 0q-2 3-4 0z"/>`
  return { w: W, h: H, body }
}
