import { StateStorage } from 'zustand/middleware';

export interface StorageInterface {
  set(key: string, value: boolean | string | number): void;
  getString(key: string): string | undefined;
  getNumber(key: string): number | undefined;
  getBoolean(key: string): boolean | undefined;
  remove(key: string): boolean;
  clearAll(): void;
}

// In-memory fallback map when native Nitro/MMKV C++ modules are not compiled (e.g., Expo Go, Tests)
class MemoryStorageFallback implements StorageInterface {
  private memoryMap = new Map<string, string>();

  set(key: string, value: boolean | string | number): void {
    this.memoryMap.set(key, String(value));
  }

  getString(key: string): string | undefined {
    return this.memoryMap.get(key);
  }

  getNumber(key: string): number | undefined {
    const val = this.memoryMap.get(key);
    return val !== undefined ? Number(val) : undefined;
  }

  getBoolean(key: string): boolean | undefined {
    const val = this.memoryMap.get(key);
    return val !== undefined ? val === 'true' : undefined;
  }

  remove(key: string): boolean {
    return this.memoryMap.delete(key);
  }

  clearAll(): void {
    this.memoryMap.clear();
  }
}

function initStorage(): StorageInterface {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { createMMKV } = require('react-native-mmkv');
    const instance = createMMKV({ id: 'zyrobet-core-storage' });
    if (typeof instance?.set === 'function') {
      return instance;
    }
    return new MemoryStorageFallback();
  } catch {
    return new MemoryStorageFallback();
  }
}

export const storage: StorageInterface = initStorage();
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
