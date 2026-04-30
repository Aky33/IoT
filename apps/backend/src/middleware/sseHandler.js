import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import { AppError } from '../errors/AppError.js';
import { subscribe } from '../services/sseManager.js';

export function sseHandler(req, res) {
  // EventSource does not support custom headers.
  // Accept JWT from query param ?token= as fallback for SSE.
  if (!req.user && req.query.token) {
    try {
      req.user = jwt.verify(req.query.token, config.jwt.accessSecret, { algorithms: ['HS256'] });
    } catch {
      throw new AppError('tokenInvalid', 'Invalid access token.', {}, 401);
    }
  }
  if (!req.user?.sub) {
    throw new AppError('unauthorized', 'Missing authentication.', {}, 401);
  }
  subscribe(req.user.sub, res);
}
