import { Router } from 'express';

import { deviceController } from '../controllers/deviceController.js';
import { validateBody } from '../middleware/validateBody.js';
import { createDeviceSchema, editDeviceSchema } from '../validation/deviceValidation.js';

export const devicesRouter = Router();

devicesRouter.post('/create', validateBody(createDeviceSchema), deviceController.create);
devicesRouter.get('/all', deviceController.list);
devicesRouter.get('/get/:id', deviceController.get);
devicesRouter.put('/edit/:id', validateBody(editDeviceSchema), deviceController.update);
devicesRouter.delete('/delete/:id', deviceController.remove);
