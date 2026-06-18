# Changelog

このプロジェクトのすべての重要な変更をこのファイルに記録します。

書式は [Keep a Changelog](https://keepachangelog.com/ja/1.1.0/) に従い、
バージョニングは [Semantic Versioning](https://semver.org/lang/ja/) に従います。

## [Unreleased]

## [1.0.0] - 2026-06-14

### Added

- ホストごとに任意の CSS を表示中のページへ注入する機能（Manifest V3）。
- ホスト名単位での設定の保存・管理（`chrome.storage.local`、キー接頭辞 `host:`）。
- ホストごとの上書きの有効・無効（ON/OFF）の切り替え。
- 保存・トグル操作を開いているタブへ即時反映するライブ反映。
- オプションページでの全ホスト設定の一覧・編集・削除。
- 全設定の JSON での import / export（インポートは全置換）。

[Unreleased]: https://github.com/tnoriyuk-fsi/override-styles/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/tnoriyuk-fsi/override-styles/releases/tag/v1.0.0
