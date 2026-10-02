const bcrypt = require('bcryptjs');
const UserModel = require('../models/userModel');
const { generateToken } = require('../utils/jwt');

const AuthController = {
  // POST /api/auth/register
  async register(req, res) {
    try {
      const { name, email, password } = req.body;

      // Check if email already exists
      const emailExists = await UserModel.emailExists(email);
      if (emailExists) {
        return res.status(409).json({
          success: false,
          message: 'Email này đã được sử dụng. Vui lòng dùng email khác.',
        });
      }

      // Hash password
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // Create user
      const userId = await UserModel.create({
        name,
        email,
        password: hashedPassword,
      });

      // Generate token
      const token = generateToken(userId);

      // Get user without password
      const user = await UserModel.findById(userId);

      return res.status(201).json({
        success: true,
        message: 'Đăng ký thành công!',
        data: { user, token },
      });
    } catch (error) {
      console.error('Register error:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi server. Vui lòng thử lại sau.',
      });
    }
  },

  // POST /api/auth/login
  async login(req, res) {
    try {
      const { email, password } = req.body;

      // Find user by email
      const user = await UserModel.findByEmail(email);
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Email hoặc mật khẩu không đúng.',
        });
      }

      // Compare password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: 'Email hoặc mật khẩu không đúng.',
        });
      }

      // Generate token
      const token = generateToken(user.id);

      // Return user without password
      const { password: _, ...userWithoutPassword } = user;

      return res.status(200).json({
        success: true,
        message: 'Đăng nhập thành công!',
        data: { user: userWithoutPassword, token },
      });
    } catch (error) {
      console.error('Login error:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi server. Vui lòng thử lại sau.',
      });
    }
  },

  // GET /api/auth/me
  async getMe(req, res) {
    try {
      return res.status(200).json({
        success: true,
        data: { user: req.user },
      });
    } catch (error) {
      console.error('GetMe error:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi server. Vui lòng thử lại sau.',
      });
    }
  },

  // PUT /api/auth/profile
  async updateProfile(req, res) {
    try {
      const userId = req.user.id;
      const { name } = req.body;

      if (!name || name.trim().length < 2) {
        return res.status(400).json({
          success: false,
          message: 'Họ tên phải có ít nhất 2 ký tự.',
        });
      }

      const updatedUser = await UserModel.updateName(userId, name.trim());

      return res.status(200).json({
        success: true,
        message: 'Cập nhật thông tin thành công!',
        data: { user: updatedUser },
      });
    } catch (error) {
      console.error('updateProfile error:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi server khi cập nhật thông tin.',
      });
    }
  },

  // PUT /api/auth/change-password
  async changePassword(req, res) {
    try {
      const userId = req.user.id;
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({
          success: false,
          message: 'Vui lòng nhập mật khẩu hiện tại và mật khẩu mới.',
        });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'Mật khẩu mới phải có ít nhất 6 ký tự.',
        });
      }

      // Check current password
      const user = await UserModel.findByIdWithPassword(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy tài khoản người dùng.',
        });
      }

      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return res.status(400).json({
          success: false,
          message: 'Mật khẩu hiện tại không chính xác.',
        });
      }

      // Hash new password and save
      const hashedPassword = await bcrypt.hash(newPassword, 12);
      await UserModel.updatePassword(userId, hashedPassword);

      return res.status(200).json({
        success: true,
        message: 'Đổi mật khẩu thành công!',
      });
    } catch (error) {
      console.error('changePassword error:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi server khi đổi mật khẩu.',
      });
    }
  },
};

module.exports = AuthController;
