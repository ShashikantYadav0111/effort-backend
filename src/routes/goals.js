import { Router } from 'express';
import { z } from 'zod';
import { Goal } from '../models/Goal.js';
import { Habit } from '../models/Habit.js';
import { Log } from '../models/Log.js';
import { validate } from '../middleware/validate.js';
import { checkId, dateStr } from '../utils.js';

const router = Router();
router.param('id', checkId);

// Goals with `progress` = total logged across every habit linked to the goal.
router.get('/', async (req, res) => {
  const goals = await Goal.find({ user: req.userId }).sort({ _id: -1 });
  const habits = goals.length
    ? await Habit.find({ user: req.userId, goalId: { $in: goals.map((g) => g._id) } }).select('_id goalId')
    : [];
  const sums = habits.length
    ? await Log.aggregate([
        { $match: { user: req.userId, habitId: { $in: habits.map((h) => h._id) } } },
        { $group: { _id: '$habitId', total: { $sum: '$quantity' } } },
      ])
    : [];

  const perHabit = new Map(sums.map((s) => [String(s._id), s.total]));
  const perGoal = new Map();
  for (const h of habits) {
    const key = String(h.goalId);
    perGoal.set(key, (perGoal.get(key) ?? 0) + (perHabit.get(String(h._id)) ?? 0));
  }
  res.json(goals.map((g) => ({ ...g.toJSON(), progress: perGoal.get(g.id) ?? 0 })));
});

router.post(
  '/',
  validate(
    z.object({
      title: z.string().trim().min(1).max(120),
      target: z.number().positive().max(1e9),
      unit: z.string().trim().min(1).max(30),
      deadline: dateStr.nullable(),
    })
  ),
  async (req, res) => {
    res.status(201).json(await Goal.create({ ...req.body, user: req.userId }));
  }
);

// Cascade: linked habits and their logs go too.
router.delete('/:id', async (req, res) => {
  const goal = await Goal.findOneAndDelete({ _id: req.params.id, user: req.userId });
  if (!goal) return res.status(404).json({ error: 'Goal not found' });
  const habits = await Habit.find({ user: req.userId, goalId: goal._id }).select('_id');
  const ids = habits.map((h) => h._id);
  if (ids.length) {
    await Log.deleteMany({ user: req.userId, habitId: { $in: ids } });
    await Habit.deleteMany({ user: req.userId, _id: { $in: ids } });
  }
  res.status(204).end();
});

export default router;
