import { INGREDIENTS, type IngredientId } from '@/data/ingredients';
import { PREP_INFO, type PrepInfo } from '@/data/meal-prep';
import { RECIPES } from '@/data/recipes';
import { shelfOf } from '@/data/shelf-life';
import { dayTotals, groceryList, type DayTotals, type GroceryItem, type MealPlan, type PlannedMeal } from '@/lib/meal-plan';

/**
 * Turns a meal plan (a recommended pick + swaps per meal) into a Monday-Sunday week
 * that lines up with the workout calendar, and works out what to cook in advance.
 *
 * Each meal slot has a rotation of up to ROTATION recipes: the main recipe A first,
 * then alternates. Per slot:
 *  - A freezes well (chili, curry, soup…): one Sunday batch covers all 7 days;
 *    Mon-Thu from the fridge, Fri-Sun from the freezer.
 *  - A is a meal-prep recipe: a Sunday batch covers the days it keeps in the fridge
 *    (usually Mon-Thu). The rest of the week is a second batch (if the next recipe is
 *    also meal-prep) or a different fresh-cooked recipe each day.
 *  - A is cooked fresh: the rotation cycles day by day (A, B, C, D, A, B, C), so
 *    non-prepped meals change every day.
 */

/** Distinct recipes a slot rotates through in a week. */
export const ROTATION = 4;

export const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const;
export type Weekday = (typeof WEEKDAYS)[number];

/** Option indices a slot rotates through this week; [0] is the main recipe. */
export type SlotChoice = number[];

export type WeekEntry = {
  meal: PlannedMeal;
  /** Index into the slot's options. */
  option: number;
  /** Position in the slot's rotation (0 = main recipe). */
  pick: number;
  source: 'fresh' | 'fridge' | 'freezer';
  /** For batch-cooked meals: the day the batch is made. */
  cookDay?: Weekday;
};

export type Batch = {
  slotLabel: string;
  meal: PlannedMeal;
  cookDay: Weekday;
  portions: number;
  frozen: number;
  /** e.g. "Mon-Thu". */
  covers: string;
  info: PrepInfo;
};

export type PrepStep = { day: Weekday | 'Nightly'; icon: string; title: string; detail: string };

export type WeekDayPlan = {
  weekday: Weekday;
  /** One entry per meal slot; undefined when no recipe fits the user's restrictions. */
  meals: (WeekEntry | undefined)[];
  totals: DayTotals;
};

export type WeekPlan = {
  days: WeekDayPlan[];
  batches: Batch[];
  prep: PrepStep[];
  cost: number;
  avgCostPerMeal: number;
  groceries: GroceryItem[];
  checkout: number;
};

const SHORT = (d: Weekday) => d.slice(0, 3);
const round2 = (n: number) => Math.round(n * 100) / 100;

function range(from: number, to: number): string {
  return from === to ? SHORT(WEEKDAYS[from]) : `${SHORT(WEEKDAYS[from])}-${SHORT(WEEKDAYS[to])}`;
}

function prepInfo(meal: PlannedMeal | undefined): PrepInfo | undefined {
  return meal && meal.tags.includes('meal_prep') ? PREP_INFO[meal.recipeId] : undefined;
}

// ─── Scheduling ─────────────────────────────────────────────────────────────

type SlotSchedule = { entries: (WeekEntry | undefined)[]; batches: Omit<Batch, 'slotLabel'>[] };

/** Valid, de-duplicated rotation for a slot; falls back to the top option. */
function cleanRotation(options: PlannedMeal[], choice: SlotChoice | undefined): number[] {
  const out = [...new Set((choice ?? []).filter((i) => i >= 0 && i < options.length))];
  return out.length ? out : [0];
}

function scheduleSlot(options: PlannedMeal[], choice: SlotChoice | undefined): SlotSchedule {
  if (!options.length) return { entries: WEEKDAYS.map(() => undefined), batches: [] };
  const rot = cleanRotation(options, choice);
  const A = options[rot[0]];
  const infoA = prepInfo(A);

  const entry = (pick: number, source: WeekEntry['source'], cookDay?: Weekday): WeekEntry => ({
    meal: options[rot[pick]],
    option: rot[pick],
    pick,
    source,
    cookDay,
  });

  // Freezer-friendly: one Sunday pot for the whole week.
  if (infoA?.freezer) {
    const fridge = Math.min(4, infoA.fridgeDays);
    return {
      entries: WEEKDAYS.map((_, i) => entry(0, i < fridge ? 'fridge' : 'freezer', 'Sunday')),
      batches: [{ meal: A, cookDay: 'Sunday', portions: 7, frozen: 7 - fridge, covers: range(0, 6), info: infoA }],
    };
  }

  // Meal-prep: Sunday batch while it keeps, then a second batch or daily fresh variety.
  if (infoA) {
    const n = Math.min(4, infoA.fridgeDays);
    const cookDay2 = WEEKDAYS[n - 1];
    const batches: SlotSchedule['batches'] = [
      { meal: A, cookDay: 'Sunday', portions: n, frozen: 0, covers: range(0, n - 1), info: infoA },
    ];
    const secondPick = rot.length > 1 ? 1 : 0;
    const infoB = prepInfo(options[rot[secondPick]]);
    if (infoB) {
      batches.push({ meal: options[rot[secondPick]], cookDay: cookDay2, portions: 7 - n, frozen: 0, covers: range(n, 6), info: infoB });
    }
    return {
      entries: WEEKDAYS.map((_, i) => {
        if (i < n) return entry(0, 'fridge', 'Sunday');
        if (infoB) return entry(secondPick, 'fridge', cookDay2);
        // Rest of the week cooked fresh: rotate through the alternates, a different meal each day.
        return entry(1 + ((i - n) % (rot.length - 1)), 'fresh');
      }),
      batches,
    };
  }

  // Cooked fresh: a different recipe each day through the rotation.
  return { entries: WEEKDAYS.map((_, i) => entry(i % rot.length, 'fresh')), batches: [] };
}

/** Default week: each slot rotates through its top recipes, kept within a weekly budget. */
export function defaultChoices(plan: MealPlan): SlotChoice[] {
  // Cheapest mode (or a budget even the cheapest menu can't meet): no pricier alternates.
  const minimize = plan.budget?.mode === 'cheapest' || !!plan.budget?.overBudget;
  const choices: SlotChoice[] = plan.slots.map((s) =>
    minimize ? [0] : Array.from({ length: Math.min(ROTATION, s.options.length) }, (_, i) => i)
  );
  const limit = plan.budget?.mode === 'weekly' ? plan.budget.weeklyLimit : undefined;
  if (!limit) return choices;

  // Alternates each fit the budget on their own; if together they push the week over,
  // drop the alternates that save the most until the week fits.
  for (let guard = 0; guard < ROTATION * choices.length; guard++) {
    const cost = buildWeek(plan, choices).cost;
    if (cost <= limit + 0.005) break;
    let best = null as [number, number] | null;
    let saving = 0;
    choices.forEach((rot, si) => {
      for (let p = 1; p < rot.length; p++) {
        const trial = choices.map((r, j) => (j === si ? r.filter((_, k) => k !== p) : r));
        const sv = cost - buildWeek(plan, trial).cost;
        if (sv > saving) {
          saving = sv;
          best = [si, p];
        }
      }
    });
    if (!best) break;
    const [si, p] = best;
    choices[si] = choices[si].filter((_, k) => k !== p);
  }
  return choices;
}

// ─── Advance prep beyond batch cooking ─────────────────────────────────────

const GRAINS: IngredientId[] = ['white_rice', 'brown_rice', 'jasmine_rice', 'quinoa'];
const CHOP: IngredientId[] = ['bell_pepper', 'onion'];
const THAW: IngredientId[] = ['salmon', 'cod', 'shrimp'];

function recipeIngredients(meal: PlannedMeal) {
  const recipe = RECIPES.find((r) => r.id === meal.recipeId);
  return (recipe?.ingredients ?? []).map((i) => ({ ...i, g: i.g * meal.servings }));
}

function amount(id: IngredientId, grams: number): string {
  const ing = INGREDIENTS[id];
  if (ing.unit) {
    const n = Math.ceil(grams / ing.unit.grams);
    return `${n} ${n === 1 ? ing.unit.name : ing.unit.plural}`;
  }
  return `${Math.round(grams / 10) * 10} g`;
}

function freshPrep(days: WeekDayPlan[]): PrepStep[] {
  const steps: PrepStep[] = [];
  const fresh = days.flatMap((d, di) => d.meals.filter((m): m is WeekEntry => !!m && m.source === 'fresh').map((m) => ({ m, di })));

  // Grains: cook once, reheat all week.
  const grains = new Map<IngredientId, { g: number; meals: number }>();
  for (const { m } of fresh) {
    for (const { id, g } of recipeIngredients(m.meal)) {
      if (!GRAINS.includes(id)) continue;
      const cur = grains.get(id) ?? { g: 0, meals: 0 };
      grains.set(id, { g: cur.g + g, meals: cur.meals + 1 });
    }
  }
  const grainList = [...grains.entries()].filter(([, v]) => v.meals >= 2);
  if (grainList.length) {
    const what = grainList.map(([id, v]) => `${amount(id, v.g)} dry ${INGREDIENTS[id].name.replace(/ \(dry\)/, '').toLowerCase()}`).join(' and ');
    const meals = grainList.reduce((s, [, v]) => s + v.meals, 0);
    steps.push({
      day: 'Sunday',
      icon: '🍚',
      title: 'Cook grains for the week',
      detail: `Make ${what} in one go; it covers ${meals} cooked-to-order meals. Cool quickly, refrigerate within an hour and use within 4-5 days (cook a second pot Thursday if needed).`,
    });
  }

  // Hard-boiled eggs.
  let eggs = 0;
  for (const { m } of fresh) {
    for (const ing of m.meal.ingredients) if (/hard-boiled/i.test(ing.note ?? '')) eggs += Math.round(ing.grams / 50);
  }
  if (eggs >= 2) {
    steps.push({
      day: 'Sunday',
      icon: '🥚',
      title: `Hard-boil ${eggs} eggs`,
      detail: '10 minutes in boiling water, then an ice bath. Unpeeled eggs keep 7 days in the fridge.',
    });
  }

  // Chopped vegetables.
  const chop = new Map<IngredientId, number>();
  for (const { m } of fresh) {
    for (const { id, g } of recipeIngredients(m.meal)) if (CHOP.includes(id)) chop.set(id, (chop.get(id) ?? 0) + g);
  }
  if ([...chop.values()].reduce((a, b) => a + b, 0) >= 200) {
    const what = [...chop.entries()].map(([id, g]) => (id === 'onion' ? `${amount(id, g)} onion` : amount(id, g))).join(' and ');
    steps.push({
      day: 'Sunday',
      icon: '🔪',
      title: 'Chop vegetables',
      detail: `Dice ${what} for this week's fresh meals and store in airtight containers (keeps 4-5 days). Saves 5-10 minutes every night.`,
    });
  }

  // Thaw frozen seafood the night before.
  const thawDays = new Set<number>();
  for (const { m, di } of fresh) if (recipeIngredients(m.meal).some(({ id }) => THAW.includes(id))) thawDays.add(di);
  if (thawDays.size) {
    const list = [...thawDays].sort((a, b) => a - b).map((i) => SHORT(WEEKDAYS[(i + 6) % 7]));
    steps.push({
      day: 'Nightly',
      icon: '🧊',
      title: 'Thaw tomorrow’s fish',
      detail: `Move frozen fish or shrimp from the freezer to the fridge the night before (${list.join(', ')}).`,
    });
  }
  return steps;
}

// ─── Public entry point ─────────────────────────────────────────────────────

export function buildWeek(plan: MealPlan, choices: SlotChoice[]): WeekPlan {
  const schedules = plan.slots.map((slot, i) => scheduleSlot(slot.options, choices[i]));

  const days: WeekDayPlan[] = WEEKDAYS.map((weekday, di) => {
    const meals = schedules.map((s) => s.entries[di]);
    return { weekday, meals, totals: dayTotals(meals.filter((m): m is WeekEntry => !!m).map((m) => m.meal)) };
  });

  const batches: Batch[] = schedules.flatMap((s, i) => s.batches.map((b) => ({ ...b, slotLabel: plan.slots[i].label })));

  const order = (d: PrepStep['day']) => (d === 'Sunday' ? -1 : d === 'Nightly' ? 99 : WEEKDAYS.indexOf(d));
  const prep: PrepStep[] = [
    ...batches.map((b) => ({
      day: b.cookDay,
      icon: b.info.freezer ? '❄️' : '🥡',
      title: `${b.meal.name} × ${b.portions}`,
      detail:
        `${b.slotLabel} for ${b.covers}. ` +
        (b.frozen > 0
          ? `Refrigerate ${b.portions - b.frozen}, freeze ${b.frozen}, and move one to the fridge the night before. `
          : `Keeps ${b.info.fridgeDays} days in the fridge. `) +
        b.info.tip,
    })),
    ...freshPrep(days),
  ].sort((x, y) => order(x.day) - order(y.day));

  const all = days.flatMap((d) => d.meals.filter((m): m is WeekEntry => !!m).map((m) => m.meal));
  const cost = round2(all.reduce((s, m) => s + m.cost, 0));
  const groceries = groceryList(all, 1);

  return {
    days,
    batches,
    prep,
    cost,
    avgCostPerMeal: round2(cost / Math.max(1, all.length)),
    groceries,
    checkout: round2(groceries.reduce((s, g) => s + g.checkoutCost, 0)),
  };
}

/** The default week for a plan (no swaps applied). */
export function defaultWeek(plan: MealPlan): WeekPlan {
  return buildWeek(plan, defaultChoices(plan));
}

// ─── Multi-week plans (up to a month) ───────────────────────────────────────

export const PLAN_LENGTHS = [1, 2, 4] as const;
export type PlanLength = (typeof PLAN_LENGTHS)[number];

/**
 * The rotation for week `w`: each slot's recipes shift by one position per week, so
 * week 2 leads with what was the alternate in week 1 (a different Sunday batch, a
 * different first fresh meal) while keeping the same set of recipes and budget.
 */
export function rotateChoices(choices: SlotChoice[], w: number): SlotChoice[] {
  return choices.map((rot) => (rot.length > 1 ? rot.map((_, k) => rot[(k + w) % rot.length]) : rot));
}

/** Maps a rotation position seen in week `w` back to the position in the base choices. */
export function basePick(choices: SlotChoice[], slotIndex: number, w: number, pick: number): number {
  const len = choices[slotIndex]?.length || 1;
  return (pick + w) % len;
}

/** One WeekPlan per week. Weeks that would break a weekly budget fall back to week 1's order. */
export function buildPlanWeeks(plan: MealPlan, choices: SlotChoice[], weeks: number): WeekPlan[] {
  const base = buildWeek(plan, choices);
  const limit = plan.budget?.mode === 'weekly' ? plan.budget.weeklyLimit : undefined;
  return Array.from({ length: Math.max(1, weeks) }, (_, w) => {
    if (w === 0) return base;
    const week = buildWeek(plan, rotateChoices(choices, w));
    return limit && week.cost > limit + 0.005 && week.cost > base.cost ? base : week;
  });
}

function weekMeals(week: WeekPlan): PlannedMeal[] {
  return week.days.flatMap((d) => d.meals.filter((m): m is WeekEntry => !!m).map((m) => m.meal));
}

export type SplitGroceries = {
  /** Fresh items (produce, meat, dairy, bread), one list per week. */
  weekly: { items: GroceryItem[]; checkout: number }[];
  /** Pantry and freezer items, bought once for the whole plan. */
  stock: { items: GroceryItem[]; checkout: number };
};

/** Splits shopping into a fresh list per week and one pantry/freezer list for the whole plan. */
export function splitGroceries(weeks: WeekPlan[]): SplitGroceries {
  const total = (items: GroceryItem[]) => round2(items.reduce((s, g) => s + g.checkoutCost, 0));
  const weekly = weeks.map((w) => {
    const items = groceryList(weekMeals(w), 1).filter((g) => shelfOf(g.id) === 'fresh');
    return { items, checkout: total(items) };
  });
  const stockItems = groceryList(weeks.flatMap(weekMeals), 1)
    .filter((g) => shelfOf(g.id) !== 'fresh')
    .sort((a, b) => (shelfOf(a.id) === shelfOf(b.id) ? b.checkoutCost - a.checkoutCost : shelfOf(a.id) === 'pantry' ? -1 : 1));
  return { weekly, stock: { items: stockItems, checkout: total(stockItems) } };
}
