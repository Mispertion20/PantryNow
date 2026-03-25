import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 60,
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
  },
  {
    timestamps: true,
  }
);

export const User = mongoose.model('User', userSchema);
