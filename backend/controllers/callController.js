const Call = require('../models/callModel');
const Lead = require('../models/leadModel');
const { logActivity } = require('../utils/activityHelper');
const { normalizeRole } = require('../utils/jwt');

const outcomeToStatus = {
  Connected: 'Contacted',
  Missed: 'No Response',
  Busy: 'Busy',
  'No Answer': 'No Response',
  Rejected: 'Not Interested',
  'Wrong Number': 'Wrong Number',
};

exports.createCall = async (req, res) => {
  try {
    const { leadId, outcome, duration, notes, startedAt, endedAt, recordingUrl } = req.body;
    const agentId = req.user?.id;

    if (!leadId || !outcome) {
      return res.status(400).json({ message: 'leadId and outcome are required' });
    }

    const lead = await Lead.findById(leadId);
    if (!lead) return res.status(404).json({ message: 'Lead not found' });

    const call = new Call({
      leadId,
      agentId,
      outcome,
      duration: duration || 0,
      notes,
      startedAt,
      endedAt: endedAt || new Date(),
      recordingUrl,
    });
    await call.save();

    const newStatus = outcomeToStatus[outcome];
    if (newStatus) {
      await Lead.findByIdAndUpdate(leadId, { status: newStatus });
    }

    await logActivity({
      leadId,
      type: 'call',
      description: `Call logged: ${outcome}`,
      metadata: { outcome, duration, callId: call._id },
      performedBy: agentId,
    });

    res.status(201).json({ message: 'Call logged successfully', call });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getCallsByLead = async (req, res) => {
  try {
    const calls = await Call.find({ leadId: req.params.leadId })
      .populate('agentId', 'name empId')
      .sort({ createdAt: -1 });
    res.json(calls);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getCallsByAgent = async (req, res) => {
  try {
    const agentId = req.params.agentId;
    const calls = await Call.find({ agentId })
      .populate('leadId', 'name contact leadId')
      .sort({ createdAt: -1 });
    res.json(calls);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getTodayCalls = async (req, res) => {
  try {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);

    const filter = { createdAt: { $gte: start, $lte: end } };
    const role = normalizeRole(req.user?.role);
    if (role === 'Telecaller') {
      filter.agentId = req.user.id;
    }

    const calls = await Call.find(filter)
      .populate('leadId', 'name contact leadId')
      .populate('agentId', 'name empId')
      .sort({ createdAt: -1 });

    res.json(calls);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getAllCalls = async (req, res) => {
  try {
    const filter = {};
    if (req.query.agentId) filter.agentId = req.query.agentId;
    if (req.query.outcome) filter.outcome = req.query.outcome;

    if (req.query.startDate || req.query.endDate) {
      filter.createdAt = {};
      if (req.query.startDate) filter.createdAt.$gte = new Date(req.query.startDate);
      if (req.query.endDate) {
        const end = new Date(req.query.endDate);
        end.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = end;
      }
    }

    const calls = await Call.find(filter)
      .populate('leadId', 'name contact leadId')
      .populate('agentId', 'name empId')
      .sort({ createdAt: -1 });
    res.json(calls);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
