import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import StudentNavbar from '../../components/StudentNavbar';
import { apiFetch } from '../../utils/api';
import './StudentOverview.css';

function StudentExams() {
  const navigate = useNavigate();
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchExams = async () => {
      try {
        const res = await apiFetch('/exams');
        if (res.success) {
          setExams(res.data || []);
        }
      } catch (err) {
        console.error('Lỗi tải danh sách đề thi:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchExams();
  }, []);

  return (
    <div className="student-page-bg">
      <StudentNavbar />
      <div className="overview-container">
        <div className="overview-header">
          <h1>Danh sách bài thi của lớp bạn</h1>
          <p>Các bài thi được Giáo viên chỉ định cho lớp của bạn tham gia</p>
        </div>

        <div className="exam-table-wrapper">
          <table className="exam-table">
            <thead>
              <tr>
                <th>Tên bài thi</th>
                <th>Môn học</th>
                <th>Thời lượng</th>
                <th>Hạn đóng đề</th>
                <th>Chế độ</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="table-empty">
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
                      <span className="subject-tag">{exam.subject}</span>
                    </td>
                    <td>{exam.duration} phút</td>
                    <td>{new Date(exam.closeTime).toLocaleString('vi-VN')}</td>
                    <td>
                      <span className="badge badge-blue">
                        {exam.closeBoundaryMode === 'hard_close' ? 'Hard-close' : 'Soft-close'}
                      </span>
                    </td>
                    <td>
                      <button
                        className="btn-action-primary"
                        onClick={() => navigate(`/student/exam-instruction/${exam._id}`)}
                      >
                        Bắt đầu thi
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="table-empty">
                    Hiện chưa có bài thi nào được giao cho lớp bạn.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default StudentExams;
