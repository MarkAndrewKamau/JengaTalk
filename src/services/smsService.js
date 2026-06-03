const { env } = require("../config/env");
const { normalizePhone } = require("../utils/phone");
const { truncateSms } = require("../utils/text");

function createSmsService({ store }) {
  let atSms = null;

  if (env.africaTalking.apiKey) {
    try {
      const africastalking = require("africastalking");
      atSms = africastalking({
        username: env.africaTalking.username,
        apiKey: env.africaTalking.apiKey,
      }).SMS;
    } catch (error) {
      console.warn("Africa's Talking SDK not installed; using mock SMS sender.");
    }
  }

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

    if (atSms) {
      const result = await atSms.send({ to: recipients, message: text, from });
      const atRecipients = result?.SMSMessageData?.Recipients || [];
      providerResult = {
        provider: "africas-talking",
        status: "sent",
        raw: result,
        recipients: atRecipients.map((recipient) => ({
          phone: recipient.number,
          messageId: recipient.messageId,
          status: recipient.status,
          cost: recipient.cost,
        })),
      };
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

module.exports = { createSmsService };

