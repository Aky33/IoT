// Request body validation schemas — consumed by validateBody middleware.
// NOTE: validateBody is currently a pass-through stub. Full enforcement
// (missing required, type/value checks, defaults) is TBD.

export const createNotificationSchema = {
  type: 'object',
  properties: {
    deviceId: { type: 'string' },
    userId: { type: 'string' },
    caregiverId: { type: 'string' },
    type: { type: 'string', enum: ['standard', 'urgent'] },
  },
  required: ['deviceId', 'userId', 'caregiverId', 'type'],
  additionalProperties: false,
};
