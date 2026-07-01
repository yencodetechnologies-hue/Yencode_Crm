const express = require('express');
const {
  createCall,
  getCallsByLead,
  getCallsByAgent,
  getTodayCalls,
  getAllCalls,
} = require('../controllers/callController');

const router = express.Router();

router.post('/', createCall);
router.get('/today', getTodayCalls);
router.get('/lead/:leadId', getCallsByLead);
router.get('/agent/:agentId', getCallsByAgent);
router.get('/', getAllCalls);

module.exports = router;
