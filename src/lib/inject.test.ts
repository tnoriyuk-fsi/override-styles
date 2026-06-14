import { describe, it, expect, beforeEach } from 'vitest';
import { applyCss, removeCss, render, STYLE_ELEMENT_ID } from './inject';
import type { DomainSetting } from './types';

function injectedStyle(): HTMLStyleElement | null {
  return document.getElementById(STYLE_ELEMENT_ID) as HTMLStyleElement | null;
}

beforeEach(() => {
  // head を削除するテストがあるため毎回 head/body を作り直す
  document.documentElement.innerHTML = '<head></head><body></body>';
});

describe('applyCss', () => {
  it('style 要素を1つ注入し CSS を設定する', () => {
    applyCss('body { color: red; }');
    const style = injectedStyle();
    expect(style).not.toBeNull();
    expect(style?.tagName).toBe('STYLE');
    expect(style?.textContent).toBe('body { color: red; }');
  });

  it('再適用時は新規作成せず内容だけ更新する', () => {
    applyCss('a {}');
    applyCss('b {}');
    const styles = document.querySelectorAll(`#${STYLE_ELEMENT_ID}`);
    expect(styles.length).toBe(1);
    expect(injectedStyle()?.textContent).toBe('b {}');
  });

  it('head が無くても documentElement に挿入できる', () => {
    document.documentElement.removeChild(document.head);
    expect(document.head).toBeNull();
    applyCss('x {}');
    expect(injectedStyle()).not.toBeNull();
  });
});

describe('removeCss', () => {
  it('注入済みの style 要素を取り除く', () => {
    applyCss('a {}');
    expect(injectedStyle()).not.toBeNull();
    removeCss();
    expect(injectedStyle()).toBeNull();
  });

  it('注入が無くてもエラーにならない', () => {
    expect(() => removeCss()).not.toThrow();
  });
});

describe('render', () => {
  const css = 'body { background: #000; }';

  it('enabled かつ CSS ありなら適用する', () => {
    const setting: DomainSetting = { enabled: true, css };
    render(setting);
    expect(injectedStyle()?.textContent).toBe(css);
  });

  it('disabled なら適用しない', () => {
    render({ enabled: false, css });
    expect(injectedStyle()).toBeNull();
  });

  it('CSS が空白のみなら適用しない', () => {
    render({ enabled: true, css: '   \n  ' });
    expect(injectedStyle()).toBeNull();
  });

  it('適用後に disabled へ変わると除去される', () => {
    render({ enabled: true, css });
    expect(injectedStyle()).not.toBeNull();
    render({ enabled: false, css });
    expect(injectedStyle()).toBeNull();
  });
});
