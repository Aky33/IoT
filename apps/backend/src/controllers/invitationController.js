import crypto from 'node:crypto';

import { Invitation } from '../models/Invitation.js';
import { AppError } from '../errors/AppError.js';

const DEFAULT_TTL_HOURS = 24;

export const invitationController = {
  async create(req, res) {
    const { role, ttlHours } = req.body;
    const hours = Number(ttlHours) || DEFAULT_TTL_HOURS;
    const code = crypto.randomBytes(4).toString('hex').toUpperCase();

    const invitation = await Invitation.create({
      code,
      role: role || 'caregiver',
      createdBy: req.user.sub,
      expiresAt: new Date(Date.now() + hours * 60 * 60 * 1000),
    });

    res.status(201).json(invitation.toJSON());
  },

  async list(req, res) {
    const invitations = await Invitation.find({ usedAt: null }).sort({ createdAt: -1 });
    res.json(invitations.map((d) => d.toJSON()));
  },

  async revoke(req, res) {
    const invitation = await Invitation.findById(req.params.id);
    if (!invitation) {
      throw new AppError('invitationNotFound', 'Invitation not found.', {}, 404);
    }
    if (invitation.usedAt) {
      throw new AppError('invitationAlreadyUsed', 'Cannot revoke a used invitation.', {}, 400);
    }
    await Invitation.findByIdAndDelete(invitation._id);
    res.status(204).end();
  },
};
