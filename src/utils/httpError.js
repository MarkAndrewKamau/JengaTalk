class HttpError extends Error {
  constructor(status, message, details) {
    super(message);
    this.name = "HttpError";
    this.status = status;
    this.details = details;
  }
}

function assertHttp(condition, status, message, details) {
  if (!condition) throw new HttpError(status, message, details);
}

module.exports = { HttpError, assertHttp };

