// src/config/constants.js

// Danh sách mã Role (Có thể thêm mới bất kỳ lúc nào)
export const ROLES = {
  STUDENT: 'STUDENT',
  LECTURER: 'LECTURER',
  ADMIN: 'ADMIN',
  COMPANY: 'COMPANY', // Dùng chung cho TẤT CẢ các công ty đối tác
};

// Bảng ánh xạ điều hướng
export const ROLE_REDIRECT_MAP = {
  [ROLES.STUDENT]: '/student',
  [ROLES.LECTURER]: '/lecturer',
  [ROLES.ADMIN]: '/lecturer', // Admin tạm thời dùng chung dashboard với Giảng viên
  [ROLES.COMPANY]: '/company',
};

// Trang dành cho SV không có trong danh sách môn kỳ này
export const UNENROLLED_STUDENT_REDIRECT = '/handbook';