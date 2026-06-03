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

function createApp(overrides = {}) {
  const store = overrides.store || new JsonStore({ filePath: env.dataFile });
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
    res.json({
      ok: true,
      service: env.appName,
      uptime_seconds: Math.round(process.uptime()),
      sms_mode: env.africaTalking.apiKey ? "africas-talking" : "mock",
    });
  });

  app.use("/api/auth", authRoutes({ store, smsService }));
  app.use("/api/suppliers", supplierRoutes({ store }));
  app.use("/api/products", productRoutes({ store }));
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
