import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import * as db from '../db';
import type { Product, ProductUpdateInput, Recipe, RecipeIngredient, RecipeInput } from '../db/types';
import { useAuthContext } from './AuthContext';

interface AppContextType {
  products: Product[];
  recipes: Recipe[];
  recipeIngredients: Map<number, RecipeIngredient[]>;
  loading: boolean;
  categories: string[];
  recipeCategories: string[];
  refreshProducts: () => Promise<void>;
  refreshRecipes: () => Promise<void>;
  getRecipeIngredients: (recipeId: number) => RecipeIngredient[];
  addProduct: (name: string, quantity: number, unit: string) => Promise<void>;
  updateProduct: (id: number, updates: ProductUpdateInput) => Promise<void>;
  deleteProduct: (id: number) => Promise<void>;
  addRecipe: (recipe: RecipeInput) => Promise<number>;
  updateRecipe: (recipe: Recipe) => Promise<void>;
  deleteRecipe: (id: number) => Promise<void>;
  cookRecipe: (recipeId: number) => Promise<void>;
  cookRecipeWithIngredients: (recipeId: number, usedIngredients: { productName: string; amountUsed: number }[]) => Promise<void>;
  addRecipeIngredient: (recipeId: number, productName: string, amountRequired: number) => Promise<void>;
  updateRecipeIngredient: (id: number, productName: string, amountRequired: number) => Promise<void>;
  deleteRecipeIngredient: (id: number) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token } = useAuthContext();
  const [products, setProducts] = useState<Product[]>([]);
  const [recipeIngredients, setRecipeIngredients] = useState<Map<number, RecipeIngredient[]>>(new Map());
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);

  const categories = [
    'All',
    'Breakfast',
    'Soup',
    'Main Course',
    'Side Dish',
    'Salad',
    'Dessert',
    'Snack',
  ];

  const recipeCategories = categories.slice(1); // All categories except 'All'

  const refreshProducts = useCallback(async () => {
    try {
      const data = await db.getProducts();
      setProducts(data);
    } catch (error) {
      console.error('Failed to refresh products:', error);
    }
  }, []);

  const refreshRecipes = useCallback(async () => {
    try {
      const data = await db.getRecipes();
      setRecipes(data);
    } catch (error) {
      console.error('Failed to refresh recipes:', error);
    }
  }, []);

  const refreshRecipeIngredients = useCallback(async () => {
    const allRecipes = await db.getRecipes();
    const entries = await Promise.all(
      allRecipes.map(async (recipe) => {
        const ingredients = await db.getRecipeIngredients(recipe.id);
        return [recipe.id, ingredients] as const;
      })
    );

    setRecipeIngredients(new Map(entries));
  }, []);

  useEffect(() => {
    if (!token) {
      setProducts([]);
      setRecipes([]);
      setRecipeIngredients(new Map());
      setLoading(false);
      return;
    }

    const init = async () => {
      setLoading(true);
      await refreshProducts();
      await refreshRecipes();
      await refreshRecipeIngredients();
      setLoading(false);
    };
    init();
  }, [token, refreshProducts, refreshRecipeIngredients, refreshRecipes]);

  const addProduct = useCallback(async (name: string, quantity: number, unit: string) => {
    await db.addProduct(name, quantity, unit);
    await refreshProducts();
  }, [refreshProducts]);

  const updateProduct = useCallback(async (id: number, updates: ProductUpdateInput) => {
    await db.updateProduct(id, updates);
    await refreshProducts();
  }, [refreshProducts]);

  const deleteProduct = useCallback(async (id: number) => {
    await db.deleteProduct(id);
    await refreshProducts();
  }, [refreshProducts]);

  const addRecipe = useCallback(async (recipe: RecipeInput): Promise<number> => {
    const id = await db.addRecipe(recipe);
    await refreshRecipes();
    return id;
  }, [refreshRecipes]);

  const updateRecipe = useCallback(async (recipe: Recipe) => {
    await db.updateRecipe(recipe);
    await refreshRecipes();
  }, [refreshRecipes]);

  const deleteRecipe = useCallback(async (id: number) => {
    await db.deleteRecipe(id);
    await refreshRecipes();
    await refreshRecipeIngredients();
  }, [refreshRecipeIngredients, refreshRecipes]);

  const cookRecipe = useCallback(async (recipeId: number) => {
    await db.cookRecipe(recipeId);
    await refreshRecipes();
  }, [refreshRecipes]);

  const cookRecipeWithIngredients = useCallback(
    async (recipeId: number, usedIngredients: { productName: string; amountUsed: number }[]) => {
      await db.cookRecipe(recipeId, usedIngredients);
      await refreshProducts();
      await refreshRecipes();
    },
    [refreshProducts, refreshRecipes]
  );

  const getRecipeIngredients = useCallback((recipeId: number): RecipeIngredient[] => {
    return recipeIngredients.get(recipeId) || [];
  }, [recipeIngredients]);

  const addRecipeIngredient = useCallback(async (recipeId: number, productName: string, amountRequired: number) => {
    await db.addRecipeIngredient(recipeId, productName, amountRequired);
    const ingredients = await db.getRecipeIngredients(recipeId);
    setRecipeIngredients((prev) => new Map(prev).set(recipeId, ingredients));
  }, []);

  const updateRecipeIngredient = useCallback(async (id: number, productName: string, amountRequired: number) => {
    await db.updateRecipeIngredient(id, productName, amountRequired);

    setRecipeIngredients((prev) => {
      const next = new Map(prev);

      for (const [recipeId, ingredients] of next.entries()) {
        const ingredientIndex = ingredients.findIndex((ingredient) => ingredient.id === id);
        if (ingredientIndex === -1) continue;

        const updatedIngredients = [...ingredients];
        updatedIngredients[ingredientIndex] = {
          ...updatedIngredients[ingredientIndex],
          product_name: productName,
          amount_required: amountRequired,
        };

        next.set(recipeId, updatedIngredients);
        break;
      }

      return next;
    });
  }, []);

  const deleteRecipeIngredient = useCallback(async (id: number) => {
    await db.deleteRecipeIngredient(id);

    setRecipeIngredients((prev) => {
      const next = new Map(prev);

      for (const [recipeId, ingredients] of next.entries()) {
        const filtered = ingredients.filter((ingredient) => ingredient.id !== id);
        if (filtered.length !== ingredients.length) {
          next.set(recipeId, filtered);
          break;
        }
      }

      return next;
    });
  }, []);

  const value: AppContextType = {
    products,
    recipes,
    recipeIngredients,
    loading,
    categories,
    recipeCategories,
    refreshProducts,
    refreshRecipes,
    getRecipeIngredients,
    addProduct,
    updateProduct,
    deleteProduct,
    addRecipe,
    updateRecipe,
    deleteRecipe,
    cookRecipe,
    cookRecipeWithIngredients,
    addRecipeIngredient,
    updateRecipeIngredient,
    deleteRecipeIngredient,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within AppProvider');
  }
  return context;
};
