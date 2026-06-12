import { DEFAULT_SETTING, type DomainSetting } from './types';

/** chrome.storage に保存する際のキーの接頭辞 */
const KEY_PREFIX = 'host:';

function storageKey(host: string): string {
  return `${KEY_PREFIX}${host}`;
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
