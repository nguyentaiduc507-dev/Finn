/**
 * Streak calculation logic for QUANG HƯNG platform.
 * Computes streaks strictly in Asia/Ho_Chi_Minh timezone (UTC+7).
 */

export interface DayRecord {
  date: string; // YYYY-MM-DD
  hasStreakTask: boolean;
  completedOnTime: boolean;
  hasException?: boolean;
}

export interface StreakResult {
  currentStreak: number;
  longestStreak: number;
  totalCompletedDays: number;
  missedDays: number;
  historyMap: Record<string, 'completed' | 'missed' | 'rest' | 'pending'>;
}

/**
 * Format a Date object into YYYY-MM-DD in Asia/Ho_Chi_Minh (UTC+7)
 */
export function getVietnamDateString(date: Date = new Date()): string {
  // Use Intl.DateTimeFormat to reliably format in Asia/Ho_Chi_Minh
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return formatter.format(date);
}

/**
 * Helper to get the previous day in YYYY-MM-DD format
 */
export function getPreviousDay(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d - 1, 12, 0, 0));
  return date.toISOString().split('T')[0];
}

/**
 * Helper to get the next day in YYYY-MM-DD format
 */
export function getNextDay(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d + 1, 12, 0, 0));
  return date.toISOString().split('T')[0];
}

/**
 * Calculate streak statistics according to the Quang Hưng product rules:
 * 1. Day with streak task completed on-time (or with teacher exception): 'completed'.
 * 2. Day with streak task NOT completed on-time: 'missed' (breaks streak).
 * 3. Day with NO streak task: 'rest' (does NOT break streak).
 * 4. Today with task pending: 'pending' (streak maintained if yesterday was completed/rest).
 */
export function calculateStreak(
  daysMap: Record<string, { hasStreakTask: boolean; completedOnTime: boolean; hasException?: boolean }>,
  todayStr: string,
  startDateStr: string
): StreakResult {
  const historyMap: Record<string, 'completed' | 'missed' | 'rest' | 'pending'> = {};
  let totalCompletedDays = 0;
  let missedDays = 0;

  // Traverse sequentially from startDateStr to todayStr
  let curr = startDateStr;
  const dateList: string[] = [];
  while (curr <= todayStr) {
    dateList.push(curr);
    curr = getNextDay(curr);
  }

  // Determine status for each date
  for (const date of dateList) {
    const isToday = date === todayStr;
    const entry = daysMap[date];

    if (!entry || !entry.hasStreakTask) {
      // No streak task required for this day -> Rest day (does not break streak)
      historyMap[date] = 'rest';
    } else {
      // Had a streak-required task
      if (entry.completedOnTime || entry.hasException) {
        historyMap[date] = 'completed';
        totalCompletedDays++;
      } else {
        if (isToday) {
          // Today, task exists and not completed yet
          historyMap[date] = 'pending';
        } else {
          // Past day missed
          historyMap[date] = 'missed';
          missedDays++;
        }
      }
    }
  }

  // Calculate longest streak in history
  let longestStreak = 0;
  let runningStreak = 0;

  for (const date of dateList) {
    const status = historyMap[date];
    if (status === 'completed') {
      runningStreak++;
      if (runningStreak > longestStreak) {
        longestStreak = runningStreak;
      }
    } else if (status === 'rest' || status === 'pending') {
      // Rest day or today's pending state does NOT reset the running streak
      // (a rest day bridges streaks without adding to count)
    } else if (status === 'missed') {
      runningStreak = 0;
    }
  }

  // Calculate current streak backward from today
  let currentStreak = 0;
  let broken = false;

  // Check backward from today (or yesterday if today is pending)
  for (let i = dateList.length - 1; i >= 0; i--) {
    const date = dateList[i];
    const status = historyMap[date];

    if (date === todayStr && status === 'pending') {
      // If today is pending, it hasn't broken the streak yet; look at previous days
      continue;
    }

    if (status === 'completed') {
      currentStreak++;
    } else if (status === 'rest') {
      // Rest day preserves streak, keep looking backward
      continue;
    } else if (status === 'missed') {
      broken = true;
      break;
    }
  }

  return {
    currentStreak,
    longestStreak,
    totalCompletedDays,
    missedDays,
    historyMap,
  };
}
