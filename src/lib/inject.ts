import type { DomainSetting } from './types';

/** 注入する style 要素の id（重複注入を防ぐ） */
export const STYLE_ELEMENT_ID = 'override-styles-injected';

/** CSS を適用する。既存の style 要素があれば内容を更新する。 */
export function applyCss(css: string, doc: Document = document): void {
  let style = doc.getElementById(STYLE_ELEMENT_ID) as HTMLStyleElement | null;

  if (!style) {
    style = doc.createElement('style');
    style.id = STYLE_ELEMENT_ID;
    // <head> がまだ無い document_start 時点でも確実に挿入する
    (doc.head ?? doc.documentElement).appendChild(style);
  }
  style.textContent = css;
}

/** 注入した style 要素を取り除く。 */
export function removeCss(doc: Document = document): void {
  doc.getElementById(STYLE_ELEMENT_ID)?.remove();
}

/** 設定に応じて CSS の適用/解除を行う。 */
export function render(setting: DomainSetting, doc: Document = document): void {
  if (setting.enabled && setting.css.trim() !== '') {
    applyCss(setting.css, doc);
  } else {
    removeCss(doc);
  }
}
