import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiFetch, getCurrentUser } from '../../utils/api';
import { FaceProctor } from '../../services/faceDetector';
import './TakeExam.css';

function TakeExam() {
  const { id: examId } = useParams();
  const navigate = useNavigate();

  const [examData, setExamData] = useState(null);
  const [submissionId, setSubmissionId] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const videoRef = useRef(null);
  const [mediaStream, setMediaStream] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [blurViolations, setBlurViolations] = useState(0);
  const [warningModal, setWarningModal] = useState({ show: false, message: '' });
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [offlineQueue, setOfflineQueue] = useState([]);

  const canvasRef = useRef(null);
  const [faceStatus, setFaceStatus] = useState('NORMAL');

  useEffect(() => {
    const initExam = async () => {
      try {
        const res = await apiFetch('/submissions/start', {
          method: 'POST',
          body: JSON.stringify({ examId }),
        });

        if (res.success && res.data) {
          const { submissionId, serverCloseDeadline, questions: qList, answers: prevAnswers } = res.data;
          setSubmissionId(submissionId);
          setQuestions(qList);
          setExamData(res.data);

          const restored = {};
          if (Array.isArray(prevAnswers)) {
            prevAnswers.forEach((a) => {
              if (a.selectedAnswer) restored[a.questionId] = a.selectedAnswer;
            });
          }

          const localSaved = localStorage.getItem(`exam_answers_${submissionId}`);
          if (localSaved) {
            try {
              const parsed = JSON.parse(localSaved);
              Object.assign(restored, parsed);
            } catch (e) {}
          }
          setAnswers(restored);

          // Synchronize countdown timer against server-authoritative deadline
          const deadlineTime = new Date(serverCloseDeadline).getTime();
          const nowTime = Date.now();
          const remainingSec = Math.max(0, Math.floor((deadlineTime - nowTime) / 1000));
          setTimeLeft(remainingSec);
        }
      } catch (err) {
        alert(err.message || 'Không thể bắt đầu bài thi.');
        navigate('/student');
      } finally {
        setLoading(false);
      }
    };

    initExam();

    navigator.mediaDevices
      .getUserMedia({ video: { width: 240, height: 180 }, audio: false })
      .then((stream) => {
        setMediaStream(stream);
        if (videoRef.current) videoRef.current.srcObject = stream;
      })
      .catch((err) => {
        console.warn('Unable to access webcam stream:', err);
      });

    return () => {
      if (mediaStream) {
        mediaStream.getTracks().forEach((t) => t.stop());
      }
    };
  }, [examId, navigate]);

  useEffect(() => {
    if (loading || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleAutoSubmit('Hết thời gian làm bài thi (Server Deadline)!');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [loading, timeLeft]);

  useEffect(() => {
    if (!submissionId) return;

    const heartbeatInterval = setInterval(() => {
      if (navigator.onLine) {
        apiFetch(`/submissions/${submissionId}/heartbeat`, { method: 'POST' }).catch(() => {});
      }
    }, 5000);

    return () => clearInterval(heartbeatInterval);
  }, [submissionId]);

  useEffect(() => {
    if (!submissionId) return;

    const handleContextMenu = (e) => e.preventDefault();
    document.addEventListener('contextmenu', handleContextMenu);

    const handleFullscreenChange = () => {
      const active = !!document.fullscreenElement;
      setIsFullscreen(active);
      if (!active) {
        triggerViolation('EXIT_FULLSCREEN', 'Thoát chế độ Toàn màn hình');
      }
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    const handleVisibilityChange = () => {
      if (document.hidden) {
        triggerViolation('BLUR', 'Chuyển tab hoặc rời khỏi màn hình bài thi');
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [submissionId, blurViolations]);

  const triggerViolation = async (type, details) => {
    const nextCount = blurViolations + 1;
    setBlurViolations(nextCount);

    if (nextCount >= 5) {
      setWarningModal({
        show: true,
        message: '🚨 BẠN ĐÃ VI PHẠM QUÁ 5 LẦN! Hệ thống tự động thu và khóa bài thi ngay bây giờ.',
      });
      setTimeout(() => {
        handleAutoSubmit('Vi phạm thoát tab/màn hình quá 5 lần');
      }, 2000);
    } else {
      setWarningModal({
        show: true,
        message: `⚠️ CẢNH BÁO VI PHẠM (${nextCount}/5): ${details}. Bạn chỉ còn ${
          5 - nextCount
        } lần vi phạm trước khi bị tự động nộp bài!`,
      });
    }

    if (submissionId) {
      try {
        await apiFetch(`/submissions/${submissionId}/log-violation`, {
          method: 'POST',
          body: JSON.stringify({ type, details }),
        });
      } catch (e) {}
    }
  };

  useEffect(() => {
    if (!submissionId || !mediaStream || !videoRef.current) return;

    const proctor = new FaceProctor({
      scanIntervalMs: 1000,
      toleranceLimit: 3,
      onStatusChange: (info) => {
        setFaceStatus(info.status === 'VALID' ? 'NORMAL' : 'WARNING');
      },
      onViolation: (violation) => {
        triggerViolation(violation.type, violation.details);
      },
    });

    proctor.start(videoRef.current);

    return () => {
      proctor.stop();
    };
  }, [submissionId, mediaStream]);

  useEffect(() => {
    const handleOffline = () => {
      setIsOffline(true);
      setOfflineQueue((prev) => [...prev, { event: 'offline_start', time: new Date() }]);
    };

    const handleOnline = async () => {
      setIsOffline(false);
      if (submissionId) {
        try {
          const syncList = Object.keys(answers).map((qId) => ({
            questionId: qId,
            selectedAnswer: answers[qId],
            timestamp: new Date(),
          }));

          await apiFetch(`/submissions/${submissionId}/sync-answers`, {
            method: 'POST',
            body: JSON.stringify({
              answers: syncList,
              offlineSession: {
                offlineStart: new Date(Date.now() - 10000),
                offlineEnd: new Date(),
                offlineLogs: ['Mất mạng và đã khôi phục'],
              },
            }),
          });
        } catch (e) {}
      }
    };

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, [submissionId, answers]);

  const handleSelectAnswer = (questionId, optionKey) => {
    const newAnswers = {
      ...answers,
      [questionId]: optionKey,
    };
    setAnswers(newAnswers);

    if (submissionId) {
      localStorage.setItem(`exam_answers_${submissionId}`, JSON.stringify(newAnswers));

      apiFetch(`/submissions/${submissionId}/sync-answers`, {
        method: 'POST',
        body: JSON.stringify({
          answers: [
            {
              questionId,
              selectedAnswer: optionKey,
              timestamp: new Date(),
            },
          ],
        }),
      }).catch(() => {});
    }
  };

  const scrollToQuestion = (idx) => {
    const el = document.getElementById(`question-card-${idx}`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const enterFullscreen = () => {
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    }
  };

  const handleSubmitExam = async () => {
    if (!window.confirm('Bạn có chắc chắn muốn nộp bài thi ngay bây giờ?')) return;
    executeSubmit();
  };

  const handleAutoSubmit = (reason) => {
    executeSubmit(true, reason);
  };

  const executeSubmit = async (isAuto = false, reason = '') => {
    if (isSubmitting || !submissionId) return;
    setIsSubmitting(true);

    try {
      const res = await apiFetch(`/submissions/${submissionId}/submit`, {
        method: 'POST',
      });

      if (res.success) {
        localStorage.removeItem(`exam_answers_${submissionId}`);
        alert(
          `Nộp bài thành công!\nĐiểm của bạn: ${res.data?.score || 0} / ${res.data?.totalScore || 10}\nSố câu đúng: ${
            res.data?.correctAnswersCount || 0
          }`
        );
        navigate('/student/history');
      }
    } catch (err) {
      alert(err.message || 'Lỗi khi nộp bài.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <div className="take-exam-loading">Đang tải đề thi và thiết lập phòng thi an toàn...</div>;
  }

  const answeredCount = Object.keys(answers).length;

  return (
    <div className="take-exam-page">
      <div className="exam-sidebar">
        <div className="camera-box">
          <video
            ref={(el) => {
              videoRef.current = el;
              if (el && mediaStream && !el.srcObject) el.srcObject = mediaStream;
            }}
            autoPlay
            playsInline
            muted
            className="exam-webcam"
          />
          <canvas ref={canvasRef} style={{ display: 'none' }} />
          <div className={`ai-status-pill ${faceStatus === 'NORMAL' ? 'active' : 'warn'}`}>
            <span className="dot" />
            {faceStatus === 'NORMAL' ? 'AI: Mặt hợp lệ' : 'AI: Cảnh báo mặt!'}
          </div>
        </div>

        <div className="timer-box">
          <span className="timer-title">Thời gian còn lại</span>
          <div className={`time-display ${timeLeft < 60 ? 'warning' : ''}`}>
            {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
          </div>
          <div className="time-info">Tổng: {examData?.duration || 45} phút</div>
        </div>

        <div className="violation-tracker">
          <div className="violation-label">
            <span>Cảnh báo chuyển tab:</span>
            <strong className={blurViolations > 0 ? 'text-red' : ''}>{blurViolations}/5</strong>
          </div>
          <div className="violation-bar">
            <div
              className="violation-fill"
              style={{ width: `${(blurViolations / 5) * 100}%` }}
            />
          </div>
        </div>

        {isOffline && (
          <div className="offline-badge">
            ⚠️ Mất mạng: Đáp án đang lưu tạm Offline
          </div>
        )}

        <div className="question-nav">
          <h3>
            Câu hỏi ({answeredCount}/{questions.length})
          </h3>
          <div className="nav-grid">
            {questions.map((q, idx) => {
              const isAnswered = answers[q._id] !== undefined;
              return (
                <div
                  key={q._id}
                  className={`nav-item ${isAnswered ? 'answered' : ''}`}
                  onClick={() => scrollToQuestion(idx)}
                >
                  {idx + 1}
                </div>
              );
            })}
          </div>
        </div>

        <button
          className="btn-submit-exam"
          onClick={handleSubmitExam}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Đang chấm điểm...' : 'Nộp bài thi'}
        </button>
      </div>

      <div className="exam-main">
        <div className="exam-title-bar">
          <div>
            <h2>{examData?.title || 'Bài thi trắc nghiệm'}</h2>
            <p className="exam-subtitle">
              Môn thi: <strong>{examData?.subject || 'Toán học'}</strong> • Tổng số: {questions.length} câu trắc nghiệm
            </p>
          </div>

          {!isFullscreen && (
            <button className="btn-fullscreen-toggle" onClick={enterFullscreen}>
              🖥️ Bật Toàn màn hình (Fullscreen)
            </button>
          )}
        </div>

        <div className="questions-container">
          {questions.map((q, qIdx) => (
            <div key={q._id} id={`question-card-${qIdx}`} className="question-card">
              <div className="question-header-row">
                <span className="question-number">Câu {qIdx + 1}</span>
                <span className="question-points">({q.points || 1} điểm)</span>
              </div>
              <p className="question-text">{q.questionText}</p>

              <div className="options-list">
                {q.options?.map((opt) => {
                  const isSelected = answers[q._id] === opt.key;
                  return (
                    <label
                      key={opt.key}
                      className={`option-item ${isSelected ? 'selected' : ''}`}
                      onClick={() => handleSelectAnswer(q._id, opt.key)}
                    >
                      <input
                        type="radio"
                        name={`q-${q._id}`}
                        checked={isSelected}
                        onChange={() => {}}
                      />
                      <span className="option-label">{opt.key}.</span>
                      <span className="option-content">{opt.content}</span>
                      {opt.isPinned && (
                        <span className="pinned-badge" title="Đáp án cố định vị trí">
                          📌
                        </span>
                      )}
                    </label>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {warningModal.show && (
        <div className="warning-overlay">
          <div className="warning-card">
            <div className="warning-icon">🚨</div>
            <h3>CẢNH BÁO GIAN LẬN THI CỬ</h3>
            <p>{warningModal.message}</p>
            <button
              className="btn-ack"
              onClick={() => {
                setWarningModal({ show: false, message: '' });
                enterFullscreen();
              }}
            >
              Tôi đã hiểu & Quay lại làm bài
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default TakeExam;
