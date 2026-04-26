import { Schema, model } from 'mongoose';

import { cleanJson } from '../utils/mongoosePlugins.js';

const invitationSchema = new Schema({
  code: { type: String, required: true, unique: true },
  role: { type: String, enum: ['caregiver', 'admin'], default: 'caregiver' },
  createdBy: { type: Schema.Types.ObjectId, ref: 'Caregiver', required: true },
  expiresAt: { type: Date, required: true },
  usedAt: { type: Date, default: null },
  usedBy: { type: Schema.Types.ObjectId, ref: 'Caregiver', default: null },
  createdAt: { type: Date, default: Date.now },
});

// TTL — auto-delete expired unused invitations.
// Used invitations set expiresAt to null → TTL skips them (keeps audit trail).
invitationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

invitationSchema.plugin(cleanJson);

export const Invitation = model('Invitation', invitationSchema);
