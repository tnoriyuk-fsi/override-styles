import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));

/**
 * src 配下の HTML ファイルの <body> 内容を現在の document.body に流し込む。
 * <script> は実行されないよう除去する（init は動的 import で明示的に走らせる）。
 */
export function loadBodyInto(relPathFromSrc: string): void {
  const html = readFileSync(
    resolve(here, '..', 'src', relPathFromSrc),
    'utf-8',
  );
  const doc = new DOMParser().parseFromString(html, 'text/html');
  doc.querySelectorAll('script').forEach((script) => script.remove());
  document.body.innerHTML = doc.body.innerHTML;
}
