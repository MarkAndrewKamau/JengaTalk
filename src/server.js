const { env } = require("./config/env");
const { createApp } = require("./app");

const app = createApp();

const server = app.listen(env.port, env.host, () => {
  console.log(`${env.appName} backend listening on http://${env.host}:${env.port}`);
});

server.on("error", (error) => {
  console.error(`Failed to start ${env.appName}: ${error.message}`);
  process.exit(1);
});

function shutdown(signal) {
  console.log(`${signal} received, shutting down.`);
  server.close(() => process.exit(0));
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
