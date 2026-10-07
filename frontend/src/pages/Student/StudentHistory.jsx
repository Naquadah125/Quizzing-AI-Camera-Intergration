import React, { useState, useEffect } from 'react';
import StudentNavbar from '../../components/StudentNavbar';
import { apiFetch } from '../../utils/api';
import './StudentOverview.css';

function StudentHistory() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await apiFetch('/submissions/my-history');
        if (res.success) {
          setHistory(res.data || []);
        }
      } catch (err) {
        console.error('Lỗi tải lịch sử:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  return (
    <div className="student-page-bg">
      <StudentNavbar />
      <div className="overview-container">
        <div className="overview-header">
          <h1>Lịch sử làm bài thi</h1>
          <p>Xem lại kết quả và điểm số các bài thi bạn đã nộp</p>
        </div>

        <div className="exam-table-wrapper">
          <table className="exam-table">
            <thead>
              <tr>
                <th>Tên bài thi</th>
                <th>Môn học</th>
                <th>Điểm số</th>
                <th>Số câu đúng</th>
                <th>Thời gian nộp</th>
                <th>Vi phạm</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="table-empty">
                    Đang tải lịch sử bài thi...
                  </td>
                </tr>
              ) : history.length > 0 ? (
                history.map((sub) => (
                  <tr key={sub._id}>
                    <td>
                      <strong>{sub.examId?.title || 'Bài thi'}</strong>
                    </td>
                    <td>
                      <span className="subject-tag">{sub.examId?.subject || 'Chung'}</span>
                    </td>
                    <td>
                      <span
                        style={{
                          fontSize: '16px',
                          fontWeight: '800',
                          color: sub.score >= 5 ? '#00b894' : '#e63946',
                        }}
                      >
                        {sub.score} / {sub.totalScore || 10}
                      </span>
                    </td>
                    <td>
                      {sub.correctAnswersCount} / {sub.totalQuestions} câu
                    </td>
                    <td>{new Date(sub.submittedAt || sub.createdAt).toLocaleString('vi-VN')}</td>
                    <td>
                      {sub.blurViolationCount > 0 ? (
                        <span className="badge badge-red">
                          ⚠️ {sub.blurViolationCount} lần thoát tab
                        </span>
                      ) : (
                        <span className="badge badge-green">Hợp lệ</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="table-empty">
                    Bạn chưa hoàn thành bài thi nào.
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

export default StudentHistory;
