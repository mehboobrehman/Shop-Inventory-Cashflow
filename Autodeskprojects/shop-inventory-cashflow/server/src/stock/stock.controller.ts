import { Request, Response } from "express";
import stockService from "./stock.service";
import { StockMovementType } from "@shop/shared";

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
      const { productId, type, startDate, endDate, limit, skip } = req.query;
      
      const movements = await stockService.getStockMovements(
        productId as string | undefined,
        type as StockMovementType | undefined,
        startDate ? new Date(startDate as string) : undefined,
        endDate ? new Date(endDate as string) : undefined,
        limit ? parseInt(limit as string) : undefined,
        skip ? parseInt(skip as string) : undefined,
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