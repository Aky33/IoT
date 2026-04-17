import { User } from '../models/User.js';
import { Device } from '../models/Device.js';

const DEFAULT_PAGE_SIZE = 50;
const MAX_PAGE_SIZE = 200;

function normalizePageInfo({ page = 1, pageSize = DEFAULT_PAGE_SIZE } = {}) {
  const p = Math.max(1, Number(page) || 1);
  const s = Math.min(MAX_PAGE_SIZE, Math.max(1, Number(pageSize) || DEFAULT_PAGE_SIZE));
  return { page: p, pageSize: s, skip: (p - 1) * s };
}

export const userRepository = {
  async create(data) {
    const doc = await User.create(data);
    return doc.toJSON();
  },

  async findById(id) {
    const doc = await User.findOne({ _id: id, isActive: true });
    return doc ? doc.toJSON() : null;
  },

  async findMany(pageInfo) {
    const { page, pageSize, skip } = normalizePageInfo(pageInfo);
    const filter = { isActive: true };
    const [items, total] = await Promise.all([
      User.find(filter).skip(skip).limit(pageSize).sort({ createdAt: -1 }),
      User.countDocuments(filter),
    ]);
    return {
      data: items.map((d) => d.toJSON()),
      meta: { page, pageSize, total },
    };
  },

  async findByCaregiver(caregiverId, pageInfo) {
    const { page, pageSize, skip } = normalizePageInfo(pageInfo);
    const userIds = await Device.find({ caregiverId, isActive: true }).distinct('userId');
    const filter = { _id: { $in: userIds }, isActive: true };
    const [items, total] = await Promise.all([
      User.find(filter).skip(skip).limit(pageSize).sort({ createdAt: -1 }),
      User.countDocuments(filter),
    ]);
    return {
      data: items.map((d) => d.toJSON()),
      meta: { page, pageSize, total },
    };
  },

  async update(id, data) {
    const doc = await User.findOneAndUpdate({ _id: id, isActive: true }, data, {
      new: true,
      runValidators: true,
    });
    return doc ? doc.toJSON() : null;
  },

  // Soft delete — isActive: false. Preserves notification history referencing this user.
  async remove(id) {
    const doc = await User.findOneAndUpdate(
      { _id: id, isActive: true },
      { isActive: false },
      { new: true },
    );
    return doc !== null;
  },
};
