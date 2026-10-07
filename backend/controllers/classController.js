const { Class } = require('../models/Class');
const { ClassTeacher } = require('../models/ClassTeacher');
const { ClassStudent } = require('../models/ClassStudent');
const { User, ROLES } = require('../models/User');
const { DataIsolationHelper } = require('../helpers/dataIsolationHelper');

const createClass = async (req, res, next) => {
  try {
    const { name, code, grade, academicYear, description } = req.body;

    if (!name || !code || !grade) {
      return res.status(400).json({
        success: false,
        message: 'Tên lớp, mã lớp và khối là các trường bắt buộc.',
      });
    }

    const newClass = await Class.create({
      name: name.trim(),
      code: code.trim().toUpperCase(),
      grade: grade.trim(),
      academicYear: academicYear || '2026-2027',
      description: description || '',
      createdBy: req.user._id,
    });

    if (req.user.role === ROLES.TEACHER) {
      await ClassTeacher.create({
        classId: newClass._id,
        teacherId: req.user._id,
        isPrimary: true,
        assignedBy: req.user._id,
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Tạo lớp học thành công.',
      data: newClass,
    });
  } catch (error) {
    next(error);
  }
};

const getClasses = async (req, res, next) => {
  try {
    const scopeFilter = await DataIsolationHelper.getClassScopeFilter(req.user);
    const classes = await Class.find(scopeFilter)
      .populate('createdBy', 'fullName username role')
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      count: classes.length,
      data: classes,
    });
  } catch (error) {
    next(error);
  }
};

const assignTeacherToClass = async (req, res, next) => {
  try {
    const { classId } = req.params;
    const { teacherId, isPrimary = false } = req.body;

    const teacher = await User.findOne({ _id: teacherId, role: ROLES.TEACHER });
    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy Giáo viên với ID này.',
      });
    }

    const classItem = await Class.findById(classId);
    if (!classItem) {
      return res.status(404).json({ success: false, message: 'Lớp học không tồn tại.' });
    }

    const assignment = await ClassTeacher.findOneAndUpdate(
      { classId, teacherId },
      { classId, teacherId, isPrimary, assignedBy: req.user._id },
      { upsert: true, new: true }
    );

    return res.status(200).json({
      success: true,
      message: `Đã gán giáo viên ${teacher.fullName} vào lớp ${classItem.name}.`,
      data: assignment,
    });
  } catch (error) {
    next(error);
  }
};

const addStudentsToClass = async (req, res, next) => {
  try {
    const { classId } = req.params;
    const { studentIds } = req.body;

    if (!Array.isArray(studentIds) || studentIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp danh sách ID học sinh (mảng studentIds).',
      });
    }

    if (req.user.role === ROLES.TEACHER) {
      const accessibleClassIds = await DataIsolationHelper.getTeacherAccessibleClassIds(req.user._id);
      if (!accessibleClassIds.includes(classId.toString())) {
        return res.status(403).json({
          success: false,
          message: 'Bạn không có quyền quản lý lớp học này.',
        });
      }
    }

    const records = studentIds.map((studentId) => ({
      classId,
      studentId,
      assignedBy: req.user._id,
    }));

    const result = await ClassStudent.bulkWrite(
      records.map((rec) => ({
        updateOne: {
          filter: { classId: rec.classId, studentId: rec.studentId },
          update: { $setOnInsert: rec },
          upsert: true,
        },
      }))
    );

    return res.status(200).json({
      success: true,
      message: `Đã cập nhật danh sách học sinh vào lớp.`,
      result,
    });
  } catch (error) {
    next(error);
  }
};

const getClassStudents = async (req, res, next) => {
  try {
    const { classId } = req.params;

    if (req.user.role === ROLES.TEACHER) {
      const accessibleClassIds = await DataIsolationHelper.getTeacherAccessibleClassIds(req.user._id);
      if (!accessibleClassIds.includes(classId.toString())) {
        return res.status(403).json({
          success: false,
          message: 'Bạn không có quyền xem học sinh của lớp học này.',
        });
      }
    }

    const students = await ClassStudent.find({ classId, isActive: true })
      .populate('studentId', 'fullName username email studentCode avatar')
      .lean();

    return res.status(200).json({
      success: true,
      count: students.length,
      data: students.map((s) => s.studentId),
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createClass,
  getClasses,
  assignTeacherToClass,
  addStudentsToClass,
  getClassStudents,
};
