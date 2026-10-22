import mongoose from 'mongoose';
import { cleanJson } from './plugin.js';

const { Schema } = mongoose;

const habitSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    segment: { type: String, enum: ['daily', 'growth'], default: 'daily' },
    name: { type: String, required: true, trim: true, maxlength: 100 },
    unit: { type: String, required: true, trim: true, maxlength: 30 },
    dailyTarget: { type: Number, default: null },
    step: { type: Number, default: 1 },
    conversions: {
      type: [new Schema({ metric: String, perUnit: Number }, { _id: false })],
      default: [],
    },
    activeDays: { type: [Number], default: [0, 1, 2, 3, 4, 5, 6] },
    goalId: { type: Schema.Types.ObjectId, ref: 'Goal', default: null },
    reminder: { type: String, default: null },
    notifIds: { type: [String], default: [] },
    createdOn: { type: String, required: true },
    archivedOn: { type: String, default: null },
  },
  { timestamps: true }
);
habitSchema.index({ user: 1, goalId: 1 });
habitSchema.plugin(cleanJson);

export const Habit = mongoose.model('Habit', habitSchema);
