const FollowUp = require('../models/followUpModel');
const { logActivity } = require('../utils/activityHelper');
const { normalizeRole } = require('../utils/jwt');

exports.createFollowUp = async (req, res) => {
  try {
    const followUp = new FollowUp({
      ...req.body,
      agentId: req.body.agentId || req.user?.id,
    });
    await followUp.save();

    await logActivity({
      leadId: followUp.leadId,
      type: 'follow_up',
      description: 'Follow-up scheduled',
      metadata: { followUpId: followUp._id, date: followUp.date },
      performedBy: req.user?.id,
    });

    res.status(201).json({ message: 'Follow-up created', followUp });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getFollowUps = async (req, res) => {
  try {
    const filter = {};
    const role = normalizeRole(req.user?.role);
    if (role === 'Telecaller') filter.agentId = req.user.id;
    if (req.query.agentId) filter.agentId = req.query.agentId;
    if (req.query.status) filter.status = req.query.status;
    if (req.query.leadId) filter.leadId = req.query.leadId;

    const followUps = await FollowUp.find(filter)
      .populate('leadId', 'name contact leadId status')
      .populate('agentId', 'name empId')
      .sort({ date: 1 });
    res.json(followUps);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getTodayFollowUps = async (req, res) => {
  try {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);

    const filter = { date: { $gte: start, $lte: end }, status: 'Pending' };
    const role = normalizeRole(req.user?.role);
    if (role === 'Telecaller') filter.agentId = req.user.id;

    const followUps = await FollowUp.find(filter)
      .populate('leadId', 'name contact leadId')
      .populate('agentId', 'name empId')
      .sort({ time: 1 });
    res.json(followUps);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getCalendarFollowUps = async (req, res) => {
  try {
    const { year, month } = req.query;
    const y = parseInt(year, 10) || new Date().getFullYear();
    const m = parseInt(month, 10) || new Date().getMonth() + 1;
    const start = new Date(y, m - 1, 1);
    const end = new Date(y, m, 0, 23, 59, 59, 999);

    const filter = { date: { $gte: start, $lte: end } };
    const role = normalizeRole(req.user?.role);
    if (role === 'Telecaller') filter.agentId = req.user.id;

    const followUps = await FollowUp.find(filter)
      .populate('leadId', 'name contact leadId')
      .populate('agentId', 'name empId');
    res.json(followUps);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateFollowUp = async (req, res) => {
  try {
    const followUp = await FollowUp.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!followUp) return res.status(404).json({ message: 'Follow-up not found' });
    res.json({ message: 'Follow-up updated', followUp });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.completeFollowUp = async (req, res) => {
  try {
    const followUp = await FollowUp.findByIdAndUpdate(
      req.params.id,
      { status: 'Completed' },
      { new: true }
    );
    if (!followUp) return res.status(404).json({ message: 'Follow-up not found' });

    await logActivity({
      leadId: followUp.leadId,
      type: 'follow_up',
      description: 'Follow-up completed',
      metadata: { followUpId: followUp._id },
      performedBy: req.user?.id,
    });

    res.json({ message: 'Follow-up completed', followUp });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteFollowUp = async (req, res) => {
  try {
    const followUp = await FollowUp.findByIdAndDelete(req.params.id);
    if (!followUp) return res.status(404).json({ message: 'Follow-up not found' });
    res.json({ message: 'Follow-up deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
