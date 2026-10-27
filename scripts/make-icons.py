"""
CoreCashier's launcher icon, drawn rather than drawn in a drawing program.

A receipt: a pale slip with a torn bottom edge and three lines of type, on the
app's own near-black. Written by hand as PNG bytes so the build needs no image
library and no network — the same rule the rest of this app follows.

Android masks icons to whatever shape the launcher uses, so the glyph is kept
well inside the middle 60% and the background runs to the edges.
"""
import struct, zlib

BG     = (0x05, 0x06, 0x0a)
SLIP   = (0xf2, 0xf4, 0xfb)
INK    = (0x6c, 0x7b, 0xf0)
LINE   = (0x8b, 0x93, 0xae)

def rounded(x, y, w, h, r, px, py):
    """Is (px, py) inside this rounded rectangle?"""
    if not (x <= px < x + w and y <= py < y + h):
        return False
    # Only the four corner squares are curved; the bands between them are
    # straight, and a point in one of those is simply inside.
    cx = x + r if px < x + r else (x + w - 1 - r if px > x + w - 1 - r else None)
    cy = y + r if py < y + r else (y + h - 1 - r if py > y + h - 1 - r else None)
    if cx is None or cy is None:
        return True
    return (px - cx) ** 2 + (py - cy) ** 2 <= r * r

def draw(size, safe=0.62):
    """safe: how much of the tile the glyph may use, for maskable icons."""
    pix = [[BG] * size for _ in range(size)]
    side = int(size * safe)
    sx, sy = (size - side) // 2, (size - side) // 2
    w, h = int(side * 0.78), side
    x = sx + (side - w) // 2
    r = max(2, int(w * 0.10))
    teeth = max(3, int(w * 0.11))          # the torn-off bottom edge

    for py in range(size):
        for px in range(size):
            # The slip, with its bottom edge cut into points.
            if rounded(x, sy, w, h - teeth, r, px, py):
                pix[py][px] = SLIP
            elif sy + h - teeth <= py < sy + h and x <= px < x + w:
                step = (px - x) % (teeth * 2)
                depth = step if step <= teeth else teeth * 2 - step
                if py < sy + h - teeth + depth:
                    pix[py][px] = SLIP

    # Three lines of type: two short, one long and heavy, like a total.
    pad = int(w * 0.17)
    for i, (frac, weight, colour) in enumerate(
        ((0.62, 0.055, LINE), (0.46, 0.055, LINE), (0.74, 0.085, INK))
    ):
        ly = sy + int(h * (0.30 + i * 0.17))
        lh = max(2, int(h * weight))
        lw = int((w - pad * 2) * frac)
        for py in range(ly, min(ly + lh, size)):
            for px in range(x + pad, min(x + pad + lw, size)):
                pix[py][px] = colour
    return pix

def write_png(path, pix):
    size = len(pix)
    raw = bytearray()
    for row in pix:
        raw.append(0)
        for r, g, b in row:
            raw += bytes((r, g, b))
    def chunk(tag, data):
        return (struct.pack(">I", len(data)) + tag + data
                + struct.pack(">I", zlib.crc32(tag + data)))
    png = (b"\x89PNG\r\n\x1a\n"
           + chunk(b"IHDR", struct.pack(">IIBBBBB", size, size, 8, 2, 0, 0, 0))
           + chunk(b"IDAT", zlib.compress(bytes(raw), 9))
           + chunk(b"IEND", b""))
    open(path, "wb").write(png)
    print(f"{path}  {size}x{size}  {len(png) // 1024} kB")

for size, safe, name in (
    (192, 0.70, "app-public/icons/icon-192.png"),
    (512, 0.70, "app-public/icons/icon-512.png"),
    # Maskable: the launcher may crop to a circle, so the glyph sits smaller.
    (512, 0.56, "app-public/icons/maskable-512.png"),
):
    write_png(name, draw(size, safe))
