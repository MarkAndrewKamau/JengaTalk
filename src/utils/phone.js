function normalizePhone(value) {
  if (!value) return "";
  const raw = String(value).trim().replace(/[^\d+]/g, "");
  if (raw.startsWith("+")) return raw;
  if (raw.startsWith("254")) return `+${raw}`;
  if (raw.startsWith("0") && raw.length >= 10) return `+254${raw.slice(1)}`;
  if (raw.length === 9 && /^[17]\d{8}$/.test(raw)) return `+254${raw}`;
  return raw;
}

function maskPhone(value) {
  const phone = normalizePhone(value);
  if (phone.length < 8) return phone;
  return `${phone.slice(0, 6)}XXXX${phone.slice(-3)}`;
}

module.exports = { normalizePhone, maskPhone };

