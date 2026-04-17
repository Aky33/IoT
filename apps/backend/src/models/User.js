import { Schema, model } from 'mongoose';

import { cleanJson } from '../utils/mongoosePlugins.js';

const userSchema = new Schema(
  {
    firstName: { type: String, required: true, maxlength: 50 },
    lastName: { type: String, required: true, maxlength: 50 },
    notes: { type: String, maxlength: 500, default: '' },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true },
);

userSchema.plugin(cleanJson);

export const User = model('User', userSchema);
