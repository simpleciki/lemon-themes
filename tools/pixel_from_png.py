"""Reads pixel art out of a picture and writes it as character grids for a pixel skin.

    python tools/pixel_from_png.py art-src/pixel-shiba/seq-shiba.png [--frames 3]

A generated pixel-art sheet is a big picture where every "pixel" is a square of about 15-20 real
pixels, with soft edges from the image model. This finds that square size and offset, reads the
colour at the centre of each square, merges near-identical colours into one palette, and prints
one grid per frame (frames are found as columns of the sheet separated by empty space). The output
is TypeScript to paste into a skin: `const PAL = {...}` and `const FRAME_n = [...]`, so the drawing
is copied cell by cell, never redrawn by eye.
"""

import argparse
import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image

LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'


def frame_boxes(alpha: np.ndarray, want: int):
    """Columns with drawing in them, grouped into `want` frames by the widest empty gaps."""
    cols = (alpha > 128).sum(axis=0) > 0
    runs, start = [], None
    for x, on in enumerate(cols):
        if on and start is None:
            start = x
        if not on and start is not None:
            runs.append([start, x])
            start = None
    if start is not None:
        runs.append([start, len(cols)])
    # merge runs separated by small gaps until `want` frames are left
    while len(runs) > want:
        gaps = [runs[i + 1][0] - runs[i][1] for i in range(len(runs) - 1)]
        i = int(np.argmin(gaps))
        runs[i] = [runs[i][0], runs[i + 1][1]]
        del runs[i + 1]
    boxes = []
    for x0, x1 in runs:
        rows = np.where((alpha[:, x0:x1] > 128).sum(axis=1) > 0)[0]
        boxes.append((x0, int(rows[0]), x1, int(rows[-1]) + 1))
    return boxes


def find_grid(rgb: np.ndarray, alpha: np.ndarray, size: float | None = None):
    """The square size and offset where colour stays the same inside each square (size fixed if given)."""
    h, w = alpha.shape
    found = []
    lum = rgb.astype(float).mean(axis=2)
    sizes = [size] if size is not None else [s10 / 10 for s10 in range(100, 320, 2)]
    for s in sizes:
        for ox in np.arange(0, s, s / 8):
            for oy in np.arange(0, s, s / 8):
                xs = np.arange(ox + s / 2, w - 1, s)
                ys = np.arange(oy + s / 2, h - 1, s)
                if len(xs) < 4 or len(ys) < 4:
                    continue
                cx, cy = np.meshgrid(xs.astype(int), ys.astype(int))
                d = int(s * 0.3)
                c = lum[cy, cx]
                err = 0.0
                for dx, dy in [(d, 0), (-d, 0), (0, d), (0, -d)]:
                    err += np.abs(c - lum[np.clip(cy + dy, 0, h - 1), np.clip(cx + dx, 0, w - 1)]).mean()
                found.append((err, s, ox, oy))
    # a 2 x 2 block of real pixels fits as well as one pixel, so of the sizes that fit about as well
    # as the best one, take the biggest
    low = min(f[0] for f in found)
    good = [f for f in found if f[0] <= low * 1.25 + 0.5]
    best_s = max(f[1] for f in good)
    best = min((f for f in good if f[1] == best_s), key=lambda f: f[0])
    return best[1], best[2], best[3]


def read_cells(rgb, alpha, s, ox, oy):
    h, w = alpha.shape
    ys = np.arange(oy, h - s * 0.5, s)
    xs = np.arange(ox, w - s * 0.5, s)
    cells = []
    for y in ys:
        row = []
        for x in xs:
            y0, y1 = int(y + s * 0.3), int(y + s * 0.7) + 1
            x0, x1 = int(x + s * 0.3), int(x + s * 0.7) + 1
            a = alpha[y0:y1, x0:x1]
            if a.mean() < 128:
                row.append(None)
            else:
                # the most common colour in the middle of the square (rounded to 8 levels), so a square
                # that straddles an edge takes its main colour instead of a blend
                px = (rgb[y0:y1, x0:x1].reshape(-1, 3) // 8) * 8 + 4
                vals, counts = np.unique(px, axis=0, return_counts=True)
                row.append(tuple(int(v) for v in vals[int(np.argmax(counts))]))
        cells.append(row)
    return cells


def palette_of(all_cells, merge=34):
    """Near-identical colours merged greedily, most common first."""
    counts = {}
    for cells in all_cells:
        for row in cells:
            for c in row:
                if c is not None:
                    counts[c] = counts.get(c, 0) + 1
    pal = []
    for c, _ in sorted(counts.items(), key=lambda kv: -kv[1]):
        if not any(sum((a - b) ** 2 for a, b in zip(c, p)) ** 0.5 < merge for p in pal):
            pal.append(c)
    return pal


def nearest(c, pal):
    return min(range(len(pal)), key=lambda i: sum((a - b) ** 2 for a, b in zip(c, pal[i])))


def trim(grid):
    rows = [r for r in grid]
    while rows and set(rows[0]) <= {'.'}:
        rows.pop(0)
    while rows and set(rows[-1]) <= {'.'}:
        rows.pop()
    if not rows:
        return rows
    left = min(len(r) - len(r.lstrip('.')) for r in rows)
    right = max(len(r.rstrip('.')) for r in rows)
    return [r[left:right] for r in rows]


def fill_islands(grid, colour, into, most, like=frozenset()):
    """Small patches of `colour` (at most `most` cells) that touch only `into` or `colour` become `into`:
    a pattern drawn inside a light area (hearts on a chest) without touching the outline."""
    g = [list(r) for r in grid]
    seen = set()
    for y in range(len(g)):
        for x in range(len(g[y])):
            if g[y][x] != colour or (y, x) in seen:
                continue
            stack, comp, edge = [(y, x)], [], set()
            seen.add((y, x))
            while stack:
                cy, cx = stack.pop()
                comp.append((cy, cx))
                for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                    ny, nx = cy + dy, cx + dx
                    if 0 <= ny < len(g) and 0 <= nx < len(g[ny]):
                        c = g[ny][nx]
                        if c == colour and (ny, nx) not in seen:
                            seen.add((ny, nx))
                            stack.append((ny, nx))
                        elif c != colour:
                            edge.add(c)
            if len(comp) <= most and edge <= ({into} | set(like)):
                for cy, cx in comp:
                    g[cy][cx] = into
    return [''.join(r) for r in g]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('png')
    ap.add_argument('--frames', type=int, default=3)
    ap.add_argument('--merge', type=int, default=50)
    ap.add_argument('--fill', default='', help='colour>into:most, e.g. e47c24>ffffff:8 (by nearest palette colour)')
    ap.add_argument('--mirror', action='store_true', help='make every frame exactly symmetric: the right half copies the left')
    ap.add_argument('--ts', action='store_true', help='write an exportable TypeScript module')
    ap.add_argument('--recolor', default='', help='comma list old=new hex colours, e.g. f2d9c0=ffffff')
    args = ap.parse_args()
    im = Image.open(args.png).convert('RGBA')
    arr = np.array(im)
    rgb, alpha = arr[:, :, :3], arr[:, :, 3]
    boxes = frame_boxes(alpha, args.frames)
    H, W = alpha.shape
    size = None
    all_cells = []
    for x0, y0, x1, y1 in boxes:
        # a margin round each frame so the outline's cells are whole; the grid is found per frame,
        # since the image model does not keep one grid across the sheet
        m = 40
        X0, Y0, X1, Y1 = max(0, x0 - m), max(0, y0 - m), min(W, x1 + m), min(H, y1 + m)
        sub_rgb, sub_a = rgb[Y0:Y1, X0:X1], alpha[Y0:Y1, X0:X1]
        s, ox, oy = find_grid(sub_rgb, sub_a, size)
        size = s
        print(f'// frame at x {x0}: cell {s:.2f}px, offset {ox:.1f},{oy:.1f}', file=sys.stderr)
        all_cells.append(read_cells(sub_rgb, sub_a, s, ox, oy))
    pal = palette_of(all_cells, args.merge)
    for pair in filter(None, args.recolor.split(',')):
        old_hex, new_hex = pair.split('=')
        want = tuple(int(old_hex[i:i + 2], 16) for i in (0, 2, 4))
        i = nearest(want, pal)
        pal[i] = tuple(int(new_hex[j:j + 2], 16) for j in (0, 2, 4))
    # colours that ended up nearly the same (a recolour next to a highlight) become one
    same = {}
    for j in range(len(pal)):
        for i in range(j):
            if i not in same and sum((a - b) ** 2 for a, b in zip(pal[i], pal[j])) ** 0.5 < 24:
                same[j] = i
                break
    remap = lambda k: same.get(k, k)
    hexc = lambda h: tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))
    ex = 'export ' if args.ts else ''
    if args.ts:
        print(f'// Generated by tools/pixel_from_png.py from {Path(args.png).name}. Copied cell by cell; do not edit by hand.')
    print(f'{ex}const PAL: Record<string, string> = ' + json.dumps({LETTERS[i]: '#%02x%02x%02x' % c for i, c in enumerate(pal) if i not in same}))
    grids = []
    for n, cells in enumerate(all_cells):
        grid = [''.join('.' if c is None else LETTERS[remap(nearest(c, pal))] for c in row) for row in cells]
        grid = trim(grid)
        if args.fill:
            src, rest = args.fill.split('>')
            dst, most = rest.split(':')
            into = LETTERS[nearest(hexc(dst), pal)]
            # every palette colour close to the target counts as the target (two near-whites, say)
            like = {LETTERS[i] for i, c in enumerate(pal) if sum((a - b) ** 2 for a, b in zip(c, hexc(dst))) ** 0.5 < 24}
            grid = fill_islands(grid, LETTERS[nearest(hexc(src), pal)], into, int(most), like)
        if args.mirror:
            w = max(len(r) for r in grid)
            grid = [r.ljust(w, '.') for r in grid]
            grid = [r[: (w + 1) // 2] + r[: w // 2][::-1] for r in grid]
        grids.append(grid)
    for n, grid in enumerate(grids):
        print(f'{ex}const FRAME_{n} = [')
        for r in grid:
            print(f"  '{r}',")
        print(']')


if __name__ == '__main__':
    main()
