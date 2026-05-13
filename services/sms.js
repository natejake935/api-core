/**
 * SMS notifications via Twilio.
 * Uncomment and wire up when Twilio credentials are added to .env.
 */

const AGENCY_NAME = process.env.AGENCY_NAME || 'Your Agency';

async function sendInternalSmsNotification(booking) {
  if (!process.env.TWILIO_ACCOUNT_SID) {
    console.log('[sms] Twilio not configured — skipping internal SMS.');
    return null;
  }

  // const twilio = require('twilio');
  // const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  // const { contact, business } = booking;
  // return client.messages.create({
  //   from: process.env.TWILIO_FROM_NUMBER,
  //   to: process.env.NOTIFY_SMS,
  //   body: `New booking: ${contact.firstName} ${contact.lastName} · ${business.serviceType} · ${contact.phone}`,
  // });

  return null;
}

async function sendLeadSmsConfirmation(booking) {
  if (!process.env.TWILIO_ACCOUNT_SID) {
    console.log('[sms] Twilio not configured — skipping lead SMS.');
    return null;
  }

  // const twilio = require('twilio');
  // const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  // const { contact } = booking;
  // return client.messages.create({
  //   from: process.env.TWILIO_FROM_NUMBER,
  //   to: contact.phone,
  //   body: `Hi ${contact.firstName}, this is ${AGENCY_NAME} — we got your strategy call request and will be in touch within 1 hour. Reply STOP to opt out.`,
  // });

  return null;
}

module.exports = { sendInternalSmsNotification, sendLeadSmsConfirmation };
