process.env.NODE_ENV = 'test';
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const mongoose = require('mongoose');
const { connectDB } = require('./config/db');
const { app, server } = require('./server');
const { Submission } = require('./models/Submission');
const http = require('http');

let testResults = [];
let passed = 0;
let failed = 0;
const TEST_PORT = 5055;

function report(testName, isSuccess, details = '') {
  if (isSuccess) {
    passed++;
    console.log(`✅ [PASS] ${testName}`);
  } else {
    failed++;
    console.log(`❌ [FAIL] ${testName} - ${details}`);
  }
  testResults.push({ testName, isSuccess, details });
}

function request(method, pathUrl, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const postData = body ? JSON.stringify(body) : null;
    const options = {
      hostname: '127.0.0.1',
      port: TEST_PORT,
      path: pathUrl,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (postData) {
      options.headers['Content-Length'] = Buffer.byteLength(postData);
    }
    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ status: res.statusCode, body: json });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });

    req.on('error', (e) => reject(e));
    if (postData) req.write(postData);
    req.end();
  });
}

async function runTests() {
  console.log('\n======================================================');
  console.log('🧪 RUNNING COMPREHENSIVE INTEGRATION & DATA ISOLATION TESTS');
  console.log('======================================================\n');

  try {
    console.log('--- 1. Database & Health Check ---');
    await connectDB();
    report('Database Connection to MongoDB Atlas', mongoose.connection.readyState === 1);

    await new Promise((res) => {
      server.listen(TEST_PORT, res);
    });

    const health = await request('GET', '/api/health');
    report('Health Check Endpoint (/api/health)', health.status === 200 && health.body?.status === 'UP');

    console.log('\n--- 2. Authentication & Roles ---');
    const adminLogin = await request('POST', '/api/auth/login', { username: 'admin', password: '123456' });
    report('Admin Login', adminLogin.status === 200 && adminLogin.body?.data?.user?.role === 'ADMIN');
    const adminToken = adminLogin.body?.data?.token;

    const invalidLogin = await request('POST', '/api/auth/login', { username: 'admin', password: 'wrongpassword' });
    report('Negative Auth: Reject invalid credentials', invalidLogin.status === 401);

    const teacherLogin = await request('POST', '/api/auth/login', { username: 'thayhung', password: '123456' });
    report('Teacher Login (Thầy Hùng)', teacherLogin.status === 200 && teacherLogin.body?.data?.user?.role === 'TEACHER');
    const teacherToken = teacherLogin.body?.data?.token;

    const studentAnLogin = await request('POST', '/api/auth/login', { username: 'hocsinhan', password: '123456' });
    report('Student Login (Học sinh An - Lớp 12A1)', studentAnLogin.status === 200 && studentAnLogin.body?.data?.user?.role === 'STUDENT');
    const studentAnToken = studentAnLogin.body?.data?.token;

    const studentCuongLogin = await request('POST', '/api/auth/login', { username: 'hocsinhcuong', password: '123456' });
    report('Student Login (Học sinh Cường - Lớp 12A2)', studentCuongLogin.status === 200 && studentCuongLogin.body?.data?.user?.role === 'STUDENT');
    const studentCuongToken = studentCuongLogin.body?.data?.token;

    const forbiddenClassCreation = await request('POST', '/api/classes', { name: 'Illegal Class', code: 'ILLEGAL', grade: '12' }, studentAnToken);
    report('RBAC Protection: Student blocked from creating classes (403 Forbidden)', forbiddenClassCreation.status === 403);

    const forbiddenExamCreation = await request('POST', '/api/exams', { title: 'Illegal Exam' }, studentAnToken);
    report('RBAC Protection: Student blocked from creating exams (403 Forbidden)', forbiddenExamCreation.status === 403);

    console.log('\n--- 3. Data Isolation Verification ---');
    const teacherClasses = await request('GET', '/api/classes', null, teacherToken);
    const teacherClassCodes = teacherClasses.body?.data?.map((c) => c.code) || [];
    report(
      'Teacher Data Isolation: Thầy Hùng only manages Class 12A1 (not 12A2)',
      teacherClassCodes.includes('12A1') && !teacherClassCodes.includes('12A2'),
      `Managed codes: ${teacherClassCodes.join(', ')}`
    );

    const studentClasses = await request('GET', '/api/classes', null, studentAnToken);
    const studentClassCodes = studentClasses.body?.data?.map((c) => c.code) || [];
    report(
      'Student Data Isolation: Student An only sees their enrolled Class 12A1 (not 12A2)',
      studentClassCodes.includes('12A1') && !studentClassCodes.includes('12A2'),
      `Visible codes: ${studentClassCodes.join(', ')}`
    );

    const studentAnExams = await request('GET', '/api/exams', null, studentAnToken);
    report(
      'Student Data Isolation: Học sinh An (12A1) CAN see the Math Exam',
      studentAnExams.body?.data?.length > 0 && studentAnExams.body?.data[0]?.title.includes('Toán')
    );

    const studentCuongExams = await request('GET', '/api/exams', null, studentCuongToken);
    report(
      'Student Data Isolation: Học sinh Cường (12A2) CANNOT see the Math Exam (0 exams returned)',
      studentCuongExams.body?.data?.length === 0,
      `Exams count returned for Class 12A2: ${studentCuongExams.body?.data?.length}`
    );

    console.log('\n--- 4. Exam Flow, Proctoring & Auto-Scoring ---');
    const mathExam = studentAnExams.body?.data[0];
    if (!mathExam) throw new Error('Math Exam not found for testing');

    const unauthorizedStart = await request('POST', '/api/submissions/start', { examId: mathExam._id }, studentCuongToken);
    report(
      'Security Check: Cross-class student (12A2) blocked from starting 12A1 exam (403 Forbidden)',
      unauthorizedStart.status === 403
    );

    // Reset previous test submissions for repeatable test runs
    await Submission.deleteMany({ examId: mathExam._id });

    const startRes = await request('POST', '/api/submissions/start', { examId: mathExam._id }, studentAnToken);
    report('Start Exam (Server-Authoritative deadline & questions delivery)', startRes.status === 200 && !!startRes.body?.data?.submissionId);
    const submissionId = startRes.body?.data?.submissionId;
    const questions = startRes.body?.data?.questions || [];

    const heartbeatRes = await request('POST', `/api/submissions/${submissionId}/heartbeat`, null, studentAnToken);
    report('Realtime Heartbeat Ping', heartbeatRes.status === 200 && !!heartbeatRes.body?.timestamp);

    const syncRes = await request(
      'POST',
      `/api/submissions/${submissionId}/sync-answers`,
      {
        answers: [
          { questionId: questions[0]._id, selectedAnswer: 'A', timestamp: new Date() },
          { questionId: questions[1]._id, selectedAnswer: 'B', timestamp: new Date() },
          { questionId: questions[2]._id, selectedAnswer: 'B', timestamp: new Date() },
          { questionId: questions[3]._id, selectedAnswer: 'D', timestamp: new Date() },
        ],
      },
      studentAnToken
    );
    report('Answer Sync & Timestamp Validation', syncRes.status === 200 && syncRes.body?.syncedCount === 4);

    const violationRes = await request(
      'POST',
      `/api/submissions/${submissionId}/log-violation`,
      { type: 'BLUR', details: 'User switched window/tab' },
      studentAnToken
    );
    report('Anti-Cheat Violation Logging (Blur tab tracking)', violationRes.status === 200 && violationRes.body?.blurViolationCount === 1);

    const submitRes = await request('POST', `/api/submissions/${submissionId}/submit`, null, studentAnToken);
    const score = submitRes.body?.data?.score;
    const totalScore = submitRes.body?.data?.totalScore;
    report(
      'Submit Exam & Auto-Scoring (All 4 correct answers -> 10/10 points)',
      submitRes.status === 200 && score === 10 && totalScore === 10,
      `Calculated score: ${score} / ${totalScore}`
    );

    const teacherReviewRes = await request('GET', `/api/submissions/exam/${mathExam._id}`, null, teacherToken);
    report(
      'Teacher Exam Review (Teacher can view student score & anti-cheat logs)',
      teacherReviewRes.status === 200 && teacherReviewRes.body?.data?.length > 0
    );

    console.log('\n--- 5. Pin Position Algorithm Validation ---');
    const { shuffleOptionsWithPin } = require('./utils/shuffleHelper');
    const testOptions = [
      { key: 'A', content: 'Choice 1', isPinned: false },
      { key: 'B', content: 'Choice 2', isPinned: false },
      { key: 'C', content: 'Choice 3', isPinned: false },
      { key: 'D', content: 'All above', isPinned: true, pinnedPosition: 3 },
    ];
    let pinValid = true;
    for (let i = 0; i < 50; i++) {
      const shuffled = shuffleOptionsWithPin(testOptions);
      if (shuffled[3]?.key !== 'D') {
        pinValid = false;
        break;
      }
    }
    report('Pin Position Stability: Option D remains strictly at index 3 across 50 iterations', pinValid);

    console.log('\n--- 6. AI FaceProctor Tolerance Engine Validation ---');
    const { FaceProctor } = await import('../ai-scanning/faceDetector.js');
    let violationTriggered = false;
    let violationPayload = null;

    const proctor = new FaceProctor({
      scanIntervalMs: 1000,
      toleranceLimit: 3,
      onViolation: (v) => {
        violationTriggered = true;
        violationPayload = v;
      },
    });

    proctor.processResult({ valid: false, error: 'NO_FACE', message: 'No face' });
    const fail1Ok = proctor.consecutiveFails === 1 && !violationTriggered;

    proctor.processResult({ valid: false, error: 'NO_FACE', message: 'No face' });
    const fail2Ok = proctor.consecutiveFails === 2 && !violationTriggered;

    proctor.processResult({ valid: true });
    const recoverOk = proctor.consecutiveFails === 0 && !violationTriggered;

    proctor.processResult({ valid: false, error: 'NO_FACE', message: 'No face' });
    proctor.processResult({ valid: false, error: 'NO_FACE', message: 'No face' });
    proctor.processResult({ valid: false, error: 'NO_FACE', message: 'No face' });
    const violationOk = violationTriggered && proctor.consecutiveFails === 0;

    report('AI Scanning: Tolerance reset on valid face recovery', fail1Ok && fail2Ok && recoverOk);
    report('AI Scanning: Violation triggers after exactly 3 consecutive fails (3 seconds)', violationOk);

    console.log('\n======================================================');
    console.log(`📊 TEST SUMMARY: ${passed} PASSED | ${failed} FAILED`);
    console.log('======================================================\n');

    server.close();
    await mongoose.connection.close();
    process.exit(failed > 0 ? 1 : 0);
  } catch (err) {
    console.error('Fatal Test Error:', err);
    process.exit(1);
  }
}

runTests();
