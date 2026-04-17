import { Schema, model } from 'mongoose';

import { cleanJson } from '../utils/mongoosePlugins.js';

const RETENTION_SECONDS = 365 * 24 * 60 * 60;

const notificationSchema = new Schema(
  {
    deviceId: { type: Schema.Types.ObjectId, ref: 'Device', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    caregiverId: {
      type: Schema.Types.ObjectId,
      ref: 'Caregiver',
      required: true,
      index: true,
    },
    type: { type: String, enum: ['standard', 'urgent'], required: true },
    status: {
      type: String,
      enum: ['pending', 'sent', 'delivered', 'failed', 'cancelled'],
      default: 'pending',
      index: true,
    },
    sentAt: { type: Date, default: null },
    deliveredAt: { type: Date, default: null },
    cancelledAt: { type: Date, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

// Compound indexes for common list queries sorted newest-first.
notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ caregiverId: 1, createdAt: -1 });
notificationSchema.index({ deviceId: 1, createdAt: -1 });

// TTL — auto-remove notifications after notificationRetentionDays (365).
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: RETENTION_SECONDS });

notificationSchema.plugin(cleanJson);

export const Notification = model('Notification', notificationSchema);
