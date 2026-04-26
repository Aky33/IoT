import crypto from 'node:crypto';

import { Device } from '../models/Device.js';
import { AppError } from '../errors/AppError.js';

const TIMESTAMP_TOLERANCE_SEC = 300;

export async function authenticateDevice(req, _res, next) {
  const deviceId = req.get('X-Device-Id');
  const timestamp = req.get('X-Timestamp');
  const signature = req.get('X-Signature');

  if (!deviceId || !timestamp || !signature) {
    throw new AppError(
      'deviceAuthMissing',
      'Missing X-Device-Id, X-Timestamp, or X-Signature headers.',
      {},
      401,
    );
  }

  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - Number(timestamp)) > TIMESTAMP_TOLERANCE_SEC) {
    throw new AppError(
      'timestampExpired',
      'Request timestamp is outside the allowed window.',
      {},
      401,
    );
  }

  const device = await Device.findById(deviceId).select('+deviceSecret');
  if (!device || !device.isActive) {
    throw new AppError('deviceNotFound', 'Device not found or inactive.', {}, 401);
  }

  const payload = `${req.method}|${req.originalUrl}|${timestamp}|${JSON.stringify(req.body)}`;
  const expected = crypto.createHmac('sha256', device.deviceSecret).update(payload).digest('hex');

  const sigBuf = Buffer.from(signature, 'hex');
  const expBuf = Buffer.from(expected, 'hex');
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    throw new AppError('signatureInvalid', 'HMAC signature verification failed.', {}, 401);
  }

  req.device = device.toJSON();
  next();
}
