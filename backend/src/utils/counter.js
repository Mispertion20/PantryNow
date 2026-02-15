import { CookingHistory } from '../models/CookingHistory.js';
import { Counter } from '../models/Counter.js';
import { Product } from '../models/Product.js';
import { Recipe } from '../models/Recipe.js';
import { RecipeIngredient } from '../models/RecipeIngredient.js';

const getCurrentMaxId = async (ownerId, key, session = null) => {
  switch (key) {
    case 'products': {
      const query = Product.findOne({ ownerId }).sort({ id: -1 }).select({ id: 1, _id: 0 });
      const row = session ? await query.session(session) : await query;
      return row?.id ?? 0;
    }
    case 'recipes': {
      const query = Recipe.findOne({}).sort({ id: -1 }).select({ id: 1, _id: 0 });
      const row = session ? await query.session(session) : await query;
      return row?.id ?? 0;
    }
    case 'recipe_ingredients': {
      const query = RecipeIngredient.findOne({}).sort({ id: -1 }).select({ id: 1, _id: 0 });
      const row = session ? await query.session(session) : await query;
      return row?.id ?? 0;
    }
    case 'cooking_history': {
      const query = CookingHistory.findOne({ ownerId }).sort({ id: -1 }).select({ id: 1, _id: 0 });
      const row = session ? await query.session(session) : await query;
      return row?.id ?? 0;
    }
    default:
      return 0;
  }
};

export const getNextId = async (ownerId, key, session = null) => {
  const counter = await Counter.findOneAndUpdate(
    { ownerId, key },
    { $inc: { nextId: 1 } },
    {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
      ...(session ? { session } : {}),
    }
  );

  const currentMax = await getCurrentMaxId(ownerId, key, session);
  if (currentMax >= counter.nextId) {
    counter.nextId = currentMax + 1;
    await counter.save(session ? { session } : undefined);
  }

  return counter.nextId;
};
