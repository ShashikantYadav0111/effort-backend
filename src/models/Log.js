import mongoose from 'mongoose';

const { Schema } = mongoose;

const logSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    habitId: { type: Schema.Types.ObjectId, ref: 'Habit', required: true },
    date: { type: String, required: true }, // local calendar day, YYYY-MM-DD
    quantity: { type: Number, required: true },
  },
  { timestamps: true }
);
logSchema.index({ user: 1, date: 1, habitId: 1 });
logSchema.index({ user: 1, habitId: 1 });

export const Log = mongoose.model('Log', logSchema);
