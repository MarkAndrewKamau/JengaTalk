const { verifyJwt } = require("../utils/jwt");
const { HttpError } = require("../utils/httpError");
const { normalizePhone } = require("../utils/phone");

function getToken(req) {
  const header = req.get("authorization") || "";
  if (header.toLowerCase().startsWith("bearer ")) {
    return header.slice(7).trim();
  }
  return req.body?.token || req.query?.token || "";
}

function attachAuth(store) {
  return (req, res, next) => {
    const token = getToken(req);
    const payload = token ? verifyJwt(token) : null;
    const demoPhone = req.get("x-demo-user-phone");

    if (payload?.sub) {
      const user = store.findById("users", payload.sub);
      if (user) req.user = user;
    } else if (demoPhone) {
      const user = store
        .all("users")
        .find((candidate) => candidate.phone === normalizePhone(demoPhone));
      if (user) req.user = user;
    }

    next();
  };
}

function requireAuth(req, res, next) {
  if (!req.user) return next(new HttpError(401, "Authentication required"));
  return next();
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return next(new HttpError(401, "Authentication required"));
    if (!roles.includes(req.user.role)) {
      return next(new HttpError(403, "Insufficient permissions"));
    }
    return next();
  };
}

module.exports = { attachAuth, requireAuth, requireRole };

