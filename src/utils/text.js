function normalizeText(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^\w\s-]/g, " ")
    .replace(/\s+/g, " ");
}

function titleCase(value) {
  return normalizeText(value)
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function toMoney(value) {
  return `KES ${Number(value || 0).toLocaleString("en-KE", {
    maximumFractionDigits: 0,
  })}`;
}

function truncateSms(message, maxLength = 480) {
  const text = String(message || "").trim();
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 3)}...`;
}

module.exports = { normalizeText, titleCase, toMoney, truncateSms };

