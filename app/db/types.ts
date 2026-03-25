export interface Product {
  id: number;
  name: string;
  quantity: number;
  unit: string;
  updated_at: string;
}

export interface RecipeIngredient {
  id: number;
  recipe_id: number;
  product_name: string;
  amount_required: number;
}

export interface Recipe {
  id: number;
  title: string;
  description: string;
  image_url?: string;
  image_data?: string;
  is_global?: boolean;
  is_liked?: boolean;
  category: string;
  cooking_time: number;
  times_cooked: number;
}

export interface RecipeInput {
  title: string;
  description: string;
  image_url?: string;
  image_data?: string;
  category: string;
  cooking_time: number;
}

export interface HistoryItem {
  id: number;
  recipe_id: number;
  recipe_title?: string;
  used_ingredients?: {
    product_name: string;
    amount_used: number;
    unit: string;
  }[];
  cooked_at: string;
}

export interface ProductUpdateInput {
  name?: string;
  quantity?: number;
  unit?: string;
}

export type RecommendationGoal = 'deficit' | 'surplus' | 'neutral';

export interface RecommendedRecipe {
  recipe: Recipe;
  reason: string;
  tags: string[];
  availability: {
    total: number;
    available: number;
    percentage: number;
  };
}

export interface AIRecommendations {
  recommendations: RecommendedRecipe[];
  reasoning: string;
}

export interface Database {
  initDB(): Promise<void>;
  getProducts(): Promise<Product[]>;
  addProduct(name: string, quantity: number, unit: string): Promise<void>;
  updateProduct(id: number, updates: ProductUpdateInput): Promise<void>;
  deleteProduct(id: number): Promise<void>;
  getRecipes(): Promise<Recipe[]>;
  addRecipe(recipe: RecipeInput): Promise<number>;
  updateRecipe(recipe: Recipe): Promise<void>;
  deleteRecipe(id: number): Promise<void>;
  getLikedRecipes(): Promise<Recipe[]>;
  likeRecipe(recipeId: number): Promise<void>;
  unlikeRecipe(recipeId: number): Promise<void>;
  getRecommendationGoal(): Promise<RecommendationGoal>;
  updateRecommendationGoal(goal: RecommendationGoal): Promise<RecommendationGoal>;
  cookRecipe(
    recipeId: number,
    usedIngredients?: { productName: string; amountUsed: number }[]
  ): Promise<void>;
  getCookingHistory(): Promise<HistoryItem[]>;
  getRecipeIngredients(recipeId: number): Promise<RecipeIngredient[]>;
  addRecipeIngredient(
    recipeId: number,
    productName: string,
    amountRequired: number
  ): Promise<void>;
  updateRecipeIngredient(
    id: number,
    productName: string,
    amountRequired: number
  ): Promise<void>;
  deleteRecipeIngredient(id: number): Promise<void>;
}
