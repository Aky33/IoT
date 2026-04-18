import { Caregiver } from "../models/Caregiver.js";

export const caregiverRepository = {
  async create(data) {
    return await Caregiver.create(data);
  },

  async findAll() {
    return await Caregiver.find({ isActive: true });
  },

  async findById(id) {
    return await Caregiver.findOne({ _id: id, isActive: true });
  },

  async update(id, data) {
    return await Caregiver.findOneAndUpdate(
      { _id: id, isActive: true },
      data,
      { new: true }
    );
  },

  async remove(id) {
    const result = await Caregiver.findOneAndUpdate(
      { _id: id, isActive: true },
      { isActive: false }
    );

    return !!result;
  },
};