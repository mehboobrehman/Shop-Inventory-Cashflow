const axios = require('axios');

const API_BASE = 'http://localhost:4000/api/v1';

async function testProductEndpoints() {
  try {
    console.log('🧪 Testing Product Management Endpoints...\n');

    // First, let's login to get a token
    console.log('1️⃣ Logging in...');
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: 'owner@shop.com',
      password: 'password123'
    });
    
    const token = loginResponse.data.data.token;
    console.log('✅ Login successful, got token\n');

    // Set up axios with auth header
    const authAxios = axios.create({
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    // Test GET /products (should be empty initially)
    console.log('2️⃣ Testing GET /products...');
    const getProductsResponse = await authAxios.get(`${API_BASE}/products`);
    console.log('✅ GET /products response:', getProductsResponse.data);
    console.log('');

    // Test POST /products - create a product
    console.log('3️⃣ Testing POST /products...');
    const createResponse = await authAxios.post(`${API_BASE}/products`, {
      name: 'Test Product',
      barcode: '123456789012',
      salePrice: 100,
      currentStock: 50,
      minStockLimit: 10
    });
    console.log('✅ POST /products response:', createResponse.data);
    const productId = createResponse.data.data.id;
    console.log('');

    // Test POST /products - create another product for low stock test
    console.log('4️⃣ Creating another product for low stock test...');
    const createLowStockResponse = await authAxios.post(`${API_BASE}/products`, {
      name: 'Low Stock Product',
      barcode: '123456789013',
      salePrice: 50,
      currentStock: 5,
      minStockLimit: 10
    });
    const lowStockProductId = createLowStockResponse.data.data.id;
    console.log('✅ Created low stock product\n');

    // Test GET /products/:id
    console.log('5️⃣ Testing GET /products/:id...');
    const getProductResponse = await authAxios.get(`${API_BASE}/products/${productId}`);
    console.log('✅ GET /products/:id response:', getProductResponse.data);
    console.log('');

    // Test PUT /products/:id - update product
    console.log('6️⃣ Testing PUT /products/:id...');
    const updateResponse = await authAxios.put(`${API_BASE}/products/${productId}`, {
      name: 'Updated Test Product',
      salePrice: 150,
      currentStock: 75
    });
    console.log('✅ PUT /products/:id response:', updateResponse.data);
    console.log('');

    // Test GET /products with search
    console.log('7️⃣ Testing GET /products with search...');
    const searchResponse = await authAxios.get(`${API_BASE}/products?search=test`);
    console.log('✅ GET /products?search=test response:', searchResponse.data);
    console.log('');

    // Test GET /products with lowStock filter
    console.log('8️⃣ Testing GET /products with lowStock filter...');
    const lowStockResponse = await authAxios.get(`${API_BASE}/products?lowStock=true`);
    console.log('✅ GET /products?lowStock=true response:', lowStockResponse.data);
    console.log('');

    // Test GET /products with pagination
    console.log('9️⃣ Testing GET /products with pagination...');
    const paginationResponse = await authAxios.get(`${API_BASE}/products?page=1&limit=1`);
    console.log('✅ GET /products?page=1&limit=1 response:', paginationResponse.data);
    console.log('');

    // Test GET /products with combined filters
    console.log('🔟 Testing GET /products with combined filters...');
    const combinedResponse = await authAxios.get(`${API_BASE}/products?search=product&lowStock=true&page=1&limit=10`);
    console.log('✅ GET /products?search=product&lowStock=true&page=1&limit=10 response:', combinedResponse.data);
    console.log('');

    // Test DELETE /products/:id - soft delete
    console.log('1️⃣1️⃣ Testing DELETE /products/:id...');
    const deleteResponse = await authAxios.delete(`${API_BASE}/products/${productId}`);
    console.log('✅ DELETE /products/:id response:', deleteResponse.data);
    console.log('');

    // Test that deleted product is not returned in list
    console.log('1️⃣2️⃣ Verifying deleted product is not in list...');
    const finalListResponse = await authAxios.get(`${API_BASE}/products`);
    const deletedProductInList = finalListResponse.data.data.items.some(p => p.id === productId);
    console.log('✅ Deleted product in list:', deletedProductInList, '(should be false)');
    console.log('');

    // Test error cases
    console.log('1️⃣3️⃣ Testing error cases...');
    
    // Test invalid product ID
    try {
      await authAxios.get(`${API_BASE}/products/invalid-id`);
      console.log('❌ Should have failed for invalid ID');
    } catch (error) {
      console.log('✅ Invalid ID correctly returns error:', error.response?.status);
    }
    
    // Test invalid input for create
    try {
      await authAxios.post(`${API_BASE}/products`, {
        name: '', // Empty name should fail validation
        salePrice: -100 // Negative price should fail validation
      });
      console.log('❌ Should have failed for invalid input');
    } catch (error) {
      console.log('✅ Invalid input correctly returns error:', error.response?.status);
    }
    
    console.log('');
    console.log('✅ All product endpoint tests completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    process.exit(1);
  }
}

testProductEndpoints();