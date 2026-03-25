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
    title: 'Scrambled Eggs',
    description: 'Soft and creamy scrambled eggs perfect for a quick breakfast.',
    category: 'Breakfast',
    cooking_time: 10,
    ingredients: [
      { product_name: 'Eggs', amount_required: 3 },
      { product_name: 'Milk', amount_required: 30 },
      { product_name: 'Butter', amount_required: 10 },
      { product_name: 'Salt', amount_required: 2 },
      { product_name: 'Black pepper', amount_required: 1 },
    ],
  },
  {
    title: 'Cheese Omelette',
    description: 'Classic omelette with melted cheese and light seasoning.',
    category: 'Breakfast',
    cooking_time: 12,
    ingredients: [
      { product_name: 'Eggs', amount_required: 3 },
      { product_name: 'Cheddar cheese', amount_required: 50 },
      { product_name: 'Butter', amount_required: 10 },
      { product_name: 'Salt', amount_required: 2 },
      { product_name: 'Black pepper', amount_required: 1 },
    ],
  },
  {
    title: 'French Toast',
    description: 'Golden pan-fried bread slices soaked in sweet egg mixture.',
    category: 'Breakfast',
    cooking_time: 15,
    ingredients: [
      { product_name: 'Bread slices', amount_required: 4 },
      { product_name: 'Eggs', amount_required: 2 },
      { product_name: 'Milk', amount_required: 80 },
      { product_name: 'Sugar', amount_required: 15 },
      { product_name: 'Butter', amount_required: 15 },
      { product_name: 'Cinnamon', amount_required: 2 },
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
    title: 'Chicken Noodle Soup',
    description: 'Comforting soup with chicken, noodles, and vegetables.',
    category: 'Soup',
    cooking_time: 40,
    ingredients: [
      { product_name: 'Chicken breast', amount_required: 250 },
      { product_name: 'Egg noodles', amount_required: 180 },
      { product_name: 'Carrot', amount_required: 100 },
      { product_name: 'Celery', amount_required: 80 },
      { product_name: 'Onion', amount_required: 120 },
      { product_name: 'Chicken broth', amount_required: 900 },
      { product_name: 'Salt', amount_required: 3 },
      { product_name: 'Black pepper', amount_required: 2 },
    ],
  },
  {
    title: 'Lentil Soup',
    description: 'Hearty lentil soup with vegetables and warm spices.',
    category: 'Soup',
    cooking_time: 45,
    ingredients: [
      { product_name: 'Red lentils', amount_required: 250 },
      { product_name: 'Onion', amount_required: 120 },
      { product_name: 'Carrot', amount_required: 100 },
      { product_name: 'Garlic', amount_required: 10 },
      { product_name: 'Tomato paste', amount_required: 25 },
      { product_name: 'Vegetable broth', amount_required: 900 },
      { product_name: 'Olive oil', amount_required: 20 },
      { product_name: 'Cumin', amount_required: 4 },
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
  {
    title: 'Spaghetti Aglio e Olio',
    description: 'Simple Italian pasta with garlic, olive oil, and chili flakes.',
    category: 'Main Course',
    cooking_time: 20,
    ingredients: [
      { product_name: 'Spaghetti', amount_required: 250 },
      { product_name: 'Garlic', amount_required: 16 },
      { product_name: 'Olive oil', amount_required: 45 },
      { product_name: 'Chili flakes', amount_required: 3 },
      { product_name: 'Parsley', amount_required: 10 },
      { product_name: 'Salt', amount_required: 3 },
    ],
  },
  {
    title: 'Grilled Chicken Salad',
    description: 'Fresh salad topped with juicy grilled chicken strips.',
    category: 'Salad',
    cooking_time: 25,
    ingredients: [
      { product_name: 'Chicken breast', amount_required: 250 },
      { product_name: 'Lettuce', amount_required: 150 },
      { product_name: 'Cucumber', amount_required: 100 },
      { product_name: 'Tomatoes', amount_required: 120 },
      { product_name: 'Olive oil', amount_required: 20 },
      { product_name: 'Lemon juice', amount_required: 15 },
      { product_name: 'Salt', amount_required: 2 },
      { product_name: 'Black pepper', amount_required: 1 },
    ],
  },
  {
    title: 'Beef Stir Fry',
    description: 'Quick beef stir fry with peppers and savory sauce.',
    category: 'Main Course',
    cooking_time: 25,
    ingredients: [
      { product_name: 'Beef strips', amount_required: 300 },
      { product_name: 'Bell pepper', amount_required: 150 },
      { product_name: 'Onion', amount_required: 120 },
      { product_name: 'Soy sauce', amount_required: 30 },
      { product_name: 'Garlic', amount_required: 12 },
      { product_name: 'Ginger', amount_required: 10 },
      { product_name: 'Vegetable oil', amount_required: 20 },
    ],
  },
  {
    title: 'Baked Salmon',
    description: 'Tender baked salmon with lemon and herbs.',
    category: 'Main Course',
    cooking_time: 22,
    ingredients: [
      { product_name: 'Salmon fillet', amount_required: 350 },
      { product_name: 'Olive oil', amount_required: 15 },
      { product_name: 'Lemon juice', amount_required: 15 },
      { product_name: 'Garlic', amount_required: 8 },
      { product_name: 'Salt', amount_required: 2 },
      { product_name: 'Black pepper', amount_required: 1 },
      { product_name: 'Dill', amount_required: 4 },
    ],
  },
  {
    title: 'Mashed Potatoes',
    description: 'Creamy buttery mashed potatoes as a versatile side dish.',
    category: 'Side Dish',
    cooking_time: 30,
    ingredients: [
      { product_name: 'Potatoes', amount_required: 700 },
      { product_name: 'Butter', amount_required: 50 },
      { product_name: 'Milk', amount_required: 120 },
      { product_name: 'Salt', amount_required: 3 },
      { product_name: 'Black pepper', amount_required: 2 },
    ],
  },
  {
    title: 'Garlic Bread',
    description: 'Crispy toasted bread with garlic butter and herbs.',
    category: 'Side Dish',
    cooking_time: 15,
    ingredients: [
      { product_name: 'Baguette', amount_required: 1 },
      { product_name: 'Butter', amount_required: 60 },
      { product_name: 'Garlic', amount_required: 12 },
      { product_name: 'Parsley', amount_required: 8 },
      { product_name: 'Salt', amount_required: 1 },
    ],
  },
  {
    title: 'Caesar Salad',
    description: 'Classic Caesar salad with crunchy croutons and parmesan.',
    category: 'Salad',
    cooking_time: 15,
    ingredients: [
      { product_name: 'Romaine lettuce', amount_required: 180 },
      { product_name: 'Parmesan', amount_required: 40 },
      { product_name: 'Croutons', amount_required: 60 },
      { product_name: 'Caesar dressing', amount_required: 50 },
      { product_name: 'Lemon juice', amount_required: 10 },
    ],
  },
  {
    title: 'Greek Salad',
    description: 'Refreshing salad with tomatoes, cucumber, olives, and feta.',
    category: 'Salad',
    cooking_time: 12,
    ingredients: [
      { product_name: 'Tomatoes', amount_required: 180 },
      { product_name: 'Cucumber', amount_required: 150 },
      { product_name: 'Red onion', amount_required: 60 },
      { product_name: 'Feta cheese', amount_required: 80 },
      { product_name: 'Olives', amount_required: 50 },
      { product_name: 'Olive oil', amount_required: 20 },
      { product_name: 'Oregano', amount_required: 2 },
    ],
  },
  {
    title: 'Chocolate Mug Cake',
    description: 'Single-serve chocolate cake made quickly in a mug.',
    category: 'Dessert',
    cooking_time: 8,
    ingredients: [
      { product_name: 'All-purpose flour', amount_required: 40 },
      { product_name: 'Sugar', amount_required: 25 },
      { product_name: 'Cocoa powder', amount_required: 15 },
      { product_name: 'Milk', amount_required: 45 },
      { product_name: 'Vegetable oil', amount_required: 20 },
      { product_name: 'Baking powder', amount_required: 3 },
    ],
  },
  {
    title: 'Banana Smoothie',
    description: 'Creamy banana smoothie for a quick and healthy snack.',
    category: 'Snack',
    cooking_time: 5,
    ingredients: [
      { product_name: 'Banana', amount_required: 2 },
      { product_name: 'Milk', amount_required: 250 },
      { product_name: 'Honey', amount_required: 15 },
      { product_name: 'Ice cubes', amount_required: 6 },
    ],
  },
  {
    title: 'Veggie Pasta',
    description: 'Simple pasta with sautéed vegetables and light seasoning.',
    category: 'Main Course',
    cooking_time: 25,
    ingredients: [
      { product_name: 'Pasta', amount_required: 250 },
      { product_name: 'Zucchini', amount_required: 120 },
      { product_name: 'Bell pepper', amount_required: 120 },
      { product_name: 'Cherry tomatoes', amount_required: 150 },
      { product_name: 'Garlic', amount_required: 10 },
      { product_name: 'Olive oil', amount_required: 25 },
      { product_name: 'Salt', amount_required: 3 },
    ],
  },
  {
    title: 'Vegetable Omelette',
    description: 'Protein-rich omelette loaded with onions, peppers, and tomatoes.',
    category: 'Breakfast',
    cooking_time: 14,
    ingredients: [
      { product_name: 'Eggs', amount_required: 3 },
      { product_name: 'Onion', amount_required: 40 },
      { product_name: 'Bell pepper', amount_required: 50 },
      { product_name: 'Tomato', amount_required: 40 },
      { product_name: 'Butter', amount_required: 10 },
      { product_name: 'Salt', amount_required: 2 },
      { product_name: 'Black pepper', amount_required: 1 },
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
