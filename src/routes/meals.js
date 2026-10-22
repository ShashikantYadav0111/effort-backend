import { Router } from 'express';
import { z } from 'zod';
import { Food } from '../models/Food.js';
import { Meal } from '../models/Meal.js';
import { validate } from '../middleware/validate.js';
import { checkId, dateStr, objectId } from '../utils.js';

const router = Router();
router.param('id', checkId);

router.get('/', validate(z.object({ date: dateStr }), 'query'), async (req, res) => {
  const items = await Meal.find({ user: req.userId, date: req.parsedQuery.date })
    .sort({ _id: 1 })
    .populate('foodId');
  res.json(
    items
      .filter((m) => m.foodId)
      .map((m) => ({ id: m.id, mealType: m.mealType, servings: m.servings, food: m.foodId.toJSON() }))
  );
});

// { [date]: { kcal, protein, carbs, fat, fiber } }
router.get('/nutrition', validate(z.object({ start: dateStr, end: dateStr }), 'query'), async (req, res) => {
  const { start, end } = req.parsedQuery;
  const rows = await Meal.aggregate([
    { $match: { user: req.userId, date: { $gte: start, $lte: end } } },
    { $lookup: { from: 'foods', localField: 'foodId', foreignField: '_id', as: 'f' } },
    { $unwind: '$f' },
    {
      $group: {
        _id: '$date',
        kcal: { $sum: { $multiply: ['$f.kcal', '$servings'] } },
        protein: { $sum: { $multiply: ['$f.protein', '$servings'] } },
        carbs: { $sum: { $multiply: ['$f.carbs', '$servings'] } },
        fat: { $sum: { $multiply: ['$f.fat', '$servings'] } },
        fiber: { $sum: { $multiply: ['$f.fiber', '$servings'] } },
      },
    },
  ]);
  res.json(
    Object.fromEntries(
      rows.map((r) => [r._id, { kcal: r.kcal, protein: r.protein, carbs: r.carbs, fat: r.fat, fiber: r.fiber }])
    )
  );
});

router.post(
  '/',
  validate(
    z.object({
      date: dateStr,
      mealType: z.enum(['breakfast', 'lunch', 'dinner', 'snack']),
      foodId: objectId,
      servings: z.number().positive().max(1000),
    })
  ),
  async (req, res) => {
    if (!(await Food.exists({ _id: req.body.foodId, user: req.userId }))) {
      return res.status(404).json({ error: 'Food not found' });
    }
    const meal = await Meal.create({ ...req.body, user: req.userId });
    res.status(201).json({ id: String(meal._id) });
  }
);

router.delete('/:id', async (req, res) => {
  const meal = await Meal.findOneAndDelete({ _id: req.params.id, user: req.userId });
  if (!meal) return res.status(404).json({ error: 'Meal item not found' });
  res.status(204).end();
});

export default router;
