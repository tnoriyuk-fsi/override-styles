import { describe, it, expect } from 'vitest';
import {
  getSetting,
  saveSetting,
  getAllSettings,
  setAllSettings,
  removeSetting,
  watchSetting,
  watchAllSettings,
  serializeExport,
  parseImport,
} from './storage';
import { DEFAULT_SETTING, EXPORT_VERSION, type Store } from './types';

describe('getSetting / saveSetting', () => {
  it('未保存のホストはデフォルト値を返す', async () => {
    const setting = await getSetting('example.com');
    expect(setting).toEqual(DEFAULT_SETTING);
  });

  it('デフォルト値を変更してもストアに影響しない（コピーを返す）', async () => {
    const setting = await getSetting('example.com');
    setting.enabled = true;
    expect(DEFAULT_SETTING.enabled).toBe(false);
  });

  it('保存した設定を取得できる', async () => {
    await saveSetting('example.com', { enabled: true, css: 'body{}' });
    const setting = await getSetting('example.com');
    expect(setting).toEqual({ enabled: true, css: 'body{}' });
  });

  it('css が文字列でない場合は空文字に正規化する', async () => {
    await globalThis.fakeChrome.storage.local.set({
      'host:bad.com': { enabled: true, css: 123 },
    });
    const setting = await getSetting('bad.com');
    expect(setting).toEqual({ enabled: true, css: '' });
  });
});

describe('getAllSettings', () => {
  it('host: プレフィックスのキーのみを集める', async () => {
    await globalThis.fakeChrome.storage.local.set({
      'host:a.com': { enabled: true, css: 'a' },
      'host:b.com': { enabled: false, css: 'b' },
      other: 'ignored',
    });
    const store = await getAllSettings();
    expect(store).toEqual({
      'a.com': { enabled: true, css: 'a' },
      'b.com': { enabled: false, css: 'b' },
    });
  });

  it('不正な設定値は除外する', async () => {
    await globalThis.fakeChrome.storage.local.set({
      'host:good.com': { enabled: true, css: 'ok' },
      'host:bad.com': { enabled: 'yes', css: 'ng' },
    });
    const store = await getAllSettings();
    expect(store).toEqual({ 'good.com': { enabled: true, css: 'ok' } });
  });

  it('css が文字列でない／null の設定値は除外する', async () => {
    await globalThis.fakeChrome.storage.local.set({
      'host:a.com': { enabled: true, css: 'ok' },
      'host:b.com': { enabled: true, css: 123 },
      'host:c.com': null,
    });
    const store = await getAllSettings();
    expect(store).toEqual({ 'a.com': { enabled: true, css: 'ok' } });
  });
});

describe('setAllSettings（全置換）', () => {
  it('既存の host: キーを削除してから書き込む', async () => {
    await saveSetting('old.com', { enabled: true, css: 'old' });
    await setAllSettings({ 'new.com': { enabled: false, css: 'new' } });
    const store = await getAllSettings();
    expect(store).toEqual({ 'new.com': { enabled: false, css: 'new' } });
  });

  it('host: 以外のキーは削除しない', async () => {
    await globalThis.fakeChrome.storage.local.set({ keepMe: 'value' });
    await setAllSettings({ 'x.com': { enabled: true, css: 'x' } });
    const dump = globalThis.fakeChrome._dump();
    expect(dump.keepMe).toBe('value');
  });

  it('空の store を渡すと全ホストが消える', async () => {
    await saveSetting('a.com', { enabled: true, css: 'a' });
    await setAllSettings({});
    const store = await getAllSettings();
    expect(store).toEqual({});
  });
});

describe('removeSetting', () => {
  it('指定ホストの設定を削除する', async () => {
    await saveSetting('a.com', { enabled: true, css: 'a' });
    await removeSetting('a.com');
    const store = await getAllSettings();
    expect(store).toEqual({});
  });
});

describe('watchSetting', () => {
  it('対象ホストの変更で新しい値を受け取る', async () => {
    const received: unknown[] = [];
    const unwatch = watchSetting('a.com', (s) => received.push(s));
    await saveSetting('a.com', { enabled: true, css: 'a' });
    expect(received).toEqual([{ enabled: true, css: 'a' }]);
    unwatch();
  });

  it('別ホストの変更では呼ばれない', async () => {
    const received: unknown[] = [];
    const unwatch = watchSetting('a.com', (s) => received.push(s));
    await saveSetting('b.com', { enabled: true, css: 'b' });
    expect(received).toEqual([]);
    unwatch();
  });

  it('削除時はデフォルト値を受け取る', async () => {
    await saveSetting('a.com', { enabled: true, css: 'a' });
    const received: unknown[] = [];
    const unwatch = watchSetting('a.com', (s) => received.push(s));
    await removeSetting('a.com');
    expect(received).toEqual([DEFAULT_SETTING]);
    unwatch();
  });

  it('解除後は呼ばれない', async () => {
    const received: unknown[] = [];
    const unwatch = watchSetting('a.com', (s) => received.push(s));
    unwatch();
    await saveSetting('a.com', { enabled: true, css: 'a' });
    expect(received).toEqual([]);
  });

  it('local 以外のエリアの変更は無視する', () => {
    const received: unknown[] = [];
    const unwatch = watchSetting('a.com', (s) => received.push(s));
    globalThis.fakeChrome._emit(
      { 'host:a.com': { newValue: { enabled: true, css: 'a' } } },
      'sync',
    );
    expect(received).toEqual([]);
    unwatch();
  });
});

describe('watchAllSettings', () => {
  it('host: キーの変更で呼ばれる', async () => {
    let count = 0;
    const unwatch = watchAllSettings(() => count++);
    await saveSetting('a.com', { enabled: true, css: 'a' });
    expect(count).toBe(1);
    unwatch();
  });

  it('host: 以外のキー変更では呼ばれない', async () => {
    let count = 0;
    const unwatch = watchAllSettings(() => count++);
    await globalThis.fakeChrome.storage.local.set({ other: 'x' });
    expect(count).toBe(0);
    unwatch();
  });

  it('local 以外のエリアの変更は無視する', () => {
    let count = 0;
    const unwatch = watchAllSettings(() => count++);
    globalThis.fakeChrome._emit(
      { 'host:a.com': { newValue: { enabled: true, css: 'a' } } },
      'sync',
    );
    expect(count).toBe(0);
    unwatch();
  });
});

describe('serializeExport', () => {
  it('version と hosts を含む JSON を出力する', () => {
    const store: Store = { 'a.com': { enabled: true, css: 'a' } };
    const json = serializeExport(store);
    const parsed = JSON.parse(json);
    expect(parsed.version).toBe(EXPORT_VERSION);
    expect(parsed.hosts).toEqual(store);
    expect(typeof parsed.exportedAt).toBe('string');
  });
});

describe('parseImport', () => {
  it('正常な JSON をパースできる', () => {
    const store: Store = { 'a.com': { enabled: true, css: 'a' } };
    const json = serializeExport(store);
    const result = parseImport(json);
    expect(result.hosts).toEqual(store);
    expect(result.version).toBe(EXPORT_VERSION);
  });

  it('serializeExport との往復で同値になる', () => {
    const store: Store = {
      'a.com': { enabled: true, css: 'body{color:red}' },
      'b.com': { enabled: false, css: '' },
    };
    const result = parseImport(serializeExport(store));
    expect(result.hosts).toEqual(store);
  });

  it('exportedAt が無い場合は空文字になる', () => {
    const json = JSON.stringify({ version: EXPORT_VERSION, hosts: {} });
    const result = parseImport(json);
    expect(result.exportedAt).toBe('');
  });

  it('壊れた JSON は throw する', () => {
    expect(() => parseImport('{ broken')).toThrow();
  });

  it('オブジェクトでない（配列）は throw する', () => {
    expect(() => parseImport('[]')).toThrow();
  });

  it('null は throw する', () => {
    expect(() => parseImport('null')).toThrow();
  });

  it('version が無い場合は throw する', () => {
    expect(() => parseImport(JSON.stringify({ hosts: {} }))).toThrow();
  });

  it('未対応の未来 version は throw する', () => {
    const json = JSON.stringify({ version: EXPORT_VERSION + 1, hosts: {} });
    expect(() => parseImport(json)).toThrow();
  });

  it('hosts が無い場合は throw する', () => {
    expect(() =>
      parseImport(JSON.stringify({ version: EXPORT_VERSION })),
    ).toThrow();
  });

  it('不正なホスト設定があれば throw する（部分適用しない）', () => {
    const json = JSON.stringify({
      version: EXPORT_VERSION,
      hosts: { 'a.com': { enabled: 'yes', css: 'x' } },
    });
    expect(() => parseImport(json)).toThrow();
  });
});
