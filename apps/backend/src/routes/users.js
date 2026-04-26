import { Router } from 'express';

import { userController } from '../controllers/userController.js';
import { validateBody } from '../middleware/validateBody.js';
import { createUserSchema, updateUserSchema } from '../validation/userValidation.js';

export const usersRouter = Router();

usersRouter.post('/create', validateBody(createUserSchema), userController.create);
usersRouter.get('/all', userController.list);
usersRouter.get('/get/:id', userController.get);
usersRouter.put('/edit/:id', validateBody(updateUserSchema), userController.update);
usersRouter.delete('/delete/:id', userController.remove);
