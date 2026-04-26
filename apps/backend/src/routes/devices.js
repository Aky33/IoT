import { Router } from 'express';

import { deviceController } from '../controllers/deviceController.js';
import { validateBody } from '../middleware/validateBody.js';
import { authorize } from '../middleware/authorize.js';
import { createDeviceSchema, editDeviceSchema } from '../validation/deviceValidation.js';

export const devicesRouter = Router();

devicesRouter.post('/create', authorize('admin'), validateBody(createDeviceSchema), deviceController.create);
devicesRouter.get('/all', deviceController.list);
devicesRouter.get('/get/:id', deviceController.get);
devicesRouter.put('/edit/:id', authorize('admin'), validateBody(editDeviceSchema), deviceController.update);
devicesRouter.delete('/delete/:id', authorize('admin'), deviceController.remove);
