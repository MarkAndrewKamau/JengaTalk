const { comparePrices, findMaterial } = require("./catalogService");
const { createOrder, getOrderDetail, getOrCreateContractor } = require("./orderService");
const { normalizePhone } = require("../utils/phone");
const { toMoney } = require("../utils/text");

function menu() {
  return "CON Welcome to JengaLink\n1. Compare Prices\n2. Track Order\n3. My Orders\n4. Price Alert\n5. Support";
}

function compactProductLine(product, index) {
  return `${index + 1}. ${product.supplier.code} ${toMoney(product.price)}/${product.material.unit}`;
}

function createUssdService({ store, smsService }) {
  async function handle(body) {
    const phone = normalizePhone(body.phoneNumber || body.phone || body.msisdn || "");
    const text = String(body.text || "");
    const parts = text ? text.split("*") : [];

    if (!parts.length || parts[0] === "") return menu();

    const choice = parts[0];

    if (choice === "1") {
      if (parts.length === 1) return "CON Enter material name";

      const materialQuery = parts[1];
      const { material, results } = comparePrices(store, { material: materialQuery, limit: 3 });
      if (!material) return "END Material not found. Try SMS PRICE cement nairobi.";
      if (!results.length) return `END No active prices found for ${material.name}.`;

      if (parts.length === 2) {
        return `CON ${material.name}\n${results.map(compactProductLine).join("\n")}\nSelect supplier`;
      }

      const selectedIndex = Number(parts[2]) - 1;
      const selected = results[selectedIndex];
      if (!selected) return "END Invalid supplier selection.";

      if (parts.length === 3) return `CON Enter quantity (${selected.material.unit})`;

      const quantity = Number(parts[3]);
      if (!Number.isFinite(quantity) || quantity <= 0) return "END Invalid quantity.";
      const total = quantity * Number(selected.price);

      if (parts.length === 4) {
        return `CON Confirm order ${quantity} ${selected.material.unit} from ${selected.supplier.code} for ${toMoney(
          total
        )}?\n1. Yes\n2. No`;
      }

      if (parts[4] !== "1") return "END Order cancelled.";

      const contractor = getOrCreateContractor(store, {
        phone,
        name: "USSD Contractor",
        county: selected.supplier.county,
      });
      const order = await createOrder(store, smsService, {
        contractor_id: contractor.id,
        supplier_id: selected.supplier.id,
        items: [{ supplier_product_id: selected.id, quantity }],
        delivery_address: selected.supplier.county,
      });
      return `END Order placed! ID: #${order.id}. SMS updates will follow.`;
    }

    if (choice === "2") {
      if (parts.length === 1) return "CON Enter Order ID";
      const order = getOrderDetail(store, parts[1]);
      if (!order) return "END Order not found.";
      return `END Order #${order.id}: ${order.status}. Supplier: ${order.supplier.business_name}. Total ${toMoney(
        order.total_amount
      )}.`;
    }

    if (choice === "3") {
      const contractor = store.all("users").find((user) => user.phone === phone && user.role === "contractor");
      if (!contractor) return "END No orders found.";
      const orders = store
        .all("orders")
        .filter((order) => Number(order.contractor_id) === Number(contractor.id))
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 3);
      if (!orders.length) return "END No orders found.";
      return `END ${orders.map((order) => `#${order.id} ${order.status} ${toMoney(order.total_amount)}`).join("\n")}`;
    }

    if (choice === "4") {
      if (parts.length === 1) return "CON Enter material";
      const material = findMaterial(store, parts[1]);
      if (!material) return "END Material not found.";
      if (parts.length === 2) return "CON Enter target price";
      const targetPrice = Number(parts[2]);
      if (!Number.isFinite(targetPrice) || targetPrice <= 0) return "END Invalid target price.";
      const contractor = getOrCreateContractor(store, {
        phone,
        name: "USSD Contractor",
        county: "",
      });
      store.insert("price_alerts", {
        contractor_id: contractor.id,
        material_id: material.id,
        target_price: targetPrice,
        county: "",
        is_active: true,
        triggered_at: null,
        created_at: new Date().toISOString(),
      });
      return `END Alert saved for ${material.name} below ${toMoney(targetPrice)}.`;
    }

    if (choice === "5") return "END JengaLink support: call 0700 208 880 or SMS HELP to 20880.";

    return menu();
  }

  return { handle };
}

module.exports = { createUssdService };

