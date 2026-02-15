import { apiRequest } from '../lib/api';
import type {
    Database,
    HistoryItem,
    Product,
    ProductUpdateInput,
    Recipe,
    RecipeIngredient,
    RecipeInput,
} from './types';

type ApiEntity<T> = {
	data: T;
};

type ApiCollection<T> = {
	data: T[];
};

const db: Database = {
	initDB: async () => {
		// No-op for remote storage.
	},
	getProducts: async (): Promise<Product[]> => {
		const response = await apiRequest<ApiCollection<Product>>('/products');
		return response.data;
	},
	addProduct: async (name: string, quantity: number, unit: string): Promise<void> => {
		await apiRequest('/products', {
			method: 'POST',
			body: { name, quantity, unit },
		});
	},
	updateProduct: async (id: number, updates: ProductUpdateInput): Promise<void> => {
		await apiRequest(`/products/${id}`, {
			method: 'PATCH',
			body: updates,
		});
	},
	deleteProduct: async (id: number): Promise<void> => {
		await apiRequest(`/products/${id}`, {
			method: 'DELETE',
		});
	},
	getRecipes: async (): Promise<Recipe[]> => {
		const response = await apiRequest<ApiCollection<Recipe>>('/recipes');
		return response.data;
	},
	addRecipe: async (recipe: RecipeInput): Promise<number> => {
		const response = await apiRequest<ApiEntity<Recipe>>('/recipes', {
			method: 'POST',
			body: recipe,
		});
		return response.data.id;
	},
	updateRecipe: async (recipe: Recipe): Promise<void> => {
		await apiRequest(`/recipes/${recipe.id}`, {
			method: 'PUT',
			body: recipe,
		});
	},
	deleteRecipe: async (id: number): Promise<void> => {
		await apiRequest(`/recipes/${id}`, {
			method: 'DELETE',
		});
	},
	cookRecipe: async (
		recipeId: number,
		usedIngredients?: { productName: string; amountUsed: number }[]
	): Promise<void> => {
		await apiRequest(`/recipes/${recipeId}/cook`, {
			method: 'POST',
			body: { usedIngredients: usedIngredients ?? [] },
		});
	},
	getCookingHistory: async (): Promise<HistoryItem[]> => {
		const response = await apiRequest<ApiCollection<HistoryItem>>('/history');
		return response.data;
	},
	getRecipeIngredients: async (recipeId: number): Promise<RecipeIngredient[]> => {
		const response = await apiRequest<ApiCollection<RecipeIngredient>>(`/recipes/${recipeId}/ingredients`);
		return response.data;
	},
	addRecipeIngredient: async (
		recipeId: number,
		productName: string,
		amountRequired: number
	): Promise<void> => {
		await apiRequest(`/recipes/${recipeId}/ingredients`, {
			method: 'POST',
			body: { productName, amountRequired },
		});
	},
	updateRecipeIngredient: async (
		id: number,
		productName: string,
		amountRequired: number
	): Promise<void> => {
		await apiRequest(`/recipe-ingredients/${id}`, {
			method: 'PUT',
			body: { productName, amountRequired },
		});
	},
	deleteRecipeIngredient: async (id: number): Promise<void> => {
		await apiRequest(`/recipe-ingredients/${id}`, {
			method: 'DELETE',
		});
	},
};

export const initDB = db.initDB;
export const getProducts = db.getProducts;
export const addProduct = db.addProduct;
export const updateProduct = db.updateProduct;
export const deleteProduct = db.deleteProduct;
export const getRecipes = db.getRecipes;
export const addRecipe = db.addRecipe;
export const updateRecipe = db.updateRecipe;
export const deleteRecipe = db.deleteRecipe;
export const cookRecipe = db.cookRecipe;
export const getCookingHistory = db.getCookingHistory;
export const getRecipeIngredients = db.getRecipeIngredients;
export const addRecipeIngredient = db.addRecipeIngredient;
export const updateRecipeIngredient = db.updateRecipeIngredient;
export const deleteRecipeIngredient = db.deleteRecipeIngredient;

