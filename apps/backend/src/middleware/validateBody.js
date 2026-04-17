// TEMPLATE — body validation middleware.
//
// Contract:
//   validateBody(schema) → (req, res, next) => void
// Responsibilities:
//   - Validate req.body against the JSON schema
//   - On failure, throw ValidationError (handled centrally by errorHandler)
//   - Apply default values for missing optional keys
//   - Replace req.body with the validated / coerced object
//
// Current state: pass-through stub. Colleagues implement actual validation
// (via ajv, zod, or hand-rolled) when wiring endpoints.
export function validateBody(_schema) {
  return (_req, _res, next) => {
    next();
  };
}
