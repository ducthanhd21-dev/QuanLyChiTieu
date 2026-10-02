const express = require('express');
const BudgetController = require('../controllers/budgetController');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

// GET /api/budget?month=YYYY-MM
router.get('/', BudgetController.getBudget);

// POST /api/budget
router.post('/', BudgetController.setBudget);

// DELETE /api/budget?month=YYYY-MM
router.delete('/', BudgetController.removeBudget);

module.exports = router;
