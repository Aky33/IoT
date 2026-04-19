import { notificationRepository } from '../repositories/notificationRepository.js';

// Express 5 auto-catches async rejections — no try/catch boilerplate needed.
// AppError thrown here propagates to the central errorHandler middleware.
export const notificationController = {
  async create(req, res) {
    const notification = await notificationRepository.create(req.body);
    res.status(201).json(notification);
  },

  async all(req, res) {
    const notifications = await notificationRepository.findAll();
    res.json(notifications);
  },
};
