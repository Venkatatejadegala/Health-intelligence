import { GoogleGenerativeAI } from '@google/generative-ai';

const rawApiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
const cleanApiKey = rawApiKey.replace(/['"]/g, '').trim();
const rawModel = import.meta.env.VITE_GEMINI_MODEL || 'gemini-2.5-flash';
const cleanModel = rawModel.replace(/['"]/g, '').trim();

let genAI = new GoogleGenerativeAI(cleanApiKey);
const DEFAULT_GEMINI_MODEL = cleanModel;

export interface FoodAnalysisResult {
  foodName: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar?: number;
  servingSize?: string;
  confidence: number;
  description: string;
  saturatedFat?: number;
  transFat?: number;
  cholesterol?: number;
  sodium?: number;
  potassium?: number;
  calcium?: number;
  iron?: number;
  vitaminA?: number;
  vitaminC?: number;
}

export type FoodAnalysis = FoodAnalysisResult;

export interface HealthRecommendation {
  title: string;
  description: string;
  category: 'nutrition' | 'exercise' | 'sleep' | 'mental' | 'general';
  priority: 'high' | 'medium' | 'low';
}

class GeminiService {
  private model = genAI.getGenerativeModel({ model: DEFAULT_GEMINI_MODEL }, { apiVersion: 'v1beta' });
  private visionModel = genAI.getGenerativeModel({ model: DEFAULT_GEMINI_MODEL }, { apiVersion: 'v1beta' });

  /**
   * Update API key dynamically
   */
  updateApiKey(newApiKey: string) {
    try {
      genAI = new GoogleGenerativeAI(newApiKey);
      this.model = genAI.getGenerativeModel({ model: DEFAULT_GEMINI_MODEL }, { apiVersion: 'v1beta' });
      this.visionModel = genAI.getGenerativeModel({ model: DEFAULT_GEMINI_MODEL }, { apiVersion: 'v1beta' });
      console.log('API key updated successfully');
      return true;
    } catch (error) {
      console.error('Failed to update API key:', error);
      return false;
    }
  }

  /**
   * Centralized content generation helper with automatic fallback to 'gemini-flash-latest'
   */
  private async generateContentWithFallback(prompt: string): Promise<string> {
    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.warn(`Primary Gemini model (${DEFAULT_GEMINI_MODEL}) call failed, retrying with fallback 'gemini-flash-latest':`, error);
      try {
        const fallbackModel = genAI.getGenerativeModel({ model: 'gemini-flash-latest' }, { apiVersion: 'v1beta' });
        const result = await fallbackModel.generateContent(prompt);
        const response = await result.response;
        return response.text();
      } catch (fallbackError) {
        console.error("Fallback model 'gemini-flash-latest' also failed:", fallbackError);
        throw error; // throw original error if fallback also fails
      }
    }
  }

  /**
   * Test if the API key is working
   */
  async testConnection(): Promise<boolean> {
    console.log(`🔍 Testing API connection with model: ${DEFAULT_GEMINI_MODEL}...`);
    try {
      const result = await this.model.generateContent('Hi');
      const response = await result.response;
      const text = response.text();
      console.log('✅ API connection successful:', text.substring(0, 50) + '...');
      return true;
    } catch (error) {
      console.error('❌ Active model connection test failed:', error);
      try {
        console.log('🔍 Retrying connection test with fallback model: gemini-flash-latest...');
        const fallbackModel = genAI.getGenerativeModel({ model: 'gemini-flash-latest' }, { apiVersion: 'v1beta' });
        const result = await fallbackModel.generateContent('Hi');
        const response = await result.response;
        console.log('✅ API connection successful (with fallback model)');
        return true;
      } catch (fbError) {
        console.error('❌ Fallback model test also failed:', fbError);
      }
      return false;
    }
  }

  /**
   * Analyze food from image using Gemini Vision API
   */
  async analyzeFoodFromImage(imageFile: File): Promise<FoodAnalysisResult> {
    try {
      const imageData = await this.fileToGenerativePart(imageFile);
      
      const prompt = `
        Analyze this food image and provide detailed nutritional information in JSON format.
        Return ONLY a valid JSON object with these exact fields:
        {
          "foodName": "string (name of the food)",
          "name": "string (same as foodName)",
          "calories": number (estimated total calories),
          "protein": number (total grams of protein),
          "carbs": number (total grams of carbohydrates),
          "fat": number (total grams of fat),
          "fiber": number (total grams of fiber),
          "sugar": number (total grams of sugar, optional),
          "saturatedFat": number (saturated fat in grams, optional),
          "transFat": number (trans fat in grams, optional),
          "cholesterol": number (cholesterol in mg, optional),
          "sodium": number (sodium in mg, optional),
          "potassium": number (potassium in mg, optional),
          "calcium": number (calcium in mg, optional),
          "iron": number (iron in mg, optional),
          "vitaminA": number (vitamin A in mcg, optional),
          "vitaminC": number (vitamin C in mg, optional),
          "servingSize": "string (serving size description analyzed)",
          "confidence": number (0-100, how confident you are in this analysis),
          "description": "string (A brief, clean 2-3 sentence summary of the meal's key ingredients and portion weights. Explain the estimates in simple, natural language based on USDA reference standards. Do NOT use any markdown characters, lists, or double asterisks '**' in this text.)"
        }
        
        Be as accurate as possible with nutritional values. If you can't identify the food clearly, set confidence to a lower value. Keep the description concise and in plain, readable text (no markdown formatting or double asterisks).
      `;
      
      let text = '';
      try {
        const result = await this.visionModel.generateContent([prompt, imageData]);
        const response = await result.response;
        text = response.text();
      } catch (innerError) {
        console.warn("Primary vision model failed, retrying with fallback 'gemini-flash-latest':", innerError);
        const fallbackVisionModel = genAI.getGenerativeModel({ model: 'gemini-flash-latest' }, { apiVersion: 'v1beta' });
        const result = await fallbackVisionModel.generateContent([prompt, imageData]);
        const response = await result.response;
        text = response.text();
      }
      
      // Clean the response to extract JSON
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const foodData = JSON.parse(jsonMatch[0]);
        return foodData as FoodAnalysisResult;
      } else {
        throw new Error('Could not parse food analysis result');
      }
    } catch (error) {
      console.error('Error analyzing food image:', error);
      throw new Error('Failed to analyze food image. Please try again.');
    }
  }

  /**
   * Get personalized health recommendations
   */
  async getHealthRecommendations(userProfile: {
    age: number;
    gender: string;
    height: number;
    weight: number;
    activityLevel: string;
    goals: string[];
  }): Promise<HealthRecommendation[]> {
    try {
      const prompt = `
        Based on this user profile, provide 5 personalized health recommendations in JSON format:
        
        User Profile:
        - Age: ${userProfile.age}
        - Gender: ${userProfile.gender}
        - Height: ${userProfile.height} cm
        - Weight: ${userProfile.weight} kg
        - Activity Level: ${userProfile.activityLevel}
        - Goals: ${userProfile.goals.join(', ')}
        
        Return ONLY a valid JSON array with these exact fields for each recommendation:
        [
          {
            "title": "string (recommendation title)",
            "description": "string (detailed description)",
            "category": "nutrition" | "exercise" | "sleep" | "mental" | "general",
            "priority": "high" | "medium" | "low"
          }
        ]
        
        Make recommendations practical, actionable, and personalized to their profile. Focus on evidence-based health advice.
      `;

      const text = await this.generateContentWithFallback(prompt);
      
      // Clean the response to extract JSON
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const recommendations = JSON.parse(jsonMatch[0]);
        return recommendations as HealthRecommendation[];
      } else {
        throw new Error('Could not parse recommendations');
      }
    } catch (error) {
      console.error('Error getting health recommendations:', error);
      // Fallback to mock recommendations if API fails
      return this.getMockRecommendations(userProfile);
    }
  }

  /**
   * Get mock health recommendations for demo purposes
   */
  private async getMockRecommendations(userProfile: {
    age: number;
    gender: string;
    height: number;
    weight: number;
    activityLevel: string;
    goals: string[];
  }): Promise<HealthRecommendation[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const recommendations: HealthRecommendation[] = [
          {
            title: 'Optimize Your Protein Intake',
            description: `Based on your weight of ${userProfile.weight}kg, aim for 1.2-1.6g of protein per kg of body weight daily. This means consuming ${Math.round(userProfile.weight * 1.4)}-${Math.round(userProfile.weight * 1.6)}g of protein per day for muscle building and recovery.`,
            category: 'nutrition',
            priority: 'high'
          },
          {
            title: 'Increase Daily Water Intake',
            description: 'Aim for 8-10 glasses of water daily to support metabolism and overall health. Your current intake appears to be below the recommended amount for optimal hydration.',
            category: 'general',
            priority: 'medium'
          },
          {
            title: 'Establish Consistent Sleep Schedule',
            description: 'Maintain a regular sleep schedule with 7-9 hours of quality sleep for optimal recovery and cognitive function. This is especially important for your fitness goals.',
            category: 'sleep',
            priority: 'high'
          },
          {
            title: 'Add More Fiber to Your Diet',
            description: 'Include more whole grains, fruits, and vegetables to improve digestion and maintain stable blood sugar levels. This will support your weight management goals.',
            category: 'nutrition',
            priority: 'medium'
          },
          {
            title: 'Incorporate Strength Training',
            description: `Add 2-3 strength training sessions per week to build muscle mass and improve bone density. Given your ${userProfile.activityLevel} activity level, this will help you reach your muscle gain goals.`,
            category: 'exercise',
            priority: 'high'
          }
        ];
        resolve(recommendations);
      }, 2000);
    });
  }

  /**
   * Get nutrition information for a food item
   */
  async getFoodNutritionInfo(foodName: string): Promise<FoodAnalysisResult> {
    try {
      const prompt = `
        Provide detailed nutritional information for "${foodName}" in JSON format.
        Return ONLY a valid JSON object with these exact fields:
        {
          "foodName": "${foodName}",
          "name": "${foodName}",
          "calories": number (estimated total calories for the entire portion/quantity specified. If no quantity/portion size is specified in the query, calculate per standard serving of 100g or 1 medium portion, and specify this in servingSize),
          "protein": number (total grams of protein for the analyzed portion/quantity),
          "carbs": number (total grams of carbohydrates for the analyzed portion/quantity),
          "fat": number (total grams of fat for the analyzed portion/quantity),
          "fiber": number (total grams of fiber for the analyzed portion/quantity),
          "sugar": number (total grams of sugar for the analyzed portion/quantity, optional),
          "saturatedFat": number (saturated fat in grams, optional),
          "transFat": number (trans fat in grams, optional),
          "cholesterol": number (cholesterol in mg, optional),
          "sodium": number (sodium in mg, optional),
          "potassium": number (potassium in mg, optional),
          "calcium": number (calcium in mg, optional),
          "iron": number (iron in mg, optional),
          "vitaminA": number (vitamin A in mcg, optional),
          "vitaminC": number (vitamin C in mg, optional),
          "servingSize": "string (the quantity/serving size analyzed, e.g. '250g curry + 3 chapathis' or '100g' or '1 medium banana')",
          "confidence": 95,
          "description": "string (A brief, highly readable 2-3 sentence summary of this food's nutritional profile and serving size. Explain the estimate in simple, natural language based on USDA reference standards. Do NOT use any markdown formatting, bullet points, or double asterisks '**'.)"
        }
        
        Use accurate, realistic nutritional data for this food item based on established food databases and real-world nutritional research. Make sure values scale precisely to any portion size or quantity mentioned in the query.
      `;

      const text = await this.generateContentWithFallback(prompt);
      
      // Clean the response to extract JSON
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const foodData = JSON.parse(jsonMatch[0]);
        return foodData as FoodAnalysisResult;
      } else {
        throw new Error('Could not parse food nutrition info');
      }
    } catch (error) {
      console.error('Error getting food nutrition info:', error);
      throw new Error('Failed to get nutrition information. Please try again.');
    }
  }

  /**
   * Generate health tips based on current trends and best practices
   */
  async generateHealthTips(category: string = 'general'): Promise<string[]> {
    try {
      const prompt = `
        Generate 5 practical health tips for the "${category}" category.
        Return ONLY a JSON array of strings:
        ["tip 1", "tip 2", "tip 3", "tip 4", "tip 5"]
        
        Make tips actionable, evidence-based, and easy to follow.
      `;

      const text = await this.generateContentWithFallback(prompt);
      
      // Clean the response to extract JSON
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const tips = JSON.parse(jsonMatch[0]);
        return tips as string[];
      } else {
        throw new Error('Could not parse health tips');
      }
    } catch (error) {
      console.error('Error generating health tips:', error);
      throw new Error('Failed to generate health tips. Please try again.');
    }
  }

  /**
   * Ask AI about food, nutrients, and health issues based on user goals
   */
  async askAboutFoodAndHealth(question: string, userProfile: {
    age: number;
    gender: string;
    height: number;
    weight: number;
    activityLevel: string;
    goals: string[];
  }): Promise<string> {
    try {
      console.log('Asking AI about:', question);
      
      const prompt = `
        You are a concise health, fitness, and nutrition expert.
        You must ONLY answer questions that are directly related to physical health, fitness, exercise, diet, nutrition, sleep, recovery, or body composition.
        
        If the question is NOT related to physical health, fitness, exercise, diet, nutrition, sleep, recovery, or body composition, you must refuse to answer. Respond with: "I am only allowed to answer health, fitness, and nutrition related questions." and nothing else.
        
        Question: "${question}"
        Profile: ${userProfile.age}y, ${userProfile.gender}, ${userProfile.height}cm, ${userProfile.weight}kg, ${userProfile.activityLevel}, Goals: ${userProfile.goals.join(', ')}
        
        Give a crisp, actionable answer (2-3 sentences max) focusing on:
        - Direct answer to their question
        - One specific actionable tip
        - How it relates to their goals
        
        Be practical and evidence-based. No fluff.
      `;

      console.log('Sending prompt to Gemini...');
      const text = await this.generateContentWithFallback(prompt);
      
      console.log('Received response from Gemini:', text);
      return text;
    } catch (error) {
      console.error('Error asking AI about food and health:', error);
      return this.getFallbackResponse(question, userProfile);
    }
  }

  /**
   * Get fallback response when AI API fails
   */
  private getFallbackResponse(question: string, userProfile: {
    age: number;
    gender: string;
    height: number;
    weight: number;
    activityLevel: string;
    goals: string[];
  }): string {
    const lowerQuestion = question.toLowerCase();
    
    // Check if question is health related first
    const isHealthRelated = /health|food|protein|muscle|nutrition|diet|weight|fat|sleep|recovery|calories|hydration|water|supplement|vitamin|exercise|workout|gym/.test(lowerQuestion);
    if (!isHealthRelated) {
      return "I am only allowed to answer health, fitness, and nutrition related questions.";
    }

    if (lowerQuestion.includes('protein') || lowerQuestion.includes('muscle')) {
      return `For your ${userProfile.goals.join(', ')} goals, aim for ${Math.round(userProfile.weight * 1.4)}-${Math.round(userProfile.weight * 1.6)}g protein daily. Best sources: chicken, fish, eggs, Greek yogurt. Eat protein within 30 minutes post-workout for optimal muscle building.`;
    }

    if (lowerQuestion.includes('weight loss') || lowerQuestion.includes('lose weight')) {
      return `For weight loss: create a 300-500 calorie daily deficit. Focus on high-fiber foods, lean proteins, and healthy fats. Use smaller plates, drink water before meals, and combine cardio with strength training for best results.`;
    }

    if (lowerQuestion.includes('sleep') || lowerQuestion.includes('insomnia')) {
      return `For better sleep: eat complex carbs (oatmeal) and tryptophan-rich foods (turkey, milk) 2-3 hours before bed. Avoid caffeine after 2 PM, maintain consistent sleep schedule, and keep bedroom cool and dark.`;
    }

    if (lowerQuestion.includes('vitamin') || lowerQuestion.includes('supplement')) {
      return `Key nutrients for your goals: Vitamin D (bone health), B-complex (energy), Magnesium (muscle function), Iron (oxygen transport). Get nutrients from whole foods first, then consider supplements if needed.`;
    }

    return `For your ${userProfile.goals.join(', ')} goals: maintain a balanced diet, stay hydrated (8-10 glasses daily), get regular exercise, prioritize 7-9 hours sleep, and manage stress. Consult a healthcare professional for personalized advice.`;
  }

  /**
   * Search for food information (alias for getFoodNutritionInfo)
   */
  async searchFoodInfo(foodName: string): Promise<FoodAnalysisResult> {
    return this.getFoodNutritionInfo(foodName);
  }

  /**
   * Analyze food image (alias for analyzeFoodFromImage)
   */
  async analyzeFoodImage(imageFile: File): Promise<FoodAnalysisResult> {
    return this.analyzeFoodFromImage(imageFile);
  }

  /**
   * Generate a student-budget diet strategy based on body metrics and fitness goals
   */
  async generateStudentDietStrategy(userProfile: {
    age: number;
    gender: string;
    height: number;
    weight: number;
    activityLevel: string;
    goal: string;
    calorieTarget: number;
    macros: { protein: number; fat: number; carbs: number };
  }): Promise<string> {
    try {
      const prompt = `
        You are an elite sports nutritionist and dietitian specializing in budget-friendly meal planning for students.
        
        Analyze this student's profile:
        - Age: ${userProfile.age}
        - Gender: ${userProfile.gender}
        - Height: ${userProfile.height} cm
        - Weight: ${userProfile.weight} kg
        - Activity Level: ${userProfile.activityLevel}
        - Goal: ${userProfile.goal}
        - Daily Calorie Target: ${userProfile.calorieTarget} kcal
        - Target Macros: Protein ${userProfile.macros.protein}g, Fat ${userProfile.macros.fat}g, Carbs ${userProfile.macros.carbs}g
        
        Provide a comprehensive, highly structured student diet guide in markdown format:
        1. **Overview & Caloric Strategy**: Explain their deficit/surplus strategy for ${userProfile.goal}.
        2. **Budget-Friendly Protein & Carb Sources**: List cheap, easily accessible student foods (e.g. eggs, canned tuna, oats, lentils, frozen veggies).
        3. **Sample Daily Meal Plan**: A cheap, easy daily meal plan fitting their calories/macros.
        4. **Smart Grocery List**: A weekly shopping list keeping costs under $40-$50.
        5. **Student Meal Prep Tips**: Time-saving cooking tips for busy study weeks.
        
        Use friendly, motivating tone. Be highly specific and realistic.
      `;
      return await this.generateContentWithFallback(prompt);
    } catch (error) {
      console.error('Error generating student diet strategy:', error);
      return 'Failed to generate student diet strategy. Please verify your Gemini API key in the settings.';
    }
  }

  async parseMealDescription(mealText: string): Promise<FoodAnalysisResult> {
    try {
      const prompt = `
        Analyze this natural language food log description: "${mealText}"
        Provide detailed nutritional information in JSON format.
        Return ONLY a valid JSON object with these exact fields:
        {
          "foodName": "string (main name of the food/meal)",
          "name": "string (same as foodName)",
          "calories": number (estimated total calories),
          "protein": number (total grams of protein),
          "carbs": number (total grams of carbohydrates),
          "fat": number (total grams of fat),
          "fiber": number (total grams of fiber),
          "sugar": number (total grams of sugar, optional),
          "saturatedFat": number (saturated fat in grams, optional),
          "transFat": number (trans fat in grams, optional),
          "cholesterol": number (cholesterol in mg, optional),
          "sodium": number (sodium in mg, optional),
          "potassium": number (potassium in mg, optional),
          "calcium": number (calcium in mg, optional),
          "iron": number (iron in mg, optional),
          "vitaminA": number (vitamin A in mcg, optional),
          "vitaminC": number (vitamin C in mg, optional),
          "servingSize": "string (estimated serving size description analyzed)",
          "confidence": number (0-100, how confident you are in this calculation),
          "description": "string (A brief, highly readable 2-3 sentence summary of the ingredients, portions, and macro calculations. Explain the estimates in simple, natural language based on USDA reference standards. Do NOT use any markdown formatting, bullet points, or double asterisks '**'.)"
        }
        
        Be as realistic as possible based on the quantity and cooking style described. Base all nutrient levels on verified food databases and real-world research. Keep the description concise and in plain, readable text (no markdown formatting or double asterisks).
      `;
      
      const text = await this.generateContentWithFallback(prompt);

      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const foodData = JSON.parse(jsonMatch[0]);
        return foodData as FoodAnalysisResult;
      } else {
        throw new Error('Could not parse meal description analysis');
      }
    } catch (error) {
      console.error('Error parsing meal description:', error);
      throw new Error('Failed to parse meal description. Please check your API key.');
    }
  }

  /**
   * Generate a recipe based on fridge ingredients and remaining macronutrient budget
   */
  async generateFridgeRecipe(
    goal: string,
    ingredients: string[],
    remainingMacros: { calories: number; protein: number; carbs: number; fat: number }
  ): Promise<{
    recipeName: string;
    prepTime: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    ingredientsUsed: string[];
    instructionsMarkdown: string;
    description?: string;
  }> {
    try {
      const prompt = `
        You are an elite sports dietitian. Generate a custom recipe based on these inputs:
        
        Fitness Goal: ${goal}
        Available Ingredients: ${ingredients.join(', ')}
        Remaining Daily Budget:
        - Calories: ${remainingMacros.calories} kcal
        - Protein: ${remainingMacros.protein}g
        - Carbs: ${remainingMacros.carbs}g
        - Fat: ${remainingMacros.fat}g
        
        Provide a customized, high-protein recipe that fits within or stays slightly below the remaining calorie and macronutrient budget.
        
        Return ONLY a valid JSON object with the following fields (do not wrap in markdown \`\`\`json blocks, return ONLY the raw JSON):
        {
          "recipeName": "Sleek/athletic name of the recipe",
          "prepTime": "Estimated prep & cook time, e.g. '15 mins'",
          "calories": number (estimated total calories for the recipe),
          "protein": number (estimated total protein in grams),
          "carbs": number (estimated total carbs in grams),
          "fat": number (estimated total fat in grams),
          "ingredientsUsed": ["array of ingredients used, scaled to fit the budget"],
          "instructionsMarkdown": "Step-by-step cooking instructions formatted in clean markdown, with tips.",
          "description": "A brief, highly readable 2-3 sentence explanation of how this recipe supports your goal of '${goal}' in plain text. Do NOT use any markdown characters or double asterisks '**'."
        }
        
        Use highly realistic ingredient weights and portion metrics.
      `;

      const text = await this.generateContentWithFallback(prompt);

      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const recipeData = JSON.parse(jsonMatch[0]);
        return {
          recipeName: recipeData.recipeName || 'Fridge Creation',
          prepTime: recipeData.prepTime || '20 mins',
          calories: Number(recipeData.calories) || 0,
          protein: Number(recipeData.protein) || 0,
          carbs: Number(recipeData.carbs) || 0,
          fat: Number(recipeData.fat) || 0,
          ingredientsUsed: recipeData.ingredientsUsed || ingredients,
          instructionsMarkdown: recipeData.instructionsMarkdown || 'Enjoy your meal!',
          description: recipeData.description || `Custom recipe formulated to support your '${goal}' goals.`
        };
      } else {
        throw new Error('Failed to parse fridge recipe response');
      }
    } catch (error) {
      console.error('Error generating fridge recipe:', error);
      return {
        recipeName: 'High-Protein Quick Scramble',
        prepTime: '10 mins',
        calories: Math.min(450, remainingMacros.calories),
        protein: Math.min(30, remainingMacros.protein),
        carbs: Math.min(10, remainingMacros.carbs),
        fat: Math.min(15, remainingMacros.fat),
        ingredientsUsed: ingredients,
        instructionsMarkdown: `### Ingredients\n- ${ingredients.join('\n- ')}\n- Minor seasonings\n\n### Instructions\n1. Prepare and chop your available ingredients.\n2. Heat a pan with a splash of oil or water.\n3. Sauté and combine the ingredients, cooking thoroughly.\n4. Season to taste and serve immediately.`,
        description: `Custom scramble formulated to support your '${goal}' goals with available ingredients.`
      };
    }
  }

  /**
   * Convert file to Generative AI part
   */
  private async fileToGenerativePart(file: File): Promise<any> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve({
          inlineData: {
            data: reader.result?.toString().split(',')[1],
            mimeType: file.type,
          },
        });
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }
}

export const geminiService = new GeminiService();
