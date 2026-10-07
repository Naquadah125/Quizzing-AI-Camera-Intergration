const express = require('express');
const router = express.Router();
const {
  startExam,
  heartbeat,
  syncAnswers,
  logViolation,
  submitExam,
  getMySubmissions,
  getExamSubmissionsForTeacher,
} = require('../controllers/submissionController');
const { authenticate, authorize } = require('../middleware/auth');
const { ROLES } = require('../models/User');

router.use(authenticate);

router.post('/start', authorize(ROLES.STUDENT), startExam);
router.post('/:submissionId/heartbeat', authorize(ROLES.STUDENT), heartbeat);
router.post('/:submissionId/sync-answers', authorize(ROLES.STUDENT), syncAnswers);
router.post('/:submissionId/log-violation', authorize(ROLES.STUDENT), logViolation);
router.post('/:submissionId/submit', authorize(ROLES.STUDENT), submitExam);
router.get('/my-history', authorize(ROLES.STUDENT), getMySubmissions);
router.get('/exam/:examId', authorize(ROLES.ADMIN, ROLES.TEACHER), getExamSubmissionsForTeacher);

module.exports = router;
