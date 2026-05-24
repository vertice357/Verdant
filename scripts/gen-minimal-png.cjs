#!/usr/bin/env node
'use strict'
const zlib = require('zlib')
const fs = require('fs')
const path = require('path')

// Create a minimal 256×160 PNG (2 frames of 128×160)
const W = 256, H = 160

// Build raw scanline data
const raw = Buffer.alloc(H * (1 + W * 3))
let off = 0

for (let y = 0; y < H; y++) {
  raw[off++] = 0 // filter: None

  for (let x = 0; x < W; x++) {
    // Left frame: red, Right frame: blue
    const r = x < 128 ? 200 : 50
    const g = 50
    const b = x < 128 ? 50 : 200

    raw[off++] = r
    raw[off++] = g
    raw[off++] = b
  }
}

// Compress
const compressed = zlib.deflateSync(raw)

// Build IHDR
const ihdr = Buffer.alloc(13)
ihdr.writeUInt32BE(W, 0)
ihdr.writeUInt32BE(H, 4)
ihdr[8] = 8    // 8-bit
ihdr[9] = 2    // RGB
ihdr[10] = 0   // compression: deflate
ihdr[11] = 0   // filter: adaptive
ihdr[12] = 0   // interlace: none

// CRC
const CRC_TABLE = new Uint32Array(256)
for (let i = 0; i < 256; i++) {
  let c = i
  for (let k = 0; k < 8; k++) {
    c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1)
  }
  CRC_TABLE[i] = c
}

function crc32(buf) {
  let c = 0xFFFFFFFF
  for (let i = 0; i < buf.length; i++) {
    c = CRC_TABLE[(c ^ buf[i]) & 0xFF] ^ (c >>> 8)
  }
  return (c ^ 0xFFFFFFFF) >>> 0
}

function chunk(type, data) {
  const t = Buffer.from(type, 'ascii')
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length, 0)
  const crcVal = crc32(Buffer.concat([t, data]))
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crcVal, 0)
  return Buffer.concat([len, t, data, crc])
}

const png = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]),
  chunk('IHDR', ihdr),
  chunk('IDAT', compressed),
  chunk('IEND', Buffer.alloc(0)),
])

const outPath = path.join(__dirname, '..', 'public', 'assets', 'sprites', 'sage.png')
fs.writeFileSync(outPath, png)
console.log(`✓ Created minimal test PNG: ${W}×${H} (${png.length} bytes)`)
console.log(`  2 frames of 128×160 (left=red, right=blue)`)
