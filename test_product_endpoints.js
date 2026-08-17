const axios = require('axios');

const API_BASE = 'http://localhost:4000/api/v1';

async function testProductEndpoints() {
  try {
    console.log('Testing Product Management Endpoints...\n');

    // First, let's login to get a token
    console.log('1. Logging in...');
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: 'owner@shop.com',
      password: 'password123'
    });
    
    const token = loginResponse.data.data.token;
    console.log('✓ Login successful, got token\n');

    // Set up axios with auth header
    const authAxios = axios.create({
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    // Test GET /products (should be empty initially)
    console.log('2. Testing GET /products...');
    const getProductsResponse = await authAxios.get(`${API_BASE}/products`);
    console.log('✓ GET /products response:', getProductsResponse.data);
    console.log('');

    // Test POST /products - create a product
    console.log('3. Testing POST /products...');
    const createResponse = await authAxios.post(`${API_BASE}/products`, {
      name: 'Test Product',
      barcode: '123456789012',
      salePrice: 100,
      currentStock: 50,
      minStockLimit: 10
    });
    console.log('✓ POST /products response:', createResponse.data);
    const productId = createResponse.data.data.id;
    console.log('');

    // Test GET /products/:id
    console.log('4. Testing GET /products/:id...');
    const getProductResponse = await authAxios.get(`${API_BASE}/products/${productId}`);
    console.log('✓ GET /products/:id response:', getProductResponse.data);
    console.log('');

    // Test PUT /products/:id - update product
    console.log('5. Testing PUT /products/:id...');
    const updateResponse = await authAxios.put(`${API_BASE}/products/${productId}`, {
      name: 'Updated Test Product',
      salePrice: 150
    });
    console.log('✓ PUT /products/:id response:', updateResponse.data);
    console.log('');

    // Test GET /products with search
    console.log('6. Testing GET /products with search...');
    const searchResponse = await authAxios.get(`${API_BASE}/products?search=test`);
    console.log('✓ GET /products?search=test response:', searchResponse.data);
    console.log('');

    // Test GET /products with lowStock filter
    console.log('7. Testing GET /products with lowStock filter...');
    const lowStockResponse = await authAxios.get(`${API_BASE}/products?lowStock=true`);
    console.log('✓ GET /products?lowStock=true response:', lowStockResponse.data);
    console.log('');

    // Test DELETE /products/:id - soft delete
    console.log('8. Testing DELETE /products/:id...');
    const deleteResponse = await authAxios.delete(`${API_BASE}/products/${productId}`);
    console.log('✓ DELETE /products/:id response:', deleteResponse.data);
    console.log('');

    // Test GET /products/search endpoint
    console.log('9. Testing GET /products/search...');
    const searchEndpointResponse = await authAxios.get(`${API_BASE}/products/search?search=test`);
    console.log('✓ GET /products/search response:', searchEndpointResponse.data);
    console.log('');

    console.log('✅ All product endpoint tests completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    process.exit(1);
  }
}

testProductEndpoints();