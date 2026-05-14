const AGENCY_NAME = process.env.AGENCY_NAME || 'Your Agency';

function getTwilioClient() {
  const twilio = require('twilio');
  return twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
}

async function sendInternalSmsNotification(booking) {
  if (!process.env.TWILIO_ACCOUNT_SID) {
    console.log('[sms] Twilio not configured — skipping internal SMS.');
    return null;
  }

  const { contact, business } = booking;
  return getTwilioClient().messages.create({
    from: process.env.TWILIO_FROM_NUMBER,
    to:   process.env.NOTIFY_SMS,
    body: `New lead: ${contact.firstName} ${contact.lastName} · ${business.serviceType} · ${contact.phone}`,
  });
}

async function sendLeadSmsConfirmation(booking) {
  if (!process.env.TWILIO_ACCOUNT_SID) {
    console.log('[sms] Twilio not configured — skipping lead SMS.');
    return null;
  }

  const { contact } = booking;
  return getTwilioClient().messages.create({
    from: process.env.TWILIO_FROM_NUMBER,
    to:   contact.phone,
    body: `Hi ${contact.firstName}, this is ${AGENCY_NAME} — we got your request and will be in touch within 1 hour. Reply STOP to opt out.`,
  });
}

module.exports = { sendInternalSmsNotification, sendLeadSmsConfirmation };
