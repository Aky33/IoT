export const createNotificationSchema = {
  type: 'object',
  properties: {
    type: { type: 'string', enum: ['standard', 'urgent'] },
  },
  required: ['type'],
  additionalProperties: false,
};
