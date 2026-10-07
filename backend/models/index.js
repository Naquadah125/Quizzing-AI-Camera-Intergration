const { User, ROLES } = require('./User');
const { Class } = require('./Class');
const { ClassTeacher } = require('./ClassTeacher');
const { ClassStudent } = require('./ClassStudent');
const { Exam, CLOSE_BOUNDARY_MODES, EXAM_STATUS } = require('./Exam');
const {
  Submission,
  SUBMISSION_STATUS,
  AUTO_SUBMIT_REASONS,
  VIOLATION_TYPES,
} = require('./Submission');

module.exports = {
  User,
  ROLES,
  Class,
  ClassTeacher,
  ClassStudent,
  Exam,
  CLOSE_BOUNDARY_MODES,
  EXAM_STATUS,
  Submission,
  SUBMISSION_STATUS,
  AUTO_SUBMIT_REASONS,
  VIOLATION_TYPES,
};
