import Ajv from 'ajv';
import { ValidationError } from '../errors/AppError.js';

const ajv = new Ajv({ allErrors: true, coerceTypes: false });

export function validateBody(schema) {
  const validate = ajv.compile(schema);
  return (req, _res, next) => {
    if (!validate(req.body)) {
      const details = validate.errors.map((e) => ({
        path: e.instancePath || '/',
        message: e.message,
        params: e.params,
      }));
      throw new ValidationError({ validationErrors: details });
    }
    next();
  };
}
