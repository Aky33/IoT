import { Schema, model } from 'mongoose';

import { cleanJson } from '../utils/mongoosePlugins.js';

const MAC_RE = /^([0-9A-F]{2}:){5}[0-9A-F]{2}$/i;
const DEVICE_STATUS = ['active', 'inactive', 'maintenance'];

const deviceSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    caregiverId: {
      type: Schema.Types.ObjectId,
      ref: 'Caregiver',
      index: true,
    },
    name: { type: String, maxlength: 100, required: true, trim: true },
    type: { type: String, required: true, trim: true },
    serialNumber: { type: String, trim: true, index: true },
    status: { type: String, enum: DEVICE_STATUS, required: true, index: true },
    batteryLevel: { type: Number, min: 0, max: 100, default: null },
    isOnline: { type: Boolean, default: false, index: true },
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
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true },
);

deviceSchema.plugin(cleanJson);

export const Device = model('Device', deviceSchema);
