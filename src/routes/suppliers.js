const express = require("express");
const { requireAuth, requireRole } = require("../middleware/auth");
const { assertHttp } = require("../utils/httpError");
const { normalizeText } = require("../utils/text");
const { joinProduct } = require("../services/catalogService");

function supplierSummary(store, supplier) {
  const user = store.findById("users", supplier.user_id);
  const products = store
    .all("supplier_products")
    .filter((product) => Number(product.supplier_id) === Number(supplier.id));

  return {
    ...supplier,
    contact_phone: user?.phone || "",
    contact_name: user?.name || "",
    products_count: products.length,
  };
}

function supplierRoutes({ store }) {
  const router = express.Router();

  router.get("/", (req, res) => {
    const county = normalizeText(req.query.county);
    const q = normalizeText(req.query.q);
    const suppliers = store
      .all("suppliers")
      .filter((supplier) => (req.query.active === "false" ? true : supplier.is_active))
      .filter((supplier) => (!county ? true : normalizeText(supplier.county) === county))
      .filter((supplier) => {
        if (!q) return true;
        return normalizeText(`${supplier.business_name} ${supplier.code} ${supplier.town}`).includes(q);
      })
      .map((supplier) => supplierSummary(store, supplier));

    res.json({ suppliers });
  });

  router.get("/:id", (req, res) => {
    const supplier = store.findById("suppliers", req.params.id);
    assertHttp(supplier, 404, "Supplier not found");
    res.json({ supplier: supplierSummary(store, supplier) });
  });

  router.post("/", requireAuth, requireRole("supplier", "admin"), (req, res) => {
    const userId = req.user.role === "admin" && req.body.user_id ? Number(req.body.user_id) : req.user.id;
    const user = store.findById("users", userId);
    assertHttp(user, 404, "User not found");

    const supplier = store.insert("suppliers", {
      user_id: user.id,
      code: String(req.body.code || `${String(req.body.business_name || "SUP").slice(0, 2).toUpperCase()}${Date.now().toString().slice(-2)}`),
      business_name: req.body.business_name,
      registration_no: req.body.registration_no || "",
      county: normalizeText(req.body.county || user.county),
      town: req.body.town || "",
      location_lat: Number(req.body.location_lat || 0),
      location_lng: Number(req.body.location_lng || 0),
      delivery_radius_km: Number(req.body.delivery_radius_km || 0),
      delivery_days: Array.isArray(req.body.delivery_days) ? req.body.delivery_days : [],
      min_order_value: Number(req.body.min_order_value || 0),
      delivery_fee_type: req.body.delivery_fee_type || "flat",
      delivery_fee: Number(req.body.delivery_fee || 0),
      payment_methods: Array.isArray(req.body.payment_methods) ? req.body.payment_methods : ["cash_on_delivery"],
      rating: 0,
      total_orders: 0,
      is_active: req.user.role === "admin" ? req.body.is_active !== false : false,
    });

    res.status(201).json({ supplier });
  });

  router.put("/:id", requireAuth, (req, res) => {
    const supplier = store.findById("suppliers", req.params.id);
    assertHttp(supplier, 404, "Supplier not found");
    assertHttp(req.user.role === "admin" || Number(req.user.id) === Number(supplier.user_id), 403, "Insufficient permissions");

    const patch = { ...req.body };
    delete patch.id;
    delete patch.user_id;
    if (patch.county) patch.county = normalizeText(patch.county);
    const updated = store.update("suppliers", supplier.id, patch);
    res.json({ supplier: updated });
  });

  router.get("/:id/products", (req, res) => {
    const supplier = store.findById("suppliers", req.params.id);
    assertHttp(supplier, 404, "Supplier not found");
    const products = store
      .all("supplier_products")
      .filter((product) => Number(product.supplier_id) === Number(supplier.id))
      .map((product) => joinProduct(store, product));
    res.json({ supplier: supplierSummary(store, supplier), products });
  });

  return router;
}

module.exports = { supplierRoutes, supplierSummary };

