import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateStreak, getVietnamDateString } from './streak';

test('vietnam date string format returns YYYY-MM-DD', () => {
  const d = new Date('2026-10-28T10:00:00Z');
  const str = getVietnamDateString(d);
  assert.match(str, /^\d{4}-\d{2}-\d{2}$/);
});

test('streak increments on consecutive completed days', () => {
  const daysMap = {
    '2026-10-20': { hasStreakTask: true, completedOnTime: true },
    '2026-10-21': { hasStreakTask: true, completedOnTime: true },
    '2026-10-22': { hasStreakTask: true, completedOnTime: true },
  };

  const res = calculateStreak(daysMap, '2026-10-22', '2026-10-20');
  assert.equal(res.currentStreak, 3);
  assert.equal(res.longestStreak, 3);
  assert.equal(res.totalCompletedDays, 3);
  assert.equal(res.missedDays, 0);
});

test('rest days with no assignment do NOT break the streak', () => {
  const daysMap = {
    '2026-10-20': { hasStreakTask: true, completedOnTime: true },
    '2026-10-21': { hasStreakTask: false, completedOnTime: false }, // Sunday / no assignment
    '2026-10-22': { hasStreakTask: true, completedOnTime: true },
  };

  const res = calculateStreak(daysMap, '2026-10-22', '2026-10-20');
  assert.equal(res.currentStreak, 2);
  assert.equal(res.historyMap['2026-10-21'], 'rest');
  assert.equal(res.missedDays, 0);
});

test('missed past assignment resets streak', () => {
  const daysMap = {
    '2026-10-20': { hasStreakTask: true, completedOnTime: true },
    '2026-10-21': { hasStreakTask: true, completedOnTime: false }, // Missed!
    '2026-10-22': { hasStreakTask: true, completedOnTime: true },
  };

  const res = calculateStreak(daysMap, '2026-10-22', '2026-10-20');
  assert.equal(res.currentStreak, 1);
  assert.equal(res.longestStreak, 1);
  assert.equal(res.missedDays, 1);
});

test('today pending assignment preserves yesterday streak without marking missed', () => {
  const daysMap = {
    '2026-10-20': { hasStreakTask: true, completedOnTime: true },
    '2026-10-21': { hasStreakTask: true, completedOnTime: true },
    '2026-10-22': { hasStreakTask: true, completedOnTime: false }, // Today, still pending
  };

  const res = calculateStreak(daysMap, '2026-10-22', '2026-10-20');
  assert.equal(res.currentStreak, 2);
  assert.equal(res.historyMap['2026-10-22'], 'pending');
  assert.equal(res.missedDays, 0);
});

test('teacher exception preserves streak for missed day', () => {
  const daysMap = {
    '2026-10-20': { hasStreakTask: true, completedOnTime: true },
    '2026-10-21': { hasStreakTask: true, completedOnTime: false, hasException: true }, // Teacher granted exception
    '2026-10-22': { hasStreakTask: true, completedOnTime: true },
  };

  const res = calculateStreak(daysMap, '2026-10-22', '2026-10-20');
  assert.equal(res.currentStreak, 3);
  assert.equal(res.historyMap['2026-10-21'], 'completed');
});
