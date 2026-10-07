import React, { useState, useEffect } from 'react';
import TeacherNavbar from '../../components/TeacherNavbar';
import { apiFetch } from '../../utils/api';
import './TeacherOverview.css';

function TeacherClasses() {
  const [classes, setClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showAddModal, setShowAddModal] = useState(false);
  const [newStudent, setNewStudent] = useState({
    username: '',
    password: '',
    fullName: '',
    studentCode: '',
  });

  const loadClasses = async () => {
    try {
      const res = await apiFetch('/classes');
      if (res.success && res.data.length > 0) {
        setClasses(res.data);
        setSelectedClassId(res.data[0]._id);
      }
    } catch (err) {
      console.error('Lỗi tải danh sách lớp:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClasses();
  }, []);

  useEffect(() => {
    if (!selectedClassId) return;

    const loadStudents = async () => {
      try {
        const res = await apiFetch(`/classes/${selectedClassId}/students`);
        if (res.success) {
          setStudents(res.data || []);
        }
      } catch (err) {
        console.error('Lỗi tải học sinh:', err);
      }
    };

    loadStudents();
  }, [selectedClassId]);

  const handleCreateStudent = async (e) => {
    e.preventDefault();
    if (!selectedClassId) return;

    try {
      const res = await apiFetch('/users/students', {
        method: 'POST',
        body: JSON.stringify({
          ...newStudent,
          classId: selectedClassId,
        }),
      });

      if (res.success) {
        alert('Tạo tài khoản học sinh thành công và đã tự động gán vào lớp!');
        setShowAddModal(false);
        setNewStudent({ username: '', password: '', fullName: '', studentCode: '' });

        const studentsRes = await apiFetch(`/classes/${selectedClassId}/students`);
        if (studentsRes.success) setStudents(studentsRes.data || []);
      }
    } catch (err) {
      alert(err.message || 'Lỗi khi tạo học sinh');
    }
  };

  return (
    <div className="teacher-bg">
      <TeacherNavbar />
      <div className="overview-container">
        <div className="overview-header">
          <h1>Quản lý Lớp học & Học sinh phụ trách</h1>
          <p>Dữ liệu được cách ly an toàn (Data Isolation) theo từng Giáo viên</p>
        </div>

        <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
          {classes.map((cls) => (
            <button
              key={cls._id}
              className={`btn-action ${selectedClassId === cls._id ? 'active-class' : ''}`}
              style={{
                backgroundColor: selectedClassId === cls._id ? '#ff6600' : 'white',
                color: selectedClassId === cls._id ? 'white' : '#333',
                borderColor: selectedClassId === cls._id ? '#ff6600' : '#e0e0e0',
                padding: '10px 20px',
                fontSize: '14px',
              }}
              onClick={() => setSelectedClassId(cls._id)}
            >
              🏫 {cls.name} ({cls.code})
            </button>
          ))}
        </div>

        <div className="recent-section">
          <div className="section-title-row">
            <h2>Danh sách học sinh ({students.length} em)</h2>
            <button
              className="btn-action"
              style={{ backgroundColor: '#ff6600', color: 'white' }}
              onClick={() => setShowAddModal(true)}
            >
              + Tạo tài khoản học sinh mới
            </button>
          </div>

          <div className="exam-table-wrapper">
            <table className="exam-table">
              <thead>
                <tr>
                  <th>Họ và tên</th>
                  <th>Tên đăng nhập</th>
                  <th>Mã học sinh</th>
                  <th>Email</th>
                  <th>Vai trò</th>
                </tr>
              </thead>
              <tbody>
                {students.length > 0 ? (
                  students.map((st) => (
                    <tr key={st._id}>
                      <td>
                        <strong>{st.fullName}</strong>
                      </td>
                      <td>
                        <code>{st.username}</code>
                      </td>
                      <td>
                        <span className="code-badge">{st.studentCode || 'Chưa cấp'}</span>
                      </td>
                      <td>{st.email || 'Chưa cập nhật'}</td>
                      <td>
                        <span className="badge badge-blue">STUDENT</span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '30px' }}>
                      Lớp này chưa có học sinh nào. Bấm nút phía trên để tạo học sinh mới.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {showAddModal && (
          <div className="warning-overlay">
            <div className="warning-card" style={{ maxWidth: '440px', textAlign: 'left' }}>
              <h3 style={{ color: '#1a1a1a', marginBottom: '16px' }}>
                Tạo học sinh mới cho lớp
              </h3>
              <form onSubmit={handleCreateStudent}>
                <div className="form-group">
                  <label>Họ và tên học sinh</label>
                  <input
                    type="text"
                    required
                    value={newStudent.fullName}
                    onChange={(e) =>
                      setNewStudent({ ...newStudent, fullName: e.target.value })
                    }
                    placeholder="Ví dụ: Hoàng Gia Bảo"
                  />
                </div>
                <div className="form-group">
                  <label>Tên đăng nhập (Username)</label>
                  <input
                    type="text"
                    required
                    value={newStudent.username}
                    onChange={(e) =>
                      setNewStudent({ ...newStudent, username: e.target.value })
                    }
                    placeholder="Ví dụ: hocsinhbao"
                  />
                </div>
                <div className="form-group">
                  <label>Mật khẩu khởi tạo</label>
                  <input
                    type="password"
                    required
                    value={newStudent.password}
                    onChange={(e) =>
                      setNewStudent({ ...newStudent, password: e.target.value })
                    }
                    placeholder="Mật khẩu tối thiểu 6 ký tự"
                  />
                </div>
                <div className="form-group">
                  <label>Mã định danh học sinh (Tùy chọn)</label>
                  <input
                    type="text"
                    value={newStudent.studentCode}
                    onChange={(e) =>
                      setNewStudent({ ...newStudent, studentCode: e.target.value })
                    }
                    placeholder="Ví dụ: HS1205"
                  />
                </div>
                <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                  <button
                    type="button"
                    className="btn-cancel"
                    style={{ flex: 1 }}
                    onClick={() => setShowAddModal(false)}
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="btn-submit"
                    style={{ flex: 1, backgroundColor: '#ff6600' }}
                  >
                    Tạo & Gán vào lớp
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default TeacherClasses;
