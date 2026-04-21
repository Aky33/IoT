import { Router } from "express";
import { caregiverController } from "../controllers/caregiverController.js";

const router = Router();

router.post("/create", caregiverController.create);
router.get("/all", caregiverController.list);
router.get("/get/:id", caregiverController.get);
router.put("/edit/:id", caregiverController.update);
router.delete("/delete/:id", caregiverController.remove);

export const caregiversRouter = router;