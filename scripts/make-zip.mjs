// dist/ を Chrome Web Store 配布用 zip にまとめるスクリプト。
// `npm run zip`（build 後に実行）で release/override-styles-v<version>.zip を生成する。
// manifest.json が zip のルートに来るよう dist の中身を格納する。依存なし。
import {
  createWriteStream,
  mkdirSync,
  readdirSync,
  statSync,
  readFileSync,
} from 'node:fs';
import { deflateRawSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative, sep } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const DIST_DIR = join(ROOT, 'dist');
const OUT_DIR = join(ROOT, 'release');

const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'));
const OUT_FILE = join(OUT_DIR, `override-styles-v${pkg.version}.zip`);

// ---- CRC32 ----
const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return ~c >>> 0;
}

// ---- DOS 日時（固定値で再現性を確保: 1980-01-01）----
const DOS_TIME = 0;
const DOS_DATE = (1 << 5) | 1; // 1980年1月1日

function collectFiles(dir) {
  const files = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) {
      files.push(...collectFiles(full));
    } else {
      files.push(full);
    }
  }
  return files;
}

function toZipPath(absPath) {
  // zip 内は常に '/' 区切り
  return relative(DIST_DIR, absPath).split(sep).join('/');
}

function buildZip(files) {
  const localParts = [];
  const central = [];
  let offset = 0;

  for (const file of files) {
    const data = readFileSync(file);
    const name = Buffer.from(toZipPath(file), 'utf8');
    const compressed = deflateRawSync(data, { level: 9 });
    const crc = crc32(data);

    // ローカルファイルヘッダ
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0); // signature
    local.writeUInt16LE(20, 4); // version needed
    local.writeUInt16LE(0x0800, 6); // flags: UTF-8
    local.writeUInt16LE(8, 8); // method: deflate
    local.writeUInt16LE(DOS_TIME, 10);
    local.writeUInt16LE(DOS_DATE, 12);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(compressed.length, 18);
    local.writeUInt32LE(data.length, 22);
    local.writeUInt16LE(name.length, 26);
    local.writeUInt16LE(0, 28); // extra length

    localParts.push(local, name, compressed);

    // セントラルディレクトリヘッダ
    const cen = Buffer.alloc(46);
    cen.writeUInt32LE(0x02014b50, 0);
    cen.writeUInt16LE(20, 4); // version made by
    cen.writeUInt16LE(20, 6); // version needed
    cen.writeUInt16LE(0x0800, 8); // flags: UTF-8
    cen.writeUInt16LE(8, 10); // method
    cen.writeUInt16LE(DOS_TIME, 12);
    cen.writeUInt16LE(DOS_DATE, 14);
    cen.writeUInt32LE(crc, 16);
    cen.writeUInt32LE(compressed.length, 20);
    cen.writeUInt32LE(data.length, 24);
    cen.writeUInt16LE(name.length, 28);
    cen.writeUInt32LE(offset, 42); // local header offset
    central.push(cen, name);

    offset += local.length + name.length + compressed.length;
  }

  const centralBuf = Buffer.concat(central);
  const localBuf = Buffer.concat(localParts);

  // End of central directory
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(files.length, 8); // entries on this disk
  eocd.writeUInt16LE(files.length, 10); // total entries
  eocd.writeUInt32LE(centralBuf.length, 12);
  eocd.writeUInt32LE(localBuf.length, 16); // central dir offset

  return Buffer.concat([localBuf, centralBuf, eocd]);
}

try {
  statSync(DIST_DIR);
} catch {
  console.error(
    'dist/ が見つかりません。先に `npm run build` を実行してください。',
  );
  process.exit(1);
}

const files = collectFiles(DIST_DIR).sort();
if (files.length === 0) {
  console.error('dist/ が空です。先に `npm run build` を実行してください。');
  process.exit(1);
}

mkdirSync(OUT_DIR, { recursive: true });
const zip = buildZip(files);
const stream = createWriteStream(OUT_FILE);
stream.write(zip);
stream.end();
stream.on('finish', () => {
  console.log(
    `created ${relative(ROOT, OUT_FILE)} (${zip.length} bytes, ${files.length} files)`,
  );
});
