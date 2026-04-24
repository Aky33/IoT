import { Device } from '../models/Device.js';

export const deviceRepository = {
  async create(data) {
    const doc = await Device.create(data);
    return doc.toJSON();
  },

  async findAll() {
    const items = await Device.find({ isActive: true }).sort({ createdAt: -1 });
    return items.map((item) => item.toJSON());
  },

  async findById(id) {
    const doc = await Device.findOne({ _id: id, isActive: true });
    return doc ? doc.toJSON() : null;
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
