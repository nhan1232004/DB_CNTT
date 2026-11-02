import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const ENV = {
  PORT: Number(process.env.PORT || 3000),
  JWT_SECRET: process.env.JWT_SECRET || 'TDTU_IT_FACULTY_INTERNSHIP_SECRET_2026_KEY_SECURE_HMAC',
  JWT_EXPIRES_IN_DAYS: 7,
  ALLOWED_LECTURER_DOMAINS: ['@tdtu.edu.vn'],
  ALLOWED_STUDENT_DOMAINS: ['@student.tdtu.edu.vn'],
  DB_PATH: process.env.DB_PATH || path.resolve(__dirname, '../../src/data/db_cntt.sqlite'),
  REAL_STUDENTS_PATH: path.resolve(__dirname, '../../src/data/real-students.json'),
  FRONTEND_PUBLIC_PATH: path.resolve(__dirname, '../../../frontend/public'),
  FRONTEND_DIST_PATH: path.resolve(__dirname, '../../../frontend/dist'),
  FRONTEND_SRC_PATH: path.resolve(__dirname, '../../../frontend')
};
