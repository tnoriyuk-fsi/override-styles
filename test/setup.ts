import { beforeEach } from 'vitest';
import { createFakeChrome, type FakeChrome } from './fakeChrome';

declare global {
  // テストから現在のフェイクへアクセスするためのハンドル
  // eslint-disable-next-line no-var
  var fakeChrome: FakeChrome;
}

beforeEach(() => {
  const fake = createFakeChrome();
  globalThis.fakeChrome = fake;
  // 本物の chrome の代わりにフェイクを注入する
  (globalThis as unknown as { chrome: unknown }).chrome = fake;
});
