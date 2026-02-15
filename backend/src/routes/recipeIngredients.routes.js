import express from 'express';
import { Recipe } from '../models/Recipe.js';
import { RecipeIngredient } from '../models/RecipeIngredient.js';
import { toRecipeIngredientDto } from '../utils/mappers.js';

const router = express.Router();

router.put('/:id', async (req, res) => {
  try {
    const ownerId = req.user.userId;
    const id = Number(req.params.id);
    const { productName, amountRequired } = req.body;

    if (Number.isNaN(id)) {
      return res.status(400).json({ message: 'Invalid ingredient id' });
    }

    const ingredient = await RecipeIngredient.findOne({ id });

    if (!ingredient) {
      return res.status(404).json({ message: 'Ingredient not found' });
    }

    const recipe = await Recipe.findOne({ id: ingredient.recipe_id, ownerId });
    if (!recipe) {
      return res.status(403).json({ message: 'You can only modify ingredients in your own recipes' });
    }

    ingredient.product_name = String(productName).trim();
    ingredient.amount_required = Number(amountRequired);
    await ingredient.save();

    return res.status(200).json({ data: toRecipeIngredientDto(ingredient) });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to update ingredient', details: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const ownerId = req.user.userId;
    const id = Number(req.params.id);

    if (Number.isNaN(id)) {
      return res.status(400).json({ message: 'Invalid ingredient id' });
    }

    const ingredient = await RecipeIngredient.findOne({ id });
    if (!ingredient) {
      return res.status(404).json({ message: 'Ingredient not found' });
    }

    const recipe = await Recipe.findOne({ id: ingredient.recipe_id, ownerId });
    if (!recipe) {
      return res.status(403).json({ message: 'You can only modify ingredients in your own recipes' });
    }

    await RecipeIngredient.deleteOne({ id });
    return res.status(204).send();
  } catch (error) {
    return res.status(500).json({ message: 'Failed to delete ingredient', details: error.message });
  }
});

export default router;
