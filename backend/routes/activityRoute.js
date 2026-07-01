const express = require('express');
const {
  getActivitiesByLead,
  getRecentActivities,
  createNote,
} = require('../controllers/activityController');

const router = express.Router();

router.get('/lead/:leadId', getActivitiesByLead);
router.get('/recent', getRecentActivities);
router.post('/note', createNote);

module.exports = router;
