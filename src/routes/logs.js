import { Router } from 'express';
import { z } from 'zod';
import { Habit } from '../models/Habit.js';
import { Log } from '../models/Log.js';
import { validate } from '../middleware/validate.js';
import { dateStr, objectId } from '../utils.js';

const router = Router();

router.post(
  '/',
  validate(z.object({ habitId: objectId, date: dateStr, quantity: z.number().positive().max(1e7) })),
  async (req, res) => {
    const { habitId, date, quantity } = req.body;
    if (!(await Habit.exists({ _id: habitId, user: req.userId }))) {
      return res.status(404).json({ error: 'Habit not found' });
    }
    const log = await Log.create({ user: req.userId, habitId, date, quantity });
    res.status(201).json({ id: String(log._id) });
  }
);

// Removes the most recent entry for that habit on that day.
router.post('/undo', validate(z.object({ habitId: objectId, date: dateStr })), async (req, res) => {
  const { habitId, date } = req.body;
  await Log.findOneAndDelete({ user: req.userId, habitId, date }, { sort: { _id: -1 } });
  res.status(204).end();
});

// { [habitId]: total } for one day
router.get('/totals', validate(z.object({ date: dateStr }), 'query'), async (req, res) => {
  const rows = await Log.aggregate([
    { $match: { user: req.userId, date: req.parsedQuery.date } },
    { $group: { _id: '$habitId', total: { $sum: '$quantity' } } },
  ]);
  res.json(Object.fromEntries(rows.map((r) => [String(r._id), r.total])));
});

// [{ habitId, date, quantity }] between two days (inclusive)
router.get('/range', validate(z.object({ start: dateStr, end: dateStr }), 'query'), async (req, res) => {
  const { start, end } = req.parsedQuery;
  const rows = await Log.aggregate([
    { $match: { user: req.userId, date: { $gte: start, $lte: end } } },
    { $group: { _id: { habitId: '$habitId', date: '$date' }, quantity: { $sum: '$quantity' } } },
  ]);
  res.json(rows.map((r) => ({ habitId: String(r._id.habitId), date: r._id.date, quantity: r.quantity })));
});

export default router;
