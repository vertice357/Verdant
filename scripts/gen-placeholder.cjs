// Generates public/assets/sprites/sage.png — a labeled placeholder grid
// matching the spritesheet layout expected by BootScene.js
// Run: node scripts/gen-placeholder.cjs
'use strict'
const zlib = require('zlib')
const fs   = require('fs')
const path = require('path')

const FRAME_W = 128
const FRAME_H = 160
const COLS    = 8
const ROWS    = 3
const IMG_W   = FRAME_W * COLS  // 1024
const IMG_H   = FRAME_H * ROWS  // 480

// How many active frames per row (last slots in each row are dimmed)
const ACTIVE = [8, 7, 5]

// Row themes  [bg r, bg g, bg b,  label r, label g, label b]
const THEMES = [
  [18,  28, 72,   80, 130, 255],  // idle  — navy / blue
  [18,  60, 28,   80, 200,  90],  // walk  — forest / green
  [72,  18, 18,  220,  80,  80],  // attack — maroon / red
]

// ── Tiny 5×7 bitmap font (digits 0-9, letters A-Z subset) ──────────────────
const GLYPHS = {
  '0': [0b01110,0b10001,0b10011,0b10101,0b11001,0b10001,0b01110],
  '1': [0b00100,0b01100,0b00100,0b00100,0b00100,0b00100,0b01110],
  '2': [0b01110,0b10001,0b00001,0b00110,0b01000,0b10000,0b11111],
  '3': [0b11111,0b00001,0b00010,0b00110,0b00001,0b10001,0b01110],
  '4': [0b00010,0b00110,0b01010,0b10010,0b11111,0b00010,0b00010],
  '5': [0b11111,0b10000,0b11110,0b00001,0b00001,0b10001,0b01110],
  '6': [0b00110,0b01000,0b10000,0b11110,0b10001,0b10001,0b01110],
  '7': [0b11111,0b00001,0b00010,0b00100,0b01000,0b01000,0b01000],
  '8': [0b01110,0b10001,0b10001,0b01110,0b10001,0b10001,0b01110],
  '9': [0b01110,0b10001,0b10001,0b01111,0b00001,0b00010,0b01100],
  'I': [0b01110,0b00100,0b00100,0b00100,0b00100,0b00100,0b01110],
  'W': [0b10001,0b10001,0b10001,0b10101,0b10101,0b11011,0b10001],
  'A': [0b01110,0b10001,0b10001,0b11111,0b10001,0b10001,0b10001],
  'L': [0b10000,0b10000,0b10000,0b10000,0b10000,0b10000,0b11111],
  'K': [0b10001,0b10010,0b10100,0b11000,0b10100,0b10010,0b10001],
  'T': [0b11111,0b00100,0b00100,0b00100,0b00100,0b00100,0b00100],
  'C': [0b01110,0b10001,0b10000,0b10000,0b10000,0b10001,0b01110],
  'E': [0b11111,0b10000,0b10000,0b11110,0b10000,0b10000,0b11111],
  'D': [0b11110,0b10001,0b10001,0b10001,0b10001,0b10001,0b11110],
  'O': [0b01110,0b10001,0b10001,0b10001,0b10001,0b10001,0b01110],
  'X': [0b10001,0b01010,0b00100,0b00100,0b00100,0b01010,0b10001],
  ' ': [0,0,0,0,0,0,0],
  '-': [0,0,0,0b11111,0,0,0],
}

// Pixel buffer: flat RGB array indexed by (y * IMG_W + x) * 3
const buf = new Uint8Array(IMG_H * IMG_W * 3)

function setPixel(x, y, r, g, b) {
  if (x < 0 || x >= IMG_W || y < 0 || y >= IMG_H) return
  const i = (y * IMG_W + x) * 3
  buf[i] = r; buf[i+1] = g; buf[i+2] = b
}

function drawChar(ch, x0, y0, r, g, b) {
  const rows = GLYPHS[ch] || GLYPHS[' ']
  for (let row = 0; row < 7; row++) {
    const bits = rows[row]
    for (let col = 0; col < 5; col++) {
      if (bits & (1 << (4 - col))) setPixel(x0 + col, y0 + row, r, g, b)
    }
  }
}

function drawText(str, x, y, r, g, b) {
  for (let i = 0; i < str.length; i++) {
    drawChar(str[i].toUpperCase(), x + i * 6, y, r, g, b)
  }
}

// ── Fill each frame ─────────────────────────────────────────────────────────
const ROW_LABELS = ['IDLE', 'WALK', 'ATK']

for (let row = 0; row < ROWS; row++) {
  const [bgR, bgG, bgB, lblR, lblG, lblB] = THEMES[row]
  const active = ACTIVE[row]

  for (let col = 0; col < COLS; col++) {
    const isActive = col < active
    const x0 = col * FRAME_W
    const y0 = row * FRAME_H

    // Background
    const dimFactor = isActive ? 1.0 : 0.3
    const fr = Math.round(bgR * dimFactor)
    const fg = Math.round(bgG * dimFactor)
    const fb = Math.round(bgB * dimFactor)

    for (let py = y0; py < y0 + FRAME_H; py++) {
      for (let px = x0; px < x0 + FRAME_W; px++) {
        setPixel(px, py, fr, fg, fb)
      }
    }

    if (!isActive) continue

    // White grid border (2 px inside)
    for (let t = 0; t < 2; t++) {
      for (let px = x0 + t; px < x0 + FRAME_W - t; px++) {
        setPixel(px, y0 + t,             255, 255, 255)
        setPixel(px, y0 + FRAME_H-1 - t, 255, 255, 255)
      }
      for (let py = y0 + t; py < y0 + FRAME_H - t; py++) {
        setPixel(x0 + t,             py, 255, 255, 255)
        setPixel(x0 + FRAME_W-1 - t, py, 255, 255, 255)
      }
    }

    // Center crosshair
    const cx = x0 + FRAME_W / 2
    const cy = y0 + FRAME_H / 2
    for (let d = -12; d <= 12; d++) {
      setPixel(cx + d, cy, lblR, lblG, lblB)
      setPixel(cx, cy + d, lblR, lblG, lblB)
    }
    // crosshair center dot (3×3)
    for (let dy = -1; dy <= 1; dy++)
      for (let dx = -1; dx <= 1; dx++)
        setPixel(cx + dx, cy + dy, 255, 255, 255)

    // Row label ("IDLE", "WALK", "ATK") top-left
    if (col === 0) {
      drawText(ROW_LABELS[row], x0 + 6, y0 + 6, lblR, lblG, lblB)
    }

    // Frame index (0-based) bottom-right corner
    const frameIdx = row * COLS + col
    const label = String(frameIdx)
    const lx = x0 + FRAME_W - 6 * label.length - 6
    const ly = y0 + FRAME_H - 14
    drawText(label, lx, ly, lblR, lblG, lblB)

    // Column dots: col+1 filled squares (5×5) spaced along bottom strip
    for (let d = 0; d <= col; d++) {
      const dotX = x0 + 6 + d * 8
      const dotY = y0 + FRAME_H - 22
      for (let dy = 0; dy < 5; dy++)
        for (let dx = 0; dx < 5; dx++)
          setPixel(dotX + dx, dotY + dy, lblR, lblG, lblB)
    }
  }
}

// ── Encode as PNG ───────────────────────────────────────────────────────────
// Build raw scanlines: filter byte 0 (none) + RGB pixels per row
const scanlines = Buffer.alloc(IMG_H * (1 + IMG_W * 3))
for (let y = 0; y < IMG_H; y++) {
  const off = y * (1 + IMG_W * 3)
  scanlines[off] = 0  // filter: None
  for (let x = 0; x < IMG_W; x++) {
    const src = (y * IMG_W + x) * 3
    const dst = off + 1 + x * 3
    scanlines[dst]   = buf[src]
    scanlines[dst+1] = buf[src+1]
    scanlines[dst+2] = buf[src+2]
  }
}

// CRC-32
const CRC_TABLE = (() => {
  const t = new Uint32Array(256)
  for (let i = 0; i < 256; i++) {
    let c = i
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1)
    t[i] = c
  }
  return t
})()

function crc32(buf) {
  let crc = 0xFFFFFFFF
  for (const b of buf) crc = CRC_TABLE[(crc ^ b) & 0xFF] ^ (crc >>> 8)
  return ((crc ^ 0xFFFFFFFF) >>> 0)
}

function makeChunk(type, data) {
  const t = Buffer.from(type, 'ascii')
  const lenBuf = Buffer.alloc(4); lenBuf.writeUInt32BE(data.length)
  const crcBuf = Buffer.alloc(4); crcBuf.writeUInt32BE(crc32(Buffer.concat([t, data])))
  return Buffer.concat([lenBuf, t, data, crcBuf])
}

const IHDR = Buffer.alloc(13)
IHDR.writeUInt32BE(IMG_W, 0)
IHDR.writeUInt32BE(IMG_H, 4)
IHDR[8] = 8; IHDR[9] = 2  // 8-bit RGB

const compressed = zlib.deflateSync(scanlines, { level: 6 })

const png = Buffer.concat([
  Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
  makeChunk('IHDR', IHDR),
  makeChunk('IDAT', compressed),
  makeChunk('IEND', Buffer.alloc(0)),
])

const outPath = path.join(__dirname, '..', 'public', 'assets', 'sprites', 'sage.png')
fs.mkdirSync(path.dirname(outPath), { recursive: true })
fs.writeFileSync(outPath, png)
console.log(`Created ${outPath}  (${IMG_W}×${IMG_H}, ${png.length} bytes)`)
console.log(`  Row 0 (frames  0-7 ): IDLE  — 8 active frames`)
console.log(`  Row 1 (frames  8-14): WALK  — 7 active frames`)
console.log(`  Row 2 (frames 16-20): ATTACK — 5 active frames`)
