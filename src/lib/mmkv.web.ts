import { StateStorage } from 'zustand/middleware';

export interface StorageInterface {
  set(key: string, value: boolean | string | number): void;
  getString(key: string): string | undefined;
  getNumber(key: string): number | undefined;
  getBoolean(key: string): boolean | undefined;
  remove(key: string): boolean;
  clearAll(): void;
}

class LocalStorageFallback implements StorageInterface {
  private memoryMap = new Map<string, string>();

  private isLocalStorageAvailable(): boolean {
    try {
      if (typeof window === 'undefined' || !window.localStorage) {
        return false;
      }
      const testKey = '__zb_mmkv_test__';
      window.localStorage.setItem(testKey, '1');
      window.localStorage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  }

  private hasStorage = this.isLocalStorageAvailable();

  set(key: string, value: boolean | string | number): void {
    const str = String(value);
    if (this.hasStorage) {
      try {
        window.localStorage.setItem(key, str);
        return;
      } catch {
        // Fall back to memory
      }
    }
    this.memoryMap.set(key, str);
  }

  getString(key: string): string | undefined {
    if (this.hasStorage) {
      try {
        const val = window.localStorage.getItem(key);
        return val !== null ? val : undefined;
      } catch {
        // Fall back to memory
      }
    }
    return this.memoryMap.get(key);
  }

  getNumber(key: string): number | undefined {
    const val = this.getString(key);
    if (val === undefined) return undefined;
    const num = Number(val);
    return isNaN(num) ? undefined : num;
  }

  getBoolean(key: string): boolean | undefined {
    const val = this.getString(key);
    if (val === undefined) return undefined;
    return val === 'true';
  }

  remove(key: string): boolean {
    if (this.hasStorage) {
      try {
        window.localStorage.removeItem(key);
      } catch {
        // Ignored
      }
    }
    return this.memoryMap.delete(key);
  }

  clearAll(): void {
    if (this.hasStorage) {
      try {
        window.localStorage.clear();
      } catch {
        // Ignored
      }
    }
    this.memoryMap.clear();
  }
}

export const storage: StorageInterface = new LocalStorageFallback();
export const mmkvStorage: StorageInterface = storage;

export const mmkvStateStorage: StateStorage = {
  setItem: (name: string, value: string) => {
    storage.set(name, value);
  },
  getItem: (name: string) => {
    const value = storage.getString(name);
    return value ?? null;
  },
  removeItem: (name: string) => {
    storage.remove(name);
  },
};
