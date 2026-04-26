import { caregiverRepository } from '../repositories/caregiverRepository.js';
import { NotFoundError } from '../errors/AppError.js';

export const caregiverController = {
  async create(req, res) {
    const caregiver = await caregiverRepository.create(req.body);
    res.status(201).json(caregiver);
  },

  async list(req, res) {
    const { page, pageSize } = req.query;
    const result = await caregiverRepository.findMany({ page, pageSize });
    res.json(result);
  },

  async get(req, res) {
    const caregiver = await caregiverRepository.findById(req.params.id);
    if (!caregiver) throw new NotFoundError('Caregiver', req.params.id);
    res.json(caregiver);
  },

  async update(req, res) {
    const caregiver = await caregiverRepository.update(req.params.id, req.body);
    if (!caregiver) throw new NotFoundError('Caregiver', req.params.id);
    res.json(caregiver);
  },

  async remove(req, res) {
    const deleted = await caregiverRepository.remove(req.params.id);
    if (!deleted) throw new NotFoundError('Caregiver', req.params.id);
    res.status(204).end();
  },
};
