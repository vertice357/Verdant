#!/usr/bin/env python3
"""
process-sheet.py  –  Strip background + resize a 4×4 sprite sheet.

Usage:
    python scripts/process-sheet.py <input> <bg_hex> <output>

Example:
    python scripts/process-sheet.py raw-dew.png "#16431E" assets/sprites/dew-sheet.png

The script:
  • Removes pixels whose colour is within tolerance 30 (euclidean) of bg_hex
  • Resizes each of the 16 frames (4 cols × 4 rows) from their source size to
    64×64 px with 6 px padding (content centred at 52×52)
  • Saves a combined 256×256 result
  • Prints per-frame margin summary for the 4 idle frames (row 0)
"""

import sys
import math
from PIL import Image


def hex_to_rgb(hex_color: str) -> tuple[int, int, int]:
    h = hex_color.lstrip("#")
    if len(h) != 6:
        raise ValueError(f"Expected 6-digit hex colour, got: {hex_color!r}")
    return int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16)


def remove_background(img: Image.Image, bg_rgb: tuple[int, int, int], tolerance: int = 30) -> Image.Image:
    """Return a copy of *img* (RGBA) with bg-coloured pixels made transparent."""
    rgba = img.convert("RGBA")
    pixels = rgba.load()
    w, h = rgba.size
    br, bg_c, bb = bg_rgb
    for y in range(h):
        for x in range(w):
            r, g, b, a = pixels[x, y]
            dist = math.sqrt((r - br) ** 2 + (g - bg_c) ** 2 + (b - bb) ** 2)
            if dist <= tolerance:
                pixels[x, y] = (r, g, b, 0)
    return rgba


def content_bounds(frame: Image.Image) -> tuple[int, int, int, int] | None:
    """Return (left, top, right, bottom) bounding box of non-transparent pixels, or None."""
    data = frame.load()
    w, h = frame.size
    min_x, min_y, max_x, max_y = w, h, -1, -1
    for y in range(h):
        for x in range(w):
            if data[x, y][3] > 0:
                min_x = min(min_x, x)
                min_y = min(min_y, y)
                max_x = max(max_x, x)
                max_y = max(max_y, y)
    if max_x < 0:
        return None
    return min_x, min_y, max_x + 1, max_y + 1


def resize_frame(frame: Image.Image, target: int = 64, padding: int = 6) -> Image.Image:
    """Fit content inside (target - 2*padding) × (target - 2*padding), centred."""
    content_size = target - 2 * padding  # 52
    # Scale preserving aspect ratio
    cw, ch = frame.size
    scale = min(content_size / cw, content_size / ch)
    new_w = max(1, round(cw * scale))
    new_h = max(1, round(ch * scale))
    resized = frame.resize((new_w, new_h), Image.LANCZOS)
    # Paste into target×target canvas, centred
    canvas = Image.new("RGBA", (target, target), (0, 0, 0, 0))
    offset_x = (target - new_w) // 2
    offset_y = (target - new_h) // 2
    canvas.paste(resized, (offset_x, offset_y), resized)
    return canvas


def main() -> None:
    if len(sys.argv) != 4:
        print("Usage: process-sheet.py <input> <bg_hex> <output>", file=sys.stderr)
        sys.exit(1)

    input_path, bg_hex, output_path = sys.argv[1], sys.argv[2], sys.argv[3]
    bg_rgb = hex_to_rgb(bg_hex)

    src = Image.open(input_path)
    print(f"Loaded {input_path}  ({src.size[0]}×{src.size[1]}  mode={src.mode})")

    src_no_bg = remove_background(src, bg_rgb, tolerance=30)

    COLS, ROWS = 4, 4
    FRAME_TARGET = 64
    FRAME_PADDING = 6

    src_w, src_h = src_no_bg.size
    frame_src_w = src_w // COLS
    frame_src_h = src_h // ROWS

    out = Image.new("RGBA", (FRAME_TARGET * COLS, FRAME_TARGET * ROWS), (0, 0, 0, 0))

    idle_bounds_report: list[tuple[int, str, tuple | None]] = []

    for row in range(ROWS):
        for col in range(COLS):
            # Crop the source frame
            left   = col * frame_src_w
            top    = row * frame_src_h
            right  = left + frame_src_w
            bottom = top  + frame_src_h
            raw_frame = src_no_bg.crop((left, top, right, bottom))

            bounds = content_bounds(raw_frame)

            # For idle frames (row 0), collect margin info
            if row == 0:
                frame_names = ["idle_down", "idle_up", "idle_left", "idle_right"]
                idle_bounds_report.append((col, frame_names[col], bounds))

            if bounds is not None:
                # Crop to tight content before resize
                tight = raw_frame.crop(bounds)
            else:
                tight = raw_frame

            frame_out = resize_frame(tight, target=FRAME_TARGET, padding=FRAME_PADDING)

            dest_x = col * FRAME_TARGET
            dest_y = row * FRAME_TARGET
            out.paste(frame_out, (dest_x, dest_y), frame_out)

    out.save(output_path)
    print(f"Saved  {output_path}  ({FRAME_TARGET * COLS}×{FRAME_TARGET * ROWS})")

    # ── Idle frame margin summary ────────────────────────────────────────────
    print("\nIdle frame margin summary (source pixels before resize):")
    for col, name, bounds in idle_bounds_report:
        if bounds is None:
            print(f"  frame {col} {name:15s}  — empty")
        else:
            bx0, by0, bx1, by1 = bounds
            margin_l = bx0
            margin_t = by0
            margin_r = frame_src_w - bx1
            margin_b = frame_src_h - by1
            print(
                f"  frame {col} {name:15s}  "
                f"L={margin_l:3d}  T={margin_t:3d}  R={margin_r:3d}  B={margin_b:3d}  "
                f"content=({bx1 - bx0}×{by1 - by0})"
            )


if __name__ == "__main__":
    main()
