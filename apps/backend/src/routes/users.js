import { Router } from 'express';

import { userController } from '../controllers/userController.js';
import { validateBody } from '../middleware/validateBody.js';
import { authorize } from '../middleware/authorize.js';
import { createUserSchema, updateUserSchema } from '../validation/userValidation.js';

export const usersRouter = Router();

usersRouter.post('/create', authorize('admin'), validateBody(createUserSchema), userController.create);
usersRouter.get('/all', authorize('admin'), userController.list);
usersRouter.get('/get/:id', userController.get);
usersRouter.put('/edit/:id', authorize('admin'), validateBody(updateUserSchema), userController.update);
usersRouter.delete('/delete/:id', authorize('admin'), userController.remove);
