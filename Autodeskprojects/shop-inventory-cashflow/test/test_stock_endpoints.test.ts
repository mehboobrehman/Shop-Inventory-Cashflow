// This is a basic test script for stock endpoints.
// Run with: `bun test test/test_stock_endpoints.test.ts`

import { createApp } from "../server/src/app";
import { PrismaClient } from "../server/src/generated/prisma";
import request from "supertest";

const prisma = new PrismaClient();
const app = createApp();

// Helper function to create a test product
async function createTestProduct() {
  return await prisma.product.create({
    data: {
      name: "Test Product",
      barcode: "1234567890",
      salePrice: 100,
      currentStock: 0,
      minStockLimit: 5,
    },
  });
}

// Helper function to clean up
async function cleanUp() {
  await prisma.product.deleteMany({});
  await prisma.stockMovement.deleteMany({});
}

// Test POST /api/v1/stock/in
(async () => {
  try {
    const product = await createTestProduct();
    const response = await request(app)
      .post("/api/v1/stock/in")
      .send({
        productId: product.id,
        quantity: 10,
        reason: "Initial stock-in",
        userId: "test-user-id",
      });
    
    console.log("POST /api/v1/stock/in response:", response.body);
    console.assert(response.status === 201, `Expected status 201, got ${response.status}`);
    console.assert(response.body.success === true, `Expected success: true, got ${response.body.success}`);
    console.assert(response.body.data.movement.type === "IN", `Expected type: IN, got ${response.body.data.movement.type}`);
    console.assert(response.body.data.product.currentStock === 10, `Expected stock: 10, got ${response.body.data.product.currentStock}`);
    
    await cleanUp();
    console.log("✅ POST /api/v1/stock/in test passed");
  } catch (error) {
    console.error("❌ POST /api/v1/stock/in test failed:", error);
  }
})();

// Test POST /api/v1/stock/adjust
(async () => {
  try {
    const product = await createTestProduct();
    const response = await request(app)
      .post("/api/v1/stock/adjust")
      .send({
        productId: product.id,
        quantity: 5,
        reason: "Stock adjustment",
        userId: "test-user-id",
      });
    
    console.log("POST /api/v1/stock/adjust response:", response.body);
    console.assert(response.status === 201, `Expected status 201, got ${response.status}`);
    console.assert(response.body.success === true, `Expected success: true, got ${response.body.success}`);
    console.assert(response.body.data.movement.type === "ADJUSTMENT", `Expected type: ADJUSTMENT, got ${response.body.data.movement.type}`);
    console.assert(response.body.data.product.currentStock === 5, `Expected stock: 5, got ${response.body.data.product.currentStock}`);
    
    await cleanUp();
    console.log("✅ POST /api/v1/stock/adjust test passed");
  } catch (error) {
    console.error("❌ POST /api/v1/stock/adjust test failed:", error);
  }
})();

// Test GET /api/v1/stock/movements
(async () => {
  try {
    const product = await createTestProduct();
    // Add some stock first
    await request(app)
      .post("/api/v1/stock/in")
      .send({
        productId: product.id,
        quantity: 10,
        reason: "Initial stock-in",
        userId: "test-user-id",
      });
    
    const response = await request(app)
      .get("/api/v1/stock/movements")
      .query({
        productId: product.id,
      });
    
    console.log("GET /api/v1/stock/movements response:", response.body);
    console.assert(response.status === 200, `Expected status 200, got ${response.status}`);
    console.assert(response.body.success === true, `Expected success: true, got ${response.body.success}`);
    console.assert(Array.isArray(response.body.data), `Expected data to be an array, got ${typeof response.body.data}`);
    console.assert(response.body.data.length > 0, `Expected data to have at least one item, got ${response.body.data.length}`);
    
    await cleanUp();
    console.log("✅ GET /api/v1/stock/movements test passed");
  } catch (error) {
    console.error("❌ GET /api/v1/stock/movements test failed:", error);
  }
})();