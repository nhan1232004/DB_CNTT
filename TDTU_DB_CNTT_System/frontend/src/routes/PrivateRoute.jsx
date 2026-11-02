// src/routes/PrivateRoute.jsx
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../store/authContext.jsx';

// allowedRoles là mảng chứa các quyền được phép vào trang (VD: ['STUDENT'])
export default function PrivateRoute({ allowedRoles }) {
  const { currentUser, userRole } = useAuth();

  // 1. Nếu chưa có thông tin đăng nhập -> Đá văng về trang Login
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  // 2. Đã đăng nhập, nhưng Role KHÔNG khớp với danh sách cho phép -> Báo lỗi hoặc chặn
  if (allowedRoles && !allowedRoles.includes(userRole)) {
    // Chặn sinh viên lén gõ URL /lecturer và ngược lại
    alert("Bạn không có quyền truy cập vào đường dẫn này!");
    return <Navigate to="/login" replace />;
  }

  // 3. Vượt qua mọi bài kiểm tra -> Cho phép hiển thị trang (Outlet)
  return <Outlet />;
}