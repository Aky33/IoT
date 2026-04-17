// Request body validation schemas — consumed by validateBody middleware.
// NOTE: validateBody is currently a pass-through stub. Full enforcement
// (missing required, type/value checks, defaults) is TBD.

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
  required: ['firstName', 'lastName', 'isActive'],
  additionalProperties: false,
};
