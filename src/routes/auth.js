const express = require("express");
const { signJwt, verifyJwt } = require("../utils/jwt");
const { generateOtp, otpExpiry, isExpired } = require("../utils/otp");
const { normalizePhone } = require("../utils/phone");
const { assertHttp, HttpError } = require("../utils/httpError");
const { env } = require("../config/env");
const { asyncHandler } = require("../middleware/errors");

function authRoutes({ store, smsService }) {
  const router = express.Router();

  function applySmsResult(result) {
    if (result?.status === "failed") {
      return { sent: false, error: result.error || "SMS provider rejected the message" };
    }
    return { sent: true, error: null };
  }

  router.post("/register", asyncHandler(async (req, res) => {
    const phone = normalizePhone(req.body.phone);
    const role = req.body.role || "contractor";
    assertHttp(phone, 400, "Phone is required");
    assertHttp(["supplier", "contractor", "admin"].includes(role), 400, "Invalid role");

    const otp = generateOtp();
    const existing = store.all("users").find((user) => user.phone === phone);
    const payload = {
      phone,
      name: req.body.name || "JengaLink User",
      role,
      county: String(req.body.county || "").toLowerCase(),
      created_at: existing?.created_at || new Date().toISOString(),
      verified: existing?.verified || false,
      otp_code: otp,
      otp_expires: otpExpiry(),
    };

    const user = existing ? store.update("users", existing.id, payload) : store.insert("users", payload);
    let smsSent = false;
    let smsError = null;
    try {
      const smsResult = await smsService.sendSms({
        to: phone,
        type: "otp",
        message: `Your ${env.appName} verification code is ${otp}. Valid for ${env.otpTtlMinutes} minutes. Do not share.`,
      });
      const result = applySmsResult(smsResult);
      smsSent = result.sent;
      smsError = result.error;
    } catch (err) {
      console.error("[auth/register] OTP SMS failed:", err.message);
      smsError = err.message;
    }

    res.status(existing ? 200 : 201).json({
      user: { id: user.id, phone: user.phone, name: user.name, role: user.role, county: user.county },
      otp_sent: smsSent,
      sms_error: env.nodeEnv !== "production" ? smsError : undefined,
      dev_otp: env.nodeEnv === "production" ? undefined : otp,
    });
  }));

  router.post("/verify-otp", (req, res) => {
    const phone = normalizePhone(req.body.phone);
    const otp = String(req.body.otp || "").trim();
    const user = store.all("users").find((candidate) => candidate.phone === phone);
    assertHttp(user, 404, "User not found");
    assertHttp(user.otp_code && user.otp_code === otp, 400, "Invalid OTP");
    assertHttp(!isExpired(user.otp_expires), 400, "OTP expired");

    const updated = store.update("users", user.id, {
      verified: true,
      otp_code: null,
      otp_expires: null,
    });
    const token = signJwt({ sub: updated.id, role: updated.role, phone: updated.phone });
    res.json({ token, user: updated });
  });

  router.post("/login", asyncHandler(async (req, res) => {
    const phone = normalizePhone(req.body.phone);
    const user = store.all("users").find((candidate) => candidate.phone === phone);
    assertHttp(user, 404, "User not found");
    const otp = generateOtp();
    store.update("users", user.id, { otp_code: otp, otp_expires: otpExpiry() });
    let smsSent = false;
    let smsError = null;
    try {
      const smsResult = await smsService.sendSms({
        to: phone,
        type: "otp",
        message: `Your ${env.appName} login code is ${otp}. Valid for ${env.otpTtlMinutes} minutes.`,
      });
      const result = applySmsResult(smsResult);
      smsSent = result.sent;
      smsError = result.error;
    } catch (err) {
      console.error("[auth/login] OTP SMS failed:", err.message);
      smsError = err.message;
    }
    res.json({
      otp_sent: smsSent,
      sms_error: env.nodeEnv !== "production" ? smsError : undefined,
      dev_otp: env.nodeEnv === "production" ? undefined : otp,
    });
  }));

  router.post("/refresh", (req, res) => {
    const token = req.body.token || String(req.get("authorization") || "").replace(/^bearer\s+/i, "");
    const payload = verifyJwt(token);
    if (!payload) throw new HttpError(401, "Invalid token");
    const user = store.findById("users", payload.sub);
    assertHttp(user, 404, "User not found");
    res.json({ token: signJwt({ sub: user.id, role: user.role, phone: user.phone }), user });
  });

  return router;
}

module.exports = { authRoutes };
