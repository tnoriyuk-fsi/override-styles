import { getSetting, watchSetting } from './lib/storage';
import type { DomainSetting } from './lib/types';

/** 注入する style 要素の id（重複注入を防ぐ） */
const STYLE_ELEMENT_ID = 'override-styles-injected';

const host = location.hostname;

/** CSS を適用する。既存の style 要素があれば内容を更新する。 */
function applyCss(css: string): void {
  let style = document.getElementById(
    STYLE_ELEMENT_ID,
  ) as HTMLStyleElement | null;

  if (!style) {
    style = document.createElement('style');
    style.id = STYLE_ELEMENT_ID;
    // <head> がまだ無い document_start 時点でも確実に挿入する
    (document.head ?? document.documentElement).appendChild(style);
  }
  style.textContent = css;
}

/** 注入した style 要素を取り除く。 */
function removeCss(): void {
  document.getElementById(STYLE_ELEMENT_ID)?.remove();
}

/** 設定に応じて CSS の適用/解除を行う。 */
function render(setting: DomainSetting): void {
  if (setting.enabled && setting.css.trim() !== '') {
    applyCss(setting.css);
  } else {
    removeCss();
  }
}

async function init(): Promise<void> {
  const setting = await getSetting(host);
  render(setting);
  // storage 変更を監視してライブ反映する
  watchSetting(host, render);
}

void init();
