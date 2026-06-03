const { env } = require("../src/config/env");
const { JsonStore } = require("../src/db/jsonStore");

const store = new JsonStore({ filePath: env.dataFile });
store.reset();

console.log(`Seeded JengaLink data at ${env.dataFile}`);

