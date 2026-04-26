import { deviceRepository } from '../repositories/deviceRepository.js';
import { NotFoundError, ForbiddenError } from '../errors/AppError.js';

export const deviceController = {
  async create(req, res) {
    const device = await deviceRepository.create(req.body);
    res.status(201).json(device);
  },

  async list(req, res) {
    const { page, pageSize } = req.query;
    const result = req.user.role === 'admin'
      ? await deviceRepository.findMany({ page, pageSize })
      : await deviceRepository.findByCaregiver(req.user.sub, { page, pageSize });
    res.json(result);
  },

  async get(req, res) {
    const device = await deviceRepository.findById(req.params.id);
    if (!device) throw new NotFoundError('Device', req.params.id);
    if (req.user.role !== 'admin' && device.caregiverId !== req.user.sub) {
      throw new ForbiddenError();
    }
    res.json(device);
  },

  async update(req, res) {
    const device = await deviceRepository.update(req.params.id, req.body);
    if (!device) throw new NotFoundError('Device', req.params.id);
    res.json(device);
  },

  async remove(req, res) {
    const deleted = await deviceRepository.remove(req.params.id);
    if (!deleted) throw new NotFoundError('Device', req.params.id);
    res.status(204).end();
  },
};
