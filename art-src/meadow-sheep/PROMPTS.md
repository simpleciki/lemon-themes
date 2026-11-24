# Prompts behind the meadow-sheep drawings

Each drawing was made with Codex `image_gen` on a ChatGPT plan. The design sheet sets the look;
every later drawing takes it (or the approved standing lamb cut from `parts-A.png`) as reference.

## Style

> Soft rounded felt-like puff-ball shapes with gentle studio light, combined with a hand-made crayon
> look: grass drawn with diagonal crayon hatching and tiny yellow and white flower dots. Palette: fresh
> spring green, yellow-green, warm cream white, a little blush pink and sky blue. The mascot is a chubby
> little lamb whose wool is a cluster of soft round cream puffs, with a small warm dark-brown face and
> floppy ears, small black eyes with a white highlight, faint pink cheeks and tiny dark legs. The widest
> part of the body is about as wide as the widest part of the head, never wider.

## sheet-A-puff.png (design sheet, chosen)

A still from a public meadow-diorama video was given as mood reference only (paper-white ground,
fuzzy-edged meadow, ball-cluster wool); it is not in this repository and its layout was not copied.
The style above, as a character and prop design sheet on plain paper: the lamb standing (front),
grazing (3/4, head down), sitting and curled up asleep; a puff-ball tree, a pink blossom tree, a cloud,
a meadow patch with a stream, a daisy, a dandelion, a grass tuft, a fence piece, a butterfly, a sparkle.

## props-A.png

> Exact same drawing style as the reference sheet, add a thin white sticker border around every item.
> A sticker sheet of SEPARATE small props in a 4x3 grid with wide empty gaps, nothing touching: 1 a
> small round puff-ball tree, 2 a small pink blossom puff tree, 3 a small fluffy cream-white cloud,
> 4 a white daisy head, 5 a yellow dandelion, 6 a dandelion seed clock, 7 a light-blue butterfly with
> wings open, 8 a four-leaf clover, 9 a tuft of crayon grass with two tiny flowers, 10 a yellow
> four-point sparkle, 11 a small pink heart, 12 a small ball of cream wool. No background colour, no
> white background, no shadows, no floor, no text, no labels, no panel borders.

## parts-A.png

> Exact same character as the front-view standing lamb in the reference. 2 separate items side by side:
> 1 the lamb's head only, eyes open, cut below the chin; 2 the whole lamb standing, front view.
> Thin white sticker border, transparent background, no grass, no text.

`lamb-approved-stand.png` is item 2 cut out; it is the reference for both sequences.

## seq-idle.png

> ONE single image with exactly 4 frames side by side, an idle loop of this little lamb standing on the
> spot, 3/4 front view: 1 calm, looking at the viewer; 2 a blink with a little smile; 3 head lowered to
> graze, nose to the ground; 4 head back up, chewing a tiny grass blade. Exact same character and style
> as the reference. Same size and position in every frame, feet on the same line. Transparent
> background, no floor, no grass under the feet, no text, wide gaps between frames.

## seq-sleep.png

> ONE single image with exactly 3 frames side by side, the same lamb asleep, curled into a round puff
> with legs tucked under, eyes closed: 1 breathing out; 2 breathing in, back slightly raised;
> 3 a sleepy smile and one ear twitched up. Same size and position in every frame. Transparent
> background, no floor, no text, wide gaps between frames.

## Tracing

The lamb's frames are traced coarsely (`colors` 8, `speck` 10) and their faces again finely on top
(`detail` in `theme-build.json`), so the eyes survive while the four idle frames stay near 72,000
characters.
