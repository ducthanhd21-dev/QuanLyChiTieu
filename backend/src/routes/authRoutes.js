const express = require('express');
const { body } = require('express-validator');
const AuthController = require('../controllers/authController');
const authMiddleware = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

// POST /api/auth/register
router.post(
  '/register',
  [
    body('name')
      .trim()
      .notEmpty().withMessage('Họ tên không được để trống.')
      .isLength({ min: 2 }).withMessage('Họ tên phải có ít nhất 2 ký tự.'),
    body('email')
      .trim()
      .notEmpty().withMessage('Email không được để trống.')
      .isEmail().withMessage('Email không hợp lệ.'),
    body('password')
      .notEmpty().withMessage('Mật khẩu không được để trống.')
      .isLength({ min: 6 }).withMessage('Mật khẩu phải có ít nhất 6 ký tự.'),
    body('confirmPassword')
      .notEmpty().withMessage('Xác nhận mật khẩu không được để trống.')
      .custom((value, { req }) => {
        if (value !== req.body.password) {
          throw new Error('Mật khẩu xác nhận không khớp.');
        }
        return true;
      }),
  ],
  validate,
  AuthController.register
);

// POST /api/auth/login
router.post(
  '/login',
  [
    body('email')
      .trim()
      .notEmpty().withMessage('Email không được để trống.')
      .isEmail().withMessage('Email không hợp lệ.'),
    body('password')
      .notEmpty().withMessage('Mật khẩu không được để trống.'),
  ],
  validate,
  AuthController.login
);

// GET /api/auth/me
router.get('/me', authMiddleware, AuthController.getMe);

// PUT /api/auth/profile
router.put('/profile', authMiddleware, AuthController.updateProfile);

// PUT /api/auth/change-password
router.put('/change-password', authMiddleware, AuthController.changePassword);

module.exports = router;
