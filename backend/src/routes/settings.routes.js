import express from 'express';
import { User } from '../models/User.js';

const router = express.Router();

const ALLOWED_RECOMMENDATION_GOALS = new Set(['deficit', 'surplus', 'neutral']);

router.get('/recommendation-goal', async (req, res) => {
  try {
    const ownerId = req.user.userId;
    const user = await User.findById(ownerId).select({ recommendationGoal: 1, _id: 0 });

    return res.status(200).json({
      data: {
        recommendation_goal: user?.recommendationGoal || 'neutral',
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to fetch recommendation goal',
      details: error.message,
    });
  }
});

router.put('/recommendation-goal', async (req, res) => {
  try {
    const ownerId = req.user.userId;
    const incomingGoal = String(req.body?.recommendation_goal || '').trim().toLowerCase();

    if (!ALLOWED_RECOMMENDATION_GOALS.has(incomingGoal)) {
      return res.status(400).json({
        message: 'Invalid recommendation goal. Allowed values: deficit, surplus, neutral',
      });
    }

    const user = await User.findByIdAndUpdate(
      ownerId,
      { $set: { recommendationGoal: incomingGoal } },
      { new: true }
    ).select({ recommendationGoal: 1, _id: 0 });

    return res.status(200).json({
      data: {
        recommendation_goal: user?.recommendationGoal || incomingGoal,
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to update recommendation goal',
      details: error.message,
    });
  }
});

export default router;
