<div align="center">

<a href="https://simpleciki.github.io/lemon-themes/">
<picture>
  <source media="(prefers-color-scheme: dark)" srcset="assets/lemon-bear/hero-dark.svg">
  <img src="assets/lemon-bear/hero-light.svg" alt="Lemon Themes: a bear in a yellow beret sits on gingham, with lemons, daisies and bees floating around" width="100%">
</picture>
</a>

**Animated, hand-drawn skins for the Claude desktop app**

[**🍋 Try it on**](https://simpleciki.github.io/lemon-themes/) · [中文](README.md) · [Make a theme](skills/make-theme/SKILL.md) · MIT

</div>

<br>

## lemon-bear

Storybook coloured-pencil stickers: cream gingham, lemons, daisies, bees and a honey bear in a yellow beret. Every picture below moves, as it does in the app.

<table>
<tr>
<td align="center" width="25%">
<picture><source media="(prefers-color-scheme: dark)" srcset="assets/lemon-bear/state-sit-dark.svg"><img src="assets/lemon-bear/state-sit-light.svg" alt="The bear sits and blinks" width="100%"></picture>
<br><b>Sit</b><br><sub>blinks, sways a little</sub>
</td>
<td align="center" width="25%">
<picture><source media="(prefers-color-scheme: dark)" srcset="assets/lemon-bear/state-sleep-dark.svg"><img src="assets/lemon-bear/state-sleep-light.svg" alt="The bear naps, zzz rising" width="100%"></picture>
<br><b>Nap</b><br><sub>after 10 quiet minutes, zzz</sub>
</td>
<td align="center" width="25%">
<picture><source media="(prefers-color-scheme: dark)" srcset="assets/lemon-bear/state-hearts-dark.svg"><img src="assets/lemon-bear/state-hearts-light.svg" alt="Click the bear for hearts" width="100%"></picture>
<br><b>Click it</b><br><sub>a hop and hearts</sub>
</td>
<td align="center" width="25%">
<picture><source media="(prefers-color-scheme: dark)" srcset="assets/lemon-bear/state-party-dark.svg"><img src="assets/lemon-bear/state-party-light.svg" alt="Confetti" width="100%"></picture>
<br><b>Confetti</b><br><sub>praise, a commit, passing tests</sub>
</td>
</tr>
</table>

### The usage band

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="assets/lemon-bear/band-dark.svg">
  <img src="assets/lemon-bear/band-light.svg" alt="Usage band: model, effort, context, tokens, subagents, equivalent cost, 5-hour and weekly limits" width="100%">
</picture>

Model, thinking effort, context used (a glass of lemonade, filled to the level), tokens this session, subagent runs, the equivalent cost at API prices (an estimate, not a bill), and the 5-hour and weekly limits with their reset times. `/lemon` opens the full pane.

### Little things

| | |
|---|---|
| 🍋 **Margin stickers** | lemons, daisies and bees drift along the sidebar and the right edge, clear of the conversation |
| 👆 **Click the margins** | a sticker pops where you click |
| 💬 **Message stickers** | each message gets a small sticker, picked from what it says |
| 🌙 **Dark mode** | follows the system: the gingham dims, the stickers stay |

See it before installing: the [**try-on page**](https://simpleciki.github.io/lemon-themes/) rebuilds the app in the browser. Click the bear, click the margins, switch to nap or dark.

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

| Path | What |
|---|---|
| `plugins/<theme>/` | the plugin |
| `art-src/<theme>/` | source drawings, the prompt behind each, and `theme-build.json` |
| `tools/build_theme.py` | cuts the drawings apart and traces them into the plugin's vector data |
| `tools/build_site.mts` | builds the animated pictures on this page and the try-on page `docs/index.html` |
| `docs/LESSONS.md` | what we learned the hard way |

## License

MIT, see [LICENSE](LICENSE). `make-colors.js` comes from Claude Code's plugin-authoring kit and is not covered by it; see [NOTICE](NOTICE).
