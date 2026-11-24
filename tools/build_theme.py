"""Turn a theme's Codex drawings into the vector data its plugin draws.

    python tools/build_theme.py lemon-bear

Reads art-src/<theme>/theme-build.json and writes plugins/<theme>/hooks/sprites.ts and frames.ts.

- A *sheet* is one transparent PNG holding several separate items; items are found by their
  outline (connected opaque pixels) and numbered left to right, top to bottom.
- A *sprite* is one item of a sheet, traced on its own.
- A *sequence* is a sheet of animation frames in a row; every frame is traced against ONE shared
  palette, so colours do not flicker from frame to frame, and keeps its height above the shared
  floor, so a jump stays a jump.

Needs: pip install pillow numpy vtracer
"""

import io
import json
import re
import sys
import tempfile
from collections import deque
from pathlib import Path

import numpy as np
import vtracer
from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parent.parent


# ---------- finding items on a sheet ----------

def split_sheet(path: Path, alpha_cut: int, min_px: int = 400):
    """Items on a transparent sheet, as (RGBA image, box) sorted into reading order."""
    im = Image.open(path).convert('RGBA')
    a = np.array(im)[:, :, 3]
    mask = a > alpha_cut
    # grow the mask a little so a pencil stroke stays with its item
    grown = mask.copy()
    for dy in range(-6, 7, 3):
        for dx in range(-6, 7, 3):
            grown |= np.roll(np.roll(mask, dy, 0), dx, 1)
    h, w = mask.shape
    label = np.zeros((h, w), np.int32)
    items = []
    n = 0
    for y in range(0, h, 2):
        for x in range(0, w, 2):
            if not grown[y, x] or label[y, x]:
                continue
            n += 1
            q = deque([(y, x)])
            label[y, x] = n
            y0 = y1 = y
            x0 = x1 = x
            count = 0
            while q:
                cy, cx = q.popleft()
                count += 1
                y0, y1, x0, x1 = min(y0, cy), max(y1, cy), min(x0, cx), max(x1, cx)
                for ny, nx in ((cy + 1, cx), (cy - 1, cx), (cy, cx + 1), (cy, cx - 1)):
                    if 0 <= ny < h and 0 <= nx < w and grown[ny, nx] and not label[ny, nx]:
                        label[ny, nx] = n
                        q.append((ny, nx))
            if count > min_px:
                items.append((n, x0, y0, x1, y1))
    rgba = np.array(im)
    out = []
    for n, x0, y0, x1, y1 in sorted(items, key=lambda b: (b[2] // 150, b[1])):
        arr = rgba.copy()
        keep = (label == n) & mask
        arr[:, :, 3] = np.where(keep, 255, 0)
        out.append((Image.fromarray(arr).crop((x0, y0, x1 + 1, y1 + 1)), (x0, y0, x1 - x0 + 1, y1 - y0 + 1)))
    return out


def trim_chin(im: Image.Image) -> Image.Image:
    """Drop the white sticker border under a head's chin, so the head melts into the body."""
    a = np.array(im)
    h, w = a.shape[:2]
    white = a[:, :, :3].astype(int).min(axis=2) > 225
    zone = np.zeros_like(white)
    zone[int(h * 0.78):, int(w * 0.12):int(w * 0.88)] = True
    a[:, :, 3] = np.where(white & zone, 0, a[:, :, 3])
    return Image.fromarray(a)


# ---------- tracing ----------

def _trace(prepared: Image.Image, colors: int, speck: int) -> str:
    with tempfile.TemporaryDirectory() as d:
        src, out = Path(d) / 'in.png', Path(d) / 'out.svg'
        prepared.save(src)
        cfg = vtracer.Config(filter_speckle=speck, color_precision=8, layer_difference=8, corner_threshold=90,
                             length_threshold=6.0, splice_threshold=60, path_precision=0, max_colors=colors + 2)
        cfg.convert_file(str(src), str(out))
        return ''.join(re.findall(r'<path[^>]*/>', out.read_text()))


def _prepare(im: Image.Image, scale: float):
    w, h = max(1, round(im.width * scale)), max(1, round(im.height * scale))
    im = im.resize((w, h), Image.LANCZOS)
    a = im.getchannel('A').filter(ImageFilter.GaussianBlur(1)).point(lambda v: 255 if v > 128 else 0)
    rgb = im.convert('RGB').filter(ImageFilter.MedianFilter(5))
    return rgb, a, w, h


def trace_sprite(im: Image.Image, scale: float, colors: int, speck: int):
    rgb, a, w, h = _prepare(im, scale)
    q = rgb.quantize(colors=colors, method=Image.Quantize.MEDIANCUT).convert('RGBA')
    q.putalpha(a)
    return {'w': w, 'h': h, 'body': _trace(q, colors, speck)}


def trace_with_palette(im: Image.Image, scale: float, palette: Image.Image, speck: int):
    rgb, a, w, h = _prepare(im, scale)
    q = rgb.quantize(palette=palette, dither=Image.Dither.NONE).convert('RGBA')
    q.putalpha(a)
    return {'w': w, 'h': h, 'body': _trace(q, len(palette.getpalette()) // 3, speck)}


def shared_palette(frames, colors: int) -> Image.Image:
    strip = Image.new('RGB', (sum(f.width for f in frames), max(f.height for f in frames)), (255, 255, 255))
    x = 0
    for f in frames:
        bg = Image.new('RGB', f.size, (255, 255, 255))
        bg.paste(f.convert('RGB'), mask=f.getchannel('A').point(lambda v: 255 if v > 128 else 0))
        strip.paste(bg, (x, 0))
        x += f.width
    return strip.filter(ImageFilter.MedianFilter(5)).quantize(colors=colors, method=Image.Quantize.MEDIANCUT)


# ---------- writing the plugin's data files ----------

def write_ts(path: Path, header: str, type_line: str, name: str, data) -> None:
    text = header + type_line + f'export const {name} = ' + json.dumps(data) + '\n'
    tmp = path.with_suffix('.tmp-write')
    tmp.write_text(text)
    if tmp.read_text() != text:
        tmp.unlink()
        raise RuntimeError(f'verify failed: {path}')
    tmp.replace(path)


def main(theme: str) -> None:
    art = ROOT / 'art-src' / theme
    cfg = json.loads((art / 'theme-build.json').read_text())
    hooks = ROOT / 'plugins' / theme / 'hooks'
    sheets = {}

    def items(sheet: str):
        if sheet not in sheets:
            s = cfg['sheets'][sheet]
            sheets[sheet] = split_sheet(art / s['file'], s.get('alpha_cut', 200))
        return sheets[sheet]

    sprites = {}
    for name, s in cfg['sprites'].items():
        im = items(s['sheet'])[s['item']][0]
        if s.get('trim_chin'):
            im = trim_chin(im)
        sprites[name] = trace_sprite(im, s['scale'], s['colors'], s['speck'])
        print(f'sprite {name:9} {sprites[name]["w"]}x{sprites[name]["h"]}  {len(sprites[name]["body"]):6} chars')

    frames = {}
    for name, s in cfg['sequences'].items():
        found = items(s['sheet'])
        found = [f for f in found if f[0].width * f[0].height > 20000]
        found.sort(key=lambda f: f[1][0])
        floor = max(b[1] + b[3] for _, b in found)
        keep = [found[i] for i in s['keep']]
        pal = shared_palette([f[0] for f in keep], s['colors'])
        frames[name] = []
        for im, b in keep:
            t = trace_with_palette(im, s['scale'], pal, s['speck'])
            # how far this frame's feet sit above the shared floor (negative = in the air)
            t['dy'] = round((b[1] + b[3] - floor) * s['scale'], 1)
            frames[name].append({'w': t['w'], 'h': t['h'], 'dy': t['dy'], 'body': t['body']})
        print(f'frames {name:9} {len(keep)} frames  {sum(len(f["body"]) for f in frames[name]):6} chars')

    note = f'// Generated by tools/build_theme.py from art-src/{theme}/. Do not edit by hand.\n'
    write_ts(hooks / 'sprites.ts', note, 'export type Sprite = { w: number; h: number; body: string }\n',
             'SPRITES: Record<string, Sprite>', sprites)
    write_ts(hooks / 'frames.ts', note, 'export type Frame = { w: number; h: number; dy: number; body: string }\n',
             'FRAMES: Record<string, Frame[]>', frames)


if __name__ == '__main__':
    if len(sys.argv) != 2:
        sys.exit('usage: python tools/build_theme.py <theme>')
    main(sys.argv[1])
