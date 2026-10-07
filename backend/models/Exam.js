const mongoose = require('mongoose');

const CLOSE_BOUNDARY_MODES = {
  HARD_CLOSE: 'hard_close',
  SOFT_CLOSE: 'soft_close',
};

const EXAM_STATUS = {
  DRAFT: 'DRAFT',
  PUBLISHED: 'PUBLISHED',
  CLOSED: 'CLOSED',
  ARCHIVED: 'ARCHIVED',
};

const optionSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      trim: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
    isPinned: {
      type: Boolean,
      default: false,
    },
    pinnedPosition: {
      type: Number,
      default: null,
    },
  },
  { _id: true }
);

const questionSchema = new mongoose.Schema(
  {
    questionText: {
      type: String,
      required: [true, 'Nội dung câu hỏi không được để trống'],
      trim: true,
    },
    options: {
      type: [optionSchema],
      validate: [
        (val) => val.length === 4,
        'Mỗi câu hỏi trắc nghiệm phải có chính xác 4 lựa chọn (A, B, C, D)',
      ],
      required: true,
    },
    correctAnswer: {
      type: String,
      required: [true, 'Phải chỉ định 1 đáp án đúng (Single Choice)'],
      trim: true,
    },
    explanation: {
      type: String,
      default: '',
    },
    points: {
      type: Number,
      default: 1,
      min: [0, 'Điểm câu hỏi không thể âm'],
    },
  },
  { _id: true }
);

const examSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Tiêu đề bài thi là bắt buộc'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    subject: {
      type: String,
      required: [true, 'Môn học là bắt buộc'],
      trim: true,
    },
    grade: {
      type: String,
      trim: true,
      default: null,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    assignedClasses: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Class',
        index: true,
      },
    ],
    questions: {
      type: [questionSchema],
      validate: [(val) => val.length > 0, 'Bài thi phải có ít nhất 1 câu hỏi'],
    },
    totalQuestions: {
      type: Number,
      default: function () {
        return this.questions ? this.questions.length : 0;
      },
    },
    totalScore: {
      type: Number,
      default: function () {
        return this.questions
          ? this.questions.reduce((sum, q) => sum + (q.points || 0), 0)
          : 0;
      },
    },
    shuffleOptions: {
      type: Boolean,
      default: true,
    },
    shuffleQuestions: {
      type: Boolean,
      default: false,
    },
    openTime: {
      type: Date,
      required: [true, 'Thời gian mở đề là bắt buộc'],
      index: true,
    },
    closeTime: {
      type: Date,
      required: [true, 'Thời gian đóng đề là bắt buộc'],
      index: true,
    },
    duration: {
      type: Number,
      required: [true, 'Thời lượng làm bài (phút) là bắt buộc'],
      min: [1, 'Thời lượng tối thiểu 1 phút'],
    },
    closeBoundaryMode: {
      type: String,
      enum: Object.values(CLOSE_BOUNDARY_MODES),
      default: CLOSE_BOUNDARY_MODES.HARD_CLOSE,
      required: true,
    },
    antiCheatSettings: {
      requireCamera: {
        type: Boolean,
        default: true,
      },
      requireFullscreen: {
        type: Boolean,
        default: true,
      },
      disableRightClick: {
        type: Boolean,
        default: true,
      },
      maxBlurAttempts: {
        type: Number,
        default: 5,
      },
      faceScanIntervalSeconds: {
        type: Number,
        default: 3,
      },
      faceScanToleranceFails: {
        type: Number,
        default: 3,
      },
      heartbeatIntervalSeconds: {
        type: Number,
        default: 5,
      },
      testOverrideToken: {
        type: String,
        default: null,
      },
    },
    status: {
      type: String,
      enum: Object.values(EXAM_STATUS),
      default: EXAM_STATUS.DRAFT,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

examSchema.index({ createdBy: 1, status: 1 });
examSchema.index({ assignedClasses: 1, status: 1, openTime: 1, closeTime: 1 });

const Exam = mongoose.model('Exam', examSchema);

module.exports = {
  Exam,
  CLOSE_BOUNDARY_MODES,
  EXAM_STATUS,
};
