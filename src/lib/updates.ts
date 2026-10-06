import { useEffect, useState, useCallback, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import * as Updates from 'expo-updates';

const UPDATE_CHECK_THROTTLE_MS = 30 * 60 * 1000; // 30 minutes

export interface UpdateMetadata {
  isEnabled: boolean;
  channel: string | null;
  runtimeVersion: string | null;
  updateId: string | null;
  createdAt: string | null;
  isEmbeddedLaunch: boolean;
  isEmergencyLaunch: boolean;
}

/**
 * Returns current EAS update metadata safely for dev panel or diagnostics.
 */
export function getUpdateMetadata(): UpdateMetadata {
  try {
    return {
      isEnabled: Updates.isEnabled,
      channel: Updates.channel ?? null,
      runtimeVersion: typeof Updates.runtimeVersion === 'string' ? Updates.runtimeVersion : null,
      updateId: Updates.updateId ?? null,
      createdAt: Updates.createdAt ? Updates.createdAt.toISOString() : null,
      isEmbeddedLaunch: Updates.isEmbeddedLaunch,
      isEmergencyLaunch: Updates.isEmergencyLaunch,
    };
  } catch (error) {
    console.warn('[Updates] Failed to retrieve update metadata:', error);
    return {
      isEnabled: false,
      channel: null,
      runtimeVersion: null,
      updateId: null,
      createdAt: null,
      isEmbeddedLaunch: true,
      isEmergencyLaunch: false,
    };
  }
}

/**
 * Checks for and downloads updates silently.
 * Throttled to at most once per 30 minutes.
 * Returns true if an update was fetched and is ready for reload.
 */
let lastCheckTimestamp = 0;

export async function checkAndFetchUpdateSilently(): Promise<boolean> {
  if (__DEV__ || !Updates.isEnabled) {
    return false;
  }

  const now = Date.now();
  if (now - lastCheckTimestamp < UPDATE_CHECK_THROTTLE_MS) {
    return false;
  }
  lastCheckTimestamp = now;

  try {
    const updateCheck = await Updates.checkForUpdateAsync();
    if (updateCheck.isAvailable) {
      const fetchResult = await Updates.fetchUpdateAsync();
      if (fetchResult.isNew) {
        return true;
      }
    }
  } catch (error) {
    // Silent logging for OTA failures to prevent user disruption
    console.warn('[Updates] Silent OTA update check failed:', error);
  }
  return false;
}

/**
 * Safely triggers an app reload to apply downloaded OTA update.
 */
export async function applyUpdateAsync(): Promise<void> {
  try {
    await Updates.reloadAsync();
  } catch (error) {
    console.warn('[Updates] Failed to reload application for update:', error);
  }
}

/**
 * React hook for observing update availability and managing OTA lifecycle.
 */
export function useAppUpdates() {
  const [isUpdateReady, setIsUpdateReady] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  const performCheck = useCallback(async () => {
    if (__DEV__ || !Updates.isEnabled) return;
    setIsChecking(true);
    try {
      const downloaded = await checkAndFetchUpdateSilently();
      if (downloaded) {
        setIsUpdateReady(true);
      }
    } finally {
      setIsChecking(false);
    }
  }, []);

  useEffect(() => {
    // Cold start check asynchronously
    const timer = setTimeout(() => {
      performCheck();
    }, 100);

    // Foreground change listener
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (
        appStateRef.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        performCheck();
      }
      appStateRef.current = nextAppState;
    });

    return () => {
      clearTimeout(timer);
      subscription.remove();
    };
  }, [performCheck]);

  const restartApp = useCallback(async () => {
    await applyUpdateAsync();
  }, []);

  return {
    isUpdateReady,
    isChecking,
    restartApp,
    metadata: getUpdateMetadata(),
  };
}
