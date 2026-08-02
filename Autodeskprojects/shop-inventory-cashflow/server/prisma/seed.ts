/**
 * Seed script for Shop Inventory & Account Management System.
 *
 * Creates: 1 admin user, 12 sample products with barcodes, 3 accounts
 * (JazzCash, Easypaisa, Bank), stock-in movements for all products,
 * and 7 sample sales with linked sale items and account transactions.
 *
 * Uses upsert keyed on deterministic UUIDs so re-running is idempotent.
 */
import { PrismaClient } from '../src/generated/prisma';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Deterministic IDs so upserts are stable across re-runs.
const U = '00000000-0000-4000-8000-'; // common prefix

const IDS = {
  user: `${U}000000000001`,
  accountJazzCash: `${U}000000000010`,
  accountEasypaisa: `${U}000000000011`,
  accountBank: `${U}000000000012`,
} as const;

interface SeedProduct {
  id: string;
  name: string;
  barcode: string;
  salePrice: number;
  initialStock: number;
  minStockLimit: number;
}

const products: SeedProduct[] = [
  { id: `${U}000000000020`, name: 'Coca Cola 1.5L', barcode: '5449000000996', salePrice: 180, initialStock: 48, minStockLimit: 10 },
  { id: `${U}000000000021`, name: 'Pepsi 1.5L', barcode: '4060800048707', salePrice: 170, initialStock: 35, minStockLimit: 10 },
  { id: `${U}000000000022`, name: 'Lays Salted 32g', barcode: '6111021400028', salePrice: 60, initialStock: 8, minStockLimit: 15 },
  { id: `${U}000000000023`, name: 'Kurkure Masala 70g', barcode: '8901491502224', salePrice: 80, initialStock: 52, minStockLimit: 12 },
  { id: `${U}000000000024`, name: 'Nestle Water 1.5L', barcode: '6001068034193', salePrice: 90, initialStock: 120, minStockLimit: 24 },
  { id: `${U}000000000025`, name: 'Tapal Danedar Tea 950g', barcode: '5060321840123', salePrice: 1450, initialStock: 5, minStockLimit: 8 },
  { id: `${U}000000000026`, name: 'National Salt 800g', barcode: '5020349000016', salePrice: 95, initialStock: 30, minStockLimit: 10 },
  { id: `${U}000000000027`, name: 'Sufi Cooking Oil 5L', barcode: '5051378000019', salePrice: 2950, initialStock: 15, minStockLimit: 5 },
  { id: `${U}000000000028`, name: 'Dalda Ghee 1kg', barcode: '5051378001122', salePrice: 720, initialStock: 22, minStockLimit: 8 },
  { id: `${U}000000000029`, name: 'Sugar 1kg', barcode: '2000000000017', salePrice: 165, initialStock: 80, minStockLimit: 20 },
  { id: `${U}00000000002A`, name: 'Wheat Flour 10kg', barcode: '2000000000024', salePrice: 1250, initialStock: 18, minStockLimit: 6 },
  { id: `${U}00000000002B`, name: 'Milk Pak 1000ml', barcode: '4060800123456', salePrice: 280, initialStock: 7, minStockLimit: 15 },
];

interface SaleSpec {
  offsetDays: number;
  items: Array<{ productIdx: number; quantity: number }>;
  accountId: string;
}

const salesSpecs: SaleSpec[] = [
  { offsetDays: 6, items: [{ productIdx: 0, quantity: 2 }, { productIdx: 2, quantity: 3 }], accountId: IDS.accountJazzCash },
  { offsetDays: 5, items: [{ productIdx: 4, quantity: 1 }], accountId: IDS.accountEasypaisa },
  { offsetDays: 5, items: [{ productIdx: 8, quantity: 5 }, { productIdx: 2, quantity: 4 }], accountId: IDS.accountBank },
  { offsetDays: 4, items: [{ productIdx: 6, quantity: 2 }, { productIdx: 0, quantity: 1 }], accountId: IDS.accountJazzCash },
  { offsetDays: 3, items: [{ productIdx: 10, quantity: 1 }, { productIdx: 9, quantity: 2 }], accountId: IDS.accountEasypaisa },
  { offsetDays: 2, items: [{ productIdx: 3, quantity: 6 }, { productIdx: 4, quantity: 3 }, { productIdx: 11, quantity: 2 }], accountId: IDS.accountBank },
  { offsetDays: 1, items: [{ productIdx: 0, quantity: 3 }, { productIdx: 5, quantity: 1 }], accountId: IDS.accountJazzCash },
];

function saleId(i: number): string {
  return `${U}00000000${(0x40 + i).toString(16).padStart(4, '0')}`;
}
function saleItemId(saleIdx: number, itemIdx: number): string {
  return `${U}0000000${(0x40 + saleIdx).toString(16).padStart(3, '0')}${itemIdx}`;
}
function stockMovementId(productId: string): string {
  // Derive from product ID by flipping a prefix bit.
  return productId.replace('00000000002', '00000000003');
}
function accountTxId(saleIdx: number): string {
  return `${U}0000000${(0x60 + saleIdx).toString(16).padStart(3, '0')}0`;
}
function outStockMovementId(saleIdx: number, itemIdx: number): string {
  return `${U}0000000${(0x50 + saleIdx).toString(16).padStart(3, '0')}${itemIdx}`;
}

function lowStockAlertId(productId: string): string {
  // Derive from product ID by flipping a prefix bit.
  return productId.replace('00000000002', '00000000007');
}

async function main(): Promise<void> {
  console.log('🌱 Seeding database...');

  // ── User ────────────────────────────────────────────────────────────
  const passwordHash = await bcrypt.hash('admin123', 10);
  await prisma.user.upsert({
    where: { email: 'admin@shop.com' },
    update: { passwordHash, name: 'Shop Admin', role: 'ADMIN' },
    create: {
      id: IDS.user,
      email: 'admin@shop.com',
      passwordHash,
      name: 'Shop Admin',
      role: 'ADMIN',
    },
  });
  console.log('  ✓ User: admin@shop.com');

  // ── Accounts ────────────────────────────────────────────────────────
  await prisma.account.upsert({
    where: { id: IDS.accountJazzCash },
    update: {},
    create: { id: IDS.accountJazzCash, type: 'JAZZCASH', name: 'JazzCash Main', currentBalance: 25000 },
  });
  await prisma.account.upsert({
    where: { id: IDS.accountEasypaisa },
    update: {},
    create: { id: IDS.accountEasypaisa, type: 'EASYPISA', name: 'Easypaisa Shop', currentBalance: 15000 },
  });
  await prisma.account.upsert({
    where: { id: IDS.accountBank },
    update: {},
    create: { id: IDS.accountBank, type: 'BANK', name: 'HBL Current', currentBalance: 150000 },
  });
  console.log('  ✓ Accounts: JazzCash, Easypaisa, Bank');

  // ── Products + initial stock-in movements ───────────────────────────
  for (const p of products) {
    await prisma.product.upsert({
      where: { id: p.id },
      update: {
        name: p.name,
        barcode: p.barcode,
        salePrice: p.salePrice,
        currentStock: p.initialStock,
        minStockLimit: p.minStockLimit,
        isActive: true,
      },
      create: {
        id: p.id,
        name: p.name,
        barcode: p.barcode,
        salePrice: p.salePrice,
        currentStock: p.initialStock,
        minStockLimit: p.minStockLimit,
        isActive: true,
      },
    });

    await prisma.stockMovement.upsert({
      where: { id: stockMovementId(p.id) },
      update: {},
      create: {
        id: stockMovementId(p.id),
        productId: p.id,
        type: 'IN',
        quantity: p.initialStock,
        reason: 'Initial stock (seed)',
        reference: `SEED:INIT:${p.id}`,
      },
    });
  }
  console.log(`  ✓ Products: ${products.length} with barcodes + stock movements`);

  // ── Sales with items + account transactions ─────────────────────────
  const now = Date.now();
  const dayMs = 86_400_000;

  for (let i = 0; i < salesSpecs.length; i++) {
    const spec = salesSpecs[i];
    const sid = saleId(i);
    const createdAt = new Date(now - spec.offsetDays * dayMs);

    // Compute line items and totals.
    let totalAmount = 0;
    let itemCount = 0;
    const lineItems = spec.items.map((item) => {
      const product = products[item.productIdx];
      const lineTotal = product.salePrice * item.quantity;
      totalAmount += lineTotal;
      itemCount += item.quantity;
      return { product, quantity: item.quantity, lineTotal };
    });

    await prisma.sale.upsert({
      where: { id: sid },
      update: {},
      create: {
        id: sid,
        userId: IDS.user,
        accountId: spec.accountId,
        totalAmount,
        itemCount,
        createdAt,
        saleItems: {
          create: lineItems.map((item, j) => ({
            id: saleItemId(i, j),
            productId: item.product.id,
            quantity: item.quantity,
            salePrice: item.product.salePrice,
            totalAmount: item.lineTotal,
          })),
        },
      },
    });

    // Linked account deposit transaction for the sale.
    const account = await prisma.account.findUniqueOrThrow({ where: { id: spec.accountId } });
    const balanceBefore = Number(account.currentBalance);
    await prisma.accountTransaction.upsert({
      where: { id: accountTxId(i) },
      update: {},
      create: {
        id: accountTxId(i),
        accountId: spec.accountId,
        type: 'DEPOSIT',
        amount: totalAmount,
        balanceBefore,
        balanceAfter: balanceBefore + totalAmount,
        source: 'SALE',
        saleId: sid,
        description: `Sale ${sid.slice(-8)}`,
        createdAt,
      },
    });

    // OUT stock movements for each sale line item (audit trail).
    for (let j = 0; j < lineItems.length; j++) {
      const item = lineItems[j];
      await prisma.stockMovement.upsert({
        where: { id: outStockMovementId(i, j) },
        update: {},
        create: {
          id: outStockMovementId(i, j),
          productId: item.product.id,
          type: 'OUT',
          quantity: item.quantity,
          reason: 'Sale',
          reference: `SALE:${sid}`,
          createdAt,
        },
      });
    }
  }
  console.log(`  ✓ Sales: ${salesSpecs.length} with items + account transactions + OUT movements`);

  // ── Update product currentStock to reflect sales ────────────────────
  const soldQtyMap = new Map<string, number>();
  for (const spec of salesSpecs) {
    for (const item of spec.items) {
      const pid = products[item.productIdx].id;
      soldQtyMap.set(pid, (soldQtyMap.get(pid) ?? 0) + item.quantity);
    }
  }
  for (const p of products) {
    const sold = soldQtyMap.get(p.id) ?? 0;
    if (sold > 0) {
      await prisma.product.update({
        where: { id: p.id },
        data: { currentStock: p.initialStock - sold },
      });
    }
  }
  console.log(`  ✓ Product stock updated to reflect ${soldQtyMap.size} products with sales`);

  // ── LowStockAlerts — create alerts for products below their threshold ────
  const productsBelowThreshold = products.filter((p) => {
    const sold = soldQtyMap.get(p.id) ?? 0;
    const current = p.initialStock - sold;
    return current > 0 && current < p.minStockLimit;
  });

  for (const p of productsBelowThreshold) {
    const sold = soldQtyMap.get(p.id) ?? 0;
    const current = p.initialStock - sold;
    const deficit = p.minStockLimit - current;

    await prisma.lowStockAlert.upsert({
      where: { id: lowStockAlertId(p.id) },
      update: {
        productName: p.name,
        currentStock: current,
        minStockLimit: p.minStockLimit,
        deficit,
        isAcknowledged: false,
        acknowledgedAt: null,
      },
      create: {
        id: lowStockAlertId(p.id),
        productId: p.id,
        productName: p.name,
        currentStock: current,
        minStockLimit: p.minStockLimit,
        deficit,
        isAcknowledged: false,
      },
    });
  }
  console.log(`  ✓ LowStockAlerts: ${productsBelowThreshold.length} active alerts created`);

  console.log('🌱 Seed complete!');
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error('❌ Seed failed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
