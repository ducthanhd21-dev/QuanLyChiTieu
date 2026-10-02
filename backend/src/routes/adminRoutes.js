const express = require('express');
const AdminController = require('../controllers/adminController');
const authMiddleware = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');

const router = express.Router();

// All routes require login AND admin role
router.use(authMiddleware);
router.use(adminAuth);

// GET /api/admin/users?month=YYYY-MM
router.get('/users', AdminController.getUsersWithBills);

// GET /api/admin/users/:userId/bills?month=YYYY-MM
router.get('/users/:userId/bills', AdminController.getUserBills);

module.exports = router;
