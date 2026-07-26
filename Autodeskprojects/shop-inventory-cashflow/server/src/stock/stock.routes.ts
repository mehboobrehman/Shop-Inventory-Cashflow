import { Router } from "express";
import stockController from "./stock.controller";
import { validateRequest } from "../middleware/validateRequest";
import { stockInSchema, stockAdjustmentSchema } from "../validators/stock";
import { AuthMiddleware } from "../auth/auth.middleware";

const router = Router();
const authMiddleware = new AuthMiddleware();

// Protect all stock routes
router.use(authMiddleware.authenticate);

// Stock routes
router.post(
  "/in",
  validateRequest(stockInSchema),
  stockController.addStockIn.bind(stockController),
);

router.post(
  "/adjust",
  validateRequest(stockAdjustmentSchema),
  stockController.adjustStock.bind(stockController),
);

router.get("/movements", stockController.getStockMovements);

export default router;