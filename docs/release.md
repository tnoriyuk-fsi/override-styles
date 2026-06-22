# リリース手順

## バージョニング

[Semantic Versioning](https://semver.org/lang/ja/) に従う（`MAJOR.MINOR.PATCH`）。バージョンの単一情報源（SSOT）は [`package.json`](https://github.com/tnoriyuk-fsi/override-styles/blob/main/package.json) の `version`。[`manifest.config.ts`](https://github.com/tnoriyuk-fsi/override-styles/blob/main/manifest.config.ts) はこれを import して参照するため、バージョン更新は `package.json` の 1 箇所だけで済む。

## 配布用 zip の作成

```bash
npm run zip
```

`npm run build` を実行した上で、`release/override-styles-v<version>.zip`（ルートに `manifest.json` を含む）を出力します。`release/` は Git 管理外です。

## Chrome Web Store への申請

> 詳細手順は今後追記する（issue #10）。

1. Chrome Web Store デベロッパーダッシュボードに登録（初回のみ登録料が必要）
2. `npm run zip` で生成した zip をアップロード
3. 掲載情報（説明・スクリーンショット・カテゴリ）を入力
4. 権限の正当化を記入（[セキュリティ](./security.md) 参照）
5. [プライバシーポリシー](./privacy.md) を指定
6. 審査に提出

## リリースタグ

公開後、Git タグと GitHub Release を作成する。

```bash
git tag v<version>
git push origin v<version>
```

変更点は [CHANGELOG](https://github.com/tnoriyuk-fsi/override-styles/blob/main/CHANGELOG.md) に記録する（issue #11）。
