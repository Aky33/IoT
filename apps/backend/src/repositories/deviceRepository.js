import crypto from 'node:crypto';

import { Device } from '../models/Device.js';

const DEFAULT_PAGE_SIZE = 50;
const MAX_PAGE_SIZE = 200;

function normalizePageInfo({ page = 1, pageSize = DEFAULT_PAGE_SIZE } = {}) {
  const p = Math.max(1, Number(page) || 1);
  const s = Math.min(MAX_PAGE_SIZE, Math.max(1, Number(pageSize) || DEFAULT_PAGE_SIZE));
  return { page: p, pageSize: s, skip: (p - 1) * s };
}

export const deviceRepository = {
  async create(data) {
    const doc = await Device.create({
      ...data,
      deviceSecret: crypto.randomBytes(32).toString('hex'),
    });
    return doc.toJSON();
  },

  async findById(id) {
    const doc = await Device.findOne({ _id: id, isActive: true });
    return doc ? doc.toJSON() : null;
  },

  async findMany(pageInfo) {
    const { page, pageSize, skip } = normalizePageInfo(pageInfo);
    const filter = { isActive: true };
    const [items, total] = await Promise.all([
      Device.find(filter).skip(skip).limit(pageSize).sort({ createdAt: -1 }),
      Device.countDocuments(filter),
    ]);
    return {
      data: items.map((d) => d.toJSON()),
      meta: { page, pageSize, total },
    };
  },

  async findByUser(userId, pageInfo) {
    const { page, pageSize, skip } = normalizePageInfo(pageInfo);
    const filter = { userId, isActive: true };
    const [items, total] = await Promise.all([
      Device.find(filter).skip(skip).limit(pageSize).sort({ createdAt: -1 }),
      Device.countDocuments(filter),
    ]);
    return {
      data: items.map((d) => d.toJSON()),
      meta: { page, pageSize, total },
    };
  },

  async update(id, data) {
    const doc = await Device.findOneAndUpdate({ _id: id, isActive: true }, data, {
      new: true,
      runValidators: true,
    });
    return doc ? doc.toJSON() : null;
  },

  async remove(id) {
    const doc = await Device.findOneAndUpdate(
      { _id: id, isActive: true },
      { isActive: false },
      { new: true },
    );
    return doc !== null;
  },
};
