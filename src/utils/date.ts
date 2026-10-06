/**
 * Date and time helper utilities
 */

export function getUtcDayKey(date: Date = new Date()): string {
  return date.toISOString().split('T')[0];
}

export function getTimeUntilMidnightUtc(): { hours: number; minutes: number; seconds: number; formatted: string } {
  const now = new Date();
  const midnightUtc = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0));
  const diffMs = midnightUtc.getTime() - now.getTime();

  const totalSeconds = Math.max(0, Math.floor(diffMs / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const formatted = `${hours.toString().padStart(2, '0')}:${minutes
    .toString()
    .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  return { hours, minutes, seconds, formatted };
}

export function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
  } catch {
    return dateString;
  }
}

export function formatTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(date);
  } catch {
    return '';
  }
}

export function formatRelativeTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffSeconds < 60) return 'Just now';
    if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)}m ago`;
    if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)}h ago`;
    return `${Math.floor(diffSeconds / 86400)}d ago`;
  } catch {
    return dateString;
  }
}

export function getDayGroupTitle(dateString: string, now: Date = new Date()): string {
  try {
    const target = new Date(dateString);
    const todayUtc = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
    const targetUtc = Date.UTC(target.getUTCFullYear(), target.getUTCMonth(), target.getUTCDate());

    const diffDays = Math.round((todayUtc - targetUtc) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    return formatDate(dateString);
  } catch {
    return formatDate(dateString);
  }
}

export interface DayGroupedTransactions<T extends { createdAt: string }> {
  title: string;
  dateKey: string;
  data: T[];
}

export function groupTransactionsByDay<T extends { createdAt: string }>(
  items: T[],
  now: Date = new Date(),
): DayGroupedTransactions<T>[] {
  const groupsMap = new Map<string, { title: string; dateKey: string; data: T[] }>();

  for (const item of items) {
    const date = new Date(item.createdAt);
    const dateKey = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`;
    const title = getDayGroupTitle(item.createdAt, now);

    if (!groupsMap.has(dateKey)) {
      groupsMap.set(dateKey, {
        title,
        dateKey,
        data: [],
      });
    }

    groupsMap.get(dateKey)!.data.push(item);
  }

  return Array.from(groupsMap.values());
}
