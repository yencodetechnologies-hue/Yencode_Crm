const mongoose = require('mongoose');

const ACTIVITY_TYPES = [
  'call', 'email', 'sms', 'whatsapp', 'status_change',
  'assignment', 'note', 'follow_up', 'notification',
];

const activitySchema = new mongoose.Schema(
  {
    leadId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead' },
    type: { type: String, enum: ACTIVITY_TYPES, required: true },
    description: { type: String },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
    performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
  },
  { timestamps: true }
);

activitySchema.index({ leadId: 1, createdAt: -1 });
activitySchema.index({ createdAt: -1 });

const Activity = mongoose.model('Activity', activitySchema);
module.exports = Activity;
module.exports.ACTIVITY_TYPES = ACTIVITY_TYPES;
