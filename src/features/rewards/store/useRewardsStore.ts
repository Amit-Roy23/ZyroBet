import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { mmkvStateStorage } from '@/lib/mmkv';
import { ReminderSettings } from '../types';

export interface RewardsStoreState {
  reminderSettings: ReminderSettings;
  lastPopupShownDate: string | null;
  soundEnabled: boolean;
  hapticsEnabled: boolean;
  setReminderEnabled: (enabled: boolean) => void;
  setReminderTime: (timeHHmm: string) => void;
  setStreakReminder: (enabled: boolean) => void;
  setHasPromptedOptIn: (prompted: boolean) => void;
  setLastPopupShownDate: (dateStr: string) => void;
  setSoundEnabled: (enabled: boolean) => void;
  setHapticsEnabled: (enabled: boolean) => void;
}

const DEFAULT_REMINDER_SETTINGS: ReminderSettings = {
  enabled: false,
  reminderTime: '18:00',
  streakReminder: false,
  hasPromptedOptIn: false,
};

export const useRewardsStore = create<RewardsStoreState>()(
  persist(
    (set) => ({
      reminderSettings: DEFAULT_REMINDER_SETTINGS,
      lastPopupShownDate: null,
      soundEnabled: true,
      hapticsEnabled: true,

      setReminderEnabled: (enabled) =>
        set((state) => ({
          reminderSettings: { ...state.reminderSettings, enabled },
        })),

      setReminderTime: (reminderTime) =>
        set((state) => ({
          reminderSettings: { ...state.reminderSettings, reminderTime },
        })),

      setStreakReminder: (streakReminder) =>
        set((state) => ({
          reminderSettings: { ...state.reminderSettings, streakReminder },
        })),

      setHasPromptedOptIn: (hasPromptedOptIn) =>
        set((state) => ({
          reminderSettings: { ...state.reminderSettings, hasPromptedOptIn },
        })),

      setLastPopupShownDate: (lastPopupShownDate) => set({ lastPopupShownDate }),
      setSoundEnabled: (soundEnabled) => set({ soundEnabled }),
      setHapticsEnabled: (hapticsEnabled) => set({ hapticsEnabled }),
    }),
    {
      name: 'zyrobet-rewards-store',
      storage: createJSONStorage(() => mmkvStateStorage),
    },
  ),
);
