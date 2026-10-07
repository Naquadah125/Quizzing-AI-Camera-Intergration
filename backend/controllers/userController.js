const { User, ROLES } = require('../models/User');
const { ClassStudent } = require('../models/ClassStudent');
const { Class } = require('../models/Class');
const { hashPassword } = require('../utils/password');
const { DataIsolationHelper } = require('../helpers/dataIsolationHelper');

const createUser = async (req, res, next) => {
  try {
    const { username, password, fullName, email, role, studentCode } = req.body;

    if (!username || !password || !fullName || !role) {
      return res.status(400).json({
        success: false,
        message: 'Username, password, họ tên và vai trò (role) là bắt buộc.',
      });
    }

    const hashedPassword = await hashPassword(password);
    const newUser = await User.create({
      username: username.toLowerCase().trim(),
      password: hashedPassword,
      fullName: fullName.trim(),
      email: email ? email.trim() : undefined,
      role,
      studentCode: studentCode ? studentCode.trim() : undefined,
      createdBy: req.user._id,
    });

    return res.status(201).json({
      success: true,
      message: `Tạo tài khoản ${role} thành công.`,
      data: {
        id: newUser._id,
        username: newUser.username,
        fullName: newUser.fullName,
        role: newUser.role,
        email: newUser.email,
      },
    });
  } catch (error) {
    next(error);
  }
};

const createStudentByTeacher = async (req, res, next) => {
  try {
    const { username, password, fullName, email, studentCode, classId } = req.body;

    if (!username || !password || !fullName || !classId) {
      return res.status(400).json({
        success: false,
        message: 'Username, password, fullName và classId (lớp cần gán) là bắt buộc.',
      });
    }

    const accessibleClassIds = await DataIsolationHelper.getTeacherAccessibleClassIds(req.user._id);
    if (!accessibleClassIds.includes(classId.toString())) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền quản lý hoặc gán học sinh vào lớp học này.',
      });
    }

    const hashedPassword = await hashPassword(password);

    const newStudent = await User.create({
      username: username.toLowerCase().trim(),
      password: hashedPassword,
      fullName: fullName.trim(),
      email: email ? email.trim() : undefined,
      role: ROLES.STUDENT,
      studentCode: studentCode ? studentCode.trim() : undefined,
      createdBy: req.user._id,
    });

    await ClassStudent.create({
      classId,
      studentId: newStudent._id,
      assignedBy: req.user._id,
    });

    return res.status(201).json({
      success: true,
      message: `Tạo tài khoản học sinh thành công và đã tự động gán vào lớp.`,
      data: {
        id: newStudent._id,
        username: newStudent.username,
        fullName: newStudent.fullName,
        classId,
      },
    });
  } catch (error) {
    next(error);
  }
};

const getMyStudents = async (req, res, next) => {
  try {
    const scopeFilter = await DataIsolationHelper.getStudentScopeFilter(req.user);
    const students = await User.find(scopeFilter)
      .select('fullName username email studentCode avatar createdAt')
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      count: students.length,
      data: students,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createUser,
  createStudentByTeacher,
  getMyStudents,
};
