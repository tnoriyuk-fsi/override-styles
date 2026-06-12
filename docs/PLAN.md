# CSS上書き Chrome拡張機能 — 実装計画

現在表示中ページのCSSを上書きし、**ホスト名ごと**にCSSを保存・ON/OFF切替できる
Manifest V3 拡張機能を、TypeScript + Vite (`@crxjs/vite-plugin`) で開発する。
保存は `chrome.storage.local`。content script が `<style>` を注入し、storage変更を
監視してライブ更新。popup でCSS編集とトグルを行う。

## 決定事項

- **計画書**: `docs/PLAN.md` としてワークスペース内へ保存（dist 等は `.gitignore` で除外）
- **開発**: TypeScript + Vite + `@crxjs/vite-plugin`（HMR・MV3対応）
- **保存**: `chrome.storage.local`（アカウント同期なし）
- **ドメイン粒度**: ホスト名単位（`location.hostname`、例 `www.example.com`）
- **CSS適用方式**: content script が `<style id="override-styles-injected">` を注入
- **ストレージスキーマ**: `{ [hostname]: { enabled: boolean, css: string } }`

## Phase 0: 開発環境整備

- Node.js (>=18) / npm 確認 → **Node v25.6.0 / npm 11.8.0 確認済み**
- `npm create vite@latest . -- --template vanilla-ts`（空フォルダに生成）
- `npm i -D @crxjs/vite-plugin@beta`
- 不要な Vite デフォルト資産（デモ用 `index.html`・`counter.ts` 等）整理

## Phase 1: プロジェクト構成 & manifest

- `manifest.config.ts`（MV3）:
  - `manifest_version: 3`, `name`, `version`, `description`
  - `permissions: ["storage", "tabs"]`
  - `host_permissions: ["<all_urls>"]`
  - `content_scripts: [{ matches:["<all_urls>"], js:["src/content.ts"], run_at:"document_start" }]`
  - `action: { default_popup: "src/popup/index.html" }`
- `vite.config.ts` に `crx({ manifest })` を設定
- ディレクトリ: `src/content.ts`, `src/popup/`, `src/lib/storage.ts`, `src/lib/types.ts`

## Phase 2: ストレージ層 (src/lib/)

- `types.ts`: `DomainSetting = { enabled: boolean; css: string }`, `Store = Record<string, DomainSetting>`
- `storage.ts`: `getSetting(host)`, `saveSetting(host, setting)`, デフォルト値処理
  - `chrome.storage.local.get` / `set` を Promise ラップ

## Phase 3: content script (src/content.ts)

- 起動時: `location.hostname` で設定取得 → enabled なら `<style>` 注入
- `applyCss(css)` / `removeCss()`: id付き style要素を作成・更新・削除
- `chrome.storage.onChanged` 監視 → 当該hostの変更を即反映（ライブ更新）

## Phase 4: popup UI (src/popup/)

- `index.html` + `popup.ts` + `popup.css`
- 起動時: `chrome.tabs.query` で activeタブのURL→hostname表示
- 要素: ホスト名ラベル / ON-OFFトグル(checkbox) / CSS入力textarea / 保存ボタン
- 保存時: `storage.saveSetting()` 呼び出し（onChanged経由でcontentが反映）
- トグル変更も保存に反映

## Phase 5: ビルド & Chrome読み込み

- `npm run build` → `dist` 生成（または `npm run dev` でHMR）
- `chrome://extensions` → デベロッパーモードON → 「パッケージ化されていない拡張機能を読み込む」→ `dist` 選択

## Phase 6: 動作確認

1. 任意サイトでpopupを開き、CSS入力（例 `body{background:red!important}`）+ ON → 保存 → 即反映
2. トグルOFF → スタイル解除を確認
3. 別ホストに移動 → 設定が独立していることを確認
4. ページリロード後も設定が維持されることを確認
5. content script のエラーがないか DevTools コンソール確認

## スコープ外（今回含めない）

- options ページ、CSSシンタックスハイライト、import/export、sync同期
- Chrome ウェブストア公開作業
