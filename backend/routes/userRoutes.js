const express = require('express');
const router = express.Router();
const {
  createUser,
  createStudentByTeacher,
  getMyStudents,
} = require('../controllers/userController');
const { authenticate, authorize } = require('../middleware/auth');
const { ROLES } = require('../models/User');

router.use(authenticate);

router.post('/', authorize(ROLES.ADMIN), createUser);
router.post('/students', authorize(ROLES.TEACHER), createStudentByTeacher);
router.get('/my-students', authorize(ROLES.ADMIN, ROLES.TEACHER), getMyStudents);

module.exports = router;
