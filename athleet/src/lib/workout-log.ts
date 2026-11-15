import { useSyncExternalStore } from 'react';

export type LoggedSet = { exercise: string; set: number; reps: string; weight: string };

export type WorkoutLog = {
  coachId: string;
  dayIndex: number;
  dayName: string;
  finishedAt: number; // epoch ms
  minutes: number;
  sets: LoggedSet[];
};

const STORAGE_KEY = 'athleet_workout_logs_v1';

function loadInitialLogs(): WorkoutLog[] {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
  }
  return [];
}

let logs: WorkoutLog[] = loadInitialLogs();
const listeners = new Set<() => void>();

function persistLogs() {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
    } catch {}
  }
}

export function saveWorkout(log: WorkoutLog) {
  logs = [...logs, log];
  persistLogs();
  listeners.forEach((l) => l());
}

export function clearLogs() {
  logs = [];
  persistLogs();
  listeners.forEach((l) => l());
}

function getLogs() {
  return logs;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useWorkoutLogs(): WorkoutLog[] {
  return useSyncExternalStore(subscribe, getLogs, getLogs);
}

/** Most recent log for a plan day, if it was done this week. */
export function lastLogForDay(all: WorkoutLog[], coachId: string, dayIndex: number): WorkoutLog | undefined {
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  return [...all]
    .reverse()
    .find((l) => l.coachId === coachId && l.dayIndex === dayIndex && l.finishedAt > weekAgo);
}

/** Seconds of rest from text like "90s", "60-90s", "90s-2 min", "2-3 min". Uses the low end. */
export function restSeconds(rest: string): number {
  const m = rest.match(/(\d+)\s*(s|sec|min)?/i);
  if (!m) return 0;
  const n = Number(m[1]);
  const unit = m[2]?.toLowerCase() ?? (/min/i.test(rest) ? 'min' : 's');
  return unit.startsWith('min') ? n * 60 : n;
}

/**
 * Returns Monday 00:00:00 and Sunday 23:59:59 for the given date.
 */
export function getWeekBounds(referenceDate = new Date()): { start: Date; end: Date; weekDays: Date[] } {
  const d = new Date(referenceDate);
  const day = d.getDay(); // 0 is Sunday, 1 is Monday
  const diffToMonday = (day + 6) % 7; // Monday is 0

  const start = new Date(d);
  start.setDate(d.getDate() - diffToMonday);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);

  const weekDays: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const dayDate = new Date(start);
    dayDate.setDate(start.getDate() + i);
    weekDays.push(dayDate);
  }

  return { start, end, weekDays };
}

/**
 * Returns logs finished between week start and end.
 */
export function getLogsForWeek(all: WorkoutLog[], weekStart: Date, weekEnd: Date): WorkoutLog[] {
  const startMs = weekStart.getTime();
  const endMs = weekEnd.getTime();
  return all.filter((l) => l.finishedAt >= startMs && l.finishedAt <= endMs);
}

/**
 * Checks if two Date objects are on the same calendar day (local time).
 */
export function isSameDay(d1: Date, d2: Date): boolean {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

/**
 * Seeds a demo completed workout for testing or presentation demo.
 */
export function seedDemoWorkout(coachId: string, dayIndex: number, dayName: string, dateOffsetDays = 0): void {
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() - dateOffsetDays);

  const sampleSets: LoggedSet[] = [
    { exercise: 'Barbell Back Squat', set: 1, reps: '8', weight: '185 lbs' },
    { exercise: 'Barbell Back Squat', set: 2, reps: '8', weight: '205 lbs' },
    { exercise: 'Barbell Back Squat', set: 3, reps: '6', weight: '225 lbs' },
    { exercise: 'Dumbbell Romanian Deadlift', set: 1, reps: '10', weight: '70 lbs' },
    { exercise: 'Dumbbell Romanian Deadlift', set: 2, reps: '10', weight: '75 lbs' },
    { exercise: 'Walking Lunges', set: 1, reps: '12 / leg', weight: '40 lbs' },
    { exercise: 'Hanging Leg Raises', set: 1, reps: '15', weight: 'BW' },
  ];

  saveWorkout({
    coachId,
    dayIndex,
    dayName,
    finishedAt: targetDate.getTime(),
    minutes: 48,
    sets: sampleSets,
  });
}
