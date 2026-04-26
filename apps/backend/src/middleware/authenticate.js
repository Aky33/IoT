import jwt from 'jsonwebtoken';

import { config } from '../config/index.js';
import { AppError } from '../errors/AppError.js';

export function authenticate(req, _res, next) {
  const header = req.get('Authorization');
  if (!header?.startsWith('Bearer ')) {
    throw new AppError('unauthorized', 'Missing or malformed Authorization header.', {}, 401);
  }

  try {
    req.user = jwt.verify(header.slice(7), config.jwt.accessSecret, { algorithms: ['HS256'] });
    next();
  } catch (err) {
    const code = err.name === 'TokenExpiredError' ? 'tokenExpired' : 'tokenInvalid';
    const message =
      err.name === 'TokenExpiredError' ? 'Access token has expired.' : 'Invalid access token.';
    throw new AppError(code, message, {}, 401);
  }
}
