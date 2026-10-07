import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { getCurrentUser, logout } from '../utils/api';
import './AdminNavbar.css';

function AdminNavbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState({ fullName: 'Quản trị viên' });
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
    }
  }, []);

  const isActive = (path) => {
    return location.pathname === path ? 'admin-nav-link active' : 'admin-nav-link';
  };

  return (
    <nav className="admin-navbar">
      <div className="admin-navbar-container">
        <div className="admin-navbar-logo">
          <Link to="/admin">
            Quizzing <span>Admin</span>
          </Link>
        </div>

        <ul className="admin-navbar-menu">
          <li>
            <Link to="/admin" className={isActive('/admin')}>
              Tổng quan
            </Link>
          </li>
          <li>
            <Link to="/admin/classes" className={isActive('/admin/classes')}>
              Quản lý Lớp học
            </Link>
          </li>
          <li>
            <Link to="/admin/users" className={isActive('/admin/users')}>
              Người dùng & Giáo viên
            </Link>
          </li>
        </ul>

        <div className="admin-navbar-profile" onClick={() => setShowDropdown(!showDropdown)}>
          <div className="profile-info">
            <span className="profile-role">Admin</span>
            <span className="profile-name">{user.fullName || user.username}</span>
          </div>
          <div className="profile-avatar">
            {user.fullName ? user.fullName.charAt(0).toUpperCase() : 'A'}
          </div>

          {showDropdown && (
            <div className="dropdown-menu">
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

export default AdminNavbar;
