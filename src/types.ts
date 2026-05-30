/**
 * AI Recipe Generator Type Declarations
 */

export interface UserPreferences {
  cuisine: string;
  language: string;
  diet: string;
}

export interface UserProfile {
  userId: string;
  name: string;
  email: string;
  createdAt: string;
  preferences: UserPreferences;
}

export interface RecipeNutrition {
  calories: string;
  protein: string;
  carbs: string;
  fat: string;
  fiber: string;
}

export interface Recipe {
  recipeId: string;
  userId: string;
  title: string;
  description: string;
  ingredients: string[];
  measurements: string[];
  prepTime: string;
  cookingTime: string;
  totalTime: string;
  difficulty: "Beginner" | "Intermediate" | "Expert" | string;
  instructions: string[];
  nutritionSummary: RecipeNutrition;
  healthyTips: string[];
  servingSuggestions: string[];
  createdAt: string;
  imagePrompt?: string;
  // Dynamic client attributes
  notes?: string;
  isCustom?: boolean;
}

export interface SavedRecipe {
  saveId: string;
  userId: string;
  recipeId: string;
  savedAt: string;
}

export interface MealDetail {
  name: string;
  calories: string;
  notes: string;
}

export interface DayMeals {
  breakfast: MealDetail;
  lunch: MealDetail;
  dinner: MealDetail;
  snacks: MealDetail;
}

export interface DayPlan {
  dayName: string;
  meals: DayMeals;
}

export interface MealPlan {
  planId: string;
  userId: string;
  planTitle: string;
  nutritionGoalSummary: string;
  days: DayPlan[];
  createdAt: string;
}

export interface ShoppingItem {
  name: string;
  quantity: string;
  isChecked: boolean;
}

export interface ShoppingCategory {
  categoryName: string;
  items: ShoppingItem[];
}

export interface ShoppingList {
  listId: string;
  userId: string;
  title: string;
  categories: ShoppingCategory[];
  createdAt: string;
}

export interface ChatMessage {
  chatId: string;
  userId: string;
  message: string;
  response: string;
  timestamp: string;
}

export interface Note {
  noteId: string;
  recipeId: string;
  userId: string;
  content: string;
}
