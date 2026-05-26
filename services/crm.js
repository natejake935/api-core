const https = require('https');

function ghlPost(path, payload) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(payload);

    const req = https.request(
      {
        hostname: 'services.leadconnectorhq.com',
        path,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body),
          'Authorization': `Bearer ${process.env.GHL_API_KEY}`,
          'Version': '2023-02-21',
        },
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) return resolve(JSON.parse(data));
          reject(new Error(`GHL API error ${res.statusCode}: ${data}`));
        });
      }
    );

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function upsertContact(booking) {
  if (!process.env.GHL_API_KEY) {
    console.log('[crm] GHL not configured — skipping contact upsert.');
    return null;
  }

  const { contact, business, inquiry } = booking;

  const payload = {
    locationId:  process.env.GHL_LOCATION_ID,
    firstName:   contact.firstName,
    lastName:    contact.lastName,
    email:       contact.email,
    phone:       contact.phone,
    companyName: business.name,
    source:      'website',
    tags:        ['strategy-call'],
  };

  // Custom field IDs are set in GHL under Settings → Custom Fields.
  const customFields = [];
  if (process.env.GHL_FIELD_SERVICE_TYPE)  customFields.push({ id: process.env.GHL_FIELD_SERVICE_TYPE,  field_value: business.serviceType  || '' });
  if (process.env.GHL_FIELD_SERVICE_AREA)  customFields.push({ id: process.env.GHL_FIELD_SERVICE_AREA,  field_value: business.serviceArea  || '' });
  if (process.env.GHL_FIELD_MONTHLY_LEADS) customFields.push({ id: process.env.GHL_FIELD_MONTHLY_LEADS, field_value: business.monthlyLeads || '' });
  if (process.env.GHL_FIELD_CHALLENGE)     customFields.push({ id: process.env.GHL_FIELD_CHALLENGE,     field_value: inquiry?.challenge    || '' });
  if (customFields.length) payload.customFields = customFields;

  // POST /contacts/upsert dedupes by email per the location's duplicate-contact setting.
  const result = await ghlPost('/contacts/upsert', payload);
  return result.contact ?? result;
}

async function createDeal(booking, contactId) {
  if (!process.env.GHL_API_KEY || !process.env.GHL_PIPELINE_ID || !contactId) return null;

  const { business } = booking;

  const payload = {
    locationId:  process.env.GHL_LOCATION_ID,
    title:       `${business.name} — Strategy Call`,
    status:      'open',
    pipelineId:  process.env.GHL_PIPELINE_ID,
    contactId,
  };
  if (process.env.GHL_STAGE_ID) payload.pipelineStageId = process.env.GHL_STAGE_ID;

  return ghlPost('/opportunities/', payload);
}

module.exports = { upsertContact, createDeal };
