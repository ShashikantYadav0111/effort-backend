import mongoose from 'mongoose';

const { Schema } = mongoose;

const mealSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: String, required: true },
    mealType: { type: String, enum: ['breakfast', 'lunch', 'dinner', 'snack'], required: true },
    foodId: { type: Schema.Types.ObjectId, ref: 'Food', required: true },
    servings: { type: Number, required: true },
  },
  { timestamps: true }
);
mealSchema.index({ user: 1, date: 1 });

export const Meal = mongoose.model('Meal', mealSchema);
