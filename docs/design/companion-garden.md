# Companion garden: what makes a skin irreplaceable

Status: agreed direction, not built. Written 2026-11-24 with Ciki.

## The idea in one line

Looks can be copied; **your own accumulated history cannot**. Every other theme is the same on day 90
as on day 1. This one grows with you: the longer you use it, the more it is yours. All of it stays on
your own computer.

〔定 2026-11-24 Ciki〕"我想让它成为一个让人觉得不只是想用，还有点什么无法被替代的地方" — and she chose
all five ideas below as one whole.

## Five faces of one thing

| # | Feature | Role in the whole |
|---|---|---|
| 1 | **Garden** | The core. Each successful `git commit` plants a flower in the mascot's meadow; an all-green test run makes a patch bloom. Weeks of work become a garden you can see. |
| 3 | **Rare finds + collection book** | Now and then something rare passes by (a shooting star, a rainbow duckling, a visiting panda). `/skin` keeps a book of what *you* have met. A reason to keep it open. |
| 4 | **The mascot talks** | Small speech bubbles that read your garden and history: "23 files today, have some water", "2 am again, I'll stay up with you". It remembers you. |
| 5 | **Daily card** | `/skin share` draws a card of today (garden, commits, mascot) to post. The way new people find it. |
| 2 | **Your own pet as the mascot** | The last piece: even the mascot is yours. Needs the make-theme skill (the plugin cannot draw images itself). |
| + | **Status** (agreed earlier) | The mascot shows what Claude is doing: busy while it thinks or runs tools, **waves when Claude is waiting for you**, worried on an error, cheers when done. The most useful face of "companion". |

## Build order

1. Garden + status
2. Talking (reads the garden and history)
3. Rare finds + collection book
4. Daily card
5. Your own pet (with `skills/make-theme`)

Each step ships on its own, with tests, and is switched on or off from `/skin` like the other switches.

## Four questions before the garden's data layer

1. **What goes in.** Successful `git commit` and test runs (seen in `tool.call` results), turns
   (`turn.complete`), and the local clock. All are events the plugin already receives; nothing is guessed.
2. **Who guarantees it.** `$.store`: the plugin's own JSON file, kept between sessions, **4 MiB in all**.
   Store **one small summary per day** (date, commits, green runs, finds), never one row per event.
   A test fills a year of days and checks the size stays well under the limit.
3. **What one flower means.** One successful `git commit` (not one message). The day is the person's
   **local** date (`new Date(ms)` in the plugin), written as `YYYY-MM-DD`.
4. **What failure looks like.** If the store cannot be read, the garden says so in plain words
   ("can't read your garden records") and draws nothing new. **It must never show an empty meadow
   as if nothing had been planted**: that would look like months of history were lost.

## Open questions for the build session

- Can the plugin see that Claude is waiting for permission or an answer? Check the API (`grep` the
  types for permission / question events). If not, status falls back to busy / idle only.
- Where flowers grow: the bank at the bottom of each margin has room for about 20 before it looks
  crowded. After that, older flowers turn into bushes or the meadow "levels up" (a bigger field), so a
  year of work still fits in the 131,072-character backdrop.
- Size: flowers are drawn with `<use>` of a few sprites, so 200 flowers cost little; check it in a test.

## Not done yet from earlier work

- The try-on page and README do not show the pond duckling yet.
- `register.tsx` is over 600 lines: JSX must stay inside hooks, so it cannot be split the usual way.
