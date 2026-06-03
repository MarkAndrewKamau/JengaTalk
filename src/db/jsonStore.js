const fs = require("node:fs");
const path = require("node:path");
const { cloneSeed } = require("./seed");

const collections = [
  "users",
  "suppliers",
  "materials",
  "supplier_products",
  "orders",
  "order_items",
  "sms_logs",
  "price_alerts",
  "delivery_events",
  "sms_sessions",
];

class JsonStore {
  constructor({ filePath }) {
    this.filePath = filePath;
    this.ensureReady();
  }

  ensureReady() {
    fs.mkdirSync(path.dirname(this.filePath), { recursive: true });
    if (!fs.existsSync(this.filePath)) {
      this.write(cloneSeed());
    }
  }

  read() {
    this.ensureReadyWithoutWriteLoop();
    const raw = fs.readFileSync(this.filePath, "utf8");
    const data = JSON.parse(raw);
    for (const collection of collections) {
      if (!Array.isArray(data[collection])) data[collection] = [];
    }
    data.meta = data.meta || { nextIds: {} };
    data.meta.nextIds = data.meta.nextIds || {};
    for (const collection of collections) {
      if (!data.meta.nextIds[collection]) {
        const maxId = data[collection].reduce((max, item) => Math.max(max, Number(item.id) || 0), 0);
        data.meta.nextIds[collection] = maxId + 1;
      }
    }
    return data;
  }

  ensureReadyWithoutWriteLoop() {
    fs.mkdirSync(path.dirname(this.filePath), { recursive: true });
    if (!fs.existsSync(this.filePath)) {
      fs.writeFileSync(this.filePath, JSON.stringify(cloneSeed(), null, 2));
    }
  }

  write(data) {
    fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2));
  }

  transaction(mutator) {
    const data = this.read();
    const result = mutator(data);
    this.write(data);
    return result;
  }

  all(collection) {
    return this.read()[collection] || [];
  }

  findById(collection, id) {
    return this.all(collection).find((item) => Number(item.id) === Number(id)) || null;
  }

  insert(collection, item) {
    return this.transaction((data) => {
      const id = data.meta.nextIds[collection] || 1;
      data.meta.nextIds[collection] = id + 1;
      const record = { id, ...item };
      data[collection].push(record);
      return record;
    });
  }

  update(collection, id, patch) {
    return this.transaction((data) => {
      const index = data[collection].findIndex((item) => Number(item.id) === Number(id));
      if (index === -1) return null;
      data[collection][index] = { ...data[collection][index], ...patch };
      return data[collection][index];
    });
  }

  delete(collection, id) {
    return this.transaction((data) => {
      const index = data[collection].findIndex((item) => Number(item.id) === Number(id));
      if (index === -1) return false;
      data[collection].splice(index, 1);
      return true;
    });
  }

  reset() {
    this.write(cloneSeed());
  }
}

module.exports = { JsonStore, collections };

