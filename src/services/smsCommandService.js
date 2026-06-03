const { env } = require("../config/env");
const { comparePrices, findMaterial, incrementQueryCounts } = require("./catalogService");
const { createOrder, getOrderDetail, updateOrderStatus, getOrCreateContractor } = require("./orderService");
const { assertHttp } = require("../utils/httpError");
const { normalizePhone } = require("../utils/phone");
const { normalizeText, titleCase, toMoney, truncateSms } = require("../utils/text");

const helpText =
  "JengaLink: PRICE cement nairobi, ORDER BM01 10, STATUS 1001, CANCEL 1001, ALERT cement 700, MORE, HELP.";

const knownCounties = new Set([
  "baringo",
  "bomet",
  "bungoma",
  "busia",
  "elgeyo-marakwet",
  "embu",
  "garissa",
  "homa bay",
  "isiolo",
  "kajiado",
  "kakamega",
  "kericho",
  "kiambu",
  "kilifi",
  "kirinyaga",
  "kisii",
  "kisumu",
  "kitui",
  "kwale",
  "laikipia",
  "lamu",
  "machakos",
  "makueni",
  "mandera",
  "marsabit",
  "meru",
  "migori",
  "mombasa",
  "muranga",
  "nairobi",
  "nakuru",
  "nandi",
  "narok",
  "nyamira",
  "nyandarua",
  "nyeri",
  "samburu",
  "siaya",
  "taita taveta",
  "tana river",
  "tharaka nithi",
  "trans nzoia",
  "turkana",
  "uasin gishu",
  "vihiga",
  "wajir",
  "west pokot",
]);

function parseMaterialAndCounty(store, terms) {
  const cleaned = terms.map(normalizeText).filter(Boolean);
  if (!cleaned.length) return { materialQuery: "", county: "" };

  const supplierCounties = new Set(store.all("suppliers").map((supplier) => normalizeText(supplier.county)));
  const lastToken = cleaned[cleaned.length - 1];
  const secondLastPair = cleaned.length > 1 ? `${cleaned[cleaned.length - 2]} ${lastToken}` : "";

  if (secondLastPair && (knownCounties.has(secondLastPair) || supplierCounties.has(secondLastPair))) {
    return {
      materialQuery: cleaned.slice(0, -2).join(" "),
      county: secondLastPair,
    };
  }

  if (cleaned.length > 1 && (knownCounties.has(lastToken) || supplierCounties.has(lastToken))) {
    return {
      materialQuery: cleaned.slice(0, -1).join(" "),
      county: lastToken,
    };
  }

  return {
    materialQuery: cleaned.join(" "),
    county: "",
  };
}

function getBodyText(body) {
  return body.text || body.message || body.messageText || body.Text || "";
}

function getBodyFrom(body) {
  return body.from || body.from_phone || body.phoneNumber || body.msisdn || body.From || "";
}

function getBodyTo(body) {
  return body.to || body.to_phone || body.shortCode || body.To || env.smsShortcode;
}

function saveSession(store, phone, patch) {
  const normalizedPhone = normalizePhone(phone);
  const now = new Date().toISOString();
  return store.transaction((data) => {
    const existing = data.sms_sessions.find((session) => session.phone === normalizedPhone);
    if (existing) {
      Object.assign(existing, patch, { updated_at: now });
      return existing;
    }

    const id = data.meta.nextIds.sms_sessions || 1;
    data.meta.nextIds.sms_sessions = id + 1;
    const record = {
      id,
      phone: normalizedPhone,
      last_material_id: null,
      last_county: "",
      last_product_ids: [],
      is_subscribed: true,
      created_at: now,
      updated_at: now,
      ...patch,
    };
    data.sms_sessions.push(record);
    return record;
  });
}

function getSession(store, phone) {
  const normalizedPhone = normalizePhone(phone);
  return store.all("sms_sessions").find((session) => session.phone === normalizedPhone) || null;
}

function formatPriceResponse(material, county, results, offset = 0) {
  if (!results.length) {
    const location = county ? ` in ${titleCase(county)}` : "";
    return `No active prices found for ${material.name}${location}. Try another county or SMS HELP.`;
  }

  const header = `JengaLink Prices - ${material.name}${county ? ` (${titleCase(county)})` : ""}`;
  const lines = results.map((product, index) => {
    const rank = index + 1 + offset;
    const delivery = product.supplier.delivery_radius_km > 0 ? " Delivery" : "";
    return `${rank}. ${product.supplier.code} ${product.supplier.business_name}: ${toMoney(product.price)}/${material.unit}${delivery}`;
  });

  return truncateSms(`${header}\n${lines.join("\n")}\nReply ORDER CODE qty e.g. ORDER ${results[0].supplier.code} 10`);
}

async function handlePriceCommand({ store, smsService, from, tokens }) {
  const { materialQuery, county } = parseMaterialAndCounty(store, tokens.slice(1));
  assertHttp(materialQuery, 400, "PRICE command needs a material name");
  const { material, results } = comparePrices(store, { material: materialQuery, county, limit: 3 });
  assertHttp(material, 404, `Material not found: ${materialQuery}`);

  incrementQueryCounts(
    store,
    results.map((product) => product.id)
  );
  saveSession(store, from, {
    last_material_id: material.id,
    last_county: normalizeText(county),
    last_product_ids: results.map((product) => product.id),
  });

  const reply = formatPriceResponse(material, county, results);
  await smsService.sendSms({ to: from, message: reply, type: "enquiry" });
  return { action: "price", reply, material, results };
}

async function handleMoreCommand({ store, smsService, from }) {
  const session = getSession(store, from);
  if (!session?.last_material_id) {
    const reply = "Send PRICE material county first, e.g. PRICE cement nairobi.";
    await smsService.sendSms({ to: from, message: reply, type: "enquiry" });
    return { action: "more", reply, results: [] };
  }

  const { material, results } = comparePrices(store, {
    material: session.last_material_id,
    county: session.last_county,
    limit: 10,
  });
  const unseen = results.filter((product) => !session.last_product_ids.includes(product.id)).slice(0, 3);
  const chosen = unseen.length ? unseen : results.slice(3, 6);
  saveSession(store, from, {
    last_product_ids: [...new Set([...(session.last_product_ids || []), ...chosen.map((product) => product.id)])],
  });

  const reply = formatPriceResponse(material, session.last_county, chosen, session.last_product_ids.length);
  await smsService.sendSms({ to: from, message: reply, type: "enquiry" });
  return { action: "more", reply, material, results: chosen };
}

async function handleOrderCommand({ store, smsService, from, tokens }) {
  const supplierCode = tokens[1];
  const quantity = Number(tokens[2]);
  assertHttp(supplierCode, 400, "ORDER command needs a supplier code");
  assertHttp(Number.isFinite(quantity) && quantity > 0, 400, "ORDER command needs a quantity");

  const session = getSession(store, from);
  assertHttp(session?.last_material_id, 400, "Send PRICE material county before ordering by SMS");

  const supplier = store
    .all("suppliers")
    .find((candidate) => candidate.code.toLowerCase() === supplierCode.toLowerCase());
  assertHttp(supplier, 404, `Supplier code ${supplierCode} was not found`);

  const product = store
    .all("supplier_products")
    .find(
      (candidate) =>
        Number(candidate.supplier_id) === Number(supplier.id) &&
        Number(candidate.material_id) === Number(session.last_material_id) &&
        candidate.is_active
    );
  assertHttp(product, 404, `${supplier.business_name} has no active listing for your last material query`);

  const contractor = getOrCreateContractor(store, {
    phone: from,
    name: "SMS Contractor",
    county: session.last_county,
  });
  const order = await createOrder(store, smsService, {
    contractor_id: contractor.id,
    supplier_id: supplier.id,
    items: [{ supplier_product_id: product.id, quantity }],
    delivery_address: session.last_county || supplier.county,
    payment_method: "cash_on_delivery",
  });

  const reply = `Order #${order.id} placed with ${supplier.business_name}. Total ${toMoney(
    order.total_amount
  )}. You will receive delivery updates by SMS.`;
  await smsService.sendSms({ to: from, message: reply, type: "order" });
  return { action: "order", reply, order };
}

async function handleStatusCommand({ store, smsService, from, tokens }) {
  const orderId = tokens[1];
  assertHttp(orderId, 400, "STATUS command needs an order ID");
  const detail = getOrderDetail(store, orderId);
  assertHttp(detail, 404, "Order not found");
  const reply = `Order #${detail.id}: ${detail.status}. Total ${toMoney(detail.total_amount)}. Supplier: ${
    detail.supplier.business_name
  }.`;
  await smsService.sendSms({ to: from, message: reply, type: "alert" });
  return { action: "status", reply, order: detail };
}

async function handleCancelCommand({ store, smsService, from, tokens }) {
  const orderId = tokens[1];
  assertHttp(orderId, 400, "CANCEL command needs an order ID");
  const detail = getOrderDetail(store, orderId);
  assertHttp(detail, 404, "Order not found");
  assertHttp(["pending", "confirmed"].includes(detail.status), 400, "Only pending or confirmed orders can be cancelled");

  const updated = await updateOrderStatus(store, smsService, orderId, "cancelled", "Cancelled by contractor via SMS.");
  const reply = `Order #${updated.id} cancelled.`;
  await smsService.sendSms({ to: from, message: reply, type: "order" });
  return { action: "cancel", reply, order: updated };
}

async function handleAlertCommand({ store, smsService, from, tokens }) {
  const targetPrice = Number(tokens[tokens.length - 1]);
  const materialQuery = tokens.slice(1, -1).join(" ");
  assertHttp(materialQuery, 400, "ALERT command needs a material name");
  assertHttp(Number.isFinite(targetPrice) && targetPrice > 0, 400, "ALERT command needs a target price");

  const material = findMaterial(store, materialQuery);
  assertHttp(material, 404, `Material not found: ${materialQuery}`);
  const session = getSession(store, from);
  const contractor = getOrCreateContractor(store, {
    phone: from,
    name: "SMS Contractor",
    county: session?.last_county || "",
  });

  const alert = store.insert("price_alerts", {
    contractor_id: contractor.id,
    material_id: material.id,
    target_price: targetPrice,
    county: session?.last_county || "",
    is_active: true,
    triggered_at: null,
    created_at: new Date().toISOString(),
  });

  const reply = `Alert saved: ${material.name} below ${toMoney(targetPrice)}${alert.county ? ` in ${titleCase(alert.county)}` : ""}.`;
  await smsService.sendSms({ to: from, message: reply, type: "alert" });
  return { action: "alert", reply, alert };
}

async function handleStopCommand({ store, smsService, from }) {
  saveSession(store, from, { is_subscribed: false });
  const reply = "You have unsubscribed from JengaLink SMS alerts. Send HELP anytime for commands.";
  await smsService.sendSms({ to: from, message: reply, type: "alert" });
  return { action: "stop", reply };
}

async function handleHelpCommand({ smsService, from }) {
  await smsService.sendSms({ to: from, message: helpText, type: "alert" });
  return { action: "help", reply: helpText };
}

function createSmsCommandService({ store, smsService }) {
  async function handleInbound(body) {
    const from = normalizePhone(getBodyFrom(body));
    const to = getBodyTo(body);
    const text = getBodyText(body);
    assertHttp(from, 400, "Inbound SMS sender is required");

    store.insert("sms_logs", {
      from_phone: from,
      to_phone: to,
      message: text,
      direction: "in",
      message_type: "enquiry",
      at_message_id: body.id || body.messageId || "",
      cost: "",
      status: "received",
      created_at: new Date().toISOString(),
    });

    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    const commandsThisHour = store
      .all("sms_logs")
      .filter((log) => log.direction === "in")
      .filter((log) => log.from_phone === from)
      .filter((log) => new Date(log.created_at).getTime() >= oneHourAgo).length;
    if (commandsThisHour > 10) {
      const reply = "Too many SMS commands this hour. Please try again later.";
      await smsService.sendSms({ to: from, message: reply, type: "alert" });
      return { action: "rate_limited", reply };
    }

    const normalized = normalizeText(text);
    const tokens = normalized.split(" ").filter(Boolean);
    const command = tokens[0] || "help";

    try {
      if (command === "price") return handlePriceCommand({ store, smsService, from, tokens });
      if (command === "more") return handleMoreCommand({ store, smsService, from });
      if (command === "order") return handleOrderCommand({ store, smsService, from, tokens });
      if (command === "status") return handleStatusCommand({ store, smsService, from, tokens });
      if (command === "cancel") return handleCancelCommand({ store, smsService, from, tokens });
      if (command === "alert") return handleAlertCommand({ store, smsService, from, tokens });
      if (command === "stop") return handleStopCommand({ store, smsService, from });
      return handleHelpCommand({ smsService, from });
    } catch (error) {
      const reply = error.status && error.status < 500 ? error.message : "Sorry, we could not process that SMS. Send HELP.";
      await smsService.sendSms({ to: from, message: reply, type: "alert" });
      return { action: "error", reply, error: error.message };
    }
  }

  return { handleInbound };
}

module.exports = { createSmsCommandService, getSession, saveSession, helpText };
