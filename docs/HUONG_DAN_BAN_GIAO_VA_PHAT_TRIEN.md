# TÀI LIỆU HƯỚNG DẪN BÀN GIAO & PHÁT TRIỂN HỆ THỐNG DB_CNTT
## HỆ THỐNG QUẢN LÝ THỰC TẬP, TỰ ĐỘNG HÓA JD & HỖ TRỢ RA QUYẾT ĐỊNH
### KHOA CÔNG NGHỆ THÔNG TIN - TRƯỜNG ĐẠI HỌC TÔN ĐỨC THẮNG (TDTU)

---

## 1. MỤC TIÊU VÀ ĐỊNH HƯỚNG THIẾT KẾ BỀN VỮNG

Dự án **DB_CNTT** được thiết kế theo các tiêu chuẩn kỹ thuật nghiêm ngặt nhằm phục vụ mục tiêu **bàn giao trơn tru** cho các đội nhóm sinh viên, giảng viên và kỹ sư tiếp theo:
1. **Module hóa triệt để (True Modularity):** Tuyệt đối không nhồi nhét code vào một file duy nhất. Mỗi trang (page), thành phần (component), dịch vụ (service), bộ điều khiển (controller) đều tách biệt thành từng file từ 50 đến 250 dòng.
2. **Kiến trúc Cắm-và-Chạy (Plug-and-Play Engine):** Sử dụng mô hình **Chart Router (Hình 1)** kết hợp với **Widget Registry** và **Adapter Pattern**, cho phép mở rộng thêm báo cáo mới mà không chạm vào mã nguồn lõi.
3. **Cốt lõi Node.js native & React framework:** Backend chạy Node 24 native tốc độ microsecond, zero-dependency ngoài các chuẩn hệ điều hành. Frontend React 18 với giao diện chuẩn nhận diện đại học TDTU.
4. **Bảo mật kép (Dual Authentication):** Hỗ trợ Google Workspace SSO giới hạn nghiêm ngặt domain `@tdtu.edu.vn` (Giảng viên) và `@student.tdtu.edu.vn` (Sinh viên) kết hợp Firebase Auth tập trung 95 tài khoản thực tế.

---

## 2. CẤU TRÚC THƯ MỤC HỆ THỐNG CHUẨN DOANH NGHIỆP

```
TDTU_DB_CNTT_System/
├── docs/                                    # Tài liệu báo cáo, kiến trúc, API và hướng dẫn
│   ├── BAO_CAO_DU_AN_CHUYEN_NGHIEP_DB_CNTT.md
│   ├── HUONG_DAN_BAN_GIAO_VA_PHAT_TRIEN.md
│   ├── HUONG_DAN_TAO_CHART_PLUGIN_MOI.md
│   └── API_SPECIFICATION.md
├── backend/                                 # Cốt lõi Node.js API Gateway & Reporting Engine
│   ├── package.json
│   ├── src/
│   │   ├── config/env.config.ts             # Biến môi trường, port, domain học vụ
│   │   ├── core/                            # HTTP Router, Middleware xác thực, Chuẩn hóa Response
│   │   ├── database/sqlite.db.ts            # Kết nối SQLite persistent, seed 91 SV thực tế
│   │   ├── data/real-students.json          # File dữ liệu 91 sinh viên học kỳ 1 (2026-2027)
│   │   ├── modules/                         # Các phân hệ nghiệp vụ độc lập
│   │   │   ├── auth/                        # Quản lý đăng nhập Google SSO & Firebase RBAC
│   │   │   ├── students/                    # Quản lý 91 sinh viên, thẩm định điều kiện AUTH-03
│   │   │   ├── internship/                  # Khai báo 1 hoặc 2 môn & Tra cứu tự động MST
│   │   │   ├── bulletin/                    # Bảng tin 2 tầng & Bóc tách JD từ Email Forward
│   │   │   ├── documents/                   # Quản lý biểu mẫu BM-01 ~ BM-04 & Quy định 320h
│   │   │   ├── certificates/                # Chuẩn ngoại ngữ xét tốt nghiệp TDTU (CERT-01)
│   │   │   └── reporting/                   # Chart Router, Widget Registry, Adapter Pattern
│   │   ├── plugins/charts/                  # Các plugin biểu đồ độc lập (Plug-and-Play)
│   │   │   ├── top-companies.plugin.ts
│   │   │   ├── status-pie.plugin.ts
│   │   │   ├── major-distribution.plugin.ts
│   │   │   └── salary-trend.plugin.ts
│   │   ├── routes/api.router.ts             # Bảng định tuyến API tập trung, rõ ràng
│   │   └── server.ts                        # Điểm khởi chạy HTTP Server (chỉ 45 dòng tinh gọn)
│   └── tests/api.test.ts                    # Bộ kiểm thử tự động 11/11 Test cases (100% Pass)
├── frontend/                                # Phân hệ giao diện React Framework
│   ├── package.json
│   ├── index.html                           # File HTML vỏ bọc siêu nhẹ (38 dòng)
│   └── src/
│       ├── types/index.ts                   # Định nghĩa kiểu dữ liệu dùng chung
│       ├── services/api.client.ts           # HTTP Client kết nối toàn bộ backend API
│       ├── components/common/               # Navbar, Sidebar điều hướng, Thẻ thống kê
│       ├── components/student/              # Banner thẩm định điều kiện sinh viên (AUTH-03)
│       ├── pages/
│       │   ├── LoginPage.tsx                # TRANG ĐĂNG NHẬP RIÊNG BIỆT (Google SSO TDTU)
│       │   ├── DashboardPage.tsx            # Trang báo cáo ra quyết định (Chart Router Widgets)
│       │   ├── DeclarationPage.tsx          # Trang khai báo nơi thực tập 1 hoặc 2 môn
│       │   ├── StudentsPage.tsx             # Trang danh sách và lọc 91 sinh viên
│       │   ├── BulletinPage.tsx             # Trang Bảng tin 2 tầng & Bóc tách email JD
│       │   ├── DocumentsPage.tsx            # Trang biểu mẫu BM-01 ~ BM-04 & Quy định 320h
│       │   └── AccountsPage.tsx             # Trang quản lý 95 tài khoản Firebase & Admin
│       └── App.tsx                          # Điều phối Routing giữa Login và Portal Layout
├── docker-compose.yml                       # Khởi chạy toàn bộ hệ thống bằng 1 lệnh Docker
├── Dockerfile                               # Image container hóa Fullstack Node.js + React
├── start-system.bat                         # Phím tắt khởi chạy 1-Click trên Windows
└── README.md                                # Hướng dẫn bắt đầu nhanh trong 5 phút
```

---

## 3. HƯỚNG DẪN KHỞI CHẠY & THỬ NGHIỆM

### 3.1. Chạy Trực tiếp trên Máy tính Cá nhân (Local Run)
Hệ thống sử dụng Node.js 24 native, không cần cài đặt thêm bất kỳ thư viện bên ngoài:
1. Mở PowerShell hoặc Command Prompt tại thư mục dự án.
2. Chạy lệnh:
   ```powershell
   node TDTU_DB_CNTT_System/backend/src/server.ts
   ```
3. Mở trình duyệt web truy cập:
   ```
   http://localhost:3000
   ```

### 3.2. Chạy Bộ Kiểm thử Tự động (Automated Test Suite)
Để xác minh toàn bộ logic nghiệp vụ, bảo mật RBAC, tra cứu MST, bóc tách email và phân quyền Admin:
```powershell
node --test TDTU_DB_CNTT_System/backend/tests/api.test.ts
```
*Kết quả:* **11/11 Tests Pass (100%)** trong thời gian < 1 giây.

### 3.3. Triển khai Bằng Docker (Production Ready)
```powershell
docker compose up -d --build
```

---

## 4. QUY TRÌNH KẾ THỪA VÀ PHÁT TRIỂN TIẾP THEO

### 4.1. Thêm một API Endpoint mới
1. Mở thư mục module tương ứng tại `backend/src/modules/<module-name>/`.
2. Viết hàm nghiệp vụ trong `<module-name>.service.ts`.
3. Viết hàm xử lý HTTP Request/Response trong `<module-name>.controller.ts`.
4. Đăng ký route vào `backend/src/routes/api.router.ts`.
5. Bổ sung test case vào `backend/tests/api.test.ts`.

### 4.2. Thêm một Trang Giao diện mới vào Frontend
1. Tạo component mới trong `frontend/src/pages/MyNewPage.tsx`.
2. Thêm mục menu vào `frontend/src/components/common/Sidebar.tsx`.
3. Khai báo tab trong `frontend/src/App.tsx`.

### 4.3. Thêm Biểu đồ Mới vào Dashboard (Chart Router Engine)
*Xem hướng dẫn chi tiết từng bước tại:* [`HUONG_DAN_TAO_CHART_PLUGIN_MOI.md`](./HUONG_DAN_TAO_CHART_PLUGIN_MOI.md).
Đội nhóm chỉ cần tạo duy nhất 1 file trong `backend/src/plugins/charts/`, hệ thống sẽ tự động hiển thị trên Dashboard mà không cần sửa code cũ.
