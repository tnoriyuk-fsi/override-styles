# ADR-0001: content script を単一バンドルにする

- ステータス: Proposed
- 日付: 2026-06-16
- 関連: #18

## Context（背景）

特定サイトでのみ CSS 上書きが効き、多くのサイト（yahoo.co.jp、SharePoint、社内グループウェア等）で効かない事象が発生した。

調査の結果、@crxjs/vite-plugin のビルドでは content script 本体が直接実行されず、小さな「ローダー」が実行時に `import(chrome.runtime.getURL(...))` で本体チャンクを取りに行く 2 段構成になっていることが分かった。

```js
// dist/assets/content.ts-loader-*.js
const { onExecute } = await import(
  chrome.runtime.getURL('assets/content.ts-XXXX.js')
);
```

これには 2 つの失敗モードがある。

- **(A) ハッシュ不一致による `ERR_FILE_NOT_FOUND`**: 開発者モードで dist を再ビルドするとファイル名のハッシュが変わり、ロード済みの古いローダーが「もう存在しない旧ハッシュの本体」を指して 404 になる。拡張をリロードすると解消する。
- **(B) 厳しい CSP サイトでの動的 import ブロック**: 注入先ページの CSP 次第で `import(chrome.runtime.getURL(...))` がブロックされうる。配布版でも起こりうる構造的リスク。

今回踏んだのは主に (A) だが、(B) も予防したい。

## Decision（決定）

content script（`src/content.ts` とその依存 `src/lib/inject.ts` / `src/lib/storage.ts` / `src/lib/types.ts`）を、動的 import を持たない **単一バンドル（IIFE）** にビルドする。ローダー・別ハッシュ依存・実行時 import を排除し、Chrome が注入して即実行する 1 ファイルにする。

- popup / options は対象外（拡張自身のページで動作し、ページ CSP の影響を受けないため現状維持）。
- 実装候補: Vite / rollup の output で content エントリの `inlineDynamicImports` 相当を有効化、または content script のみ独立ビルド（IIFE フォーマット）にして lib を内包する。

## Consequences（結果）

**得られるもの**

- ビルド世代がズレても 404 で content が不動作にならない（(A) を解消）。
- 厳しい CSP サイトでも注入が通る（(B) を予防）。

**失うもの・トレードオフ**

- 開発時の content 向け HMR が効きにくくなる（手動リロードで対応）。
- lib コードが content 用に複製され数 KB 増える。
- ビルド設定が一手間増える（一度設定すれば以後不要）。

機能面のデメリットはない（`async/await` は IIFE 内でも動作し、現コードはそのまま使える）。
