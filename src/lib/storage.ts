import {
  DEFAULT_SETTING,
  EXPORT_VERSION,
  type DomainSetting,
  type ExportData,
  type Store,
} from './types';

/** chrome.storage に保存する際のキーの接頭辞 */
const KEY_PREFIX = 'host:';

function storageKey(host: string): string {
  return `${KEY_PREFIX}${host}`;
}

function isHostKey(key: string): boolean {
  return key.startsWith(KEY_PREFIX);
}

function hostFromKey(key: string): string {
  return key.slice(KEY_PREFIX.length);
}

/** 任意の値を DomainSetting に正規化する。不正なら null を返す。 */
function normalizeSetting(value: unknown): DomainSetting | null {
  if (typeof value !== 'object' || value === null) return null;
  const v = value as Record<string, unknown>;
  if (typeof v.css !== 'string') return null;
  if (typeof v.enabled !== 'boolean') return null;
  return { enabled: v.enabled, css: v.css };
}

/** 指定ホストの設定を取得する。未保存ならデフォルト値を返す。 */
export async function getSetting(host: string): Promise<DomainSetting> {
  const key = storageKey(host);
  const result = await chrome.storage.local.get(key);
  const value = result[key] as DomainSetting | undefined;
  if (!value) {
    return { ...DEFAULT_SETTING };
  }
  return {
    enabled: Boolean(value.enabled),
    css: typeof value.css === 'string' ? value.css : '',
  };
}

/** 指定ホストの設定を保存する。 */
export async function saveSetting(
  host: string,
  setting: DomainSetting,
): Promise<void> {
  await chrome.storage.local.set({ [storageKey(host)]: setting });
}

/**
 * storage の変更を監視し、指定ホストの設定が変わったらコールバックを呼ぶ。
 * 解除用の関数を返す。
 */
export function watchSetting(
  host: string,
  callback: (setting: DomainSetting) => void,
): () => void {
  const key = storageKey(host);
  const listener = (
    changes: { [name: string]: chrome.storage.StorageChange },
    areaName: string,
  ): void => {
    if (areaName !== 'local') return;
    const change = changes[key];
    if (!change) return;
    const newValue = change.newValue as DomainSetting | undefined;
    callback(newValue ? newValue : { ...DEFAULT_SETTING });
  };
  chrome.storage.onChanged.addListener(listener);
  return () => chrome.storage.onChanged.removeListener(listener);
}

/** 全ホストの設定を取得する。 */
export async function getAllSettings(): Promise<Store> {
  const all = await chrome.storage.local.get(null);
  const store: Store = {};
  for (const [key, value] of Object.entries(all)) {
    if (!isHostKey(key)) continue;
    const setting = normalizeSetting(value);
    if (setting) {
      store[hostFromKey(key)] = setting;
    }
  }
  return store;
}

/**
 * 全ホストの設定を「全置換」する。
 * 既存の host: キーをすべて削除してから、渡された store を書き込む。
 */
export async function setAllSettings(store: Store): Promise<void> {
  const all = await chrome.storage.local.get(null);
  const keysToRemove = Object.keys(all).filter(isHostKey);
  if (keysToRemove.length > 0) {
    await chrome.storage.local.remove(keysToRemove);
  }
  const toSet: Record<string, DomainSetting> = {};
  for (const [host, setting] of Object.entries(store)) {
    toSet[storageKey(host)] = setting;
  }
  if (Object.keys(toSet).length > 0) {
    await chrome.storage.local.set(toSet);
  }
}

/** 指定ホストの設定を削除する。 */
export async function removeSetting(host: string): Promise<void> {
  await chrome.storage.local.remove(storageKey(host));
}

/** 全設定をエクスポート用のJSON文字列にシリアライズする。 */
export function serializeExport(store: Store): string {
  const data: ExportData = {
    version: EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    hosts: store,
  };
  return JSON.stringify(data, null, 2);
}

/**
 * インポート用のJSON文字列を検証してパースする。
 * 形式・スキーマが不正な場合は Error を投げる（部分適用しない）。
 */
export function parseImport(text: string): ExportData {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error(
      'JSONとして解析できません。ファイル形式を確認してください。',
    );
  }
  if (typeof parsed !== 'object' || parsed === null) {
    throw new Error('不正な形式です（オブジェクトではありません）。');
  }
  const obj = parsed as Record<string, unknown>;
  if (typeof obj.version !== 'number') {
    throw new Error('不正な形式です（version がありません）。');
  }
  if (obj.version > EXPORT_VERSION) {
    throw new Error(
      `未対応のバージョンです（version=${obj.version}）。拡張機能を更新してください。`,
    );
  }
  if (typeof obj.hosts !== 'object' || obj.hosts === null) {
    throw new Error('不正な形式です（hosts がありません）。');
  }

  const hosts: Store = {};
  for (const [host, value] of Object.entries(
    obj.hosts as Record<string, unknown>,
  )) {
    const setting = normalizeSetting(value);
    if (!setting) {
      throw new Error(`ホスト "${host}" の設定が不正です。`);
    }
    hosts[host] = setting;
  }

  return {
    version: obj.version,
    exportedAt: typeof obj.exportedAt === 'string' ? obj.exportedAt : '',
    hosts,
  };
}

/**
 * storage の変更を監視し、ホスト設定に変更があればコールバックを呼ぶ。
 * 一覧のライブ更新用。解除用の関数を返す。
 */
export function watchAllSettings(callback: () => void): () => void {
  const listener = (
    changes: { [name: string]: chrome.storage.StorageChange },
    areaName: string,
  ): void => {
    if (areaName !== 'local') return;
    if (Object.keys(changes).some(isHostKey)) {
      callback();
    }
  };
  chrome.storage.onChanged.addListener(listener);
  return () => chrome.storage.onChanged.removeListener(listener);
}
