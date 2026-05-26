const https = require('https');

const AGENCY_NAME = process.env.AGENCY_NAME || 'Your Agency';

function telnyxSmsPost(to, text) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      from: process.env.TELNYX_FROM_NUMBER,
      to,
      text,
    });

    const req = https.request(
      {
        hostname: 'api.telnyx.com',
        path: '/v2/messages',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body),
          'Authorization': `Bearer ${process.env.TELNYX_API_KEY}`,
        },
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) return resolve(JSON.parse(data));
          reject(new Error(`Telnyx SMS error ${res.statusCode}: ${data}`));
        });
      }
    );

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function sendInternalSmsNotification(booking) {
  if (!process.env.TELNYX_API_KEY) {
    console.log('[sms] Telnyx not configured — skipping internal SMS.');
    return null;
  }

  const { contact, business } = booking;
  return telnyxSmsPost(
    process.env.NOTIFY_SMS,
    `New lead: ${contact.firstName} ${contact.lastName} · ${business.serviceType} · ${contact.phone}`
  );
}

async function sendLeadSmsConfirmation(booking) {
  if (!process.env.TELNYX_API_KEY) {
    console.log('[sms] Telnyx not configured — skipping lead SMS.');
    return null;
  }

  const { contact } = booking;
  return telnyxSmsPost(
    contact.phone,
    `Hi ${contact.firstName}, this is ${AGENCY_NAME} — we got your request and will be in touch within 1 hour. Reply STOP to opt out.`
  );
}

module.exports = { sendInternalSmsNotification, sendLeadSmsConfirmation };
