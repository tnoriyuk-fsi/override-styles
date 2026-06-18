# データモデル

設定の保存形式と、import/export で扱う JSON 形式をまとめます。型の実体は [`src/lib/types.ts`](https://github.com/tnoriyuk-fsi/override-styles/blob/main/src/lib/types.ts) を参照してください。

## ストレージ

- 保存先: `chrome.storage.local`（アカウント同期なし、端末ローカル）
- キー形式: `host:<ホスト名>`（接頭辞 `host:`）
  - 例: `host:www.example.com`
- ホスト名は `location.hostname`（content）または URL の `hostname`（popup）で取得

## 型

### `DomainSetting`（1ホスト分の設定）

```ts
interface DomainSetting {
  enabled: boolean; // CSS 上書きを有効にするか
  css: string; // 適用する CSS 文字列
}
```

未保存のホストには既定値 `{ enabled: false, css: '' }`（`DEFAULT_SETTING`）を用いる。

### `Store`（全ホストの設定）

```ts
type Store = Record<string, DomainSetting>; // ホスト名 -> 設定
```

## import / export 形式

### `ExportData`

```ts
interface ExportData {
  version: number; // スキーマバージョン（現在 1）
  exportedAt: string; // ISO 8601 のエクスポート日時
  hosts: Store; // ホスト名 -> 設定
}
```

エクスポート例:

```json
{
  "version": 1,
  "exportedAt": "2026-06-16T04:49:59.782Z",
  "hosts": {
    "www.example.com": {
      "enabled": true,
      "css": "body { background: #f5f5f5 !important; }"
    }
  }
}
```

### バリデーション方針

- インポートは厳格に検証し、不正な形式・スキーマの場合は **部分適用せずエラー**にする。
- `version` が現在の `EXPORT_VERSION` より新しい場合は「未対応バージョン」として拒否する。
- インポートは **全置換**（既存の `host:` キーをすべて削除してから書き込む）。実行前のエクスポート（バックアップ）を推奨する。

実装は [`src/lib/storage.ts`](https://github.com/tnoriyuk-fsi/override-styles/blob/main/src/lib/storage.ts) の `parseImport` / `serializeExport` / `setAllSettings` を参照。
