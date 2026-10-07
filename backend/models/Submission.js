const mongoose = require('mongoose');

const SUBMISSION_STATUS = {
  IN_PROGRESS: 'IN_PROGRESS',
  SUBMITTED: 'SUBMITTED',
  DISQUALIFIED: 'DISQUALIFIED',
  CANCELLED: 'CANCELLED',
};

const AUTO_SUBMIT_REASONS = {
  MANUAL: 'MANUAL',
  TIME_EXPIRED: 'TIME_EXPIRED',
  MAX_BLUR_REACHED: 'MAX_BLUR_REACHED',
  TECHNICAL_FRAUD: 'TECHNICAL_FRAUD',
};

const VIOLATION_TYPES = {
  BLUR: 'BLUR',
  EXIT_FULLSCREEN: 'EXIT_FULLSCREEN',
  FACE_NOT_FOUND: 'FACE_NOT_FOUND',
  MULTIPLE_FACES: 'MULTIPLE_FACES',
  WRONG_FACE: 'WRONG_FACE',
  HEARTBEAT_LOST: 'HEARTBEAT_LOST',
  TECHNICAL_FRAUD: 'TECHNICAL_FRAUD',
  OTHER: 'OTHER',
};

const studentAnswerSchema = new mongoose.Schema(
  {
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    selectedAnswer: {
      type: String,
      trim: true,
      default: null,
    },
    timestamp: {
      type: Date,
      required: true,
      default: Date.now,
    },
    isAccepted: {
      type: Boolean,
      default: true,
    },
    isCorrect: {
      type: Boolean,
      default: false,
    },
    earnedPoints: {
      type: Number,
      default: 0,
    },
  },
  { _id: false }
);

const offlineSessionSchema = new mongoose.Schema(
  {
    offlineStart: {
      type: Date,
      required: true,
    },
    offlineEnd: {
      type: Date,
      default: null,
    },
    offlineLogs: [
      {
        type: String,
      },
    ],
    syncedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const violationLogSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: Object.values(VIOLATION_TYPES),
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    details: {
      type: String,
      default: '',
    },
    snapshotUrl: {
      type: String,
      default: null,
    },
  },
  { _id: true }
);

const submissionSchema = new mongoose.Schema(
  {
    examId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Exam',
      required: true,
      index: true,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class',
      required: true,
      index: true,
    },
    startedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
    serverCloseDeadline: {
      type: Date,
      required: true,
    },
    submittedAt: {
      type: Date,
      default: null,
    },
    isAutoSubmitted: {
      type: Boolean,
      default: false,
    },
    autoSubmitReason: {
      type: String,
      enum: Object.values(AUTO_SUBMIT_REASONS),
      default: AUTO_SUBMIT_REASONS.MANUAL,
    },
    answers: [studentAnswerSchema],
    score: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalScore: {
      type: Number,
      default: 0,
    },
    correctAnswersCount: {
      type: Number,
      default: 0,
    },
    totalQuestions: {
      type: Number,
      default: 0,
    },
    blurViolationCount: {
      type: Number,
      default: 0,
      max: 5,
    },
    faceViolationCount: {
      type: Number,
      default: 0,
    },
    violationLogs: [violationLogSchema],
    lastHeartbeat: {
      type: Date,
      default: Date.now,
    },
    offlineSessions: [offlineSessionSchema],
    technicalFraudDetected: {
      type: Boolean,
      default: false,
    },
    technicalFraudDetails: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      enum: Object.values(SUBMISSION_STATUS),
      default: SUBMISSION_STATUS.IN_PROGRESS,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

submissionSchema.index({ examId: 1, studentId: 1 }, { unique: true });
submissionSchema.index({ classId: 1, examId: 1, status: 1 });
submissionSchema.index({ studentId: 1, createdAt: -1 });

const Submission = mongoose.model('Submission', submissionSchema);

module.exports = {
  Submission,
  SUBMISSION_STATUS,
  AUTO_SUBMIT_REASONS,
  VIOLATION_TYPES,
};
