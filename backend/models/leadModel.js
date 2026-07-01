const mongoose = require('mongoose');

const LEAD_STATUSES = [
  'New', 'Contacted', 'Follow-up', 'Interested', 'Not Interested',
  'Converted', 'Lost', 'Wrong Number', 'No Response', 'Busy', 'Switched Off',
];

const leadSchema = new mongoose.Schema(
  {
    leadId: { type: String, unique: true, sparse: true },
    name: { type: String, required: true },
    contact: { type: String, required: true },
    alternateContact: { type: String },
    email: { type: String },
    company: { type: String },
    source: { type: String },
    campaign: { type: mongoose.Schema.Types.ObjectId, ref: 'Campaign' },
    city: { type: String },
    state: { type: String },
    country: { type: String, default: 'India' },
    address: { type: String },
    location: { type: String },
    interest: { type: String },
    requirements: { type: String },
    links: { type: String },
    comments: { type: String },
    priority: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Medium' },
    status: { type: String, enum: LEAD_STATUSES, default: 'New' },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
  },
  { timestamps: true }
);

leadSchema.index({ contact: 1 });
leadSchema.index({ email: 1 });
leadSchema.index({ status: 1 });
leadSchema.index({ assignedTo: 1 });

const Lead = mongoose.model('Lead', leadSchema);
module.exports = Lead;
module.exports.LEAD_STATUSES = LEAD_STATUSES;
