const express = require("express");
const { env } = require("./config/env");
const { JsonStore } = require("./db/jsonStore");
const { attachAuth } = require("./middleware/auth");
const { notFound, errorHandler } = require("./middleware/errors");
const { authRoutes } = require("./routes/auth");
const { supplierRoutes } = require("./routes/suppliers");
const { productRoutes } = require("./routes/products");
const { orderRoutes } = require("./routes/orders");
const { alertRoutes } = require("./routes/alerts");
const { analyticsRoutes } = require("./routes/analytics");
const { webhookRoutes } = require("./routes/webhooks");
const { createSmsService } = require("./services/smsService");
const { createSmsCommandService } = require("./services/smsCommandService");
const { createUssdService } = require("./services/ussdService");
const { seedDemo } = require("../scripts/seed-demo");

function createApp(overrides = {}) {
  const store = overrides.store || new JsonStore({ filePath: env.dataFile });
  if (!overrides.store && env.seedDemoOnStart) {
    const summary = seedDemo(store);
    console.log("Seeded demo data on start", summary.demo);
  }
  const smsService = overrides.smsService || createSmsService({ store });
  const smsCommandService = overrides.smsCommandService || createSmsCommandService({ store, smsService });
  const ussdService = overrides.ussdService || createUssdService({ store, smsService });

  const app = express();
  app.disable("x-powered-by");

  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: false }));
  app.use((req, res, next) => {
    const origin = req.get("origin");
    const allowedOrigin =
      env.corsOrigins.length === 0 || !origin
        ? origin || "*"
        : env.corsOrigins.includes(origin)
          ? origin
          : "";

    if (allowedOrigin) {
      res.setHeader("Access-Control-Allow-Origin", allowedOrigin);
      res.setHeader("Vary", "Origin");
    }
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization,X-Demo-User-Phone");
    if (req.method === "OPTIONS") return res.sendStatus(204);
    return next();
  });
  app.use(attachAuth(store));

  app.get("/", (req, res) => {
    res.json({
      name: env.appName,
      status: "ok",
      phase: "backend-mvp",
      docs: "/api/health",
    });
  });

  app.get("/api/health", (req, res) => {
    const data = store.read();
    res.json({
      ok: true,
      service: env.appName,
      uptime_seconds: Math.round(process.uptime()),
      sms_mode: env.africaTalking.apiKey ? "africas-talking" : "mock",
      at_username: env.africaTalking.username,
      at_key_set: !!env.africaTalking.apiKey,
      at_key_prefix: env.africaTalking.apiKey ? env.africaTalking.apiKey.slice(0, 8) + "..." : null,
      sms_from: env.africaTalking.smsFrom,
      seed_demo_on_start: env.seedDemoOnStart,
      counts: {
        users: data.users.length,
        suppliers: data.suppliers.length,
        materials: data.materials.length,
        products: data.supplier_products.length,
        orders: data.orders.length,
      },
    });
  });

  // Debug: send a test SMS and return the raw AT response
  app.post("/api/sms/test-send", async (req, res) => {
    const { to, message } = req.body;
    if (!to || !message) return res.status(400).json({ error: "to and message required" });
    try {
      const result = await smsService.sendSms({ to, message, type: "alert" });
      res.json({ ok: true, result });
    } catch (err) {
      res.status(502).json({ ok: false, error: err.message });
    }
  });

  app.use("/api/auth", authRoutes({ store, smsService }));
  app.use("/api/suppliers", supplierRoutes({ store }));
  app.use("/api/products", productRoutes({ store, smsService }));
  app.use("/api/orders", orderRoutes({ store, smsService }));
  app.use("/api/alerts", alertRoutes({ store }));
  app.use("/api/analytics", analyticsRoutes({ store }));
  app.use("/api", webhookRoutes({ store, smsCommandService, ussdService, smsService }));

  app.use(notFound);
  app.use(errorHandler);

  app.locals.store = store;
  app.locals.smsService = smsService;
  return app;
}

module.exports = { createApp };
