import { useCallback } from 'react';
import { hapticFeedback } from '@/lib/haptics';

export function useHaptic() {
  const trigger = useCallback(
    (type: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' | 'selection' = 'light') => {
      hapticFeedback[type]();
    },
    [],
  );

  return { trigger, ...hapticFeedback };
}
