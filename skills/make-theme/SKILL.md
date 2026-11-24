---
name: make-theme
description: Make a new hand-drawn theme for the Claude desktop app in this repository — a floating-sticker backdrop, an animated mascot, chat-bubble stickers and a usage band — from a style reference. Use when someone asks for a new skin, theme or style ("make a cat theme", "a watercolour version", "a new mascot"), or wants to change an existing theme's art.
---

# Make a theme

A theme is a plugin under `plugins/<theme>/` plus its source drawings under `art-src/<theme>/`.
`lemon-bear` is the worked example; copy it and change the art and words.

Read `docs/LESSONS.md` first: it lists what the app will and will not play.

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

## 4. Build the plugin

Copy `plugins/lemon-bear/` and change, in `hooks/art.ts`: the floating sticker lists (`LEFT`,
`RIGHT`), the mascot timeline (`FLIP`), the pop and burst stickers; in `hooks/register.tsx`: the
colours (`makeColors`), the bubble style, the cheer lines and the band's words. Animate only with SMIL.

## 5. Check before showing

- Type-check the plugin and keep every state's backdrop under the limit.
- Open the backdrop in a browser as an `<img>` and watch it for a few seconds: things must move.
- Then load it in the app and ask the person to look. The app may hold still what a browser plays.

## 6. Clean up

Move drawings the theme no longer uses out of `art-src/` (to the trash), and drop sprites it no
longer draws, so nothing unused gets published.
