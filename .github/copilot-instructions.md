# プロジェクト規約（Override Styles）

このリポジトリで作業する人間・AI エージェントが共通して従う規約。
ビルド・テスト・ブランチ運用・アーキテクチャ・コミットメッセージの取り決めをここに集約する。

## プロジェクト概要

- ホストごとに任意の CSS を上書きする Google Chrome 拡張機能（Manifest V3）。
- TypeScript + Vite 5 + `@crxjs/vite-plugin`。設定は `chrome.storage.local` に保存（キー接頭辞 `host:`）。

## ビルド・テスト・Lint コマンド

| 目的           | コマンド               |
|----------------|------------------------|
| 開発サーバ     | `npm run dev`          |
| 本番ビルド     | `npm run build`（`tsc --noEmit && vite build`） |
| テスト         | `npm test`（`vitest run`） |
| テスト（監視） | `npm run test:watch`   |
| カバレッジ     | `npm run test:cov`     |
| 脆弱性監査     | `npm run audit`（`audit-ci --config ./audit-ci.jsonc`） |
| Lint           | `npm run lint`         |
| 整形           | `npm run format`       |
| 整形チェック   | `npm run format:check` |

- 開発環境: Node は `.nvmrc`（22）に従う。`package.json` の `engines`（node >=20 / npm >=10）を満たすこと。

## ブランチ運用

- `main` は保護ブランチ。**直接 push・force push・ブランチ削除は禁止**。
- 変更は必ず **作業ブランチ → Pull Request → CI（build-and-test）green → squash マージ** の流れで行う。
- ブランチ名は `<type>/<issue番号>-<短い説明>`（例: `chore/13-dev-environment`）。
- マージ後は作業ブランチを削除する。
- 1 Issue = 1 PR を基本とし、PR 説明に `Closes #<番号>` を書いてクローズする（コミットは `Refs:` のみ）。

## テスト方針

- フレームワークは Vitest + jsdom。テストは実装と同じ場所に `*.test.ts` で置く。
- `chrome` API は `test/fakeChrome.ts` のインメモリ実装を `test/setup.ts` で注入する（実ブラウザ不要）。
- `src/lib/`（`storage.ts` / `inject.ts`）はロジックの中核なのでカバレッジ 100% を維持する。
- 変更を加えたら必ず `npm run lint && npm run format:check && npm run build && npm test && npm run audit` がすべて緑であることを確認してから PR を出す（CI と同等）。

## アーキテクチャ要点

- `src/content.ts`: 各ページに注入されるブートストラップ。`src/lib/inject.ts` の `render` で `<style id="override-styles-injected">` を適用する。
- `src/lib/storage.ts`: `chrome.storage.local` へのアクセス層（取得・保存・監視・import/export）。
- `src/popup/`: ツールバーのポップアップ UI（現在ホストの設定編集）。
- `src/options/`: オプションページ（全ホストの一覧・import/export）。
- popup / options は拡張自身のページで動作し、ページ側 CSP の影響を受けない。content script のみ注入先ページの制約を受ける点に注意する。

## 知識の置き場所ポリシー

チーム開発では「他の人（やその AI）も知るべき」情報が個人ローカルに留まると知識がサイロ化する。AI エージェントのメモリは端末・個人ローカルでチーム共有されないため、**共有すべき知識は AI メモリに留めず、必ず Git 管理ファイルに記録する**。

- 原則: 「他の人（やその AI）も知るべき」と思った瞬間に、AI メモリではなく Git 管理ファイル（Issue / instructions / ADR / docs）へ書く。
- 知識の種類ごとの置き場所:

| 知識の種類                     | 置き場所                                          |
|--------------------------------|---------------------------------------------------|
| 個人の作業メモ・揮発してよいもの | AI メモリ（共有不要）                              |
| チームの AI 向け知識・規約       | `.github/copilot-instructions.md`                 |
| 設計判断の理由                 | `docs/adr/`                                       |
| 流動的なタスク・調査ログ         | GitHub Issues                                     |
| 恒久ルール・手順・仕様           | `README.md` / `docs/` / `CONTRIBUTING.md`         |

### README と docs/ の役割分担

「恒久ルール・手順・仕様」をどこに書くかは、**読み手**で決める。迷ったら README に書かず `docs/` に置く。

| 読み手・内容                                               | 置き場所                              |
|------------------------------------------------------------|---------------------------------------|
| 利用者向け（インストール・使い方・機能概要・FAQ）           | `README.md` / `docs/user-guide.md`    |
| 開発者向け（セットアップ・ビルド・lint/フック・テスト・ブランチ運用） | `docs/development.md` ほか `docs/`     |
| 設計・仕様（アーキテクチャ・データモデル）                   | `docs/`                               |
| 設計判断の理由                                             | `docs/adr/`                           |

- README は利用者向けの入口に保ち、開発者・設計の詳細は `docs/` に置く（README には `docs/` への導線のみ残す）。

### 不変条件: docs / コード / テストは常に一致

- **docs・コード・テストは常に一致した状態を保つ。** コードを変えたら、同じ PR で関連する docs・テストを更新する（乖離を後追いにしない）。
- コードとドキュメントの同期: コードを変更したら README・`docs/` の関連記述に乖離が出ないか確認し、必要なら**同じ PR で更新する**。
- 設計判断をした場合は、その理由を ADR（`docs/adr/`）に残してから実装に移る。
- ドキュメントを書く前に「この内容の読み手は誰か」を確認し、上表の役割分担に従って置き場所を選ぶ。

---

# コミットメッセージ生成ルール（Conventional Commits + Gitmoji）

Copilot がコミットメッセージを生成する際は、以下の形式に従うこと。

## フォーマット

```text
<type>(<scope>): <emoji> <概要>

<body：何を・なぜ。任意。ヘッダとの間に空行1行>

<footer：Refs / BREAKING CHANGE。bodyとの間に空行1行。閉じキーワードは書かない>
```

- `<type>` … 必須。下表のいずれか。
- `<scope>` … 任意（例: `api`, `auth`, `billing`）。
- `<emoji>` … type に対応する Gitmoji を1つ（下表）。
- `<概要>` … ヘッダ1行が72文字以内に収まる簡潔な要約。命令形・末尾ピリオドなし。
  概要の言語（日本語 / 英語）はリポジトリ内で統一する。
- `<body>` `<footer>` の前には必ず空行を1行入れる（Conventional Commits 必須）。

## type と emoji の対応

| type     | emoji | 用途                         | SemVer  |
|----------|-------|------------------------------|---------|
| feat     | ✨    | 新機能                       | minor   |
| fix      | 🐛    | バグ修正                     | patch   |
| perf     | ⚡️    | パフォーマンス改善           | patch   |
| refactor | ♻️    | 挙動を変えない内部改善       | -       |
| docs     | 📝    | ドキュメントのみ             | -       |
| style    | 🎨    | 書式・整形（挙動影響なし）   | -       |
| test     | ✅    | テスト追加・修正             | -       |
| build    | 📦    | ビルド・依存関係             | -       |
| ci       | 👷    | CI 設定・スクリプト          | -       |
| chore    | 🔧    | その他雑務（リリース対象外） | -       |
| revert   | ⏪    | 変更の取り消し               | -       |

- 不要コード/ファイルの削除は独立 type を作らず、`refactor` または `chore` に含める

## 破壊的変更（BREAKING CHANGE）

次のいずれか（または両方）で表現する。`feat` / `fix` と組み合わさると major バンプ対象。

- ヘッダの type/scope 直後に `!` を付ける：`feat(api)!: ✨ …`
- フッターに記述する：`BREAKING CHANGE: <内容と移行方法>`

## フッター（課題リンク）

| 記法              | 用途                                       |
|-------------------|--------------------------------------------|
| `Refs: #456`      | GitHub の課題を参照（閉じない）             |
| `Refs: PROJ-123`  | JIRA / Backlog 等の外部課題キーを参照       |

- 複数課題は `Refs: #1, #2`

## 例

```text
feat(auth): ✨ パスワードリセットフローを追加

メール経由のトークン検証を実装。トークン有効期限は30分。

Refs: #456
```

```text
fix(api)!: 🐛 ページングの既定件数を20から50に変更

BREAKING CHANGE: page_size 未指定時の既定値が変わるため、
既存クライアントの想定件数を確認すること。

Refs: #789
```

## Copilot への指示

- 生成対象がコミットメッセージのとき、このルールを最優先する。
- type と emoji を必ず両方含め、上表の対応を厳守する。
- ヘッダ / body / footer の間の空行（各1行）を守る。
- 課題リンクのフッターはコミットでは `Refs:` のみとし、閉じキーワード（`Closes`/`Fixes` 等）は書かない（クローズは PR 説明で行う）。
- ルールに沿わない既存メッセージを見つけた場合は、修正案を例とともに提示する。

---

# ドキュメント更新ポリシー

このワークスペースはテンプレート化を見据えた**パイロット**であり、規約・設定・ドキュメントは「育てる」前提で運用する。確定したものとして固定せず、より良い方法があれば積極的に見直す。

## 更新の進め方

- AI エージェントは、規約・設定・ドキュメントに改善余地を見つけたら、現状維持に固執せず「追加しますか？」「変更しますか？」と**提案**する。
- 提案の際は、可能な限り**グローバルスタンダード／ベストプラクティス**の観点も併せて示す。
- 変更は本人の確認を得てから反映し、勝手に確定させない。

## 取り扱いに注意するファイル（ユーザー資産）

- `.github/copilot-instructions.md` の「コミットメッセージ生成ルール」セクションと `.github/pull_request_template.md` はユーザー資産。改変する場合は必ず事前に確認する（Prettier の整形対象からも除外済み）。
