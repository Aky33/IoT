import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';

import { Caregiver } from '../models/Caregiver.js';
import { Invitation } from '../models/Invitation.js';
import { config } from '../config/index.js';
import { AppError } from '../errors/AppError.js';

const SALT_ROUNDS = 10;
const REFRESH_COOKIE = 'refreshToken';

function signAccessToken(caregiver) {
  return jwt.sign(
    { sub: caregiver._id.toString(), email: caregiver.email, role: caregiver.role },
    config.jwt.accessSecret,
    { expiresIn: config.jwt.accessExpires },
  );
}

function signRefreshToken(caregiver) {
  return jwt.sign(
    { sub: caregiver._id.toString(), jti: crypto.randomUUID() },
    config.jwt.refreshSecret,
    { expiresIn: config.jwt.refreshExpires },
  );
}

function setRefreshCookie(res, token) {
  const crossOrigin = Boolean(config.frontendUrl);
  res.cookie(REFRESH_COOKIE, token, {
    httpOnly: true,
    secure: config.nodeEnv === 'production' || crossOrigin,
    sameSite: crossOrigin ? 'none' : 'strict',
    path: '/auth',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

function refreshExpiresAt() {
  return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
}

export const authController = {
  async register(req, res) {
    const { firstName, lastName, email, password, phone, invitationCode } = req.body;

    if (!invitationCode) {
      throw new AppError('invitationRequired', 'Invitation code is required to register.', {}, 400);
    }

    const invitation = await Invitation.findOne({
      code: invitationCode.toUpperCase(),
      usedAt: null,
      expiresAt: { $gt: new Date() },
    });
    if (!invitation) {
      throw new AppError(
        'invitationInvalid',
        'Invitation code is invalid, expired, or already used.',
        {},
        400,
      );
    }

    if (!password || password.length < 8) {
      throw new AppError('weakPassword', 'Password must be at least 8 characters.', {}, 400);
    }

    const existing = await Caregiver.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      throw new AppError('emailTaken', 'A caregiver with this email already exists.', {}, 409);
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const caregiver = await Caregiver.create({
      firstName,
      lastName,
      email,
      phone,
      passwordHash,
      role: invitation.role,
    });

    // Mark invitation as used (set expiresAt to null → TTL won't auto-delete).
    await Invitation.findByIdAndUpdate(invitation._id, {
      usedAt: new Date(),
      usedBy: caregiver._id,
      expiresAt: null,
    });

    const accessToken = signAccessToken(caregiver);
    const refreshToken = signRefreshToken(caregiver);

    await Caregiver.findByIdAndUpdate(caregiver._id, {
      $push: { refreshTokens: { token: refreshToken, expiresAt: refreshExpiresAt() } },
    });

    setRefreshCookie(res, refreshToken);
    res.status(201).json({
      accessToken,
      caregiver: caregiver.toJSON(),
    });
  },

  async login(req, res) {
    const { email, password } = req.body;

    const caregiver = await Caregiver.findOne({
      email: email.toLowerCase().trim(),
      isActive: true,
    }).select('+passwordHash');

    if (!caregiver) {
      throw new AppError('invalidCredentials', 'Invalid email or password.', {}, 401);
    }

    const match = await bcrypt.compare(password, caregiver.passwordHash);
    if (!match) {
      throw new AppError('invalidCredentials', 'Invalid email or password.', {}, 401);
    }

    const accessToken = signAccessToken(caregiver);
    const refreshToken = signRefreshToken(caregiver);

    await Caregiver.findByIdAndUpdate(caregiver._id, {
      $push: { refreshTokens: { token: refreshToken, expiresAt: refreshExpiresAt() } },
    });

    setRefreshCookie(res, refreshToken);
    res.json({ accessToken });
  },

  async refresh(req, res) {
    const oldToken = req.cookies?.[REFRESH_COOKIE];
    if (!oldToken) {
      throw new AppError('noRefreshToken', 'Refresh token cookie is missing.', {}, 401);
    }

    let payload;
    try {
      payload = jwt.verify(oldToken, config.jwt.refreshSecret, { algorithms: ['HS256'] });
    } catch {
      throw new AppError('refreshTokenInvalid', 'Refresh token is invalid or expired.', {}, 401);
    }

    const caregiver = await Caregiver.findById(payload.sub).select('+refreshTokens');
    if (!caregiver || !caregiver.isActive) {
      throw new AppError('refreshTokenInvalid', 'Caregiver not found or inactive.', {}, 401);
    }

    const stored = caregiver.refreshTokens.find((rt) => rt.token === oldToken);
    if (!stored) {
      // Reuse detection — someone used an already-rotated token.
      // Invalidate ALL refresh tokens for this user (security measure).
      await Caregiver.findByIdAndUpdate(caregiver._id, { refreshTokens: [] });
      throw new AppError(
        'refreshTokenReuse',
        'Refresh token reuse detected. All sessions revoked.',
        {},
        401,
      );
    }

    // Rotate: remove old + expired, issue new.
    const newRefreshToken = signRefreshToken(caregiver);
    await Caregiver.findByIdAndUpdate(caregiver._id, [
      { $set: { refreshTokens: {
        $concatArrays: [
          { $filter: {
            input: '$refreshTokens',
            cond: { $and: [
              { $ne: ['$$this.token', oldToken] },
              { $gt: ['$$this.expiresAt', new Date()] },
            ]},
          }},
          [{ token: newRefreshToken, expiresAt: refreshExpiresAt() }],
        ],
      }}},
    ]);

    const accessToken = signAccessToken(caregiver);
    setRefreshCookie(res, newRefreshToken);
    res.json({ accessToken });
  },

  async logout(req, res) {
    const token = req.cookies?.[REFRESH_COOKIE];
    if (token) {
      try {
        const payload = jwt.verify(token, config.jwt.refreshSecret, { algorithms: ['HS256'] });
        await Caregiver.findByIdAndUpdate(payload.sub, {
          $pull: { refreshTokens: { token } },
        });
      } catch {
        // Token invalid/expired — still clear the cookie.
      }
    }
    const crossOrigin = Boolean(config.frontendUrl);
    res.clearCookie(REFRESH_COOKIE, {
      path: '/auth',
      secure: config.nodeEnv === 'production' || crossOrigin,
      sameSite: crossOrigin ? 'none' : 'strict',
    });
    res.status(204).end();
  },
};
