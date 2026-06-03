const express = require("express");
const { requireAuth } = require("../middleware/auth");
const { assertHttp } = require("../utils/httpError");
const { findMaterial } = require("../services/catalogService");
const { getOrCreateContractor } = require("../services/orderService");
const { normalizeText } = require("../utils/text");

function hydrateAlert(store, alert) {
  return {
    ...alert,
    contractor: store.findById("users", alert.contractor_id),
    material: store.findById("materials", alert.material_id),
  };
}

function alertRoutes({ store }) {
  const router = express.Router();

  router.post("/", (req, res) => {
    const material = req.body.material_id ? store.findById("materials", req.body.material_id) : findMaterial(store, req.body.material);
    assertHttp(material, 404, "Material not found");
    const contractor = req.user?.role === "contractor"
      ? req.user
      : getOrCreateContractor(store, {
          phone: req.body.contractor_phone,
          name: req.body.contractor_name || "Price Alert Contractor",
          county: req.body.county,
        });
    const alert = store.insert("price_alerts", {
      contractor_id: contractor.id,
      material_id: material.id,
      target_price: Number(req.body.target_price),
      county: normalizeText(req.body.county || contractor.county),
      is_active: req.body.is_active !== false,
      triggered_at: null,
      created_at: new Date().toISOString(),
    });
    res.status(201).json({ alert: hydrateAlert(store, alert) });
  });

  router.get("/", requireAuth, (req, res) => {
    let alerts = store.all("price_alerts");
    if (req.user.role === "contractor") {
      alerts = alerts.filter((alert) => Number(alert.contractor_id) === Number(req.user.id));
    }
    if (req.query.active === "true") alerts = alerts.filter((alert) => alert.is_active);
    res.json({ alerts: alerts.map((alert) => hydrateAlert(store, alert)) });
  });

  router.delete("/:id", requireAuth, (req, res) => {
    const alert = store.findById("price_alerts", req.params.id);
    assertHttp(alert, 404, "Alert not found");
    assertHttp(req.user.role === "admin" || Number(alert.contractor_id) === Number(req.user.id), 403, "Insufficient permissions");
    const updated = store.update("price_alerts", alert.id, { is_active: false });
    res.json({ alert: hydrateAlert(store, updated) });
  });

  return router;
}

module.exports = { alertRoutes };

