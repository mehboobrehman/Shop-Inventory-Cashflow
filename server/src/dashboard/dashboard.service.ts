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
  const result = await prisma.product.aggregate({
    _sum: {
      salePrice: true,
      currentStock: true
    },
    where: { isActive: true }
  });

  if (result._sum.salePrice === null || result._sum.currentStock === null) {
    return 0;
  }

  // Prisma's aggregate for sum of (A * B) is not directly available.
  // We need to use a raw query for this calculation.
  const rawResult = await prisma.$queryRaw<Array<{ total: number }>>`
    SELECT CAST(SUM(\"salePrice\" * \"currentStock\") AS REAL) AS total
    FROM \"Product\"
    WHERE \"isActive\" = TRUE
  `;
  return Number(rawResult[0]?.total ?? 0);
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
  const result = await prisma.account.aggregate({
    _sum: {
      currentBalance: true,
    },
  });
  return decimalToNumber(result._sum.currentBalance ?? 0);
}

/**
 * Get today's sales total and count.
 */
export async function getTodaysSales(): Promise<{ total: number; count: number }> {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  const result = await prisma.sale.aggregate({
    _sum: {
      totalAmount: true,
    },
    _count: {
      id: true,
    },
    where: {
      createdAt: {
        gte: startOfDay,
        lte: endOfDay,
      },
    },
  });

  const total = decimalToNumber(result._sum.totalAmount ?? 0);
  const count = result._count.id;
  return { total, count };
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
  const today = new Date();
  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - (days - 1));
  startDate.setHours(0, 0, 0, 0);

  const endDate = new Date(today);
  endDate.setHours(23, 59, 59, 999);

  // Fetch all sales within the range in a single query and group by date using SQLite strftime
  const rawSales = await prisma.$queryRaw<Array<{ dateStr: string; total: number }>>`
    SELECT strftime('%Y-%m-%d', "createdAt") as dateStr, CAST(SUM("totalAmount") AS REAL) as total
    FROM "Sale"
    WHERE "createdAt" >= ${startDate} AND "createdAt" <= ${endDate}
    GROUP BY dateStr
  `;

  const salesMap = new Map<string, number>();
  for (const row of rawSales) {
    salesMap.set(row.dateStr, Number(row.total ?? 0));
  }

  const result: SalesTrendData[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0]!;
    result.push({
      date: dateStr,
      total: salesMap.get(dateStr) || 0,
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