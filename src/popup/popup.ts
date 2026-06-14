import { getSetting, saveSetting } from '../lib/storage';

const hostEl = document.getElementById('host') as HTMLSpanElement;
const toggleEl = document.getElementById('toggle') as HTMLInputElement;
const cssEl = document.getElementById('css') as HTMLTextAreaElement;
const saveBtn = document.getElementById('save') as HTMLButtonElement;
const statusEl = document.getElementById('status') as HTMLSpanElement;
const openOptionsEl = document.getElementById(
  'open-options',
) as HTMLAnchorElement;

let currentHost = '';

/** アクティブタブの URL からホスト名を取得する。 */
async function getActiveHost(): Promise<string | null> {
  const [tab] = await chrome.tabs.query({
    active: true,
    currentWindow: true,
  });
  if (!tab?.url) return null;
  try {
    return new URL(tab.url).hostname;
  } catch {
    return null;
  }
}

function showStatus(message: string): void {
  statusEl.textContent = message;
  if (message) {
    window.setTimeout(() => {
      statusEl.textContent = '';
    }, 1500);
  }
}

async function save(): Promise<void> {
  if (!currentHost) return;
  await saveSetting(currentHost, {
    enabled: toggleEl.checked,
    css: cssEl.value,
  });
  showStatus('保存しました');
}

async function init(): Promise<void> {
  // 設定一覧（オプションページ）を開く導線。ホストの有無に関わらず有効。
  openOptionsEl.addEventListener('click', (e) => {
    e.preventDefault();
    chrome.runtime.openOptionsPage();
  });

  const host = await getActiveHost();

  if (!host) {
    hostEl.textContent = '(このページでは利用できません)';
    toggleEl.disabled = true;
    cssEl.disabled = true;
    saveBtn.disabled = true;
    return;
  }

  currentHost = host;
  hostEl.textContent = host;

  const setting = await getSetting(host);
  toggleEl.checked = setting.enabled;
  cssEl.value = setting.css;

  // トグル変更は即保存（content 側へ即反映される）
  toggleEl.addEventListener('change', () => {
    void save();
  });

  // 保存ボタン
  saveBtn.addEventListener('click', () => {
    void save();
  });

  // Ctrl/Cmd + Enter で保存
  cssEl.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      void save();
    }
  });
}

void init();
