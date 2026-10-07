const mongoose = require('mongoose');

const classTeacherSchema = new mongoose.Schema(
  {
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class',
      required: true,
      index: true,
    },
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    isPrimary: {
      type: Boolean,
      default: false,
    },
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

classTeacherSchema.index({ classId: 1, teacherId: 1 }, { unique: true });

const ClassTeacher = mongoose.model('ClassTeacher', classTeacherSchema);

module.exports = {
  ClassTeacher,
};
