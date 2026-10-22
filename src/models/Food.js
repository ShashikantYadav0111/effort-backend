import mongoose from 'mongoose';
import { cleanJson } from './plugin.js';

const { Schema } = mongoose;

const foodSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true, trim: true, maxlength: 100 },
    servingLabel: { type: String, required: true, trim: true, maxlength: 100 },
    kcal: { type: Number, default: 0 },
    protein: { type: Number, default: 0 },
    carbs: { type: Number, default: 0 },
    fat: { type: Number, default: 0 },
    fiber: { type: Number, default: 0 },
  },
  { timestamps: true }
);
foodSchema.index({ user: 1, name: 1 });
foodSchema.plugin(cleanJson);

export const Food = mongoose.model('Food', foodSchema);
