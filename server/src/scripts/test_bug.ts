import { createApp } from '../app';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';

async function main() {
  const app = createApp();
  const token = jwt.sign({ sub: '00000000-0000-4000-8000-000000000001', email: 'admin@shop.com', role: 'ADMIN' }, env.JWT_SECRET);

  const server = app.listen(0);
  const address = server.address();
  const port = typeof address === 'object' && address ? address.port : 0;
  console.log('Server started on port', port);

  const headers = { 'Cookie': 'token=' + token };

  try {
    console.log('\n--- Test 1: GET /api/v1/sales (no params) ---');
    let res = await fetch(`http://127.0.0.1:${port}/api/v1/sales`, { headers });
    console.log('Status:', res.status);
    console.log('Body:', await res.text());

    console.log('\n--- Test 2: GET /api/v1/sales?from=2026-08-01 ---');
    res = await fetch(`http://127.0.0.1:${port}/api/v1/sales?from=2026-08-01`, { headers });
    console.log('Status:', res.status);
    console.log('Body:', await res.text());

    console.log('\n--- Test 3: GET /api/v1/sales?from=2026-08-01&to=2026-08-01&page=1&limit=20 ---');
    res = await fetch(`http://127.0.0.1:${port}/api/v1/sales?from=2026-08-01&to=2026-08-01&page=1&limit=20`, { headers });
    console.log('Status:', res.status);
    console.log('Body:', await res.text());

    console.log('\n--- Test 4: GET /api/v1/dashboard/low-stock ---');
    res = await fetch(`http://127.0.0.1:${port}/api/v1/dashboard/low-stock`, { headers });
    console.log('Status:', res.status);
    console.log('Body:', await res.text());

  } catch (err) {
    console.error('Test error:', err);
  } finally {
    server.close();
    process.exit(0);
  }
}

main();
