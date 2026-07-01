const express = require('express');
const {
  createCampaign,
  getCampaigns,
  getCampaignById,
  updateCampaign,
  deleteCampaign,
  assignAgents,
  getCampaignStats,
} = require('../controllers/campaignController');

const router = express.Router();

router.post('/', createCampaign);
router.get('/', getCampaigns);
router.get('/:id/stats', getCampaignStats);
router.get('/:id', getCampaignById);
router.put('/:id', updateCampaign);
router.delete('/:id', deleteCampaign);
router.post('/:id/assign-agents', assignAgents);

module.exports = router;
