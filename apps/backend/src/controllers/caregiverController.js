import { caregiverRepository } from "../repositories/caregiverRepository.js";

export const caregiverController = {
  async create(req, res) {
    const caregiver = await caregiverRepository.create(req.body);
    res.status(201).json(caregiver);
  },

  async list(req, res) {
    const caregivers = await caregiverRepository.findAll();
    res.json(caregivers);
  },

  async get(req, res) {
    const caregiver = await caregiverRepository.findById(req.params.id);

    if (!caregiver) {
      return res.status(404).json({ error: "Caregiver not found" });
    }

    res.json(caregiver);
  },

  async update(req, res) {
    const caregiver = await caregiverRepository.update(req.params.id, req.body);

    if (!caregiver) {
      return res.status(404).json({ error: "Caregiver not found" });
    }

    res.json(caregiver);
  },

  async remove(req, res) {
    const success = await caregiverRepository.remove(req.params.id);

    if (!success) {
      return res.status(404).json({ error: "Caregiver not found" });
    }

    res.status(204).end();
  },
};