import { mmkvStorage } from '@/lib/mmkv';
import { PendingSubmission } from './types';

const PENDING_SUBMISSIONS_KEY = 'zyrobet_pending_game_submissions';
const MAX_SESSION_AGE_MS = 2 * 60 * 60 * 1000; // 2 hours

export function getPendingSubmissions(): PendingSubmission[] {
  try {
    const raw = mmkvStorage.getString(PENDING_SUBMISSIONS_KEY);
    if (!raw) return [];
    const list = JSON.parse(raw) as PendingSubmission[];
    const now = Date.now();
    // Filter out expired submissions
    return list.filter((item) => now - item.timestamp < MAX_SESSION_AGE_MS);
  } catch {
    return [];
  }
}

export function addPendingSubmission(submission: Omit<PendingSubmission, 'timestamp'>): void {
  try {
    const list = getPendingSubmissions();
    const existingIdx = list.findIndex((s) => s.sessionId === submission.sessionId);
    const item: PendingSubmission = {
      ...submission,
      timestamp: Date.now(),
    };

    if (existingIdx >= 0) {
      list[existingIdx] = item;
    } else {
      list.push(item);
    }
    mmkvStorage.set(PENDING_SUBMISSIONS_KEY, JSON.stringify(list));
  } catch (err) {
    console.warn('[PendingSubmissions] Failed to save pending submission', err);
  }
}

export function removePendingSubmission(sessionId: string): void {
  try {
    const list = getPendingSubmissions();
    const filtered = list.filter((s) => s.sessionId !== sessionId);
    mmkvStorage.set(PENDING_SUBMISSIONS_KEY, JSON.stringify(filtered));
  } catch (err) {
    console.warn('[PendingSubmissions] Failed to remove pending submission', err);
  }
}
