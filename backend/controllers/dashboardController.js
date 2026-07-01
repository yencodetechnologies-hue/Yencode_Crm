const Lead = require('../models/leadModel');
const Call = require('../models/callModel');
const FollowUp = require('../models/followUpModel');
const Activity = require('../models/activityModel');
const Quotation = require('../models/quotationmodel');
const Employee = require('../models/employeeSchema');
const { normalizeRole } = require('../utils/jwt');

const getTodayRange = () => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  return { start, end };
};

exports.getDashboardMetrics = async (req, res) => {
  try {
    const { start, end } = getTodayRange();
    const role = normalizeRole(req.user?.role);
    const leadFilter = role === 'Telecaller' ? { assignedTo: req.user.id } : {};
    const callFilter = role === 'Telecaller' ? { agentId: req.user.id } : {};
    const fuFilter = role === 'Telecaller' ? { agentId: req.user.id } : {};

    const [
      totalLeads,
      newLeads,
      assignedLeads,
      convertedLeads,
      lostLeads,
      todaysCalls,
      connectedCalls,
      followUpsToday,
      revenueResult,
      recentActivities,
      agentPerformance,
    ] = await Promise.all([
      Lead.countDocuments(leadFilter),
      Lead.countDocuments({ ...leadFilter, status: 'New' }),
      Lead.countDocuments({ ...leadFilter, assignedTo: { $ne: null } }),
      Lead.countDocuments({ ...leadFilter, status: 'Converted' }),
      Lead.countDocuments({ ...leadFilter, status: 'Lost' }),
      Call.countDocuments({ ...callFilter, createdAt: { $gte: start, $lte: end } }),
      Call.countDocuments({ ...callFilter, outcome: 'Connected', createdAt: { $gte: start, $lte: end } }),
      FollowUp.countDocuments({ ...fuFilter, date: { $gte: start, $lte: end }, status: 'Pending' }),
      Quotation.aggregate([
        { $match: { status: { $in: ['Accepted', 'Approved'] } } },
        { $group: { _id: null, total: { $sum: { $ifNull: ['$amount', 0] } } } },
      ]),
      Activity.find()
        .populate('leadId', 'name leadId')
        .populate('performedBy', 'name empId')
        .sort({ createdAt: -1 })
        .limit(10),
      getAgentPerformance(start, end),
    ]);

    res.json({
      totalLeads,
      newLeads,
      assignedLeads,
      todaysCalls,
      connectedCalls,
      followUpsToday,
      convertedLeads,
      lostLeads,
      revenue: revenueResult[0]?.total || 0,
      recentActivities,
      agentPerformance,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

async function getAgentPerformance(start, end) {
  const agents = await Employee.find({ status: 'Active' }).select('name empId _id');
  const performance = [];

  for (const agent of agents) {
    const [calls, connected, conversions] = await Promise.all([
      Call.countDocuments({ agentId: agent._id, createdAt: { $gte: start, $lte: end } }),
      Call.countDocuments({ agentId: agent._id, outcome: 'Connected', createdAt: { $gte: start, $lte: end } }),
      Lead.countDocuments({ assignedTo: agent._id, status: 'Converted' }),
    ]);
    performance.push({
      agentId: agent._id,
      name: agent.name,
      empId: agent.empId,
      calls,
      connected,
      connectRate: calls > 0 ? ((connected / calls) * 100).toFixed(1) : 0,
      conversions,
    });
  }

  return performance;
}
