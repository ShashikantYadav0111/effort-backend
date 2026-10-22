import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { config } from '../config.js';
import { User } from '../models/User.js';
import { Food } from '../models/Food.js';
import { SEED_FOODS } from '../seedFoods.js';
import { validate } from '../middleware/validate.js';

const router = Router();

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many attempts. Try again in a few minutes.' },
});

const credentials = z.object({
  email: z.string().trim().toLowerCase().email().max(200),
  password: z.string().min(8, 'Password must be at least 8 characters').max(200),
});

const sign = (user) =>
  jwt.sign({ sub: String(user._id) }, config.jwtSecret, { expiresIn: config.jwtExpiresIn });

const session = (user) => ({ token: sign(user), user: { id: String(user._id), email: user.email } });

router.post('/register', limiter, validate(credentials), async (req, res) => {
  if (!config.allowRegistration) return res.status(403).json({ error: 'Registration is disabled' });
  const { email, password } = req.body;
  if (await User.exists({ email })) return res.status(409).json({ error: 'An account with this email already exists' });

  const user = await User.create({ email, passwordHash: await bcrypt.hash(password, 12) });
  await Food.insertMany(SEED_FOODS.map((f) => ({ ...f, user: user._id })));
  res.status(201).json(session(user));
});

router.post('/login', limiter, validate(credentials), async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  const ok = user && (await bcrypt.compare(password, user.passwordHash));
  if (!ok) return res.status(401).json({ error: 'Invalid email or password' });
  res.json(session(user));
});

export default router;
