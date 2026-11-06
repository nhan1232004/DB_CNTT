import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DEFAULT_SECRET = 'TDTU_IT_FACULTY_INTERNSHIP_SECRET_2026_KEY_SECURE_HMAC';

if (process.env.NODE_ENV === 'production') {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET === DEFAULT_SECRET || process.env.JWT_SECRET.length < 32) {
    throw new Error('FATAL SECURITY ERROR: Yêu cầu biến môi trường JWT_SECRET riêng biệt (tối thiểu 32 ký tự) khi chạy Production.');
  }
}

export const ENV = {
  PORT: Number(process.env.PORT || 3000),
  JWT_SECRET: process.env.JWT_SECRET || DEFAULT_SECRET,
  JWT_EXPIRES_IN_DAYS: 7,
  ALLOWED_LECTURER_DOMAINS: ['@tdtu.edu.vn'],
  ALLOWED_STUDENT_DOMAINS: ['@student.tdtu.edu.vn'],
  DB_PATH: process.env.DB_PATH || path.resolve(__dirname, '../data/db_cntt.sqlite'),
  REAL_STUDENTS_PATH: process.env.REAL_STUDENTS_PATH || path.resolve(__dirname, '../data/real-students.json'),
  FRONTEND_PUBLIC_PATH: path.resolve(__dirname, '../../../frontend/public'),
  FRONTEND_DIST_PATH: path.resolve(__dirname, '../../../frontend/dist'),
  FRONTEND_SRC_PATH: path.resolve(__dirname, '../../../frontend')
};
