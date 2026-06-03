const crypto = require("node:crypto");
const { env } = require("../config/env");

function generateOtp() {
  return String(crypto.randomInt(100000, 999999));
}

function otpExpiry() {
  return new Date(Date.now() + env.otpTtlMinutes * 60 * 1000).toISOString();
}

function isExpired(isoDate) {
  return !isoDate || new Date(isoDate).getTime() < Date.now();
}

module.exports = { generateOtp, otpExpiry, isExpired };

