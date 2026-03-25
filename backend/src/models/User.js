import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      default: '',
      maxlength: 60,
      validate: {
        validator: (value) => !value || value.length >= 2,
        message: 'Name must be at least 2 characters long when provided',
      },
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    likedRecipeIds: {
      type: [Number],
      default: [],
    },
    recommendationGoal: {
      type: String,
      enum: ['deficit', 'surplus', 'neutral'],
      default: 'neutral',
    },
    avatar_data: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

export const User = mongoose.model('User', userSchema);
