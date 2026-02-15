import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { env } from '../config/env.js';

export const requireAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const token = authHeader.substring('Bearer '.length);

  try {
    const payload = jwt.verify(token, env.jwtSecret);

    const resolvedUserId = payload.userId || payload.id;
    if (!resolvedUserId || !mongoose.Types.ObjectId.isValid(resolvedUserId)) {
      return res.status(401).json({ message: 'Invalid token payload' });
    }

    req.user = {
      userId: resolvedUserId,
      email: payload.email,
    };
    return next();
  } catch {
    return res.status(401).json({ message: 'Invalid token' });
  }
};
