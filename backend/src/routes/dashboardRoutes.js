const express = require('express');
const DashboardController = require('../controllers/dashboardController');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

// GET /api/dashboard/summary?month=2026-10
router.get('/summary', DashboardController.getSummary);

module.exports = router;
