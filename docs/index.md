# Override Styles ドキュメント

ホストごとに任意の CSS を上書きする Google Chrome 拡張機能（Manifest V3）の設計ドキュメントです。

このドキュメントは「設計の正」として、コードおよびテストと一致した状態を保ちながら育てます。実装前の計画書ではなく、**現在の仕様・設計判断**を記録します。

## 目次

### 設計・仕様

- [アーキテクチャ](./architecture.md) — システム構成・データフロー・開発環境（Vite / crxjs / Vitest）の役割
- [データモデル](./data-model.md) — ストレージスキーマと import/export 形式
- [ADR（設計判断記録）](./adr/) — なぜその設計にしたかの記録

### 開発

- [開発ガイド](./development.md) — セットアップ・ビルド・ローカル実行
- [テスト方針](./testing.md) — テスト構成とカバレッジ方針
- [セキュリティ](./security.md) — 権限の正当化・CSP・注入の安全性
- [リリース手順](./release.md) — zip 作成・Web Store 申請・タグ付け

### 利用者向け

- [ユーザーガイド](./user-guide.md) — 使い方
- [プライバシーポリシー](./privacy.md)
- [FAQ / トラブルシューティング](./faq.md)

### その他

- [ロードマップ](./roadmap.md) — 今後の方針

## 関連リンク

- [README](https://github.com/tnoriyuk-fsi/override-styles/blob/main/README.md) — プロジェクト概要
- [変更履歴（CHANGELOG）](https://github.com/tnoriyuk-fsi/override-styles/blob/main/CHANGELOG.md) — リリースごとの変更点
- [プロジェクト規約](https://github.com/tnoriyuk-fsi/override-styles/blob/main/.github/copilot-instructions.md) — 人間・AI 共通の規約
