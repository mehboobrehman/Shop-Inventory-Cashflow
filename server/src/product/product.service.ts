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
    
    // Build where clause
    const where: any = { isActive: true };
    
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { barcode: { contains: search } },
      ];
    }
    
    if (lowStock) {
      // Get all products that might be low stock (with minStockLimit > 0)
      where.minStockLimit = { gt: 0 };
    }
    
    // Get total count for pagination
    const total = await prisma.product.count({ where });
    const totalPages = Math.ceil(total / limit);
    
    // Get paginated products
    const products = await prisma.product.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { name: 'asc' },
    });
    
    // Filter in memory for lowStock to compare currentStock < minStockLimit
    const filteredProducts = lowStock 
      ? products.filter(p => p.currentStock < p.minStockLimit)
      : products;
    
    return {
      items: filteredProducts.map(this.mapToProductResponse),
      pagination: {
        page,
        limit,
        total: lowStock ? filteredProducts.length : total,
        totalPages: lowStock ? Math.ceil(filteredProducts.length / limit) : totalPages,
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
