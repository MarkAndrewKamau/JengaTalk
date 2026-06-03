const express = require("express");
const { requireAuth } = require("../middleware/auth");
const { joinProduct } = require("../services/catalogService");

function withinDays(isoDate, days) {
  return new Date(isoDate).getTime() >= Date.now() - days * 24 * 60 * 60 * 1000;
}

function analyticsRoutes({ store }) {
  const router = express.Router();

  router.use(requireAuth);

  function scopedSupplierId(req) {
    if (req.user.role === "supplier") {
      return store.all("suppliers").find((supplier) => Number(supplier.user_id) === Number(req.user.id))?.id;
    }
    return req.query.supplier_id ? Number(req.query.supplier_id) : null;
  }

  router.get("/overview", (req, res) => {
    const supplierId = scopedSupplierId(req);
    let orders = store.all("orders");
    if (supplierId) orders = orders.filter((order) => Number(order.supplier_id) === Number(supplierId));

    const today = new Date().toISOString().slice(0, 10);
    const totalOrdersToday = orders.filter((order) => order.created_at.slice(0, 10) === today).length;
    const revenueThisWeek = orders
      .filter((order) => withinDays(order.created_at, 7))
      .filter((order) => ["confirmed", "dispatched", "delivered"].includes(order.status))
      .reduce((sum, order) => sum + Number(order.total_amount || 0), 0);
    const pendingDeliveries = orders.filter((order) => ["confirmed", "dispatched"].includes(order.status)).length;
    const newEnquiries = store
      .all("sms_logs")
      .filter((log) => log.direction === "in" && withinDays(log.created_at, 1)).length;

    res.json({
      overview: {
        total_orders_today: totalOrdersToday,
        revenue_this_week: revenueThisWeek,
        pending_deliveries: pendingDeliveries,
        new_enquiries: newEnquiries,
      },
    });
  });

  router.get("/products", (req, res) => {
    const supplierId = scopedSupplierId(req);
    const products = store
      .all("supplier_products")
      .filter((product) => (!supplierId ? true : Number(product.supplier_id) === Number(supplierId)))
      .map((product) => joinProduct(store, product))
      .sort((a, b) => Number(b.times_queried_week || 0) - Number(a.times_queried_week || 0));

    res.json({
      products: products.map((product) => ({
        id: product.id,
        material: product.material.name,
        supplier: product.supplier.business_name,
        price: product.price,
        stock_qty: product.stock_qty,
        times_queried_week: product.times_queried_week || 0,
      })),
    });
  });

  router.get("/sms", (req, res) => {
    const logs = store.all("sms_logs");
    const inbound = logs.filter((log) => log.direction === "in").length;
    const outbound = logs.filter((log) => log.direction === "out").length;
    const byType = logs.reduce((acc, log) => {
      acc[log.message_type] = (acc[log.message_type] || 0) + 1;
      return acc;
    }, {});
    res.json({ sms: { inbound, outbound, by_type: byType } });
  });

  router.get("/revenue", (req, res) => {
    const supplierId = scopedSupplierId(req);
    let orders = store
      .all("orders")
      .filter((order) => ["confirmed", "dispatched", "delivered"].includes(order.status));
    if (supplierId) orders = orders.filter((order) => Number(order.supplier_id) === Number(supplierId));

    const byStatus = orders.reduce((acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + Number(order.total_amount || 0);
      return acc;
    }, {});
    const total = orders.reduce((sum, order) => sum + Number(order.total_amount || 0), 0);
    res.json({ revenue: { total, by_status: byStatus } });
  });

  return router;
}

module.exports = { analyticsRoutes };

