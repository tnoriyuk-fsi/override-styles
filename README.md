# Override Styles

[![CI](https://github.com/tnoriyuk-fsi/override-styles/actions/workflows/ci.yml/badge.svg)](https://github.com/tnoriyuk-fsi/override-styles/actions/workflows/ci.yml)

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

## 動作環境

- Google Chrome（または Chromium 系ブラウザ）

## 使い方

1. 任意のサイトを開き、ツールバーの拡張機能アイコンをクリック
2. CSS 入力欄に上書きしたい CSS を入力（例: `body { background: #f5f5f5 !important; }`）
3. 右上のトグルを ON にして **保存**（または `Ctrl` / `Cmd` + `Enter`）

オプションページでは、登録済みホストの一覧・編集・削除や、設定の import / export（バックアップ）ができます。

詳しい使い方は [ユーザーガイド](https://tnoriyuk-fsi.github.io/override-styles/user-guide) を参照してください。

## ドキュメント

設計・開発ドキュメントは VitePress で **サイト公開** しています。

- サイト: <https://tnoriyuk-fsi.github.io/override-styles/>
- ソース: [`docs/`](./docs/)

開発に参加する場合の入口:

- [ユーザーガイド](https://tnoriyuk-fsi.github.io/override-styles/user-guide) — 利用者向けの使い方
- [開発ガイド](https://tnoriyuk-fsi.github.io/override-styles/development) — セットアップ・ビルド・Chrome への読み込み・ブランチ運用
- [テスト方針](https://tnoriyuk-fsi.github.io/override-styles/testing) — テスト構成とカバレッジ方針
- [アーキテクチャ](https://tnoriyuk-fsi.github.io/override-styles/architecture) — システム構成・データフロー・プロジェクト構成
- [リリース手順](https://tnoriyuk-fsi.github.io/override-styles/release) — zip 作成・Web Store 申請・タグ付け

## ライセンス

[MIT](./LICENSE)
