// src/modules/student/StudentDashboard.jsx
import React from 'react';
import { signOut } from 'firebase/auth';
import { auth } from '../../config/firebase.js';
import { useNavigate } from 'react-router-dom';

export default function StudentDashboard() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/login');
  };

  return (
    <div style={{ padding: '40px', fontFamily: 'sans-serif' }}>
      <h1 style={{ color: '#003087', fontSize: '24px', fontWeight: 'bold' }}>Màn hình Sinh viên Thực tập</h1>
      <p>Chào mừng bạn đến với Cổng thông tin khai báo thực tập.</p>
      <button 
        onClick={handleLogout}
        style={{ padding: '10px 20px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', marginTop: '20px' }}
      >
        Đăng xuất
      </button>
    </div>
  );
}