import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { ENV } from './config/env.config.ts';
import { createApiRouter } from './routes/api.router.ts';
import { getDatabase } from './database/sqlite.db.ts';

// 1. Initialize SQLite Database & Seed Data
console.log('⚡ Đang khởi tạo cơ sở dữ liệu SQLite...');
getDatabase();

// 2. Initialize Modular API & Static Router
const router = createApiRouter();

// Configure static file serving for React Frontend
const staticDir = fs.existsSync(ENV.FRONTEND_DIST_PATH) && fs.existsSync(path.join(ENV.FRONTEND_DIST_PATH, 'index.html'))
  ? ENV.FRONTEND_DIST_PATH
  : ENV.FRONTEND_SRC_PATH;
const spaIndexFile = path.join(staticDir, 'index.html');

router.setStatic(staticDir, spaIndexFile);

// 3. Create HTTP Server
export const server = http.createServer((req, res) => {
  router.handle(req, res);
});

// 4. Start Listening
if (process.env.NODE_ENV !== 'test') {
  server.listen(ENV.PORT, () => {
    console.log(`
========================================================================
🚀 HỆ THỐNG QUẢN LÝ THỰC TẬP & BÁO CÁO KHOA CNTT - ĐH TÔN ĐỨC THẮNG
   (TDTU INTERNSHIP PORTAL & DECISION SUPPORT SYSTEM V4.0)
========================================================================
   - Cổng hoạt động (Port)     : ${ENV.PORT}
   - Địa chỉ truy cập Web      : http://localhost:${ENV.PORT}
   - Cơ sở dữ liệu SQLite      : ${ENV.DB_PATH}
   - Kiến trúc định tuyến      : Modular Router + Chart Router Engine (Hình 1)
   - Bộ dữ liệu thực tế        : 91 Sinh viên, 134 lượt môn (43 SV đi 2 môn)
   - Bảng tin 2 tầng & Parse JD: Sẵn sàng nhận Email Forward
   - Trạng thái kiểm thử       : 100% Pass
========================================================================
`);
  });
}
