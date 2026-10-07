import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch, setCurrentUser } from '../utils/api';
import './Login.css';

function Login() {
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState('STUDENT');
  const [username, setUsername] = useState('hocsinhan');
  const [password, setPassword] = useState('123456');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRoleChange = (role) => {
    setSelectedRole(role);
    setError('');
    if (role === 'STUDENT') {
      setUsername('hocsinhan');
      setPassword('123456');
    } else if (role === 'TEACHER') {
      setUsername('thayhung');
      setPassword('123456');
    } else if (role === 'ADMIN') {
      setUsername('admin');
      setPassword('123456');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      });

      if (res.success && res.data) {
        setCurrentUser(res.data.user, res.data.token);

        const role = res.data.user.role;
        if (role === 'ADMIN') navigate('/admin');
        else if (role === 'TEACHER') navigate('/teacher');
        else navigate('/student');
      }
    } catch (err) {
      setError(err.message || 'Tài khoản hoặc mật khẩu không chính xác.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-wrapper">
        <div className="login-header">
          <h1>Đăng nhập</h1>
          <p>Hệ thống thi trắc nghiệm trực tuyến có AI giám sát</p>
        </div>

        <div className="role-selector">
          <button
            type="button"
            className={`role-btn ${selectedRole === 'STUDENT' ? 'active student' : ''}`}
            onClick={() => handleRoleChange('STUDENT')}
          >
            Học sinh
          </button>
          <button
            type="button"
            className={`role-btn ${selectedRole === 'TEACHER' ? 'active teacher' : ''}`}
            onClick={() => handleRoleChange('TEACHER')}
          >
            Giáo viên
          </button>
          <button
            type="button"
            className={`role-btn ${selectedRole === 'ADMIN' ? 'active admin' : ''}`}
            onClick={() => handleRoleChange('ADMIN')}
          >
            Quản trị viên
          </button>
        </div>

        {error && <div className="login-error-alert">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">Tên đăng nhập</label>
            <input
              id="username"
              type="text"
              placeholder="Nhập username của bạn..."
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Mật khẩu</label>
            <input
              id="password"
              type="password"
              placeholder="Nhập mật khẩu..."
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="account-hint-box">
            <span>💡 Tài khoản mẫu gợi ý: </span>
            <code>{username}</code> / <code>123456</code>
          </div>

          <button type="submit" className="btn-submit" disabled={loading}>
            {loading ? 'Đang xác thực...' : 'Đăng nhập vào hệ thống'}
          </button>
        </form>

        <div className="login-footer">
          <p>Thi cử công bằng • Giám sát AI Client-side • Bảo mật dữ liệu</p>
        </div>
      </div>
    </div>
  );
}

export default Login;
