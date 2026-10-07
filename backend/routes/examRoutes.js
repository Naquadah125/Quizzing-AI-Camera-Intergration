const express = require('express');
const router = express.Router();
const multer = require('multer');
const {
  createExam,
  previewImportExam,
  getExams,
  getExamById,
} = require('../controllers/examController');
const { authenticate, authorize } = require('../middleware/auth');
const { ROLES } = require('../models/User');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

router.use(authenticate);

router.get('/', getExams);
router.get('/:id', getExamById);
router.post('/', authorize(ROLES.ADMIN, ROLES.TEACHER), createExam);
router.post(
  '/preview-import',
  authorize(ROLES.ADMIN, ROLES.TEACHER),
  upload.single('file'),
  previewImportExam
);

module.exports = router;
