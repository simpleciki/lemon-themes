#!/bin/zsh
# Puts skins into the try-on page from the plugin's own drawings, using the app's engine:
#   zsh tools/site_skins.sh pixel-cat pixel-fox ...
# A throwaway test prints each skin's scenes and parts; tools/site_add_skins.py writes them into docs/index.html.
set -e
cd "${0:A:h}/.."
C=$(ls ~/Library/Application\ Support/Claude/claude-code/*/*/claude.app/Contents/MacOS/claude | tail -1)
ids=$(printf "'%s'," "$@")
T=plugins/lemon-themes/tests/zz-site-dump.test.tsx
D=$(mktemp -d)
cat > $T <<EOF
import { test } from 'claude-code/testing'
import { SKINS } from '../hooks/skins/index'
test('site dump', () => {
  const out: Record<string, unknown> = {}
  for (const s of SKINS.filter(k => [${ids}].includes(k.id))) {
    const sc = (a: boolean, p: unknown) => s.scene(a, p as never, false, true, s.variants?.[0]?.id)
    const st = s.look.style as any
    const u = Array.isArray(st.UserMessage) ? st.UserMessage[0] : st.UserMessage
    const as = st.AssistantMessage
    const us = s.userStickers
    out[s.id] = {
      name: [s.name.zh, s.name.en],
      scenes: { sit: sc(false, null), sleep: sc(true, null), bear: sc(false, { what: 'mascot', n: 1 }), party: sc(false, { what: 'party', n: 1 }) },
      badge: s.badge,
      msg: [us[0], s.reply.svg, us[1] ?? us[0]],
      pops: [...us.slice(0, 4), s.reply.svg],
      icons: s.icons,
      glass42: s.juiceGlass(42), r27: s.limitRing(27), r61: s.limitRing(61),
      colors: { ink: as.color, soft: st.ToolUse?.color ?? as.color, card: as.backgroundColor, line: as.borderColor, user: u.backgroundColor, userLine: u.borderColor },
    }
  }
  console.log('@@SITE@@' + JSON.stringify(out))
})
EOF
"$C" plugin test plugins/lemon-themes > "$D/dump.txt" 2>&1 || true
rm -f $T
grep '^@@SITE@@' "$D/dump.txt" | head -1 | sed 's/^@@SITE@@//' > "$D/dump.json"
python3 tools/site_add_skins.py "$D/dump.json"
