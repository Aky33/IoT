import { randomUUID } from 'node:crypto';

/**
 * requestId — assigns a unique correlation ID to every incoming request.
 *
 * - Reads `X-Request-Id` header if client sent one, otherwise generates UUID v4.
 * - Attaches to `req.id` for use in logs, error handlers, downstream calls.
 * - Echoes the ID back as `X-Request-Id` response header so clients can
 *   correlate with their own logs.
 *
 * Wired globally in app.js BEFORE morgan so the ID appears in access logs.
 */
export function requestId(req, res, next) {
  const id = req.get('X-Request-Id') || randomUUID();
  req.id = id;
  res.setHeader('X-Request-Id', id);
  next();
}
