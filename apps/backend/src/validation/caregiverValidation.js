export const updateCaregiverSchema = {
  type: 'object',
  properties: {
    firstName: { type: 'string', maxLength: 50 },
    lastName: { type: 'string', maxLength: 50 },
    email: { type: 'string', maxLength: 255 },
    phone: { type: 'string', maxLength: 20 },
    pushSubscription: {
      type: 'object',
      properties: {
        endpoint: { type: 'string' },
        keys: {
          type: 'object',
          properties: {
            p256dh: { type: 'string' },
            auth: { type: 'string' },
          },
        },
      },
    },
    notificationPreferences: {
      type: 'object',
      properties: {
        sound: { type: 'boolean' },
        vibration: { type: 'boolean' },
        doNotDisturb: { type: 'boolean' },
      },
    },
    isActive: { type: 'boolean' },
    role: { type: 'string', enum: ['caregiver', 'admin'] },
  },
  required: ['firstName', 'lastName', 'email', 'isActive'],
  additionalProperties: false,
};
