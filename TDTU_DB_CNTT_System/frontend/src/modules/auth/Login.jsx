// src/components/Login.jsx
import React, { useState } from 'react';
import { signInWithPopup, signOut } from 'firebase/auth';
import { auth, googleProvider } from '../../config/firebase.js';

export default function Login() {
  const [roleTab, setRoleTab] = useState('student');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Xử lý đăng nhập Google SSO
  const handleGoogleSSO = async () => {
    setError('');
    setIsLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const email = result.user.email;

      if (email.endsWith('@student.tdtu.edu.vn')) {
        alert('Đăng nhập thành công với quyền SINH VIÊN');
      } else if (email.endsWith('@tdtu.edu.vn')) {
        alert('Đăng nhập thành công với quyền GIẢNG VIÊN');
      } else {
        await signOut(auth);
        setError('Vui lòng sử dụng email TDTU (@student.tdtu.edu.vn hoặc @tdtu.edu.vn).');
      }
    } catch (error) {
      setError('Đăng nhập SSO thất bại. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  // Xử lý đăng nhập bằng tài khoản nội bộ (Firebase Auth)
  const handleInternalLogin = (e) => {
    e.preventDefault();
    alert('Chức năng đăng nhập tài khoản nội bộ đang được hoàn thiện!');
  };

  return (
    <div style={{ backgroundColor: '#f4f7f9', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: '"Inter", "Segoe UI", sans-serif', padding: '20px' }}>
      
      {/* Khung Card chính */}
      <div style={{ backgroundColor: '#ffffff', width: '100%', maxWidth: '420px', borderRadius: '16px', padding: '40px', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)', boxSizing: 'border-box' }}>
        
        {/* Header Icon & Text */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
          <div style={{ backgroundColor: '#eff6ff', padding: '12px', borderRadius: '12px' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
              <path d="M6 12v5c3 3 9 3 12 0v-5"/>
            </svg>
          </div>
        </div>
        <h2 style={{ textAlign: 'center', color: '#0f172a', fontSize: '24px', fontWeight: 'bold', margin: '0 0 8px' }}>Chào mừng đến với hệ thống</h2>
        <p style={{ textAlign: 'center', color: '#64748b', fontSize: '14px', margin: '0 0 24px' }}>Đăng nhập vào cổng thông tin quản lý thực tập TDTU.</p>

        {/* Thông báo lỗi */}
        {error && <div style={{ backgroundColor: '#fef2f2', color: '#991b1b', padding: '10px', borderRadius: '8px', fontSize: '13px', marginBottom: '16px', textAlign: 'center' }}>{error}</div>}

        {/* Tab Bộ chọn quyền */}
        <div style={{ display: 'flex', backgroundColor: '#f8fafc', padding: '4px', borderRadius: '8px', marginBottom: '24px' }}>
          <button 
            onClick={() => setRoleTab('student')}
            style={{ flex: 1, padding: '10px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', border: 'none', borderRadius: '6px', transition: 'all 0.2s', backgroundColor: roleTab === 'student' ? '#ffffff' : 'transparent', color: roleTab === 'student' ? '#2563eb' : '#64748b', boxShadow: roleTab === 'student' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}
          >
            Sinh viên
          </button>
          <button 
            onClick={() => setRoleTab('lecturer')}
            style={{ flex: 1, padding: '10px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', border: 'none', borderRadius: '6px', transition: 'all 0.2s', backgroundColor: roleTab === 'lecturer' ? '#ffffff' : 'transparent', color: roleTab === 'lecturer' ? '#2563eb' : '#64748b', boxShadow: roleTab === 'lecturer' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}
          >
            Giảng viên
          </button>
        </div>

        {/* Nút Đăng nhập Google SSO (Ưu tiên) */}
        <button 
          onClick={handleGoogleSSO}
          disabled={isLoading}
          style={{ width: '100%', padding: '10px', backgroundColor: '#ffffff', color: '#334155', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', marginBottom: '24px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}
        >
          <svg width="18" height="18" viewBox="0 0 48 48">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
          </svg>
          {isLoading ? 'Đang kết nối SSO...' : 'Đăng nhập nhanh bằng Google SSO'}
        </button>

        {/* Dòng chữ HOẶC */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
          <div style={{ flex: 1, height: '1px', backgroundColor: '#e2e8f0' }}></div>
          <span style={{ padding: '0 12px', fontSize: '12px', color: '#94a3b8' }}>HOẶC TÀI KHOẢN NỘI BỘ</span>
          <div style={{ flex: 1, height: '1px', backgroundColor: '#e2e8f0' }}></div>
        </div>

        {/* Form Đăng nhập nội bộ (Giống y hệt thiết kế) */}
        <form onSubmit={handleInternalLogin}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>ID / Email</label>
            <input 
              type="text" 
              placeholder="Nhập mã số hoặc email" 
              style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ marginBottom: '16px', position: 'relative' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>Mật khẩu</label>
            <input 
              type={showPassword ? "text" : "password"} 
              placeholder="Nhập mật khẩu" 
              style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
            />
            {/* Nút ẩn/hiện mật khẩu */}
            <button 
              type="button" 
              onClick={() => setShowPassword(!showPassword)}
              style={{ position: 'absolute', right: '12px', top: '34px', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                {showPassword ? (
                  <>
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </>
                ) : (
                  <>
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </>
                )}
              </svg>
            </button>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#64748b', cursor: 'pointer' }}>
              <input type="checkbox" style={{ cursor: 'pointer' }} /> Ghi nhớ đăng nhập
            </label>
            <a href="#" style={{ fontSize: '13px', color: '#2563eb', textDecoration: 'none', fontWeight: '600' }}>Quên mật khẩu?</a>
          </div>

          <button 
            type="submit" 
            style={{ width: '100%', padding: '12px', backgroundColor: '#2563eb', color: '#ffffff', border: 'none', borderRadius: '8px', fontSize: '15px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
          >
            Đăng nhập
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12"></line>
              <polyline points="12 5 19 12 12 19"></polyline>
            </svg>
          </button>
        </form>

        {/* Đường gạch ngang & Chữ ký bảo mật */}
        <div style={{ borderTop: '1px solid #f1f5f9', marginTop: '24px', paddingTop: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
          <span style={{ fontSize: '12px', color: '#94a3b8' }}>Hệ thống bảo mật bởi TDTU SSO</span>
        </div>
      </div>

      {/* Link hỗ trợ bên ngoài Card */}
      <div style={{ marginTop: '24px', fontSize: '13px', color: '#64748b' }}>
        Gặp sự cố khi đăng nhập? <a href="#" style={{ color: '#2563eb', textDecoration: 'none', fontWeight: '600' }}>Liên hệ hỗ trợ IT</a>
      </div>
    </div>
  );
}