import express from 'express';
import { CookingHistory } from '../models/CookingHistory.js';
import { Product } from '../models/Product.js';
import { Recipe } from '../models/Recipe.js';
import { RecipeIngredient } from '../models/RecipeIngredient.js';
import { User } from '../models/User.js';
import { chatCompletion, parseJsonResponse } from '../services/openai.js';
import { toRecipeDto } from '../utils/mappers.js';

const router = express.Router();

const ALLOWED_TAGS = [
  'favourite',
  'pantry-ready',
  'quick-meal',
  'meal-time-fit',
  'similar-taste',
  'new-discovery',
];

const ALLOWED_RECOMMENDATION_GOALS = new Set(['deficit', 'surplus', 'neutral']);

const NUTRITION_KEYWORDS = [
  { keys: ['egg'], caloriesPer100g: 155, proteinPer100g: 13, fatsPer100g: 11, carbsPer100g: 1.1 },
  { keys: ['chicken', 'turkey'], caloriesPer100g: 165, proteinPer100g: 31, fatsPer100g: 3.6, carbsPer100g: 0 },
  { keys: ['beef'], caloriesPer100g: 250, proteinPer100g: 26, fatsPer100g: 15, carbsPer100g: 0 },
  { keys: ['salmon', 'fish'], caloriesPer100g: 208, proteinPer100g: 20, fatsPer100g: 13, carbsPer100g: 0 },
  { keys: ['cheese', 'parmesan', 'feta', 'cheddar'], caloriesPer100g: 402, proteinPer100g: 25, fatsPer100g: 33, carbsPer100g: 1.3 },
  { keys: ['rice', 'pasta', 'spaghetti', 'noodle', 'bread', 'flour', 'granola'], caloriesPer100g: 360, proteinPer100g: 10, fatsPer100g: 1.5, carbsPer100g: 76 },
  { keys: ['potato'], caloriesPer100g: 77, proteinPer100g: 2, fatsPer100g: 0.1, carbsPer100g: 17 },
  { keys: ['milk', 'yogurt', 'cream'], caloriesPer100g: 60, proteinPer100g: 3.5, fatsPer100g: 3.2, carbsPer100g: 4.8 },
  { keys: ['butter', 'oil', 'mayo', 'mayonnaise'], caloriesPer100g: 717, proteinPer100g: 0, fatsPer100g: 81, carbsPer100g: 0 },
  { keys: ['lentil', 'bean', 'peas'], caloriesPer100g: 116, proteinPer100g: 9, fatsPer100g: 0.4, carbsPer100g: 20 },
  { keys: ['banana', 'fruit', 'tomato', 'cucumber', 'lettuce', 'onion', 'carrot', 'zucchini'], caloriesPer100g: 45, proteinPer100g: 1.2, fatsPer100g: 0.3, carbsPer100g: 10 },
  { keys: ['sugar', 'honey'], caloriesPer100g: 387, proteinPer100g: 0, fatsPer100g: 0, carbsPer100g: 100 },
];

const DEFAULT_NUTRITION = {
  caloriesPer100g: 120,
  proteinPer100g: 4,
  fatsPer100g: 3,
  carbsPer100g: 18,
};

const resolveNutritionProfile = (ingredientName) => {
  const name = String(ingredientName || '').toLowerCase();
  return (
    NUTRITION_KEYWORDS.find((profile) => profile.keys.some((key) => name.includes(key))) ||
    DEFAULT_NUTRITION
  );
};

const estimateTotalsFromIngredients = (ingredients) => {
  return ingredients.reduce(
    (acc, ingredient) => {
      const amount = Number(ingredient.amount ?? ingredient.amount_required ?? ingredient.amount_used ?? 0);
      if (!Number.isFinite(amount) || amount <= 0) {
        return acc;
      }

      const grams = amount <= 20 ? amount * 30 : amount;
      const ratio = grams / 100;
      const profile = resolveNutritionProfile(ingredient.name || ingredient.product_name);

      acc.calories += ratio * profile.caloriesPer100g;
      acc.protein += ratio * profile.proteinPer100g;
      acc.fats += ratio * profile.fatsPer100g;
      acc.carbs += ratio * profile.carbsPer100g;
      return acc;
    },
    { calories: 0, protein: 0, fats: 0, carbs: 0 }
  );
};

const getFillingScore = ({ calories, protein, fats, carbs }) => {
  const raw = calories * 0.12 + protein * 2.4 + fats * 1.5 + carbs * 0.7;
  return Math.max(0, Math.min(100, Math.round(raw / 10)));
};

const getNextMealTarget = (fillingScore) => {
  if (fillingScore >= 70) {
    return {
      target: 'lighter',
      guidance: 'Previous meal was heavy, so the next recommendation should be lighter and easier to digest.',
    };
  }

  if (fillingScore <= 35) {
    return {
      target: 'filling',
      guidance: 'Previous meal was light, so the next recommendation should be more filling and nutrient-dense.',
    };
  }

  return {
    target: 'balanced',
    guidance: 'Previous meal was balanced, so keep the next recommendation moderate and well-rounded.',
  };
};

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

const pickVariant = (seed, variants) => {
  if (!Array.isArray(variants) || variants.length === 0) return '';
  const index = Math.abs(Number(seed) || 0) % variants.length;
  return variants[index];
};

const titleCaseMeal = (mealTime) => {
  if (!mealTime) return 'Meal';
  return String(mealTime).charAt(0).toUpperCase() + String(mealTime).slice(1);
};

const normalizeIngredientName = (name) => String(name || '').trim().toLowerCase();

const chooseUnitForIngredient = (ingredientName, pantryMap, fallbackUnit = 'g') => {
  const normalized = normalizeIngredientName(ingredientName);
  const pantry = pantryMap.get(normalized);
  if (pantry?.unit) return pantry.unit;
  return fallbackUnit;
};

const buildReadableRecommendationReasons = ({
  recipeTitle,
  recommendationGoal,
  nextMealTarget,
  mealTime,
  matchesMealTime,
  isLiked,
  timesCooked,
  availability,
  recipeFillingScore,
  category,
  topTasteMatches,
  seed,
}) => {
  const goalPhrase = recommendationGoal === 'deficit'
    ? pickVariant(seed + 1, [
        'supports your deficit target with a lighter profile',
        'fits your deficit mode by avoiding heavy options',
        'aligns with your goal to keep meals lighter',
      ])
    : recommendationGoal === 'surplus'
      ? pickVariant(seed + 1, [
          'supports your surplus target with a more filling profile',
          'fits your surplus mode by prioritizing dense meals',
          'aligns with your goal to increase meal fullness',
        ])
      : pickVariant(seed + 1, [
          'keeps a balanced profile for your neutral mode',
          'matches your neutral goal with moderate meal weight',
          'fits your balanced cooking preference',
        ]);

  const mealContextPhrase = nextMealTarget.target === 'lighter'
    ? pickVariant(seed + 2, [
        'chosen as a lighter follow-up to your last heavier meal',
        'selected to reduce meal heaviness after your previous dish',
        'prioritized as a lighter next step from your recent meal',
      ])
    : nextMealTarget.target === 'filling'
      ? pickVariant(seed + 2, [
          'chosen as a more filling follow-up to your last lighter meal',
          'selected to raise fullness after your recent light dish',
          'prioritized to bring more meal density next',
        ])
      : pickVariant(seed + 2, [
          'chosen to keep a balanced flow from your last meal',
          'selected to maintain your recent balanced meal rhythm',
          'prioritized as a steady next meal option',
        ]);

  const pantryPhrase = availability.total > 0
    ? `${availability.available}/${availability.total} ingredients are already available`
    : 'it has minimal pantry constraints';

  const preferencePhrase = isLiked
    ? 'you already liked this recipe, so your preference score is high'
    : timesCooked >= 2
      ? `you cooked this ${timesCooked} times, showing strong repeat preference`
      : timesCooked === 1
        ? 'you cooked this before, so it remains familiar'
        : 'it adds variety beyond your usual rotation';

  const mealFitPhrase = matchesMealTime
    ? `${titleCaseMeal(mealTime)} fit is strong because ${category} is in your preferred categories`
    : `${category} is less aligned with ${mealTime}, so it ranks below tighter meal-time matches`;

  const tasteMatchPhrase = topTasteMatches.length > 0
    ? `flavor continuity is high through ingredients you often use (${topTasteMatches.slice(0, 2).join(', ')})`
    : 'this option broadens your taste profile while still respecting your goal';

  const shortReason = pickVariant(seed + 3, [
    `${recipeTitle} ${goalPhrase}, and ${pantryPhrase}.`,
    `${recipeTitle} was prioritized because ${preferencePhrase}, with ${pantryPhrase}.`,
    `${recipeTitle} ranks high now because ${mealContextPhrase}, and ${pantryPhrase}.`,
  ]);

  const points = [
    `Goal fit: ${goalPhrase}.`,
    `Recent-meal logic: ${mealContextPhrase}.`,
    `Pantry reality: ${pantryPhrase}.`,
    `Personal preference: ${preferencePhrase}.`,
    `Meal-time priority: ${mealFitPhrase}.`,
    `Taste signal: ${tasteMatchPhrase}.`,
    `Engine factors combined: goal (${recommendationGoal}), pantry readiness, meal-time relevance, history/likes, and estimated filling score (${recipeFillingScore}/100).`,
  ];

  return { shortReason, points };
};

// ─── POST /api/ai/recommendations ────────────────────────────────────────────

router.post('/recommendations', async (req, res) => {
  try {
    const ownerId = req.user.userId;

    // 1) Gather all user data in parallel
    const [products, recipes, history, allIngredients, user] = await Promise.all([
      Product.find({ ownerId }).sort({ id: 1 }),
      Recipe.find({
        $or: [{ ownerId }, { ownerId: null }, { ownerId: { $exists: false } }],
      }).sort({ id: 1 }),
      CookingHistory.find({ ownerId }).sort({ cooked_at: -1 }).limit(30),
      RecipeIngredient.find({}),
      User.findById(ownerId).select({ likedRecipeIds: 1, recommendationGoal: 1, _id: 0 }),
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

    const likedRecipeIds = Array.isArray(user?.likedRecipeIds) ? user.likedRecipeIds : [];
    const recommendationGoal = ALLOWED_RECOMMENDATION_GOALS.has(user?.recommendationGoal)
      ? user.recommendationGoal
      : 'neutral';

    const recipeIngredientsById = new Map();
    for (const recipe of recipeCatalogue) {
      recipeIngredientsById.set(recipe.id, recipe.ingredients || []);
    }

    const lastMeal = history[0] || null;
    let previousMealNutrition = {
      recipe_id: null,
      recipe_title: '',
      calories: 0,
      protein: 0,
      fats: 0,
      carbs: 0,
      filling_score: 50,
    };

    if (lastMeal) {
      const mealIngredients = Array.isArray(lastMeal.used_ingredients) && lastMeal.used_ingredients.length > 0
        ? lastMeal.used_ingredients.map((ingredient) => ({
            name: ingredient.product_name,
            amount: ingredient.amount_used,
          }))
        : recipeIngredientsById.get(lastMeal.recipe_id) || [];

      const totals = estimateTotalsFromIngredients(mealIngredients);
      previousMealNutrition = {
        recipe_id: lastMeal.recipe_id,
        recipe_title: lastMeal.recipe_title || '',
        calories: Math.round(totals.calories),
        protein: Math.round(totals.protein),
        fats: Math.round(totals.fats),
        carbs: Math.round(totals.carbs),
        filling_score: getFillingScore(totals),
      };
    }

    const nextMealTarget = getNextMealTarget(previousMealNutrition.filling_score);

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
7. **Meal context & nutrition awareness** — adjust suggestions using previous meal nutrition context:
  - if previous meal was heavy -> recommend lighter meals
  - if previous meal was light -> recommend more filling meals
  - if previous meal was balanced -> keep recommendations balanced
8. **User goal personalization** — user's saved goal is "${recommendationGoal}":
  - deficit -> prioritize lighter/lower-calorie options
  - surplus -> prioritize more filling/higher-calorie options
  - neutral -> keep balanced recommendations

Important meal-time rule:
- If current_meal_time is lunch or dinner, avoid breakfast-heavy recipes unless there are very few suitable alternatives.
- If current_meal_time is breakfast, breakfast recipes should be prioritized.

Allowed tags (use ONLY these 6 values):
1. "favourite"      -> Recipe user cooks often / repeatedly.
2. "pantry-ready"   -> Most or all required ingredients are available.
3. "quick-meal"     -> Fast to prepare (short cooking time).
4. "meal-time-fit"  -> Category matches current meal time (${mealTime}).
5. "similar-taste"  -> Similar ingredients/flavor profile to user's frequent choices.
6. "new-discovery"  -> User has never cooked it or cooked very rarely.

Tag rules:
- Each recommendation must include 1 to 3 tags.
- Tags must come only from the 6 allowed values above.
- Do not invent new tag names.

Reasoning rule:
- "reason" for each recommendation must mention meal-context logic (lighter/filling/balanced) when relevant.

Return ONLY a JSON object (no markdown) with this exact shape:
{
  "recommendations": [
    {
      "recipe_id": <number>,
      "score": <number 0-100>,
      "reason": "<short explanation why this is recommended>",
      "tags": ["<tag>"]
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
      liked_recipe_ids: likedRecipeIds,
      recommendation_goal: recommendationGoal,
      previous_meal_nutrition: previousMealNutrition,
      next_meal_target: nextMealTarget,
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
          tags: Array.isArray(rec.tags)
            ? rec.tags
                .filter((tag) => ALLOWED_TAGS.includes(String(tag)))
                .slice(0, 3)
            : [],
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

    const cookedRecipes = recipes
      .filter((recipe) => recipe.times_cooked > 0)
      .sort((a, b) => b.times_cooked - a.times_cooked)
      .slice(0, 8);

    const favoriteIngredientsMap = new Map();
    for (const recipe of cookedRecipes) {
      const ings = recipeIngredientsById.get(recipe.id) || [];
      for (const ing of ings) {
        const key = String(ing.name || '').trim().toLowerCase();
        if (!key) continue;
        const current = favoriteIngredientsMap.get(key) || 0;
        favoriteIngredientsMap.set(key, current + Math.max(1, recipe.times_cooked));
      }
    }

    const topFavoriteIngredients = [...favoriteIngredientsMap.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 12)
      .map(([name]) => name);

    const reranked = enriched
      .map((entry) => {
        const category = entry.recipe.category;
        const matchesMealTime = preferredCategories.has(category);
        const isLiked = likedRecipeIds.includes(entry.recipe.id);
        const recipeIngredients = recipeIngredientsById.get(entry.recipe.id) || [];
        const recipeNutrition = estimateTotalsFromIngredients(recipeIngredients);
        const recipeFillingScore = getFillingScore(recipeNutrition);
        const isPantryReady =
          entry.availability.total > 0 &&
          entry.availability.available >= entry.availability.total;

        let adjustedScore = Number(entry.score) || 0;

        if (matchesMealTime) {
          adjustedScore += 15;
        } else if (mealTime !== 'breakfast' && category === 'Breakfast') {
          adjustedScore -= 25;
        } else {
          adjustedScore -= 8;
        }

        if (isLiked) {
          adjustedScore += 18;
        }

        if (nextMealTarget.target === 'lighter') {
          if (recipeFillingScore <= 45) adjustedScore += 14;
          if (recipeFillingScore >= 70) adjustedScore -= 12;
        } else if (nextMealTarget.target === 'filling') {
          if (recipeFillingScore >= 60) adjustedScore += 14;
          if (recipeFillingScore <= 35) adjustedScore -= 10;
        }

        if (recommendationGoal === 'deficit') {
          if (recipeFillingScore <= 45) adjustedScore += 16;
          if (recipeFillingScore >= 65) adjustedScore -= 14;
        } else if (recommendationGoal === 'surplus') {
          if (recipeFillingScore >= 60) adjustedScore += 16;
          if (recipeFillingScore <= 35) adjustedScore -= 10;
        }

        const aiSafeTags = entry.tags.filter((tag) => tag !== 'pantry-ready');
        const recipeIngredientNames = recipeIngredients
          .map((ingredient) => String(ingredient.name || '').trim().toLowerCase())
          .filter(Boolean);
        const topTasteMatches = recipeIngredientNames
          .filter((name) => topFavoriteIngredients.includes(name))
          .slice(0, 3);

        const { shortReason, points: whyThisRecipePoints } = buildReadableRecommendationReasons({
          recipeTitle: entry.recipe.title,
          recommendationGoal,
          nextMealTarget,
          mealTime,
          matchesMealTime,
          isLiked,
          timesCooked: entry.recipe.times_cooked,
          availability: entry.availability,
          recipeFillingScore,
          category,
          topTasteMatches,
          seed: entry.recipe.id + recipeFillingScore + entry.availability.percentage,
        });

        return {
          ...entry,
          reason: shortReason,
          why_this_recipe: whyThisRecipePoints.join(' '),
          why_this_recipe_points: whyThisRecipePoints,
          tags: Array.from(new Set([
            ...aiSafeTags,
            ...(isLiked ? ['favourite'] : []),
            ...(isPantryReady ? ['pantry-ready'] : []),
            ...(matchesMealTime ? ['meal-time-fit'] : []),
            ...(nextMealTarget.target === 'lighter' && recipeFillingScore <= 45 ? ['quick-meal'] : []),
          ])).filter((tag) => ALLOWED_TAGS.includes(tag)).slice(0, 3),
          score: Math.max(0, Math.min(100, adjustedScore)),
        };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 6)
      .map(({ score: _score, ...entryWithoutScore }) => entryWithoutScore);

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

router.post('/shopping-recommendations', async (req, res) => {
  try {
    const ownerId = req.user.userId;

    const [products, recipes, history, allIngredients, user] = await Promise.all([
      Product.find({ ownerId }).sort({ id: 1 }),
      Recipe.find({
        $or: [{ ownerId }, { ownerId: null }, { ownerId: { $exists: false } }],
      }).sort({ id: 1 }),
      CookingHistory.find({ ownerId }).sort({ cooked_at: -1 }).limit(30),
      RecipeIngredient.find({}),
      User.findById(ownerId).select({ likedRecipeIds: 1, recommendationGoal: 1, _id: 0 }),
    ]);

    if (recipes.length === 0) {
      return res.status(200).json({
        data: {
          suggestions: [],
          reasoning: 'No recipes are available yet, so shopping suggestions are not ready yet.',
        },
      });
    }

    const recommendationGoal = ALLOWED_RECOMMENDATION_GOALS.has(user?.recommendationGoal)
      ? user.recommendationGoal
      : 'neutral';
    const likedRecipeIds = new Set(Array.isArray(user?.likedRecipeIds) ? user.likedRecipeIds : []);

    const pantryMap = new Map(
      products.map((product) => [normalizeIngredientName(product.name), product])
    );

    const ingredientsByRecipe = new Map();
    for (const ingredient of allIngredients) {
      if (!ingredientsByRecipe.has(ingredient.recipe_id)) {
        ingredientsByRecipe.set(ingredient.recipe_id, []);
      }
      ingredientsByRecipe.get(ingredient.recipe_id).push(ingredient);
    }

    const hour = new Date().getHours();
    const mealTime = hour < 12 ? 'breakfast' : hour < 18 ? 'lunch' : 'dinner';
    const preferredCategoriesByMeal = {
      breakfast: new Set(['Breakfast']),
      lunch: new Set(['Main Course', 'Soup', 'Salad', 'Side Dish']),
      dinner: new Set(['Main Course', 'Soup', 'Salad', 'Side Dish']),
    };
    const preferredCategories = preferredCategoriesByMeal[mealTime] || new Set();

    const historyByRecipeId = new Map();
    for (const item of history) {
      historyByRecipeId.set(item.recipe_id, (historyByRecipeId.get(item.recipe_id) || 0) + 1);
    }

    const lastMeal = history[0] || null;
    let nextMealTarget = { target: 'balanced' };
    if (lastMeal) {
      const recipeIngredients = ingredientsByRecipe.get(lastMeal.recipe_id) || [];
      const mealIngredients = Array.isArray(lastMeal.used_ingredients) && lastMeal.used_ingredients.length > 0
        ? lastMeal.used_ingredients.map((ingredient) => ({
            name: ingredient.product_name,
            amount: ingredient.amount_used,
          }))
        : recipeIngredients.map((ingredient) => ({
            name: ingredient.product_name,
            amount: ingredient.amount_required,
          }));
      const totals = estimateTotalsFromIngredients(mealIngredients);
      nextMealTarget = getNextMealTarget(getFillingScore(totals));
    }

    const candidateMap = new Map();

    for (const recipe of recipes) {
      const recipeIngredients = ingredientsByRecipe.get(recipe.id) || [];
      if (recipeIngredients.length === 0) continue;

      const isLiked = likedRecipeIds.has(recipe.id);
      const cookedCount = recipe.times_cooked || historyByRecipeId.get(recipe.id) || 0;
      const mealFit = preferredCategories.has(recipe.category);

      const nutrition = estimateTotalsFromIngredients(
        recipeIngredients.map((ingredient) => ({
          name: ingredient.product_name,
          amount: ingredient.amount_required,
        }))
      );
      const fillingScore = getFillingScore(nutrition);

      let recipePriority = 35;
      recipePriority += Math.min(30, cookedCount * 4);
      if (isLiked) recipePriority += 22;
      if (mealFit) recipePriority += 12;

      if (nextMealTarget.target === 'lighter' && fillingScore <= 45) recipePriority += 10;
      if (nextMealTarget.target === 'filling' && fillingScore >= 60) recipePriority += 10;

      if (recommendationGoal === 'deficit') {
        if (fillingScore <= 45) recipePriority += 12;
        if (fillingScore >= 65) recipePriority -= 8;
      } else if (recommendationGoal === 'surplus') {
        if (fillingScore >= 60) recipePriority += 12;
        if (fillingScore <= 35) recipePriority -= 6;
      }

      for (const ingredient of recipeIngredients) {
        const ingredientName = normalizeIngredientName(ingredient.product_name);
        if (!ingredientName) continue;

        const requiredAmount = Number(ingredient.amount_required || 0);
        if (!Number.isFinite(requiredAmount) || requiredAmount <= 0) continue;

        const pantryProduct = pantryMap.get(ingredientName);
        const inPantryAmount = pantryProduct ? Number(pantryProduct.quantity || 0) : 0;
        const shortage = Math.max(0, requiredAmount - inPantryAmount);
        if (shortage <= 0) continue;

        const gapRatio = Math.min(1.5, shortage / requiredAmount);
        const contribution = Math.max(1, recipePriority * gapRatio);

        if (!candidateMap.has(ingredientName)) {
          candidateMap.set(ingredientName, {
            product_name: ingredient.product_name,
            unit: chooseUnitForIngredient(ingredient.product_name, pantryMap, 'g'),
            suggested_amount: 0,
            score: 0,
            recipe_ids: new Set(),
            recipe_titles: new Set(),
            liked_hits: 0,
            cooked_hits: 0,
            meal_fit_hits: 0,
          });
        }

        const candidate = candidateMap.get(ingredientName);
        candidate.suggested_amount += shortage;
        candidate.score += contribution;
        candidate.recipe_ids.add(recipe.id);
        candidate.recipe_titles.add(recipe.title);
        if (isLiked) candidate.liked_hits += 1;
        if (cookedCount > 0) candidate.cooked_hits += 1;
        if (mealFit) candidate.meal_fit_hits += 1;
      }
    }

    const suggestions = [...candidateMap.values()]
      .map((candidate, index) => {
        const amount = Math.max(1, Math.round(candidate.suggested_amount));
        const recipeTitles = [...candidate.recipe_titles].slice(0, 3);

        const reasonPoints = [];
        reasonPoints.push(`Needed by ${candidate.recipe_ids.size} recipe${candidate.recipe_ids.size > 1 ? 's' : ''}${recipeTitles.length > 0 ? `: ${recipeTitles.join(', ')}` : ''}.`);
        if (candidate.liked_hits > 0) {
          reasonPoints.push(`Strong preference signal: appears in ${candidate.liked_hits} liked recipe${candidate.liked_hits > 1 ? 's' : ''}.`);
        } else if (candidate.cooked_hits > 0) {
          reasonPoints.push(`Personal habit signal: appears in ${candidate.cooked_hits} frequently cooked recipe${candidate.cooked_hits > 1 ? 's' : ''}.`);
        } else {
          reasonPoints.push('Variety signal: helps unlock additional recipes you have not cooked often yet.');
        }
        if (candidate.meal_fit_hits > 0) {
          reasonPoints.push(`Meal-time signal: useful for your current ${mealTime} recommendations.`);
        }
        reasonPoints.push(`Goal signal: aligned with your ${recommendationGoal} mode and ${nextMealTarget.target} next-meal direction.`);

        const shortReason = pickVariant(
          amount + index + candidate.recipe_ids.size,
          [
            `${candidate.product_name} is missing for high-priority recipes in your current plan.`,
            `${candidate.product_name} helps you cook more of your preferred recipes this week.`,
            `${candidate.product_name} is one of the biggest pantry gaps based on your personalized ranking logic.`,
          ]
        );

        return {
          product_name: candidate.product_name,
          suggested_amount: amount,
          unit: candidate.unit,
          priority_score: Math.round(candidate.score),
          short_reason: shortReason,
          reason_points: reasonPoints,
          supporting_recipe_count: candidate.recipe_ids.size,
        };
      })
      .sort((a, b) => b.priority_score - a.priority_score)
      .slice(0, 8);

    const reasoning = suggestions.length > 0
      ? `These buy suggestions are ranked from your pantry gaps, favorite and frequent recipes, meal-time context (${mealTime}), and your ${recommendationGoal} goal.`
      : 'Your pantry already covers most high-priority ingredients. No urgent purchases are needed right now.';

    return res.status(200).json({
      data: {
        suggestions,
        reasoning,
      },
    });
  } catch (error) {
    console.error('AI shopping recommendations error:', error);
    return res.status(500).json({
      message: 'Failed to generate shopping recommendations',
      details: error.message,
    });
  }
});

export default router;
