import { useSyncExternalStore } from 'react';

// Finished workouts. In-memory for now (resets on reload), like the selected plan.

export type LoggedSet = { exercise: string; set: number; reps: string; weight: string };

export type WorkoutLog = {
  coachId: string;
  dayIndex: number;
  dayName: string;
  finishedAt: number;
  minutes: number;
  sets: LoggedSet[];
};

let logs: WorkoutLog[] = [];
const listeners = new Set<() => void>();

export function saveWorkout(log: WorkoutLog) {
  logs = [...logs, log];
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
