import { Router } from 'express';

import { userController } from '../controllers/userController.js';
import { validateBody } from '../middleware/validateBody.js';
import { createUserSchema, updateUserSchema } from '../validation/userValidation.js';

export const usersRouter = Router();

// REST conventions:
//   POST   /users       → create
//   GET    /users       → list (supports ?page=&pageSize=)
//   GET    /users/:id   → read
//   PUT    /users/:id   → update
//   DELETE /users/:id   → soft delete (204 No Content)
usersRouter.post('/', validateBody(createUserSchema), userController.create);
usersRouter.get('/', userController.list);
usersRouter.get('/:id', userController.get);
usersRouter.put('/:id', validateBody(updateUserSchema), userController.update);
usersRouter.delete('/:id', userController.remove);
