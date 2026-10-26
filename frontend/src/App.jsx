// src/App.jsx
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './store/authContext.jsx';
import PrivateRoute from './routes/PrivateRoute.jsx';
import { ROLES } from './config/constants.js';

// Import các màn hình
import Login from './modules/auth/Login.jsx';
import StudentDashboard from './modules/student/StudentDashboard.jsx';
import HandbookPage from './modules/student/HandbookPage.jsx';
import LecturerDashboard from './modules/lecturer/LecturerDashboard.jsx';

function App() {
  return (
    // Bọc AuthProvider ở ngoài cùng để mọi trang đều biết ai đang đăng nhập
    <AuthProvider> 
      <BrowserRouter>
        <Routes>
          {/* CÁC ĐƯỜNG DẪN CÔNG KHAI (Ai cũng vào được) */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/handbook" element={<HandbookPage />} />

          {/* CÁC ĐƯỜNG DẪN BẢO MẬT (Phải qua chốt PrivateRoute) */}
          
          {/* Khu vực chỉ dành cho SINH VIÊN */}
          <Route element={<PrivateRoute allowedRoles={[ROLES.STUDENT]} />}>
            <Route path="/student" element={<StudentDashboard />} />
          </Route>

          {/* Khu vực dành cho GIẢNG VIÊN và ADMIN */}
          <Route element={<PrivateRoute allowedRoles={[ROLES.LECTURER, ROLES.ADMIN]} />}>
            <Route path="/lecturer" element={<LecturerDashboard />} />
          </Route>

        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;