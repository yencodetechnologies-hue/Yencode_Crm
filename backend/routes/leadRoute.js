const express = require('express');
const {
  createLead,
  getAllLeads,
  getLeadById,
  updateLeadById,
  deleteLeadById,
  updateLeadStatus,
  getTotalLeads,
  bulkAssign,
  checkDuplicates,
  exportLeads,
  importLeads,
} = require('../controllers/leadController');

const router = express.Router();

router.post('/create', createLead);
router.get('/get-all', getAllLeads);
router.get('/getlead/:id', getLeadById);
router.put('/update/:id', updateLeadById);
router.delete('/delete/:id', deleteLeadById);
router.put('/update-status/:id', updateLeadStatus);
router.get('/totalleads', getTotalLeads);
router.put('/bulk-assign', bulkAssign);
router.get('/duplicates', checkDuplicates);
router.get('/export', exportLeads);
router.post('/import', importLeads);

module.exports = router;
