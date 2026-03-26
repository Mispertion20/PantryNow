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

export type SurveyMainGoal =
  | 'improve-overall-health'
  | 'reduce-weight'
  | 'gain-weight-muscle'
  | 'increase-energy-productivity'
  | 'improve-skin-hair'
  | 'eat-more-consciously';

export type SurveyDietChange =
  | 'eat-more-vegetables-fruits'
  | 'reduce-sugar'
  | 'limit-fatty-foods'
  | 'cut-down-fast-food'
  | 'increase-protein'
  | 'drink-more-water'
  | 'eat-regularly';

export type SurveyRestriction =
  | 'vegetarian'
  | 'vegan'
  | 'halal'
  | 'lactose-free'
  | 'gluten-free'
  | 'no-restrictions'
  | 'other';

export type SurveyCookingTime = 'minimum' | 'medium' | 'long';
export type SurveyActivityLevel = 'low' | 'medium' | 'high';
export type SurveyMealPattern = 'irregular' | '2-3' | '3-4' | 'often-snack';

export type SurveyPriority =
  | 'fast-cooking'
  | 'availability-of-products'
  | 'taste'
  | 'health-benefits'
  | 'calorie-reduction';

export interface PersonalizationSurvey {
  mainGoals: SurveyMainGoal[];
  dietChanges: SurveyDietChange[];
  restrictions: SurveyRestriction[];
  allergies: string[];
  otherRestriction: string;
  cookingTime: SurveyCookingTime | '';
  activityLevel: SurveyActivityLevel | '';
  mealPattern: SurveyMealPattern | '';
  priorities: SurveyPriority[];
  updatedAt?: string | null;
}

export type PersonalizationSurveyInput = Omit<PersonalizationSurvey, 'updatedAt'>;

export interface RecommendedRecipe {
  recipe: Recipe;
  reason: string;
  why_this_recipe?: string;
  why_this_recipe_points?: string[];
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

export interface ShoppingSuggestion {
  product_name: string;
  suggested_amount: number;
  unit: string;
  priority_score: number;
  short_reason: string;
  reason_points: string[];
  supporting_recipe_count: number;
}

export interface AIShoppingRecommendations {
  suggestions: ShoppingSuggestion[];
  reasoning: string;
}

export interface AIRecipeInstructions {
  title: string;
  intro: string;
  steps: string[];
  tips: string[];
  personalization_note: string;
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
  getPersonalizationSurvey(): Promise<{ surveyCompleted: boolean; survey: PersonalizationSurvey | null }>;
  updatePersonalizationSurvey(
    survey: PersonalizationSurveyInput
  ): Promise<{ surveyCompleted: boolean; survey: PersonalizationSurvey }>;
  getCustomInstructions(): Promise<string>;
  updateCustomInstructions(text: string): Promise<string>;
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
