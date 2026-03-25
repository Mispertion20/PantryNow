import mongoose from 'mongoose';

const personalizationSurveySchema = new mongoose.Schema(
  {
    mainGoals: {
      type: [String],
      default: [],
    },
    dietChanges: {
      type: [String],
      default: [],
    },
    restrictions: {
      type: [String],
      default: ['no-restrictions'],
    },
    allergies: {
      type: [String],
      default: [],
    },
    otherRestriction: {
      type: String,
      trim: true,
      default: '',
      maxlength: 120,
    },
    cookingTime: {
      type: String,
      default: '',
    },
    activityLevel: {
      type: String,
      default: '',
    },
    mealPattern: {
      type: String,
      default: '',
    },
    priorities: {
      type: [String],
      default: [],
    },
    updatedAt: {
      type: Date,
      default: null,
    },
  },
  { _id: false }
);

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
    customInstructions: {
      type: String,
      trim: true,
      default: '',
      maxlength: 1500,
    },
    surveyCompleted: {
      type: Boolean,
      default: false,
    },
    personalizationSurvey: {
      type: personalizationSurveySchema,
      default: () => ({
        mainGoals: [],
        dietChanges: [],
        restrictions: ['no-restrictions'],
        allergies: [],
        otherRestriction: '',
        cookingTime: '',
        activityLevel: '',
        mealPattern: '',
        priorities: [],
        updatedAt: null,
      }),
    },
  },
  {
    timestamps: true,
  }
);

export const User = mongoose.model('User', userSchema);
