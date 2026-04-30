import { Router } from 'express';

import { caregiverController } from '../controllers/caregiverController.js';
import { validateBody } from '../middleware/validateBody.js';
import { updateCaregiverSchema } from '../validation/caregiverValidation.js';

const router = Router();

router.get('/all', caregiverController.list);
router.get('/get/:id', caregiverController.get);
router.put('/edit/:id', validateBody(updateCaregiverSchema), caregiverController.update);
router.delete('/delete/:id', caregiverController.remove);

export const caregiversRouter = router;
