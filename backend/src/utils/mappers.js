export const toProductDto = (product) => ({
  id: product.id,
  name: product.name,
  quantity: product.quantity,
  unit: product.unit,
  updated_at: product.updated_at?.toISOString?.() || new Date().toISOString(),
});

export const toRecipeDto = (recipe) => ({
  id: recipe.id,
  title: recipe.title,
  description: recipe.description,
  image_url: recipe.image_url || '',
  image_data: recipe.image_data || '',
  is_global: !recipe.ownerId,
  category: recipe.category,
  cooking_time: recipe.cooking_time,
  times_cooked: recipe.times_cooked,
});

export const toRecipeIngredientDto = (ingredient) => ({
  id: ingredient.id,
  recipe_id: ingredient.recipe_id,
  product_name: ingredient.product_name,
  amount_required: ingredient.amount_required,
});

export const toHistoryDto = (history) => ({
  id: history.id,
  recipe_id: history.recipe_id,
  recipe_title: history.recipe_title || '',
  used_ingredients: Array.isArray(history.used_ingredients)
    ? history.used_ingredients.map((ingredient) => ({
        product_name: ingredient.product_name,
        amount_used: ingredient.amount_used,
        unit: ingredient.unit || '',
      }))
    : [],
  cooked_at: history.cooked_at?.toISOString?.() || new Date().toISOString(),
});
