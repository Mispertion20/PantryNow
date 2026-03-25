import express from 'express';
import { User } from '../models/User.js';

const router = express.Router();

const MAIN_GOALS = new Set([
  'improve-overall-health',
  'reduce-weight',
  'gain-weight-muscle',
  'increase-energy-productivity',
  'improve-skin-hair',
  'eat-more-consciously',
]);

const DIET_CHANGES = new Set([
  'eat-more-vegetables-fruits',
  'reduce-sugar',
  'limit-fatty-foods',
  'cut-down-fast-food',
  'increase-protein',
  'drink-more-water',
  'eat-regularly',
]);

const RESTRICTIONS = new Set([
  'vegetarian',
  'vegan',
  'halal',
  'lactose-free',
  'gluten-free',
  'no-restrictions',
  'other',
]);

const COOKING_TIME = new Set(['minimum', 'medium', 'long']);
const ACTIVITY_LEVEL = new Set(['low', 'medium', 'high']);
const MEAL_PATTERN = new Set(['irregular', '2-3', '3-4', 'often-snack']);
const PRIORITIES = new Set([
  'fast-cooking',
  'availability-of-products',
  'taste',
  'health-benefits',
  'calorie-reduction',
]);

const normalizeString = (value) => String(value || '').trim().toLowerCase();

const sanitizeArray = (incoming, allowedValues, maxItems) => {
  if (!Array.isArray(incoming)) return [];
  const cleaned = incoming
    .map(normalizeString)
    .filter((value) => allowedValues.has(value));
  return Array.from(new Set(cleaned)).slice(0, maxItems);
};

const normalizeSurvey = (rawSurvey) => {
  const mainGoals = sanitizeArray(rawSurvey?.mainGoals, MAIN_GOALS, 2);
  const dietChanges = sanitizeArray(rawSurvey?.dietChanges, DIET_CHANGES, 12);
  let restrictions = sanitizeArray(rawSurvey?.restrictions, RESTRICTIONS, 5);
  const allergies = Array.isArray(rawSurvey?.allergies)
    ? Array.from(new Set(
      rawSurvey.allergies
        .map((value) => String(value || '').trim().toLowerCase())
        .filter((value) => value.length > 0)
        .slice(0, 15)
    ))
    : [];

  const cookingTime = normalizeString(rawSurvey?.cookingTime);
  const activityLevel = normalizeString(rawSurvey?.activityLevel);
  const mealPattern = normalizeString(rawSurvey?.mealPattern);
  const priorities = sanitizeArray(rawSurvey?.priorities, PRIORITIES, 2);

  if (restrictions.length === 0) {
    restrictions = ['no-restrictions'];
  }

  if (restrictions.includes('no-restrictions') && restrictions.length > 1) {
    restrictions = restrictions.filter((value) => value !== 'no-restrictions');
  }

  const otherRestriction = restrictions.includes('other')
    ? String(rawSurvey?.otherRestriction || '').trim().slice(0, 120)
    : '';

  if (!COOKING_TIME.has(cookingTime)) {
    throw new Error('Please select your cooking time preference.');
  }

  if (!ACTIVITY_LEVEL.has(activityLevel)) {
    throw new Error('Please select your activity level.');
  }

  if (!MEAL_PATTERN.has(mealPattern)) {
    throw new Error('Please select your meal pattern.');
  }

  if (mainGoals.length === 0) {
    throw new Error('Please select at least one main goal.');
  }

  if (priorities.length === 0) {
    throw new Error('Please select at least one priority.');
  }

  return {
    mainGoals,
    dietChanges,
    restrictions,
    allergies,
    otherRestriction,
    cookingTime,
    activityLevel,
    mealPattern,
    priorities,
    updatedAt: new Date(),
  };
};

router.get('/survey', async (req, res) => {
  try {
    const ownerId = req.user.userId;
    const user = await User.findById(ownerId).select({
      personalizationSurvey: 1,
      surveyCompleted: 1,
      _id: 0,
    });

    return res.status(200).json({
      data: {
        survey_completed: !!user?.surveyCompleted,
        survey: user?.personalizationSurvey || null,
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to fetch personalization survey',
      details: error.message,
    });
  }
});

router.put('/survey', async (req, res) => {
  try {
    const ownerId = req.user.userId;
    const normalizedSurvey = normalizeSurvey(req.body?.survey || {});

    const user = await User.findByIdAndUpdate(
      ownerId,
      {
        $set: {
          personalizationSurvey: normalizedSurvey,
          surveyCompleted: true,
        },
      },
      { new: true }
    ).select({
      personalizationSurvey: 1,
      surveyCompleted: 1,
      _id: 0,
    });

    return res.status(200).json({
      data: {
        survey_completed: !!user?.surveyCompleted,
        survey: user?.personalizationSurvey || normalizedSurvey,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid survey payload';
    const status = message.startsWith('Please select') ? 400 : 500;

    return res.status(status).json({
      message: status === 400 ? message : 'Failed to update personalization survey',
      details: status === 400 ? undefined : message,
    });
  }
});

router.get('/custom-instructions', async (req, res) => {
  try {
    const ownerId = req.user.userId;
    const user = await User.findById(ownerId).select({ customInstructions: 1, _id: 0 });

    return res.status(200).json({
      data: {
        custom_instructions: user?.customInstructions || '',
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to fetch custom instructions',
      details: error.message,
    });
  }
});

router.put('/custom-instructions', async (req, res) => {
  try {
    const ownerId = req.user.userId;
    const customInstructions = String(req.body?.custom_instructions || '').trim();

    if (customInstructions.length > 1500) {
      return res.status(400).json({
        message: 'Custom instructions are too long (max 1500 characters).',
      });
    }

    const user = await User.findByIdAndUpdate(
      ownerId,
      { $set: { customInstructions } },
      { new: true }
    ).select({ customInstructions: 1, _id: 0 });

    return res.status(200).json({
      data: {
        custom_instructions: user?.customInstructions || customInstructions,
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to update custom instructions',
      details: error.message,
    });
  }
});

export default router;
