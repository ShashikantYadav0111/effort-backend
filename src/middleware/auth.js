import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { config } from '../config.js';

export function requireAuth(req, res, next) {
  const [scheme, token] = (req.headers.authorization || '').split(' ');
  if (scheme !== 'Bearer' || !token) return res.status(401).json({ error: 'Not signed in' });
  try {
    const payload = jwt.verify(token, config.jwtSecret);
    req.userId = new mongoose.Types.ObjectId(payload.sub);
    next();
  } catch {
    res.status(401).json({ error: 'Session expired. Please sign in again.' });
  }
}
