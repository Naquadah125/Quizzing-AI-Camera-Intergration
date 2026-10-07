import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { getCurrentUser, logout } from '../utils/api';
import './TeacherNavbar.css';

function TeacherNavbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState({ fullName: 'Giáo viên' });
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
    }
  }, []);

  const isActive = (path) => {
    return location.pathname === path ? 'teacher-nav-link active' : 'teacher-nav-link';
  };

  return (
    <nav className="teacher-navbar">
      <div className="teacher-navbar-container">
        <div className="teacher-navbar-logo">
          <Link to="/teacher">
            Quizzing <span>Teacher</span>
          </Link>
        </div>

        <ul className="teacher-navbar-menu">
          <li>
            <Link to="/teacher" className={isActive('/teacher')}>
              Tổng quan
            </Link>
          </li>
          <li>
            <Link to="/teacher/classes" className={isActive('/teacher/classes')}>
              Lớp học của tôi
            </Link>
          </li>
          <li>
            <Link to="/teacher/create-exam" className={isActive('/teacher/create-exam')}>
              Tạo bài thi mới
            </Link>
          </li>
          <li>
            <Link to="/teacher/live-monitor" className={isActive('/teacher/live-monitor')}>
              🔴 Giám sát Realtime
            </Link>
          </li>
        </ul>

        <div className="teacher-navbar-profile" onClick={() => setShowDropdown(!showDropdown)}>
          <div className="profile-info">
            <span className="profile-role">Giáo viên</span>
            <span className="profile-name">{user.fullName || user.username}</span>
          </div>
          <div className="profile-avatar">
            {user.fullName ? user.fullName.charAt(0).toUpperCase() : 'G'}
          </div>

          {showDropdown && (
            <div className="dropdown-menu">
              <div className="dropdown-item" onClick={() => navigate('/teacher/classes')}>
                Danh sách lớp học
              </div>
              <div className="dropdown-item logout" onClick={logout}>
                Đăng xuất
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

export default TeacherNavbar;
