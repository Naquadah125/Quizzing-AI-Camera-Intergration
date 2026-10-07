import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import TeacherNavbar from '../../components/TeacherNavbar';
import { apiFetch } from '../../utils/api';
import './TeacherOverview.css';

function TeacherCreateExam() {
  const navigate = useNavigate();
  const [classes, setClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState('');

  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('Toán Học');
  const [duration, setDuration] = useState(45);
  const [closeBoundaryMode, setCloseBoundaryMode] = useState('hard_close');
  const [shuffleOptions, setShuffleOptions] = useState(true);

  const [questions, setQuestions] = useState([
    {
      questionText: 'Cho hàm số y = f(x). Điểm cực trị của hàm số là gì?',
      options: [
        { key: 'A', content: 'x = 0', isPinned: false },
        { key: 'B', content: 'x = 1', isPinned: false },
        { key: 'C', content: 'x = -1', isPinned: false },
        { key: 'D', content: 'Cả A, B, C đều đúng', isPinned: true, pinnedPosition: 3 },
      ],
      correctAnswer: 'A',
      points: 2.5,
    },
  ]);

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadClasses = async () => {
      try {
        const res = await apiFetch('/classes');
        if (res.success && res.data.length > 0) {
          setClasses(res.data);
          setSelectedClassId(res.data[0]._id);
        }
      } catch (e) {}
    };
    loadClasses();
  }, []);

  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        questionText: '',
        options: [
          { key: 'A', content: '', isPinned: false },
          { key: 'B', content: '', isPinned: false },
          { key: 'C', content: '', isPinned: false },
          { key: 'D', content: '', isPinned: false, pinnedPosition: null },
        ],
        correctAnswer: 'A',
        points: 2.5,
      },
    ]);
  };

  const handleQuestionChange = (index, field, value) => {
    const updated = [...questions];
    updated[index][field] = value;
    setQuestions(updated);
  };

  const handleOptionChange = (qIndex, oIndex, content) => {
    const updated = [...questions];
    updated[qIndex].options[oIndex].content = content;
    setQuestions(updated);
  };

  const togglePinOptionD = (qIndex) => {
    const updated = [...questions];
    const isCurrentlyPinned = updated[qIndex].options[3].isPinned;
    updated[qIndex].options[3].isPinned = !isCurrentlyPinned;
    updated[qIndex].options[3].pinnedPosition = !isCurrentlyPinned ? 3 : null;
    setQuestions(updated);
  };

  const handleSubmitExam = async (e) => {
    e.preventDefault();
    if (!selectedClassId) {
      alert('Vui lòng chọn lớp học để giao đề thi!');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        title: title.trim(),
        subject: subject.trim(),
        assignedClasses: [selectedClassId],
        duration: parseInt(duration, 10),
        closeBoundaryMode,
        shuffleOptions,
        openTime: new Date(),
        closeTime: new Date(Date.now() + 7 * 24 * 3600000),
        questions,
        antiCheatSettings: {
          requireCamera: true,
          requireFullscreen: true,
          maxBlurAttempts: 5,
          faceScanIntervalSeconds: 3,
          faceScanToleranceFails: 3,
        },
        status: 'PUBLISHED',
      };

      const res = await apiFetch('/exams', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (res.success) {
        alert('Tạo bài thi thành công và đã chỉ định cho lớp!');
        navigate('/teacher');
      }
    } catch (err) {
      alert(err.message || 'Lỗi khi tạo đề thi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="teacher-bg">
      <TeacherNavbar />
      <div className="overview-container" style={{ maxWidth: '900px' }}>
        <div className="overview-header">
          <h1>Tạo bài thi trắc nghiệm mới</h1>
          <p>Thiết lập đề thi trắc nghiệm 4 đáp án, tính năng Pin Position & Giám sát AI</p>
        </div>

        <form onSubmit={handleSubmitExam}>
          <div className="stat-card" style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '16px', color: '#1a1a1a', marginBottom: '16px' }}>
              1. Cấu hình bài thi
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div className="form-group">
                <label>Tiêu đề bài thi</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Kiểm tra giữa kỳ 1..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Môn học</label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Giao cho Lớp học (Data Isolation)</label>
                <select
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: '8px',
                    border: '1.5px solid #e0e0e0',
                    fontSize: '14px',
                  }}
                >
                  {classes.map((cls) => (
                    <option key={cls._id} value={cls._id}>
                      {cls.name} ({cls.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Thời lượng làm bài (phút)</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Cơ chế đóng đề (Close Boundary)</label>
                <select
                  value={closeBoundaryMode}
                  onChange={(e) => setCloseBoundaryMode(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: '8px',
                    border: '1.5px solid #e0e0e0',
                    fontSize: '14px',
                  }}
                >
                  <option value="hard_close">Hard-close (Thu bài đúng giờ đóng đề)</option>
                  <option value="soft_close">Soft-close (Làm đủ số phút từ lúc bắt đầu)</option>
                </select>
              </div>

              <div className="form-group">
                <label>Xáo trộn đáp án (Shuffle)</label>
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginTop: '8px',
                    cursor: 'pointer',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={shuffleOptions}
                    onChange={(e) => setShuffleOptions(e.target.checked)}
                  />
                  <span>Tự động xáo trộn 4 đáp án cho từng học sinh</span>
                </label>
              </div>
            </div>
          </div>

          <div className="stat-card" style={{ marginBottom: '24px' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '16px',
              }}
            >
              <h3 style={{ fontSize: '16px', color: '#1a1a1a', margin: 0 }}>
                2. Danh sách câu hỏi ({questions.length} câu)
              </h3>
              <button
                type="button"
                className="btn-action"
                style={{ backgroundColor: '#ff6600', color: 'white' }}
                onClick={addQuestion}
              >
                + Thêm câu hỏi
              </button>
            </div>

            {questions.map((q, qIndex) => (
              <div
                key={qIndex}
                style={{
                  border: '1px solid #f0f0f0',
                  borderRadius: '10px',
                  padding: '20px',
                  marginBottom: '20px',
                  backgroundColor: '#fafafa',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <strong>Câu {qIndex + 1}:</strong>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span>Đáp án đúng:</span>
                    <select
                      value={q.correctAnswer}
                      onChange={(e) => handleQuestionChange(qIndex, 'correctAnswer', e.target.value)}
                      style={{ padding: '4px 8px', borderRadius: '4px' }}
                    >
                      <option value="A">Đáp án A</option>
                      <option value="B">Đáp án B</option>
                      <option value="C">Đáp án C</option>
                      <option value="D">Đáp án D</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <input
                    type="text"
                    required
                    placeholder="Nhập nội dung câu hỏi..."
                    value={q.questionText}
                    onChange={(e) => handleQuestionChange(qIndex, 'questionText', e.target.value)}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  {q.options.map((opt, oIndex) => (
                    <div key={opt.key} className="form-group" style={{ margin: 0 }}>
                      <label style={{ fontSize: '12px' }}>Đáp án {opt.key}</label>
                      <input
                        type="text"
                        required
                        placeholder={`Nội dung lựa chọn ${opt.key}...`}
                        value={opt.content}
                        onChange={(e) => handleOptionChange(qIndex, oIndex, e.target.value)}
                      />
                    </div>
                  ))}
                </div>

                <div style={{ marginTop: '14px', fontSize: '13px' }}>
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      cursor: 'pointer',
                      color: '#444',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={q.options[3].isPinned}
                      onChange={() => togglePinOptionD(qIndex)}
                    />
                    <span>
                      📌 <strong>Pin position (Khóa vị trí đáp án D):</strong> Giữ cố định đáp án D ở
                      cuối cùng không cho xáo trộn khi Shuffle (ví dụ: "Cả A, B, C đều đúng").
                    </span>
                  </label>
                </div>
              </div>
            ))}
          </div>

          <button
            type="submit"
            className="btn-submit"
            disabled={loading}
            style={{ backgroundColor: '#ff6600', padding: '16px', fontSize: '16px' }}
          >
            {loading ? 'Đang tạo bài thi...' : 'Hoàn tất & Xuất bản bài thi'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default TeacherCreateExam;
