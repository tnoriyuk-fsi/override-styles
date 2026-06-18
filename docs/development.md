# 開発ガイド

## 前提

- Node.js >= 20（開発は [`.nvmrc`](https://github.com/tnoriyuk-fsi/override-styles/blob/main/.nvmrc) の 22 を推奨）
- npm >= 10
- Google Chrome（または Chromium 系ブラウザ）

`nvm` を使う場合:

```bash
nvm use
```

## セットアップ

```bash
npm install
```

## 開発サーバ

```bash
npm run dev
```

Vite の開発サーバが起動し、変更が即時反映されます（HMR）。

## ビルド

```bash
npm run build
```

`tsc --noEmit`（型チェック）後に `vite build` を実行し、`dist/` に拡張機能一式を出力します。

## Chrome への読み込み

1. Chrome で `chrome://extensions` を開く
2. 右上の **デベロッパーモード** を ON にする
3. **「パッケージ化されていない拡張機能を読み込む」** をクリック
4. このプロジェクトの `dist/` フォルダを選択する

> dist を再ビルドした後は、`chrome://extensions` で拡張の **更新（リロード）** を押してください。

## Lint / Format

```bash
npm run lint         # ESLint チェック
npm run format       # Prettier で整形
npm run format:check # 整形差分のチェック（変更しない）
```

## コミット前チェック

PR を出す前に、CI と同等のチェックがすべて緑であることを確認します。

```bash
npm run lint && npm run format:check && npm run build && npm test
```

## ブランチ運用

- `main` は保護ブランチ（直接 push・force push・削除は禁止）。
- 作業ブランチ → Pull Request → CI green → squash マージ。
- ブランチ名は `<type>/<issue番号>-<短い説明>`（例: `docs/24-docs-foundation`）。

詳細は [プロジェクト規約](https://github.com/tnoriyuk-fsi/override-styles/blob/main/.github/copilot-instructions.md) を参照。
