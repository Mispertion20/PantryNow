import mongoose from 'mongoose';

const recipeSchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
      index: true,
    },
    id: {
      type: Number,
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    image_url: {
      type: String,
      default: '',
      trim: true,
    },
    image_data: {
      type: String,
      default: '',
    },
    category: {
      type: String,
      default: 'Main Course',
      trim: true,
    },
    cooking_time: {
      type: Number,
      default: 0,
      min: 0,
    },
    times_cooked: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

recipeSchema.index({ ownerId: 1, id: 1 }, { unique: true });
recipeSchema.index({ id: 1 }, { unique: true });

export const Recipe = mongoose.model('Recipe', recipeSchema);
