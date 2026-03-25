import bcrypt from 'bcryptjs';
import express from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { requireAuth } from '../middleware/auth.js';
import { User } from '../models/User.js';

const router = express.Router();

const buildAuthPayload = (user) => ({
  id: user._id.toString(),
  name: user.name || '',
  email: user.email,
  avatar_data: user.avatar_data || '',
});

const createToken = (user) => {
  return jwt.sign(
    {
      userId: user._id.toString(),
      id: user._id.toString(),
      email: user.email,
    },
    env.jwtSecret,
    { expiresIn: '14d' }
  );
};

router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    const normalizedName = String(name || '').trim();
    if (normalizedName && normalizedName.length < 2) {
      return res.status(400).json({ message: 'Name must be at least 2 characters long' });
    }

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({ message: 'Email already registered' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await User.create({
      name: normalizedName,
      email: normalizedEmail,
      passwordHash,
      avatar_data: '',
    });

    const token = createToken(user);
    return res.status(201).json({ token, user: buildAuthPayload(user) });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to register user', details: error.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = createToken(user);
    return res.status(200).json({ token, user: buildAuthPayload(user) });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to login', details: error.message });
  }
});

router.get('/me', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.status(200).json({ data: buildAuthPayload(user) });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch user profile', details: error.message });
  }
});

router.put('/me', requireAuth, async (req, res) => {
  try {
    const { name, avatar_data } = req.body;
    const updates = {};

    if (name !== undefined) {
      const normalizedName = String(name || '').trim();
      if (normalizedName && normalizedName.length < 2) {
        return res.status(400).json({ message: 'Name must be at least 2 characters long' });
      }
      updates.name = normalizedName;
    }

    if (avatar_data !== undefined) {
      const normalizedAvatar = String(avatar_data || '');
      if (normalizedAvatar.length > 12_000_000) {
        return res.status(400).json({ message: 'Avatar image is too large' });
      }
      updates.avatar_data = normalizedAvatar;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: 'No profile fields provided to update' });
    }

    const user = await User.findByIdAndUpdate(req.user.userId, { $set: updates }, { new: true });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.status(200).json({ data: buildAuthPayload(user) });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to update profile', details: error.message });
  }
});

export default router;
