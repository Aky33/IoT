import { Router } from 'express';

import { invitationController } from '../controllers/invitationController.js';

export const invitationsRouter = Router();

invitationsRouter.post('/create', invitationController.create);
invitationsRouter.get('/all', invitationController.list);
invitationsRouter.delete('/revoke/:id', invitationController.revoke);
