import mongoose from 'mongoose';

const usedIngredientSchema = new mongoose.Schema(
  {
    product_name: {
      type: String,
      required: true,
      trim: true,
    },
    amount_used: {
      type: Number,
      required: true,
      min: 0,
    },
    unit: {
      type: String,
      default: '',
      trim: true,
    },
  },
  { _id: false }
);

const cookingHistorySchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    id: {
      type: Number,
      required: true,
    },
    recipe_id: {
      type: Number,
      required: true,
      index: true,
    },
    recipe_title: {
      type: String,
      default: '',
      trim: true,
    },
    used_ingredients: {
      type: [usedIngredientSchema],
      default: [],
    },
    cooked_at: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

cookingHistorySchema.index({ ownerId: 1, id: 1 }, { unique: true });

export const CookingHistory = mongoose.model('CookingHistory', cookingHistorySchema);
