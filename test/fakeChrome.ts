/**
 * テスト用のインメモリ chrome.storage フェイク。
 * 本物の chrome.storage.local の挙動（get(null) で全件、set/remove で onChanged 発火）を再現する。
 */

type StorageChange = { oldValue?: unknown; newValue?: unknown };
type ChangeListener = (
  changes: Record<string, StorageChange>,
  areaName: string,
) => void;

export interface FakeChrome {
  storage: {
    local: {
      get(
        keys?: string | string[] | null,
      ): Promise<Record<string, unknown>>;
      set(items: Record<string, unknown>): Promise<void>;
      remove(keys: string | string[]): Promise<void>;
      clear(): Promise<void>;
    };
    onChanged: {
      addListener(listener: ChangeListener): void;
      removeListener(listener: ChangeListener): void;
    };
  };
  /** テスト補助: ストアの中身を直接覗く */
  _dump(): Record<string, unknown>;
  /** テスト補助: 任意のエリア名で onChanged を発火する */
  _emit(changes: Record<string, StorageChange>, areaName: string): void;
}

export function createFakeChrome(): FakeChrome {
  const store = new Map<string, unknown>();
  const listeners = new Set<ChangeListener>();

  function emit(changes: Record<string, StorageChange>): void {
    if (Object.keys(changes).length === 0) return;
    for (const listener of listeners) {
      listener(changes, 'local');
    }
  }

  return {
    storage: {
      local: {
        async get(keys) {
          const result: Record<string, unknown> = {};
          if (keys == null) {
            for (const [k, v] of store) result[k] = v;
            return result;
          }
          const list = Array.isArray(keys) ? keys : [keys];
          for (const k of list) {
            if (store.has(k)) result[k] = store.get(k);
          }
          return result;
        },
        async set(items) {
          const changes: Record<string, StorageChange> = {};
          for (const [k, v] of Object.entries(items)) {
            const oldValue = store.get(k);
            store.set(k, v);
            changes[k] = { oldValue, newValue: v };
          }
          emit(changes);
        },
        async remove(keys) {
          const list = Array.isArray(keys) ? keys : [keys];
          const changes: Record<string, StorageChange> = {};
          for (const k of list) {
            if (store.has(k)) {
              changes[k] = { oldValue: store.get(k), newValue: undefined };
              store.delete(k);
            }
          }
          emit(changes);
        },
        async clear() {
          const changes: Record<string, StorageChange> = {};
          for (const [k, v] of store) {
            changes[k] = { oldValue: v, newValue: undefined };
          }
          store.clear();
          emit(changes);
        },
      },
      onChanged: {
        addListener(listener) {
          listeners.add(listener);
        },
        removeListener(listener) {
          listeners.delete(listener);
        },
      },
    },
    _dump() {
      return Object.fromEntries(store);
    },
    _emit(changes, areaName) {
      for (const listener of listeners) {
        listener(changes, areaName);
      }
    },
  };
}
