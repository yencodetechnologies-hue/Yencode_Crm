const mongoose = require('mongoose');

const CALL_OUTCOMES = [
  'Connected', 'Missed', 'Busy', 'No Answer', 'Rejected', 'Wrong Number',
];

const callSchema = new mongoose.Schema(
  {
    leadId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead', required: true },
    agentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
    outcome: { type: String, enum: CALL_OUTCOMES, required: true },
    duration: { type: Number, default: 0 },
    notes: { type: String },
    startedAt: { type: Date },
    endedAt: { type: Date },
    recordingUrl: { type: String },
    externalCallId: { type: String },
  },
  { timestamps: true }
);

callSchema.index({ leadId: 1 });
callSchema.index({ agentId: 1 });
callSchema.index({ createdAt: -1 });

const Call = mongoose.model('Call', callSchema);
module.exports = Call;
module.exports.CALL_OUTCOMES = CALL_OUTCOMES;
