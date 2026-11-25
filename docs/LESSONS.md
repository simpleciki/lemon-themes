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

## Tracing (found while building `meadow-sheep`)

- **`vtracer` on PyPI (0.6.x) has no `Config`.** `tools/build_theme.py` now calls
  `vtracer.convert_image_to_svg_py`; colours are reduced by Pillow before tracing.
- **Sheet items are numbered by rows about 150 px tall.** Items of one visual row that sit at
  different heights can land in different rows, so the order changes. Draw every sprite once on a
  labelled test page before trusting `item` numbers.
- **Soft, shaded art (felt, clay) loses small faces when traced coarsely**: the median filter and a
  short palette wipe out eyes and mouths. Trace the frame coarsely and the face again finely on top
  (`detail` in `theme-build.json`); the fine layer follows the face's outline, so no seam shows.

## The combined plugin (found while building `lemon-themes`, engine 2.1.330)

- **Check with the engine the app runs, not the `claude` on your PATH.** A Homebrew `claude` 2.1.292
  refused `ui.pointer` as "not an event" while the app's 2.1.330 takes it. The app's copy is under
  `~/Library/Application Support/Claude/claude-code/<version>/*/claude.app/Contents/MacOS/claude`.
- **Declare every atom in the file that reads or writes it.** Atoms imported from another file made
  the module refuse to load ("the state library's read takes a source the scan can read").
- **A test's `$` has no `$.store`.** Answer `store.get` and `store.set` in the test with an object of
  your own, and read that object to check what was saved.
- **A test mounting `Backdrop` needs `props.glass`** (`false` will do), or the hook is skipped.
- **Rebuilding `lemon-bear` now traces it a little differently** (the vtracer call changed). Its
  committed `sprites.ts` and `frames.ts` are the reviewed ones; rebuild it only when you mean to
  look at the bear again.
- **A small patch of colour vanishes from a short palette** (the duckling's lavender nightcap traced
  beige at 8 colours). Pin it: `pin_colors` on the sequence in `theme-build.json` reserves palette
  slots for those colours. It cost less than adding two more colours everywhere (99K against 140K).
- **Flat oil-pastel art traces far better than felt or impasto**: coarse body + fine face gives four
  frames in about 60-75K with the crayon grain still showing.

## The garden and the status bubble (engine 2.1.330 tests, 2.1.331 types, November 2026)

- **`classic.PermissionRequest` reaches a plugin's hook** even with no settings hook configured (the
  types say so); a test raises it with `$.classic.PermissionRequest({...})`, and needs its own
  `on('classic.PermissionRequest', () => ({}))` beneath, or "no implementation".
- **The types say every read in one dispatch sees one moment**, so a hook that reads a value another
  event changed while it waited (a permission prompt in the middle of a tool call) may see the old one.
  The status bubble keeps what it shows in a module variable instead of reading it back.
- **A test that mocks `clock.after` fires the callback at once.** Leave `clock.after` and `clock.every`
  unmocked: the kit's own clock holds them.
- **A test cannot draw while one of its own `tool.call` hooks is held open**: `$.ui.mount` waits for
  the held call and the test times out. Raise the events one after another instead.
- **`$.session.start` in a test needs `cwd`**, in its input and from the test's own `session.start`
  hook (`() => ({ cwd: '/tmp' })`), plus answers for every `$` call the hook makes (`env.get`,
  `session.usage`, `session.model`, `agent.list`, `command.register`, `ui.toast`).
- **Count both strips' wrappers in a size budget.** An overlay that fills "what is left" overshot the
  131,072 limit by 89 characters because one `<svg>` wrapper was not counted.
- **An attribute written twice makes a browser refuse the whole SVG** (it shows a broken image). Reusing a
  skin's `badge` inside another picture, drop its own `width`/`height` before giving it new ones.
- **A plugin has no way to make a PNG**: `$.ui.copy` takes text only and `$.fs.write` writes text. A card
  to post is drawn as an `Svg` in a pane and shared as a screenshot.

## Code-drawn skins (pixel and vector, November 2026)

- **Pixel art and hand-written SVG are the backdrop's own format**: no tracing, 20-70K characters per
  backdrop where a traced skin takes 110-128K. `skins/kit/factory.ts` builds a whole skin from a `SkinSpec`.
- **Draw a pixel mascot from a reference.** Ciki's reference cat: a big square head with the ears on its
  corners, each eye one blue pixel over one black, a single black pixel for the nose on the black row,
  two whiskers a side poking past the head, a narrower body, a tail curling up. A cat drawn from memory
  (flat head, two nostrils) did not read as a cat.
- **Sprites have no dark mode of their own**: colours inside a sprite stay as drawn. A line drawing gets a
  pale halo under its ink so it still reads on a dark background.
- **One very long tag gets the whole backdrop refused** ("an Svg holds a tag that is not plain"): a single
  `<path>` of about 6,000 characters did it (the exact cap is unknown). Split long shapes into several
  tags or simpler shapes.

## Mascots: draw in Codex, copy exactly (November 2026)

- **Hand-written mascots looked wobbly** (Ciki: "每个小动物看上去都歪歪扭扭"): curves written blind, each part
  outlined on its own. What worked: Codex draws the character from a style reference (a NEW character in
  that style, never a copy of the reference, which is often a stock picture), then the code copies Codex's
  picture exactly.
- **Pixel art is copied cell by cell** with `tools/pixel_from_png.py`: it finds the square size (of the sizes
  that fit about as well as the best, the biggest, since a 2x2 block fits like one pixel), reads the most
  common colour in each square, merges near-identical colours, can recolour (`--recolor`) and fill small
  patterns away (`--fill`). Codex's pixel art is not on a perfect grid, so expect a stray cell or two.
- **Line and flat art is traced** with `tools/build_theme.py` at scale ~0.42 (0.22 lost the faces); a
  silhouette with a soft grey halo traces cleanly with `colors: 2`, `median: 5`, `alpha_cut: 240`.
