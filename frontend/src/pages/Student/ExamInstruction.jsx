import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import StudentNavbar from '../../components/StudentNavbar';
import { apiFetch } from '../../utils/api';
import './ExamInstruction.css';

function ExamInstruction() {
  const { id } = useParams();
  const navigate = useNavigate();
  const videoRef = useRef(null);

  const [exam, setExam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasCameraPermission, setHasCameraPermission] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [mediaStream, setMediaStream] = useState(null);

  useEffect(() => {
    const fetchExam = async () => {
      try {
        const res = await apiFetch(`/exams/${id}`);
        if (res.success) {
          setExam(res.data);
        }
      } catch (err) {
        alert(err.message || 'Không thể tải đề thi.');
        navigate('/student');
      } finally {
        setLoading(false);
      }
    };

    fetchExam();

    return () => {
      if (mediaStream) {
        mediaStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [id, navigate]);

  const requestCameraPermission = async () => {
    setCameraError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 320, height: 240 },
        audio: false,
      });

      setMediaStream(stream);
      setHasCameraPermission(true);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      setHasCameraPermission(false);
      setCameraError(
        'Bạn phải cấp quyền Camera để thi. Vui lòng cho phép quyền Camera trên trình duyệt và thử lại!'
      );
    }
  };

  const handleStartExam = () => {
    if (!hasCameraPermission) return;
    navigate(`/student/take-exam/${id}`);
  };

  if (loading) {
    return (
      <div className="student-page-bg">
        <StudentNavbar />
        <div className="instruction-loading">Đang tải thông tin phòng thi...</div>
      </div>
    );
  }

  return (
    <div className="student-page-bg">
      <StudentNavbar />
      <div className="instruction-container">
        <div className="instruction-card">
          <div className="instruction-header">
            <span className="exam-badge">Phòng thi chuẩn bị</span>
            <h1>{exam?.title}</h1>
            <p className="exam-meta">
              Môn học: <strong>{exam?.subject}</strong> • Thời lượng:{' '}
              <strong>{exam?.duration} phút</strong> • Chế độ đóng đề:{' '}
              <strong>{exam?.closeBoundaryMode === 'hard_close' ? 'Hard-close' : 'Soft-close'}</strong>
            </p>
          </div>

          <div className="instruction-body">
            <div className="rules-section">
              <h3>⚠️ Quy chế phòng thi nghiêm ngặt</h3>
              <ul className="rules-list">
                <li>
                  <span className="rule-icon">📷</span>
                  <div>
                    <strong>Bắt buộc bật Camera:</strong> Hệ thống AI sẽ quét khuôn mặt liên tục mỗi
                    3 giây.
                  </div>
                </li>
                <li>
                  <span className="rule-icon">🖥️</span>
                  <div>
                    <strong>Toàn màn hình (Fullscreen):</strong> Bắt buộc duy trì chế độ Fullscreen
                    trong suốt thời gian làm bài.
                  </div>
                </li>
                <li>
                  <span className="rule-icon">🚫</span>
                  <div>
                    <strong>Chống chuyển Tab / Thoát màn hình:</strong> Rời khỏi màn hình hoặc bấm
                    ESC quá <strong>5 lần</strong>, hệ thống sẽ tự động thu và khóa bài thi ngay lập
                    tức!
                  </div>
                </li>
                <li>
                  <span className="rule-icon">📶</span>
                  <div>
                    <strong>Chống rớt mạng (Offline recovery):</strong> Đáp án tự động lưu tạm vào
                    máy và đồng bộ lại ngay khi có kết nối.
                  </div>
                </li>
              </ul>
            </div>

            <div className="camera-check-section">
              <h3>Kiểm tra Camera (Bước bắt buộc)</h3>
              <div className="camera-preview-box">
                {hasCameraPermission ? (
                  <video
                    ref={(el) => {
                      videoRef.current = el;
                      if (el && mediaStream && !el.srcObject) {
                        el.srcObject = mediaStream;
                      }
                    }}
                    autoPlay
                    playsInline
                    muted
                    className="video-preview"
                  />
                ) : (
                  <div className="camera-placeholder">
                    <span className="cam-icon">📷</span>
                    <p>Camera chưa được kích hoạt</p>
                    <button className="btn-enable-cam" onClick={requestCameraPermission}>
                      Cấp quyền Camera ngay
                    </button>
                  </div>
                )}
              </div>

              {cameraError && <div className="camera-error-msg">{cameraError}</div>}

              {hasCameraPermission && (
                <div className="camera-success-msg">
                  ✅ Camera đã sẵn sàng! Khuôn mặt của bạn sẽ được AI giám sát tự động.
                </div>
              )}
            </div>
          </div>

          <div className="instruction-footer">
            <button className="btn-cancel" onClick={() => navigate('/student')}>
              Quay lại
            </button>
            <button
              className="btn-start-exam"
              disabled={!hasCameraPermission}
              onClick={handleStartExam}
            >
              {hasCameraPermission ? '🚀 Bắt đầu làm bài thi' : '🔒 Khóa: Yêu cầu cấp quyền Camera'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ExamInstruction;
