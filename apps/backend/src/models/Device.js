import { Schema, model } from 'mongoose';

import { cleanJson } from '../utils/mongoosePlugins.js';

const MAC_RE = /^([0-9A-F]{2}:){5}[0-9A-F]{2}$/i;

const deviceSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    caregiverId: {
      type: Schema.Types.ObjectId,
      ref: 'Caregiver',
      index: true,
    },
    name: { type: String, maxlength: 100, required: true, trim: true },
    macAddress: {
      type: String,
      maxlength: 17,
      match: MAC_RE,
      uppercase: true,
      trim: true,
      unique: true,
      sparse: true,
    },
    firmwareVersion: { type: String },
    lastSeenAt: { type: Date },
    deviceSecret: { type: String, required: true, select: false },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true },
);

deviceSchema.plugin(cleanJson);

export const Device = model('Device', deviceSchema);
