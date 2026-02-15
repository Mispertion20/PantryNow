import mongoose from 'mongoose';

const recipeIngredientSchema = new mongoose.Schema(
  {
    id: {
      type: Number,
      required: true,
    },
    recipe_id: {
      type: Number,
      required: true,
      index: true,
    },
    product_name: {
      type: String,
      required: true,
      trim: true,
    },
    amount_required: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

recipeIngredientSchema.index({ id: 1 }, { unique: true });

export const RecipeIngredient = mongoose.model('RecipeIngredient', recipeIngredientSchema);
