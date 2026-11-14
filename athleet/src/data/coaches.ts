import type { Coach } from '@/lib/types';

// Coach roster. Training details are based on publicly reported routines.
export const COACHES: Coach[] = [
  {
    "id": "lebron",
    "name": "LeBron James",
    "sport": "basketball",
    "category": "Basketball",
    "trainingTypes": [
      "athletic",
      "strength",
      "conditioning",
      "mobility"
    ],
    "goals": [
      "sport_performance",
      "general_fitness",
      "lose_fat",
      "build_muscle"
    ],
    "levels": [
      "beginner",
      "intermediate",
      "advanced"
    ],
    "ageFit": [
      13,
      75
    ],
    "intensity": 4,
    "tagline": "Train for the long game.",
    "bio": "Built for longevity: strength, conditioning and recovery so you can keep hooping for decades.",
    "bestFor": [
      "basketball skills",
      "athleticism",
      "older athletes",
      "longevity"
    ],
    "signature": {
      "split": "3 strength days + 2-3 conditioning/court days",
      "staples": [
        "inverted row",
        "landmine rotational press",
        "walking lunge",
        "back squat",
        "incline dumbbell press",
        "V-up",
        "medicine ball rotational throw"
      ],
      "methods": [
        "long 20-30 min warm-up",
        "supersets",
        "HIIT conditioning",
        "finish with yoga/mobility"
      ],
      "recovery": [
        "sleep first",
        "mobility and yoga",
        "deload when legs feel heavy"
      ]
    },
    "avatar": "lebron.png"
  },
  {
    "id": "ronnie",
    "name": "Ronnie Coleman",
    "sport": "bodybuilding",
    "category": "Bodybuilding",
    "trainingTypes": [
      "hypertrophy",
      "strength"
    ],
    "goals": [
      "build_muscle",
      "bulk",
      "get_stronger"
    ],
    "levels": [
      "beginner",
      "intermediate",
      "advanced"
    ],
    "ageFit": [
      16,
      70
    ],
    "intensity": 5,
    "tagline": "Heavy weight, high volume, no excuses.",
    "bio": "Old-school mass building: big compound lifts, lots of volume, and relentless consistency.",
    "bestFor": [
      "building mass",
      "bulking",
      "classic bodybuilding"
    ],
    "signature": {
      "split": "push/pull/legs style, each muscle twice per week (scaled to available days)",
      "staples": [
        "barbell back squat",
        "deadlift",
        "barbell row",
        "T-bar row",
        "bench press",
        "incline dumbbell press",
        "leg press",
        "barbell curl",
        "close-grip bench press"
      ],
      "methods": [
        "heavy compounds first",
        "high volume accessories",
        "progressive overload",
        "rest-pause sets (advanced only)"
      ],
      "recovery": [
        "eat big",
        "sleep 8 hours",
        "one full rest day"
      ]
    },
    "avatar": "ronnie.png"
  },
  {
    "id": "bolt",
    "name": "Usain Bolt",
    "sport": "track",
    "category": "Track & Speed",
    "trainingTypes": [
      "athletic",
      "conditioning",
      "mobility"
    ],
    "goals": [
      "sport_performance",
      "lose_fat",
      "general_fitness"
    ],
    "levels": [
      "beginner",
      "intermediate",
      "advanced"
    ],
    "ageFit": [
      12,
      65
    ],
    "intensity": 4,
    "tagline": "Fast is a skill. Let's practice it.",
    "bio": "Explosive power, sprint mechanics and daily core work. Quality reps over grinding.",
    "bestFor": [
      "speed",
      "explosiveness",
      "vertical jump",
      "athletic fat loss"
    ],
    "signature": {
      "split": "2-3 speed/plyo days + 2 gym power days + daily core",
      "staples": [
        "box jump",
        "medicine ball slam",
        "good morning",
        "barbell lunge",
        "bounding",
        "bunny hops",
        "cable knee drive",
        "hanging leg raise",
        "sled push"
      ],
      "methods": [
        "sprint phases: starts, acceleration, top speed, deceleration",
        "plyometrics",
        "core every day",
        "full rest between sprints"
      ],
      "recovery": [
        "stretch hamstrings and hips",
        "keep it fun",
        "never sprint tired"
      ]
    },
    "avatar": "bolt.png"
  },
  {
    "id": "ronaldo",
    "name": "Cristiano Ronaldo",
    "sport": "soccer",
    "category": "Soccer",
    "trainingTypes": [
      "athletic",
      "conditioning",
      "hypertrophy"
    ],
    "goals": [
      "sport_performance",
      "lose_fat",
      "cut",
      "build_muscle",
      "general_fitness"
    ],
    "levels": [
      "beginner",
      "intermediate",
      "advanced"
    ],
    "ageFit": [
      12,
      70
    ],
    "intensity": 5,
    "tagline": "Discipline every day. Mix it up.",
    "bio": "Lean, fast and durable: circuits, sprints, power work and a strict clean diet.",
    "bestFor": [
      "soccer fitness",
      "getting lean",
      "discipline",
      "conditioning"
    ],
    "signature": {
      "split": "5 training days: circuits, power + sprints, legs/core, cardio; 1-2 rest days",
      "staples": [
        "power clean",
        "200m sprint",
        "resistance sprint",
        "jump rope",
        "single-leg Romanian deadlift",
        "Bulgarian split squat",
        "plank variations",
        "push-up"
      ],
      "methods": [
        "full-body circuits",
        "HIIT",
        "mix cardio and weights",
        "short daily ab work at home"
      ],
      "recovery": [
        "8 hours sleep",
        "high-protein Mediterranean eating",
        "avoid sugary foods"
      ]
    },
    "avatar": "ronaldo.png"
  },
  {
    "id": "serena",
    "name": "Serena Williams",
    "sport": "tennis",
    "category": "Tennis",
    "trainingTypes": [
      "athletic",
      "strength",
      "mobility",
      "conditioning"
    ],
    "goals": [
      "sport_performance",
      "get_stronger",
      "lose_fat",
      "general_fitness"
    ],
    "levels": [
      "beginner",
      "intermediate",
      "advanced"
    ],
    "ageFit": [
      12,
      75
    ],
    "intensity": 4,
    "tagline": "Power you can repeat for three sets.",
    "bio": "Lower-body and rotational power, agility, and joint care that keeps you on court.",
    "bestFor": [
      "tennis/racket sports",
      "lower-body power",
      "joint health",
      "women new to strength"
    ],
    "signature": {
      "split": "2-3 strength days + 2 agility/cardio days",
      "staples": [
        "barbell pause squat",
        "front squat",
        "box squat",
        "dumbbell walking lunge",
        "dumbbell step-up",
        "plank row",
        "cable rotational chop",
        "bicycle crunch",
        "agility ladder"
      ],
      "methods": [
        "10-minute fun cardio warm-up (dance, bike, swim)",
        "3-5 sets of 8-12",
        "agility work",
        "shoulder and knee pre-hab"
      ],
      "recovery": [
        "stretching and foam rolling",
        "variety to avoid burnout"
      ]
    },
    "avatar": "serena.png"
  },
  {
    "id": "callina",
    "name": "Callina Liang",
    "sport": "martial_arts",
    "category": "Martial Arts & Legs",
    "trainingTypes": [
      "hypertrophy",
      "athletic",
      "mobility"
    ],
    "goals": [
      "build_muscle",
      "general_fitness",
      "sport_performance"
    ],
    "levels": [
      "beginner",
      "intermediate"
    ],
    "ageFit": [
      15,
      55
    ],
    "intensity": 3,
    "tagline": "From cardio girl to strength girl.",
    "bio": "Leg-focused strength plus kicking and striking skills. Great if you're new to lifting.",
    "bestFor": [
      "leg and glute strength",
      "martial arts basics",
      "beginners switching from cardio"
    ],
    "signature": {
      "split": "3 leg-focused lifting days + 2 martial arts skill days",
      "staples": [
        "goblet squat",
        "back squat",
        "hip thrust",
        "Bulgarian split squat",
        "Romanian deadlift",
        "leg press",
        "roundhouse kick drills",
        "shadowboxing",
        "Pilates core"
      ],
      "methods": [
        "progressive leg training",
        "kick technique and flexibility",
        "short skill circuits"
      ],
      "recovery": [
        "hip and hamstring flexibility",
        "eat enough protein"
      ]
    },
    "avatar": "callina.png"
  },
  {
    "id": "patty",
    "name": "Lean Beef Patty",
    "sport": "fitness",
    "category": "Gym & Physique",
    "trainingTypes": [
      "hypertrophy",
      "strength",
      "conditioning"
    ],
    "goals": [
      "build_muscle",
      "lose_fat",
      "cut",
      "general_fitness"
    ],
    "levels": [
      "beginner",
      "intermediate",
      "advanced"
    ],
    "ageFit": [
      16,
      60
    ],
    "intensity": 4,
    "tagline": "Simple, hard, consistent.",
    "bio": "Relatable gym training: straightforward lifts pushed close to failure, plus quick HIIT.",
    "bestFor": [
      "general gym-goers",
      "glutes and back",
      "getting lean and strong"
    ],
    "signature": {
      "split": "upper/lower or push/pull/legs, 4-5 days",
      "staples": [
        "hip thrust",
        "Romanian deadlift",
        "pull-up",
        "lat pulldown",
        "bench press",
        "dumbbell shoulder press",
        "leg press",
        "jump rope"
      ],
      "methods": [
        "train close to failure",
        "straightforward progression",
        "HIIT circuits",
        "stretch and foam roll after"
      ],
      "recovery": [
        "consistency over perfection",
        "foam rolling"
      ]
    },
    "avatar": "patty.png"
  }
];

export function getCoach(id: string): Coach | undefined {
  return COACHES.find((c) => c.id === id);
}
