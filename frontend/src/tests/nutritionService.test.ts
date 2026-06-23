import { describe, it, expect, beforeEach, vi } from 'vitest';
import { nutritionService } from '../services/nutritionService';

vi.mock('../services/geminiService', () => {
  return {
    geminiService: {
      getFoodNutritionInfo: vi.fn(() => Promise.reject(new Error('Mocked Gemini failure for fallback testing')))
    }
  };
});

describe('NutritionService unit tests', () => {
  beforeEach(() => {
    // Stub localStorage
    const store: Record<string, string> = {};
    vi.stubGlobal('localStorage', {
      getItem: vi.fn((key: string) => store[key] || null),
      setItem: vi.fn((key: string, value: string) => {
        store[key] = value;
      }),
      removeItem: vi.fn((key: string) => {
        delete store[key];
      }),
      clear: vi.fn(() => {
        for (const key in store) {
          delete store[key];
        }
      }),
      length: 0,
      key: vi.fn(),
    });
  });

  it('should return default goals correctly', () => {
    const goals = nutritionService.getDefaultGoals();
    expect(goals.calories).toBe(2000);
    expect(goals.protein).toBe(120);
    expect(goals.carbs).toBe(250);
    expect(goals.fat).toBe(65);
    expect(goals.water).toBe(2000);
  });

  it('should parse fallback nutrition details for chicken', async () => {
    const info = await nutritionService.analyzeMeal('Chicken Breast');
    expect(info.calories).toBe(165);
    expect(info.protein).toBe(31);
    expect(info.fat).toBe(3.6);
  });

  it('should parse fallback nutrition details for rice', async () => {
    const info = await nutritionService.analyzeMeal('Brown Rice');
    expect(info.calories).toBe(130);
    expect(info.protein).toBe(2.7);
    expect(info.carbs).toBe(28);
  });

  it('should parse fallback nutrition details for broccoli', async () => {
    const info = await nutritionService.analyzeMeal('Green Broccoli');
    expect(info.calories).toBe(34);
    expect(info.protein).toBe(2.8);
    expect(info.carbs).toBe(7);
  });

  it('should parse fallback nutrition details for bread', async () => {
    const info = await nutritionService.analyzeMeal('Whole Wheat Bread');
    expect(info.calories).toBe(265);
    expect(info.protein).toBe(9);
    expect(info.carbs).toBe(49);
  });

  it('should return default values for unknown fallback foods', async () => {
    const info = await nutritionService.analyzeMeal('Unknown Food Item');
    expect(info.calories).toBe(200);
    expect(info.protein).toBe(10);
    expect(info.carbs).toBe(25);
    expect(info.fat).toBe(8);
  });

  it('should add a custom meal correctly to daily logs', () => {
    const customMeal = {
      name: 'Custom Shake',
      calories: 300,
      protein: 25,
      carbs: 40,
      fat: 5,
      fiber: 4,
      serving: '1 shaker',
      confidence: 100,
      mealType: 'snack'
    };

    const dateStr = '2026-06-20';
    const addedMeal = nutritionService.addCustomMeal(customMeal, dateStr);

    expect(addedMeal.id).toBeDefined();
    expect(addedMeal.name).toBe(customMeal.name);

    const daily = nutritionService.getDailyNutrition(dateStr);
    expect(daily.meals.length).toBe(1);
    expect(daily.meals[0].name).toBe('Custom Shake');
  });

  it('should compute daily totals correctly when meals are added', () => {
    const dateStr = '2026-06-20';
    
    nutritionService.addCustomMeal({
      name: 'Meal A',
      calories: 500,
      protein: 30,
      carbs: 50,
      fat: 15,
      fiber: 5,
      serving: '1 bowl',
      confidence: 100,
      mealType: 'main'
    }, dateStr);

    nutritionService.addCustomMeal({
      name: 'Meal B',
      calories: 300,
      protein: 10,
      carbs: 40,
      fat: 10,
      fiber: 2,
      serving: '1 plate',
      confidence: 100,
      mealType: 'side'
    }, dateStr);

    const daily = nutritionService.getDailyNutrition(dateStr);
    expect(daily.totalCalories).toBe(800);
    expect(daily.totalProtein).toBe(40);
    expect(daily.totalCarbs).toBe(90);
    expect(daily.totalFat).toBe(25);
    expect(daily.totalFiber).toBe(7);
  });

  it('should support removing meals correctly and update aggregates', () => {
    const dateStr = '2026-06-20';
    
    const meal = nutritionService.addCustomMeal({
      name: 'Snack To Remove',
      calories: 250,
      protein: 5,
      carbs: 30,
      fat: 8,
      fiber: 3,
      serving: '1 pack',
      confidence: 100,
      mealType: 'snack'
    }, dateStr);

    let daily = nutritionService.getDailyNutrition(dateStr);
    expect(daily.meals.length).toBe(1);
    expect(daily.totalCalories).toBe(250);

    nutritionService.removeMeal(meal.id, dateStr);

    daily = nutritionService.getDailyNutrition(dateStr);
    expect(daily.meals.length).toBe(0);
    expect(daily.totalCalories).toBe(0);
  });

  it('should return empty baseline layout for daily nutrition with zero meals logged', () => {
    const daily = nutritionService.getDailyNutrition('2026-06-25');
    expect(daily.date).toBe('2026-06-25');
    expect(daily.meals).toEqual([]);
    expect(daily.totalCalories).toBe(0);
    expect(daily.goals.calories).toBe(2000);
  });

  it('should parse other fallback types like salmon, banana, apple, yogurt', async () => {
    const salmon = await nutritionService.analyzeMeal('Grilled Salmon');
    expect(salmon.calories).toBe(208);
    expect(salmon.protein).toBe(25);

    const banana = await nutritionService.analyzeMeal('Sweet Banana');
    expect(banana.calories).toBe(89);

    const apple = await nutritionService.analyzeMeal('Red Apple');
    expect(apple.calories).toBe(52);

    const yogurt = await nutritionService.analyzeMeal('Greek Yogurt');
    expect(yogurt.calories).toBe(59);
  });

  it('should parse other fallback types like egg and oatmeal', async () => {
    const egg = await nutritionService.analyzeMeal('Scrambled Egg');
    expect(egg.calories).toBe(155);
    expect(egg.protein).toBe(13);

    const oatmeal = await nutritionService.analyzeMeal('Organic Oatmeal');
    expect(oatmeal.calories).toBe(154);
  });
});
