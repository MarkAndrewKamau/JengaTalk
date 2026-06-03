const fs = require("node:fs");
const path = require("node:path");

function loadDotEnv(filePath = path.resolve(process.cwd(), ".env")) {
  if (!fs.existsSync(filePath)) return;

  const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/);
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#") || !line.includes("=")) continue;

    const index = line.indexOf("=");
    const key = line.slice(0, index).trim();
    let value = line.slice(index + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (!Object.prototype.hasOwnProperty.call(process.env, key)) {
      process.env[key] = value;
    }
  }
}

loadDotEnv();

const rootDir = process.cwd();

const env = {
  appName: process.env.APP_NAME || "JengaLink",
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT || 4000),
  host: process.env.HOST || "127.0.0.1",
  jwtSecret: process.env.JWT_SECRET || "dev-secret-change-me",
  jwtExpiresInSeconds: Number(process.env.JWT_EXPIRES_IN_SECONDS || 86400),
  otpTtlMinutes: Number(process.env.OTP_TTL_MINUTES || 10),
  smsShortcode: process.env.SMS_SHORTCODE || "20880",
  ussdCode: process.env.USSD_CODE || "*384*880#",
  dataFile: path.resolve(rootDir, process.env.DATA_FILE || "./data/jengalink-store.json"),
  africaTalking: {
    username: process.env.AT_USERNAME || "sandbox",
    apiKey: process.env.AT_API_KEY || "",
    smsFrom: process.env.AT_SMS_FROM || process.env.SMS_SHORTCODE || "20880",
  },
};

module.exports = { env, loadDotEnv };
