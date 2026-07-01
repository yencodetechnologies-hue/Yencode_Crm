const mongoose = require('mongoose');

const followUpSchema = new mongoose.Schema(
  {
    leadId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead', required: true },
    agentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
    date: { type: Date, required: true },
    time: { type: String },
    reminder: { type: Boolean, default: true },
    notes: { type: String },
    priority: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Medium' },
    status: { type: String, enum: ['Pending', 'Completed', 'Missed', 'Cancelled'], default: 'Pending' },
  },
  { timestamps: true }
);

followUpSchema.index({ agentId: 1, date: 1 });
followUpSchema.index({ leadId: 1 });

const FollowUp = mongoose.model('FollowUp', followUpSchema);
module.exports = FollowUp;
