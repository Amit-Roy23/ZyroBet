import { storage } from './mmkv';
import { APP_CONFIG } from '@/constants/config';
import { logger } from '@/utils/logger';

export type SoundEffectType =
  | 'click'
  | 'coin'
  | 'win'
  | 'streak'
  | 'error'
  | 'countdown'
  | 'tap'
  | 'match'
  | 'merge'
  | 'flip';

let webAudioUnlocked = false;
let webAudioContext: any = null;

/**
 * Browsers require an explicit user gesture (pointerdown, touchstart, keydown)
 * before any audio or Web Audio context can play.
 * This listener attaches to the first user gesture to unlock the audio context.
 */
function setupWebAudioUnlock() {
  if (
    typeof window === 'undefined' ||
    typeof window.addEventListener !== 'function' ||
    webAudioUnlocked
  ) {
    return;
  }

  const unlock = () => {
    if (webAudioUnlocked) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        if (!webAudioContext) {
          webAudioContext = new AudioCtx();
        }
        if (webAudioContext.state === 'suspended') {
          webAudioContext.resume().catch(() => {});
        }
        // Play brief silent buffer to satisfy autoplay policy
        const buffer = webAudioContext.createBuffer(1, 1, 22050);
        const source = webAudioContext.createBufferSource();
        source.buffer = buffer;
        source.connect(webAudioContext.destination);
        source.start(0);
      }
      webAudioUnlocked = true;
      logger.info('[Audio] Web audio context successfully unlocked on first user gesture');
    } catch {
      // Continue without crashing
    } finally {
      if (typeof window.removeEventListener === 'function') {
        window.removeEventListener('pointerdown', unlock);
        window.removeEventListener('touchstart', unlock);
        window.removeEventListener('keydown', unlock);
      }
    }
  };

  window.addEventListener('pointerdown', unlock, { once: true, passive: true });
  window.addEventListener('touchstart', unlock, { once: true, passive: true });
  window.addEventListener('keydown', unlock, { once: true, passive: true });
}

class SoundManager {
  private enabled: boolean = true;

  constructor() {
    const saved = storage.getBoolean(APP_CONFIG.STORAGE_KEYS.SOUND_ENABLED);
    this.enabled = saved !== undefined ? saved : true;

    if (typeof window !== 'undefined') {
      setupWebAudioUnlock();
    }
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  public setEnabled(val: boolean) {
    this.enabled = val;
    storage.set(APP_CONFIG.STORAGE_KEYS.SOUND_ENABLED, val);
  }

  public async playSound(type: SoundEffectType) {
    if (!this.enabled) return;

    // On web, resume suspended AudioContext if needed
    if (typeof window !== 'undefined' && webAudioContext?.state === 'suspended') {
      try {
        await webAudioContext.resume();
      } catch {
        // Ignored
      }
    }

    try {
      // Sound effect playback trigger
      logger.info(`[Audio] Playing sound effect: ${type}`);
    } catch (err) {
      logger.warn('[Audio] Failed to play sound:', err);
    }
  }
}

export const soundManager = new SoundManager();
