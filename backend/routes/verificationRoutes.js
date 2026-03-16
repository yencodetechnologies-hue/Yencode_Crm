const express = require('express');
const router = express.Router(); 
const verificationControllers = require("../controllers/verificationControllers");
router.post('/login', verificationControllers.employeeLogin); 
router.post('/adminlogin', verificationControllers.superadminLogin);

module.exports = router;
