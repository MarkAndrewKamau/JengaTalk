const express = require("express");
const { asyncHandler } = require("../middleware/errors");
const { assertHttp } = require("../utils/httpError");
const { updateOrderStatus, getOrderDetail } = require("../services/orderService");

function webhookRoutes({ store, smsCommandService, ussdService, smsService }) {
  const router = express.Router();

  router.post("/sms/inbound", asyncHandler(async (req, res) => {
    const result = await smsCommandService.handleInbound(req.body);
    res.json({ ok: true, ...result });
  }));

  router.post("/sms/delivery-report", (req, res) => {
    const messageId = req.body.id || req.body.messageId || req.body.message_id;
    const status = req.body.status || req.body.Status || "delivered";
    assertHttp(messageId, 400, "Message ID is required");

    const updated = store.transaction((data) => {
      const log = data.sms_logs.find((entry) => entry.at_message_id === messageId);
      if (!log) return null;
      log.status = status;
      log.delivery_reported_at = new Date().toISOString();
      return log;
    });
    res.json({ ok: true, sms_log: updated });
  });

  router.post("/ussd", asyncHandler(async (req, res) => {
    const response = await ussdService.handle(req.body);
    res.type("text/plain").send(response);
  }));

  router.post("/voice/callback", asyncHandler(async (req, res) => {
    const orderId = req.body.orderId || req.body.order_id;
    const digits = String(req.body.dtmfDigits || req.body.digits || req.body.Digits || "");
    assertHttp(orderId, 400, "Order ID is required");
    const status = digits === "1" ? "confirmed" : digits === "2" ? "rejected" : null;
    assertHttp(status, 400, "Unsupported voice confirmation digit");
    const order = await updateOrderStatus(store, smsService, orderId, status, "Voice confirmation callback");
    res.json({ ok: true, order });
  }));

  router.post("/payments/callback", asyncHandler(async (req, res) => {
    const orderId = req.body.orderId || req.body.order_id || req.body.metadata?.orderId;
    assertHttp(orderId, 400, "Order ID is required");
    const order = getOrderDetail(store, orderId);
    assertHttp(order, 404, "Order not found");

    const paymentStatus = ["Success", "Completed", "paid", "success"].includes(req.body.status)
      ? "paid"
      : req.body.status || "pending";
    const updated = store.update("orders", order.id, {
      payment_status: paymentStatus,
      payment_reference: req.body.transactionId || req.body.transaction_id || req.body.providerRef || "",
      updated_at: new Date().toISOString(),
    });
    res.json({ ok: true, order: getOrderDetail(store, updated.id) });
  }));

  return router;
}

module.exports = { webhookRoutes };
