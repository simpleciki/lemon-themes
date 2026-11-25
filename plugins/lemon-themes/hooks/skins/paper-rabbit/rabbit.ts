// The bunny, chibi sticker style: a big round head with long pink-lined ears, big dark shiny eyes,
// pink blush and a little open smile, a small round body behind it and cream paws in front. Every
// shape has the same thick warm-brown outline. Every frame is drawn whole in one 100 x 122 box
// standing on its bottom edge, so the frames line up and only the face or an ear changes.

import type { Art, Frame } from '../kit/factory'
import { blobPts, blob, OUT, rot, sheet, smooth } from './paper'

export const FUR = '#fff7ec'
const MUZZLE = '#ffffff'
const LINING = '#f7aabd'
const NOSE = '#f2899f'
const EYE = '#3a2219'
const CHEEK = '#f8a3b6'
const MOUTH = '#8a3540'
const TONGUE = '#f58fa6'
const W = 100
const H = 122

const { cut, tone, line } = sheet(4.5)

/** An ear standing on its base (bx, by): `len` long, leaning `tilt` degrees (positive = to the right). */
function ear(bx: number, by: number, len: number, wid: number, tilt: number, seed: number) {
  const outer = rot(blobPts(bx, by - len / 2, wid, len / 2, seed, 0.03, 10), bx, by, tilt)
  const inner = rot(blobPts(bx, by - len / 2 - 1, wid * 0.5, len * 0.36, seed + 1, 0.04, 9), bx, by, tilt)
  return cut(FUR, smooth(outer)) + tone(LINING, smooth(inner))
}

const cheeks = (y: number) => `<ellipse cx="24" cy="${y}" rx="7" ry="4.2" fill="${CHEEK}" opacity=".85"/><ellipse cx="76" cy="${y}" rx="7" ry="4.2" fill="${CHEEK}" opacity=".85"/>`

/** A big shiny eye: dark, with one large and one small white highlight. */
const eye = (x: number, y: number) =>
  `<ellipse cx="${x}" cy="${y}" rx="7.4" ry="8.6" fill="${EYE}"/><circle cx="${x + 2.6}" cy="${y - 3.4}" r="3.1" fill="#fff"/><circle cx="${x - 2.8}" cy="${y + 3.6}" r="1.5" fill="#fff"/>`

export type Face = 'calm' | 'blink' | 'flop' | 'twitch'

/** Ears, head and face, used by every sitting frame and by the head icon. */
function head(face: Face) {
  const flop = face === 'flop'
  const eyes = face === 'blink' ? line(EYE, 'M27 63q7-6.5 14 0M59 63q7-6.5 14 0', 3.4) : eye(34, 61) + eye(66, 61)
  const up = face === 'twitch' ? -1.4 : 0
  const nose = `<path fill="${NOSE}" stroke="${OUT}" stroke-width="1.6" stroke-linejoin="round" d="M46.6 ${67.4 + up}Q50 ${65.4 + up} 53.4 ${67.4 + up}Q50 ${71.6 + up} 46.6 ${67.4 + up}Z"/>`
  const mouth =
    face === 'twitch'
      ? line(OUT, 'M50 69v2.6M45.6 72.4q2.2 2.2 4.4 0q2.2 2.2 4.4 0', 1.9)
      : line(OUT, 'M50 70.6v2', 1.9) +
        `<path fill="${MOUTH}" stroke="${OUT}" stroke-width="1.9" stroke-linejoin="round" d="M43.6 72.6Q50 74.4 56.4 72.6Q55.6 81.6 50 81.8Q44.4 81.6 43.6 72.6Z"/>` +
        `<path fill="${TONGUE}" d="M46.2 78.6Q50 75.4 53.8 78.6Q52.6 80.9 50 81Q47.4 80.9 46.2 78.6Z"/>`
  return (
    ear(34, 38, 38, 11, flop ? -18 : -13, 11) +
    ear(66, 38, flop ? 33 : 38, 11, flop ? 62 : 13, 21) +
    cut(FUR, blob(50, 58, 38, 31, 31, 0, 0.025, 14)) +
    tone(MUZZLE, blob(50, 75, 15, 10, 33, 0, 0.04)) +
    cheeks(73) +
    eyes +
    nose +
    mouth
  )
}

/** A front paw: a cream oval with two toe lines. */
const paw = (x: number, y: number, seed: number) => cut(FUR, blob(x, y, 10.5, 7, seed, 0, 0.03)) + line(OUT, `M${x - 3} ${y + 2}v3.4M${x + 3} ${y + 2}v3.4`, 1.8)

/** A sitting frame. */
export function sit(face: Face): Frame {
  const body =
    cut(FUR, blob(84, 104, 9, 8, 41)) +
    cut(FUR, blob(50, 95, 30, 22, 42, 0, 0.03, 12)) +
    tone(MUZZLE, blob(50, 102, 16, 12, 43)) +
    paw(37, 112, 44) +
    paw(63, 112, 45)
  return { w: W, h: H, body: body + head(face) }
}

/** The head on its own, for the band's icon (cropped to the head). */
export function headArt(): Art {
  return { w: W, h: 92, body: head('calm') }
}

/** Curled up asleep: ears laid back along its back, eyes shut. `breath` lifts the back a little. */
export function sleep(breath: boolean): Frame {
  const b = breath ? 1.2 : 0
  const hy = 92 - b * 0.7
  const body =
    cut(FUR, blob(90, 106, 8, 7, 51)) +
    cut(FUR, blob(60, 101 - b, 32, 18 + b, 52, 0, 0.03, 12)) +
    ear(54, 76 - b, 40, 10, 76, 53) +
    ear(47, 78 - b, 38, 9.6, 88, 56) +
    cut(FUR, blob(40, hy, 33, 26, 55, 0, 0.025, 14)) +
    tone(MUZZLE, blob(40, hy + 15, 13, 8, 57, 0, 0.04)) +
    `<ellipse cx="17" cy="${hy + 10}" rx="6.4" ry="3.8" fill="${CHEEK}" opacity=".85"/><ellipse cx="63" cy="${hy + 10}" rx="6.4" ry="3.8" fill="${CHEEK}" opacity=".85"/>` +
    line(EYE, `M18 ${hy + 2}q6 5.4 12 0M50 ${hy + 2}q6 5.4 12 0`, 3.2) +
    `<path fill="${NOSE}" stroke="${OUT}" stroke-width="1.6" stroke-linejoin="round" d="M37 ${hy + 9}q3-1.8 6 0q-3 4-6 0z"/>` +
    line(OUT, `M37.4 ${hy + 14.4}q1.3 1.4 2.6 0q1.3 1.4 2.6 0`, 1.8) +
    paw(24, 114, 58)
  return { w: W, h: H, body }
}
