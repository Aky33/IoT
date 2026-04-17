import { Schema, model } from 'mongoose';

import { cleanJson } from '../utils/mongoosePlugins.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^\+?[0-9\s()-]{7,20}$/;

const caregiverSchema = new Schema(
  {
    firstName: { type: String, required: true, maxlength: 50 },
    lastName: { type: String, required: true, maxlength: 50 },
    email: {
      type: String,
      required: true,
      maxlength: 255,
      unique: true,
      lowercase: true,
      trim: true,
      match: EMAIL_RE,
    },
    phone: { type: String, maxlength: 20, match: PHONE_RE },
    fcmToken: { type: String },
    notificationPreferences: {
      sound: { type: Boolean, default: true },
      vibration: { type: Boolean, default: true },
      doNotDisturb: { type: Boolean, default: false },
    },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true },
);

caregiverSchema.plugin(cleanJson);

export const Caregiver = model('Caregiver', caregiverSchema);
