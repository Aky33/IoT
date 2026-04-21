import { Notification } from '../models/Notification.js';

export const notificationRepository = {
  async create(data) {
    const doc = await Notification.create(data);
    return doc.toJSON();
  },

  async findAll() {
    const items = await Notification.find().sort({ createdAt: -1 });
    return items.map((d) => d.toJSON());
  },
};
