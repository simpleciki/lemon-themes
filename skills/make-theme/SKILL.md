---
name: make-theme
description: Make a new hand-drawn theme for the Claude desktop app in this repository — a floating-sticker backdrop, an animated mascot, chat-bubble stickers and a usage band — from a style reference. Use when someone asks for a new skin, theme or style ("make a cat theme", "a watercolour version", "a new mascot"), or wants to change an existing theme's art.
---

# Make a theme

A theme (a "skin") is a folder `plugins/lemon-themes/hooks/skins/<theme>/` inside the one
`lemon-themes` plugin, plus its source drawings under `art-src/<theme>/`. `meadow-sheep` is the
newest worked example; copy its folder and change the art and words. The /skin pane lists every
skin in `skins/index.ts`.

Read `docs/LESSONS.md` first: it lists what the app will and will not play.

## Code-drawn skins (pixel art, flat vector): no image tool needed

A skin drawn as code skips steps 2-3 below. Copy `skins/pixel-cat/skin.ts` (pixel art: each sprite is a
character grid, `kit/pixel.ts` turns it into vector paths) or `skins/flat-whale/skin.ts` (hand-written SVG
shapes), fill in a `SkinSpec` and pass it to `makeSkin` from `kit/factory.ts`, which builds the scene,
stickers, icons and the Skin. These come to 20-70K characters, far under the limit. Ask the person for a
reference picture of the mascot style first: the first pixel cat, drawn without one, did not look like a cat.

## 1. Settle the look with the person

- Ask for one or two reference pictures of the style they like. Describe what you see back to them
  (line, fill, palette, proportions) before drawing anything.
- Draw a design sheet of the mascot and its props in **three different versions** and let them
  choose. Do not settle on a look for them.
- Mascot rule: the widest part of the body is about as wide as the widest part of the head.

## 2. Draw the source sheets

Use whatever image tool the person has (we used Codex `image_gen` on a ChatGPT plan). Every sheet:
transparent background, a thin white sticker border around each item, wide gaps between items,
nothing touching, no text.

| Sheet | What is on it |
|---|---|
| props | 10-12 separate stickers: the theme's small objects, a heart, a sparkle |
| parts | the mascot's head alone (for the band icon) and anything else drawn as one piece |
| one sheet per mascot state | the frames of that state in one row, same size and floor: e.g. idle (calm, blink), sleep (breathe out, in) |

Give the chosen design sheet as the reference for every later sheet, or the mascot drifts.

## 3. Turn drawings into vector data

Write `art-src/<theme>/theme-build.json` (see lemon-bear's) naming which item of which sheet
becomes which sprite, and which frames of a state sheet to keep. Then:

```bash
pip install pillow numpy vtracer
python tools/build_theme.py <theme>
```

It prints each sprite's size in characters. Keep the whole backdrop under 131,072: lower `colors`
or `scale` on the heavy items, keep fewer frames, and drop items the theme no longer draws.

## 4. Add the skin

Set `"out": "plugins/lemon-themes/hooks/skins/<theme>"` in `theme-build.json` before you build.
Copy `skins/meadow-sheep/` and change, in `art.ts`: the floating and ground sticker lists, the mascot
timeline (`FLIP`), the pop and burst stickers; in `skin.ts`: the colours (`makeColors`), the bubble
style, the cheer lines, the band's icons and words. Add it to `skins/index.ts`. Animate only with
SMIL: the "motion off" switch works by removing every `<animate…/>`, so nothing may depend on one
to become visible except the one-shot effects. Keep `worldLayer(floaters)` honouring its flag.

Faces of soft, shaded mascots: trace the frames coarsely and add `detail` to the sequence in
`theme-build.json` so the face is traced again finely on top (see docs/LESSONS.md).

## 5. Check before showing

- Run `claude plugin test plugins/lemon-themes` with the engine the app runs (docs/LESSONS.md says
  where it is): the tests switch skins, turn motion off and check every backdrop's size.
- Open the backdrop in a browser as an `<img>` and watch it for a few seconds: things must move.
- Then load it in the app and ask the person to look. The app may hold still what a browser plays.

## 6. Clean up

Move drawings the theme no longer uses out of `art-src/` (to the trash), and drop sprites it no
longer draws, so nothing unused gets published.
