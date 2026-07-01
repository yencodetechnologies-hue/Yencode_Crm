const Activity = require('../models/activityModel');

const logActivity = async ({ leadId, type, description, metadata, performedBy }) => {
  const activity = new Activity({
    leadId,
    type,
    description,
    metadata: metadata || {},
    performedBy,
  });
  await activity.save();
  return activity;
};

module.exports = { logActivity };
