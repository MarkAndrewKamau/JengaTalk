const { assertHttp, HttpError } = require("../utils/httpError");
const { normalizePhone } = require("../utils/phone");
const { toMoney } = require("../utils/text");
const { joinProduct } = require("./catalogService");

function getOrCreateContractor(store, { phone, name = "SMS Contractor", county = "" }) {
  const normalizedPhone = normalizePhone(phone);
  assertHttp(normalizedPhone, 400, "Contractor phone is required");

  const existing = store.all("users").find((user) => user.phone === normalizedPhone);
  if (existing) return existing;

  return store.insert("users", {
    phone: normalizedPhone,
    name,
    role: "contractor",
    county: String(county || "").toLowerCase(),
    created_at: new Date().toISOString(),
    verified: true,
    otp_code: null,
    otp_expires: null,
  });
}

function summarizeOrderItems(items) {
  return items
    .map((item) => `${item.quantity} ${item.material.unit} ${item.material.name}`)
    .join(", ");
}

async function createOrder(store, smsService, input) {
  const contractor =
    input.contractor_id && store.findById("users", input.contractor_id)
      ? store.findById("users", input.contractor_id)
      : getOrCreateContractor(store, {
          phone: input.contractor_phone,
          name: input.contractor_name,
          county: input.county,
        });

  assertHttp(contractor.role === "contractor", 400, "Order owner must be a contractor");

  let supplier = null;
  if (input.supplier_id) supplier = store.findById("suppliers", input.supplier_id);
  if (!supplier && input.supplier_code) {
    supplier = store
      .all("suppliers")
      .find((candidate) => candidate.code.toLowerCase() === String(input.supplier_code).toLowerCase());
  }
  assertHttp(supplier, 404, "Supplier not found");

  const orderItemsInput = Array.isArray(input.items) ? input.items : [];
  assertHttp(orderItemsInput.length > 0, 400, "At least one order item is required");

  const hydratedItems = orderItemsInput.map((item) => {
    const supplierProduct = store.findById("supplier_products", item.supplier_product_id);
    assertHttp(supplierProduct, 404, `Supplier product ${item.supplier_product_id} not found`);
    assertHttp(
      Number(supplierProduct.supplier_id) === Number(supplier.id),
      400,
      "All order items must belong to the selected supplier"
    );
    const product = joinProduct(store, supplierProduct);
    const quantity = Number(item.quantity);
    assertHttp(Number.isFinite(quantity) && quantity > 0, 400, "Quantity must be greater than zero");
    assertHttp(quantity >= Number(product.min_order_qty || 1), 400, `Minimum order quantity is ${product.min_order_qty}`);
    assertHttp(quantity <= Number(product.stock_qty || 0), 400, "Requested quantity exceeds stock");

    return {
      product,
      quantity,
      unit_price: Number(product.price),
      subtotal: Number(product.price) * quantity,
      material: product.material,
    };
  });

  const totalAmount = hydratedItems.reduce((sum, item) => sum + item.subtotal, 0);
  assertHttp(totalAmount >= Number(supplier.min_order_value || 0), 400, "Order is below supplier minimum order value");

  const now = new Date().toISOString();
  const order = store.transaction((data) => {
    const orderId = data.meta.nextIds.orders || 1001;
    data.meta.nextIds.orders = orderId + 1;
    const orderRecord = {
      id: orderId,
      contractor_id: contractor.id,
      supplier_id: supplier.id,
      total_amount: totalAmount,
      status: "pending",
      delivery_address: input.delivery_address || contractor.county || supplier.county,
      delivery_date: input.delivery_date || null,
      payment_method: input.payment_method || "cash_on_delivery",
      payment_status: input.payment_status || "unpaid",
      created_at: now,
      updated_at: now,
    };
    data.orders.push(orderRecord);

    for (const item of hydratedItems) {
      const orderItemId = data.meta.nextIds.order_items || 1;
      data.meta.nextIds.order_items = orderItemId + 1;
      data.order_items.push({
        id: orderItemId,
        order_id: orderId,
        supplier_product_id: item.product.id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        subtotal: item.subtotal,
      });

      const product = data.supplier_products.find((candidate) => candidate.id === item.product.id);
      if (product) {
        product.stock_qty = Number(product.stock_qty || 0) - item.quantity;
        product.updated_at = now;
      }
    }

    const eventId = data.meta.nextIds.delivery_events || 1;
    data.meta.nextIds.delivery_events = eventId + 1;
    data.delivery_events.push({
      id: eventId,
      order_id: orderId,
      event_type: "placed",
      note: "Order placed",
      sms_sent: false,
      created_at: now,
    });

    return orderRecord;
  });

  const supplierUser = store.findById("users", supplier.user_id);
  if (supplierUser?.phone) {
    await smsService.sendSms({
      to: supplierUser.phone,
      type: "order",
      message: `New order #${order.id} from ${contractor.name} for ${summarizeOrderItems(
        hydratedItems
      )}. Total: ${toMoney(totalAmount)}.`,
    });
  }

  return getOrderDetail(store, order.id);
}

function getOrderDetail(store, id) {
  const order = store.findById("orders", id);
  if (!order) return null;
  const contractor = store.findById("users", order.contractor_id);
  const supplier = store.findById("suppliers", order.supplier_id);
  const supplierUser = supplier ? store.findById("users", supplier.user_id) : null;
  const items = store
    .all("order_items")
    .filter((item) => Number(item.order_id) === Number(id))
    .map((item) => {
      const product = joinProduct(store, store.findById("supplier_products", item.supplier_product_id));
      return {
        ...item,
        material: product.material,
        supplier_product: {
          id: product.id,
          price: product.price,
          stock_qty: product.stock_qty,
        },
      };
    });
  const timeline = store
    .all("delivery_events")
    .filter((event) => Number(event.order_id) === Number(id))
    .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

  return {
    ...order,
    contractor,
    supplier: supplier
      ? {
          ...supplier,
          contact_phone: supplierUser?.phone || "",
          contact_name: supplierUser?.name || "",
        }
      : null,
    items,
    timeline,
  };
}

async function updateOrderStatus(store, smsService, orderId, status, note = "") {
  const allowed = ["pending", "confirmed", "dispatched", "delivered", "cancelled", "rejected"];
  if (!allowed.includes(status)) throw new HttpError(400, "Invalid order status");

  const order = store.findById("orders", orderId);
  if (!order) throw new HttpError(404, "Order not found");

  const updated = store.transaction((data) => {
    const target = data.orders.find((candidate) => Number(candidate.id) === Number(orderId));
    target.status = status;
    target.updated_at = new Date().toISOString();

    const eventId = data.meta.nextIds.delivery_events || 1;
    data.meta.nextIds.delivery_events = eventId + 1;
    data.delivery_events.push({
      id: eventId,
      order_id: target.id,
      event_type: status,
      note: note || `Order marked ${status}`,
      sms_sent: ["confirmed", "dispatched", "delivered", "cancelled", "rejected"].includes(status),
      created_at: target.updated_at,
    });

    return target;
  });

  const detail = getOrderDetail(store, updated.id);
  const contractorPhone = detail.contractor?.phone;
  if (contractorPhone && ["confirmed", "dispatched", "delivered", "cancelled", "rejected"].includes(status)) {
    const supplierName = detail.supplier?.business_name || "Your supplier";
    const itemSummary = detail.items
      .map((item) => `${item.quantity} ${item.material.unit} ${item.material.name}`)
      .join(", ");
    const messages = {
      confirmed: `Hi ${detail.contractor.name}, your order #${detail.id} for ${itemSummary} has been confirmed by ${supplierName}.`,
      dispatched: `${supplierName} has dispatched your order #${detail.id}. Reply STATUS ${detail.id} anytime.`,
      delivered: `Order #${detail.id} delivered. Reply CONFIRM to acknowledge or DISPUTE to raise an issue.`,
      cancelled: `Order #${detail.id} has been cancelled. ${note}`.trim(),
      rejected: `Order #${detail.id} was rejected by ${supplierName}. ${note}`.trim(),
    };
    await smsService.sendSms({
      to: contractorPhone,
      type: "alert",
      message: messages[status],
    });
  }

  return detail;
}

module.exports = { createOrder, getOrderDetail, updateOrderStatus, getOrCreateContractor };

