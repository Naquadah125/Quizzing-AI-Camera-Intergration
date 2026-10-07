import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import TeacherNavbar from '../../components/TeacherNavbar';
import { apiFetch, getCurrentUser } from '../../utils/api';
import './TeacherOverview.css';

function TeacherOverview() {
  const navigate = useNavigate();
  const [user, setUser] = useState({});
  const [exams, setExams] = useState([]);
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const u = getCurrentUser();
    if (u) setUser(u);

    const loadData = async () => {
      try {
        const [examsRes, classesRes, studentsRes] = await Promise.all([
          apiFetch('/exams'),
          apiFetch('/classes'),
          apiFetch('/users/my-students'),
        ]);

        if (examsRes.success) setExams(examsRes.data || []);
        if (classesRes.success) setClasses(classesRes.data || []);
        if (studentsRes.success) setStudents(studentsRes.data || []);
      } catch (err) {
        console.error('Lỗi tải dữ liệu giáo viên:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  return (
    <div className="teacher-bg">
      <TeacherNavbar />
      <div className="overview-container">
        <div className="overview-header">
          <h1>Xin chào, {user.fullName || user.username}! 👨‍🏫</h1>
          <p>Quản lý các lớp học, đề thi và giám sát gian lận trực tuyến theo phạm vi phân quyền</p>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <h3>Đề thi đã tạo</h3>
            <p className="stat-number">{exams.length}</p>
          </div>
          <div className="stat-card">
            <h3>Lớp phụ trách</h3>
            <p className="stat-number">{classes.length}</p>
          </div>
          <div className="stat-card">
            <h3>Học sinh quản lý</h3>
            <p className="stat-number">{students.length}</p>
          </div>
          <div className="stat-card">
            <h3>Giám sát trực tiếp</h3>
            <p className="stat-number text-orange">🟢 Live</p>
          </div>
        </div>

        <div className="recent-section">
          <div className="section-title-row">
            <h2>Đề thi của bạn</h2>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                className="btn-action"
                style={{ backgroundColor: '#ff6600', color: 'white' }}
                onClick={() => navigate('/teacher/create-exam')}
              >
                + Tạo bài thi mới
              </button>
            </div>
          </div>

          <div className="exam-table-wrapper">
            <table className="exam-table">
              <thead>
                <tr>
                  <th>Tên bài thi</th>
                  <th>Môn học</th>
                  <th>Thời lượng</th>
                  <th>Lớp được giao</th>
                  <th>Trạng thái</th>
                  <th>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '20px' }}>
                      Đang tải danh sách bài thi...
                    </td>
                  </tr>
                ) : exams.length > 0 ? (
                  exams.map((exam) => (
                    <tr key={exam._id}>
                      <td>
                        <strong>{exam.title}</strong>
                      </td>
                      <td>
                        <span className="code-badge">{exam.subject}</span>
                      </td>
                      <td>{exam.duration} phút</td>
                      <td>
                        {exam.assignedClasses?.map((c) => c.name || c.code).join(', ') || 'Chưa gán'}
                      </td>
                      <td>
                        <span className="status-badge active">Đang mở</span>
                      </td>
                      <td>
                        <button
                          className="btn-action"
                          onClick={() => navigate(`/teacher/live-monitor?examId=${exam._id}`)}
                        >
                          👁️ Xem kết quả & Giám sát
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '20px' }}>
                      Chưa có bài thi nào được tạo.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TeacherOverview;
