/**
 * Safe Native Module Loader
 * 
 * Provides safe lazy-require helpers for native modules so missing native bindings
 * in Expo Go or incomplete builds log a warning instead of crashing the application.
 */

export interface SafeNativeResult<T> {
  module: T | null;
  isAvailable: boolean;
  error?: string;
}

/**
 * Safely executes a loader function that imports or accesses a native module.
 * If an exception is thrown, returns isAvailable: false with the error message.
 */
export function safeRequireNative<T = any>(
  moduleName: string,
  loader: () => T
): SafeNativeResult<T> {
  try {
    const mod = loader();
    if (mod === undefined || mod === null) {
      return {
        module: null,
        isAvailable: false,
        error: `${moduleName} returned null or undefined`,
      };
    }
    return {
      module: mod,
      isAvailable: true,
    };
  } catch (error: any) {
    const errorMessage = error?.message || String(error);
    if (__DEV__) {
      console.warn(`[safeRequireNative] Optional native module "${moduleName}" unavailable: ${errorMessage}`);
    }
    return {
      module: null,
      isAvailable: false,
      error: errorMessage,
    };
  }
}
