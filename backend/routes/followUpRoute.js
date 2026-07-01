const express = require('express');
const {
  createFollowUp,
  getFollowUps,
  getTodayFollowUps,
  getCalendarFollowUps,
  updateFollowUp,
  completeFollowUp,
  deleteFollowUp,
} = require('../controllers/followUpController');

const router = express.Router();

router.post('/', createFollowUp);
router.get('/today', getTodayFollowUps);
router.get('/calendar', getCalendarFollowUps);
router.get('/', getFollowUps);
router.put('/:id', updateFollowUp);
router.patch('/:id/complete', completeFollowUp);
router.delete('/:id', deleteFollowUp);

module.exports = router;
