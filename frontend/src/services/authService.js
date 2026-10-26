// src/services/authService.js
import { signInWithPopup, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth, googleProvider } from '../config/firebase.js';
import { ROLE_REDIRECT_MAP, UNENROLLED_STUDENT_REDIRECT, ROLES } from '../config/constants.js';

// Lấy link API Gateway từ biến môi trường
const API_URL = import.meta.env.VITE_API_GATEWAY_URL;

/**
 * [THỰC TẾ] GỌI XUỐNG AUTH MICROSERVICE ĐỂ XÁC THỰC
 */
const verifyUserFromBackend = async (firebaseIdToken) => {
  try {
    const response = await fetch(`${API_URL}/auth/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${firebaseIdToken}` 
      }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Hệ thống từ chối quyền truy cập.');
    }

    return data;
  } catch (error) {
    console.error("Lỗi kết nối Backend Auth Service:", error);
    throw new Error('Lỗi kết nối đến máy chủ. Vui lòng thử lại sau.');
  }
};

/**
 * XỬ LÝ CHUYỂN HƯỚNG & LƯU TRẠNG THÁI
 */
const processPostAuthentication = async (firebaseUser) => {
  const idToken = await firebaseUser.getIdToken();
  const accessData = await verifyUserFromBackend(idToken);

  if (!accessData.isAuthorized) {
    await signOut(auth);
    throw new Error('Tài khoản không thuộc hệ thống hoặc bị khóa.');
  }

  // 1. LƯU ROLE VÀO BỘ NHỚ TRÌNH DUYỆT ĐỂ GIỮ PHIÊN KHI F5
  localStorage.setItem('userRole', accessData.role);

  // 2. Thực tế: Lưu thêm Access Token của Backend trả về
  if (accessData.backendToken) {
    localStorage.setItem('accessToken', accessData.backendToken);
  }

  // 3. Xử lý điều hướng
  if (accessData.role === ROLES.STUDENT && !accessData.isEnrolled) {
    return {
      redirectUrl: UNENROLLED_STUDENT_REDIRECT
    };
  }

  const targetUrl = ROLE_REDIRECT_MAP[accessData.role] || '/login';
  
  return {
    redirectUrl: targetUrl
  };
};

// Kênh 1: Google SSO
export const loginWithGoogle = async () => {
  const result = await signInWithPopup(auth, googleProvider);
  return await processPostAuthentication(result.user);
};

// Kênh 2: Nội bộ
export const loginWithInternalAccount = async (email, password) => {
  const result = await signInWithEmailAndPassword(auth, email, password);
  return await processPostAuthentication(result.user);
};

// Đăng xuất
export const logoutUser = async () => {
  await signOut(auth);
  
  // XÓA SẠCH DỮ LIỆU KHI ĐĂNG XUẤT
  localStorage.removeItem('userRole');
  localStorage.removeItem('accessToken');
};