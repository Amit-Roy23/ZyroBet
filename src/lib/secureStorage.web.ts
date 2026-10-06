import { logger } from '@/utils/logger';

export interface SecureStorageAdapter {
  getItem(key: string): Promise<string | null> | string | null;
  setItem(key: string, value: string): Promise<void> | void;
  removeItem(key: string): Promise<void> | void;
}

const memoryMap = new Map<string, string>();

const isLocalStorageAvailable = (): boolean => {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return false;
    }
    const testKey = '__zb_test_storage__';
    window.localStorage.setItem(testKey, '1');
    window.localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
};

const hasLocalStorage = isLocalStorageAvailable();

export const secureStorage: SecureStorageAdapter = {
  getItem: (key: string): string | null => {
    try {
      if (hasLocalStorage) {
        return window.localStorage.getItem(`zb_sec_${key}`);
      }
      return memoryMap.get(key) ?? null;
    } catch (err) {
      logger.warn(`[SecureStorage.web] Error reading key "${key}":`, err);
      return null;
    }
  },
  setItem: (key: string, value: string): void => {
    try {
      if (hasLocalStorage) {
        window.localStorage.setItem(`zb_sec_${key}`, value);
      } else {
        memoryMap.set(key, value);
      }
    } catch (err) {
      logger.warn(`[SecureStorage.web] Error setting key "${key}":`, err);
    }
  },
  removeItem: (key: string): void => {
    try {
      if (hasLocalStorage) {
        window.localStorage.removeItem(`zb_sec_${key}`);
      } else {
        memoryMap.delete(key);
      }
    } catch (err) {
      logger.warn(`[SecureStorage.web] Error removing key "${key}":`, err);
    }
  },
};
