import { prisma } from "../lib/prisma";
import { StockMovementType } from "@shop/shared";

// Service class for stock management
class StockService {
  async addStockIn(
    productId: string,
    quantity: number,
    reason: string,
    userId: string,
  ): Promise<{ movement: any; product: any }> {
    // Start a transaction to ensure atomicity
    return prisma.$transaction(async (tx) => {
      // Update product stock
      const product = await tx.product.update({
        where: { id: productId },
        data: { currentStock: { increment: quantity } },
      });
      
      // Create stock movement record
      const movement = await tx.stockMovement.create({
        data: {
          productId: productId,
          type: StockMovementType.IN,
          quantity: quantity,
          reason: reason,
          reference: `MANUAL_IN_${userId}_${Date.now()}`, // Include userId in reference
        },
      });
      
      return { movement, product };
    });
  }

  async adjustStock(
    productId: string,
    newQuantity: number,
    reason: string,
    userId: string,
  ): Promise<{ movement: any; product: any }> {
    // Start a transaction to ensure atomicity
    return prisma.$transaction(async (tx) => {
      // Fetch current product stock
      const productRecord = await tx.product.findUnique({
        where: { id: productId },
      });
      
      if (!productRecord) {
        throw new Error(`Product not found: ${productId}`);
      }
      
      const currentStock = productRecord.currentStock;
      const difference = newQuantity - currentStock;
      
      // Update product stock to the new absolute value
      const product = await tx.product.update({
        where: { id: productId },
        data: { currentStock: newQuantity },
      });
      
      // Create stock movement record with the difference
      const movement = await tx.stockMovement.create({
        data: {
          productId: productId,
          type: StockMovementType.ADJUSTMENT,
          quantity: difference,
          reason: reason,
          reference: `ADJUSTMENT_${userId}_${Date.now()}`, // Include userId in reference
        },
      });
      
      return { movement, product };
    });
  }

  async getStockMovements(
    productId?: string,
    type?: StockMovementType,
    startDate?: Date,
    endDate?: Date,
    limit?: number,
    skip?: number,
  ): Promise<any[]> {
    const where: any = {};
    if (productId) where.productId = productId;
    if (type) where.type = type;
    if (startDate) where.createdAt = { gte: startDate };
    if (endDate) where.createdAt = { ...where.createdAt, lte: endDate };
    
    const movements = await prisma.stockMovement.findMany({
      where,
      include: { product: true },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: skip,
    });
    
    return movements;
  }
}

export default new StockService();