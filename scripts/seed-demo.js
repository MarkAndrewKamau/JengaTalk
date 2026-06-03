const { env } = require("../src/config/env");
const { JsonStore } = require("../src/db/jsonStore");
const { demoContractors, demoOrders, demoSmsLogs, demoPriceAlerts } = require("../src/db/demoSeed");
const { seedCatalog } = require("./seed-catalog");

function normalize(value) {
  return String(value || "").trim().toLowerCase();
}

function nextId(data, collection) {
  const current = data.meta.nextIds[collection] || 1;
  data.meta.nextIds[collection] = current + 1;
  return current;
}

function bumpNextIds(data) {
  for (const collection of Object.keys(data.meta.nextIds)) {
    if (!Array.isArray(data[collection])) continue;
    const maxId = data[collection].reduce((max, item) => Math.max(max, Number(item.id) || 0), 0);
    data.meta.nextIds[collection] = Math.max(data.meta.nextIds[collection] || 1, maxId + 1);
  }
}

function dateFromNow({ days = 0, minutes = 0 }) {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000 + minutes * 60 * 1000).toISOString();
}

function upsertUser(data, input, role = "contractor") {
  const existing = data.users.find((user) => normalize(user.phone) === normalize(input.phone));
  if (existing) {
    Object.assign(existing, {
      name: input.name || existing.name,
      role,
      county: normalize(input.county || existing.county),
      verified: true,
      otp_code: null,
      otp_expires: null,
    });
    return { user: existing, created: false };
  }

  const user = {
    id: nextId(data, "users"),
    phone: input.phone,
    name: input.name,
    role,
    county: normalize(input.county),
    created_at: dateFromNow({ days: -14 }),
    verified: true,
    otp_code: null,
    otp_expires: null,
  };
  data.users.push(user);
  return { user, created: true };
}

function findSupplier(data, code) {
  return data.suppliers.find((supplier) => normalize(supplier.code) === normalize(code));
}

function findMaterial(data, name) {
  return data.materials.find((material) => normalize(material.name) === normalize(name));
}

function findProduct(data, supplierId, materialId) {
  return data.supplier_products.find((product) => {
    return Number(product.supplier_id) === Number(supplierId) && Number(product.material_id) === Number(materialId);
  });
}

function buildOrderEvents(order, supplierName) {
  const placedAt = dateFromNow({ days: -order.created_days_ago, minutes: -30 });
  const events = [
    {
      event_type: "placed",
      note: `Order placed for ${supplierName}`,
      sms_sent: false,
      created_at: placedAt,
    },
  ];

  if (["confirmed", "dispatched", "delivered"].includes(order.status)) {
    events.push({
      event_type: "confirmed",
      note: "Supplier confirmed stock and delivery slot",
      sms_sent: true,
      created_at: dateFromNow({ days: -Math.max(order.created_days_ago - 0.25, 0), minutes: -15 }),
    });
  }

  if (["dispatched", "delivered"].includes(order.status)) {
    events.push({
      event_type: "dispatched",
      note: "Truck dispatched from supplier depot",
      sms_sent: true,
      created_at: dateFromNow({ days: -Math.max(order.created_days_ago - 1, 0), minutes: -10 }),
    });
  }

  if (order.status === "delivered") {
    events.push({
      event_type: "delivered",
      note: "Materials delivered and receipt acknowledged",
      sms_sent: true,
      created_at: dateFromNow({ days: -1, minutes: -25 }),
    });
  }

  if (order.status === "cancelled") {
    events.push({
      event_type: "cancelled",
      note: "Contractor cancelled after budget revision",
      sms_sent: true,
      created_at: dateFromNow({ days: -1, minutes: -45 }),
    });
  }

  if (order.status === "rejected") {
    events.push({
      event_type: "rejected",
      note: "Supplier rejected due to low stock",
      sms_sent: true,
      created_at: dateFromNow({ days: -1, minutes: -35 }),
    });
  }

  return events;
}

function seedDemo(store) {
  const catalogSummary = seedCatalog(store);
  const demoOrderIds = new Set(demoOrders.map((order) => order.id));
  const summary = {
    contractors_created: 0,
    contractors_updated: 0,
    orders_upserted: 0,
    order_items_seeded: 0,
    delivery_events_seeded: 0,
    sms_logs_seeded: 0,
    price_alerts_upserted: 0,
  };

  store.transaction((data) => {
    const contractorByPhone = new Map();

    for (const contractorInput of demoContractors) {
      const { user, created } = upsertUser(data, contractorInput, "contractor");
      contractorByPhone.set(normalize(user.phone), user);
      summary[created ? "contractors_created" : "contractors_updated"] += 1;
    }

    data.order_items = data.order_items.filter((item) => !demoOrderIds.has(Number(item.order_id)));
    data.delivery_events = data.delivery_events.filter((event) => !demoOrderIds.has(Number(event.order_id)));

    for (const orderInput of demoOrders) {
      const contractor = contractorByPhone.get(normalize(orderInput.contractor_phone));
      const supplier = findSupplier(data, orderInput.supplier_code);
      if (!contractor) throw new Error(`Unknown contractor in demo order: ${orderInput.contractor_phone}`);
      if (!supplier) throw new Error(`Unknown supplier in demo order: ${orderInput.supplier_code}`);

      const items = orderInput.items.map((itemInput) => {
        const material = findMaterial(data, itemInput.material);
        if (!material) throw new Error(`Unknown material in demo order #${orderInput.id}: ${itemInput.material}`);
        const product = findProduct(data, supplier.id, material.id);
        if (!product) {
          throw new Error(`Supplier ${supplier.code} has no product for ${itemInput.material} in demo order #${orderInput.id}`);
        }
        const quantity = Number(itemInput.quantity);
        const unitPrice = Number(product.price);
        return {
          supplier_product_id: product.id,
          quantity,
          unit_price: unitPrice,
          subtotal: quantity * unitPrice,
        };
      });
      const totalAmount = items.reduce((sum, item) => sum + item.subtotal, 0);
      const now = new Date().toISOString();
      const orderRecord = {
        id: orderInput.id,
        contractor_id: contractor.id,
        supplier_id: supplier.id,
        total_amount: totalAmount,
        status: orderInput.status,
        delivery_address: orderInput.delivery_address,
        delivery_date: dateFromNow({ days: orderInput.delivery_days_from_now }),
        payment_method: orderInput.payment_method,
        payment_status: orderInput.payment_status,
        created_at: dateFromNow({ days: -orderInput.created_days_ago }),
        updated_at: now,
        demo: true,
      };

      const existingIndex = data.orders.findIndex((order) => Number(order.id) === Number(orderInput.id));
      if (existingIndex === -1) {
        data.orders.push(orderRecord);
      } else {
        data.orders[existingIndex] = { ...data.orders[existingIndex], ...orderRecord };
      }
      summary.orders_upserted += 1;

      for (const item of items) {
        data.order_items.push({
          id: nextId(data, "order_items"),
          order_id: orderInput.id,
          ...item,
        });
        summary.order_items_seeded += 1;
      }

      for (const event of buildOrderEvents(orderInput, supplier.business_name)) {
        data.delivery_events.push({
          id: nextId(data, "delivery_events"),
          order_id: orderInput.id,
          ...event,
        });
        summary.delivery_events_seeded += 1;
      }
    }

    data.sms_logs = data.sms_logs.filter((log) => !String(log.at_message_id || "").startsWith("demo-sms-"));
    demoSmsLogs.forEach((log, index) => {
      data.sms_logs.push({
        id: nextId(data, "sms_logs"),
        from_phone: log.from_phone,
        to_phone: log.to_phone,
        message: log.message,
        direction: log.direction,
        message_type: log.message_type,
        at_message_id: `demo-sms-${index + 1}`,
        cost: log.direction === "out" ? "KES 0.8000" : "",
        status: log.status,
        created_at: dateFromNow({ minutes: -log.minutes_ago }),
      });
      summary.sms_logs_seeded += 1;
    });

    for (const alertInput of demoPriceAlerts) {
      const contractor = contractorByPhone.get(normalize(alertInput.contractor_phone));
      const material = findMaterial(data, alertInput.material);
      if (!contractor) throw new Error(`Unknown contractor in demo alert: ${alertInput.contractor_phone}`);
      if (!material) throw new Error(`Unknown material in demo alert: ${alertInput.material}`);

      const alertFields = {
        contractor_id: contractor.id,
        material_id: material.id,
        target_price: Number(alertInput.target_price),
        county: normalize(alertInput.county),
        is_active: alertInput.is_active !== false,
        triggered_at: null,
        created_at: dateFromNow({ days: -2 }),
        demo_key: `${contractor.phone}:${material.name}:${normalize(alertInput.county)}`,
      };
      const existing = data.price_alerts.find((alert) => alert.demo_key === alertFields.demo_key);
      if (existing) {
        Object.assign(existing, alertFields);
      } else {
        data.price_alerts.push({
          id: nextId(data, "price_alerts"),
          ...alertFields,
        });
      }
      summary.price_alerts_upserted += 1;
    }

    bumpNextIds(data);
  });

  return { catalog: catalogSummary, demo: summary };
}

if (require.main === module) {
  const store = new JsonStore({ filePath: env.dataFile });
  const summary = seedDemo(store);

  console.log(`Seeded manual testing demo data at ${env.dataFile}`);
  console.log("Catalog:");
  console.table(summary.catalog);
  console.log("Demo:");
  console.table(summary.demo);
}

module.exports = { seedDemo };

