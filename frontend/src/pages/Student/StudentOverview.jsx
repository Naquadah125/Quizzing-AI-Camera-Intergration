import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import StudentNavbar from '../../components/StudentNavbar';
import { apiFetch, getCurrentUser } from '../../utils/api';
import './StudentOverview.css';

function StudentOverview() {
  const navigate = useNavigate();
  const [user, setUser] = useState({});
  const [exams, setExams] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const u = getCurrentUser();
    if (u) setUser(u);

    const loadData = async () => {
      try {
        const [examsRes, historyRes] = await Promise.all([
          apiFetch('/exams'),
          apiFetch('/submissions/my-history'),
        ]);

        if (examsRes.success) setExams(examsRes.data || []);
        if (historyRes.success) setHistory(historyRes.data || []);
      } catch (err) {
        console.error('Lỗi tải dữ liệu học sinh:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const avgScore =
    history.length > 0
      ? (
          history.reduce((sum, h) => sum + (h.score || 0), 0) / history.length
        ).toFixed(1)
      : '0.0';

  return (
    <div className="student-page-bg">
      <StudentNavbar />
      <div className="overview-container">
        <div className="overview-header">
          <h1>Xin chào, {user.fullName || user.username}! 👋</h1>
          <p>Chào mừng bạn đến với hệ thống thi trắc nghiệm trực tuyến có AI giám sát</p>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <h3>Bài thi khả dụng</h3>
            <p className="stat-number">{exams.length}</p>
          </div>
          <div className="stat-card">
            <h3>Bài đã hoàn thành</h3>
            <p className="stat-number text-green">{history.length}</p>
          </div>
          <div className="stat-card">
            <h3>Điểm trung bình</h3>
            <p className="stat-number text-blue">{avgScore}</p>
          </div>
          <div className="stat-card">
            <h3>Mã định danh</h3>
            <p className="stat-number" style={{ fontSize: '24px' }}>
              {user.studentCode || 'HS-2026'}
            </p>
          </div>
        </div>

        <div className="recent-section">
          <div className="section-title-row">
            <h2>Bài thi dành cho lớp của bạn</h2>
            <button className="btn-secondary" onClick={() => navigate('/student/exams')}>
              Xem tất cả
            </button>
          </div>

          <div className="exam-table-wrapper">
            <table className="exam-table">
              <thead>
                <tr>
                  <th>Tên bài thi</th>
                  <th>Môn học</th>
                  <th>Thời lượng</th>
                  <th>Thời gian mở - đóng</th>
                  <th>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="5" className="table-empty">
                      Đang tải danh sách bài thi...
                    </td>
                  </tr>
                ) : exams.length > 0 ? (
                  exams.map((exam) => (
                    <tr key={exam._id}>
                      <td>
                        <strong>{exam.title}</strong>
                        {exam.antiCheatSettings?.requireCamera && (
                          <span className="badge badge-orange" style={{ marginLeft: '8px' }}>
                            📷 AI Camera
                          </span>
                        )}
                      </td>
                      <td>
                        <span className="subject-tag">{exam.subject}</span>
                      </td>
                      <td>{exam.duration} phút</td>
                      <td>
                        <div className="time-range">
                          <span>{new Date(exam.openTime).toLocaleDateString('vi-VN')}</span>
                          <span> đến {new Date(exam.closeTime).toLocaleDateString('vi-VN')}</span>
                        </div>
                      </td>
                      <td>
                        <button
                          className="btn-action-primary"
                          onClick={() => navigate(`/student/exam-instruction/${exam._id}`)}
                        >
                          Vào phòng thi
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="table-empty">
                      Hiện tại chưa có bài thi nào được mở cho lớp của bạn.
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

export default StudentOverview;
