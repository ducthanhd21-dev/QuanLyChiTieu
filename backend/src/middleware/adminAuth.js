const adminAuth = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Vui lòng đăng nhập để tiếp tục.',
    });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Truy cập bị từ chối. Chỉ tài khoản Quản trị viên (Admin) mới có quyền truy cập.',
    });
  }

  next();
};

module.exports = adminAuth;
