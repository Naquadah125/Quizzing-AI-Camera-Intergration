const { User, ROLES } = require('../models/User');
const { hashPassword, comparePassword } = require('../utils/password');
const { signToken } = require('../utils/jwt');

const login = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp tên đăng nhập và mật khẩu.',
      });
    }

    const user = await User.findOne({ username: username.toLowerCase().trim() }).select('+password');

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Tài khoản không tồn tại hoặc đã bị khóa.',
      });
    }

    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Mật khẩu không chính xác.',
      });
    }

    const token = signToken({ id: user._id, role: user.role });

    return res.status(200).json({
      success: true,
      message: 'Đăng nhập thành công.',
      data: {
        token,
        user: {
          id: user._id,
          username: user.username,
          fullName: user.fullName,
          role: user.role,
          email: user.email,
          studentCode: user.studentCode,
          avatar: user.avatar,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

const getMe = async (req, res, next) => {
  try {
    return res.status(200).json({
      success: true,
      data: {
        user: req.user,
      },
    });
  } catch (error) {
    next(error);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const { fullName, email, avatar, oldPassword, newPassword } = req.body;
    const userId = req.user._id;

    const user = await User.findById(userId).select('+password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng.' });
    }

    if (fullName) user.fullName = fullName.trim();
    if (email) user.email = email.trim();
    if (avatar !== undefined) user.avatar = avatar;

    if (newPassword) {
      if (!oldPassword) {
        return res.status(400).json({
          success: false,
          message: 'Vui lòng nhập mật khẩu hiện tại để đổi mật khẩu mới.',
        });
      }
      const isMatch = await comparePassword(oldPassword, user.password);
      if (!isMatch) {
        return res.status(400).json({
          success: false,
          message: 'Mật khẩu hiện tại không đúng.',
        });
      }
      user.password = await hashPassword(newPassword);
    }

    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Cập nhật thông tin cá nhân thành công.',
      data: {
        user: {
          id: user._id,
          username: user.username,
          fullName: user.fullName,
          email: user.email,
          avatar: user.avatar,
          role: user.role,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

const seedAdmin = async (req, res, next) => {
  try {
    const adminExists = await User.findOne({ role: ROLES.ADMIN });
    if (adminExists) {
      return res.status(400).json({
        success: false,
        message: 'Hệ thống đã có tài khoản Quản trị viên (ADMIN). Không thể tạo thêm qua API này.',
      });
    }

    const { username = 'admin', password = 'adminPassword123', fullName = 'Hệ Thống Quản Trị' } = req.body;
    const hashedPassword = await hashPassword(password);

    const admin = await User.create({
      username: username.toLowerCase().trim(),
      password: hashedPassword,
      fullName: fullName.trim(),
      role: ROLES.ADMIN,
    });

    return res.status(201).json({
      success: true,
      message: 'Khởi tạo tài khoản ADMIN thành công!',
      data: {
        username: admin.username,
        role: admin.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  login,
  getMe,
  updateProfile,
  seedAdmin,
};
