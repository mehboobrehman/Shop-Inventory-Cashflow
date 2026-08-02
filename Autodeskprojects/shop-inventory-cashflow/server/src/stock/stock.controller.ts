import { Request, Response } from "express";
import stockService from "./stock.service";
import { StockMovementType } from "@shop/shared";
import { stockMovementQuerySchema } from "../validators/stock";

// Controller for stock management
class StockController {
  async addStockIn(req: Request, res: Response) {
    try {
      const { productId, quantity, reason, userId } = req.body;
      
      const result = await stockService.addStockIn(productId, quantity, reason, userId);
      
      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error("Error adding stock-in:", error);
      res.status(500).json({
        success: false,
        error: "Failed to add stock-in",
      });
    }
  }

  async adjustStock(req: Request, res: Response) {
    try {
      const { productId, newQuantity, reason, userId } = req.body;
      
      const result = await stockService.adjustStock(productId, newQuantity, reason, userId);
      
      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error("Error adjusting stock:", error);
      res.status(500).json({
        success: false,
        error: "Failed to adjust stock",
      });
    }
  }

  async getStockMovements(req: Request, res: Response) {
    try {
      const parseResult = stockMovementQuerySchema.safeParse(req.query);
      if (!parseResult.success) {
        return res.status(400).json({
          success: false,
          error: "Invalid query parameters",
          details: parseResult.error.issues,
        });
      }

      const { productId, type, startDate, endDate, limit, skip, page } = parseResult.data;

      const effectiveSkip = skip ?? (page && limit ? (page - 1) * limit : undefined);

      const movements = await stockService.getStockMovements(
        productId,
        type,
        startDate ? new Date(startDate) : undefined,
        endDate ? new Date(endDate) : undefined,
        limit,
        effectiveSkip,
      );

      res.status(200).json({
        success: true,
        data: movements,
      });
    } catch (error) {
      console.error("Error fetching stock movements:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch stock movements",
      });
    }
  }
}

export default new StockController();