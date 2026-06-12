// 依存なしでアイコンPNG(16/32/48/128px)を生成するスクリプト。
// `node scripts/generate-icons.mjs` で public/icons/ に出力する。
import { deflateSync } from 'node:zlib';
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, '..', 'icons');

// ---- 低レベル: PNG エンコード ----
function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return ~c >>> 0;
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type, 'latin1');
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crc]);
}

function encodePng(size, rgba) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  // 10,11,12 = 0 (compression, filter, interlace)

  // 各行の先頭にフィルタタイプ0を付与
  const stride = size * 4;
  const raw = Buffer.alloc((stride + 1) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (stride + 1)] = 0;
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, y * stride + stride);
  }
  const idat = deflateSync(raw, { level: 9 });

  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// ---- 描画: スーパーサンプリングでアンチエイリアス ----
const SS = 4; // 1ピクセルあたり SS*SS サンプル

function lerp(a, b, t) {
  return a + (b - a) * t;
}

// 角丸矩形の内側か判定 (unit座標 0..1)
function insideRoundRect(x, y, r) {
  const minX = r,
    maxX = 1 - r;
  const minY = r,
    maxY = 1 - r;
  let cx = x,
    cy = y;
  if (x < minX) cx = minX;
  else if (x > maxX) cx = maxX;
  if (y < minY) cy = minY;
  else if (y > maxY) cy = maxY;
  const dx = x - cx,
    dy = y - cy;
  return dx * dx + dy * dy <= r * r;
}

// 線分(カプセル)までの距離 (unit座標)
function distToSegment(px, py, ax, ay, bx, by) {
  const dx = bx - ax,
    dy = by - ay;
  const len2 = dx * dx + dy * dy;
  let t = len2 === 0 ? 0 : ((px - ax) * dx + (py - ay) * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  const cx = ax + t * dx,
    cy = ay + t * dy;
  return Math.hypot(px - cx, py - cy);
}

function renderIcon(size) {
  const rgba = Buffer.alloc(size * size * 4);
  const R = 0.22; // 角丸半径
  // ブラシストローク(白い斜めカプセル)
  const ax = 0.3,
    ay = 0.72,
    bx = 0.72,
    by = 0.3,
    strokeR = 0.11;
  // 短い副ストローク
  const a2x = 0.32,
    a2y = 0.5,
    b2x = 0.5,
    b2y = 0.32,
    stroke2R = 0.055;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let bgCov = 0,
        fgCov = 0,
        gradAccum = 0;
      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const ux = (x + (sx + 0.5) / SS) / size;
          const uy = (y + (sy + 0.5) / SS) / size;
          if (insideRoundRect(ux, uy, R)) {
            bgCov++;
            gradAccum += (ux + uy) / 2; // 対角グラデーション係数
            const d1 = distToSegment(ux, uy, ax, ay, bx, by);
            const d2 = distToSegment(ux, uy, a2x, a2y, b2x, b2y);
            if (d1 <= strokeR || d2 <= stroke2R) fgCov++;
          }
        }
      }
      const total = SS * SS;
      const i = (y * size + x) * 4;
      if (bgCov === 0) {
        rgba[i] = rgba[i + 1] = rgba[i + 2] = rgba[i + 3] = 0;
        continue;
      }
      // 背景グラデーション: indigo(#6366f1) -> violet(#a855f7)
      const g = gradAccum / bgCov;
      const bgR = Math.round(lerp(0x63, 0xa8, g));
      const bgG = Math.round(lerp(0x66, 0x55, g));
      const bgB = Math.round(lerp(0xf1, 0xf7, g));
      // 前景(白)の被覆率で合成
      const fg = fgCov / total;
      const bg = bgCov / total;
      const outA = Math.max(bg, fg);
      const r = Math.round(lerp(bgR, 255, fg / Math.max(bg, fg || 1)));
      const gg = Math.round(lerp(bgG, 255, fg / Math.max(bg, fg || 1)));
      const b = Math.round(lerp(bgB, 255, fg / Math.max(bg, fg || 1)));
      rgba[i] = r;
      rgba[i + 1] = gg;
      rgba[i + 2] = b;
      rgba[i + 3] = Math.round(outA * 255);
    }
  }
  return rgba;
}

mkdirSync(OUT_DIR, { recursive: true });
for (const size of [16, 32, 48, 128]) {
  const rgba = renderIcon(size);
  const png = encodePng(size, rgba);
  const file = join(OUT_DIR, `icon${size}.png`);
  writeFileSync(file, png);
  console.log(`generated ${file} (${png.length} bytes)`);
}
