const express = require('express');
const { body } = require('express-validator');
const BillController = require('../controllers/billController');
const authMiddleware = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

const billValidation = [
  body('title')
    .trim()
    .notEmpty().withMessage('Tên khoản thanh toán không được để trống.')
    .isLength({ max: 255 }).withMessage('Tên khoản thanh toán tối đa 255 ký tự.'),
  body('amount')
    .notEmpty().withMessage('Số tiền không được để trống.')
    .isNumeric().withMessage('Số tiền phải là số.')
    .custom((val) => {
      if (parseFloat(val) < 0) throw new Error('Số tiền không được âm.');
      return true;
    }),
  body('due_date')
    .notEmpty().withMessage('Ngày đến hạn không được để trống.')
    .isDate().withMessage('Ngày đến hạn không hợp lệ (YYYY-MM-DD).'),
  body('category')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('Danh mục tối đa 100 ký tự.'),
  body('note')
    .optional()
    .trim(),
];

// GET /api/bills
router.get('/', BillController.getAll);

// GET /api/bills/alerts (upcoming or overdue bills)
router.get('/alerts', BillController.getAlerts);

// POST /api/bills/copy-from-month
router.post('/copy-from-month', BillController.copyFromMonth);

// GET /api/bills/:id
router.get('/:id', BillController.getOne);

// POST /api/bills
router.post('/', billValidation, validate, BillController.create);

// PUT /api/bills/:id
router.put('/:id', billValidation, validate, BillController.update);

// DELETE /api/bills/:id
router.delete('/:id', BillController.remove);

// PATCH /api/bills/:id/toggle-paid
router.patch('/:id/toggle-paid', BillController.togglePaid);

// PATCH /api/bills/:id/receipt
router.patch('/:id/receipt', BillController.updateReceipt);

module.exports = router;
