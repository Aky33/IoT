import { userRepository } from '../repositories/userRepository.js';
import { NotFoundError } from '../errors/AppError.js';

// Express 5 auto-catches async rejections — no try/catch boilerplate needed.
// AppError thrown here propagates to the central errorHandler middleware.
export const userController = {
  async create(req, res) {
    const user = await userRepository.create(req.body);
    res.status(201).json(user);
  },

  async list(req, res) {
    const { page, pageSize } = req.query;
    const result = await userRepository.findMany({ page, pageSize });
    res.json(result);
  },

  async get(req, res) {
    const user = await userRepository.findById(req.params.id);
    if (!user) throw new NotFoundError('User', req.params.id);
    res.json(user);
  },

  async update(req, res) {
    const user = await userRepository.update(req.params.id, req.body);
    if (!user) throw new NotFoundError('User', req.params.id);
    res.json(user);
  },

  async remove(req, res) {
    const deleted = await userRepository.remove(req.params.id);
    if (!deleted) throw new NotFoundError('User', req.params.id);
    res.status(204).end();
  },
};
