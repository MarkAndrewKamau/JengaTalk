const express = require("express");
const { requireAuth } = require("../middleware/auth");
const { asyncHandler } = require("../middleware/errors");
const { assertHttp } = require("../utils/httpError");
const { createOrder, getOrderDetail, updateOrderStatus } = require("../services/orderService");

function canSeeOrder(user, order) {
  if (!user) return false;
  if (user.role === "admin") return true;
  if (user.role === "contractor") return Number(order.contractor_id) === Number(user.id);
  if (user.role === "supplier") return Number(order.supplier?.user_id || order.supplier_user_id) === Number(user.id);
  return false;
}

function orderRoutes({ store, smsService }) {
  const router = express.Router();

  router.post("/", asyncHandler(async (req, res) => {
    const order = await createOrder(store, smsService, req.body);
    res.status(201).json({ order });
  }));

  router.get("/", requireAuth, (req, res) => {
    const supplierForUser = store.all("suppliers").find((supplier) => Number(supplier.user_id) === Number(req.user.id));
    let orders = store.all("orders");
    if (req.user.role === "contractor") {
      orders = orders.filter((order) => Number(order.contractor_id) === Number(req.user.id));
    } else if (req.user.role === "supplier") {
      orders = orders.filter((order) => Number(order.supplier_id) === Number(supplierForUser?.id));
    }
    if (req.query.status) {
      orders = orders.filter((order) => order.status === req.query.status);
    }
    const detailed = orders
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .map((order) => getOrderDetail(store, order.id));
    res.json({ orders: detailed });
  });

  router.get("/:id", requireAuth, (req, res) => {
    const order = getOrderDetail(store, req.params.id);
    assertHttp(order, 404, "Order not found");
    const viewModel = {
      ...order,
      supplier_user_id: order.supplier?.user_id,
    };
    assertHttp(canSeeOrder(req.user, viewModel), 403, "Insufficient permissions");
    res.json({ order });
  });

  router.put("/:id/status", requireAuth, asyncHandler(async (req, res) => {
    const order = getOrderDetail(store, req.params.id);
    assertHttp(order, 404, "Order not found");
    assertHttp(
      req.user.role === "admin" || (req.user.role === "supplier" && Number(order.supplier.user_id) === Number(req.user.id)),
      403,
      "Only the supplier or admin can update order status"
    );
    const updated = await updateOrderStatus(store, smsService, req.params.id, req.body.status, req.body.note);
    res.json({ order: updated });
  }));

  router.post("/:id/cancel", requireAuth, asyncHandler(async (req, res) => {
    const order = getOrderDetail(store, req.params.id);
    assertHttp(order, 404, "Order not found");
    assertHttp(
      req.user.role === "admin" || Number(order.contractor_id) === Number(req.user.id),
      403,
      "Only the contractor or admin can cancel order"
    );
    assertHttp(["pending", "confirmed"].includes(order.status), 400, "Only pending or confirmed orders can be cancelled");
    const updated = await updateOrderStatus(store, smsService, req.params.id, "cancelled", req.body.reason || "Cancelled");
    res.json({ order: updated });
  }));

  return router;
}

module.exports = { orderRoutes };
