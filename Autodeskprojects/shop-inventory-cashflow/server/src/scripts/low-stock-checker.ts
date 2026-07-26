import { PrismaClient } from '../generated/prisma';
import { getLowStockProducts } from '../lowStock/lowStock.service';

const prisma = new PrismaClient();

async function checkLowStock() {
  try {
    console.log('Running periodic low-stock check...');
    
    // 1. Get all low stock products
    const products = await getLowStockProducts() as any[];
    
    // 2. Clear old unacknowledged alerts
    await prisma.lowStockAlert.deleteMany({
      where: { isAcknowledged: false }
    });
    
    // 3. Create new alerts
    for (const product of products) {
      await prisma.lowStockAlert.create({
        data: {
          productId: product.id,
          productName: product.name,
          currentStock: product.currentStock,
          minStockLimit: product.minStockLimit,
          deficit: product.minStockLimit - product.currentStock
        }
      });
    }
    
    console.log(`Created ${products.length} low-stock alerts.`);
  } catch (error) {
    console.error('Error running low-stock check:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run every hour
setInterval(checkLowStock, 60 * 60 * 1000);
checkLowStock();
