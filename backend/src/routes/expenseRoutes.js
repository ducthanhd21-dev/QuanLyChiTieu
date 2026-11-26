const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const expenseController = require('../controllers/expenseController');

router.use(authMiddleware);

router.get('/', expenseController.getByMonth);
router.post('/', expenseController.create);
router.put('/:id', expenseController.update);
router.delete('/:id', expenseController.delete);

module.exports = router;
