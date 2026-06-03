const express = require("express");
const { requireAuth } = require("../middleware/auth");
const { assertHttp } = require("../utils/httpError");
const { normalizeText } = require("../utils/text");
const { comparePrices, findMaterial, joinProduct } = require("../services/catalogService");

function productRoutes({ store }) {
  const router = express.Router();

  router.get("/", (req, res) => {
    const q = normalizeText(req.query.q);
    const category = normalizeText(req.query.category);
    const county = normalizeText(req.query.county);
    const products = store
      .all("supplier_products")
      .map((product) => joinProduct(store, product))
      .filter((product) => product.material && product.supplier)
      .filter((product) => (req.query.active === "false" ? true : product.is_active && product.supplier.is_active))
      .filter((product) => (!q ? true : normalizeText(`${product.material.name} ${product.material.aliases?.join(" ")}`).includes(q)))
      .filter((product) => (!category ? true : normalizeText(product.material.category) === category))
      .filter((product) => (!county ? true : normalizeText(product.supplier.county) === county))
      .sort((a, b) => a.material.name.localeCompare(b.material.name) || a.price - b.price);

    res.json({ products });
  });

  router.get("/materials", (req, res) => {
    const q = normalizeText(req.query.q);
    const materials = store
      .all("materials")
      .filter((material) => (!q ? true : normalizeText(`${material.name} ${material.aliases?.join(" ")}`).includes(q)))
      .sort((a, b) => a.name.localeCompare(b.name));
    res.json({ materials });
  });

  router.get("/compare", (req, res) => {
    const { material, results } = comparePrices(store, {
      material: req.query.material || req.query.q,
      county: req.query.county,
      limit: req.query.limit || 10,
    });
    assertHttp(material, 404, "Material not found");
    res.json({ material, results });
  });

  router.post("/", requireAuth, (req, res) => {
    const supplier = req.body.supplier_id
      ? store.findById("suppliers", req.body.supplier_id)
      : store.all("suppliers").find((candidate) => Number(candidate.user_id) === Number(req.user.id));
    assertHttp(supplier, 404, "Supplier not found for this user");
    assertHttp(req.user.role === "admin" || Number(supplier.user_id) === Number(req.user.id), 403, "Insufficient permissions");

    let material = req.body.material_id ? store.findById("materials", req.body.material_id) : findMaterial(store, req.body.name);
    if (!material) {
      assertHttp(req.body.name && req.body.category && req.body.unit, 400, "New materials need name, category, and unit");
      material = store.insert("materials", {
        name: req.body.name,
        aliases: Array.isArray(req.body.aliases) ? req.body.aliases : [],
        category: req.body.category,
        unit: req.body.unit,
        description: req.body.description || "",
        image_url: req.body.image_url || "",
      });
    }

    const product = store.insert("supplier_products", {
      supplier_id: supplier.id,
      material_id: material.id,
      price: Number(req.body.price),
      stock_qty: Number(req.body.stock_qty || 0),
      min_order_qty: Number(req.body.min_order_qty || 1),
      is_active: req.body.is_active !== false,
      updated_at: new Date().toISOString(),
      times_queried_week: 0,
    });

    res.status(201).json({ product: joinProduct(store, product) });
  });

  router.put("/:id", requireAuth, (req, res) => {
    const product = store.findById("supplier_products", req.params.id);
    assertHttp(product, 404, "Product not found");
    const supplier = store.findById("suppliers", product.supplier_id);
    assertHttp(req.user.role === "admin" || Number(supplier.user_id) === Number(req.user.id), 403, "Insufficient permissions");

    const patch = { ...req.body, updated_at: new Date().toISOString() };
    delete patch.id;
    delete patch.supplier_id;
    delete patch.material_id;
    for (const numeric of ["price", "stock_qty", "min_order_qty"]) {
      if (patch[numeric] !== undefined) patch[numeric] = Number(patch[numeric]);
    }
    const updated = store.update("supplier_products", product.id, patch);
    res.json({ product: joinProduct(store, updated) });
  });

  router.delete("/:id", requireAuth, (req, res) => {
    const product = store.findById("supplier_products", req.params.id);
    assertHttp(product, 404, "Product not found");
    const supplier = store.findById("suppliers", product.supplier_id);
    assertHttp(req.user.role === "admin" || Number(supplier.user_id) === Number(req.user.id), 403, "Insufficient permissions");
    const updated = store.update("supplier_products", product.id, {
      is_active: false,
      updated_at: new Date().toISOString(),
    });
    res.json({ product: joinProduct(store, updated) });
  });

  return router;
}

module.exports = { productRoutes };

