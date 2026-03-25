import express from 'express';
import { CookingHistory } from '../models/CookingHistory.js';
import { Product } from '../models/Product.js';
import { Recipe } from '../models/Recipe.js';
import { RecipeIngredient } from '../models/RecipeIngredient.js';
import { chatCompletion, parseJsonResponse } from '../services/openai.js';
import { toRecipeDto } from '../utils/mappers.js';

const router = express.Router();

// ─── helpers ──────────────────────────────────────────────────────────────────

const buildRecipeContext = (recipe, ingredientsByRecipe) => {
  const ingredients = ingredientsByRecipe.get(recipe.id) || [];
  return {
    id: recipe.id,
    title: recipe.title,
    description: recipe.description || '',
    category: recipe.category,
    cooking_time: recipe.cooking_time,
    times_cooked: recipe.times_cooked,
    is_global: !recipe.ownerId,
    ingredients: ingredients.map((i) => ({
      name: i.product_name,
      amount: i.amount_required,
    })),
  };
};

// ─── POST /api/ai/recommendations ────────────────────────────────────────────

router.post('/recommendations', async (req, res) => {
  try {
    const ownerId = req.user.userId;

    // 1) Gather all user data in parallel
    const [products, recipes, history, allIngredients] = await Promise.all([
      Product.find({ ownerId }).sort({ id: 1 }),
      Recipe.find({
        $or: [{ ownerId }, { ownerId: null }, { ownerId: { $exists: false } }],
      }).sort({ id: 1 }),
      CookingHistory.find({ ownerId }).sort({ cooked_at: -1 }).limit(30),
      RecipeIngredient.find({}),
    ]);

    if (recipes.length === 0) {
      return res.status(200).json({
        data: {
          recommendations: [],
          reasoning: 'No recipes available yet. Create some recipes to get personalised suggestions!',
        },
      });
    }

    // 2) Build ingredient lookup by recipe id
    const ingredientsByRecipe = new Map();
    for (const ing of allIngredients) {
      if (!ingredientsByRecipe.has(ing.recipe_id)) {
        ingredientsByRecipe.set(ing.recipe_id, []);
      }
      ingredientsByRecipe.get(ing.recipe_id).push(ing);
    }

    // 3) Pantry snapshot
    const pantry = products.map((p) => ({
      name: p.name,
      quantity: p.quantity,
      unit: p.unit,
    }));

    // 4) Recipe catalogue with ingredients
    const recipeCatalogue = recipes.map((r) => buildRecipeContext(r, ingredientsByRecipe));

    // 5) Cooking history summary
    const historyList = history.map((h) => ({
      recipe_id: h.recipe_id,
      recipe_title: h.recipe_title,
      cooked_at: h.cooked_at,
    }));

    // 6) Frequency ranking (favourites = most cooked)
    const frequencyMap = {};
    for (const r of recipes) {
      if (r.times_cooked > 0) frequencyMap[r.id] = r.times_cooked;
    }

    // 7) Current time-of-day context
    const hour = new Date().getHours();
    const mealTime = hour < 12 ? 'breakfast' : hour < 18 ? 'lunch' : 'dinner';

    // 8) Build the OpenAI prompt
    const systemPrompt = `You are PantryNow's intelligent recipe recommendation engine.

Your task: Given the user's pantry, their full recipe catalogue (with ingredients), their cooking history and favourites, recommend the BEST recipes for them right now.

Recommendation priorities (in order):
1. **Cookability** — prefer recipes whose ingredients are fully or mostly available in the pantry.
2. **User favourites** — recipes the user has cooked most frequently should be weighted higher.
3. **Recent history** — avoid recommending what was just cooked; suggest variety.
4. **Taste similarity** — if the user frequently cooks certain ingredient combinations (e.g. eggs + cheese), recommend other recipes that share similar ingredients or flavour profile.
5. **Time-of-day** — it is currently ${mealTime} time, so prefer matching categories.
6. **Discovery** — include at least one recipe the user has never cooked, if available.

Important meal-time rule:
- If current_meal_time is lunch or dinner, avoid breakfast-heavy recipes unless there are very few suitable alternatives.
- If current_meal_time is breakfast, breakfast recipes should be prioritized.

Return ONLY a JSON object (no markdown) with this exact shape:
{
  "recommendations": [
    {
      "recipe_id": <number>,
      "score": <number 0-100>,
      "reason": "<short explanation why this is recommended>",
      "tags": ["<tag>"]   // e.g. "favourite", "pantry-ready", "new-discovery", "similar-taste"
    }
  ],
  "reasoning": "<1-2 sentence overall summary of the recommendation strategy>"
}

Return between 3 and 6 recommendations, sorted by score descending.
Only recommend recipes that exist in the catalogue. Use their exact recipe_id values.`;

    const userMessage = JSON.stringify({
      current_meal_time: mealTime,
      pantry,
      recipes: recipeCatalogue,
      cooking_history: historyList,
      frequency: frequencyMap,
    });

    const raw = await chatCompletion(systemPrompt, userMessage, {
      temperature: 0.6,
      maxTokens: 1200,
      json: true,
    });

    const parsed = parseJsonResponse(raw);

    if (!parsed || !Array.isArray(parsed.recommendations)) {
      return res.status(200).json({
        data: {
          recommendations: [],
          reasoning: 'Could not generate recommendations at this time. Please try again.',
        },
      });
    }

    // 9) Enrich recommendations with full recipe data
    const recipeMap = new Map(recipes.map((r) => [r.id, r]));
    const enriched = parsed.recommendations
      .filter((rec) => recipeMap.has(rec.recipe_id))
      .map((rec) => {
        const recipe = recipeMap.get(rec.recipe_id);
        const ingredients = ingredientsByRecipe.get(rec.recipe_id) || [];

        // Compute availability percentage
        const totalIngredients = ingredients.length;
        const availableCount = ingredients.filter((ing) => {
          const product = products.find(
            (p) => p.name.toLowerCase() === ing.product_name.toLowerCase()
          );
          return product && product.quantity >= ing.amount_required;
        }).length;

        return {
          recipe: toRecipeDto(recipe),
          score: rec.score,
          reason: rec.reason,
          tags: rec.tags || [],
          availability: {
            total: totalIngredients,
            available: availableCount,
            percentage: totalIngredients > 0
              ? Math.round((availableCount / totalIngredients) * 100)
              : 100,
          },
        };
      });

    const preferredCategoriesByMeal = {
      breakfast: new Set(['Breakfast']),
      lunch: new Set(['Main Course', 'Soup', 'Salad', 'Side Dish']),
      dinner: new Set(['Main Course', 'Soup', 'Salad', 'Side Dish']),
    };

    const preferredCategories = preferredCategoriesByMeal[mealTime] || new Set();

    const reranked = enriched
      .map((entry) => {
        const category = entry.recipe.category;
        const matchesMealTime = preferredCategories.has(category);

        let adjustedScore = Number(entry.score) || 0;

        if (matchesMealTime) {
          adjustedScore += 15;
        } else if (mealTime !== 'breakfast' && category === 'Breakfast') {
          adjustedScore -= 25;
        } else {
          adjustedScore -= 8;
        }

        return {
          ...entry,
          score: Math.max(0, Math.min(100, adjustedScore)),
        };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 6);

    return res.status(200).json({
      data: {
        recommendations: reranked,
        reasoning: parsed.reasoning || '',
      },
    });
  } catch (error) {
    console.error('AI recommendations error:', error);

    if (error?.message?.includes('API key')) {
      return res.status(503).json({
        message: 'AI service unavailable',
        details: 'OpenAI API key is not configured',
      });
    }

    return res.status(500).json({
      message: 'Failed to generate recommendations',
      details: error.message,
    });
  }
});

export default router;
