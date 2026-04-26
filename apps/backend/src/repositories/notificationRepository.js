import { Notification } from '../models/Notification.js';

const DEFAULT_PAGE_SIZE = 50;
const MAX_PAGE_SIZE = 200;

function normalizePageInfo({ page = 1, pageSize = DEFAULT_PAGE_SIZE } = {}) {
  const p = Math.max(1, Number(page) || 1);
  const s = Math.min(MAX_PAGE_SIZE, Math.max(1, Number(pageSize) || DEFAULT_PAGE_SIZE));
  return { page: p, pageSize: s, skip: (p - 1) * s };
}

export const notificationRepository = {
  async create(data) {
    const doc = await Notification.create(data);
    return doc.toJSON();
  },

  async findById(id) {
    return Notification.findById(id).then((d) => (d ? d.toJSON() : null));
  },

  async findMany(pageInfo) {
    const { page, pageSize, skip } = normalizePageInfo(pageInfo);
    const [items, total] = await Promise.all([
      Notification.find().skip(skip).limit(pageSize).sort({ createdAt: -1 }),
      Notification.countDocuments(),
    ]);
    return {
      data: items.map((d) => d.toJSON()),
      meta: { page, pageSize, total },
    };
  },

  async findByCaregiver(caregiverId, pageInfo) {
    const { page, pageSize, skip } = normalizePageInfo(pageInfo);
    const filter = { caregiverId };
    const [items, total] = await Promise.all([
      Notification.find(filter).skip(skip).limit(pageSize).sort({ createdAt: -1 }),
      Notification.countDocuments(filter),
    ]);
    return {
      data: items.map((d) => d.toJSON()),
      meta: { page, pageSize, total },
    };
  },

  async findByUser(userId, pageInfo) {
    const { page, pageSize, skip } = normalizePageInfo(pageInfo);
    const filter = { userId };
    const [items, total] = await Promise.all([
      Notification.find(filter).skip(skip).limit(pageSize).sort({ createdAt: -1 }),
      Notification.countDocuments(filter),
    ]);
    return {
      data: items.map((d) => d.toJSON()),
      meta: { page, pageSize, total },
    };
  },

  async findByDevice(deviceId, pageInfo) {
    const { page, pageSize, skip } = normalizePageInfo(pageInfo);
    const filter = { deviceId };
    const [items, total] = await Promise.all([
      Notification.find(filter).skip(skip).limit(pageSize).sort({ createdAt: -1 }),
      Notification.countDocuments(filter),
    ]);
    return {
      data: items.map((d) => d.toJSON()),
      meta: { page, pageSize, total },
    };
  },

  async update(id, data) {
    const doc = await Notification.findByIdAndUpdate(id, data, { new: true });
    return doc ? doc.toJSON() : null;
  },
};
