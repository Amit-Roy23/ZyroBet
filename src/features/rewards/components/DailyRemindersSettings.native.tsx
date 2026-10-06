import React, { useState } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { SettingsItem } from '@/features/profile/components/SettingsItem';
import { useRewardsStore } from '../store/useRewardsStore';
import { useRewardStatus } from '../hooks/useRewardStatus';
import {
  requestNotificationPermissions,
  rescheduleReminders,
} from '../notifications/scheduler';
import { useToast } from '@/components/ui/Toast';
import { colors, spacing, typography, radii } from '@/theme';

export function DailyRemindersSettings() {
  const { status } = useRewardStatus();
  const {
    reminderSettings,
    setReminderEnabled,
    setReminderTime,
    setStreakReminder,
  } = useRewardsStore();
  const { showToast } = useToast();
  const [showTimePicker, setShowTimePicker] = useState(false);

  const handleReminderToggle = async (val: boolean) => {
    if (val) {
      const granted = await requestNotificationPermissions();
      if (granted) {
        setReminderEnabled(true);
        rescheduleReminders(status);
        showToast({ message: 'Daily reward reminders enabled!', type: 'success' });
      } else {
        setReminderEnabled(false);
        showToast({ message: 'Notification permissions were denied', type: 'error' });
      }
    } else {
      setReminderEnabled(false);
      rescheduleReminders(null);
      showToast({ message: 'Daily reward reminders disabled', type: 'info' });
    }
  };

  const handleTimeChange = (_event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowTimePicker(Platform.OS === 'ios');
    if (selectedDate) {
      const hours = String(selectedDate.getHours()).padStart(2, '0');
      const minutes = String(selectedDate.getMinutes()).padStart(2, '0');
      const formatted = `${hours}:${minutes}`;
      setReminderTime(formatted);
      rescheduleReminders(status);
      showToast({ message: `Reminder set to ${formatted}`, type: 'success' });
    }
  };

  const handleStreakReminderToggle = (val: boolean) => {
    setStreakReminder(val);
    rescheduleReminders(status);
    showToast({
      message: val ? 'Streak warning reminder enabled' : 'Streak warning disabled',
      type: 'info',
    });
  };

  const pickerDate = (() => {
    const [h, m] = reminderSettings.reminderTime.split(':');
    const d = new Date();
    d.setHours(parseInt(h || '18', 10), parseInt(m || '0', 10), 0, 0);
    return d;
  })();

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Daily Reminders</Text>
      <View style={styles.settingsGroup}>
        <SettingsItem
          icon="notifications"
          iconColor={colors.primary}
          title="Daily Reward Reminder"
          subtitle="Get notified when your free coins are ready"
          isSwitch
          switchValue={reminderSettings.enabled}
          onSwitchToggle={handleReminderToggle}
        />
        {reminderSettings.enabled && (
          <>
            <SettingsItem
              icon="time-outline"
              title="Reminder Time"
              subtitle={`Scheduled for ${reminderSettings.reminderTime} local time (Tap to change)`}
              onPress={() => setShowTimePicker(true)}
            />
            <SettingsItem
              icon="flame-outline"
              iconColor={colors.gold}
              title="Streak Protection Alert"
              subtitle="Extra warning 3h before daily reset if streak >= 3"
              isSwitch
              switchValue={reminderSettings.streakReminder}
              onSwitchToggle={handleStreakReminderToggle}
            />
          </>
        )}
      </View>

      {showTimePicker && (
        <DateTimePicker
          value={pickerDate}
          mode="time"
          is24Hour
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleTimeChange}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: spacing.xs,
  },
  sectionTitle: {
    ...typography.captionBold,
    color: colors.textMuted,
    marginBottom: spacing.xs,
    marginLeft: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  settingsGroup: {
    borderRadius: radii.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
});
