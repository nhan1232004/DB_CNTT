// src/store/authContext.jsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../config/firebase.js';

// Khởi tạo Context
const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true); // Trạng thái chờ Firebase kiểm tra

  useEffect(() => {
    // onAuthStateChanged là hàm của Firebase, tự động chạy khi web bật lên hoặc user F5
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // Đã đăng nhập -> Lấy Role từ LocalStorage ra
        const storedRole = localStorage.getItem('userRole');
        setCurrentUser(user);
        setUserRole(storedRole);
      } else {
        // Chưa đăng nhập hoặc đã đăng xuất
        setCurrentUser(null);
        setUserRole(null);
        localStorage.removeItem('userRole');
      }
      // Kiểm tra xong thì tắt loading
      setLoading(false); 
    });

    // Dọn dẹp listener khi component unmount
    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ currentUser, userRole }}>
      {/* Chỉ render các trang web khi Firebase đã kiểm tra xong (loading = false) */}
      {!loading && children}
    </AuthContext.Provider>
  );
};

// Hook rút gọn để các file khác dễ dàng lấy dữ liệu user
export const useAuth = () => useContext(AuthContext);