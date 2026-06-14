# Override Styles

ホストごとに任意の CSS を上書きする Google Chrome 拡張機能（Manifest V3）です。

表示中のページに独自の CSS を注入してデザインを上書きできます。設定はホスト単位（例: `www.example.com`）で保存され、サイトごとに有効・無効を切り替えられます。

## 主な機能

- **CSS の上書き**: 現在表示しているページに任意の CSS を適用
- **ホストごとの設定**: ホスト名単位で CSS を保存・管理
- **ON/OFF 切り替え**: ホストごとに上書きの有効・無効を切り替え
- **ライブ反映**: 保存・トグル操作が開いているタブへ即時反映
- **設定の一覧管理**: オプションページで全ホストの設定を一覧・編集・削除
- **インポート / エクスポート**: 全設定を JSON でバックアップ・復元（インポートは全置換）

## 技術スタック

- Manifest V3
- TypeScript
- Vite + [`@crxjs/vite-plugin`](https://github.com/crxjs/chrome-extension-tools)
- ストレージ: `chrome.storage.local`

## 動作要件

- Node.js >= 18
- Google Chrome（または Chromium 系ブラウザ）

## セットアップ

```bash
npm install
```

## ビルド

```bash
npm run build
```

`dist/` に拡張機能一式が出力されます。

開発時はホットリロードが使えます。

```bash
npm run dev
```

## Chrome への読み込み

1. Chrome で `chrome://extensions` を開く
2. 右上の **デベロッパーモード** を ON にする
3. **「パッケージ化されていない拡張機能を読み込む」** をクリック
4. このプロジェクトの `dist/` フォルダを選択する

## 使い方

### CSS を上書きする

1. 任意のサイトを開き、ツールバーの拡張機能アイコンをクリック
2. CSS 入力欄に上書きしたい CSS を入力（例: `body { background: #f5f5f5 !important; }`）
3. 右上のトグルを ON にして **保存**（または `Ctrl` / `Cmd` + `Enter`）

設定したホストを再訪問すると、自動的に CSS が適用されます。

### 設定を管理する

ポップアップの「設定一覧を開く」、または `chrome://extensions` の拡張機能詳細から **オプション** を開くと、登録済みホストの一覧を表示できます。

- 各ホストの ON/OFF 切り替え
- CSS のその場編集
- ホスト設定の削除

### バックアップ（インポート / エクスポート）

オプションページの **バックアップ** セクションから操作します。

- **エクスポート**: 全ホストの設定を JSON ファイルとして保存
- **インポート**: JSON ファイルを読み込み、**現在の設定をすべて置き換え**

> [!IMPORTANT]
> インポートは現在の設定をすべて上書きします。実行前に必ずエクスポートでバックアップしてください。

## プロジェクト構成

```text
override-styles/
├─ manifest.config.ts   # MV3 マニフェスト定義
├─ vite.config.ts       # Vite + crxjs 設定
├─ icons/               # 拡張機能アイコン
├─ scripts/
│  └─ generate-icons.mjs # アイコン生成スクリプト（依存なし）
├─ src/
│  ├─ content.ts        # CSS を注入する content script
│  ├─ lib/
│  │  ├─ types.ts       # 型定義
│  │  └─ storage.ts     # chrome.storage アクセス層
│  ├─ popup/            # ツールバーのポップアップ UI
│  └─ options/          # オプションページ（一覧・import/export）
└─ docs/
   └─ PLAN.md           # 実装計画
```

## ライセンス

[MIT](./LICENSE)
