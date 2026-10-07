const { Exam, CLOSE_BOUNDARY_MODES } = require('../models/Exam');
const {
  Submission,
  SUBMISSION_STATUS,
  AUTO_SUBMIT_REASONS,
  VIOLATION_TYPES,
} = require('../models/Submission');
const { ClassStudent } = require('../models/ClassStudent');
const { ROLES } = require('../models/User');
const { DataIsolationHelper } = require('../helpers/dataIsolationHelper');
const { shuffleOptionsWithPin } = require('../utils/shuffleHelper');

const startExam = async (req, res, next) => {
  try {
    const { examId } = req.body;
    const studentId = req.user._id;

    const exam = await Exam.findById(examId);
    if (!exam || exam.status !== 'PUBLISHED') {
      return res.status(404).json({ success: false, message: 'Bài thi không tồn tại hoặc chưa mở.' });
    }

    const now = new Date();

    if (now < new Date(exam.openTime)) {
      return res.status(400).json({
        success: false,
        message: 'Chưa đến thời gian mở đề thi.',
      });
    }

    if (now >= new Date(exam.closeTime)) {
      return res.status(400).json({
        success: false,
        message: 'Đề thi đã đóng. Không thể tham gia thi.',
      });
    }

    const studentEnrollments = await ClassStudent.find({
      studentId,
      classId: { $in: exam.assignedClasses },
      isActive: true,
    }).lean();

    if (studentEnrollments.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không thuộc lớp được chỉ định làm bài thi này.',
      });
    }

    const enrolledClassId = studentEnrollments[0].classId;

    let submission = await Submission.findOne({ examId, studentId });

    if (submission) {
      if (submission.status !== SUBMISSION_STATUS.IN_PROGRESS) {
        return res.status(400).json({
          success: false,
          message: 'Bạn đã nộp bài thi này rồi.',
          data: { submissionId: submission._id, status: submission.status, score: submission.score },
        });
      }
    } else {
      const startedAt = now;
      const durationMs = exam.duration * 60 * 1000;
      let serverCloseDeadline;

      // Hard-close clamps deadline to closeTime; soft-close grants full duration
      if (exam.closeBoundaryMode === CLOSE_BOUNDARY_MODES.HARD_CLOSE) {
        serverCloseDeadline = new Date(
          Math.min(startedAt.getTime() + durationMs, new Date(exam.closeTime).getTime())
        );
      } else {
        serverCloseDeadline = new Date(startedAt.getTime() + durationMs);
      }

      submission = await Submission.create({
        examId,
        studentId,
        classId: enrolledClassId,
        startedAt,
        serverCloseDeadline,
        totalQuestions: exam.questions.length,
        status: SUBMISSION_STATUS.IN_PROGRESS,
      });
    }

    const clientQuestions = exam.questions.map((q) => {
      let options = q.options.map((opt) => ({
        key: opt.key,
        content: opt.content,
        isPinned: opt.isPinned,
        pinnedPosition: opt.pinnedPosition,
      }));

      if (exam.shuffleOptions) {
        options = shuffleOptionsWithPin(options);
      }

      return {
        _id: q._id,
        questionText: q.questionText,
        options,
        points: q.points,
      };
    });

    return res.status(200).json({
      success: true,
      message: 'Bắt đầu làm bài thi thành công.',
      data: {
        submissionId: submission._id,
        startedAt: submission.startedAt,
        serverCloseDeadline: submission.serverCloseDeadline,
        antiCheatSettings: exam.antiCheatSettings,
        questions: clientQuestions,
        answers: submission.answers,
      },
    });
  } catch (error) {
    next(error);
  }
};

const heartbeat = async (req, res, next) => {
  try {
    const { submissionId } = req.params;
    const submission = await Submission.findOne({
      _id: submissionId,
      studentId: req.user._id,
      status: SUBMISSION_STATUS.IN_PROGRESS,
    });

    if (!submission) {
      return res.status(404).json({ success: false, message: 'Phiên thi không tồn tại hoặc đã kết thúc.' });
    }

    submission.lastHeartbeat = new Date();
    await submission.save();

    return res.status(200).json({ success: true, timestamp: submission.lastHeartbeat });
  } catch (error) {
    next(error);
  }
};

const syncAnswers = async (req, res, next) => {
  try {
    const { submissionId } = req.params;
    const { answers, offlineSession } = req.body;

    const submission = await Submission.findOne({
      _id: submissionId,
      studentId: req.user._id,
      status: SUBMISSION_STATUS.IN_PROGRESS,
    });

    if (!submission) {
      return res.status(400).json({ success: false, message: 'Phiên làm bài không khả dụng.' });
    }

    const deadline = new Date(submission.serverCloseDeadline).getTime();

    if (Array.isArray(answers)) {
      answers.forEach((ans) => {
        const clickTime = new Date(ans.timestamp || Date.now()).getTime();
        // Server-authoritative: reject answers timestamped after server deadline
        const isAccepted = clickTime <= deadline;

        const existingAnsIdx = submission.answers.findIndex(
          (a) => a.questionId.toString() === ans.questionId.toString()
        );

        const newAnsRecord = {
          questionId: ans.questionId,
          selectedAnswer: ans.selectedAnswer,
          timestamp: new Date(ans.timestamp || Date.now()),
          isAccepted,
        };

        if (existingAnsIdx >= 0) {
          submission.answers[existingAnsIdx] = newAnsRecord;
        } else {
          submission.answers.push(newAnsRecord);
        }
      });
    }

    if (offlineSession && offlineSession.offlineStart) {
      submission.offlineSessions.push({
        offlineStart: new Date(offlineSession.offlineStart),
        offlineEnd: offlineSession.offlineEnd ? new Date(offlineSession.offlineEnd) : new Date(),
        offlineLogs: offlineSession.offlineLogs || [],
        syncedAt: new Date(),
      });
    }

    await submission.save();

    return res.status(200).json({
      success: true,
      message: 'Đồng bộ câu trả lời thành công.',
      syncedCount: answers ? answers.length : 0,
    });
  } catch (error) {
    next(error);
  }
};

const logViolation = async (req, res, next) => {
  try {
    const { submissionId } = req.params;
    const { type, details, snapshotUrl } = req.body;

    const submission = await Submission.findOne({
      _id: submissionId,
      studentId: req.user._id,
      status: SUBMISSION_STATUS.IN_PROGRESS,
    });

    if (!submission) {
      return res.status(400).json({ success: false, message: 'Phiên thi không khả dụng.' });
    }

    submission.violationLogs.push({
      type: type || VIOLATION_TYPES.OTHER,
      details: details || '',
      snapshotUrl: snapshotUrl || null,
      timestamp: new Date(),
    });

    let autoSubmitted = false;

    if (type === VIOLATION_TYPES.BLUR || type === VIOLATION_TYPES.EXIT_FULLSCREEN) {
      submission.blurViolationCount += 1;

      if (submission.blurViolationCount >= 5) {
        submission.status = SUBMISSION_STATUS.SUBMITTED;
        submission.isAutoSubmitted = true;
        submission.autoSubmitReason = AUTO_SUBMIT_REASONS.MAX_BLUR_REACHED;
        submission.submittedAt = new Date();
        autoSubmitted = true;
      }
    } else if (
      type === VIOLATION_TYPES.FACE_NOT_FOUND ||
      type === VIOLATION_TYPES.MULTIPLE_FACES ||
      type === VIOLATION_TYPES.WRONG_FACE
    ) {
      submission.faceViolationCount += 1;
    }

    await submission.save();

    const io = req.app.get('io');
    if (io) {
      io.to(`class_${submission.classId}`).emit('student_violation', {
        submissionId: submission._id,
        studentName: req.user.fullName,
        type,
        details,
        blurCount: submission.blurViolationCount,
        faceCount: submission.faceViolationCount,
        autoSubmitted,
      });
    }

    return res.status(200).json({
      success: true,
      blurViolationCount: submission.blurViolationCount,
      faceViolationCount: submission.faceViolationCount,
      autoSubmitted,
      message: autoSubmitted
        ? 'Bạn đã vi phạm thoát toàn màn hình/chuyển tab quá 5 lần. Bài thi đã tự động bị thu và khóa!'
        : 'Đã ghi nhận cảnh báo vi phạm.',
    });
  } catch (error) {
    next(error);
  }
};

const submitExam = async (req, res, next) => {
  try {
    const { submissionId } = req.params;
    const submission = await Submission.findOne({
      _id: submissionId,
      studentId: req.user._id,
    });

    if (!submission) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy bài làm.' });
    }

    if (submission.status === SUBMISSION_STATUS.SUBMITTED) {
      return res.status(200).json({
        success: true,
        message: 'Bài thi đã được nộp trước đó.',
        data: { score: submission.score, correctAnswersCount: submission.correctAnswersCount },
      });
    }

    const exam = await Exam.findById(submission.examId);
    if (!exam) {
      return res.status(404).json({ success: false, message: 'Đề thi không tồn tại.' });
    }

    let totalScore = 0;
    let correctCount = 0;

    exam.questions.forEach((q) => {
      const studentAns = submission.answers.find(
        (a) => a.questionId.toString() === q._id.toString()
      );

      if (studentAns && studentAns.isAccepted) {
        if (studentAns.selectedAnswer === q.correctAnswer) {
          studentAns.isCorrect = true;
          studentAns.earnedPoints = q.points;
          totalScore += q.points;
          correctCount += 1;
        } else {
          studentAns.isCorrect = false;
          studentAns.earnedPoints = 0;
        }
      }
    });

    submission.score = totalScore;
    submission.totalScore = exam.totalScore;
    submission.correctAnswersCount = correctCount;
    submission.totalQuestions = exam.questions.length;
    submission.submittedAt = new Date();
    submission.status = SUBMISSION_STATUS.SUBMITTED;

    await submission.save();

    return res.status(200).json({
      success: true,
      message: 'Nộp bài thi thành công!',
      data: {
        score: submission.score,
        totalScore: submission.totalScore,
        correctAnswersCount: submission.correctAnswersCount,
        totalQuestions: submission.totalQuestions,
        submittedAt: submission.submittedAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

const getMySubmissions = async (req, res, next) => {
  try {
    const submissions = await Submission.find({ studentId: req.user._id })
      .populate('examId', 'title subject grade openTime duration')
      .populate('classId', 'name code')
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      count: submissions.length,
      data: submissions,
    });
  } catch (error) {
    next(error);
  }
};

const getExamSubmissionsForTeacher = async (req, res, next) => {
  try {
    const { examId } = req.params;

    const accessibleClassIds = await DataIsolationHelper.getTeacherAccessibleClassIds(req.user._id);

    const filter = {
      examId,
      ...(req.user.role === ROLES.TEACHER ? { classId: { $in: accessibleClassIds } } : {}),
    };

    const submissions = await Submission.find(filter)
      .populate('studentId', 'fullName username studentCode email')
      .populate('classId', 'name code')
      .sort({ score: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      count: submissions.length,
      data: submissions,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  startExam,
  heartbeat,
  syncAnswers,
  logViolation,
  submitExam,
  getMySubmissions,
  getExamSubmissionsForTeacher,
};
