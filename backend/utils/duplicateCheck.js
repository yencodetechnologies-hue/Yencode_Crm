const Lead = require('../models/leadModel');

const normalizePhone = (phone) => {
  if (!phone) return '';
  return phone.replace(/\D/g, '').slice(-10);
};

const findDuplicates = async ({ contact, alternateContact, email, excludeId }) => {
  const normalizedContact = normalizePhone(contact);
  const normalizedAlt = normalizePhone(alternateContact);
  const query = { $or: [] };

  if (email) query.$or.push({ email: email.toLowerCase().trim() });
  if (normalizedContact) {
    query.$or.push({ contact: { $regex: normalizedContact.slice(-10) + '$' } });
  }
  if (normalizedAlt) {
    query.$or.push({ alternateContact: { $regex: normalizedAlt.slice(-10) + '$' } });
  }

  if (query.$or.length === 0) return [];

  if (excludeId) query._id = { $ne: excludeId };

  return Lead.find(query).select('leadId name contact email alternateContact');
};

const isDuplicate = async (fields, excludeId) => {
  const dupes = await findDuplicates({ ...fields, excludeId });
  return dupes.length > 0;
};

module.exports = { normalizePhone, findDuplicates, isDuplicate };
