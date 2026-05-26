const { sendInternalNotification, sendLeadConfirmation } = require('../services/email');
const { sendInternalSmsNotification, sendLeadSmsConfirmation } = require('../services/sms');
const { upsertContact, createDeal } = require('../services/crm');

const ALLOWED_SERVICE_TYPES = new Set([
  'electrical', 'remodeling', 'plumbing', 'hvac',
  'roofing', 'general-contractor', 'landscaping', 'other',
]);

const ALLOWED_CONTACT_METHODS = new Set(['phone', 'text', 'email']);

/**
 * POST /v1/bookings
 *
 * Fan-out order:
 *   1. Validate payload (including server-side honeypot check)
 *   2. Normalize phone to E.164
 *   3. Email: internal notification + lead confirmation (Resend) — awaited
 *   4. SMS + CRM — fire-and-forget, failures logged only
 */
async function handleBooking(req, res) {
  const payload = req.body;

  const validationError = validatePayload(payload);
  if (validationError) {
    return res.status(400).json({ code: 'validation_error', message: validationError });
  }

  const normalizedPhone = normalizePhone(payload.contact.phone);
  const booking = {
    ...payload,
    contact: { ...payload.contact, phone: normalizedPhone },
    id: generateId(),
    receivedAt: new Date().toISOString(),
  };

  // --- Email (Telnyx) ---
  try {
    await Promise.all([
      sendInternalNotification(booking),
      sendLeadConfirmation(booking),
    ]);
  } catch (err) {
    console.error('[booking] email fan-out failed:', err.message);
    return res.status(500).json({
      code: 'server_error',
      message: 'Something went wrong. Please try again.',
    });
  }

  // --- SMS + CRM (fire-and-forget, logged on failure) ---
  Promise.allSettled([
    sendInternalSmsNotification(booking),
    sendLeadSmsConfirmation(booking),
    upsertContact(booking).then((contact) => contact && createDeal(booking, contact.id)),
  ]).then((results) => {
    results.forEach((r, i) => {
      const label = ['sms:internal', 'sms:lead', 'crm'][i];
      if (r.status === 'rejected') {
        console.error(`[booking] ${label} failed:`, r.reason?.message || r.reason);
      }
    });
  });

  return res.status(201).json({ id: booking.id, status: 'received' });
}

function validatePayload(payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return 'Invalid request body.';
  }

  const { contact, business, inquiry, consent, honeypot } = payload;

  if (typeof honeypot === 'string' && honeypot.trim().length > 0) {
    return 'Invalid submission.';
  }

  if (typeof contact?.firstName !== 'string' || !contact.firstName.trim()) return 'First name is required.';
  if (typeof contact?.lastName  !== 'string' || !contact.lastName.trim())  return 'Last name is required.';
  if (typeof contact?.email     !== 'string' || !contact.email.trim())     return 'Email is required.';
  if (typeof contact?.phone     !== 'string' || !contact.phone.trim())     return 'Phone number is required.';

  if (contact.firstName.trim().length > 100) return 'First name is too long.';
  if (contact.lastName.trim().length  > 100) return 'Last name is too long.';

  const emailRe = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  if (!emailRe.test(contact.email.trim())) return 'Invalid email address.';
  if (contact.email.length > 254) return 'Email address is too long.';

  const digits = contact.phone.replace(/\D/g, '');
  if (digits.length < 10 || digits.length > 15) return 'Invalid phone number.';

  if (typeof business?.name !== 'string' || !business.name.trim()) return 'Business name is required.';
  if (business.name.trim().length > 200) return 'Business name is too long.';

  if (!business?.serviceType || !ALLOWED_SERVICE_TYPES.has(business.serviceType)) {
    return 'Invalid service type.';
  }

  if (typeof business.serviceArea === 'string' && business.serviceArea.length > 200) {
    return 'Service area is too long.';
  }

  if (typeof inquiry?.challenge === 'string' && inquiry.challenge.length > 1000) {
    return 'Challenge description is too long (max 1000 characters).';
  }

  if (inquiry?.preferredContactMethod &&
      !ALLOWED_CONTACT_METHODS.has(inquiry.preferredContactMethod)) {
    return 'Invalid contact method.';
  }

  return null;
}

function normalizePhone(raw) {
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
  return raw;
}

function generateId() {
  return 'lead_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

module.exports = { handleBooking };
