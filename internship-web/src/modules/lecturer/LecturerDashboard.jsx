// src/modules/lecturer/LecturerDashboard.jsx
import React from 'react';
import { signOut } from 'firebase/auth';
import { auth } from '../../firebase.js';
import { useNavigate } from 'react-router-dom';

export default function LecturerDashboard() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/login');
  };

  return (
    <div style={{ padding: '40px', fontFamily: 'sans-serif' }}>
      <h1 style={{ color: '#16a34a' }}>👨‍🏫 Màn hình Giảng viên & Admin</h1>
      <p>Khu vực thống kê và quản lý tiến độ thực tập của sinh viên.</p>
      <button 
        onClick={handleLogout}
        style={{ padding: '10px 20px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', marginTop: '20px' }}
      >
        Đăng xuất
      </button>
    </div>
  );
}