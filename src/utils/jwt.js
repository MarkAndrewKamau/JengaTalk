const crypto = require("node:crypto");
const { env } = require("../config/env");

function base64url(input) {
  return Buffer.from(input)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function fromBase64url(input) {
  const padded = input.replace(/-/g, "+").replace(/_/g, "/");
  return Buffer.from(padded, "base64").toString("utf8");
}

function signJwt(payload, options = {}) {
  const nowSeconds = Math.floor(Date.now() / 1000);
  const expiresInSeconds = options.expiresInSeconds || env.jwtExpiresInSeconds;
  const header = { alg: "HS256", typ: "JWT" };
  const body = {
    ...payload,
    iat: nowSeconds,
    exp: nowSeconds + expiresInSeconds,
  };
  const unsigned = `${base64url(JSON.stringify(header))}.${base64url(JSON.stringify(body))}`;
  const signature = crypto
    .createHmac("sha256", options.secret || env.jwtSecret)
    .update(unsigned)
    .digest("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
  return `${unsigned}.${signature}`;
}

function verifyJwt(token, options = {}) {
  const parts = String(token || "").split(".");
  if (parts.length !== 3) return null;
  const [encodedHeader, encodedPayload, signature] = parts;
  const unsigned = `${encodedHeader}.${encodedPayload}`;
  const expected = crypto
    .createHmac("sha256", options.secret || env.jwtSecret)
    .update(unsigned)
    .digest("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

  if (signature.length !== expected.length) return null;
  const validSignature = crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  if (!validSignature) return null;

  const payload = JSON.parse(fromBase64url(encodedPayload));
  if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;
  return payload;
}

module.exports = { signJwt, verifyJwt };
