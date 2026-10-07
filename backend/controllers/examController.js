const { Exam, CLOSE_BOUNDARY_MODES, EXAM_STATUS } = require('../models/Exam');
const { Class } = require('../models/Class');
const { ROLES } = require('../models/User');
const { DataIsolationHelper } = require('../helpers/dataIsolationHelper');
const { parseExamFile } = require('../utils/examImporter');

const createExam = async (req, res, next) => {
  try {
    const {
      title,
      description,
      subject,
      grade,
      assignedClasses,
      questions,
      shuffleOptions = true,
      shuffleQuestions = false,
      openTime,
      closeTime,
      duration,
      closeBoundaryMode = CLOSE_BOUNDARY_MODES.HARD_CLOSE,
      antiCheatSettings,
      status = EXAM_STATUS.PUBLISHED,
    } = req.body;

    if (!title || !subject || !openTime || !closeTime || !duration) {
      return res.status(400).json({
        success: false,
        message: 'Tiêu đề, môn học, thời gian mở, đóng và thời lượng làm bài là bắt buộc.',
      });
    }

    if (!questions || !Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Đề thi phải có ít nhất 1 câu hỏi trắc nghiệm.',
      });
    }

    if (req.user.role === ROLES.TEACHER && Array.isArray(assignedClasses) && assignedClasses.length > 0) {
      const accessibleClassIds = await DataIsolationHelper.getTeacherAccessibleClassIds(req.user._id);
      const invalidAssignments = assignedClasses.filter(
        (id) => !accessibleClassIds.includes(id.toString())
      );
      if (invalidAssignments.length > 0) {
        return res.status(403).json({
          success: false,
          message: 'Bạn không có quyền giao đề thi cho một số lớp đã chọn.',
        });
      }
    }

    const exam = await Exam.create({
      title: title.trim(),
      description: description || '',
      subject: subject.trim(),
      grade: grade || null,
      createdBy: req.user._id,
      assignedClasses: assignedClasses || [],
      questions,
      shuffleOptions,
      shuffleQuestions,
      openTime: new Date(openTime),
      closeTime: new Date(closeTime),
      duration: parseInt(duration, 10),
      closeBoundaryMode,
      antiCheatSettings: {
        ...antiCheatSettings,
        testOverrideToken: req.body.testOverrideToken || null,
      },
      status,
    });

    return res.status(201).json({
      success: true,
      message: 'Tạo bài thi thành công.',
      data: exam,
    });
  } catch (error) {
    next(error);
  }
};

const previewImportExam = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng upload file đề thi (.csv hoặc .xlsx).',
      });
    }

    const result = parseExamFile(req.file.buffer, req.file.originalname);

    return res.status(200).json({
      success: true,
      message: 'Phân tích file thành công.',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const getExams = async (req, res, next) => {
  try {
    const scopeFilter = await DataIsolationHelper.getExamScopeFilter(req.user);
    const exams = await Exam.find(scopeFilter)
      .select('-questions.correctAnswer -questions.explanation')
      .populate('createdBy', 'fullName username')
      .populate('assignedClasses', 'name code grade')
      .sort({ openTime: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      count: exams.length,
      data: exams,
    });
  } catch (error) {
    next(error);
  }
};

const getExamById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const exam = await Exam.findById(id)
      .populate('assignedClasses', 'name code')
      .populate('createdBy', 'fullName')
      .lean();

    if (!exam) {
      return res.status(404).json({ success: false, message: 'Đề thi không tồn tại.' });
    }

    if (req.user.role === ROLES.STUDENT) {
      exam.questions = exam.questions.map((q) => {
        const { correctAnswer, explanation, ...rest } = q;
        return rest;
      });
    }

    return res.status(200).json({
      success: true,
      data: exam,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createExam,
  previewImportExam,
  getExams,
  getExamById,
};
