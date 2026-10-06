import * as SecureStore from 'expo-secure-store';
import { logger } from '@/utils/logger';

export interface SecureStorageAdapter {
  getItem(key: string): Promise<string | null> | string | null;
  setItem(key: string, value: string): Promise<void> | void;
  removeItem(key: string): Promise<void> | void;
}

export const secureStorage: SecureStorageAdapter = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      return await SecureStore.getItemAsync(key);
    } catch (err) {
      logger.warn(`[SecureStore.native] Error reading key "${key}":`, err);
      return null;
    }
  },
  setItem: async (key: string, value: string): Promise<void> => {
    try {
      await SecureStore.setItemAsync(key, value);
    } catch (err) {
      logger.warn(`[SecureStore.native] Error saving key "${key}":`, err);
    }
  },
  removeItem: async (key: string): Promise<void> => {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch (err) {
      logger.warn(`[SecureStore.native] Error deleting key "${key}":`, err);
    }
  },
};
