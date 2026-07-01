const express = require('express');
const {
  getDailyCallReport,
  getLeadConversionReport,
  getFollowUpReport,
  getMissedCallsReport,
  getCampaignPerformanceReport,
  getRevenueReport,
  getCallDurationReport,
  getAgentPerformanceReport,
} = require('../controllers/reportController');

const router = express.Router();

router.get('/daily-calls', getDailyCallReport);
router.get('/monthly-calls', getDailyCallReport);
router.get('/lead-conversion', getLeadConversionReport);
router.get('/follow-ups', getFollowUpReport);
router.get('/missed-calls', getMissedCallsReport);
router.get('/campaign-performance', getCampaignPerformanceReport);
router.get('/revenue', getRevenueReport);
router.get('/call-duration', getCallDurationReport);
router.get('/agent-performance', getAgentPerformanceReport);

module.exports = router;
