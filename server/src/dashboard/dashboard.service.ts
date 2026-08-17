import { prisma } from '../lib/prisma';
import { DashboardStats, SalesTrendData, Sale } from '@shop/shared';

/**
 * Helper to convert Prisma Decimal to number.
 */
function decimalToNumber(value: any): number {
  return typeof value.toNumber === 'function' ? value.toNumber() : Number(value);
}

/**
 * Calculate total stock value: sum(salePrice * currentStock) for all active products.
 */
export async function getTotalStockValue(): Promise<number> {
  const products = await prisma.product.findMany({
    where: { isActive: true },
    select: {
      salePrice: true,
      currentStock: true,
    },
  });
  const total = products.reduce((sum, p) => sum + decimalToNumber(p.salePrice) * p.currentStock, 0);
  return total;
}

/**
 * Get low stock count: count of products where currentStock <= minStockLimit and minStockLimit > 0 and active.
 */
export async function getLowStockCount(): Promise<number> {
  const result = await prisma.$queryRaw<Array<{ count: number }>>`
    SELECT CAST(COUNT(*) AS INTEGER) AS count
    FROM "Product"
    WHERE "currentStock" <= "minStockLimit"
      AND "minStockLimit" > 0
      AND "isActive" = true
  `;
  return Number(result[0]?.count ?? 0);
}

/**
 * Get total account balance: sum of currentBalance across all accounts.
 */
export async function getTotalAccountBalance(): Promise<number> {
  const accounts = await prisma.account.findMany({
    select: {
      currentBalance: true,
    },
  });
  const total = accounts.reduce((sum, a) => sum + decimalToNumber(a.currentBalance), 0);
  return total;
}

/**
 * Get today's sales total and count.
 */
export async function getTodaysSales(): Promise<{ total: number; count: number }> {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  const sales = await prisma.sale.findMany({
    where: {
      createdAt: {
        gte: startOfDay,
        lte: endOfDay,
      },
    },
    select: {
      totalAmount: true,
    },
  });

  const total = sales.reduce((sum, s) => sum + decimalToNumber(s.totalAmount), 0);
  return { total, count: sales.length };
}

/**
 * Get recent sales (last N) with full item details.
 */
export async function getRecentSales(limit: number = 10): Promise<Sale[]> {
  const sales = await prisma.sale.findMany({
    take: limit,
    orderBy: { createdAt: 'desc' },
    include: {
      saleItems: {
        include: {
          product: {
            select: {
              name: true,
            },
          },
        },
      },
      account: true,
    },
  });

  // Map to Sale interface
  return sales.map((sale: any): Sale => ({
    id: sale.id,
    userId: sale.userId,
    items: sale.saleItems.map((item: any) => ({
      id: item.id,
      saleId: item.saleId,
      productId: item.productId,
      productName: item.product.name,
      quantity: item.quantity,
      unitPrice: decimalToNumber(item.salePrice),
      lineTotal: decimalToNumber(item.totalAmount),
    })),
    totalAmount: decimalToNumber(sale.totalAmount),
    itemCount: sale.itemCount,
    accountId: sale.accountId,
    accountType: sale.account?.type || null,
    createdAt: sale.createdAt.toISOString(),
  }));
}

/**
 * Get sales trend data for the last N days.
 * Returns an array of { date (YYYY-MM-DD), total } for each day.
 * Days with no sales will still be included with total = 0.
 */
export async function getSalesTrend(days: number = 7): Promise<SalesTrendData[]> {
  const result: SalesTrendData[] = [];
  const today = new Date();
  // Start from (today - days + 1) to include today
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    // Set start and end of this day
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

    // Sum sales for this day
    const sales = await prisma.sale.findMany({
      where: {
        createdAt: {
          gte: dayStart,
          lte: dayEnd,
        },
      },
      select: {
        totalAmount: true,
      },
    });

    const dailyTotal = sales.reduce((sum, s) => sum + decimalToNumber(s.totalAmount), 0);
    result.push({
      date: date.toISOString().split('T')[0]!, // YYYY-MM-DD
      total: dailyTotal,
    });
  }
  return result;
}

/**
 * Get all dashboard stats in one call.
 */
export async function getDashboardStats(): Promise<DashboardStats> {
  const [totalProducts, totalStockValue, lowStockCount, totalAccountBalance, todaysSales] = await Promise.all([
    prisma.product.count({ where: { isActive: true } }),
    getTotalStockValue(),
    getLowStockCount(),
    getTotalAccountBalance(),
    getTodaysSales(),
  ]);

  return {
    totalProducts,
    totalStockValue,
    lowStockCount,
    totalAccountBalance,
    todaySalesTotal: todaysSales.total,
    todaySalesCount: todaysSales.count,
  };
}