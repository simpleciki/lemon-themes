# What the desktop app actually does with a theme

Found the hard way while building `lemon-bear` (Claude desktop, engine 2.1.330, November 2026).
Each line is something we tried, saw fail in the app, and fixed. Check them again on a newer build.

## Motion

- **Animate with SMIL, not CSS.** `<animate>` and `<animateTransform>` play in the backdrop.
  CSS `@keyframes` animations stayed still in the app, though they ran in a browser.
- **One backdrop, one `Svg`.** Two full-window `Svg`s stacked in a `Box` drew, but nothing in them
  moved. Put the whole scene in a single `Svg`.
- **Keep `isInteractive` on the backdrop `Svg`.** SMIL plays either way, but without it the app did
  not pass clicks on the backdrop to `ui.pointer`.
- **Mind the size limit: 131,072 characters per `Svg`.** Traced vector art is heavy. Send only the
  parts the current state draws (the sleeping bear's frames only while it sleeps), define each sprite
  once and place it with `<use href="#id">`, and use integer coordinates.

## Character animation

- **Let the artist draw the frames.** A bear assembled from parts (head nods, eyes pasted on)
  looked like a puppet. Frames drawn as one sequence (pose, face and timing in the drawing) read
  as alive; the code only shows one frame at a time and moves the whole figure.
- **Trace every frame of a sequence against one shared palette**, or the colours shimmer as the
  frames change.
- **Few frames, more colours, beats many frames, few colours.** Under the size limit, two good
  frames (calm, blink) plus a slow whole-body sway looked better than four posterised ones.
- **A cute animal's widest body part is about as wide as its widest head part, never wider**
  (about 0.86-0.9 here).

## Layout

- The sidebar covers the window's left edge: start left-side art past it (about 300 px).
- The app fades the title strip at the top: keep anything that must read below it.
- The conversation column covers the middle: decorate the two side margins.
- Scale a side strip to the window height (`viewBox="0 0 400 1000"`, `preserveAspectRatio="xMaxYMid meet"`),
  so it fits any window.

## Clicks

- `ui.pointer` hears only clicks on the **bare** backdrop: the side margins. A click where the
  conversation lies over the art never arrives. Put clickable things in the margins.
- A click gives a position (0-1 each way), not an element; work out what was hit from the position,
  then redraw that part once (a fresh comment in the SVG makes one-shot animations play again).

## Message rows

- Write JSX only inside a hook. A helper function outside the hooks that returns JSX failed with
  `h is not a function`: the app hands out the element factory while a hook runs.

- An engine row may not sit under a `Box` with `position`; add a sticker above or beside the row instead.
- Stickers in message rows animate with SMIL too, but **no pointer event reaches an `Svg` in a
  message row**: SMIL `begin="mouseover"` or `begin="click"` never fires there.
- Doing the hover with the row's `Box` instead (`hover={{ scope, top }}` on an absolutely placed
  Box, plus a `display: "none"` Box revealed on hover) **blanked whole replies** in the app. Keep
  message stickers plain: a row with one `Svg`, no positioned Boxes, no hover.
- Put anything clickable in the backdrop margins.

## Reaching every session

- A mod in `~/.claude/dev-mods/<session>/` lives in that one session. To use it everywhere, install it
  as a user plugin from a marketplace (`claude plugin marketplace add`, `claude plugin install --scope user`).
- **An installed plugin runs a cached copy** (`~/.claude/plugins/cache/<marketplace>/<plugin>/<version>/`),
  taken at install time, even from a local marketplace. Editing the repository changes nothing until
  you bump the version and update the plugin.
- **The app loads a newly installed plugin into sessions that are already running.** A session that
  also has the same plugin as a dev mod then runs both, and the installed (older) copy can be the one
  drawing the theme and getting the clicks, so your dev edits seem to do nothing. Disable the installed
  plugin while you develop (`claude plugin disable <plugin>@<marketplace>`), then update and re-enable it.
