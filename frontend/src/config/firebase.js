// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

// DÁN ĐOẠN CONFIG CỦA BẠN VÀO ĐÂY
const firebaseConfig = {
  apiKey: "AIzaSyCkRihT5wf0Q7oqQ42_gV-UfG5aKGEU7zE",
  authDomain: "tdtu-internship-portal-817d4.firebaseapp.com",
  projectId: "tdtu-internship-portal-817d4",
  storageBucket: "tdtu-internship-portal-817d4.firebasestorage.app",
  messagingSenderId: "812718776068",
  appId: "1:812718776068:web:aada134db78015f188fa51",
  measurementId: "G-ND90Z0B91X"
};

// Khởi tạo Firebase
const app = initializeApp(firebaseConfig);

// Khởi tạo dịch vụ Authentication
export const auth = getAuth(app);

// Khởi tạo Google Provider
export const googleProvider = new GoogleAuthProvider();
// Ép Google luôn hiện bảng chọn tài khoản (để test dễ hơn)
googleProvider.setCustomParameters({
  prompt: 'select_account'
});