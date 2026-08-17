// Sale edge-case checks against the running server
const BASE = 'http://localhost:4000';
const results = [];
let failures = 0;
function record(name, ok, detail) {
  results.push({ name, ok });
  if (!ok) failures++;
  console.log(`${ok ? '✅' : '❌'} ${name}${detail ? ' — ' + detail : ''}`);
}

async function req(method, path, body, cookie) {
  const headers = { 'Content-Type': 'application/json' };
  if (cookie) headers['Cookie'] = cookie;
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  let json = null;
  try { json = await res.json(); } catch {}
  return { status: res.status, body: json };
}

async function main() {
  // Login capturing cookie via raw fetch
  const lres = await fetch(`${BASE}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@shop.com', password: 'admin123' }),
  });
  const sc = typeof lres.headers.getSetCookie === 'function' ? lres.headers.getSetCookie() : [lres.headers.get('set-cookie')];
  const cookieStr = (sc && sc[0]) ? sc[0].split(';')[0] : '';

  // Create a product with only 2 units in stock
  const p = await req('POST', '/api/v1/products', {
    name: `QA Edge ${Date.now()}`, barcode: `ED${Date.now()}`.slice(0, 13), salePrice: 100, currentStock: 2, minStockLimit: 1,
  }, cookieStr);
  const pid = p.body?.data?.id;
  record('Edge: created low-stock product', !!pid, `id=${pid}`);

  if (pid) {
    // 1. Insufficient stock → 400
    let r = await req('POST', '/api/v1/sales', { items: [{ productId: pid, quantity: 10 }] }, cookieStr);
    record('Edge: insufficient stock → 400', r.status === 400 && r.body?.error?.code === 'INSUFFICIENT_STOCK', `status=${r.status}, body=${JSON.stringify(r.body)}`);

    // 2. Non-existent product → 404
    const fakeId = '00000000-0000-4000-8000-00000000dead';
    r = await req('POST', '/api/v1/sales', { items: [{ productId: fakeId, quantity: 1 }] }, cookieStr);
    record('Edge: non-existent product → 404', r.status === 404, `status=${r.status}, body=${JSON.stringify(r.body)}`);

    // 3. Empty items → 400
    r = await req('POST', '/api/v1/sales', { items: [] }, cookieStr);
    record('Edge: empty items → 400', r.status === 400, `status=${r.status}`);

    // 4. Invalid UUID productId → 400
    r = await req('POST', '/api/v1/sales', { items: [{ productId: 'not-a-uuid', quantity: 1 }] }, cookieStr);
    record('Edge: invalid productId UUID → 400', r.status === 400, `status=${r.status}`);

    // 5. Stock-in with invalid body (missing userId) → 400 via validateRequest
    r = await req('POST', '/api/v1/stock/in', { productId: pid, quantity: 5 }, cookieStr);
    record('Edge: stock/in missing userId → 400', r.status === 400, `status=${r.status}`);

    // 6. Product with 2 units — sell exactly 2 → success
    r = await req('POST', '/api/v1/sales', { items: [{ productId: pid, quantity: 2 }] }, cookieStr);
    record('Edge: sell exact stock (2) → 201', r.status === 201 && r.body?.data?.totalAmount === 200, `status=${r.status}, total=${r.body?.data?.totalAmount}`);

    // 7. Refund an unlinked sale (no account) → 200, stock restored
    const saleId = r.body?.data?.id;
    if (saleId) {
      r = await req('POST', `/api/v1/sales/${saleId}/refund`, {}, cookieStr);
      record('Edge: refund cash sale → 200', r.status === 200 && r.body?.data?.success === true, `status=${r.status}`);
      const pr = await req('GET', `/api/v1/products/${pid}`, undefined, cookieStr);
      record('Edge: refund restored stock to 2', pr.body?.data?.currentStock === 2, `stock=${pr.body?.data?.currentStock}`);
    }

    // Cleanup
    await req('DELETE', `/api/v1/products/${pid}`, undefined, cookieStr);
  }

  console.log(`\nEDGE TOTAL: ${results.length}, FAILED: ${failures}`);
  process.exit(failures ? 1 : 0);
}

main().catch(e => { console.error('Edge script crashed:', e); process.exit(2); });
