import type { IngredientId } from '@/data/ingredients';

/**
 * How often each ingredient needs buying, for splitting the grocery list.
 *  - fresh:  produce, fresh meat, dairy, bread. Buy every week.
 *  - frozen: frozen fish, fruit and vegetables. Buy once for the month, keep in the freezer.
 *  - pantry: shelf-stable (protein powder, grains, canned goods, oils, sauces). Buy once for the month.
 * Anything not listed is treated as fresh.
 */
export type Shelf = 'fresh' | 'frozen' | 'pantry';

const FROZEN: IngredientId[] = ['salmon', 'cod', 'shrimp', 'berries', 'pineapple', 'stirfry_veg', 'green_beans', 'edamame'];

const PANTRY: IngredientId[] = [
  'whey',
  'pea_protein',
  'tuna',
  'beef_jerky',
  'oats',
  'white_rice',
  'brown_rice',
  'jasmine_rice',
  'quinoa',
  'pasta',
  'rice_cakes',
  'granola',
  'black_beans',
  'kidney_beans',
  'chickpeas',
  'lentils',
  'olive_oil',
  'peanut_butter',
  'sunflower_butter',
  'almonds',
  'pumpkin_seeds',
  'chia',
  'honey',
  'salsa',
  'marinara',
  'bbq_sauce',
  'soy_sauce',
  'jerk_seasoning',
  'coconut_milk_lite',
  'dark_chocolate',
];

const SHELF = new Map<IngredientId, Shelf>([
  ...FROZEN.map((id) => [id, 'frozen'] as const),
  ...PANTRY.map((id) => [id, 'pantry'] as const),
]);

export function shelfOf(id: IngredientId): Shelf {
  return SHELF.get(id) ?? 'fresh';
}
