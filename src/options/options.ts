import {
  getAllSettings,
  saveSetting,
  removeSetting,
  setAllSettings,
  serializeExport,
  parseImport,
  watchAllSettings,
} from '../lib/storage';
import type { Store } from '../lib/types';

const listEl = document.getElementById('list') as HTMLUListElement;
const emptyEl = document.getElementById('empty') as HTMLDivElement;
const countEl = document.getElementById('count') as HTMLSpanElement;
const messageEl = document.getElementById('message') as HTMLParagraphElement;
const exportBtn = document.getElementById('export') as HTMLButtonElement;
const importBtn = document.getElementById('import') as HTMLButtonElement;
const importFile = document.getElementById('import-file') as HTMLInputElement;
const rowTemplate = document.getElementById(
  'row-template',
) as HTMLTemplateElement;

/** 編集中（textarea展開中）のホスト集合。再描画時に状態を保つ。 */
const editing = new Set<string>();

function showMessage(text: string, kind: 'success' | 'error'): void {
  messageEl.textContent = text;
  messageEl.className = `message ${kind}`;
  if (kind === 'success' && text) {
    window.setTimeout(() => {
      if (messageEl.textContent === text) {
        messageEl.textContent = '';
        messageEl.className = 'message';
      }
    }, 2500);
  }
}

function summarize(css: string): string {
  const oneLine = css.replace(/\s+/g, ' ').trim();
  if (oneLine === '') return '(CSS未設定)';
  return oneLine.length > 60 ? `${oneLine.slice(0, 60)}…` : oneLine;
}

function buildRow(host: string, setting: Store[string]): HTMLLIElement {
  const fragment = rowTemplate.content.cloneNode(true) as DocumentFragment;
  const item = fragment.querySelector('.host-item') as HTMLLIElement;
  const toggle = item.querySelector('.row-toggle') as HTMLInputElement;
  const nameEl = item.querySelector('.host-name') as HTMLSpanElement;
  const summaryEl = item.querySelector('.css-summary') as HTMLSpanElement;
  const editBtn = item.querySelector('.row-edit') as HTMLButtonElement;
  const deleteBtn = item.querySelector('.row-delete') as HTMLButtonElement;
  const editor = item.querySelector('.editor') as HTMLDivElement;
  const textarea = item.querySelector('.row-css') as HTMLTextAreaElement;
  const saveBtn = item.querySelector('.row-save') as HTMLButtonElement;
  const cancelBtn = item.querySelector('.row-cancel') as HTMLButtonElement;

  nameEl.textContent = host;
  summaryEl.textContent = summarize(setting.css);
  toggle.checked = setting.enabled;
  textarea.value = setting.css;

  // ON/OFF トグルは即保存
  toggle.addEventListener('change', () => {
    void saveSetting(host, { enabled: toggle.checked, css: setting.css });
  });

  const openEditor = (): void => {
    editing.add(host);
    editor.hidden = false;
    editBtn.textContent = '閉じる';
    textarea.focus();
  };
  const closeEditor = (): void => {
    editing.delete(host);
    editor.hidden = true;
    editBtn.textContent = '編集';
  };

  if (editing.has(host)) {
    editor.hidden = false;
    editBtn.textContent = '閉じる';
  }

  editBtn.addEventListener('click', () => {
    if (editor.hidden) openEditor();
    else {
      textarea.value = setting.css; // 破棄して元に戻す
      closeEditor();
    }
  });

  cancelBtn.addEventListener('click', () => {
    textarea.value = setting.css;
    closeEditor();
  });

  saveBtn.addEventListener('click', () => {
    void saveSetting(host, {
      enabled: toggle.checked,
      css: textarea.value,
    }).then(() => {
      editing.delete(host);
      showMessage(`${host} を保存しました`, 'success');
    });
  });

  deleteBtn.addEventListener('click', () => {
    if (!window.confirm(`${host} の設定を削除しますか？`)) return;
    void removeSetting(host).then(() => {
      editing.delete(host);
      showMessage(`${host} を削除しました`, 'success');
    });
  });

  return item;
}

async function render(): Promise<void> {
  const store = await getAllSettings();
  const hosts = Object.keys(store).sort((a, b) => a.localeCompare(b));

  countEl.textContent = String(hosts.length);
  listEl.replaceChildren();

  if (hosts.length === 0) {
    emptyEl.hidden = false;
    return;
  }
  emptyEl.hidden = true;

  for (const host of hosts) {
    listEl.appendChild(buildRow(host, store[host]));
  }
}

function exportSettings(): void {
  void getAllSettings().then((store) => {
    const json = serializeExport(store);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const a = document.createElement('a');
    a.href = url;
    a.download = `override-styles-backup-${date}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showMessage('エクスポートしました', 'success');
  });
}

async function importSettings(file: File): Promise<void> {
  let text: string;
  try {
    text = await file.text();
  } catch {
    showMessage('ファイルを読み込めませんでした', 'error');
    return;
  }

  let data;
  try {
    data = parseImport(text);
  } catch (e) {
    showMessage(
      `インポート失敗: ${e instanceof Error ? e.message : String(e)}`,
      'error',
    );
    return;
  }

  const hostCount = Object.keys(data.hosts).length;
  const confirmed = window.confirm(
    `現在の設定はすべて置き換えられます。\n` +
      `先にエクスポートでバックアップしましたか？\n\n` +
      `インポートするホスト数: ${hostCount}\n\n` +
      `OKで全置換を実行します。`,
  );
  if (!confirmed) {
    showMessage('インポートを中止しました', 'error');
    return;
  }

  await setAllSettings(data.hosts);
  editing.clear();
  showMessage(`インポートしました（${hostCount} ホスト）`, 'success');
}

function init(): void {
  exportBtn.addEventListener('click', exportSettings);
  importBtn.addEventListener('click', () => importFile.click());
  importFile.addEventListener('change', () => {
    const file = importFile.files?.[0];
    if (file) void importSettings(file);
    importFile.value = ''; // 同じファイルを連続選択できるようリセット
  });

  // ストレージ変更で一覧をライブ更新
  watchAllSettings(() => {
    void render();
  });

  void render();
}

init();
