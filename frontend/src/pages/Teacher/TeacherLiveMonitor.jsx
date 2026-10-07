import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { io } from 'socket.io-client';
import TeacherNavbar from '../../components/TeacherNavbar';
import { apiFetch } from '../../utils/api';
import './TeacherOverview.css';

function TeacherLiveMonitor() {
  const [searchParams] = useSearchParams();
  const [exams, setExams] = useState([]);
  const [selectedExamId, setSelectedExamId] = useState(searchParams.get('examId') || '');
  const [submissions, setSubmissions] = useState([]);
  const [realtimeAlerts, setRealtimeAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadExams = async () => {
      try {
        const res = await apiFetch('/exams');
        if (res.success && res.data.length > 0) {
          setExams(res.data);
          if (!selectedExamId) setSelectedExamId(res.data[0]._id);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    loadExams();
  }, []);

  useEffect(() => {
    if (!selectedExamId) return;

    const loadSubmissions = async () => {
      try {
        const res = await apiFetch(`/submissions/exam/${selectedExamId}`);
        if (res.success) {
          setSubmissions(res.data || []);
        }
      } catch (e) {
        console.error(e);
      }
    };

    loadSubmissions();
    const interval = setInterval(loadSubmissions, 8000);
    return () => clearInterval(interval);
  }, [selectedExamId]);

  useEffect(() => {
    const socket = io('/', { transports: ['websocket', 'polling'] });

    socket.on('connect', () => {
      console.log('Đã kết nối Socket.io Giám sát Realtime:', socket.id);
      const currentExam = exams.find((e) => e._id === selectedExamId);
      if (currentExam && currentExam.assignedClasses?.length > 0) {
        const classId = currentExam.assignedClasses[0]._id || currentExam.assignedClasses[0];
        socket.emit('join_class_room', { classId });
      }
    });

    socket.on('student_violation', (alertData) => {
      console.log('Nhận cảnh báo gian lận realtime:', alertData);
      setRealtimeAlerts((prev) => [
        {
          id: Date.now(),
          time: new Date().toLocaleTimeString('vi-VN'),
          ...alertData,
        },
        ...prev.slice(0, 15),
      ]);
    });

    return () => {
      socket.disconnect();
    };
  }, [selectedExamId, exams]);

  return (
    <div className="teacher-bg">
      <TeacherNavbar />
      <div className="overview-container">
        <div className="overview-header">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h1>Phòng Giám sát Trực Tuyến & Cảnh báo AI 🔴</h1>
              <p>Hệ thống nhận cảnh báo tức thời khi học sinh vi phạm chuyển tab hoặc AI quét mặt lỗi</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span>Chọn đề thi:</span>
              <select
                value={selectedExamId}
                onChange={(e) => setSelectedExamId(e.target.value)}
                style={{ padding: '8px 14px', borderRadius: '8px', border: '1px solid #ccc' }}
              >
                {exams.map((ex) => (
                  <option key={ex._id} value={ex._id}>
                    {ex.title} ({ex.subject})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {realtimeAlerts.length > 0 && (
          <div style={{ marginBottom: '30px' }}>
            <h2 style={{ fontSize: '18px', color: '#e53e3e', marginBottom: '12px' }}>
              🚨 Thông báo vi phạm trực tiếp ({realtimeAlerts.length})
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {realtimeAlerts.map((al) => (
                <div
                  key={al.id}
                  style={{
                    backgroundColor: al.autoSubmitted ? '#ffe6e6' : '#fffaf0',
                    border: `1px solid ${al.autoSubmitted ? '#feb2b2' : '#feebc8'}`,
                    padding: '12px 18px',
                    borderRadius: '8px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <strong style={{ color: al.autoSubmitted ? '#c53030' : '#c05621' }}>
                      [{al.time}] Học sinh: {al.studentName}
                    </strong>
                    <span style={{ marginLeft: '12px', fontSize: '14px' }}>
                      {al.details || al.type}
                    </span>
                    {al.blurCount >= 5 && (
                      <span className="badge badge-red" style={{ marginLeft: '10px' }}>
                        Khóa bài tự động (Quá 5 lần)
                      </span>
                    )}
                  </div>
                  <span className="badge badge-orange">Cảnh báo #{al.blurCount}/5</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="recent-section">
          <h2>Bảng điểm & Trạng thái làm bài của học sinh ({submissions.length} bài)</h2>
          <div className="exam-table-wrapper">
            <table className="exam-table">
              <thead>
                <tr>
                  <th>Học sinh</th>
                  <th>Mã học sinh</th>
                  <th>Điểm số</th>
                  <th>Số câu đúng</th>
                  <th>Vi phạm chuyển tab</th>
                  <th>Vi phạm khuôn mặt</th>
                  <th>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {submissions.length > 0 ? (
                  submissions.map((sub) => (
                    <tr key={sub._id}>
                      <td>
                        <strong>{sub.studentId?.fullName || sub.studentId?.username}</strong>
                      </td>
                      <td>
                        <span className="code-badge">{sub.studentId?.studentCode || 'HS'}</span>
                      </td>
                      <td>
                        <strong
                          style={{
                            fontSize: '15px',
                            color: sub.score >= 5 ? '#00b894' : '#e53e3e',
                          }}
                        >
                          {sub.status === 'SUBMITTED' ? `${sub.score} / ${sub.totalScore || 10}` : 'Chưa nộp'}
                        </strong>
                      </td>
                      <td>
                        {sub.correctAnswersCount} / {sub.totalQuestions}
                      </td>
                      <td>
                        {sub.blurViolationCount > 0 ? (
                          <span
                            className={`badge ${
                              sub.blurViolationCount >= 5 ? 'badge-red' : 'badge-orange'
                            }`}
                          >
                            ⚠️ {sub.blurViolationCount}/5 lần
                          </span>
                        ) : (
                          <span className="badge badge-green">0</span>
                        )}
                      </td>
                      <td>
                        {sub.faceViolationCount > 0 ? (
                          <span className="badge badge-orange">
                            📷 {sub.faceViolationCount} lần
                          </span>
                        ) : (
                          <span className="badge badge-green">Hợp lệ</span>
                        )}
                      </td>
                      <td>
                        <span
                          className={`status-badge ${
                            sub.status === 'SUBMITTED' ? 'active' : 'upcoming'
                          }`}
                        >
                          {sub.status === 'SUBMITTED'
                            ? sub.isAutoSubmitted
                              ? 'Tự thu bài (Vi phạm)'
                              : 'Đã hoàn thành'
                            : 'Đang làm bài'}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '30px' }}>
                      Chưa có học sinh nào nộp hoặc tham gia bài thi này.
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

export default TeacherLiveMonitor;
