import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { getCurrentUser, logout } from '../utils/api';
import './StudentNavbar.css';

function StudentNavbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState({ fullName: 'Học sinh' });
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
    }
  }, []);

  const isActive = (path) => {
    return location.pathname === path ? 'student-nav-link active' : 'student-nav-link';
  };

  return (
    <nav className="student-navbar">
      <div className="student-navbar-container">
        <div className="student-navbar-logo">
          <Link to="/student">
            Quizzing <span>Student</span>
          </Link>
        </div>

        <ul className="student-navbar-menu">
          <li>
            <Link to="/student" className={isActive('/student')}>
              Tổng quan
            </Link>
          </li>
          <li>
            <Link to="/student/exams" className={isActive('/student/exams')}>
              Phòng thi của tôi
            </Link>
          </li>
          <li>
            <Link to="/student/history" className={isActive('/student/history')}>
              Lịch sử điểm thi
            </Link>
          </li>
        </ul>

        <div className="student-navbar-profile" onClick={() => setShowDropdown(!showDropdown)}>
          <div className="profile-info">
            <span className="profile-role">Học sinh</span>
            <span className="profile-name">{user.fullName || user.username}</span>
          </div>
          <div className="profile-avatar">
            {user.fullName ? user.fullName.charAt(0).toUpperCase() : 'H'}
          </div>

          {showDropdown && (
            <div className="dropdown-menu">
              <div className="dropdown-item" onClick={() => navigate('/student/history')}>
                Xem điểm của tôi
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

export default StudentNavbar;
