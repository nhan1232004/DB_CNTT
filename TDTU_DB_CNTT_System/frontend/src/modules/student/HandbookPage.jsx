// src/modules/student/HandbookPage.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function HandbookPage() {
  const navigate = useNavigate();

  return (
    <div style={{ padding: '40px', fontFamily: '"Inter", "Segoe UI", sans-serif', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Sổ tay hướng dẫn thực tập</h1>
      <p style={{ color: '#64748b', lineHeight: 1.6 }}>
        Chào mừng bạn đến với Cổng thông tin Quản lý Thực tập TDTU. Dưới đây là các thông tin và quy định dành cho sinh viên tham gia thực tập.
      </p>
      <div style={{ marginTop: '24px' }}>
        <button
          onClick={() => navigate('/login')}
          style={{
            padding: '10px 20px',
            backgroundColor: '#2563eb',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: 500
          }}
        >
          Quay lại trang Đăng nhập
        </button>
      </div>
    </div>
  );
}
