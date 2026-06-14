import { describe, it, expect, beforeEach, vi } from 'vitest';
import { loadBodyInto } from '../../test/loadHtml';
import { getSetting, saveSetting } from '../lib/storage';

/** chrome.tabs / chrome.runtime を補い、アクティブタブの URL を設定する。 */
function setupChrome(url: string | undefined): {
  openOptionsPage: ReturnType<typeof vi.fn>;
} {
  const openOptionsPage = vi.fn();
  const chrome = globalThis.chrome as unknown as Record<string, unknown>;
  chrome.tabs = {
    query: vi.fn().mockResolvedValue(url ? [{ url }] : [{}]),
  };
  chrome.runtime = { openOptionsPage };
  return { openOptionsPage };
}

async function importPopup(): Promise<void> {
  vi.resetModules();
  await import('./popup');
}

beforeEach(() => {
  document.documentElement.innerHTML = '<head></head><body></body>';
  loadBodyInto('popup/index.html');
});

describe('popup 初期化', () => {
  it('アクティブタブのホストを表示し既存設定を反映する', async () => {
    setupChrome('https://example.com/path');
    await saveSetting('example.com', { enabled: true, css: 'body{}' });

    await importPopup();
    await vi.waitFor(() => {
      expect(document.getElementById('host')?.textContent).toBe('example.com');
    });

    const toggle = document.getElementById('toggle') as HTMLInputElement;
    const css = document.getElementById('css') as HTMLTextAreaElement;
    expect(toggle.checked).toBe(true);
    expect(css.value).toBe('body{}');
  });

  it('URL が取得できないときは無効化メッセージを出す', async () => {
    setupChrome(undefined);

    await importPopup();
    await vi.waitFor(() => {
      expect(document.getElementById('host')?.textContent).toContain(
        '利用できません',
      );
    });

    const toggle = document.getElementById('toggle') as HTMLInputElement;
    const saveBtn = document.getElementById('save') as HTMLButtonElement;
    expect(toggle.disabled).toBe(true);
    expect(saveBtn.disabled).toBe(true);
  });
});

describe('popup 操作', () => {
  it('保存ボタンで設定が保存される', async () => {
    setupChrome('https://example.com/');
    await importPopup();
    await vi.waitFor(() => {
      expect(document.getElementById('host')?.textContent).toBe('example.com');
    });

    const toggle = document.getElementById('toggle') as HTMLInputElement;
    const css = document.getElementById('css') as HTMLTextAreaElement;
    const saveBtn = document.getElementById('save') as HTMLButtonElement;
    toggle.checked = true;
    css.value = 'a { color: red; }';
    saveBtn.click();

    await vi.waitFor(async () => {
      const setting = await getSetting('example.com');
      expect(setting).toEqual({ enabled: true, css: 'a { color: red; }' });
    });
  });

  it('トグル変更で即保存される', async () => {
    setupChrome('https://example.com/');
    await saveSetting('example.com', { enabled: false, css: 'x{}' });
    await importPopup();
    await vi.waitFor(() => {
      expect(document.getElementById('host')?.textContent).toBe('example.com');
    });

    const toggle = document.getElementById('toggle') as HTMLInputElement;
    toggle.checked = true;
    toggle.dispatchEvent(new Event('change'));

    await vi.waitFor(async () => {
      const setting = await getSetting('example.com');
      expect(setting.enabled).toBe(true);
    });
  });

  it('設定一覧リンクで openOptionsPage が呼ばれる', async () => {
    const { openOptionsPage } = setupChrome('https://example.com/');
    await importPopup();
    await vi.waitFor(() => {
      expect(document.getElementById('open-options')).not.toBeNull();
    });

    const link = document.getElementById('open-options') as HTMLAnchorElement;
    link.click();
    expect(openOptionsPage).toHaveBeenCalledOnce();
  });
});
