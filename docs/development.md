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
npm run audit        # 依存関係の脆弱性監査（audit-ci）
```

`npm run audit` の許容運用（allowlist / 有効期限）は [セキュリティ](./security.md#依存関係の脆弱性監査) と [ADR-0002](./adr/0002-vulnerability-allowlist-tracking.md) を参照。

## コミット時の自動整形

[husky](https://typicode.github.io/husky/) + [lint-staged](https://github.com/lint-staged/lint-staged) により、`git commit` 時に **ステージ済みファイルへ自動で `eslint --fix` と `prettier --write`** が実行されます。`npm install` を実行すれば（`package.json` の `prepare` スクリプト経由で）フックが自動的に有効化されるため、追加の設定は不要です。

- フック本体: [`.husky/pre-commit`](https://github.com/tnoriyuk-fsi/override-styles/blob/main/.husky/pre-commit)（`npx lint-staged` を実行）
- 対象と処理: `package.json` の `lint-staged` 設定に従い、`.ts` / `.mjs` には `eslint --fix` + `prettier --write`、その他のファイルには `prettier --write` を適用
- 効果: 整形・Lint 漏れによる CI の失敗をコミット前に防ぐ

修正できない Lint エラーがある場合はコミットが中断されるので、エラーを解消してから再度コミットしてください。

## コミット前チェック

PR を出す前に、CI と同等のチェックがすべて緑であることを確認します。

```bash
npm run lint && npm run format:check && npm run build && npm test && npm run audit
```

## ブランチ運用

- `main` は保護ブランチ（直接 push・force push・削除は禁止）。
- 作業ブランチ → Pull Request → CI green → squash マージ。
- ブランチ名は `<type>/<issue番号>-<短い説明>`（例: `docs/24-docs-foundation`）。

詳細は [プロジェクト規約](https://github.com/tnoriyuk-fsi/override-styles/blob/main/.github/copilot-instructions.md) を参照。
