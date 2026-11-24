# Lemon Themes

[中文](README.md)

Hand-drawn skins for the Claude desktop app: stickers floating in the margins, a little mascot in
the corner that blinks and dozes, and a usage band you can read at a glance.

> Screenshots to come

## Themes

| Theme | Look | What it does |
|---|---|---|
| **lemon-bear** | storybook coloured-pencil stickers: cream gingham, lemons, daisies, bees and a honey bear in a yellow beret | the bear sits and blinks, sways a little, naps after 10 quiet minutes (zzz); click it for a hop and hearts; it throws stickers when you praise it, a commit lands or the tests pass |

## The usage band

Model, thinking effort, context used (a glass of lemonade, filled to the level), tokens this
session, subagent runs, the equivalent cost at API prices (an estimate, not a bill), and the
5-hour and weekly limits with their reset times. `/lemon` opens the full pane.

## Install

Needs Claude Code 2.1.330 or later (the backdrop click event, `ui.pointer`, arrived there).

At the prompt of a Claude Code terminal session:

```
/plugin install lemon-bear --marketplace simpleciki/lemon-themes
```

Answer `y` to "Add marketplace?" and pick the user scope. Or from a shell:

```bash
claude plugin install lemon-bear --marketplace simpleciki/lemon-themes
```

In the desktop app, where `/plugin` does not run: click + next to the prompt box, then Plugins, Add marketplace with `simpleciki/lemon-themes`, then Add plugin.

New sessions then wear the theme. The backdrop shows in the desktop and mobile apps; the terminal shows the band only.

## Make a theme

See [skills/make-theme/SKILL.md](skills/make-theme/SKILL.md), after [docs/LESSONS.md](docs/LESSONS.md):
what the app will and will not play.

## Layout

| Path | What |
|---|---|
| `plugins/<theme>/` | the plugin |
| `art-src/<theme>/` | source drawings, the prompt behind each, and `theme-build.json` |
| `tools/build_theme.py` | cuts the drawings apart and traces them into the plugin's vector data |
| `docs/LESSONS.md` | what we learned the hard way |

## License

MIT, see [LICENSE](LICENSE). `make-colors.js` comes from Claude Code's plugin-authoring kit and is not covered by it; see [NOTICE](NOTICE).
