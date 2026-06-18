# テスト方針

## フレームワーク

- [Vitest](https://vitest.dev/) + jsdom 環境
- テストは実装と同じ場所に `*.test.ts` で置く

## 実行

```bash
npm test           # 1 回実行
npm run test:watch # ウォッチモード
npm run test:cov   # カバレッジ付き
```

## chrome API のフェイク

実ブラウザを使わずに `chrome.storage` などを検証するため、インメモリのフェイク（[`test/fakeChrome.ts`](https://github.com/tnoriyuk-fsi/override-styles/blob/main/test/fakeChrome.ts)）を [`test/setup.ts`](https://github.com/tnoriyuk-fsi/override-styles/blob/main/test/setup.ts) で各テスト前に注入します。

- `onChanged` のイベント発火を再現
- `_dump()` / `_emit()` などのテスト補助を提供

HTML を使う結合テストでは [`test/loadHtml.ts`](https://github.com/tnoriyuk-fsi/override-styles/blob/main/test/loadHtml.ts) で実ファイルの HTML を読み込み、`<script>` を除去して `document.body` に流し込みます。

## カバレッジ方針

- `src/lib/`（`storage.ts` / `inject.ts`）はロジックの中核なので **カバレッジ 100%** を維持する。
- popup / options は結合テストで主要フローを担保する。

## テスト構成（現状）

| ファイル                      | 対象         | 内容                                          |
| ----------------------------- | ------------ | --------------------------------------------- |
| `src/lib/storage.test.ts`     | storage 層   | 取得・保存・監視・import/export・エッジケース |
| `src/lib/inject.test.ts`      | CSS 注入     | 適用・更新・解除（jsdom）                     |
| `src/popup/popup.test.ts`     | ポップアップ | 主要フロー（chrome.tabs/runtime をモック）    |
| `src/options/options.test.ts` | オプション   | import/export・行操作                         |

## CI

GitHub Actions（`build-and-test`, Node 22）で `npm ci → lint → format:check → build → test` を実行します。`main` への PR は CI green が必須です。
