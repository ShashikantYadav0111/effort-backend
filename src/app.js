import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { config } from './config.js';
import { requireAuth } from './middleware/auth.js';
import { errorHandler } from './middleware/error.js';
import authRoutes from './routes/auth.js';
import habitRoutes from './routes/habits.js';
import logRoutes from './routes/logs.js';
import foodRoutes from './routes/foods.js';
import mealRoutes from './routes/meals.js';
import goalRoutes from './routes/goals.js';
import settingRoutes from './routes/settings.js';

const app = express();

app.set('trust proxy', 1); // behind Render/Railway/Fly/etc. so rate limiting sees real IPs
app.use(helmet());
app.use(
  cors({
    origin: config.corsOrigin === '*' ? true : config.corsOrigin.split(',').map((s) => s.trim()),
  })
);
app.use(express.json({ limit: '100kb' }));

app.get('/health', (req, res) => res.json({ ok: true }));

app.use('/api/auth', authRoutes);

// Everything below requires a valid token.
app.use('/api', requireAuth);
app.use('/api/habits', habitRoutes);
app.use('/api/logs', logRoutes);
app.use('/api/foods', foodRoutes);
app.use('/api/meals', mealRoutes);
app.use('/api/goals', goalRoutes);
app.use('/api/settings', settingRoutes);

app.use((req, res) => res.status(404).json({ error: 'Not found' }));
app.use(errorHandler);

export default app;
