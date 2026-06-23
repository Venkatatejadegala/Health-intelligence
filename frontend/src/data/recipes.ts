// Recipe structure
export interface Recipe {
  id: string;
  name: string;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  baseCalories: number;
  baseProtein: number;
  baseCarbs: number;
  baseFat: number;
  baseFiber: number;
  prepTime: string;
  diets: string[]; // 'vegan', 'vegetarian', 'keto', 'paleo', 'mediterranean', 'low-carb'
  ingredients: { name: string; baseQty: number; unit: string }[];
  instructions: string[];
}

export interface GeneratedMeal {
  id: string;
  name: string;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  prepTime: string;
  ingredients: { name: string; qty: number; unit: string }[];
  instructions: string[];
  description?: string;
}

export const RECIPE_DATABASE: Recipe[] = [
  // --- BREAKFASTS ---
  {
    id: 'b-omelette',
    name: 'Avocado & Spinach Cheese Omelette',
    mealType: 'breakfast',
    baseCalories: 380,
    baseProtein: 24,
    baseCarbs: 5,
    baseFat: 28,
    baseFiber: 4,
    prepTime: '10 mins',
    diets: ['keto', 'vegetarian', 'low-carb'],
    ingredients: [
      { name: 'Large Eggs', baseQty: 3, unit: 'pcs' },
      { name: 'Fresh Spinach', baseQty: 50, unit: 'g' },
      { name: 'Avocado', baseQty: 0.5, unit: 'pcs' },
      { name: 'Cheddar Cheese', baseQty: 25, unit: 'g' },
      { name: 'Olive Oil', baseQty: 1, unit: 'tsp' }
    ],
    instructions: [
      'Whisk eggs in a bowl with a pinch of salt and pepper.',
      'Heat olive oil in a non-stick pan over medium heat and sauté spinach until wilted.',
      'Pour in the whisked eggs and let cook for 2-3 minutes until edges set.',
      'Add grated cheddar cheese and sliced avocado on one side.',
      'Fold the omelette in half, cook for 1 more minute until cheese melts, and serve.'
    ]
  },
  {
    id: 'b-oatmeal',
    name: 'Peanut Butter Banana Oatmeal',
    mealType: 'breakfast',
    baseCalories: 420,
    baseProtein: 13,
    baseCarbs: 65,
    baseFat: 14,
    baseFiber: 9,
    prepTime: '8 mins',
    diets: ['vegan', 'vegetarian', 'mediterranean'],
    ingredients: [
      { name: 'Rolled Oats', baseQty: 60, unit: 'g' },
      { name: 'Almond Milk', baseQty: 200, unit: 'ml' },
      { name: 'Banana', baseQty: 1, unit: 'pcs' },
      { name: 'Peanut Butter', baseQty: 1, unit: 'tbsp' },
      { name: 'Chia Seeds', baseQty: 1, unit: 'tsp' }
    ],
    instructions: [
      'In a small saucepan, combine oats and almond milk.',
      'Bring to a gentle boil, then simmer for 5 minutes, stirring frequently until creamy.',
      'Pour oatmeal into a serving bowl.',
      'Top with sliced banana, a drizzle of peanut butter, and chia seeds.'
    ]
  },
  {
    id: 'b-salmon-scramble',
    name: 'Scrambled Eggs with Smoked Salmon',
    mealType: 'breakfast',
    baseCalories: 330,
    baseProtein: 28,
    baseCarbs: 2,
    baseFat: 24,
    baseFiber: 0,
    prepTime: '10 mins',
    diets: ['keto', 'paleo', 'low-carb', 'mediterranean'],
    ingredients: [
      { name: 'Large Eggs', baseQty: 3, unit: 'pcs' },
      { name: 'Smoked Salmon', baseQty: 75, unit: 'g' },
      { name: 'Chives', baseQty: 1, unit: 'tbsp' },
      { name: 'Ghee or Grass-Fed Butter', baseQty: 1, unit: 'tsp' }
    ],
    instructions: [
      'Crack eggs into a bowl and whisk lightly.',
      'Chop smoked salmon into bite-sized pieces and finely mince the chives.',
      'Melt ghee/butter in a pan over low heat.',
      'Pour in eggs and stir constantly with a spatula for soft curds.',
      'Just before eggs are fully set, fold in smoked salmon and chives. Serve immediately.'
    ]
  },
  {
    id: 'b-yogurt',
    name: 'Greek Yogurt & Mixed Berry Parfait',
    mealType: 'breakfast',
    baseCalories: 280,
    baseProtein: 22,
    baseCarbs: 32,
    baseFat: 4,
    baseFiber: 5,
    prepTime: '5 mins',
    diets: ['vegetarian', 'mediterranean', 'low-carb'],
    ingredients: [
      { name: 'Non-Fat Greek Yogurt', baseQty: 200, unit: 'g' },
      { name: 'Mixed Berries (Blueberries, Strawberries)', baseQty: 100, unit: 'g' },
      { name: 'Honey', baseQty: 1, unit: 'tsp' },
      { name: 'Walnuts', baseQty: 15, unit: 'g' }
    ],
    instructions: [
      'Spoon half of the Greek yogurt into a bowl or jar.',
      'Add a layer of mixed berries and crushed walnuts.',
      'Spoon remaining yogurt on top, finish with remaining berries and walnuts.',
      'Drizzle honey over the top and enjoy.'
    ]
  },
  
  // --- LUNCHES ---
  {
    id: 'l-chicken-caesar',
    name: 'Grilled Chicken Caesar Salad',
    mealType: 'lunch',
    baseCalories: 510,
    baseProtein: 42,
    baseCarbs: 10,
    baseFat: 32,
    baseFiber: 3,
    prepTime: '15 mins',
    diets: ['keto', 'paleo', 'low-carb'],
    ingredients: [
      { name: 'Chicken Breast', baseQty: 150, unit: 'g' },
      { name: 'Romaine Lettuce', baseQty: 150, unit: 'g' },
      { name: 'Caesar Dressing (Olive-Oil based)', baseQty: 2, unit: 'tbsp' },
      { name: 'Parmesan Cheese', baseQty: 15, unit: 'g' },
      { name: 'Olive Oil', baseQty: 1, unit: 'tsp' }
    ],
    instructions: [
      'Season chicken breast with salt, pepper, and garlic powder.',
      'Heat olive oil in a skillet over medium-high heat and cook chicken for 6-7 minutes per side until done.',
      'Chop romaine lettuce and place in a large salad bowl.',
      'Slice the cooked chicken breast.',
      'Toss lettuce with Caesar dressing, top with chicken slices, and sprinkle with grated Parmesan.'
    ]
  },
  {
    id: 'l-quinoa-salad',
    name: 'Mediterranean Chickpea Quinoa Salad',
    mealType: 'lunch',
    baseCalories: 480,
    baseProtein: 15,
    baseCarbs: 68,
    baseFat: 16,
    baseFiber: 12,
    prepTime: '12 mins',
    diets: ['vegan', 'vegetarian', 'mediterranean'],
    ingredients: [
      { name: 'Cooked Quinoa', baseQty: 120, unit: 'g' },
      { name: 'Canned Chickpeas (Rinsed)', baseQty: 100, unit: 'g' },
      { name: 'Cucumber', baseQty: 0.5, unit: 'pcs' },
      { name: 'Cherry Tomatoes', baseQty: 80, unit: 'g' },
      { name: 'Extra Virgin Olive Oil', baseQty: 1, unit: 'tbsp' },
      { name: 'Lemon Juice', baseQty: 1, unit: 'tbsp' }
    ],
    instructions: [
      'In a large mixing bowl, combine cooked quinoa and chickpeas.',
      'Dice the cucumber and halve the cherry tomatoes, then add to the bowl.',
      'Drizzle with extra virgin olive oil and fresh lemon juice.',
      'Season with salt, pepper, and dried oregano. Toss well to combine and serve cold.'
    ]
  },
  {
    id: 'l-tuna-wrap',
    name: 'Avocado Tuna Lettuce Wraps',
    mealType: 'lunch',
    baseCalories: 390,
    baseProtein: 34,
    baseCarbs: 8,
    baseFat: 25,
    baseFiber: 5,
    prepTime: '10 mins',
    diets: ['keto', 'paleo', 'low-carb', 'mediterranean'],
    ingredients: [
      { name: 'Canned Tuna in Water', baseQty: 150, unit: 'g' },
      { name: 'Avocado', baseQty: 1, unit: 'pcs' },
      { name: 'Red Onion', baseQty: 20, unit: 'g' },
      { name: 'Romaine Lettuce Leaves', baseQty: 4, unit: 'leaves' },
      { name: 'Lemon Juice', baseQty: 1, unit: 'tsp' }
    ],
    instructions: [
      'Drain the canned tuna and place in a mixing bowl.',
      'Add the flesh of one ripe avocado and mash together with tuna using a fork.',
      'Stir in finely diced red onion, lemon juice, salt, and pepper.',
      'Spoon the tuna avocado salad into romaine lettuce leaves and wrap.'
    ]
  },

  // --- DINNERS ---
  {
    id: 'd-salmon',
    name: 'Pan-Seared Salmon with Roasted Broccoli',
    mealType: 'dinner',
    baseCalories: 580,
    baseProtein: 44,
    baseCarbs: 12,
    baseFat: 38,
    baseFiber: 4,
    prepTime: '20 mins',
    diets: ['keto', 'paleo', 'low-carb', 'mediterranean'],
    ingredients: [
      { name: 'Salmon Fillet', baseQty: 180, unit: 'g' },
      { name: 'Broccoli Florets', baseQty: 200, unit: 'g' },
      { name: 'Olive Oil', baseQty: 1.5, unit: 'tbsp' },
      { name: 'Garlic Cloves', baseQty: 2, unit: 'pcs' },
      { name: 'Lemon', baseQty: 0.5, unit: 'pcs' }
    ],
    instructions: [
      'Preheat oven to 200°C (400°F). Toss broccoli with 1 tbsp olive oil, minced garlic, salt, and pepper.',
      'Spread broccoli on a baking sheet and roast for 15 minutes.',
      'Season salmon fillet with salt, pepper, and lemon juice.',
      'Heat remaining 0.5 tbsp olive oil in a skillet over medium-high heat.',
      'Sear salmon skin-side down for 4-5 minutes, flip, and cook for 3-4 minutes more.',
      'Serve salmon hot alongside the roasted garlic broccoli.'
    ]
  },
  {
    id: 'd-tofu-curry',
    name: 'Coconut Chickpea & Tofu Curry',
    mealType: 'dinner',
    baseCalories: 520,
    baseProtein: 22,
    baseCarbs: 45,
    baseFat: 28,
    baseFiber: 8,
    prepTime: '25 mins',
    diets: ['vegan', 'vegetarian'],
    ingredients: [
      { name: 'Extra Firm Tofu', baseQty: 150, unit: 'g' },
      { name: 'Canned Chickpeas', baseQty: 100, unit: 'g' },
      { name: 'Light Coconut Milk', baseQty: 150, unit: 'ml' },
      { name: 'Curry Powder', baseQty: 1, unit: 'tbsp' },
      { name: 'Spinach', baseQty: 50, unit: 'g' },
      { name: 'Coconut Oil', baseQty: 1, unit: 'tsp' }
    ],
    instructions: [
      'Press tofu to remove excess water, then cube it.',
      'Heat coconut oil in a pan and brown the tofu cubes on all sides; remove and set aside.',
      'In the same pan, add curry powder and coconut milk, bringing to a simmer.',
      'Add chickpeas and tofu. Simmer for 10 minutes to let flavors meld.',
      'Stir in spinach until wilted, season with salt, and serve hot.'
    ]
  },
  {
    id: 'd-steak',
    name: 'Ribeye Steak with Asparagus & Garlic Butter',
    mealType: 'dinner',
    baseCalories: 680,
    baseProtein: 52,
    baseCarbs: 6,
    baseFat: 48,
    baseFiber: 3,
    prepTime: '20 mins',
    diets: ['keto', 'paleo', 'low-carb'],
    ingredients: [
      { name: 'Ribeye Steak', baseQty: 200, unit: 'g' },
      { name: 'Asparagus Spears', baseQty: 150, unit: 'g' },
      { name: 'Butter (Grass-Fed)', baseQty: 20, unit: 'g' },
      { name: 'Garlic Clove', baseQty: 1, unit: 'pcs' },
      { name: 'Olive Oil', baseQty: 1, unit: 'tsp' }
    ],
    instructions: [
      'Take steak out of fridge 30 minutes before cooking. Season generously with salt and pepper.',
      'Snap off woody ends of asparagus.',
      'Heat iron skillet on high heat until smoking, add olive oil.',
      'Sear steak for 2-3 minutes per side. Add butter and minced garlic, basting the steak for 1 minute. Remove steak to rest.',
      'Add asparagus to same skillet and sauté in garlic butter for 3-4 minutes until tender-crisp.',
      'Serve steak alongside asparagus, drizzled with pan juices.'
    ]
  },

  // --- SNACKS ---
  {
    id: 's-nuts',
    name: 'Raw Almonds & Walnut Mix',
    mealType: 'snack',
    baseCalories: 200,
    baseProtein: 6,
    baseCarbs: 6,
    baseFat: 18,
    baseFiber: 3,
    prepTime: '1 min',
    diets: ['keto', 'paleo', 'vegan', 'vegetarian', 'mediterranean', 'low-carb'],
    ingredients: [
      { name: 'Raw Almonds', baseQty: 15, unit: 'g' },
      { name: 'Raw Walnuts', baseQty: 15, unit: 'g' }
    ],
    instructions: [
      'Combine almonds and walnuts in a small container.',
      'Enjoy as a healthy, energy-dense snack.'
    ]
  },
  {
    id: 's-hummus',
    name: 'Hummus with Carrot & Cucumber Sticks',
    mealType: 'snack',
    baseCalories: 160,
    baseProtein: 4,
    baseCarbs: 18,
    baseFat: 8,
    baseFiber: 5,
    prepTime: '5 mins',
    diets: ['vegan', 'vegetarian', 'mediterranean'],
    ingredients: [
      { name: 'Hummus', baseQty: 50, unit: 'g' },
      { name: 'Carrots', baseQty: 80, unit: 'g' },
      { name: 'Cucumber', baseQty: 80, unit: 'g' }
    ],
    instructions: [
      'Slice carrots and cucumbers into long dipping sticks.',
      'Spoon hummus into a small dish.',
      'Serve sticks alongside hummus for dipping.'
    ]
  },
  {
    id: 's-cheese',
    name: 'Cheddar Cheese & Apple Slices',
    mealType: 'snack',
    baseCalories: 220,
    baseProtein: 8,
    baseCarbs: 18,
    baseFat: 14,
    baseFiber: 3,
    prepTime: '3 mins',
    diets: ['vegetarian', 'low-carb'],
    ingredients: [
      { name: 'Cheddar Cheese', baseQty: 30, unit: 'g' },
      { name: 'Apple', baseQty: 1, unit: 'pcs' }
    ],
    instructions: [
      'Core and slice the apple into wedges.',
      'Slice cheddar cheese into cubes or thin blocks.',
      'Serve wedges and cheese together for a balanced sweet-savory snack.'
    ]
  }
];
