const { HttpError } = require("../utils/httpError");

function notFound(req, res, next) {
  next(new HttpError(404, `Route not found: ${req.method} ${req.originalUrl}`));
}

function asyncHandler(handler) {
  return (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}

function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);

  const status = err.status || 500;
  const message = err instanceof HttpError || status < 500 ? err.message : "Internal server error";
  console.error("Request failed", {
    method: req.method,
    path: req.originalUrl,
    status,
    message: err.message,
    details: err.details,
  });

  const payload = {
    error: {
      message,
      status,
    },
  };

  if (err.details) payload.error.details = err.details;
  if (process.env.NODE_ENV !== "production" && status >= 500) {
    payload.error.debug = err.message;
  }

  return res.status(status).json(payload);
}

module.exports = { notFound, errorHandler, asyncHandler };
