const { env } = require("../config/env");
const { HttpError } = require("../utils/httpError");
const { maskPhone, normalizePhone } = require("../utils/phone");
const { truncateSms } = require("../utils/text");

const acceptedRecipientStatuses = new Set(["success", "sent", "queued", "submitted", "buffered"]);

function getSmsApiUrl() {
  if (env.africaTalking.smsApiUrl) return env.africaTalking.smsApiUrl;
  if (env.africaTalking.username === "sandbox") {
    return "https://api.sandbox.africastalking.com/version1/messaging";
  }
  return "https://api.africastalking.com/version1/messaging";
}

async function sendViaAfricasTalking({ recipients, text, from }) {
  const body = new URLSearchParams({
    username: env.africaTalking.username,
    to: recipients.join(","),
    message: text,
  });
  if (from) body.set("from", from);

  const response = await fetch(getSmsApiUrl(), {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/x-www-form-urlencoded",
      apiKey: env.africaTalking.apiKey,
    },
    body,
  });

  const raw = await response.text();
  let result = {};
  try {
    result = raw ? JSON.parse(raw) : {};
  } catch (error) {
    result = { raw };
  }

  if (!response.ok) {
    const message = result?.SMSMessageData?.Message || result?.errorMessage || raw || response.statusText;
    throw new Error(`Africa's Talking SMS failed: ${message}`);
  }

  const atRecipients = result?.SMSMessageData?.Recipients || [];
  if (!atRecipients.length) {
    const message = result?.SMSMessageData?.Message || "Africa's Talking returned no SMS recipients";
    throw new HttpError(502, `Africa's Talking SMS was not accepted: ${message}`);
  }

  const recipientsResult = atRecipients.map((recipient) => ({
    phone: recipient.number,
    messageId: recipient.messageId,
    status: recipient.status,
    cost: recipient.cost,
  }));
  const failedRecipients = recipientsResult.filter((recipient) => {
    return !acceptedRecipientStatuses.has(String(recipient.status || "").toLowerCase());
  });

  console.info("Africa's Talking SMS result", {
    message: result?.SMSMessageData?.Message,
    recipients: recipientsResult.map((recipient) => ({
      phone: maskPhone(recipient.phone),
      status: recipient.status,
      cost: recipient.cost,
      messageId: recipient.messageId,
    })),
  });

  if (failedRecipients.length) {
    const statuses = failedRecipients
      .map((recipient) => `${maskPhone(recipient.phone)}=${recipient.status || "Unknown"}`)
      .join(", ");
    throw new HttpError(502, `Africa's Talking SMS was not accepted: ${statuses}`);
  }

  return {
    provider: "africas-talking",
    status: "sent",
    raw: result,
    recipients: recipientsResult,
  };
}

function createSmsService({ store }) {
  async function sendSms({ to, message, type = "alert", from = env.africaTalking.smsFrom }) {
    const recipients = Array.isArray(to) ? to.map(normalizePhone) : [normalizePhone(to)];
    const text = truncateSms(message);
    let providerResult = {
      provider: "mock",
      status: "sent",
      recipients: recipients.map((phone) => ({
        phone,
        messageId: `mock-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      })),
    };

    if (env.africaTalking.apiKey) {
      providerResult = await sendViaAfricasTalking({ recipients, text, from });
    }

    for (const recipient of providerResult.recipients) {
      store.insert("sms_logs", {
        from_phone: from,
        to_phone: normalizePhone(recipient.phone),
        message: text,
        direction: "out",
        message_type: type,
        at_message_id: recipient.messageId || "",
        cost: recipient.cost || "",
        status: recipient.status || providerResult.status,
        created_at: new Date().toISOString(),
      });
    }

    return providerResult;
  }

  return { sendSms };
}

module.exports = { createSmsService, getSmsApiUrl, sendViaAfricasTalking };
