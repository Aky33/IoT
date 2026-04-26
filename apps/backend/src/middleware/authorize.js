import { AppError } from '../errors/AppError.js';

export function authorize(...allowedRoles) {
  return (req, _res, next) => {
    if (!req.user?.role || !allowedRoles.includes(req.user.role)) {
      throw new AppError(
        'forbidden',
        'You do not have permission to access this resource.',
        { requiredRoles: allowedRoles },
        403,
      );
    }
    next();
  };
}
