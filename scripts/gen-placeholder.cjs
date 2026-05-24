#!/usr/bin/env node
'use strict'
const zlib = require('zlib')
const fs   = require('fs')
const path = require('path')

const FRAME_W = 128
const FRAME_H = 160
const COLS    = 8
const ROWS    = 3
const IMG_W   = FRAME_W * COLS
const IMG_H   = FRAME_H * ROWS

const ACTIVE = [8, 7, 5]
const THEMES = [
  [20,  40, 100],  // idle  — blue
  [40,  100, 40],  // walk  — green
  [100, 40,  40],  // attack — red
]

// CRC-32 lookup table
const CRC_TABLE = new Uint32Array(256)
for (let i = 0; i < 256; i++) {
  let c = i
  for (let k = 0; k < 8; k++) {
    c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1)
  }
  CRC_TABLE[i] = c >>> 0
}

function crc32(data) {
  let crc = 0xFFFFFFFF
  for (let i = 0; i < data.length; i++) {
    crc = CRC_TABLE[(crc ^ data[i]) & 0xFF] ^ (crc >>> 8)
  }
  return (crc ^ 0xFFFFFFFF) >>> 0
}

// Build raw image data
console.log(`Generating ${IMG_W}×${IMG_H} placeholder...`)
const raw = Buffer.alloc(IMG_H * (1 + IMG_W * 3))
let off = 0

for (let y = 0; y < IMG_H; y++) {
  raw[off++] = 0 // filter: None

  for (let x = 0; x < IMG_W; x++) {
    const col = Math.floor(x / FRAME_W)
    const row = Math.floor(y / FRAME_H)
    const fx = x % FRAME_W
    const fy = y % FRAME_H
    const isActive = col < ACTIVE[row]

    let r, g, b

    if (!isActive) {
      // Dimmed inactive frame
      r = 40; g = 40; b = 40
    } else if (fx < 2 || fx >= FRAME_W - 2 || fy < 2 || fy >= FRAME_H - 2) {
      // White border
      r = 220; g = 220; b = 220
    } else {
      // Colored interior with brightness gradient
      const [br, bg, bb] = THEMES[row]
      const grad = 0.6 + (col / (COLS - 1)) * 0.4
      r = Math.round(br * grad)
      g = Math.round(bg * grad)
      b = Math.round(bb * grad)

      // Crosshair center
      const cx = FRAME_W / 2, cy = FRAME_H / 2
      if (Math.abs(fx - cx) <= 1 || Math.abs(fy - cy) <= 1) {
        r = 200; g = 200; b = 200
      }
    }

    raw[off++] = r
    raw[off++] = g
    raw[off++] = b
  }
}

// Compress
console.log('Compressing...')
const compressed = zlib.deflateSync(raw)

// Build IHDR chunk
const ihdr = Buffer.alloc(13)
ihdr.writeUInt32BE(IMG_W, 0)
ihdr.writeUInt32BE(IMG_H, 4)
ihdr[8] = 8    // bit depth
ihdr[9] = 2    // color type: RGB
ihdr[10] = 0   // compression
ihdr[11] = 0   // filter
ihdr[12] = 0   // interlace

// Build PNG chunks
function makeChunk(type, data) {
  const typeB = Buffer.from(type, 'ascii')
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length, 0)

  const crcData = Buffer.concat([typeB, data])
  const crcVal = Buffer.alloc(4)
  crcVal.writeUInt32BE(crc32(crcData), 0)

  return Buffer.concat([len, typeB, data, crcVal])
}

const png = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]), // PNG signature
  makeChunk('IHDR', ihdr),
  makeChunk('IDAT', compressed),
  makeChunk('IEND', Buffer.alloc(0)),
])

const outPath = path.join(__dirname, '..', 'public', 'assets', 'sprites', 'sage.png')
fs.mkdirSync(path.dirname(outPath), { recursive: true })
fs.writeFileSync(outPath, png)

console.log(`✓ Created ${outPath}`)
console.log(`  Size: ${png.length} bytes`)
console.log(`  Layout: ${COLS} cols × ${ROWS} rows (${FRAME_W}×${FRAME_H} per frame)`)
console.log(`  Row 0 (frames  0-7 ): IDLE   — ${ACTIVE[0]} active`)
console.log(`  Row 1 (frames  8-14): WALK   — ${ACTIVE[1]} active`)
console.log(`  Row 2 (frames 16-20): ATTACK — ${ACTIVE[2]} active`)
