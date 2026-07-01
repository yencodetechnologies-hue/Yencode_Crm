const Lead = require('../models/leadModel');
const Call = require('../models/callModel');
const FollowUp = require('../models/followUpModel');
const Campaign = require('../models/campaignModel');
const Quotation = require('../models/quotationmodel');

const buildDateFilter = (query) => {
  const filter = {};
  if (query.startDate || query.endDate) {
    filter.createdAt = {};
    if (query.startDate) filter.createdAt.$gte = new Date(query.startDate);
    if (query.endDate) {
      const end = new Date(query.endDate);
      end.setHours(23, 59, 59, 999);
      filter.createdAt.$lte = end;
    }
  }
  return filter;
};

exports.getDailyCallReport = async (req, res) => {
  try {
    const filter = buildDateFilter(req.query);
    const calls = await Call.find(filter)
      .populate('leadId', 'name contact leadId')
      .populate('agentId', 'name empId')
      .sort({ createdAt: -1 });

    const summary = {
      total: calls.length,
      connected: calls.filter((c) => c.outcome === 'Connected').length,
      missed: calls.filter((c) => c.outcome === 'Missed').length,
      busy: calls.filter((c) => c.outcome === 'Busy').length,
      totalDuration: calls.reduce((sum, c) => sum + (c.duration || 0), 0),
    };

    res.json({ calls, summary });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getLeadConversionReport = async (req, res) => {
  try {
    const filter = buildDateFilter(req.query);
    const leads = await Lead.find(filter)
      .populate('assignedTo', 'name empId')
      .select('name leadId status source assignedTo createdAt');

    const byStatus = {};
    leads.forEach((l) => {
      byStatus[l.status] = (byStatus[l.status] || 0) + 1;
    });

    const converted = byStatus['Converted'] || 0;
    const conversionRate = leads.length > 0 ? ((converted / leads.length) * 100).toFixed(1) : 0;

    res.json({ leads, byStatus, conversionRate: parseFloat(conversionRate) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getFollowUpReport = async (req, res) => {
  try {
    const filter = {};
    if (req.query.startDate || req.query.endDate) {
      filter.date = {};
      if (req.query.startDate) filter.date.$gte = new Date(req.query.startDate);
      if (req.query.endDate) filter.date.$lte = new Date(req.query.endDate);
    }

    const followUps = await FollowUp.find(filter)
      .populate('leadId', 'name contact leadId')
      .populate('agentId', 'name empId');

    const summary = {
      total: followUps.length,
      pending: followUps.filter((f) => f.status === 'Pending').length,
      completed: followUps.filter((f) => f.status === 'Completed').length,
      missed: followUps.filter((f) => f.status === 'Missed').length,
    };

    res.json({ followUps, summary });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getMissedCallsReport = async (req, res) => {
  try {
    const filter = { ...buildDateFilter(req.query), outcome: { $in: ['Missed', 'No Answer', 'Busy'] } };
    const calls = await Call.find(filter)
      .populate('leadId', 'name contact leadId')
      .populate('agentId', 'name empId')
      .sort({ createdAt: -1 });
    res.json({ calls, total: calls.length });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getCampaignPerformanceReport = async (req, res) => {
  try {
    const campaigns = await Campaign.find().sort({ createdAt: -1 });
    const report = [];

    for (const campaign of campaigns) {
      const leads = await Lead.find({ campaign: campaign._id });
      const leadIds = leads.map((l) => l._id);
      const [calls, converted] = await Promise.all([
        Call.countDocuments({ leadId: { $in: leadIds } }),
        Lead.countDocuments({ campaign: campaign._id, status: 'Converted' }),
      ]);
      report.push({
        campaign: campaign.name,
        campaignId: campaign._id,
        leadCount: leads.length,
        callsMade: calls,
        conversions: converted,
        successRate: leads.length > 0 ? ((converted / leads.length) * 100).toFixed(1) : 0,
      });
    }

    res.json(report);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getRevenueReport = async (req, res) => {
  try {
    const filter = buildDateFilter(req.query);
    const quotations = await Quotation.find({
      ...filter,
      status: { $in: ['Accepted', 'Approved'] },
    }).populate('leadId', 'name leadId');

    const total = quotations.reduce((sum, q) => sum + (q.amount || 0), 0);
    res.json({ quotations, total });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getCallDurationReport = async (req, res) => {
  try {
    const filter = buildDateFilter(req.query);
    const calls = await Call.find(filter)
      .populate('agentId', 'name empId')
      .select('duration outcome agentId createdAt');

    const byAgent = {};
    calls.forEach((c) => {
      const id = c.agentId?._id?.toString() || 'unknown';
      if (!byAgent[id]) {
        byAgent[id] = { name: c.agentId?.name, totalDuration: 0, callCount: 0 };
      }
      byAgent[id].totalDuration += c.duration || 0;
      byAgent[id].callCount += 1;
    });

    res.json({ calls, byAgent: Object.values(byAgent) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getAgentPerformanceReport = async (req, res) => {
  try {
    const filter = buildDateFilter(req.query);
    const calls = await Call.find(filter).populate('agentId', 'name empId');

    const byAgent = {};
    calls.forEach((c) => {
      const id = c.agentId?._id?.toString();
      if (!id) return;
      if (!byAgent[id]) {
        byAgent[id] = { name: c.agentId.name, empId: c.agentId.empId, calls: 0, connected: 0, totalDuration: 0 };
      }
      byAgent[id].calls += 1;
      if (c.outcome === 'Connected') byAgent[id].connected += 1;
      byAgent[id].totalDuration += c.duration || 0;
    });

    const report = Object.values(byAgent).map((a) => ({
      ...a,
      connectRate: a.calls > 0 ? ((a.connected / a.calls) * 100).toFixed(1) : 0,
      avgDuration: a.calls > 0 ? Math.round(a.totalDuration / a.calls) : 0,
    }));

    res.json(report);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
