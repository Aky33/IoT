import { createFromDevicePress } from '../services/notificationService.js';
import { notificationRepository } from '../repositories/notificationRepository.js';

export const notificationController = {
  async create(req, res) {
    const notification = await createFromDevicePress(req.device, req.body.type);
    res.status(201).json(notification);
  },

  async all(req, res) {
    const { page, pageSize, deviceId } = req.query;
    const filter = { caregiverId: req.user.sub };
    if (deviceId) filter.deviceId = deviceId;
    const result = await notificationRepository.findByFilter(filter, { page, pageSize });
    res.json(result);
  },
};
