const Activity = require('../models/activityModel');

exports.getActivitiesByLead = async (req, res) => {
  try {
    const activities = await Activity.find({ leadId: req.params.leadId })
      .populate('performedBy', 'name empId')
      .sort({ createdAt: -1 });
    res.json(activities);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getRecentActivities = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 20;
    const activities = await Activity.find()
      .populate('leadId', 'name leadId contact')
      .populate('performedBy', 'name empId')
      .sort({ createdAt: -1 })
      .limit(limit);
    res.json(activities);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createNote = async (req, res) => {
  try {
    const { leadId, description } = req.body;
    const activity = new Activity({
      leadId,
      type: 'note',
      description,
      performedBy: req.user?.id,
    });
    await activity.save();
    res.status(201).json({ message: 'Note added', activity });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
