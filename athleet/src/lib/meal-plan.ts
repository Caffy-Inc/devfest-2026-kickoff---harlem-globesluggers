import { INGREDIENTS, PANTRY_COST_PER_SERVING, priceFor, type IngredientId } from '@/data/ingredients';
import { RECIPES, type MealSlot, type Recipe, type RecipeTag } from '@/data/recipes';
import type { Goal, NutritionTargets } from '@/lib/types';

// ─── Types ──────────────────────────────────────────────────────────────────

export type PlannedIngredient = {
  name: string;
  amount: string; // "170 g (6 oz)", "2 eggs", "1 tbsp"
  grams: number;
  cost: number;
  note?: string;
};

export type PlannedMeal = {
  recipeId: string;
  name: string;
  slot: MealSlot;
  minutes: number;
  tags: RecipeTag[];
  coachPick: boolean;
  /** Multiple of the base recipe, scaled to the calorie target. */
  servings: number;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  /** Average U.S. grocery cost of the ingredients used for this meal. */
  cost: number;
  ingredients: PlannedIngredient[];
  steps: string[];
};

export type MealSlotPlan = {
  slot: MealSlot;
  label: string;
  timing: string;
  targetKcal?: number;
  /** options[0] is the recommended pick; the rest are swaps. */
  options: PlannedMeal[];
};

export type GroceryItem = {
  name: string;
  weeklyAmount: string;
  /** Cost of the amount actually used in a week. */
  usedCost: number;
  /** Whole packages to buy, and what they cost at checkout. */
  packages: number;
  packageLabel: string;
  checkoutCost: number;
};

export type MealPlan = {
  showNumbers: boolean;
  slots: MealSlotPlan[];
  /** Totals for the recommended pick in every slot. */
  day: DayTotals;
  avgCostPerMeal: number;
  costPerWeek: number;
  groceryList: GroceryItem[];
  groceryCheckoutTotal: number;
  tips: string[];
  priceNote: string;
};

export type DayTotals = { kcal: number; protein: number; carbs: number; fat: number; cost: number };

// ─── Config ─────────────────────────────────────────────────────────────────

const SLOTS: { slot: MealSlot; label: string; timing: string; share: number }[] = [
  { slot: 'breakfast', label: 'Breakfast', timing: 'Within an hour of waking', share: 0.25 },
  { slot: 'lunch', label: 'Lunch', timing: 'Midday', share: 0.3 },
  { slot: 'snack', label: 'Pre / post-workout snack', timing: '30-60 min before or within 1 hr after training', share: 0.15 },
  { slot: 'dinner', label: 'Dinner', timing: 'Evening, 2-3 hrs before bed', share: 0.3 },
];

const OPTIONS_PER_SLOT = 3;

export const PRICE_NOTE =
  'Average U.S. grocery prices (BLS city averages for staples, Aug 2026; store-brand estimates for the rest). ' +
  'Meal cost counts only the ingredients used, plus about $0.15 for spices and oil spray.';

// ─── Math helpers ───────────────────────────────────────────────────────────

const round2 = (n: number) => Math.round(n * 100) / 100;
const roundTo = (n: number, step: number) => Math.round(n / step) * step;

function baseNutrition(recipe: Recipe) {
  let kcal = 0, protein = 0, carbs = 0, fat = 0;
  for (const { id, g } of recipe.ingredients) {
    const ing = INGREDIENTS[id];
    const f = g / 100;
    kcal += ing.kcal * f;
    protein += ing.protein * f;
    carbs += ing.carbs * f;
    fat += ing.fat * f;
  }
  return { kcal, protein, carbs, fat };
}

function formatAmount(id: IngredientId, grams: number): string {
  const ing = INGREDIENTS[id];
  if (ing.unit) {
    const count = Math.max(0.5, roundTo(grams / ing.unit.grams, 0.5));
    const word = count === 1 || count === 0.5 ? ing.unit.name : ing.unit.plural;
    const label = count === 0.5 ? '½' : Number.isInteger(count) ? String(count) : `${Math.floor(count)}½`;
    return `${label} ${word}`;
  }
  if (ing.tbsp && grams <= ing.tbsp * 4) {
    const tbsp = grams / ing.tbsp;
    if (tbsp < 0.9) return `${Math.max(1, Math.round(tbsp * 3))} tsp`;
    const r = roundTo(tbsp, 0.5);
    return `${Number.isInteger(r) ? r : `${Math.floor(r) || ''}½`} tbsp`;
  }
  const g = Math.round(grams / 5) * 5 || Math.round(grams);
  if (ing.liquid) {
    const cups = g / 240;
    return cups >= 0.25 ? `${g} ml (${roundTo(cups, 0.25)} cup)` : `${g} ml`;
  }
  const oz = grams / 28.35;
  return oz >= 1 ? `${g} g (${roundTo(oz, 0.5)} oz)` : `${g} g`;
}

function weeklyAmount(id: IngredientId, grams: number): string {
  const ing = INGREDIENTS[id];
  if (ing.unit) return `${Math.ceil(grams / ing.unit.grams)} ${ing.unit.plural}`;
  if (grams >= 454) return `${roundTo(grams / 453.6, 0.25)} lb`;
  return `${Math.round(grams)} ${ing.liquid ? 'ml' : 'g'}`;
}

// ─── Building meals ─────────────────────────────────────────────────────────

export function buildMeal(recipe: Recipe, servings: number, coachId?: string): PlannedMeal {
  const base = baseNutrition(recipe);
  const ingredients = recipe.ingredients.map(({ id, g, note }) => {
    const grams = g * servings;
    return {
      name: INGREDIENTS[id].name,
      amount: formatAmount(id, grams),
      grams,
      cost: round2(priceFor(id, grams)),
      note,
    };
  });
  const cost =
    recipe.ingredients.reduce((s, { id, g }) => s + priceFor(id, g * servings), 0) +
    PANTRY_COST_PER_SERVING * servings;

  return {
    recipeId: recipe.id,
    name: recipe.name,
    slot: recipe.slot,
    minutes: recipe.minutes,
    tags: recipe.tags,
    coachPick: !!coachId && !!recipe.coachPicks?.includes(coachId),
    servings,
    kcal: Math.round(base.kcal * servings),
    protein: Math.round(base.protein * servings),
    carbs: Math.round(base.carbs * servings),
    fat: Math.round(base.fat * servings),
    cost: round2(cost),
    ingredients,
    steps: recipe.steps,
  };
}

/** Rank recipes for a slot by coach style and goal. */
function rankRecipes(slot: MealSlot, goal: Goal, coachId: string): Recipe[] {
  const scored = RECIPES.filter((r) => r.slot === slot).map((r) => {
    const n = baseNutrition(r);
    const proteinShare = (n.protein * 4) / Math.max(1, n.kcal); // 0..1
    let score = 0;
    if (r.coachPicks?.includes(coachId)) score += 3;
    if (r.tags.includes('budget')) score += 0.5;
    if (r.tags.includes('meal_prep')) score += 0.3;
    switch (goal) {
      case 'lose_fat':
      case 'cut':
        score += proteinShare * 8; // lean, filling meals
        break;
      case 'bulk':
      case 'build_muscle':
        score += Math.min(n.kcal, 900) / 300 + proteinShare * 3; // calorie-dense but still protein-rich
        break;
      case 'sport_performance':
      case 'get_stronger':
        score += (n.carbs * 4) / Math.max(1, n.kcal) * 3 + proteinShare * 4;
        if (slot === 'snack' && (r.tags.includes('pre_workout') || r.tags.includes('post_workout'))) score += 1;
        break;
      default:
        score += proteinShare * 4;
    }
    return { r, score };
  });
  return scored.sort((a, b) => b.score - a.score).map((s) => s.r);
}

function servingsFor(recipe: Recipe, targetKcal: number | undefined): number {
  if (!targetKcal) return 1;
  const factor = targetKcal / baseNutrition(recipe).kcal;
  return Math.min(2, Math.max(0.75, roundTo(factor, 0.25)));
}

export function dayTotals(meals: PlannedMeal[]): DayTotals {
  return meals.reduce(
    (t, m) => ({
      kcal: t.kcal + m.kcal,
      protein: t.protein + m.protein,
      carbs: t.carbs + m.carbs,
      fat: t.fat + m.fat,
      cost: round2(t.cost + m.cost),
    }),
    { kcal: 0, protein: 0, carbs: 0, fat: 0, cost: 0 }
  );
}

/** Shopping list for eating these meals every day for a week. */
export function groceryList(meals: PlannedMeal[]): GroceryItem[] {
  const grams = new Map<IngredientId, number>();
  for (const meal of meals) {
    const recipe = RECIPES.find((r) => r.id === meal.recipeId)!;
    for (const { id, g } of recipe.ingredients) {
      grams.set(id, (grams.get(id) ?? 0) + g * meal.servings * 7);
    }
  }
  return [...grams.entries()]
    .map(([id, g]) => {
      const ing = INGREDIENTS[id];
      const packages = Math.max(1, Math.ceil(g / ing.pkg.grams - 0.05));
      return {
        name: ing.name,
        weeklyAmount: weeklyAmount(id, g),
        usedCost: round2(priceFor(id, g)),
        packages,
        packageLabel: ing.pkg.label,
        checkoutCost: round2(packages * ing.pkg.price),
      };
    })
    .sort((a, b) => b.checkoutCost - a.checkoutCost);
}

// ─── Public entry point ─────────────────────────────────────────────────────

export function buildMealPlan(opts: {
  goal: Goal;
  coachId: string;
  targets: NutritionTargets;
  seed?: number;
  coachTips?: string[];
}): MealPlan {
  const { goal, coachId, targets, seed = 0, coachTips = [] } = opts;
  const calories = targets.showNumbers ? targets.calories : undefined;

  const slots: MealSlotPlan[] = SLOTS.map(({ slot, label, timing, share }, slotIndex) => {
    const ranked = rankRecipes(slot, goal, coachId);
    // Regenerating the plan rotates through the ranked list so each variation
    // leads with a different recipe while keeping the best fits near the top.
    const offset = (seed + slotIndex * seed) % ranked.length;
    const rotated = [...ranked.slice(offset), ...ranked.slice(0, offset)];
    const targetKcal = calories ? Math.round((calories * share) / 10) * 10 : undefined;
    return {
      slot,
      label,
      timing,
      targetKcal,
      options: rotated.slice(0, OPTIONS_PER_SLOT).map((r) => buildMeal(r, servingsFor(r, targetKcal), coachId)),
    };
  });

  const picks = slots.map((s) => s.options[0]);
  const day = dayTotals(picks);
  const list = groceryList(picks);

  const tips: string[] = [];
  if (targets.showNumbers && targets.proteinG) {
    const perMeal = Math.round(targets.proteinG / 4);
    tips.push(`Spread protein across the day: about ${perMeal}g per meal hits your ${targets.proteinG}g target.`);
    const gap = targets.proteinG - day.protein;
    if (gap > 15) {
      tips.push(`This menu lands ~${gap}g short on protein. Add a scoop of whey ($${round2(priceFor('whey', 30)).toFixed(2)}, 24g) or an extra 100g chicken breast.`);
    }
  }
  tips.push('Batch-cook the meal-prep recipes on Sunday and Wednesday: cook rice, proteins and chili in bulk, portion into containers.');
  tips.push('Buy frozen fish, shrimp, berries and vegetables — same nutrition, lower price, no waste.');
  tips.push(...coachTips.slice(0, 2));

  return {
    showNumbers: targets.showNumbers,
    slots,
    day,
    avgCostPerMeal: round2(day.cost / picks.length),
    costPerWeek: round2(day.cost * 7),
    groceryList: list,
    groceryCheckoutTotal: round2(list.reduce((s, i) => s + i.checkoutCost, 0)),
    tips,
    priceNote: PRICE_NOTE,
  };
}
