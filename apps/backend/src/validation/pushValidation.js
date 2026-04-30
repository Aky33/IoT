export const pushSubscriptionSchema = {
  type: 'object',
  properties: {
    endpoint: { type: 'string' },
    keys: {
      type: 'object',
      properties: {
        p256dh: { type: 'string' },
        auth: { type: 'string' },
      },
      required: ['p256dh', 'auth'],
    },
  },
  required: ['endpoint', 'keys'],
  additionalProperties: false,
};
