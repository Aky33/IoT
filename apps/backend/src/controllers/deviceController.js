import { deviceRepository } from '../repositories/deviceRepository.js';

export const deviceController = {
  async create(req, res) {
    const device = await deviceRepository.create(req.body);
    res.status(201).json(device);
  },

  async all(req, res) {
    const devices = await deviceRepository.findAll();
    const itemList = devices.map((device) => ({
      id: device.id,
      name: device.name,
      type: device.type,
      status: device.status,
      isOnline: device.isOnline,
    }));
    res.json({ itemList });
  },

  async get(req, res) {
    const device = await deviceRepository.findById(req.params.id);

    if (!device) {
      return res.status(404).json({ error: 'Device not found' });
    }

    res.json(device);
  },

  async edit(req, res) {
    const device = await deviceRepository.update(req.params.id, req.body);

    if (!device) {
      return res.status(404).json({ error: 'Device not found' });
    }

    res.json(device);
  },

  async remove(req, res) {
    const deleted = await deviceRepository.remove(req.params.id);

    if (!deleted) {
      return res.status(404).json({ error: 'Device not found' });
    }

    res.json({ id: req.params.id, deleted: true });
  },
};
