import mongoose from 'mongoose';

const { Schema } = mongoose;

const settingSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  key: { type: String, required: true },
  value: { type: String, default: '' },
});
settingSchema.index({ user: 1, key: 1 }, { unique: true });

export const Setting = mongoose.model('Setting', settingSchema);
