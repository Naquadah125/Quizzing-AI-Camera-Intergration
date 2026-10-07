const express = require('express');
const router = express.Router();
const {
  createClass,
  getClasses,
  assignTeacherToClass,
  addStudentsToClass,
  getClassStudents,
} = require('../controllers/classController');
const { authenticate, authorize } = require('../middleware/auth');
const { ROLES } = require('../models/User');

router.use(authenticate);

router.get('/', getClasses);
router.post('/', authorize(ROLES.ADMIN, ROLES.TEACHER), createClass);
router.post('/:classId/assign-teacher', authorize(ROLES.ADMIN), assignTeacherToClass);
router.post('/:classId/add-students', authorize(ROLES.ADMIN, ROLES.TEACHER), addStudentsToClass);
router.get('/:classId/students', authorize(ROLES.ADMIN, ROLES.TEACHER), getClassStudents);

module.exports = router;
