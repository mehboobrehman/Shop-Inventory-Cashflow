import { PrismaClient } from '../generated/prisma';

const prisma = new PrismaClient();

/**
 * Fetches products that are below their minimum stock threshold.
 * @returns {Promise<Array<any>>} Array of products with currentStock <= minStockLimit.
 */
export async function getLowStockProducts() {
  return prisma.$queryRaw`
    SELECT 
      id, name, barcode, "currentStock", "minStockLimit"
    FROM 
      "Product"
    WHERE 
      "currentStock" <= "minStockLimit"
      AND "minStockLimit" > 0
      AND "isActive" = true
  `;
}

/**
 * Returns the count of low-stock products.
 * @returns {Promise<number>} Count of low-stock products.
 */
export async function getLowStockProductsCount(): Promise<number> {
  const result = await prisma.$queryRaw<Array<{ count: number }>>`
    SELECT CAST(COUNT(*) AS INTEGER) AS count
    FROM "Product"
    WHERE "currentStock" <= "minStockLimit"
      AND "minStockLimit" > 0
      AND "isActive" = true
  `;
  return result[0]?.count ?? 0;
}