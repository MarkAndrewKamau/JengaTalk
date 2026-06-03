const { env } = require("../src/config/env");
const { JsonStore } = require("../src/db/jsonStore");
const { catalogMaterials, catalogSuppliers } = require("../src/db/catalogSeed");

function nextId(data, collection) {
  const current = data.meta.nextIds[collection] || 1;
  data.meta.nextIds[collection] = current + 1;
  return current;
}

function normalize(value) {
  return String(value || "").trim().toLowerCase();
}

function upsertRecord(data, collection, finder, buildCreate, buildUpdate) {
  const existing = data[collection].find(finder);
  if (existing) {
    Object.assign(existing, buildUpdate(existing));
    return { record: existing, created: false };
  }

  const record = {
    id: nextId(data, collection),
    ...buildCreate(),
  };
  data[collection].push(record);
  return { record, created: true };
}

function seedCatalog(store) {
  const now = new Date().toISOString();
  const summary = {
    users_created: 0,
    users_updated: 0,
    suppliers_created: 0,
    suppliers_updated: 0,
    materials_created: 0,
    materials_updated: 0,
    products_created: 0,
    products_updated: 0,
  };

  store.transaction((data) => {
    const materialByName = new Map();

    for (const materialInput of catalogMaterials) {
      const { record, created } = upsertRecord(
        data,
        "materials",
        (material) => normalize(material.name) === normalize(materialInput.name),
        () => ({ ...materialInput }),
        () => ({ ...materialInput })
      );
      summary[created ? "materials_created" : "materials_updated"] += 1;
      materialByName.set(normalize(record.name), record);
    }

    for (const supplierSeed of catalogSuppliers) {
      const userInput = supplierSeed.user;
      const supplierInput = supplierSeed.supplier;

      const { record: user, created: userCreated } = upsertRecord(
        data,
        "users",
        (candidate) => normalize(candidate.phone) === normalize(userInput.phone),
        () => ({
          phone: userInput.phone,
          name: userInput.name,
          role: "supplier",
          county: normalize(userInput.county),
          created_at: now,
          verified: true,
          otp_code: null,
          otp_expires: null,
        }),
        (existing) => ({
          name: userInput.name || existing.name,
          role: "supplier",
          county: normalize(userInput.county || existing.county),
          verified: true,
          otp_code: null,
          otp_expires: null,
        })
      );
      summary[userCreated ? "users_created" : "users_updated"] += 1;

      const { record: supplier, created: supplierCreated } = upsertRecord(
        data,
        "suppliers",
        (candidate) => normalize(candidate.code) === normalize(supplierInput.code),
        () => ({
          user_id: user.id,
          ...supplierInput,
          county: normalize(supplierInput.county),
        }),
        () => ({
          user_id: user.id,
          ...supplierInput,
          county: normalize(supplierInput.county),
        })
      );
      summary[supplierCreated ? "suppliers_created" : "suppliers_updated"] += 1;

      for (const productInput of supplierSeed.products) {
        let material = materialByName.get(normalize(productInput.material));
        if (!material) {
          material = data.materials.find((candidate) => normalize(candidate.name) === normalize(productInput.material));
        }
        if (!material) {
          throw new Error(`Unknown material in product seed: ${productInput.material}`);
        }

        const productFields = {
          supplier_id: supplier.id,
          material_id: material.id,
          price: Number(productInput.price),
          stock_qty: Number(productInput.stock_qty),
          min_order_qty: Number(productInput.min_order_qty || 1),
          is_active: productInput.is_active !== false,
          updated_at: now,
          times_queried_week: Number(productInput.times_queried_week || 0),
        };

        const { created } = upsertRecord(
          data,
          "supplier_products",
          (candidate) => Number(candidate.supplier_id) === Number(supplier.id) && Number(candidate.material_id) === Number(material.id),
          () => productFields,
          () => productFields
        );
        summary[created ? "products_created" : "products_updated"] += 1;
      }
    }
  });

  return summary;
}

if (require.main === module) {
  const store = new JsonStore({ filePath: env.dataFile });
  const summary = seedCatalog(store);

  console.log(`Seeded materials and suppliers at ${env.dataFile}`);
  console.table(summary);
}

module.exports = { seedCatalog };

