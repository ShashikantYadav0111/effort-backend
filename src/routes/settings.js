import { Router } from 'express';
import { z } from 'zod';
import { Setting } from '../models/Setting.js';
import { validate } from '../middleware/validate.js';

const router = Router();

router.get('/', async (req, res) => {
  const rows = await Setting.find({ user: req.userId });
  res.json(Object.fromEntries(rows.map((r) => [r.key, r.value])));
});

router.put(
  '/',
  validate(z.object({ key: z.string().regex(/^[a-z_]{1,40}$/), value: z.string().max(200) })),
  async (req, res) => {
    const { key, value } = req.body;
    await Setting.findOneAndUpdate({ user: req.userId, key }, { $set: { value } }, { upsert: true });
    res.json({ key, value });
  }
);

export default router;
