import { useCallback } from 'react';
import { soundManager, SoundEffectType } from '@/lib/audio';

export function useSound() {
  const playSound = useCallback((type: SoundEffectType) => {
    soundManager.playSound(type);
  }, []);

  return { playSound };
}
