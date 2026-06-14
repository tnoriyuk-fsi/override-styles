/** 1ホスト分の設定 */
export interface DomainSetting {
  /** CSS上書きを有効にするか */
  enabled: boolean;
  /** 適用するCSS文字列 */
  css: string;
}

/** ストレージ全体: ホスト名 -> 設定 */
export type Store = Record<string, DomainSetting>;

/** 設定が未保存のホストに使うデフォルト値 */
export const DEFAULT_SETTING: DomainSetting = {
  enabled: false,
  css: '',
};

/** エクスポート/インポートで扱うJSONの形式 */
export interface ExportData {
  /** スキーマバージョン（将来の互換性のため） */
  version: number;
  /** エクスポート日時（ISO 8601文字列） */
  exportedAt: string;
  /** ホスト名 -> 設定 */
  hosts: Store;
}

/** 現在のエクスポート形式バージョン */
export const EXPORT_VERSION = 1;
