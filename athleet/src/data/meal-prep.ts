/**
 * Batch-cooking notes for the recipes tagged `meal_prep`.
 *
 * `fridgeDays` is how long cooked portions keep in the fridge (USDA: 3-4 days for
 * most cooked leftovers). `freezer` recipes reheat well from frozen, so one Sunday
 * batch can cover the whole week.
 */
export type PrepInfo = {
  fridgeDays: number;
  freezer?: boolean;
  /** Recipe-specific advice for cooking it in advance. */
  tip: string;
};

export const PREP_INFO: Record<string, PrepInfo> = {
  // Breakfast
  'protein-overnight-oats': {
    fridgeDays: 4,
    tip: 'Line up the jars and fill them assembly-line style. Add the berries frozen; they thaw overnight.',
  },
  'turkey-breakfast-burrito': {
    fridgeDays: 4,
    freezer: true,
    tip: 'Let the filling cool before rolling, wrap each burrito in foil, and freeze. Microwave 2 minutes from frozen.',
  },
  'tofu-scramble-potatoes': {
    fridgeDays: 4,
    tip: 'Keep the salsa separate and add it after reheating so the potatoes stay crisp.',
  },
  'vegan-chia-pudding': {
    fridgeDays: 4,
    tip: 'Stir each jar again after 10 minutes so the chia does not clump. Add pumpkin seeds the morning you eat it.',
  },
  'apple-cinnamon-quinoa': {
    fridgeDays: 4,
    freezer: true,
    tip: 'Reheat with a splash of water or soy milk; it thickens in the fridge.',
  },

  // Lunch
  'chicken-rice-bowl': {
    fridgeDays: 4,
    tip: 'Cook all the rice in one pot and slightly undercook the broccoli so it does not go soggy when reheated.',
  },
  'tuna-chickpea-salad': {
    fridgeDays: 3,
    tip: 'Mix everything except the dressing; add oil and lemon the day you eat it to keep the cucumber crunchy.',
  },
  'turkey-chili': {
    fridgeDays: 4,
    freezer: true,
    tip: 'One pot makes lunch for the whole week. Freeze extra portions flat in zip bags and thaw one in the fridge the night before.',
  },
  'tofu-quinoa-bowl': {
    fridgeDays: 4,
    tip: 'Bake the tofu instead of pan-frying when batch cooking: 400°F (200°C) for 25 minutes, flipping once.',
  },
  'jerk-chicken-rice-peas': {
    fridgeDays: 4,
    freezer: true,
    tip: 'Marinate the thighs in jerk paste Saturday night for the best flavor, then cook everything Sunday.',
  },
  'chickpea-quinoa-salad': {
    fridgeDays: 4,
    tip: 'Holds up better than leafy salads. Keep the pumpkin seeds in a separate bag so they stay crunchy.',
  },
  'tempeh-burrito-bowl': {
    fridgeDays: 4,
    tip: 'Pack avocado and salsa separately and add after reheating.',
  },
  'chicken-sweet-potato-bowl': {
    fridgeDays: 4,
    tip: 'Use two sheet pans so nothing steams. Everything roasts at once in about 25 minutes.',
  },
  'lentil-veggie-soup': {
    fridgeDays: 4,
    freezer: true,
    tip: 'Freezes perfectly. Portion into containers, leave a little room on top for expansion.',
  },

  'beef-taco-bowl': {
    fridgeDays: 4,
    tip: 'Brown all the beef at once with taco seasoning. Pack lettuce and salsa separately so they stay fresh.',
  },
  'honey-soy-pork-bowl': {
    fridgeDays: 4,
    tip: 'Roast two tenderloins side by side, rest 10 minutes, then slice. Undercook the green beans slightly.',
  },
  'greek-chicken-gyro-bowl': {
    fridgeDays: 4,
    tip: 'Marinate the thighs in lemon, garlic and oregano overnight. Keep tzatziki and cucumber in a separate container.',
  },

  // Dinner
  'turkey-pasta-bolognese': {
    fridgeDays: 4,
    freezer: true,
    tip: 'Freeze the sauce, not the pasta. Boil fresh pasta in 10 minutes the night you eat it.',
  },
  'lentil-coconut-curry': {
    fridgeDays: 4,
    freezer: true,
    tip: 'Tastes better on day two. Freeze curry and rice in the same container for grab-and-go dinners.',
  },
  'chicken-fajita-bowl': {
    fridgeDays: 4,
    tip: 'Slice the chicken and peppers the same size so everything cooks in one pan in 12 minutes.',
  },
  'chicken-quinoa-zucchini': {
    fridgeDays: 4,
    tip: 'Thighs stay juicy when reheated, unlike breast. Add the lemon after reheating.',
  },

  // Snacks
  'chicken-salad-rice-cakes': {
    fridgeDays: 4,
    tip: 'Make the chicken salad for the week in one bowl; spread it on rice cakes just before eating so they stay crisp.',
  },
  'hummus-veggie-box': {
    fridgeDays: 4,
    tip: 'Hard-boil all the eggs at once and pack the boxes for the week in 10 minutes.',
  },
};
