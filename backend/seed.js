const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const mongoose = require('mongoose');
const { connectDB } = require('./config/db');
const {
  User,
  ROLES,
  Class,
  ClassTeacher,
  ClassStudent,
  Exam,
  CLOSE_BOUNDARY_MODES,
  EXAM_STATUS,
  Submission,
} = require('./models');
const { hashPassword } = require('./utils/password');

async function seedDatabase() {
  try {
    console.log('🔄 Đang kết nối MongoDB để nạp dữ liệu mẫu...');
    await connectDB();

    console.log('🧹 Đang làm sạch dữ liệu cũ trong Database...');
    await Promise.all([
      User.deleteMany({}),
      Class.deleteMany({}),
      ClassTeacher.deleteMany({}),
      ClassStudent.deleteMany({}),
      Exam.deleteMany({}),
      Submission.deleteMany({}),
    ]);

    console.log('🌱 Đang tạo tài khoản Người Dùng (Admin, Giáo viên, Học sinh)...');
    const defaultPasswordHash = await hashPassword('123456');

    const admin = await User.create({
      username: 'admin',
      password: defaultPasswordHash,
      fullName: 'Quản Trị Viên Hệ Thống',
      email: 'admin@truonghoc.edu.vn',
      role: ROLES.ADMIN,
    });

    const teacherHung = await User.create({
      username: 'thayhung',
      password: defaultPasswordHash,
      fullName: 'Thầy Hùng (Toán Học)',
      email: 'thayhung@truonghoc.edu.vn',
      role: ROLES.TEACHER,
      createdBy: admin._id,
    });

    const teacherLan = await User.create({
      username: 'colan',
      password: defaultPasswordHash,
      fullName: 'Cô Lan (Tiếng Anh)',
      email: 'colan@truonghoc.edu.vn',
      role: ROLES.TEACHER,
      createdBy: admin._id,
    });

    const studentAn = await User.create({
      username: 'hocsinhan',
      password: defaultPasswordHash,
      fullName: 'Nguyễn Văn An',
      email: 'an.nguyen@hocsinh.edu.vn',
      studentCode: 'HS1201',
      role: ROLES.STUDENT,
      createdBy: teacherHung._id,
    });

    const studentBinh = await User.create({
      username: 'hocsinhbinh',
      password: defaultPasswordHash,
      fullName: 'Trần Thị Bình',
      email: 'binh.tran@hocsinh.edu.vn',
      studentCode: 'HS1202',
      role: ROLES.STUDENT,
      createdBy: teacherHung._id,
    });

    const studentCuong = await User.create({
      username: 'hocsinhcuong',
      password: defaultPasswordHash,
      fullName: 'Lê Hoàng Cường',
      email: 'cuong.le@hocsinh.edu.vn',
      studentCode: 'HS1203',
      role: ROLES.STUDENT,
      createdBy: teacherLan._id,
    });

    console.log('🏫 Đang tạo các Lớp học & thiết lập Data Isolation...');
    const class12A1 = await Class.create({
      name: 'Lớp 12A1 Chuyên Tự Nhiên',
      code: '12A1',
      grade: '12',
      academicYear: '2026-2027',
      description: 'Lớp 12A1 do Thầy Hùng phụ trách bộ môn Toán',
      createdBy: teacherHung._id,
    });

    const class12A2 = await Class.create({
      name: 'Lớp 12A2 Chuyên Xã Hội',
      code: '12A2',
      grade: '12',
      academicYear: '2026-2027',
      description: 'Lớp 12A2 do Cô Lan phụ trách bộ môn Tiếng Anh',
      createdBy: teacherLan._id,
    });

    await ClassTeacher.create([
      { classId: class12A1._id, teacherId: teacherHung._id, isPrimary: true, assignedBy: admin._id },
      { classId: class12A2._id, teacherId: teacherLan._id, isPrimary: true, assignedBy: admin._id },
    ]);

    await ClassStudent.create([
      { classId: class12A1._id, studentId: studentAn._id, assignedBy: teacherHung._id },
      { classId: class12A1._id, studentId: studentBinh._id, assignedBy: teacherHung._id },
      { classId: class12A2._id, studentId: studentCuong._id, assignedBy: teacherLan._id },
    ]);

    console.log('📝 Đang tạo Đề thi trắc nghiệm mẫu có AI Anti-Cheat & Pin Position...');
    const examMath = await Exam.create({
      title: 'Khảo Sát Chất Lượng Toán 12 - Học Kỳ 1 (Có Giám Sát AI)',
      description: 'Đề thi trắc nghiệm 4 đáp án đơn. Yêu cầu bật camera và toàn màn hình trong suốt quá trình thi.',
      subject: 'Toán Học',
      grade: '12',
      createdBy: teacherHung._id,
      assignedClasses: [class12A1._id],
      shuffleOptions: true,
      shuffleQuestions: false,
      openTime: new Date(Date.now() - 30 * 60 * 1000),
      closeTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      duration: 45,
      closeBoundaryMode: CLOSE_BOUNDARY_MODES.HARD_CLOSE,
      antiCheatSettings: {
        requireCamera: true,
        requireFullscreen: true,
        disableRightClick: true,
        maxBlurAttempts: 5,
        faceScanIntervalSeconds: 3,
        faceScanToleranceFails: 3,
        heartbeatIntervalSeconds: 5,
        testOverrideToken: 'dev_override_test_token',
      },
      status: EXAM_STATUS.PUBLISHED,
      questions: [
        {
          questionText: 'Cho hàm số y = f(x) có đạo hàm f\'(x) = x(x - 1)^2. Điểm cực trị của hàm số là:',
          options: [
            { key: 'A', content: 'x = 0', isPinned: false },
            { key: 'B', content: 'x = 1', isPinned: false },
            { key: 'C', content: 'x = 0 và x = 1', isPinned: false },
            { key: 'D', content: 'Hàm số không có cực trị', isPinned: false },
          ],
          correctAnswer: 'A',
          explanation: 'Qua nghiệm bội lẻ x = 0 thì đạo hàm đổi dấu từ âm sang dương nên x = 0 là điểm cực tiểu.',
          points: 2.5,
        },
        {
          questionText: 'Tập nghiệm của phương trình log2(x - 1) = 3 là:',
          options: [
            { key: 'A', content: 'S = {7}', isPinned: false },
            { key: 'B', content: 'S = {9}', isPinned: false },
            { key: 'C', content: 'S = {8}', isPinned: false },
            { key: 'D', content: 'S = {10}', isPinned: false },
          ],
          correctAnswer: 'B',
          explanation: 'x - 1 = 2^3 = 8 => x = 9.',
          points: 2.5,
        },
        {
          questionText: 'Trong không gian Oxyz, mặt cầu (S): (x - 1)^2 + (y + 2)^2 + (z - 3)^2 = 16 có bán kính R bằng:',
          options: [
            { key: 'A', content: 'R = 16', isPinned: false },
            { key: 'B', content: 'R = 4', isPinned: false },
            { key: 'C', content: 'R = 8', isPinned: false },
            { key: 'D', content: 'R = 2', isPinned: false },
          ],
          correctAnswer: 'B',
          explanation: 'R = căn(16) = 4.',
          points: 2.5,
        },
        {
          questionText: 'Mệnh đề nào sau đây là ĐÚNG về đồ thị hàm số y = (ax + b) / (cx + d) với c khác 0 và ad - bc khác 0?',
          options: [
            { key: 'A', content: 'Đồ thị luôn có tiệm cận đứng x = -d/c', isPinned: false },
            { key: 'B', content: 'Đồ thị luôn có tiệm cận ngang y = a/c', isPinned: false },
            { key: 'C', content: 'Giao điểm hai đường tiệm cận là tâm đối xứng của đồ thị', isPinned: false },
            {
              key: 'D',
              content: 'Cả A, B, C đều đúng',
              isPinned: true,
              pinnedPosition: 3,
            },
          ],
          correctAnswer: 'D',
          explanation: 'Đồ thị hàm phân thức bậc nhất trên bậc nhất có đầy đủ các tính chất A, B và C.',
          points: 2.5,
        },
      ],
    });

    console.log('\n================================================================');
    console.log('🎉 NẠP DỮ LIỆU MẪU (SEED DATA) THÀNH CÔNG RỰC RỠ! 🎉');
    console.log('================================================================');
    console.log('\n📋 DANH SÁCH TÀI KHOẢN ĐỂ TEST ĐĂNG NHẬP (Mật khẩu chung: 123456):');
    console.log('----------------------------------------------------------------');
    console.log('1. QUẢN TRỊ VIÊN (ADMIN):');
    console.log('   - Username: admin         | Password: 123456 (Toàn quyền hệ thống)');
    console.log('\n2. GIÁO VIÊN (TEACHER):');
    console.log('   - Username: thayhung      | Password: 123456 (Quản lý Lớp 12A1 & Đề Toán)');
    console.log('   - Username: colan         | Password: 123456 (Quản lý Lớp 12A2)');
    console.log('\n3. HỌC SINH (STUDENT):');
    console.log('   - Username: hocsinhan     | Password: 123456 (Lớp 12A1 - THẤY ĐỀ TOÁN)');
    console.log('   - Username: hocsinhbinh    | Password: 123456 (Lớp 12A1 - THẤY ĐỀ TOÁN)');
    console.log('   - Username: hocsinhcuong   | Password: 123456 (Lớp 12A2 - KHÔNG THẤY ĐỀ TOÁN - Data Isolation)');
    console.log('----------------------------------------------------------------\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Lỗi khi nạp dữ liệu mẫu:', error);
    process.exit(1);
  }
}

seedDatabase();
