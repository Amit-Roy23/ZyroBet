import { useEffect, useRef } from 'react';

/**
 * Web keep-awake implementation utilizing the W3C Screen Wake Lock API
 * with safe no-op fallback when unsupported or rejected.
 */
let wakeLockSentinel: any = null;

export async function activateKeepAwakeAsync(): Promise<void> {
  try {
    if (
      typeof window !== 'undefined' &&
      'wakeLock' in navigator &&
      typeof (navigator as any).wakeLock?.request === 'function'
    ) {
      if (!wakeLockSentinel) {
        wakeLockSentinel = await (navigator as any).wakeLock.request('screen');
        wakeLockSentinel?.addEventListener('release', () => {
          wakeLockSentinel = null;
        });
      }
    }
  } catch {
    // Wake Lock may fail or be dismissed by user/policy
  }
}

export function deactivateKeepAwake(): void {
  try {
    if (wakeLockSentinel) {
      wakeLockSentinel.release();
      wakeLockSentinel = null;
    }
  } catch {
    // Ignore release errors
  }
}

export function useKeepAwake(): void {
  const activeRef = useRef(false);

  useEffect(() => {
    activeRef.current = true;
    activateKeepAwakeAsync();

    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && activeRef.current) {
        activateKeepAwakeAsync();
      }
    };

    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', handleVisibility);
    }

    return () => {
      activeRef.current = false;
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', handleVisibility);
      }
      deactivateKeepAwake();
    };
  }, []);
}
