import { UUID } from './common';
/** A product that has fallen below its minimum stock threshold. */
export interface LowStockAlert {
    productId: UUID;
    productName: string;
    currentStock: number;
    minStockLimit: number;
    /** How many units below the threshold (always >= 1). */
    deficit: number;
}
//# sourceMappingURL=low-stock.d.ts.map