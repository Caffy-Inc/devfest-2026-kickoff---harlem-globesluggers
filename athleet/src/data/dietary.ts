import type { IngredientId } from '@/data/ingredients';
import type { Recipe } from '@/data/recipes';

/**
 * Dietary restrictions for the meal planner.
 *
 * Every ingredient lists what it "contains" (animal products, allergens). A
 * recipe passes a restriction when none of its ingredients contain anything
 * that restriction excludes, so new recipes are filtered automatically.
 */

export type DietFlag =
  | 'red_meat'
  | 'poultry'
  | 'pork'
  | 'fish'
  | 'shellfish'
  | 'dairy'
  | 'egg'
  | 'honey'
  | 'gluten'
  | 'peanut'
  | 'tree_nut'
  | 'soy'
  | 'sesame'
  | 'alcohol';

/** What each ingredient contains. Ingredients not listed contain none of the flags. */
export const CONTAINS: Partial<Record<IngredientId, DietFlag[]>> = {
  chicken_breast: ['poultry'],
  chicken_thigh: ['poultry'],
  ground_turkey: ['poultry'],
  turkey_deli: ['poultry'],
  lean_beef: ['red_meat'],
  sirloin: ['red_meat'],
  flank_steak: ['red_meat'],
  // Most jerky is marinated in soy sauce, which contains wheat.
  beef_jerky: ['red_meat', 'soy', 'gluten'],
  pork_tenderloin: ['pork'],
  pork_chop: ['pork'],
  salmon: ['fish'],
  cod: ['fish'],
  tuna: ['fish'],
  shrimp: ['shellfish'],
  eggs: ['egg'],
  egg_whites: ['egg'],
  tofu: ['soy'],
  tempeh: ['soy'],
  edamame: ['soy'],
  soy_milk: ['soy'],
  soy_sauce: ['soy', 'gluten'],
  whey: ['dairy'],
  greek_yogurt: ['dairy'],
  cottage_cheese: ['dairy'],
  milk: ['dairy'],
  cheddar: ['dairy'],
  mozzarella: ['dairy'],
  feta: ['dairy'],
  tzatziki: ['dairy'],
  // Regular oats are usually cross-contaminated with wheat; certified GF oats are fine.
  oats: ['gluten'],
  granola: ['gluten', 'tree_nut', 'honey'],
  pasta: ['gluten'],
  bread: ['gluten'],
  tortilla: ['gluten'],
  bagel: ['gluten'],
  peanut_butter: ['peanut'],
  almonds: ['tree_nut'],
  honey: ['honey'],
  hummus: ['sesame'],
  // 70% dark chocolate is usually dairy-free but often contains soy lecithin.
  dark_chocolate: ['soy'],
};

export type RestrictionId =
  | 'vegetarian'
  | 'vegan'
  | 'pescatarian'
  | 'halal'
  | 'kosher'
  | 'gluten'
  | 'dairy'
  | 'egg'
  | 'peanut'
  | 'tree_nut'
  | 'soy'
  | 'fish'
  | 'shellfish'
  | 'sesame';

export type Restriction = {
  id: RestrictionId;
  label: string;
  group: 'diet' | 'allergy';
  excludes: DietFlag[];
  /** Extra rule beyond ingredient flags (e.g. kosher: no meat with dairy). */
  allows?: (flags: Set<DietFlag>) => boolean;
  /** Shopping advice shown in the coach notes when this restriction is on. */
  note?: string;
};

const MEAT: DietFlag[] = ['red_meat', 'poultry', 'pork'];

export const RESTRICTIONS: Restriction[] = [
  { id: 'vegetarian', label: 'Vegetarian', group: 'diet', excludes: [...MEAT, 'fish', 'shellfish'] },
  { id: 'vegan', label: 'Vegan', group: 'diet', excludes: [...MEAT, 'fish', 'shellfish', 'dairy', 'egg', 'honey'] },
  { id: 'pescatarian', label: 'Pescatarian', group: 'diet', excludes: MEAT },
  {
    id: 'halal',
    label: 'Halal',
    group: 'diet',
    excludes: ['pork', 'alcohol'],
    note: 'Halal: buy halal-certified chicken, turkey and beef, and check cheese and whey labels for animal rennet or gelatin.',
  },
  {
    id: 'kosher',
    label: 'Kosher',
    group: 'diet',
    excludes: ['pork', 'shellfish', 'alcohol'],
    allows: (f) => !((f.has('red_meat') || f.has('poultry')) && f.has('dairy')),
    note: 'Kosher: meals never mix meat with dairy. Look for a hechsher on meat, cheese, whey and packaged foods.',
  },
  {
    id: 'gluten',
    label: 'Gluten / wheat',
    group: 'allergy',
    excludes: ['gluten'],
    note: 'Gluten-free: tamari can replace soy sauce, and certified gluten-free oats are safe if you want oatmeal back.',
  },
  { id: 'dairy', label: 'Milk / dairy', group: 'allergy', excludes: ['dairy'] },
  { id: 'egg', label: 'Eggs', group: 'allergy', excludes: ['egg'] },
  { id: 'peanut', label: 'Peanuts', group: 'allergy', excludes: ['peanut'] },
  { id: 'tree_nut', label: 'Tree nuts', group: 'allergy', excludes: ['tree_nut'] },
  { id: 'soy', label: 'Soy', group: 'allergy', excludes: ['soy'] },
  { id: 'fish', label: 'Fish', group: 'allergy', excludes: ['fish'] },
  { id: 'shellfish', label: 'Shellfish', group: 'allergy', excludes: ['shellfish'] },
  { id: 'sesame', label: 'Sesame', group: 'allergy', excludes: ['sesame'] },
];

const BY_ID = new Map(RESTRICTIONS.map((r) => [r.id, r]));

export function isRestrictionId(v: unknown): v is RestrictionId {
  return typeof v === 'string' && BY_ID.has(v as RestrictionId);
}

export function getRestriction(id: RestrictionId): Restriction {
  return BY_ID.get(id)!;
}

export function recipeFlags(recipe: Recipe): Set<DietFlag> {
  const flags = new Set<DietFlag>();
  for (const { id } of recipe.ingredients) for (const f of CONTAINS[id] ?? []) flags.add(f);
  return flags;
}

/** True when the recipe is safe for every selected restriction. */
export function recipeAllowed(recipe: Recipe, restrictions: readonly RestrictionId[]): boolean {
  if (restrictions.length === 0) return true;
  const flags = recipeFlags(recipe);
  return restrictions.every((id) => {
    const r = BY_ID.get(id);
    if (!r) return true;
    return !r.excludes.some((f) => flags.has(f)) && (r.allows?.(flags) ?? true);
  });
}
