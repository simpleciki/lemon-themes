"""Puts skins into the try-on page (docs/index.html) from the plugin's own drawings.

    python3 tools/site_add_skins.py <dump.json>

The dump comes from tools/site_dump.test.tsx run by the app's engine (see tools/site_skins.sh): for
each skin its four scenes (sitting, asleep, poked, party), badge, stickers, band icons and bubble
colours. Each skin is written into the page's SKINS table (an existing entry is replaced), added to
ORDER, given a colour class, and its usage band is the meadow lamb's band with this skin's icons and
colours swapped in.
"""

import json
import re
import sys
import urllib.parse

P = 'docs/index.html'
uri = lambda s: 'data:image/svg+xml;utf8,' + urllib.parse.quote(s, safe='')
ICON_SVG = re.compile(r'<svg x="[^"]*" y="[^"]*" width="[^"]*" height="[^"]*" xmlns="http://www.w3.org/2000/svg" viewBox="[^"]*">.*?</svg>')
DARK = re.compile(r'@media \(prefers-color-scheme: dark\)\{((?:[^{}]*\{[^{}]*\})*)\}')


def split_style(scene: str):
    """The scene's first <style>: its light rules and its dark rules (the page swaps one for the other)."""
    m = re.search(r'<style>(.*?)</style>', scene, re.S)
    body = m.group(1)
    d = DARK.search(body)
    light = body[: d.start()].strip() if d else body.strip()
    dark = d.group(1).strip() if d else light
    return light, dark, m


def page_scene(scene: str, light: str) -> str:
    """The scene with its dark block removed and its light rules on one line, as the page expects."""
    m = re.search(r'<style>(.*?)</style>', scene, re.S)
    return scene[: m.start()] + f'<style>\n{light}\n\n</style>' + scene[m.end():]


def main(dump_path: str):
    dump = json.load(open(dump_path))
    lines = open(P, encoding='utf-8').read().split('\n')
    i = next(n for n, l in enumerate(lines) if l.startswith('const SKINS = '))
    skins = json.loads(lines[i][len('const SKINS = '):].rstrip().rstrip(';'))
    sheep_bands = skins['meadow-sheep']['bands']
    css = []
    for sid, d in dump.items():
        light, dark, _ = split_style(d['scenes']['sit'])
        scenes = {k: page_scene(v, light) for k, v in d['scenes'].items()}
        icons = [d['icons']['mascot'], d['icons']['think'], d['glass42'], d['icons']['token'], d['icons']['agents'], d['icons']['coin'], d['r27'], d['r61']]
        bands = {}
        for key, b64 in sheep_bands.items():
            b = urllib.parse.unquote(b64[len('data:image/svg+xml;utf8,'):])
            n = [0]

            def swap(m):
                head = m.group(0)[: m.group(0).index(' xmlns=')]
                s = icons[n[0]]
                n[0] += 1
                return head + s[s.index(' xmlns='):]

            b = ICON_SVG.sub(swap, b)
            c = d['colors']
            for a, z in [('#fdfef8', c['card']), ('#cfe3b0', c['line']), ('#2f3a24', c['ink']), ('#1c251a', '#1f1f26'), ('#33432c', '#3a3a46'), ('#eef4e2', '#eeeef2')]:
                b = b.replace(a, z)
            bands[key] = uri(b)
        cls = re.sub(r'[^a-z]', '', sid)
        skins[sid] = {
            'cls': cls, 'name': d['name'], 'light': light, 'dark': dark, 'scenes': scenes,
            'pops': [uri(x) for x in d['pops']], 'msg': [uri(x) for x in d['msg']], 'badge': uri(d['badge']), 'bands': bands,
        }
        c = d['colors']
        bg = re.search(r'\.bg\{fill:(#[0-9a-fA-F]+)\}', light)
        dbg = re.search(r'\.bg\{fill:(#[0-9a-fA-F]+)\}', dark)
        css.append(
            f"  .{cls} {{ --ink:{c['ink']}; --soft:{c['soft']}; --card:{c['card']}; --line:{c['line']}; --user:{c['user']}; --user-line:{c['userLine']}; --side:{c['card']}ee; --glass:{c['card']}cc; }}\n"
            f"  .dark.{cls} {{ --ink:#eeeef2; --soft:#b8b8c4; --card:#1f1f26; --line:#3a3a46; --user:#34343f; --user-line:{c['userLine']}; --side:#1f1f26ee; --glass:#26262ecc; }}\n"
            f"  body.{cls} {{ background:{bg.group(1) if bg else c['card']}; }} body.dark.{cls} {{ background:{dbg.group(1) if dbg else '#15151a'}; }}"
        )
    lines[i] = 'const SKINS = ' + json.dumps(skins, ensure_ascii=False, separators=(',', ':')) + ';'
    j = next(n for n, l in enumerate(lines) if l.startswith('const ORDER = '))
    order = json.loads(lines[j][len('const ORDER = '):].rstrip(';'))
    order += [s for s in dump if s not in order]
    lines[j] = 'const ORDER = ' + json.dumps(order) + ';'
    html = '\n'.join(lines)
    # the colour classes, once each (a rerun replaces them)
    html = re.sub(r'\n  /\* added skins \*/.*?/\* end added skins \*/', '', html, flags=re.S)
    html = html.replace('</style>', '  /* added skins */\n' + '\n'.join(css) + '\n  /* end added skins */\n</style>', 1)
    open(P, 'w', encoding='utf-8').write(html)
    print('skins on the page:', ', '.join(order))


if __name__ == '__main__':
    main(sys.argv[1])
