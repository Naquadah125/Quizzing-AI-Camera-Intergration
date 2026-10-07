const mongoose = require('mongoose');

const classSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Tên lớp là bắt buộc'],
      trim: true,
    },
    code: {
      type: String,
      required: [true, 'Mã lớp là bắt buộc'],
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    grade: {
      type: String,
      required: [true, 'Khối là bắt buộc (ví dụ: Khối 10, 11, 12)'],
      trim: true,
      index: true,
    },
    academicYear: {
      type: String,
      default: '2026-2027',
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

classSchema.virtual('assignedTeachers', {
  ref: 'ClassTeacher',
  localField: '_id',
  foreignField: 'classId',
});

classSchema.virtual('enrolledStudents', {
  ref: 'ClassStudent',
  localField: '_id',
  foreignField: 'classId',
});

classSchema.index({ grade: 1, isActive: 1 });
classSchema.index({ createdBy: 1, isActive: 1 });

const Class = mongoose.model('Class', classSchema);

module.exports = {
  Class,
};
