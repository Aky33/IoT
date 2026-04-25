// Request body validation schemas — consumed by validateBody middleware.
// NOTE: validateBody is currently a pass-through stub. Full enforcement
// (missing required, type/value checks, defaults) is TBD.

const DEVICE_STATUS = ['active', 'inactive', 'maintenance'];

export const createDeviceSchema = {
  type: 'object',
  properties: {
    name: { type: 'string' },
    type: { type: 'string' },
    serialNumber: { type: 'string' },
    userId: { type: 'string' },
    caregiverId: { type: 'string' },
    status: { type: 'string', enum: DEVICE_STATUS },
    batteryLevel: { type: 'number', minimum: 0, maximum: 100 },
    lastSeenAt: { type: 'string' },
    isOnline: { type: 'boolean' },
  },
  required: ['name', 'type', 'status'],
  additionalProperties: false,
};

export const editDeviceSchema = {
  type: 'object',
  properties: {
    name: { type: 'string' },
    type: { type: 'string' },
    serialNumber: { type: 'string' },
    userId: { type: 'string' },
    caregiverId: { type: 'string' },
    status: { type: 'string', enum: DEVICE_STATUS },
    batteryLevel: { type: 'number', minimum: 0, maximum: 100 },
    lastSeenAt: { type: 'string' },
    isOnline: { type: 'boolean' },
  },
  required: ['name', 'type', 'status'],
  additionalProperties: false,
};
