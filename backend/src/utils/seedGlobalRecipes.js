import { Recipe } from '../models/Recipe.js';
import { RecipeIngredient } from '../models/RecipeIngredient.js';
import { getNextId } from './counter.js';

const globalRecipes = [
  {
    title: 'Classic Pancakes',
    description: 'Fluffy homemade pancakes served warm with butter and syrup.',
    category: 'Breakfast',
    cooking_time: 20,
    ingredients: [
      { product_name: 'All-purpose flour', amount_required: 180 },
      { product_name: 'Milk', amount_required: 240 },
      { product_name: 'Eggs', amount_required: 2 },
      { product_name: 'Sugar', amount_required: 25 },
      { product_name: 'Baking powder', amount_required: 10 },
      { product_name: 'Salt', amount_required: 2 },
      { product_name: 'Butter', amount_required: 30 },
      { product_name: 'Vanilla extract', amount_required: 5 },
    ],
  },
  {
    title: 'Tomato Soup',
    description: 'Rich and silky tomato soup finished with cream and basil.',
    category: 'Soup',
    cooking_time: 35,
    ingredients: [
      { product_name: 'Tomatoes', amount_required: 800 },
      { product_name: 'Onion', amount_required: 150 },
      { product_name: 'Garlic', amount_required: 12 },
      { product_name: 'Olive oil', amount_required: 20 },
      { product_name: 'Vegetable broth', amount_required: 500 },
      { product_name: 'Tomato paste', amount_required: 30 },
      { product_name: 'Heavy cream', amount_required: 60 },
      { product_name: 'Fresh basil', amount_required: 10 },
    ],
  },
  {
    title: 'Chicken Fried Rice',
    description: 'Wok-style fried rice with tender chicken, eggs, and vegetables.',
    category: 'Main Course',
    cooking_time: 30,
    ingredients: [
      { product_name: 'Cooked rice', amount_required: 450 },
      { product_name: 'Chicken breast', amount_required: 300 },
      { product_name: 'Eggs', amount_required: 2 },
      { product_name: 'Carrot', amount_required: 80 },
      { product_name: 'Green peas', amount_required: 90 },
      { product_name: 'Spring onion', amount_required: 40 },
      { product_name: 'Soy sauce', amount_required: 25 },
      { product_name: 'Sesame oil', amount_required: 10 },
    ],
  },
];

export const seedGlobalRecipes = async () => {
  for (const recipeTemplate of globalRecipes) {
    let recipe = await Recipe.findOne({ ownerId: null, title: recipeTemplate.title });

    if (!recipe) {
      const recipeId = await getNextId(null, 'recipes');
      recipe = await Recipe.create({
        ownerId: null,
        id: recipeId,
        title: recipeTemplate.title,
        description: recipeTemplate.description,
        category: recipeTemplate.category,
        cooking_time: recipeTemplate.cooking_time,
        times_cooked: 0,
        image_url: '',
        image_data: '',
      });
    } else {
      recipe.description = recipeTemplate.description;
      recipe.category = recipeTemplate.category;
      recipe.cooking_time = recipeTemplate.cooking_time;
      await recipe.save();
    }

    await RecipeIngredient.deleteMany({ recipe_id: recipe.id });

    for (const ingredientTemplate of recipeTemplate.ingredients) {
      const ingredientId = await getNextId(null, 'recipe_ingredients');
      await RecipeIngredient.create({
        id: ingredientId,
        recipe_id: recipe.id,
        product_name: ingredientTemplate.product_name,
        amount_required: ingredientTemplate.amount_required,
      });
    }
  }
};
