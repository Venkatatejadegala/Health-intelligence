import { geminiService } from './geminiService';
import apiClient from './apiClient';

export interface Meal {
  id: string;
  name: string;
  timestamp: Date;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  serving: string;
  quantity?: string;
  confidence: number;
  mealType: string;
}

export interface DailyNutrition {
  date: string;
  meals: Meal[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  totalFiber: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  water: number;
  goals: NutritionGoals;
  remaining: NutritionGoals;
}

export interface NutritionGoals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  water: number;
}

export interface UserProfile {
  age: number;
  gender: string;
  height: number;
  weight: number;
  activityLevel: string;
  goals: string[];
  goal?: string;
  dietaryRestrictions?: string[];
}

export type MealEntry = Meal;

class NutritionService {
  private storageKey = 'health-hub-nutrition-data';

  getDefaultGoals(): NutritionGoals {
    return {
      calories: 2000,
      protein: 120,
      carbs: 250,
      fat: 65,
      fiber: 25,
      water: 2000
    };
  }

  async analyzeMeal(mealName: string): Promise<Omit<Meal, 'id' | 'timestamp'>> {
    try {
      const nutritionInfo = await geminiService.getFoodNutritionInfo(mealName);
      return {
        name: mealName,
        calories: nutritionInfo.calories,
        protein: nutritionInfo.protein,
        carbs: nutritionInfo.carbs,
        fat: nutritionInfo.fat,
        fiber: nutritionInfo.fiber,
        serving: '1 serving',
        confidence: nutritionInfo.confidence,
        mealType: 'meal'
      };
    } catch (error) {
      return this.getFallbackNutrition(mealName);
    }
  }

  private getFallbackNutrition(mealName: string): Omit<Meal, 'id' | 'timestamp'> {
    const lowerName = mealName.toLowerCase();
    
    if (lowerName.includes('chicken')) {
      return { name: mealName, calories: 165, protein: 31, carbs: 0, fat: 3.6, fiber: 0, serving: '100g', confidence: 85, mealType: 'main' };
    } else if (lowerName.includes('rice')) {
      return { name: mealName, calories: 130, protein: 2.7, carbs: 28, fat: 0.3, fiber: 0.4, serving: '100g', confidence: 90, mealType: 'main' };
    } else if (lowerName.includes('broccoli')) {
      return { name: mealName, calories: 34, protein: 2.8, carbs: 7, fat: 0.4, fiber: 2.6, serving: '100g', confidence: 95, mealType: 'side' };
    } else if (lowerName.includes('salmon')) {
      return { name: mealName, calories: 208, protein: 25, carbs: 0, fat: 12, fiber: 0, serving: '100g', confidence: 90, mealType: 'main' };
    } else if (lowerName.includes('banana')) {
      return { name: mealName, calories: 89, protein: 1.1, carbs: 23, fat: 0.3, fiber: 2.6, serving: '1 medium', confidence: 95, mealType: 'snack' };
    } else if (lowerName.includes('apple')) {
      return { name: mealName, calories: 52, protein: 0.3, carbs: 14, fat: 0.2, fiber: 2.4, serving: '1 medium', confidence: 95, mealType: 'snack' };
    } else if (lowerName.includes('egg')) {
      return { name: mealName, calories: 155, protein: 13, carbs: 1.1, fat: 11, fiber: 0, serving: '2 large', confidence: 90, mealType: 'main' };
    } else if (lowerName.includes('oatmeal')) {
      return { name: mealName, calories: 154, protein: 5.3, carbs: 27, fat: 3.1, fiber: 4, serving: '100g', confidence: 90, mealType: 'breakfast' };
    } else if (lowerName.includes('yogurt')) {
      return { name: mealName, calories: 59, protein: 10, carbs: 3.6, fat: 0.4, fiber: 0, serving: '100g', confidence: 85, mealType: 'snack' };
    } else if (lowerName.includes('bread')) {
      return { name: mealName, calories: 265, protein: 9, carbs: 49, fat: 3.2, fiber: 2.7, serving: '100g', confidence: 85, mealType: 'main' };
    }

    return {
      name: mealName,
      calories: 200,
      protein: 10,
      carbs: 25,
      fat: 8,
      fiber: 3,
      serving: '1 serving',
      confidence: 60,
      mealType: 'meal'
    };
  }

  async addMeal(mealName: string): Promise<Meal> {
    const nutritionInfo = await this.analyzeMeal(mealName);
    
    const meal: Meal = {
      id: Date.now().toString(),
      timestamp: new Date(),
      ...nutritionInfo
    };

    const today = new Date().toISOString().split('T')[0];
    const dailyData = this.getDailyNutrition(today);
    
    dailyData.meals.push(meal);
    this.saveDailyNutrition(dailyData);

    return meal;
  }

  addCustomMeal(customMeal: Omit<Meal, 'id' | 'timestamp'>, dateString?: string): Meal {
    const meal: Meal = {
      id: Date.now().toString(),
      timestamp: new Date(),
      ...customMeal
    };

    const targetDate = dateString || new Date().toISOString().split('T')[0];
    const dailyData = this.getDailyNutrition(targetDate);
    
    dailyData.meals.push(meal);
    this.saveDailyNutrition(dailyData);

    return meal;
  }

  removeMeal(mealId: string, dateString?: string): void {
    const date = dateString || new Date().toISOString().split('T')[0];
    const dailyData = this.getDailyNutrition(date);
    
    dailyData.meals = dailyData.meals.filter(meal => meal.id !== mealId);
    this.saveDailyNutrition(dailyData);
  }

  getDailyNutrition(date: string): DailyNutrition {
    const data = this.getAllNutritionData();
    const goals = this.getDefaultGoals();

    const dailyData = data[date] || {
      date,
      meals: [],
      totalCalories: 0,
      totalProtein: 0,
      totalCarbs: 0,
      totalFat: 0,
      totalFiber: 0,
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      fiber: 0,
      water: 0,
      goals,
      remaining: { ...goals }
    };

    dailyData.totalCalories = dailyData.meals.reduce((sum, meal) => sum + meal.calories, 0);
    dailyData.totalProtein = dailyData.meals.reduce((sum, meal) => sum + meal.protein, 0);
    dailyData.totalCarbs = dailyData.meals.reduce((sum, meal) => sum + meal.carbs, 0);
    dailyData.totalFat = dailyData.meals.reduce((sum, meal) => sum + meal.fat, 0);
    dailyData.totalFiber = dailyData.meals.reduce((sum, meal) => sum + meal.fiber, 0);
    
    // Set individual properties to match totals
    dailyData.calories = dailyData.totalCalories;
    dailyData.protein = dailyData.totalProtein;
    dailyData.carbs = dailyData.totalCarbs;
    dailyData.fat = dailyData.totalFat;
    dailyData.fiber = dailyData.totalFiber;

    dailyData.remaining = {
      calories: Math.max(0, goals.calories - dailyData.totalCalories),
      protein: Math.max(0, goals.protein - dailyData.totalProtein),
      carbs: Math.max(0, goals.carbs - dailyData.totalCarbs),
      fat: Math.max(0, goals.fat - dailyData.totalFat),
      fiber: Math.max(0, goals.fiber - dailyData.totalFiber),
      water: Math.max(0, goals.water - dailyData.water)
    };

    return dailyData;
  }

  private getAllNutritionData(): { [date: string]: DailyNutrition } {
    const saved = localStorage.getItem(this.storageKey);
    return saved ? JSON.parse(saved) : {};
  }

  private saveDailyNutrition(dailyData: DailyNutrition): void {
    const data = this.getAllNutritionData();
    data[dailyData.date] = dailyData;
    localStorage.setItem(this.storageKey, JSON.stringify(data));
    
    // Auto-sync to backend in the background
    this.syncToBackend(dailyData);
  }

  calculateBMR(weight: number, height: number, age: number, gender: string): number;
  calculateBMR(userProfile: UserProfile): number;
  calculateBMR(weightOrProfile: number | UserProfile, height?: number, age?: number, gender?: string): number {
    // Mifflin-St Jeor Equation
    let weight: number, userHeight: number, userAge: number, userGender: string;
    
    if (typeof weightOrProfile === 'object') {
      weight = weightOrProfile.weight;
      userHeight = weightOrProfile.height;
      userAge = weightOrProfile.age;
      userGender = weightOrProfile.gender;
    } else {
      weight = weightOrProfile;
      userHeight = height!;
      userAge = age!;
      userGender = gender!;
    }
    
    if (userGender.toLowerCase() === 'male') {
      return 10 * weight + 6.25 * userHeight - 5 * userAge + 5;
    } else {
      return 10 * weight + 6.25 * userHeight - 5 * userAge - 161;
    }
  }

  calculateTDEE(bmr: number, activityLevel: string): number;
  calculateTDEE(userProfile: UserProfile): number;
  calculateTDEE(bmrOrProfile: number | UserProfile, activityLevel?: string): number {
    let bmr: number, userActivityLevel: string;
    
    if (typeof bmrOrProfile === 'object') {
      bmr = this.calculateBMR(bmrOrProfile);
      userActivityLevel = bmrOrProfile.activityLevel;
    } else {
      bmr = bmrOrProfile;
      userActivityLevel = activityLevel!;
    }
    
    const multipliers = {
      'sedentary': 1.2,
      'light': 1.375,
      'moderate': 1.55,
      'active': 1.725,
      'very_active': 1.9
    };
    return bmr * (multipliers[userActivityLevel.toLowerCase() as keyof typeof multipliers] || 1.2);
  }

  calculateNutritionGoals(tdee: number, goals: string[]): NutritionGoals;
  calculateNutritionGoals(userProfile: UserProfile): NutritionGoals;
  calculateNutritionGoals(tdeeOrProfile: number | UserProfile, goals?: string[]): NutritionGoals {
    let tdee: number, userGoals: string[];
    
    if (typeof tdeeOrProfile === 'object') {
      tdee = this.calculateTDEE(tdeeOrProfile);
      userGoals = tdeeOrProfile.goals;
    } else {
      tdee = tdeeOrProfile;
      userGoals = goals!;
    }
    
    const proteinPerKg = userGoals.includes('muscle gain') ? 2.2 : 1.6;
    const protein = Math.round(70 * proteinPerKg); // Assuming 70kg average weight
    
    return {
      calories: Math.round(tdee),
      protein: protein,
      carbs: Math.round((tdee * 0.45) / 4), // 45% of calories from carbs
      fat: Math.round((tdee * 0.25) / 9), // 25% of calories from fat
      fiber: 25,
      water: 2000
    };
  }

  async syncToBackend(dailyData: DailyNutrition): Promise<void> {
    try {
      const formattedLog = {
        date: dailyData.date,
        caloriesConsumed: dailyData.calories,
        proteinConsumed: dailyData.protein,
        carbsConsumed: dailyData.carbs,
        fatConsumed: dailyData.fat,
        fiberConsumed: dailyData.fiber,
        waterIntake: dailyData.water,
        meals: dailyData.meals.map(meal => ({
          id: meal.id,
          name: meal.name,
          calories: meal.calories,
          protein: meal.protein,
          carbs: meal.carbs,
          fat: meal.fat,
          fiber: meal.fiber,
          serving: meal.serving,
          confidence: meal.confidence,
          mealType: meal.mealType,
          timestamp: meal.timestamp
        }))
      };

      await apiClient.put('/api/logs/today', formattedLog);
    } catch (err) {
      console.warn('Failed to sync nutrition log to backend in background:', err);
    }
  }

  async syncFromBackend(date: string): Promise<DailyNutrition | null> {
    try {
      const response = await apiClient.get(`/api/logs/today?date=${date}`);
      const payload = response.data;
      if (payload.success && payload.data) {
        const log = payload.data;
        const goals = this.getDefaultGoals();
        
        const dailyData: DailyNutrition = {
          date,
          meals: (log.meals || []).map((m: any) => ({
            id: m.id || m._id || Date.now().toString(),
            name: m.name || 'Meal',
            calories: m.calories || 0,
            protein: m.protein || 0,
            carbs: m.carbs || 0,
            fat: m.fat || 0,
            fiber: m.fiber || 0,
            serving: m.serving || '1 serving',
            confidence: m.confidence || 80,
            mealType: m.mealType || 'meal',
            timestamp: m.timestamp ? new Date(m.timestamp) : new Date()
          })),
          totalCalories: log.caloriesConsumed || 0,
          totalProtein: log.proteinConsumed || 0,
          totalCarbs: log.carbsConsumed || 0,
          totalFat: log.fatConsumed || 0,
          totalFiber: log.fiberConsumed || 0,
          calories: log.caloriesConsumed || 0,
          protein: log.proteinConsumed || 0,
          carbs: log.carbsConsumed || 0,
          fat: log.fatConsumed || 0,
          fiber: log.fiberConsumed || 0,
          water: log.waterIntake || 0,
          goals,
          remaining: {
            calories: Math.max(0, goals.calories - (log.caloriesConsumed || 0)),
            protein: Math.max(0, goals.protein - (log.proteinConsumed || 0)),
            carbs: Math.max(0, goals.carbs - (log.carbsConsumed || 0)),
            fat: Math.max(0, goals.fat - (log.fatConsumed || 0)),
            fiber: Math.max(0, goals.fiber - (log.fiberConsumed || 0)),
            water: Math.max(0, goals.water - (log.waterIntake || 0))
          }
        };

        // Save locally
        const data = this.getAllNutritionData();
        data[date] = dailyData;
        localStorage.setItem(this.storageKey, JSON.stringify(data));
        
        return dailyData;
      }
    } catch (err) {
      console.warn('Failed to pull nutrition log from backend:', err);
    }
    return null;
  }
}

export const nutritionService = new NutritionService();