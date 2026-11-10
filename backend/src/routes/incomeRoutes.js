const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const incomeController = require('../controllers/incomeController');

router.use(authenticate);

router.get('/', incomeController.getByMonth);
router.post('/', incomeController.create);
router.put('/:id', incomeController.update);
router.delete('/:id', incomeController.delete);

module.exports = router;
