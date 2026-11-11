const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const incomeController = require('../controllers/incomeController');

router.use(authMiddleware);

router.get('/monthly', incomeController.getMonthly);
router.get('/', incomeController.getByMonth);
router.post('/', incomeController.create);
router.put('/:id', incomeController.update);
router.delete('/:id', incomeController.delete);

module.exports = router;
