import { useSyncExternalStore } from 'react';

import type { GeneratePlanResponse } from '@/lib/api';

// The plan the user chose with "Select this plan". In-memory for now (resets on reload).
export type SelectedPlan = {
  coachId: string;
  daysPerWeek: number;
  sessionMinutes: number;
  seed: number;
  plan: GeneratePlanResponse;
};

let current: SelectedPlan | null = null;
const listeners = new Set<() => void>();

export function selectPlan(next: SelectedPlan) {
  current = next;
  listeners.forEach((l) => l());
}

export function getSelectedPlan(): SelectedPlan | null {
  return current;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Re-renders when a plan is selected or changed. */
export function useSelectedPlan(): SelectedPlan | null {
  return useSyncExternalStore(subscribe, getSelectedPlan, getSelectedPlan);
}
