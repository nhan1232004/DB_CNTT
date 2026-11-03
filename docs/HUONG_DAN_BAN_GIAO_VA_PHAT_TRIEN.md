# TÀI LIỆU HƯỚNG DẪN BÀN GIAO & PHÁT TRIỂN HỆ THỐNG DB_CNTT
## HỆ THỐNG QUẢN LÝ THỰC TẬP, TỰ ĐỘNG HÓA JD & HỖ TRỢ RA QUYẾT ĐỊNH (100% TYPESCRIPT)
### KHOA CÔNG NGHỆ THÔNG TIN - TRƯỜNG ĐẠI HỌC TÔN ĐỨC THẮNG (TDTU)

---

## 1. MỤC TIÊU VÀ ĐỊNH HƯỚNG THIẾT KẾ BỀN VỮNG

Dự án **DB_CNTT (`v3.2.0`)** được thiết kế theo các tiêu chuẩn kỹ thuật nghiêm ngặt nhằm phục vụ mục tiêu **bàn giao trơn tru** cho các đội nhóm sinh viên, giảng viên và kỹ sư kế thừa (2026 – 2031):
1. **Đồng nhất 100% TypeScript (`.ts` & `.tsx`):** Toàn bộ Backend, Frontend (22 tệp `.ts`/`.tsx`) và Gói minh chứng kiến trúc (`Adapter_Code/`) đều viết bằng TypeScript.
2. **Module hóa triệt để (True Modularity & Clean 3-Tier Architecture):** Tuyệt đối không nhồi nhét code vào một file duy nhất. Mỗi trang (`pages/*.tsx`), thành phần (`components/**/*.tsx`), dịch vụ (`services/*.ts`), bộ điều khiển (`controllers/*.ts`) đều tách biệt rõ ràng.
3. **Kiến trúc Cắm-và-Chạy (Plug-and-Play Engine):** Sử dụng mô hình **Chart Router** kết hợp với **Widget Registry** và **Adapter Pattern**, cho phép mở rộng thêm báo cáo mới mà không chạm vào mã nguồn lõi.
4. **Cốt lõi Node.js 24 native & React 18 TypeScript:** Backend chạy Node 24 native với cờ `--experimental-strip-types` tốc độ cao, zero-dependency bên ngoài. Frontend React 18 với giao diện chuẩn nhận diện đại học TDTU (`#003087`, `#dc2626`, `#ffffff`, `#1f2937`).
5. **Bảo mật kép & Phân quyền Toán học (Dual Auth + Prime RBAC):** Hỗ trợ Google Workspace SSO giới hạn nghiêm ngặt domain `@tdtu.edu.vn` (Giảng viên) và `@student.tdtu.edu.vn` (Sinh viên) kết hợp Firebase Auth và Ma trận phân quyền tích số nguyên tố (`prime-rbac.ts`).

---

## 2. CẤU TRÚC THƯ MỤC HỆ THỐNG CHUẨN DOANH NGHIỆP

```text
Dashoard_TSNN-main/
├── TDTU_DB_CNTT_System/
│   ├── backend/                                 # Cốt lõi Node.js API Gateway & Reporting Engine (.ts)
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── src/
│   │   │   ├── config/env.config.ts             # Biến môi trường, port, domain học vụ
│   │   │   ├── controllers/                     # 8 Controllers xử lý HTTP Request/Response (.ts)
│   │   │   ├── data/                            # SQLite DB (db_cntt.sqlite) & real-students.json
│   │   │   ├── middlewares/                     # middleware.ts & prime-rbac.ts
│   │   │   ├── models/                          # sqlite.db.ts, types.ts, reporting.contracts.ts
│   │   │   ├── routes/                          # api.router.ts & http-router.ts
│   │   │   ├── services/                        # Các phân hệ nghiệp vụ độc lập (.ts)
│   │   │   │   ├── charts/                      # Các plugin biểu đồ độc lập (Plug-and-Play)
│   │   │   │   │   ├── top-companies.plugin.ts
│   │   │   │   │   ├── status-pie.plugin.ts
│   │   │   │   │   ├── major-distribution.plugin.ts
│   │   │   │   │   └── salary-trend.plugin.ts
│   │   │   │   ├── auth.service.ts              # Quản lý đăng nhập Google SSO & Firebase RBAC
│   │   │   │   ├── students.service.ts          # Quản lý 91 sinh viên, lọc theo học kỳ, đồng bộ DN
│   │   │   │   ├── internship.service.ts        # Khai báo 1 hoặc 2 môn & Tra cứu tự động MST
│   │   │   │   ├── bulletin.service.ts          # Bảng tin 2 tầng & Ứng tuyển JD
│   │   │   │   ├── email-parser.ts              # Bóc tách JD tự động từ Email Forward
│   │   │   │   ├── documents.service.ts         # Quản lý biểu mẫu BM-01 ~ BM-04 & Quy định 320h
│   │   │   │   ├── certificates.service.ts      # Chuẩn ngoại ngữ xét tốt nghiệp TDTU (CERT-01)
│   │   │   │   ├── notification.service.ts      # Thông báo phân quyền & Anti-Spam Filter
│   │   │   │   ├── chart-router.ts              # Bộ định tuyến biểu đồ (Chart Router)
│   │   │   │   ├── widget-registry.ts           # Danh mục biểu đồ tự động (Widget Registry)
│   │   │   │   ├── company-data.adapter.ts      # Chuẩn hóa dữ liệu doanh nghiệp Schema V1/V2
│   │   │   │   └── tax-lookup.adapter.ts        # Tra cứu pháp lý doanh nghiệp theo MST
│   │   │   ├── utils/response.ts
│   │   │   └── server.ts                        # Điểm khởi chạy HTTP Server (Port 3000)
│   │   └── tests/                               # Bộ kiểm thử tự động Backend & RBAC (9/9 Pass)
│   │       ├── api.test.ts
│   │       └── prime-rbac.test.ts
│   └── frontend/                                # Phân hệ giao diện React 18 TypeScript (.ts / .tsx)
│       ├── package.json
│       ├── tsconfig.json
│       ├── index.html                           # HTML Host cấu hình Babel 8 TSX Runtime
│       ├── data/                                # Dữ liệu mẫu JSON & Excel GPA
│       └── src/
│           ├── types/index.ts                   # Hợp đồng kiểu dữ liệu TypeScript dùng chung
│           ├── config/firebase.config.ts        # Kết nối Firebase Auth & Cloud Firestore
│           ├── services/
│           │   ├── api.client.ts                # HTTP Client, Firestore Sync & Offline Fallback
│           │   └── prime-rbac.ts                # Kiểm tra quyền nguyên tố phía Client
│           ├── components/
│           │   ├── common/                      # AdminNotificationModal.tsx, Navbar.tsx, Sidebar.tsx
│           │   └── student/                     # StudentEligibilityBanner.tsx
│           ├── pages/                           # 14 Trang chức năng nghiệp vụ (.tsx)
│           │   ├── LoginPage.tsx
│           │   ├── DashboardPage.tsx
│           │   ├── DeclarationPage.tsx
│           │   ├── StudentsPage.tsx
│           │   ├── BulletinPage.tsx
│           │   ├── EmailJdPage.tsx
│           │   ├── CertificatesPage.tsx
│           │   ├── DocumentsPage.tsx
│           │   ├── SemestersPage.tsx
│           │   ├── ImportDataPage.tsx
│           │   ├── ExportDataPage.tsx
│           │   ├── ProfilePage.tsx
│           │   ├── HandbookPage.tsx
│           │   └── AccountsPage.tsx
│           ├── App.tsx                          # Điều phối Routing & Popup Thông báo Sinh viên
│           └── index.css                        # Stylesheet chuẩn TDTU & @media print A4
├── Adapter_Code/reporting-adapter-demo/         # Gói Demo Độc lập Chart Router & Adapter (15/15 Pass)
├── docs/                                        # Tài liệu báo cáo, kiến trúc, API và hướng dẫn
├── Dockerfile & docker-compose.yml              # Container hóa Fullstack Node.js + React TypeScript
├── firebase.json & firestore.rules              # Cấu hình Firebase Hosting & Bảo mật Firestore
├── package.json                                 # Scripts điều khiển toàn dự án
├── start-local.bat                              # Phím tắt khởi chạy 1-Click trên Windows
└── README.md                                    # Hướng dẫn tổng thể dự án
```

---

## 3. HƯỚNG DẪN KHỞI CHẠY & KIỂM THỬ

### 3.1. Chạy Trực tiếp trên Máy tính Cá nhân (Local Run)
1. Nhấp đúp vào `start-local.bat` trên Windows, hoặc mở PowerShell / Terminal tại thư mục gốc `Dashoard_TSNN-main` và chạy:
   ```powershell
   npm start
   ```
2. Mở trình duyệt web truy cập:
   ```text
   http://localhost:3000
   ```

### 3.2. Chạy Bộ Kiểm thử Tự động (24/24 Automated Tests)
Để xác minh toàn bộ logic nghiệp vụ Backend API, phân quyền Prime RBAC, tra cứu MST, chống spam thông báo và kiến trúc Chart Router / Adapter V1-V2:
```powershell
npm test
```
*Kết quả:* **24/24 Tests Pass (100%)** (`6 API tests` + `3 Prime RBAC tests` + `15 Adapter & Chart Router tests`).

### 3.3. Triển khai Lên Firebase Hosting (Production)
```powershell
npm run deploy:firebase
```
Ứng dụng trực tuyến được cập nhật ngay tại: https://dashboard-39cf8.web.app

---

## 4. QUY TRÌNH KẾ THỪA VÀ PHÁT TRIỂN TIẾP THEO

### 4.1. Thêm một API Endpoint mới (Backend TypeScript)
1. Viết hàm xử lý nghiệp vụ trong `TDTU_DB_CNTT_System/backend/src/services/<ten-phan-he>.service.ts`.
2. Viết hàm xử lý HTTP Request/Response trong `TDTU_DB_CNTT_System/backend/src/controllers/<ten-phan-he>.controller.ts`.
3. Đăng ký route vào `TDTU_DB_CNTT_System/backend/src/routes/api.router.ts`.
4. Bổ sung test case vào `TDTU_DB_CNTT_System/backend/tests/api.test.ts` và chạy `npm test`.

### 4.2. Thêm một Trang Giao diện mới (Frontend TypeScript)
1. Tạo component mới tại `TDTU_DB_CNTT_System/frontend/src/pages/MyNewPage.tsx` và gắn vào `(window as any).MyNewPage = MyNewPage;`.
2. Khai báo thẻ `<script type="text/babel" data-presets="tsx" src="./src/pages/MyNewPage.tsx?v=..."></script>` trong `TDTU_DB_CNTT_System/frontend/index.html`.
3. Thêm mục điều hướng vào `Sidebar.tsx` và `App.tsx`.

### 4.3. Thêm Biểu đồ Mới vào Dashboard (Chart Router Engine)
Xem hướng dẫn chi tiết từng bước tại [`HUONG_DAN_TAO_CHART_PLUGIN_MOI.md`](./HUONG_DAN_TAO_CHART_PLUGIN_MOI.md). Đội nhóm chỉ cần tạo duy nhất 01 file `.ts` trong `TDTU_DB_CNTT_System/backend/src/services/charts/`, hệ thống sẽ tự động hiển thị trên Dashboard mà không cần sửa code cũ.
