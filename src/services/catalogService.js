const { normalizeText } = require("../utils/text");

function materialScore(material, query) {
  const normalizedQuery = normalizeText(query);
  if (!normalizedQuery) return 0;

  const names = [material.name, ...(material.aliases || [])].map(normalizeText);
  if (names.includes(normalizedQuery)) return 100;
  if (names.some((name) => name.startsWith(normalizedQuery))) return 85;
  if (names.some((name) => name.includes(normalizedQuery))) return 70;

  const queryParts = normalizedQuery.split(" ");
  const hitCount = queryParts.filter((part) => names.some((name) => name.includes(part))).length;
  return hitCount ? 40 + hitCount * 10 : 0;
}

function findMaterial(store, query) {
  const matches = store
    .all("materials")
    .map((material) => ({ material, score: materialScore(material, query) }))
    .filter((match) => match.score > 0)
    .sort((a, b) => b.score - a.score);

  return matches[0]?.material || null;
}

function joinProduct(store, product) {
  const supplier = store.findById("suppliers", product.supplier_id);
  const material = store.findById("materials", product.material_id);
  const supplierUser = supplier ? store.findById("users", supplier.user_id) : null;

  return {
    ...product,
    material,
    supplier: supplier
      ? {
          ...supplier,
          contact_phone: supplierUser?.phone || "",
          contact_name: supplierUser?.name || "",
        }
      : null,
  };
}

function comparePrices(store, { material, county, limit = 10, activeOnly = true }) {
  const matchedMaterial = Number(material)
    ? store.findById("materials", material)
    : findMaterial(store, material);
  if (!matchedMaterial) return { material: null, results: [] };

  const normalizedCounty = normalizeText(county);
  const products = store
    .all("supplier_products")
    .filter((product) => product.material_id === matchedMaterial.id)
    .filter((product) => !activeOnly || product.is_active)
    .map((product) => joinProduct(store, product))
    .filter((product) => product.supplier && product.material)
    .filter((product) => product.stock_qty > 0)
    .filter((product) => product.supplier.is_active)
    .filter((product) => {
      if (!normalizedCounty) return true;
      return normalizeText(product.supplier.county) === normalizedCounty;
    })
    .sort((a, b) => a.price - b.price)
    .slice(0, Number(limit) || 10);

  return { material: matchedMaterial, results: products };
}

function incrementQueryCounts(store, productIds) {
  store.transaction((data) => {
    for (const id of productIds) {
      const product = data.supplier_products.find((candidate) => Number(candidate.id) === Number(id));
      if (product) product.times_queried_week = Number(product.times_queried_week || 0) + 1;
    }
  });
}

module.exports = { comparePrices, findMaterial, joinProduct, incrementQueryCounts };

