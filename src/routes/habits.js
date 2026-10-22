import { Router } from 'express';
import { z } from 'zod';
import { Habit } from '../models/Habit.js';
import { Goal } from '../models/Goal.js';
import { Log } from '../models/Log.js';
import { validate } from '../middleware/validate.js';
import { TIME_RE, checkId, dateStr, objectId } from '../utils.js';

const router = Router();
router.param('id', checkId);

const habitBody = z.object({
  segment: z.enum(['daily', 'growth']),
  name: z.string().trim().min(1).max(100),
  unit: z.string().trim().min(1).max(30),
  dailyTarget: z.number().positive().max(1e7).nullable(),
  step: z.number().positive().max(1e7),
  conversions: z
    .array(z.object({ metric: z.string().trim().min(1).max(30), perUnit: z.number().positive().max(1e7) }))
    .max(10),
  activeDays: z.array(z.number().int().min(0).max(6)).min(1).max(7),
  goalId: objectId.nullable().optional(),
  reminder: z.string().regex(TIME_RE, 'Use HH:MM').nullable(),
});
const createBody = habitBody.extend({ createdOn: dateStr.optional() });

const listQuery = z.object({
  includeArchived: z.enum(['0', '1']).optional(),
  segment: z.enum(['daily', 'growth']).optional(),
});

const ownsGoal = async (userId, goalId) => !goalId || !!(await Goal.exists({ _id: goalId, user: userId }));

router.get('/', validate(listQuery, 'query'), async (req, res) => {
  const { includeArchived, segment } = req.parsedQuery;
  const filter = { user: req.userId };
  if (includeArchived !== '1') filter.archivedOn = null;
  if (segment) filter.segment = segment;
  res.json(await Habit.find(filter).sort({ _id: 1 }));
});

router.get('/:id', async (req, res) => {
  const habit = await Habit.findOne({ _id: req.params.id, user: req.userId });
  if (!habit) return res.status(404).json({ error: 'Habit not found' });
  res.json(habit);
});

router.post('/', validate(createBody), async (req, res) => {
  const { createdOn, ...rest } = req.body;
  if (!(await ownsGoal(req.userId, rest.goalId))) return res.status(400).json({ error: 'Unknown goal' });
  const habit = await Habit.create({
    ...rest,
    user: req.userId,
    createdOn: createdOn ?? new Date().toISOString().slice(0, 10),
  });
  res.status(201).json(habit);
});

router.put('/:id', validate(habitBody), async (req, res) => {
  if (!(await ownsGoal(req.userId, req.body.goalId))) return res.status(400).json({ error: 'Unknown goal' });
  const habit = await Habit.findOneAndUpdate(
    { _id: req.params.id, user: req.userId },
    { $set: req.body },
    { new: true, runValidators: true }
  );
  if (!habit) return res.status(404).json({ error: 'Habit not found' });
  res.json(habit);
});

router.put(
  '/:id/notif-ids',
  validate(z.object({ notifIds: z.array(z.string().max(100)).max(20) })),
  async (req, res) => {
    const habit = await Habit.findOneAndUpdate(
      { _id: req.params.id, user: req.userId },
      { $set: { notifIds: req.body.notifIds } },
      { new: true }
    );
    if (!habit) return res.status(404).json({ error: 'Habit not found' });
    res.json(habit);
  }
);

router.post('/:id/archive', validate(z.object({ date: dateStr })), async (req, res) => {
  const habit = await Habit.findOneAndUpdate(
    { _id: req.params.id, user: req.userId },
    { $set: { archivedOn: req.body.date } },
    { new: true }
  );
  if (!habit) return res.status(404).json({ error: 'Habit not found' });
  res.json(habit);
});

router.delete('/:id', async (req, res) => {
  const habit = await Habit.findOneAndDelete({ _id: req.params.id, user: req.userId });
  if (!habit) return res.status(404).json({ error: 'Habit not found' });
  await Log.deleteMany({ user: req.userId, habitId: habit._id });
  res.status(204).end();
});

export default router;
