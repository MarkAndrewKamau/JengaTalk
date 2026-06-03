const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");
const { createApp } = require("../src/app");
const { JsonStore } = require("../src/db/jsonStore");
const { createSmsService } = require("../src/services/smsService");

async function withServer(t) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "jengalink-"));
  const store = new JsonStore({ filePath: path.join(dir, "store.json") });
  const smsService = createSmsService({ store });
  const app = createApp({ store, smsService });
  const server = await new Promise((resolve) => {
    const instance = app.listen(0, "127.0.0.1", () => resolve(instance));
  });
  t.after(() => server.close());
  return {
    store,
    baseUrl: `http://127.0.0.1:${server.address().port}`,
  };
}

async function jsonFetch(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  const body = await response.json();
  return { response, body };
}

test("compares seeded cement prices by county", async (t) => {
  const { baseUrl } = await withServer(t);
  const { response, body } = await jsonFetch(`${baseUrl}/api/products/compare?material=cement&county=nairobi`);

  assert.equal(response.status, 200);
  assert.equal(body.material.name, "OPC Cement");
  assert.equal(body.results.length, 2);
  assert.equal(body.results[0].supplier.code, "BM01");
  assert.equal(body.results[0].price, 720);
});

test("handles SMS PRICE then ORDER flow", async (t) => {
  const { baseUrl, store } = await withServer(t);

  const price = await jsonFetch(`${baseUrl}/api/sms/inbound`, {
    method: "POST",
    body: JSON.stringify({ from: "0722123456", to: "20880", text: "PRICE cement nairobi" }),
  });
  assert.equal(price.response.status, 200);
  assert.match(price.body.reply, /BM01/);

  const order = await jsonFetch(`${baseUrl}/api/sms/inbound`, {
    method: "POST",
    body: JSON.stringify({ from: "0722123456", to: "20880", text: "ORDER BM01 10" }),
  });
  assert.equal(order.response.status, 200);
  assert.match(order.body.reply, /Order #1001 placed/);

  const created = store.findById("orders", 1001);
  assert.equal(created.status, "pending");
  assert.equal(created.total_amount, 7200);
});

test("handles multi-word SMS material names", async (t) => {
  const { baseUrl } = await withServer(t);
  const price = await jsonFetch(`${baseUrl}/api/sms/inbound`, {
    method: "POST",
    body: JSON.stringify({ from: "0722123457", to: "20880", text: "PRICE river sand nairobi" }),
  });

  assert.equal(price.response.status, 200);
  assert.match(price.body.reply, /River Sand/);
  assert.match(price.body.reply, /BM01/);
});

test("registers and verifies OTP for JWT access", async (t) => {
  const { baseUrl } = await withServer(t);
  const register = await jsonFetch(`${baseUrl}/api/auth/register`, {
    method: "POST",
    body: JSON.stringify({
      phone: "+254700000222",
      name: "Token Tester",
      role: "contractor",
      county: "Nairobi",
    }),
  });

  assert.equal(register.response.status, 201);
  assert.ok(register.body.dev_otp);

  const verify = await jsonFetch(`${baseUrl}/api/auth/verify-otp`, {
    method: "POST",
    body: JSON.stringify({ phone: "+254700000222", otp: register.body.dev_otp }),
  });
  assert.equal(verify.response.status, 200);
  assert.ok(verify.body.token);

  const alerts = await jsonFetch(`${baseUrl}/api/alerts`, {
    headers: { authorization: `Bearer ${verify.body.token}` },
  });
  assert.equal(alerts.response.status, 200);
  assert.deepEqual(alerts.body.alerts, []);
});

test("responds to USSD price lookup", async (t) => {
  const { baseUrl } = await withServer(t);
  const response = await fetch(`${baseUrl}/api/ussd`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionId: "ussd-1", phoneNumber: "+254722123456", text: "1*cement" }),
  });
  const text = await response.text();

  assert.equal(response.status, 200);
  assert.match(text, /^CON OPC Cement/);
  assert.match(text, /BM01/);
});

test("returns JSON errors for invalid async order requests", async (t) => {
  const { baseUrl } = await withServer(t);

  const missing = await jsonFetch(`${baseUrl}/api/orders/999/status`, {
    method: "PUT",
    headers: { "X-Demo-User-Phone": "+254711000001" },
    body: JSON.stringify({ status: "confirmed" }),
  });
  assert.equal(missing.response.status, 404);
  assert.equal(missing.body.error.message, "Order not found");

  const mismatch = await jsonFetch(`${baseUrl}/api/orders`, {
    method: "POST",
    body: JSON.stringify({
      contractor_phone: "+254722888999",
      supplier_id: 1,
      items: [{ supplier_product_id: 5, quantity: 10 }],
    }),
  });
  assert.equal(mismatch.response.status, 400);
  assert.equal(mismatch.body.error.message, "All order items must belong to the selected supplier");
});
