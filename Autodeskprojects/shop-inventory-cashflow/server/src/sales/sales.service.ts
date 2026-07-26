import { prisma } from '../lib/prisma';
import { 
  Sale, 
  SaleItem, 
  CreateSaleItemDTO, 
  TransactionType, 
  TransactionSource 
} from '@shop/shared';
import { Prisma } from '../generated/prisma';

export class SalesService {
  /**
   * Convert Prisma Decimal to number safely for Money type.
   */
  private decimalToNumber(value: Prisma.Decimal): number {
    return typeof value.toNumber === 'function' ? value.toNumber() : Number(value);
  }

  /**
   * Map a SaleItem Prisma model to the API response SaleItem interface.
   */
  private mapSaleItemToResponse(item: any): SaleItem {
    return {
      id: item.id,
      saleId: item.saleId,
      productId: item.productId,
      productName: item.product.name, // Include product name from relation
      quantity: item.quantity,
      unitPrice: this.decimalToNumber(item.salePrice),
      lineTotal: this.decimalToNumber(item.totalAmount),
    };
  }

  /**
   * Map a Sale Prisma model (with items populated) to API response.
   */
  private mapSaleToResponse(sale: any): Sale {
    return {
      id: sale.id,
      userId: sale.userId,
      items: sale.saleItems.map(this.mapSaleItemToResponse),
      totalAmount: this.decimalToNumber(sale.totalAmount),
      itemCount: sale.itemCount,
      accountId: sale.accountId,
      accountType: sale.account?.type || null,
      createdAt: sale.createdAt.toISOString(),
    };
  }

  /**
   * Create a new sale with atomic transaction.
   * - Validates product existence and sufficient stock
   - Creates Sale + SaleItem records
   - Creates StockMovement OUT for each product
   - If accountId provided: creates AccountTransaction DEPOSIT and updates account balance
   */
  async createSale(input: { items: CreateSaleItemDTO[]; accountId?: string | null }, userId: string): Promise<Sale> {
    return prisma.$transaction(async (tx) => {
      const { items, accountId } = input;
      const productIds = items.map(item => item.productId);

      // 1. Lock all product rows to prevent concurrent stock modifications
      await tx.$queryRaw<any[]>`SELECT * FROM "Product" WHERE id IN (${productIds}) FOR UPDATE`;

      // 2. Validate all products exist and are active, also check stock (now locked)
      const products = await tx.product.findMany({
        where: { id: { in: productIds }, isActive: true },
      });

      // Map productId -> product
      const productMap = new Map(products.map(p => [p.id, p]));

      // Ensure all requested products were found and active
      for (const item of items) {
        const product = productMap.get(item.productId);
        if (!product) {
          throw new Error(`Product with ID ${item.productId} not found or is inactive.`);
        }
        if (product.currentStock < item.quantity) {
          throw new Error(`Insufficient stock for product "${product.name}". Available: ${product.currentStock}, Requested: ${item.quantity}`);
        }
      }

      // 3. Calculate total amount from line items using current product sale prices
      let totalAmount = new Prisma.Decimal(0);
      const saleItemsData = items.map(item => {
        const product = productMap.get(item.productId)!;
        const lineTotal = product.salePrice.mul(item.quantity);
        totalAmount = totalAmount.add(lineTotal);
        return {
          productId: item.productId,
          quantity: item.quantity,
          salePrice: product.salePrice,
          totalAmount: lineTotal,
        };
      });

      // 4. Create the Sale record
      const sale = await tx.sale.create({
        data: {
          userId,
          accountId: accountId || undefined,
          totalAmount,
          itemCount: items.length,
        },
      });

      // 5. Create SaleItem records linked to the sale
      await Promise.all(
        saleItemsData.map(siData =>
          tx.saleItem.create({
            data: {
              ...siData,
              saleId: sale.id,
            },
          })
        )
      );

      // 6. Create StockMovement OUT for each product and deduct currentStock
      await Promise.all(
        items.map(item => {
          const product = productMap.get(item.productId)!;
          return tx.stockMovement.create({
            data: {
              productId: item.productId,
              type: 'OUT',
              quantity: item.quantity,
              reason: `Sale: ${sale.id}`,
              reference: `SALE:${sale.id}`,
            },
          });
        })
      );

      // Bulk update product stock levels (deduct)
      await Promise.all(
        items.map(item => {
          const product = productMap.get(item.productId)!;
          return tx.product.update({
            where: { id: item.productId },
            data: {
              currentStock: { decrement: item.quantity },
            },
          });
        })
      );

      // 6. If accountId provided, create deposit AccountTransaction and update Account balance
      if (accountId) {
        // Verify account exists
        const account = await tx.account.findUnique({
          where: { id: accountId },
        });
        if (!account) {
          throw new Error(`Account with ID ${accountId} not found.`);
        }

        // We'll use raw SELECT FOR UPDATE for account balance to ensure atomicity
        const accounts = await tx.$queryRaw<any[]>`SELECT * FROM "Account" WHERE id = ${accountId} FOR UPDATE`;
        if (accounts.length === 0) {
          throw new Error(`Account with ID ${accountId} not found.`);
        }
        const dbAccount = accounts[0];
        const balanceBefore = new Prisma.Decimal(dbAccount.currentBalance);
        const balanceAfter = balanceBefore.add(totalAmount);

        // Update account balance
        await tx.account.update({
          where: { id: accountId },
          data: { currentBalance: balanceAfter },
        });

        // Create AccountTransaction (DEPOSIT) for this sale
        await tx.accountTransaction.create({
          data: {
            accountId,
            type: TransactionType.DEPOSIT,
            amount: totalAmount,
            balanceBefore,
            balanceAfter,
            source: TransactionSource.SALE,
            saleId: sale.id,
            description: 'Sale',
          },
        });
      }

      // 7. Return the complete sale with items (need to fetch fully populated)
      const fullSale = await tx.sale.findUnique({
        where: { id: sale.id },
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

      if (!fullSale) {
        throw new Error('Failed to retrieve created sale');
      }

      return this.mapSaleToResponse(fullSale);
    });
  }

  /**
   * Get paginated sales list with optional filters.
   */
  async getSales(params: {
    startDate?: string;
    endDate?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{ items: Sale[]; pagination: { page: number; limit: number; total: number; totalPages: number } }> {
    const { startDate, endDate, search, page = 1, limit = 20 } = params;

    const where: any = {};

    // Date range filter
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    // Search by product name using relation filter
    if (search) {
      where.saleItems = {
        some: {
          product: {
            name: {
              contains: search,
              mode: 'insensitive',
            },
          },
        },
      };
    }

    // Get total count for pagination
    const total = await prisma.sale.count({ where });

    // Fetch paginated sales
    const sales = await prisma.sale.findMany({
      where,
      include: {
        saleItems: {
          include: {
            product: {
              select: { name: true },
            },
          },
        },
        account: true,
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });

    const items = sales.map(this.mapSaleToResponse);
    const totalPages = Math.ceil(total / limit);

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  }

  /**
   * Get a single sale by ID with full item details.
   */
  async getSaleById(id: string): Promise<Sale | null> {
    const sale = await prisma.sale.findUnique({
      where: { id },
      include: {
        saleItems: {
          include: {
            product: {
              select: { name: true },
            },
          },
        },
        account: true,
      },
    });

    if (!sale) {
      return null;
    }

    return this.mapSaleToResponse(sale);
  }
}
