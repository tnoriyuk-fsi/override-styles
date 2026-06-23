# セキュリティ

Chrome 拡張機能（Manifest V3）としての権限・安全性に関する方針をまとめます。Chrome Web Store の審査でも参照できる内容です。

## 要求する権限とその正当化

| 権限                           | 用途                                             | 正当化                                                |
| ------------------------------ | ------------------------------------------------ | ----------------------------------------------------- |
| `storage`                      | ホストごとの CSS 設定を保存する                  | 機能の中核。`chrome.storage.local` に端末ローカル保存 |
| `tabs`                         | ポップアップでアクティブタブのホスト名を取得する | 現在表示中サイトの設定を編集するため                  |
| `host_permissions: <all_urls>` | 任意のサイトに CSS を適用する                    | ユーザーが設定した任意ホストで動作する必要があるため  |

> 権限は機能に必要な最小限に保つ。不要になった権限は速やかに削除する。

## content script の注入

- 注入する要素は `<style id="override-styles-injected">` のみ。スクリプトは注入しない。
- 適用するのはユーザー自身が入力した CSS のみ。外部からの取得・実行は行わない。

## CSP（Content Security Policy）

- content script は注入先ページの CSP の影響を受ける。content の実行が外部リソースや動的 import に依存しないようにする（[ADR-0001](./adr/0001-content-script-bundling.md) 参照）。
- popup / options は拡張自身のページで動作し、ページ側 CSP の影響を受けない。

## データの取り扱い

- 収集・外部送信するデータはない。設定はすべて端末ローカル（`chrome.storage.local`）に保存される。
- import/export はユーザーが明示的に操作したときのみ、ローカルファイルとして読み書きする。

詳細は [プライバシーポリシー](./privacy.md) を参照。

## 依存関係の脆弱性監査

依存パッケージの脆弱性は [`audit-ci`](https://github.com/IBM/audit-ci) で CI ゲート化している。設計判断の背景は [ADR-0002](./adr/0002-vulnerability-allowlist-tracking.md) を参照。

- `npm run audit` で監査する（CI でも `npm ci` 直後に実行される）。`moderate` 以上の脆弱性があれば失敗する。
- 許容する脆弱性は [`audit-ci.jsonc`](https://github.com/tnoriyuk-fsi/override-styles/blob/main/audit-ci.jsonc) の `allowlist` に **GHSA ID・理由（`notes`）・有効期限（`expiry`）付き**で登録する。
  - allowlist に無い脆弱性が出ると CI が失敗する（= 新規問題に必ず気づける）。
  - `expiry` が切れると CI が失敗する（= 許容したままでよいかを定期的に再点検する）。
- 期限到来や CI 失敗時は、`allowlist` の延長（再評価のうえ `expiry` を更新）または解消（依存更新で脆弱性を除去）を行う。

> 現在の許容は、`vitepress` が内部固定する vite5 → esbuild チェーン由来の脆弱性（docs ビルド専用・配布する拡張本体に非影響・`fixAvailable:false`）。恒久解消には vitepress 2（現状 alpha）への更新が必要。

## GitHub Actions のサプライチェーン硬化

CI / Deploy Docs の GitHub Actions は、可変の major タグ（例 `@v7`）ではなく**不変のコミット SHA で固定（pin）**する。

- すべての `uses:` を `owner/action@<40 桁の full SHA> # vX.Y.Z` 形式で参照する（バージョンはコメントで併記）。
- 目的は、上流 Action が侵害されて同じタグに悪意あるコードが再公開されても、**実行されるコードを不変に保つ**こと（OpenSSF / GitHub のハードニング推奨）。
- SHA の更新は Dependabot（`github-actions`, 週次）が PR で追従し、コメントの semver も併せて書き換える。新しい SHA に上げる際は公式 `actions/*` リポジトリの該当バージョンを確認する。

## 脆弱性の報告

セキュリティ上の問題を見つけた場合の報告手順は、今後 `SECURITY.md` を整備して案内します（issue #15）。
