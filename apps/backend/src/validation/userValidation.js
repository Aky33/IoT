export const createUserSchema = {
  type: 'object',
  properties: {
    firstName: { type: 'string', maxLength: 50 },
    lastName: { type: 'string', maxLength: 50 },
    notes: { type: 'string', maxLength: 500 },
  },
  required: ['firstName', 'lastName'],
  additionalProperties: false,
};

export const updateUserSchema = {
  type: 'object',
  properties: {
    firstName: { type: 'string', maxLength: 50 },
    lastName: { type: 'string', maxLength: 50 },
    notes: { type: 'string', maxLength: 500 },
    isActive: { type: 'boolean' },
  },
  required: [],
  additionalProperties: false,
};
