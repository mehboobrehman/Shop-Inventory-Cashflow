/**
 * Comprehensive E2E verification for Shop-Inventory-Cashflow.
 * Run with: node test/e2e_verify.cjs  (requires the backend running on port 4000)
 *
 * Tests all core endpoints with a real logged-in cookie session:
 *   Auth, Dashboard, Products, Stock, Sales, Accounts, Barcode
 */
const BASE = process.env.BASE_URL || 'http://localhost:4000';

let cookie = '';
const results = [];
let failures = 0;

function record(name, ok, detail) {
  results.push({ name, ok, detail });
  if (!ok) failures++;
  const mark = ok ? '✅' : '❌';
  console.log(`${mark} ${name}${detail ? ' — ' + detail : ''}`);
}

function extractCookie(res) {
  const sc = typeof res.headers.getSetCookie === 'function' ? res.headers.getSetCookie() : null;
  if (sc && sc.length) return sc[0].split(';')[0];
  const single = res.headers.get('set-cookie');
  if (single) return single.split(';')[0];
  return '';
}

async function req(method, path, body, opts = {}) {
  const headers = { ...(opts.headers || {}) };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (cookie && !opts.noCookie) headers['Cookie'] = cookie;
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    redirect: 'manual',
  });
  let json = null;
  try { json = await res.json(); } catch { /* no body */ }
  return { status: res.status, body: json, headers: res.headers };
}

async function main() {
  // ── 1. Health ───────────────────────────────────────────────────────
  try {
    const r = await req('GET', '/api/v1/health');
    record('GET /api/v1/health', r.status === 200 && r.body?.success === true, `status=${r.status}`);
  } catch (e) { record('GET /api/v1/health', false, e.message); }

  // ── 2. Auth ─────────────────────────────────────────────────────────
  // Unauthenticated access must be rejected
  let r = await req('GET', '/api/v1/products', undefined, { noCookie: true });
  record('Unauthenticated GET /products → 401', r.status === 401, `status=${r.status}`);

  // Wrong password
  r = await req('POST', '/api/v1/auth/login', { email: 'admin@shop.com', password: 'wrongpass' });
  record('Login with wrong password → 401', r.status === 401, `status=${r.status}`);

  // Valid login
  r = await req('POST', '/api/v1/auth/login', { email: 'admin@shop.com', password: 'admin123' });
  cookie = extractCookie(r);
  record('Login admin@shop.com → 200 + cookie', r.status === 200 && !!cookie && r.body?.success === true, `status=${r.status}, cookie=${cookie ? 'set' : 'MISSING'}`);
  if (!cookie) { console.log('ABORT: could not log in'); process.exit(2); }

  r = await req('GET', '/api/v1/auth/me');
  record('GET /auth/me → 200', r.status === 200 && r.body?.data?.email === 'admin@shop.com', `status=${r.status}, role=${r.body?.data?.role}`);

  // ── 3. Dashboard ────────────────────────────────────────────────────
  r = await req('GET', '/api/v1/dashboard/stats');
  record('GET /dashboard/stats → 200', r.status === 200 && r.body?.success === true, `status=${r.status}`);

  r = await req('GET', '/api/v1/dashboard/low-stock');
  record('GET /dashboard/low-stock → 200 (was 500)', r.status === 200 && Array.isArray(r.body?.data?.products), `status=${r.status}, count=${r.body?.data?.count}`);

  r = await req('GET', '/api/v1/dashboard/recent-sales');
  record('GET /dashboard/recent-sales → 200', r.status === 200 && Array.isArray(r.body?.data), `status=${r.status}, items=${Array.isArray(r.body?.data) ? r.body.data.length : 'n/a'}`);

  r = await req('GET', '/api/v1/dashboard/sales-trend?days=7');
  record('GET /dashboard/sales-trend → 200', r.status === 200 && Array.isArray(r.body?.data), `status=${r.status}, days=${Array.isArray(r.body?.data) ? r.body.data.length : 'n/a'}`);

  // ── 4. Products ─────────────────────────────────────────────────────
  r = await req('GET', '/api/v1/products?page=1&limit=10');
  record('GET /products?page=1&limit=10 → 200 (was 400)', r.status === 200 && Array.isArray(r.body?.data?.items), `status=${r.status}, total=${r.body?.data?.pagination?.total}`);

  r = await req('GET', '/api/v1/products?page=1&limit=10&search=Cola');
  record('GET /products?search=Cola → 200', r.status === 200 && Array.isArray(r.body?.data?.items), `status=${r.status}, matches=${Array.isArray(r.body?.data?.items) ? r.body.data.items.length : 'n/a'}`);

  r = await req('GET', '/api/v1/products?page=0');
  record('GET /products?page=0 → 400 (validation)', r.status === 400, `status=${r.status}`);

  // Create a product for mutation tests
  const testProductName = `QA Product ${Date.now()}`;
  r = await req('POST', '/api/v1/products', {
    name: testProductName,
    barcode: `QA${Date.now()}`.slice(0, 13),
    salePrice: 150,
    currentStock: 50,
    minStockLimit: 5,
  });
  const product = r.body?.data;
  record('POST /products → 201', r.status === 201 && !!product?.id, `status=${r.status}, id=${product?.id}`);
  if (product?.id) {
    const pid = product.id;
    r = await req('GET', `/api/v1/products/${pid}`);
    record('GET /products/:id → 200', r.status === 200 && r.body?.data?.id === pid, `status=${r.status}`);

    r = await req('PUT', `/api/v1/products/${pid}`, { name: `${testProductName} Updated`, salePrice: 175 });
    record('PUT /products/:id → 200', r.status === 200 && r.body?.data?.name?.includes('Updated'), `status=${r.status}`);

    r = await req('GET', `/api/v1/products/barcode/${encodeURIComponent(product.barcode)}`);
    record('GET /products/barcode/:barcode → 200', r.status === 200 && r.body?.data?.id === pid, `status=${r.status}`);

    // ── 5. Stock ──────────────────────────────────────────────────────
    r = await req('GET', '/api/v1/stock/movements?limit=50');
    record('GET /stock/movements?limit=50 → 200 (was 400)', r.status === 200 && Array.isArray(r.body?.data), `status=${r.status}, items=${Array.isArray(r.body?.data) ? r.body.data.length : 'n/a'}`);

    r = await req('POST', '/api/v1/stock/in', { productId: pid, quantity: 10, reason: 'QA stock-in', userId: 'qa-user' });
    record('POST /stock/in → 201', r.status === 201 && r.body?.data?.product?.currentStock === 60, `status=${r.status}, stock=${r.body?.data?.product?.currentStock}`);

    r = await req('POST', '/api/v1/stock/adjust', { productId: pid, newQuantity: 25, reason: 'QA adjust', userId: 'qa-user' });
    record('POST /stock/adjust → 201', r.status === 201 && r.body?.data?.product?.currentStock === 25, `status=${r.status}, stock=${r.body?.data?.product?.currentStock}`);

    r = await req('GET', `/api/v1/stock/movements?productId=${pid}&limit=10`);
    record('GET /stock/movements?productId → 200', r.status === 200 && Array.isArray(r.body?.data), `status=${r.status}, items=${Array.isArray(r.body?.data) ? r.body.data.length : 'n/a'}`);

    // ── 6. Sales (full checkout transaction) ──────────────────────────
    const accountsRes = await req('GET', '/api/v1/accounts');
    const accounts = accountsRes.body?.data || [];
    const targetAccount = accounts.find(a => a.type === 'JAZZCASH') || accounts[0];
    const balanceBeforeSale = targetAccount ? targetAccount.currentBalance : null;

    r = await req('POST', '/api/v1/sales', {
      items: [{ productId: pid, quantity: 3 }],
      accountId: targetAccount ? targetAccount.id : null,
    });
    const sale = r.body?.data;
    record('POST /sales (checkout) → 201', r.status === 201 && !!sale?.id && sale?.totalAmount === 525, `status=${r.status}, total=${sale?.totalAmount}, id=${sale?.id}`);

    // Sales list + get by id must ALWAYS work (independent of creation above)
    r = await req('GET', '/api/v1/sales?page=1&limit=10');
    record('GET /sales?page=1&limit=10 → 200', r.status === 200 && Array.isArray(r.body?.data?.items), `status=${r.status}, total=${r.body?.data?.pagination?.total}`);

    if (sale?.id) {
      // Verify product stock decremented 25 → 22
      const prodAfter = await req('GET', `/api/v1/products/${pid}`);
      record('Sale decremented stock (25→22)', prodAfter.body?.data?.currentStock === 22, `stock=${prodAfter.body?.data?.currentStock}`);

      // Verify account balance increased
      const accAfter = await req('GET', `/api/v1/accounts/${targetAccount.id}`);
      const expected = balanceBeforeSale + 525;
      record('Sale deposited into account', accAfter.body?.data?.currentBalance === expected, `before=${balanceBeforeSale}, after=${accAfter.body?.data?.currentBalance}, expected=${expected}`);

      // Verify OUT stock movement recorded
      const mv = await req('GET', `/api/v1/stock/movements?productId=${pid}&limit=5`);
      const hasOut = Array.isArray(mv.body?.data) && mv.body.data.some(m => m.type === 'OUT' && m.reference === `SALE:${sale.id}`);
      record('Stock OUT movement recorded for sale', hasOut, `items=${Array.isArray(mv.body?.data) ? mv.body.data.length : 'n/a'}`);

      r = await req('GET', `/api/v1/sales/${sale.id}`);
      record('GET /sales/:id → 200', r.status === 200 && r.body?.data?.id === sale.id, `status=${r.status}`);

      // Refund
      r = await req('POST', `/api/v1/sales/${sale.id}/refund`);
      record('POST /sales/:id/refund → 200', r.status === 200 && r.body?.data?.success === true, `status=${r.status}, msg=${r.body?.data?.message}`);

      const prodAfterRefund = await req('GET', `/api/v1/products/${pid}`);
      record('Refund restored stock (22→25)', prodAfterRefund.body?.data?.currentStock === 25, `stock=${prodAfterRefund.body?.data?.currentStock}`);

      const accAfterRefund = await req('GET', `/api/v1/accounts/${targetAccount.id}`);
      record('Refund restored account balance', accAfterRefund.body?.data?.currentBalance === balanceBeforeSale, `after=${accAfterRefund.body?.data?.currentBalance}, expected=${balanceBeforeSale}`);
    } else {
      // Verify failed sale left no partial data: stock unchanged (still 25)
      const prodAfter = await req('GET', `/api/v1/products/${pid}`);
      record('Failed sale did not decrement stock (rollback)', prodAfter.body?.data?.currentStock === 25, `stock=${prodAfter.body?.data?.currentStock}`);
    }

    // ── 7. Accounts ───────────────────────────────────────────────────
    r = await req('GET', '/api/v1/accounts');
    record('GET /accounts → 200', r.status === 200 && Array.isArray(r.body?.data), `status=${r.status}, count=${Array.isArray(r.body?.data) ? r.body.data.length : 'n/a'}`);

    // Create a dedicated QA account
    r = await req('POST', '/api/v1/accounts', { type: 'BANK', name: `QA Bank ${Date.now()}`, initialBalance: 1000 });
    const qaAcc = r.body?.data;
    record('POST /accounts → 201', r.status === 201 && !!qaAcc?.id, `status=${r.status}, id=${qaAcc?.id}`);

    if (qaAcc?.id) {
      r = await req('GET', `/api/v1/accounts/${qaAcc.id}`);
      record('GET /accounts/:id → 200', r.status === 200 && r.body?.data?.id === qaAcc.id, `status=${r.status}`);

      r = await req('POST', `/api/v1/accounts/${qaAcc.id}/deposit`, { amount: 500, description: 'QA deposit' });
      record('POST /accounts/:id/deposit → 200', r.status === 200 && r.body?.data?.account?.currentBalance === 1500, `status=${r.status}, bal=${r.body?.data?.account?.currentBalance}`);

      r = await req('POST', `/api/v1/accounts/${qaAcc.id}/withdraw`, { amount: 200, description: 'QA withdrawal' });
      record('POST /accounts/:id/withdraw → 200', r.status === 200 && r.body?.data?.account?.currentBalance === 1300, `status=${r.status}, bal=${r.body?.data?.account?.currentBalance}`);

      r = await req('POST', `/api/v1/accounts/${qaAcc.id}/withdraw`, { amount: 999999 });
      record('Withdraw over balance → 400', r.status === 400, `status=${r.status}`);

      r = await req('GET', `/api/v1/accounts/${qaAcc.id}/transactions?limit=10`);
      record('GET /accounts/:id/transactions → 200', r.status === 200 && Array.isArray(r.body?.data?.items), `status=${r.status}, tx=${Array.isArray(r.body?.data?.items) ? r.body.data.items.length : 'n/a'}`);
    }

    // Cleanup test product (soft delete)
    r = await req('DELETE', `/api/v1/products/${pid}`);
    record('DELETE /products/:id → 200 (soft)', r.status === 200, `status=${r.status}`);
  }

  // ── 8. Logout ───────────────────────────────────────────────────────
  r = await req('POST', '/api/v1/auth/logout');
  record('POST /auth/logout → 200', r.status === 200, `status=${r.status}`);
  cookie = '';
  r = await req('GET', '/api/v1/auth/me', undefined, { noCookie: true });
  record('GET /auth/me after logout → 401', r.status === 401, `status=${r.status}`);

  // ── Summary ─────────────────────────────────────────────────────────
  console.log('\n══════════════════════════════════════════════════════');
  console.log(`TOTAL: ${results.length} checks, PASSED: ${results.length - failures}, FAILED: ${failures}`);
  if (failures > 0) {
    console.log('\nFAILED CHECKS:');
    results.filter(r => !r.ok).forEach(r => console.log(`  ❌ ${r.name} — ${r.detail}`));
    process.exit(1);
  } else {
    console.log('ALL CHECKS PASSED ✅');
    process.exit(0);
  }
}

main().catch(e => { console.error('E2E script crashed:', e); process.exit(2); });
