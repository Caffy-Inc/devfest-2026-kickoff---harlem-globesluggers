/**
 * Ingredient catalog used by the meal planner.
 *
 * Nutrition is per 100 g as sold (USDA FoodData Central approximations).
 * Prices are average U.S. grocery prices as a package price + package weight,
 * so they are easy to audit and update. Staples marked "BLS" use the BLS
 * U.S. city-average price for Aug 2026 (eggs $2.27/doz, boneless chicken
 * breast $4.17/lb, ground beef $6.92/lb, rice $1.11/lb, potatoes $0.98/lb,
 * bread $1.82/lb, bananas $0.65/lb, milk $4.11/gal). Everything else is a
 * typical big-box store-brand price and should be treated as an estimate.
 */

export type IngredientId = keyof typeof RAW;

export type Ingredient = {
  name: string;
  kcal: number;    // per 100 g
  protein: number; // g per 100 g
  carbs: number;
  fat: number;
  /** Package price in USD and package weight in grams. */
  pkg: { price: number; grams: number; label: string };
  /** Countable items (eggs, tortillas) are shown as units instead of grams. */
  unit?: { name: string; plural: string; grams: number };
  /** Liquids are shown in ml (assumes ~1 g/ml). */
  liquid?: boolean;
  /** Grams per tablespoon, for small amounts of oils, spreads and sauces. */
  tbsp?: number;
};

const LB = 453.6;

const RAW = {
  // ── Proteins ──
  chicken_breast: { name: 'Boneless chicken breast', kcal: 120, protein: 22.5, carbs: 0, fat: 2.6, pkg: { price: 4.17, grams: LB, label: '$4.17/lb (BLS)' } },
  chicken_thigh: { name: 'Boneless chicken thighs', kcal: 144, protein: 19.7, carbs: 0, fat: 6.7, pkg: { price: 3.49, grams: LB, label: '$3.49/lb' } },
  ground_turkey: { name: '93% lean ground turkey', kcal: 150, protein: 18.7, carbs: 0, fat: 8.3, pkg: { price: 5.49, grams: LB, label: '$5.49/lb' } },
  lean_beef: { name: '90% lean ground beef', kcal: 176, protein: 20, carbs: 0, fat: 10, pkg: { price: 8.3, grams: LB, label: '$8.30/lb (BLS lean)' } },
  sirloin: { name: 'Top sirloin steak', kcal: 160, protein: 22, carbs: 0, fat: 7.5, pkg: { price: 10.99, grams: LB, label: '$10.99/lb' } },
  salmon: { name: 'Salmon fillet (frozen)', kcal: 208, protein: 20, carbs: 0, fat: 13, pkg: { price: 9.99, grams: LB, label: '$9.99/lb' } },
  cod: { name: 'Cod fillet (frozen)', kcal: 82, protein: 18, carbs: 0, fat: 0.7, pkg: { price: 8.49, grams: LB, label: '$8.49/lb' } },
  shrimp: { name: 'Raw shrimp (frozen, peeled)', kcal: 85, protein: 20, carbs: 0, fat: 0.5, pkg: { price: 8.99, grams: LB, label: '$8.99/lb' } },
  tuna: { name: 'Canned tuna in water (drained)', kcal: 116, protein: 25.5, carbs: 0, fat: 0.8, pkg: { price: 1.29, grams: 113, label: '$1.29/5 oz can' } },
  turkey_deli: { name: 'Sliced turkey breast', kcal: 104, protein: 18, carbs: 3, fat: 2, pkg: { price: 5.99, grams: 255, label: '$5.99/9 oz' } },
  eggs: { name: 'Large eggs', kcal: 143, protein: 12.6, carbs: 0.7, fat: 9.5, pkg: { price: 2.27, grams: 600, label: '$2.27/dozen (BLS)' }, unit: { name: 'egg', plural: 'eggs', grams: 50 } },
  egg_whites: { name: 'Liquid egg whites', kcal: 52, protein: 11, carbs: 0.7, fat: 0.2, pkg: { price: 3.99, grams: 907, label: '$3.99/32 oz' }, liquid: true },
  tofu: { name: 'Extra-firm tofu', kcal: 144, protein: 17, carbs: 3, fat: 9, pkg: { price: 2.49, grams: 397, label: '$2.49/14 oz' } },
  tempeh: { name: 'Tempeh', kcal: 192, protein: 20, carbs: 7.6, fat: 10.8, pkg: { price: 2.99, grams: 227, label: '$2.99/8 oz' } },
  edamame: { name: 'Shelled edamame (frozen)', kcal: 121, protein: 12, carbs: 9, fat: 5, pkg: { price: 2.49, grams: 340, label: '$2.49/12 oz' } },
  pea_protein: { name: 'Pea protein powder', kcal: 380, protein: 80, carbs: 4, fat: 6, pkg: { price: 29.99, grams: 907, label: '$29.99/2 lb' }, unit: { name: 'scoop', plural: 'scoops', grams: 30 } },
  whey: { name: 'Whey protein powder', kcal: 400, protein: 80, carbs: 8, fat: 5, pkg: { price: 39.99, grams: 907, label: '$39.99/2 lb' }, unit: { name: 'scoop', plural: 'scoops', grams: 30 } },

  // ── Dairy ──
  greek_yogurt: { name: 'Nonfat plain Greek yogurt', kcal: 59, protein: 10.3, carbs: 3.6, fat: 0.4, pkg: { price: 5.49, grams: 907, label: '$5.49/32 oz' } },
  cottage_cheese: { name: 'Low-fat cottage cheese', kcal: 81, protein: 10.5, carbs: 4.8, fat: 2.3, pkg: { price: 3.49, grams: 680, label: '$3.49/24 oz' } },
  milk: { name: '2% milk', kcal: 50, protein: 3.3, carbs: 4.8, fat: 2, pkg: { price: 4.11, grams: 3785, label: '$4.11/gal (BLS)' }, liquid: true },
  soy_milk: { name: 'Unsweetened soy milk', kcal: 33, protein: 2.9, carbs: 1.6, fat: 1.6, pkg: { price: 3.49, grams: 1893, label: '$3.49/64 oz' }, liquid: true },
  cheddar: { name: 'Shredded cheddar', kcal: 403, protein: 23, carbs: 3, fat: 33, pkg: { price: 6.13, grams: LB, label: '$6.13/lb (BLS)' } },
  mozzarella: { name: 'Part-skim mozzarella', kcal: 254, protein: 24, carbs: 3, fat: 16, pkg: { price: 4.49, grams: LB, label: '$4.49/lb' } },
  feta: { name: 'Crumbled feta', kcal: 264, protein: 14, carbs: 4, fat: 21, pkg: { price: 3.99, grams: 170, label: '$3.99/6 oz' } },

  // ── Carbs / grains ──
  oats: { name: 'Old-fashioned oats', kcal: 379, protein: 13, carbs: 68, fat: 6.5, pkg: { price: 4.49, grams: 1190, label: '$4.49/42 oz' } },
  white_rice: { name: 'White rice (dry)', kcal: 365, protein: 7, carbs: 80, fat: 0.7, pkg: { price: 1.11, grams: LB, label: '$1.11/lb (BLS)' } },
  brown_rice: { name: 'Brown rice (dry)', kcal: 367, protein: 7.5, carbs: 76, fat: 2.7, pkg: { price: 1.69, grams: LB, label: '$1.69/lb' } },
  jasmine_rice: { name: 'Jasmine rice (dry)', kcal: 360, protein: 7, carbs: 79, fat: 0.6, pkg: { price: 1.99, grams: LB, label: '$1.99/lb' } },
  quinoa: { name: 'Quinoa (dry)', kcal: 368, protein: 14, carbs: 64, fat: 6, pkg: { price: 4.99, grams: LB, label: '$4.99/lb' } },
  pasta: { name: 'Whole-wheat pasta (dry)', kcal: 352, protein: 15, carbs: 72, fat: 2.5, pkg: { price: 1.79, grams: LB, label: '$1.79/lb' } },
  bread: { name: 'Whole-wheat bread', kcal: 250, protein: 12, carbs: 43, fat: 3.5, pkg: { price: 3.49, grams: 567, label: '$3.49/20 oz loaf' }, unit: { name: 'slice', plural: 'slices', grams: 32 } },
  tortilla: { name: 'Whole-wheat tortilla (10")', kcal: 300, protein: 9, carbs: 50, fat: 7, pkg: { price: 3.49, grams: 560, label: '$3.49/8 ct' }, unit: { name: 'tortilla', plural: 'tortillas', grams: 70 } },
  corn_tortilla: { name: 'Corn tortilla (6")', kcal: 218, protein: 5.7, carbs: 45, fat: 2.9, pkg: { price: 2.49, grams: 780, label: '$2.49/30 ct' }, unit: { name: 'tortilla', plural: 'tortillas', grams: 26 } },
  bagel: { name: 'Plain bagel', kcal: 257, protein: 10, carbs: 50, fat: 1.5, pkg: { price: 3.99, grams: 600, label: '$3.99/6 ct' }, unit: { name: 'bagel', plural: 'bagels', grams: 100 } },
  rice_cakes: { name: 'Rice cakes', kcal: 387, protein: 8, carbs: 82, fat: 3, pkg: { price: 2.99, grams: 127, label: '$2.99/14 ct' }, unit: { name: 'rice cake', plural: 'rice cakes', grams: 9 } },
  sweet_potato: { name: 'Sweet potato', kcal: 86, protein: 1.6, carbs: 20, fat: 0.1, pkg: { price: 1.29, grams: LB, label: '$1.29/lb' } },
  potato: { name: 'Russet / gold potatoes', kcal: 77, protein: 2, carbs: 17, fat: 0.1, pkg: { price: 0.98, grams: LB, label: '$0.98/lb (BLS)' } },
  black_beans: { name: 'Black beans (canned, drained)', kcal: 91, protein: 6, carbs: 16.5, fat: 0.3, pkg: { price: 1.09, grams: 255, label: '$1.09/15 oz can' } },
  kidney_beans: { name: 'Kidney beans (canned, drained)', kcal: 84, protein: 5.2, carbs: 15, fat: 0.4, pkg: { price: 1.09, grams: 255, label: '$1.09/15 oz can' } },
  chickpeas: { name: 'Chickpeas (canned, drained)', kcal: 139, protein: 7, carbs: 22.5, fat: 2.5, pkg: { price: 1.09, grams: 255, label: '$1.09/15 oz can' } },
  lentils: { name: 'Red lentils (dry)', kcal: 352, protein: 24.6, carbs: 63, fat: 1.1, pkg: { price: 1.89, grams: LB, label: '$1.89/lb' } },
  granola: { name: 'Granola', kcal: 471, protein: 10, carbs: 64, fat: 20, pkg: { price: 4.49, grams: 340, label: '$4.49/12 oz' } },

  // ── Fruit ──
  banana: { name: 'Banana', kcal: 89, protein: 1.1, carbs: 23, fat: 0.3, pkg: { price: 0.65, grams: LB, label: '$0.65/lb (BLS)' }, unit: { name: 'banana', plural: 'bananas', grams: 118 } },
  berries: { name: 'Frozen mixed berries', kcal: 50, protein: 0.7, carbs: 12, fat: 0.3, pkg: { price: 3.99, grams: LB, label: '$3.99/16 oz' } },
  apple: { name: 'Apple', kcal: 52, protein: 0.3, carbs: 14, fat: 0.2, pkg: { price: 1.79, grams: LB, label: '$1.79/lb' }, unit: { name: 'apple', plural: 'apples', grams: 180 } },
  pineapple: { name: 'Pineapple chunks (frozen)', kcal: 50, protein: 0.5, carbs: 13, fat: 0.1, pkg: { price: 3.49, grams: LB, label: '$3.49/16 oz' } },
  lime: { name: 'Lime', kcal: 30, protein: 0.7, carbs: 10.5, fat: 0.2, pkg: { price: 0.4, grams: 67, label: '$0.40 each' }, unit: { name: 'lime', plural: 'limes', grams: 67 } },
  lemon: { name: 'Lemon', kcal: 29, protein: 1.1, carbs: 9, fat: 0.3, pkg: { price: 0.6, grams: 84, label: '$0.60 each' }, unit: { name: 'lemon', plural: 'lemons', grams: 84 } },

  // ── Vegetables ──
  broccoli: { name: 'Broccoli florets', kcal: 34, protein: 2.8, carbs: 7, fat: 0.4, pkg: { price: 1.99, grams: 340, label: '$1.99/12 oz' } },
  spinach: { name: 'Baby spinach', kcal: 23, protein: 2.9, carbs: 3.6, fat: 0.4, pkg: { price: 2.99, grams: 283, label: '$2.99/10 oz' } },
  stirfry_veg: { name: 'Frozen stir-fry vegetables', kcal: 35, protein: 2, carbs: 7, fat: 0.2, pkg: { price: 2.49, grams: LB, label: '$2.49/16 oz' } },
  bell_pepper: { name: 'Bell pepper', kcal: 31, protein: 1, carbs: 6, fat: 0.3, pkg: { price: 1.29, grams: 150, label: '$1.29 each' }, unit: { name: 'pepper', plural: 'peppers', grams: 150 } },
  onion: { name: 'Yellow onion', kcal: 40, protein: 1.1, carbs: 9, fat: 0.1, pkg: { price: 1.19, grams: LB, label: '$1.19/lb' } },
  tomato: { name: 'Tomatoes', kcal: 18, protein: 0.9, carbs: 3.9, fat: 0.2, pkg: { price: 1.98, grams: LB, label: '$1.98/lb (BLS)' } },
  cucumber: { name: 'Cucumber', kcal: 15, protein: 0.7, carbs: 3.6, fat: 0.1, pkg: { price: 0.79, grams: 300, label: '$0.79 each' } },
  romaine: { name: 'Romaine lettuce', kcal: 17, protein: 1.2, carbs: 3.3, fat: 0.3, pkg: { price: 1.47, grams: LB, label: '$1.47/lb (BLS lettuce)' } },
  green_beans: { name: 'Frozen green beans', kcal: 31, protein: 1.8, carbs: 7, fat: 0.2, pkg: { price: 1.49, grams: 340, label: '$1.49/12 oz' } },
  zucchini: { name: 'Zucchini', kcal: 17, protein: 1.2, carbs: 3.1, fat: 0.3, pkg: { price: 1.69, grams: LB, label: '$1.69/lb' } },
  avocado: { name: 'Avocado', kcal: 160, protein: 2, carbs: 8.5, fat: 14.7, pkg: { price: 1.25, grams: 140, label: '$1.25 each' }, unit: { name: 'avocado', plural: 'avocados', grams: 140 } },

  // ── Fats, sauces, extras ──
  olive_oil: { name: 'Olive oil', kcal: 884, protein: 0, carbs: 0, fat: 100, pkg: { price: 9.99, grams: 460, label: '$9.99/500 ml' }, tbsp: 13.5 },
  peanut_butter: { name: 'Peanut butter', kcal: 588, protein: 25, carbs: 20, fat: 50, pkg: { price: 3.49, grams: LB, label: '$3.49/16 oz' }, tbsp: 16 },
  almonds: { name: 'Almonds', kcal: 579, protein: 21, carbs: 22, fat: 50, pkg: { price: 6.99, grams: LB, label: '$6.99/lb' } },
  sunflower_butter: { name: 'Sunflower seed butter', kcal: 617, protein: 17, carbs: 24, fat: 55, pkg: { price: 4.99, grams: LB, label: '$4.99/16 oz' }, tbsp: 16 },
  pumpkin_seeds: { name: 'Pumpkin seeds (pepitas)', kcal: 559, protein: 30, carbs: 11, fat: 49, pkg: { price: 4.99, grams: 227, label: '$4.99/8 oz' } },
  chia: { name: 'Chia seeds', kcal: 486, protein: 17, carbs: 42, fat: 31, pkg: { price: 5.99, grams: 340, label: '$5.99/12 oz' }, tbsp: 12 },
  honey: { name: 'Honey', kcal: 304, protein: 0.3, carbs: 82, fat: 0, pkg: { price: 5.99, grams: 340, label: '$5.99/12 oz' }, tbsp: 21 },
  salsa: { name: 'Salsa', kcal: 36, protein: 1.5, carbs: 7, fat: 0.2, pkg: { price: 3.49, grams: LB, label: '$3.49/16 oz' } },
  marinara: { name: 'Marinara sauce', kcal: 50, protein: 1.5, carbs: 8, fat: 1.5, pkg: { price: 2.99, grams: 680, label: '$2.99/24 oz' } },
  soy_sauce: { name: 'Low-sodium soy sauce', kcal: 53, protein: 8, carbs: 5, fat: 0.6, pkg: { price: 2.99, grams: 500, label: '$2.99/15 oz' }, tbsp: 16, liquid: true },
  hummus: { name: 'Hummus', kcal: 166, protein: 8, carbs: 14, fat: 10, pkg: { price: 3.99, grams: 283, label: '$3.99/10 oz' } },
  tzatziki: { name: 'Tzatziki', kcal: 95, protein: 4, carbs: 5, fat: 6.5, pkg: { price: 3.99, grams: 340, label: '$3.99/12 oz' } },
  jerk_seasoning: { name: 'Jerk seasoning paste', kcal: 60, protein: 1, carbs: 10, fat: 2, pkg: { price: 4.99, grams: 300, label: '$4.99/10 oz' }, tbsp: 17 },
  coconut_milk_lite: { name: 'Lite coconut milk', kcal: 75, protein: 0.5, carbs: 2, fat: 7, pkg: { price: 2.29, grams: 400, label: '$2.29/13.5 oz can' }, liquid: true },
  dark_chocolate: { name: 'Dark chocolate (70%)', kcal: 598, protein: 7.8, carbs: 46, fat: 43, pkg: { price: 3.49, grams: 100, label: '$3.49/3.5 oz bar' } },
} satisfies Record<string, Ingredient>;

export const INGREDIENTS: Record<IngredientId, Ingredient> = RAW;

/** Price in USD for a given weight of an ingredient. */
export function priceFor(id: IngredientId, grams: number): number {
  const ing = INGREDIENTS[id];
  return (ing.pkg.price / ing.pkg.grams) * grams;
}

/** Flat per-serving allowance for salt, pepper, spices, garlic and cooking spray. */
export const PANTRY_COST_PER_SERVING = 0.15;
