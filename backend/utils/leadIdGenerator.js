const Lead = require('../models/leadModel');

const generateLeadId = async () => {
  const count = await Lead.countDocuments();
  const num = (count + 1).toString().padStart(5, '0');
  return `LD-${num}`;
};

module.exports = { generateLeadId };
