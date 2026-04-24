#!/usr/bin/env node
/**
 * Generates solid-color PNG placeholders for every asset that app.json
 * references. Apple / Google will reject builds missing these files, but we
 * also don't want git to carry real-looking brand art before the designer
 * finalizes it — so we ship flat emerald-on-navy placeholders that are the
 * right dimensions, clearly recognizable as "not final", and small (~1 KB
 * each).
 *
 * Run: `node mobile/scripts/generate-placeholder-assets.mjs`
 *
 * Idempotent: overwrites every file every run.
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { deflateSync } from "node:zlib";

// ── Tiny PNG writer (no deps) ───────────────────────────────────────────────
function crc32(bytes) {
  let c;
  const table = [];
  for (let n = 0; n < 256; n++) {
    c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c >>> 0;
  }
  let crc = 0xffffffff;
  for (const b of bytes) crc = table[(crc ^ b) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, "ascii");
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crc]);
}

function makeSolidPng({ width, height, rgb, markerRgb }) {
  // IHDR.
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // color type: truecolor RGB
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  // Raw pixels: filter byte (0) per scanline, then RGB. We paint a solid
  // background and stamp a centered emerald block so the placeholder is
  // visually distinct from "missing image".
  const stride = width * 3;
  const raw = Buffer.alloc((stride + 1) * height);
  const blockW = Math.max(4, Math.floor(width / 3));
  const blockH = Math.max(4, Math.floor(height / 3));
  const x0 = Math.floor((width - blockW) / 2);
  const y0 = Math.floor((height - blockH) / 2);
  let p = 0;
  for (let y = 0; y < height; y++) {
    raw[p++] = 0; // no filter
    for (let x = 0; x < width; x++) {
      const inside =
        x >= x0 && x < x0 + blockW && y >= y0 && y < y0 + blockH;
      const c = inside ? markerRgb : rgb;
      raw[p++] = c[0];
      raw[p++] = c[1];
      raw[p++] = c[2];
    }
  }
  const idat = deflateSync(raw);

  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  return Buffer.concat([
    signature,
    chunk("IHDR", ihdr),
    chunk("IDAT", idat),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

const NAVY = [10, 15, 20]; // #0A0F14 — brand background
const EMERALD = [6, 193, 103]; // #06C167 — brand accent
const TRANSPARENT_NAVY = NAVY; // (no alpha in truecolor; marker only)

const here = dirname(fileURLToPath(import.meta.url));
const assets = resolve(here, "..", "assets");
mkdirSync(assets, { recursive: true });

const files = [
  { name: "icon.png", w: 1024, h: 1024, rgb: NAVY, marker: EMERALD },
  { name: "adaptive-icon.png", w: 1024, h: 1024, rgb: NAVY, marker: EMERALD },
  { name: "splash.png", w: 1242, h: 2436, rgb: NAVY, marker: EMERALD },
  { name: "notification-icon.png", w: 96, h: 96, rgb: NAVY, marker: EMERALD },
  { name: "favicon.png", w: 48, h: 48, rgb: NAVY, marker: EMERALD },
];

for (const f of files) {
  const buf = makeSolidPng({
    width: f.w,
    height: f.h,
    rgb: f.rgb,
    markerRgb: f.marker,
  });
  const out = resolve(assets, f.name);
  writeFileSync(out, buf);
  console.log(`wrote ${f.name}  (${f.w}×${f.h}, ${buf.length} bytes)`);
}
