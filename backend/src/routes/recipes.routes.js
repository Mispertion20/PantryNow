import express from 'express';
import mongoose from 'mongoose';
import { CookingHistory } from '../models/CookingHistory.js';
import { Product } from '../models/Product.js';
import { Recipe } from '../models/Recipe.js';
import { RecipeIngredient } from '../models/RecipeIngredient.js';
import { User } from '../models/User.js';
import { getNextId } from '../utils/counter.js';
import { toRecipeDto, toRecipeIngredientDto } from '../utils/mappers.js';

const router = express.Router();

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const findAccessibleRecipe = async (ownerId, recipeId, session = null) => {
  const query = {
    id: recipeId,
    $or: [{ ownerId }, { ownerId: null }, { ownerId: { $exists: false } }],
  };

  const recipeQuery = Recipe.findOne(query);
  return session ? recipeQuery.session(session) : recipeQuery;
};

const findOwnerRecipe = async (ownerId, recipeId, session = null) => {
  const recipeQuery = Recipe.findOne({ ownerId, id: recipeId });
  return session ? recipeQuery.session(session) : recipeQuery;
};

router.get('/', async (req, res) => {
  try {
    const ownerId = req.user.userId;
    const user = await User.findById(ownerId).select({ likedRecipeIds: 1, _id: 0 });
    const likedSet = new Set(user?.likedRecipeIds || []);

    const recipes = await Recipe.find({
      $or: [{ ownerId }, { ownerId: null }, { ownerId: { $exists: false } }],
    }).sort({ id: 1 });
    return res.status(200).json({
      data: recipes.map((recipe) => ({
        ...toRecipeDto(recipe),
        is_liked: likedSet.has(recipe.id),
      })),
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch recipes', details: error.message });
  }
});

router.get('/liked', async (req, res) => {
  try {
    const ownerId = req.user.userId;
    const user = await User.findById(ownerId).select({ likedRecipeIds: 1, _id: 0 });
    const likedRecipeIds = user?.likedRecipeIds || [];

    if (likedRecipeIds.length === 0) {
      return res.status(200).json({ data: [] });
    }

    const recipes = await Recipe.find({
      id: { $in: likedRecipeIds },
      $or: [{ ownerId }, { ownerId: null }, { ownerId: { $exists: false } }],
    }).sort({ id: 1 });

    const recipeById = new Map(recipes.map((recipe) => [recipe.id, recipe]));
    const ordered = likedRecipeIds
      .map((id) => recipeById.get(id))
      .filter(Boolean)
      .map((recipe) => ({
        ...toRecipeDto(recipe),
        is_liked: true,
      }));

    return res.status(200).json({ data: ordered });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch liked recipes', details: error.message });
  }
});

router.post('/:id/like', async (req, res) => {
  try {
    const ownerId = req.user.userId;
    const id = Number(req.params.id);

    if (Number.isNaN(id)) {
      return res.status(400).json({ message: 'Invalid recipe id' });
    }

    const recipe = await findAccessibleRecipe(ownerId, id);
    if (!recipe) {
      return res.status(404).json({ message: 'Recipe not found' });
    }

    const user = await User.findByIdAndUpdate(
      ownerId,
      { $addToSet: { likedRecipeIds: id } },
      { new: true }
    );

    return res.status(200).json({
      data: {
        recipe_id: id,
        is_liked: true,
        liked_recipe_ids: user?.likedRecipeIds || [],
      },
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to like recipe', details: error.message });
  }
});

router.delete('/:id/like', async (req, res) => {
  try {
    const ownerId = req.user.userId;
    const id = Number(req.params.id);

    if (Number.isNaN(id)) {
      return res.status(400).json({ message: 'Invalid recipe id' });
    }

    const user = await User.findByIdAndUpdate(
      ownerId,
      { $pull: { likedRecipeIds: id } },
      { new: true }
    );

    return res.status(200).json({
      data: {
        recipe_id: id,
        is_liked: false,
        liked_recipe_ids: user?.likedRecipeIds || [],
      },
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to unlike recipe', details: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const ownerId = req.user.userId;
    const {
      title,
      description = '',
      image_url = '',
      image_data = '',
      category = 'Main Course',
      cooking_time = 0,
    } = req.body;

    if (!title) {
      return res.status(400).json({ message: 'Recipe title is required' });
    }

    const normalizedCookingTime = Number(cooking_time);
    if (Number.isNaN(normalizedCookingTime) || normalizedCookingTime < 0) {
      return res.status(400).json({ message: 'Cooking time must be a valid non-negative number' });
    }

    const normalizedImageData = String(image_data || '');
    if (normalizedImageData.length > 12_000_000) {
      return res.status(400).json({ message: 'Image is too large' });
    }

    const id = await getNextId(null, 'recipes');
    const recipe = await Recipe.create({
      ownerId,
      id,
      title: String(title).trim(),
      description: String(description),
      image_url: String(image_url || '').trim(),
      image_data: normalizedImageData,
      category: String(category),
      cooking_time: normalizedCookingTime,
      times_cooked: 0,
    });

    return res.status(201).json({ data: toRecipeDto(recipe) });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to create recipe', details: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const ownerId = req.user.userId;
    const id = Number(req.params.id);

    if (Number.isNaN(id)) {
      return res.status(400).json({ message: 'Invalid recipe id' });
    }

    const { title, description, image_url, image_data, category, cooking_time } = req.body;

    const normalizedImageData = String(image_data || '');
    if (normalizedImageData.length > 12_000_000) {
      return res.status(400).json({ message: 'Image is too large' });
    }

    const recipe = await Recipe.findOneAndUpdate(
      { ownerId, id },
      {
        $set: {
          title: String(title).trim(),
          description: String(description),
          image_url: String(image_url || '').trim(),
          image_data: normalizedImageData,
          category: String(category),
          cooking_time: Number(cooking_time),
        },
      },
      { new: true }
    );

    if (!recipe) {
      return res.status(404).json({ message: 'Recipe not found' });
    }

    return res.status(200).json({ data: toRecipeDto(recipe) });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to update recipe', details: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const ownerId = req.user.userId;
    const id = Number(req.params.id);

    if (Number.isNaN(id)) {
      return res.status(400).json({ message: 'Invalid recipe id' });
    }

    await Recipe.deleteOne({ ownerId, id });
    await RecipeIngredient.deleteMany({ recipe_id: id });

    return res.status(204).send();
  } catch (error) {
    return res.status(500).json({ message: 'Failed to delete recipe', details: error.message });
  }
});

router.post('/:id/cook', async (req, res) => {
  const session = await mongoose.startSession();

  try {
    const ownerId = req.user.userId;
    const recipeId = Number(req.params.id);
    const usedIngredients = Array.isArray(req.body.usedIngredients) ? req.body.usedIngredients : [];

    if (Number.isNaN(recipeId)) {
      return res.status(400).json({ message: 'Invalid recipe id' });
    }

    await session.withTransaction(async () => {
      const recipe = await findAccessibleRecipe(ownerId, recipeId, session);
      if (!recipe) {
        throw new Error('Recipe not found');
      }

      const immutableUsedIngredients = [];

      for (const used of usedIngredients) {
        if (!used?.productName) continue;

        const normalizedName = String(used.productName).trim();
        if (!normalizedName) continue;

        const amountUsed = Number(used.amountUsed);
        if (Number.isNaN(amountUsed) || amountUsed < 0) continue;

        const product = await Product.findOne({
          ownerId,
          name: { $regex: `^${escapeRegex(normalizedName)}$`, $options: 'i' },
        }).session(session);

        if (!product) {
          continue;
        }

        if (amountUsed > product.quantity) {
          throw new Error(`Insufficient stock for ${product.name}`);
        }

        product.quantity = product.quantity - amountUsed;
        product.updated_at = new Date();
        await product.save({ session });

        immutableUsedIngredients.push({
          product_name: product.name,
          amount_used: amountUsed,
          unit: product.unit,
        });
      }

      recipe.times_cooked += 1;
      await recipe.save({ session });

      const historyId = await getNextId(ownerId, 'cooking_history', session);
      await CookingHistory.create(
        [
          {
            ownerId,
            id: historyId,
            recipe_id: recipeId,
            recipe_title: recipe.title,
            used_ingredients: immutableUsedIngredients,
            cooked_at: new Date(),
          },
        ],
        { session }
      );
    });

    return res.status(200).json({ message: 'Recipe cooked successfully' });
  } catch (error) {
    if (error?.message === 'Recipe not found') {
      return res.status(404).json({ message: 'Recipe not found' });
    }

    if (error?.message?.startsWith('Insufficient stock for')) {
      return res.status(400).json({ message: error.message });
    }

    return res.status(500).json({ message: 'Failed to cook recipe', details: error.message });
  } finally {
    session.endSession();
  }
});

router.get('/:id/ingredients', async (req, res) => {
  try {
    const ownerId = req.user.userId;
    const recipeId = Number(req.params.id);

    if (Number.isNaN(recipeId)) {
      return res.status(400).json({ message: 'Invalid recipe id' });
    }

    const recipe = await findAccessibleRecipe(ownerId, recipeId);
    if (!recipe) {
      return res.status(404).json({ message: 'Recipe not found' });
    }

    const ingredients = await RecipeIngredient.find({ recipe_id: recipeId }).sort({ id: 1 });
    return res.status(200).json({ data: ingredients.map(toRecipeIngredientDto) });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch recipe ingredients', details: error.message });
  }
});

router.post('/:id/ingredients', async (req, res) => {
  try {
    const ownerId = req.user.userId;
    const recipeId = Number(req.params.id);
    const { productName, amountRequired } = req.body;

    if (Number.isNaN(recipeId)) {
      return res.status(400).json({ message: 'Invalid recipe id' });
    }

    if (!productName || amountRequired == null) {
      return res.status(400).json({ message: 'Product name and amount required are mandatory' });
    }

    const recipe = await findOwnerRecipe(ownerId, recipeId);
    if (!recipe) {
      return res.status(403).json({ message: 'You can only modify your own recipes' });
    }

    const id = await getNextId(null, 'recipe_ingredients');

    const ingredient = await RecipeIngredient.create({
      id,
      recipe_id: recipeId,
      product_name: String(productName).trim(),
      amount_required: Number(amountRequired),
    });

    return res.status(201).json({ data: toRecipeIngredientDto(ingredient) });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to add recipe ingredient', details: error.message });
  }
});

export default router;
