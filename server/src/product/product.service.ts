import { prisma } from '../lib/prisma';
import { Product, CreateProductDTO, UpdateProductDTO, ProductQueryParams, PaginatedData } from '@shop/shared';

export class ProductService {
  async getProductByBarcode(barcode: string): Promise<Product | null> {
    const product = await prisma.product.findUnique({
      where: { barcode, isActive: true },
    });
    return product ? this.mapToProductResponse(product) : null;
  }
  
  async createProduct(input: CreateProductDTO): Promise<Product> {
    const product = await prisma.product.create({
      data: {
        name: input.name,
        barcode: input.barcode || null,
        salePrice: input.salePrice,
        currentStock: input.currentStock || 0,
        minStockLimit: input.minStockLimit || 0,
        isActive: true,
      },
    });
    
    return this.mapToProductResponse(product);
  }

  async getProducts(params: ProductQueryParams): Promise<PaginatedData<Product>> {
    const { search, lowStock, page = 1, limit = 10 } = params;
    const skip = (page - 1) * limit;

    // Build search and lowStock conditions for SQL / Prisma
    // We want robust database-level pagination and counting for low stock as well.
    if (lowStock) {
      // Build dynamic where conditions for raw query
      let searchCondition = '';
      const queryParams: any[] = [];

      if (search) {
        searchCondition = `AND ("name" LIKE ? OR "barcode" LIKE ?)`;
        queryParams.push(`%${search}%`, `%${search}%`);
      }

      // Count query
      const countSql = `
        SELECT CAST(COUNT(*) AS INTEGER) as count
        FROM "Product"
        WHERE "isActive" = 1
          AND "minStockLimit" > 0
          AND "currentStock" <= "minStockLimit"
          ${searchCondition}
      `;
      const countResult = await prisma.$queryRawUnsafe<Array<{ count: number }>>(countSql, ...queryParams);
      const total = Number(countResult[0]?.count ?? 0);
      const totalPages = Math.ceil(total / limit);

      // Data query with LIMIT and OFFSET
      const dataSql = `
        SELECT *
        FROM "Product"
        WHERE "isActive" = 1
          AND "minStockLimit" > 0
          AND "currentStock" <= "minStockLimit"
          ${searchCondition}
        ORDER BY "name" ASC
        LIMIT ? OFFSET ?
      `;
      const products = await prisma.$queryRawUnsafe<Array<any>>(dataSql, ...queryParams, limit, skip);

      return {
        items: products.map(this.mapToProductResponse),
        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
      };
    }

    // Standard product query (when lowStock is false)
    const where: any = { isActive: true };
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { barcode: { contains: search } },
      ];
    }

    const total = await prisma.product.count({ where });
    const totalPages = Math.ceil(total / limit);

    const products = await prisma.product.findMany({
      where,
      skip,
      take: limit,
      orderBy: { name: 'asc' },
    });

    return {
      items: products.map(this.mapToProductResponse),
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  }

  async getProductById(id: string): Promise<Product | null> {
    const product = await prisma.product.findUnique({
      where: { id, isActive: true },
    });
    
    return product ? this.mapToProductResponse(product) : null;
  }

  async updateProduct(id: string, input: UpdateProductDTO): Promise<Product | null> {
    const product = await prisma.product.update({
      where: { id },
      data: {
        name: input.name,
        barcode: input.barcode,
        salePrice: input.salePrice,
        currentStock: input.currentStock,
        minStockLimit: input.minStockLimit,
        isActive: input.isActive,
        updatedAt: new Date(),
      },
    });
    
    return this.mapToProductResponse(product);
  }

  async deleteProduct(id: string): Promise<Product | null> {
    // Soft delete by setting isActive to false
    const product = await prisma.product.update({
      where: { id },
      data: { isActive: false, updatedAt: new Date() },
    });
    
    return this.mapToProductResponse(product);
  }

  async searchProducts(searchTerm: string): Promise<Product[]> {
    const products = await prisma.product.findMany({
      where: {
        isActive: true,
        OR: [
          { name: { contains: searchTerm } },
          { barcode: { contains: searchTerm } },
        ],
      },
      orderBy: { name: 'asc' },
    });
    
    return products.map(this.mapToProductResponse);
  }

  private mapToProductResponse(product: any): Product {
    return {
      id: product.id,
      name: product.name,
      barcode: product.barcode,
      salePrice: product.salePrice.toNumber(), // Convert Decimal to number
      currentStock: product.currentStock,
      minStockLimit: product.minStockLimit,
      isActive: product.isActive,
      createdAt: product.createdAt.toISOString(),
      updatedAt: product.updatedAt.toISOString(),
    };
  }
}
