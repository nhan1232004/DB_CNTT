# HỆ THỐNG QUẢN LÝ THỰC TẬP & BÁO CÁO HỖ TRỢ RA QUYẾT ĐỊNH (DB_CNTT)
### KHOA CÔNG NGHỆ THÔNG TIN - TRƯỜNG ĐẠI HỌC TÔN ĐỨC THẮNG (TDTU)
**Phiên bản 4.0 (Modular & Plug-and-Play Architecture) • Học kỳ 1 / 2026-2027**

---

## 🌟 TỔNG QUAN HỆ THỐNG

Dự án **DB_CNTT** là giải pháp phần mềm toàn diện hỗ trợ Khoa CNTT Trường ĐH Tôn Đức Thắng quản lý hai học phần thực tập trọng tâm: **Kiến tập công nghiệp (KTCN)** và **Tập sự nghề nghiệp (TSNN) / Dự án CNTT 1**.

Hệ thống được cải tạo toàn diện theo các nguyên tắc:
1. **Loại bỏ thủ tục giấy giới thiệu thực tập (GGT):** Tinh gọn quy trình, tập trung vào xác thực doanh nghiệp qua Mã số thuế và phê duyệt học vụ trực tiếp.
2. **Cấu trúc Module hóa Triệt để:** Tách rời mọi trang giao diện, thành phần, bộ điều khiển, dịch vụ thành các file độc lập (50 - 200 dòng), tuyệt đối không code chung vào 1 file duy nhất.
3. **Trang Đăng nhập Riêng biệt (Dedicated Login Page):** Giao diện chuẩn thương hiệu TDTU hỗ trợ Google Workspace SSO (`@tdtu.edu.vn` / `@student.tdtu.edu.vn`), Firebase Auth và bộ chuyển đổi vai trò thử nghiệm nhanh.
4. **Kiến trúc Cắm-và-Chạy (Plug-and-Play Chart Router - Hình 1):** Cho phép các đội nhóm kế thừa trong tương lai dễ dàng thêm mới biểu đồ báo cáo chỉ bằng việc thả 1 file plugin độc lập mà không sửa code lõi.
5. **Bộ dữ liệu 91 Sinh viên thực tế:** Quản lý chính xác 134 lượt đăng ký môn học và 43 sinh viên đi 2 môn đồng thời tại cùng 1 doanh nghiệp.

---

## 📁 CẤU TRÚC DỰ ÁN

```
TDTU_DB_CNTT_System/
├── docs/                                    # Toàn bộ tài liệu báo cáo & đặc tả kỹ thuật
│   ├── BAO_CAO_DU_AN_CHUYEN_NGHIEP_DB_CNTT.md  # Báo cáo chuyên nghiệp 9 chương chuẩn đại học
│   ├── HUONG_DAN_BAN_GIAO_VA_PHAT_TRIEN.md      # Cẩm nang bàn giao chi tiết cho đội nhóm kế thừa
│   ├── HUONG_DAN_TAO_CHART_PLUGIN_MOI.md        # Hướng dẫn tạo biểu đồ mới Plug-and-Play
│   └── API_SPECIFICATION.md                     # Đặc tả toàn bộ RESTful API
├── backend/                                 # Cốt lõi Backend (Node.js 24 Native)
│   ├── src/
│   │   ├── config/                          # Cấu hình biến môi trường, port, domain học vụ
│   │   ├── core/                            # HTTP Router, Auth Middleware, Response helpers
│   │   ├── database/                        # Kết nối SQLite persistent & DDL schema
│   │   ├── data/                            # File real-students.json & database file
│   │   ├── modules/                         # 7 phân hệ nghiệp vụ độc lập
│   │   │   ├── auth/                        # Quản lý đăng nhập Google SSO & Firebase RBAC
│   │   │   ├── students/                    # Quản lý 91 sinh viên, thẩm định điều kiện AUTH-03
│   │   │   ├── internship/                  # Khai báo 1 hoặc 2 môn & Tra cứu tự động MST
│   │   │   ├── bulletin/                    # Bảng tin 2 tầng & Bóc tách JD từ Email Forward
│   │   │   ├── documents/                   # Quản lý biểu mẫu BM-01 ~ BM-04 & Quy định 320h
│   │   │   ├── certificates/                # Chuẩn ngoại ngữ xét tốt nghiệp TDTU (CERT-01)
│   │   │   └── reporting/                   # Chart Router, Widget Registry, Adapter Pattern
│   │   ├── plugins/charts/                  # Các plugin biểu đồ độc lập (Plug-and-Play)
│   │   ├── routes/                          # Định tuyến API tập trung (api.router.ts)
│   │   └── server.ts                        # Entry point khởi chạy HTTP Server (45 dòng)
│   └── tests/                               # Kiểm thử tự động 11/11 tests (100% Pass)
├── frontend/                                # Phân hệ giao diện (React Framework)
│   ├── src/
│   │   ├── pages/                           # TÁCH RIÊNG TỪNG TRANG NGHIỆP VỤ
│   │   │   ├── LoginPage.tsx                # TRANG ĐĂNG NHẬP RIÊNG BIỆT (Google SSO)
│   │   │   ├── DashboardPage.tsx            # Báo cáo trực quan hóa biểu đồ ra quyết định
│   │   │   ├── DeclarationPage.tsx          # Khai báo nơi thực tập 1-2 môn & tra cứu MST
│   │   │   ├── StudentsPage.tsx             # Quản lý danh sách và lọc 91 sinh viên
│   │   │   ├── BulletinPage.tsx             # Bảng tin 2 tầng & bóc tách email JD
│   │   │   ├── DocumentsPage.tsx            # Thư viện biểu mẫu BM-01 ~ BM-04 & Quy định
│   │   │   └── AccountsPage.tsx             # Quản trị 95 tài khoản Firebase & Admin
│   │   ├── components/                      # Navbar, Sidebar, Thẩm định điều kiện SV
│   │   ├── services/                        # ApiClient kết nối toàn bộ backend API
│   │   └── App.tsx                          # Điều phối Routing giữa Login và Portal Layout
│   └── index.html                           # File HTML vỏ bọc siêu nhẹ (38 dòng)
├── docker-compose.yml                       # Triển khai Docker production 1-Click
├── Dockerfile                               # Image container hóa Node.js Fullstack
├── start-system.bat                         # Khởi chạy 1-Click trên Windows
└── README.md                                # Tài liệu giới thiệu hệ thống
```

---

## 🚀 HƯỚNG DẪN KHỞI CHẠY NHANH

### Cách 1: Khởi chạy Trực tiếp bằng Node.js (Khuyên dùng)
```powershell
# Chạy máy chủ và giao diện web
node backend/src/server.ts
```
Mở trình duyệt truy cập: **`http://localhost:3000`**

### Cách 2: Chạy trên Windows bằng file BAT 1-Click
Nhấp đúp chuột vào file:
```
start-system.bat
```

### Cách 3: Chạy Kiểm thử Tự động (Automated Tests)
```powershell
node --test backend/tests/api.test.ts
```
*(Kết quả: 11/11 Test cases Pass 100%)*

### Cách 4: Đóng gói Triển khai Docker
```powershell
docker compose up -d --build
```

---

## 🔑 TÀI KHOẢN THỬ NGHIỆM NHANH (DEMO ACCOUNTS)

Trang đăng nhập tích hợp sẵn tính năng đổi tài khoản 1-click để kiểm thử:
* **Giảng viên Quản trị (Admin):** `phamvanc@tdtu.edu.vn` (TS. Phạm Văn C)
* **Giảng viên Bộ môn (Shared Lecturer):** `tranthib@tdtu.edu.vn` (TS. Trần Thị B)
* **Sinh viên đủ điều kiện (2 môn):** `51900839@student.tdtu.edu.vn` (Võ Duy Trí - MSSV: 51900839)

---

## 👥 BÀN GIAO VÀ HỖ TRỢ KỸ THUẬT

* Xem cẩm nang bàn giao chi tiết tại: [`docs/HUONG_DAN_BAN_GIAO_VA_PHAT_TRIEN.md`](./docs/HUONG_DAN_BAN_GIAO_VA_PHAT_TRIEN.md)
* Xem hướng dẫn viết plugin biểu đồ mới tại: [`docs/HUONG_DAN_TAO_CHART_PLUGIN_MOI.md`](./docs/HUONG_DAN_TAO_CHART_PLUGIN_MOI.md)
* Xem đặc tả API tại: [`docs/API_SPECIFICATION.md`](./docs/API_SPECIFICATION.md)
* Xem bản báo cáo đồ án đầy đủ tại: [`docs/BAO_CAO_DU_AN_CHUYEN_NGHIEP_DB_CNTT.md`](./docs/BAO_CAO_DU_AN_CHUYEN_NGHIEP_DB_CNTT.md)
