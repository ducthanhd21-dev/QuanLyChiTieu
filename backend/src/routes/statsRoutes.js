const express = require('express');
const StatsController = require('../controllers/statsController');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

// GET /api/stats/monthly
router.get('/monthly', StatsController.getMonthly);

// GET /api/stats/category?month=YYYY-MM
router.get('/category', StatsController.getByCategory);

module.exports = router;
