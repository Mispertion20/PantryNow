import express from 'express';
import { CookingHistory } from '../models/CookingHistory.js';
import { toHistoryDto } from '../utils/mappers.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const ownerId = req.user.userId;
    const history = await CookingHistory.find({ ownerId }).sort({ cooked_at: -1 });
    return res.status(200).json({ data: history.map(toHistoryDto) });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch cooking history', details: error.message });
  }
});

export default router;
