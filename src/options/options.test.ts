import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { loadBodyInto } from '../../test/loadHtml';
import { getAllSettings, saveSetting } from '../lib/storage';

async function importOptions(): Promise<void> {
  vi.resetModules();
  await import('./options');
}

/** init 後の最初の render 完了を待つ。 */
async function waitReady(): Promise<void> {
  await vi.waitFor(() => {
    expect(document.getElementById('count')?.textContent).not.toBe('0');
  });
}

beforeEach(() => {
  document.documentElement.innerHTML = '<head></head><body></body>';
  loadBodyInto('options/index.html');
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('options 一覧表示', () => {
  it('登録済みホストを名前順に表示し件数を出す', async () => {
    await saveSetting('b.com', { enabled: true, css: 'b{}' });
    await saveSetting('a.com', { enabled: false, css: 'a{}' });

    await importOptions();
    await waitReady();

    const names = Array.from(document.querySelectorAll('#list .host-name')).map(
      (el) => el.textContent,
    );
    expect(names).toEqual(['a.com', 'b.com']);
    expect(document.getElementById('count')?.textContent).toBe('2');
  });

  it('設定が無いときは空表示になる', async () => {
    await importOptions();
    await vi.waitFor(() => {
      expect((document.getElementById('empty') as HTMLDivElement).hidden).toBe(
        false,
      );
    });
    expect(document.getElementById('count')?.textContent).toBe('0');
  });
});

describe('options 行操作', () => {
  it('行のトグルで即保存される', async () => {
    await saveSetting('a.com', { enabled: false, css: 'a{}' });
    await importOptions();
    await waitReady();

    const toggle = document.querySelector(
      '#list .row-toggle',
    ) as HTMLInputElement;
    toggle.checked = true;
    toggle.dispatchEvent(new Event('change'));

    await vi.waitFor(async () => {
      const store = await getAllSettings();
      expect(store['a.com'].enabled).toBe(true);
    });
  });

  it('削除は確認後に設定を消す', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    await saveSetting('a.com', { enabled: true, css: 'a{}' });
    await importOptions();
    await waitReady();

    const delBtn = document.querySelector(
      '#list .row-delete',
    ) as HTMLButtonElement;
    delBtn.click();

    await vi.waitFor(async () => {
      const store = await getAllSettings();
      expect(store['a.com']).toBeUndefined();
    });
  });

  it('削除をキャンセルすると消えない', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    await saveSetting('a.com', { enabled: true, css: 'a{}' });
    await importOptions();
    await waitReady();

    const delBtn = document.querySelector(
      '#list .row-delete',
    ) as HTMLButtonElement;
    delBtn.click();

    await new Promise((r) => setTimeout(r, 10));
    const store = await getAllSettings();
    expect(store['a.com']).toBeDefined();
  });
});

describe('options インポート/エクスポート', () => {
  it('エクスポートで download 付きアンカーが生成される', async () => {
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:fake');
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
    const clickSpy = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(() => {});
    await saveSetting('a.com', { enabled: true, css: 'a{}' });
    await importOptions();
    await waitReady();

    (document.getElementById('export') as HTMLButtonElement).click();

    await vi.waitFor(() => {
      expect(clickSpy).toHaveBeenCalled();
    });
    const anchor = clickSpy.mock.instances[0] as unknown as HTMLAnchorElement;
    expect(anchor.download).toMatch(/^override-styles-backup-\d{8}\.json$/);
  });

  it('不正な JSON のインポートはエラーメッセージを出し設定を変えない', async () => {
    await saveSetting('keep.com', { enabled: true, css: 'k{}' });
    await importOptions();
    await waitReady();

    const fileInput = document.getElementById(
      'import-file',
    ) as HTMLInputElement;
    const file = new File(['{ broken'], 'bad.json', {
      type: 'application/json',
    });
    Object.defineProperty(fileInput, 'files', { value: [file] });
    fileInput.dispatchEvent(new Event('change'));

    await vi.waitFor(() => {
      expect(document.getElementById('message')?.textContent).toContain(
        'インポート失敗',
      );
    });
    const store = await getAllSettings();
    expect(store['keep.com']).toBeDefined();
  });

  it('正常な JSON のインポートは確認後に全置換する', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    await saveSetting('old.com', { enabled: true, css: 'old{}' });
    await importOptions();
    await waitReady();

    const json = JSON.stringify({
      version: 1,
      exportedAt: '',
      hosts: { 'new.com': { enabled: false, css: 'new{}' } },
    });
    const fileInput = document.getElementById(
      'import-file',
    ) as HTMLInputElement;
    const file = new File([json], 'ok.json', { type: 'application/json' });
    Object.defineProperty(fileInput, 'files', { value: [file] });
    fileInput.dispatchEvent(new Event('change'));

    await vi.waitFor(async () => {
      const store = await getAllSettings();
      expect(Object.keys(store)).toEqual(['new.com']);
    });
  });
});
