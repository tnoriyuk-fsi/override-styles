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

---

# 機能拡張 Plan B: オプションページ + インポート/エクスポート + 一覧管理

初期実装(v0.1.0)に対する機能追加。**目的は「書き換えたCSSを失わない」こと**を主眼に、
手動バックアップ(JSON import/export)と全ホスト設定の一覧管理を提供する。
ブランチ: `feat/options-import-export`。

## 背景・狙い

- `chrome.storage.local` のみだと、拡張機能の削除・再インストールや端末移行で設定を失う
- **インポート/エクスポート(JSON)** で手動バックアップ・復元・別PC移行を可能にする
- **オプションページ + ホスト一覧** で「どのサイトに何を設定したか」を俯瞰・管理できるようにする
  （popup は狭いため、一覧/入出力はオプションページに集約する）

## 決定事項(Plan B)

- 保存先は引き続き `chrome.storage.local`（sync同期は今回も見送り）
- オプションページを新設し、popup とストレージ層(`src/lib/storage.ts`)を共有する
- オプション表示方式: **独立タブ（`options_page`）** で開く
- 一覧の編集UI: **その場編集（一覧内で textarea を展開して保存）**
- エクスポート形式: バージョン付きJSON `{ version: 1, exportedAt: ISO文字列, hosts: { [host]: { enabled, css } } }`
- インポート時の競合方針: **全置換のみ**（マージは複雑になるため採用しない）
  - 全置換は既存設定を上書きするため、**実行前にエクスポートでのバックアップを促す**
  - 適用直前に確認ダイアログ（`window.confirm`）で警告し、誤操作を防ぐ
- インポートは JSON 形式・スキーマを検証し、不正なら中断してエラー表示（部分適用しない）

## Phase B-1: ストレージ層の拡張 (src/lib/)

- `getAllSettings(): Promise<Store>` — 全ホスト設定を取得（`host:` プレフィックスのキーを収集）
- `setAllSettings(store): Promise<void>` — 全置換（既存の `host:` キーを削除してから書き込む）
- `removeSetting(host): Promise<void>` — 指定ホストの設定を削除
- import/export 用の型と検証関数:
  - `ExportData = { version: number; exportedAt: string; hosts: Store }`
  - `serializeExport(store): string` / `parseImport(text): ExportData`（形式・型を厳密に検証）

## Phase B-2: オプションページ (src/options/)

- `index.html` + `options.ts` + `options.css`、manifest に `options_page` を追加（独立タブで開く）
- **ホスト一覧**: 登録済みホストをテーブル/カード表示
  - 各行: ホスト名 / ON-OFFトグル / CSS要約(先頭数十文字) / 編集 / 削除
  - 編集: その場で textarea を展開して保存（その場編集）
  - 削除: 確認の上 `removeSetting()`
  - 並べ替え: ホスト名昇順など（最小はソート表示のみ。ドラッグ並べ替えは任意）
- **エクスポート**: 「エクスポート」ボタン → 全設定をJSON化し `<a download>` でファイル保存
  （ファイル名例: `override-styles-backup-YYYYMMDD.json`）
- **インポート**: ファイル選択(`<input type=file>`) → 読込 → 検証 → **全置換**で適用
  - 適用は既存設定をすべて上書きするため、ボタン付近にバックアップ推奨の注意書きを表示
  - 適用直前に確認ダイアログで「現在の設定はすべて置き換わります。先にエクスポートしましたか?」と警告
  - 適用後は `chrome.storage.onChanged` 経由で各タブの content に自動反映
- ストレージ変更を監視して一覧をライブ更新

## Phase B-3: popup からの導線

- popup フッターに「設定一覧を開く」リンクを追加 → `chrome.runtime.openOptionsPage()`

## Phase B-4: ビルド & 動作確認

1. `npm run build` で型チェック込みビルドが通ること
2. オプションページが開き、既存ホスト設定が一覧表示される
3. エクスポート → JSONファイルがDLされ、中身が `version/hosts` 構造であること
4. 設定を変更/削除した後、インポート(全置換)で元の状態に戻ること
5. インポート実行前に確認ダイアログ（バックアップ推奨の警告）が表示されること
6. 不正JSONのインポートがエラーで中断され、既存データが壊れないこと
7. オプションページでの変更が開いているタブに即反映されること
8. 一覧からの削除・トグルが content に反映されること

## スコープ外（今回も含めない）

- `chrome.storage.sync` 同期、自動バックアップ(世代管理)
- CSSシンタックスハイライト/構文チェック、スニペット/テンプレート
- 適用範囲のサブドメイン一括指定、アイコンバッジ表示
- Chrome ウェブストア公開作業
