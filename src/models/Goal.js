import mongoose from 'mongoose';
import { cleanJson } from './plugin.js';

const { Schema } = mongoose;

const goalSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    target: { type: Number, required: true, min: 0 },
    unit: { type: String, required: true, trim: true, maxlength: 30 },
    deadline: { type: String, default: null },
  },
  { timestamps: true }
);
goalSchema.plugin(cleanJson);

export const Goal = mongoose.model('Goal', goalSchema);
