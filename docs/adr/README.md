# ADR（Architecture Decision Records）

設計上の重要な判断を、背景・決定・結果とともに記録します。「なぜその設計にしたか」を残すことで、後から参加する人間や AI が経緯を追えるようにします。

## 一覧

| ID                                                 | タイトル                                    | ステータス |
| -------------------------------------------------- | ------------------------------------------- | ---------- |
| [0001](./0001-content-script-bundling.md)          | content script を単一バンドルにする         | Proposed   |
| [0002](./0002-vulnerability-allowlist-tracking.md) | 脆弱性の許容を期限付き allowlist で追跡する | Accepted   |

## 書き方

- 新しい判断をしたら [`template.md`](./template.md) をコピーし、連番（`NNNN-短いタイトル.md`）で追加する。
- ステータスは `Proposed`（提案中）→ `Accepted`（採用）→ 必要に応じて `Superseded by NNNN`（後続に置換）。
- 一度 `Accepted` にした ADR は原則書き換えず、変更が必要なら新しい ADR で上書きする（決定の履歴を残すため）。
