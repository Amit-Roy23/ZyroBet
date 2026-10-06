import { useState, useEffect, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';

export interface CountdownResult {
  hours: number;
  minutes: number;
  seconds: number;
  formatted: string;
  isDone: boolean;
  totalSeconds: number;
}

export function useCountdown(
  targetIsoServerTime?: string | null,
  serverOffsetMs: number = 0,
): CountdownResult {
  const [_tick, setTick] = useState(0);

  const calculateRemaining = useCallback((): CountdownResult => {
    if (!targetIsoServerTime) {
      return { hours: 0, minutes: 0, seconds: 0, formatted: '00:00:00', isDone: true, totalSeconds: 0 };
    }

    const targetTimeMs = new Date(targetIsoServerTime).getTime();
    const serverNowMs = Date.now() + serverOffsetMs;
    const diffMs = targetTimeMs - serverNowMs;

    if (diffMs <= 0 || isNaN(diffMs)) {
      return { hours: 0, minutes: 0, seconds: 0, formatted: '00:00:00', isDone: true, totalSeconds: 0 };
    }

    const totalSeconds = Math.floor(diffMs / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const formatted = `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

    return {
      hours,
      minutes,
      seconds,
      formatted,
      isDone: false,
      totalSeconds,
    };
  }, [targetIsoServerTime, serverOffsetMs]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTick((prev) => prev + 1);
    }, 1000);

    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        setTick((prev) => prev + 1);
      }
    });

    return () => {
      clearInterval(interval);
      subscription.remove();
    };
  }, []);

  return calculateRemaining();
}
