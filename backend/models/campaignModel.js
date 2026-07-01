const mongoose = require('mongoose');

const campaignSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    startDate: { type: Date },
    endDate: { type: Date },
    description: { type: String },
    assignedAgents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Employee' }],
    status: { type: String, enum: ['Active', 'Paused', 'Completed'], default: 'Active' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
  },
  { timestamps: true }
);

const Campaign = mongoose.model('Campaign', campaignSchema);
module.exports = Campaign;
