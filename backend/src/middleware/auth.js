const { verifyToken } = require('../utils/jwt');
const UserModel = require('../models/userModel');

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Không có token xác thực. Vui lòng đăng nhập.',
      });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    const user = await UserModel.findById(decoded.id);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Token không hợp lệ. Người dùng không tồn tại.',
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token đã hết hạn. Vui lòng đăng nhập lại.',
      });
    }
    return res.status(401).json({
      success: false,
      message: 'Token không hợp lệ.',
    });
  }
};

module.exports = authMiddleware;
