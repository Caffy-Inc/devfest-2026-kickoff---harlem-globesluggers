import { useMemo } from 'react';

import type { RestrictionId } from '@/data/dietary';
import { withMealPlan } from '@/lib/api';
import { effectiveBudget, useBudget, type BudgetSetting } from '@/lib/budget-store';
import { useDietaryRestrictions } from '@/lib/dietary-store';
import { buildMealPlan, type MealPlan } from '@/lib/meal-plan';
import { useProfile } from '@/lib/profile-store';
import { useSelectedPlan, type SelectedPlan } from '@/lib/selected-plan';
import type { Goal } from '@/lib/types';

/**
 * The selected plan's meal plan, rebuilt on-device with the user's current dietary
 * restrictions and budget. Shared by the Your Meals and Budget tabs so they always agree.
 */
export function useCurrentMealPlan() {
  const selected = useSelectedPlan();
  const restrictions = useDietaryRestrictions();
  const budget = useBudget();
  const profile = useProfile();
  const mealPlan = useMemo(
    () => (selected ? mealPlanFor(selected, restrictions, effectiveBudget(budget), profile?.goal) : undefined),
    [selected, restrictions, budget, profile?.goal]
  );
  return { selected, mealPlan, restrictions, budget };
}

function mealPlanFor(
  selected: SelectedPlan,
  restrictions: RestrictionId[],
  budget: BudgetSetting,
  profileGoal?: Goal
): MealPlan | undefined {
  const { plan, request, seed } = selected;
  if (request) return withMealPlan(plan, request, seed, restrictions, budget).nutrition.mealPlan;
  const targets = plan.nutrition.targets;
  if (!targets) return plan.nutrition.mealPlan;
  return buildMealPlan({
    goal: profileGoal ?? 'general_fitness',
    coachId: selected.coachId,
    targets,
    seed,
    coachTips: plan.nutrition.tips,
    restrictions,
    budget,
  });
}
