/**
 * CRM integration via HubSpot.
 * Uncomment and wire up when HubSpot access token is added to .env.
 */

async function upsertContact(booking) {
  if (!process.env.HUBSPOT_ACCESS_TOKEN) {
    console.log('[crm] HubSpot not configured — skipping CRM upsert.');
    return null;
  }

  // const { Client } = require('@hubspot/api-client');
  // const hubspot = new Client({ accessToken: process.env.HUBSPOT_ACCESS_TOKEN });
  // const { contact, business, inquiry } = booking;
  //
  // const properties = {
  //   firstname:    contact.firstName,
  //   lastname:     contact.lastName,
  //   email:        contact.email,
  //   phone:        contact.phone,
  //   company:      business.name,
  //   service_type: business.serviceType,
  //   service_area: business.serviceArea,
  //   monthly_leads: business.monthlyLeads,
  //   lead_challenge: inquiry.challenge,
  //   hs_lead_status: 'NEW',
  // };
  //
  // const search = await hubspot.crm.contacts.searchApi.doSearch({
  //   filterGroups: [{ filters: [{ propertyName: 'email', operator: 'EQ', value: contact.email }] }],
  // });
  // if (search.total > 0) {
  //   return hubspot.crm.contacts.basicApi.update(search.results[0].id, { properties });
  // }
  // return hubspot.crm.contacts.basicApi.create({ properties });

  return null;
}

async function createDeal(booking, contactId) {
  if (!process.env.HUBSPOT_ACCESS_TOKEN || !contactId) return null;

  // const { Client } = require('@hubspot/api-client');
  // const hubspot = new Client({ accessToken: process.env.HUBSPOT_ACCESS_TOKEN });
  // const { business } = booking;
  //
  // const deal = await hubspot.crm.deals.basicApi.create({
  //   properties: {
  //     dealname:  `${business.name} — Strategy Call`,
  //     pipeline:  process.env.HUBSPOT_PIPELINE_ID,
  //     dealstage: process.env.HUBSPOT_STAGE_NEW_LEAD,
  //     closedate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  //   },
  // });
  // await hubspot.crm.deals.associationsApi.create(deal.id, 'contacts', contactId, 'deal_to_contact');
  // return deal;

  return null;
}

module.exports = { upsertContact, createDeal };
