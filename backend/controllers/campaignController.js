const Campaign = require('../models/campaignModel');
const Lead = require('../models/leadModel');
const Call = require('../models/callModel');

exports.createCampaign = async (req, res) => {
  try {
    const campaign = new Campaign({
      ...req.body,
      createdBy: req.user?.id,
    });
    await campaign.save();
    res.status(201).json({ message: 'Campaign created', campaign });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getCampaigns = async (req, res) => {
  try {
    const campaigns = await Campaign.find()
      .populate('assignedAgents', 'name empId')
      .sort({ createdAt: -1 });

    const withCounts = await Promise.all(
      campaigns.map(async (c) => {
        const leadCount = await Lead.countDocuments({ campaign: c._id });
        return { ...c.toObject(), leadCount };
      })
    );

    res.json(withCounts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getCampaignById = async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id)
      .populate('assignedAgents', 'name empId email');
    if (!campaign) return res.status(404).json({ message: 'Campaign not found' });

    const leadCount = await Lead.countDocuments({ campaign: campaign._id });
    res.json({ ...campaign.toObject(), leadCount });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateCampaign = async (req, res) => {
  try {
    const campaign = await Campaign.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!campaign) return res.status(404).json({ message: 'Campaign not found' });
    res.json({ message: 'Campaign updated', campaign });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteCampaign = async (req, res) => {
  try {
    const campaign = await Campaign.findByIdAndDelete(req.params.id);
    if (!campaign) return res.status(404).json({ message: 'Campaign not found' });
    res.json({ message: 'Campaign deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.assignAgents = async (req, res) => {
  try {
    const { agentIds } = req.body;
    const campaign = await Campaign.findByIdAndUpdate(
      req.params.id,
      { assignedAgents: agentIds },
      { new: true }
    ).populate('assignedAgents', 'name empId');
    if (!campaign) return res.status(404).json({ message: 'Campaign not found' });
    res.json({ message: 'Agents assigned', campaign });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getCampaignStats = async (req, res) => {
  try {
    const campaignId = req.params.id;
    const leads = await Lead.find({ campaign: campaignId }).select('_id status');
    const leadIds = leads.map((l) => l._id);

    const [calls, converted, lost] = await Promise.all([
      Call.countDocuments({ leadId: { $in: leadIds } }),
      Lead.countDocuments({ campaign: campaignId, status: 'Converted' }),
      Lead.countDocuments({ campaign: campaignId, status: 'Lost' }),
    ]);

    const connected = await Call.countDocuments({
      leadId: { $in: leadIds },
      outcome: 'Connected',
    });

    const successRate = leads.length > 0 ? ((converted / leads.length) * 100).toFixed(1) : 0;

    res.json({
      leadCount: leads.length,
      callsMade: calls,
      connectedCalls: connected,
      conversions: converted,
      lostLeads: lost,
      successRate: parseFloat(successRate),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
