export const createDeviceSchema = {
  type: 'object',
  properties: {
    name: { type: 'string' },
    userId: { type: 'string' },
    caregiverId: { type: 'string' },
    lastSeenAt: { type: 'string' },
  },
  required: ['name'],
  additionalProperties: false,
};

export const editDeviceSchema = {
  type: 'object',
  properties: {
    name: { type: 'string' },
    userId: { type: 'string' },
    caregiverId: { type: 'string' },
    lastSeenAt: { type: 'string' },
  },
  required: ['name'],
  additionalProperties: false,
};
