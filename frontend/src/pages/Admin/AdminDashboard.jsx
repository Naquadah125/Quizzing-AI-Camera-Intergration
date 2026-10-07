import React, { useState, useEffect } from 'react';
import AdminNavbar from '../../components/AdminNavbar';
import { apiFetch, getCurrentUser } from '../../utils/api';
import '../Teacher/TeacherOverview.css';

function AdminDashboard() {
  const [user, setUser] = useState({});
  const [classes, setClasses] = useState([]);
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const u = getCurrentUser();
    if (u) setUser(u);

    const loadData = async () => {
      try {
        const [clsRes, exRes] = await Promise.all([
          apiFetch('/classes'),
          apiFetch('/exams'),
        ]);

        if (clsRes.success) setClasses(clsRes.data || []);
        if (exRes.success) setExams(exRes.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  return (
    <div className="teacher-bg">
      <AdminNavbar />
      <div className="overview-container">
        <div className="overview-header">
          <h1>Hệ thống Quản Trị Viên (Admin) 🛡️</h1>
          <p>Quyền cao nhất trong hệ thống - Quản lý Giáo viên, Học sinh, và Lớp học toàn trường</p>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <h3>Tổng số Lớp học</h3>
            <p className="stat-number">{classes.length}</p>
          </div>
          <div className="stat-card">
            <h3>Tổng số Đề thi</h3>
            <p className="stat-number text-orange">{exams.length}</p>
          </div>
          <div className="stat-card">
            <h3>Hệ thống Giám sát AI</h3>
            <p className="stat-number" style={{ color: '#00b894' }}>Active</p>
          </div>
          <div className="stat-card">
            <h3>Quy tắc Data Isolation</h3>
            <p className="stat-number" style={{ color: '#7c3aed' }}>Strict</p>
          </div>
        </div>

        <div className="recent-section">
          <h2>Danh sách tất cả các Lớp học trong trường</h2>
          <div className="exam-table-wrapper">
            <table className="exam-table">
              <thead>
                <tr>
                  <th>Tên lớp</th>
                  <th>Mã lớp</th>
                  <th>Khối</th>
                  <th>Niên khóa</th>
                  <th>Người phụ trách / tạo</th>
                </tr>
              </thead>
              <tbody>
                {classes.map((cls) => (
                  <tr key={cls._id}>
                    <td><strong>{cls.name}</strong></td>
                    <td><span className="code-badge">{cls.code}</span></td>
                    <td>Khối {cls.grade}</td>
                    <td>{cls.academicYear}</td>
                    <td>{cls.createdBy?.fullName || 'Admin'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
