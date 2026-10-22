import { Router } from 'express';
import { z } from 'zod';
import { Food } from '../models/Food.js';
import { validate } from '../middleware/validate.js';
import { checkId, escapeRegex } from '../utils.js';

const router = Router();
router.param('id', checkId);

const nutrient = z.number().min(0).max(100000);
const foodBody = z.object({
  name: z.string().trim().min(1).max(100),
  servingLabel: z.string().trim().min(1).max(100),
  kcal: nutrient,
  protein: nutrient,
  carbs: nutrient,
  fat: nutrient,
  fiber: nutrient,
});

router.get('/', validate(z.object({ search: z.string().max(100).optional() }), 'query'), async (req, res) => {
  const search = (req.parsedQuery.search ?? '').trim();
  const filter = { user: req.userId };
  if (search) filter.name = { $regex: escapeRegex(search), $options: 'i' };
  res.json(await Food.find(filter).collation({ locale: 'en' }).sort({ name: 1 }));
});

router.get('/:id', async (req, res) => {
  const food = await Food.findOne({ _id: req.params.id, user: req.userId });
  if (!food) return res.status(404).json({ error: 'Food not found' });
  res.json(food);
});

router.post('/', validate(foodBody), async (req, res) => {
  res.status(201).json(await Food.create({ ...req.body, user: req.userId }));
});

router.put('/:id', validate(foodBody), async (req, res) => {
  const food = await Food.findOneAndUpdate(
    { _id: req.params.id, user: req.userId },
    { $set: req.body },
    { new: true, runValidators: true }
  );
  if (!food) return res.status(404).json({ error: 'Food not found' });
  res.json(food);
});

export default router;
