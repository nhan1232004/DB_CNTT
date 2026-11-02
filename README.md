# 🎓 CỔNG THÔNG TIN THỰC TẬP TSNN & KTCN - KHOA CNTT ĐH TÔN ĐỨC THẮNG
> **TDTU Internship Portal & Decision Support System (Clean Fullstack Architecture)**

Hệ thống quản lý, phân bổ và hỗ trợ ra quyết định về thực tập doanh nghiệp (Kiến tập công nghiệp - KTCN & Tập sự nghề nghiệp - TSNN) dành cho Sinh viên, Giảng viên Cố vấn và Ban Chủ nhiệm Khoa Công nghệ Thông tin - Trường Đại học Tôn Đức Thắng.

---

## 🌟 Điểm Nổi Bật Của Hệ Thống

- **Chuẩn nhận diện TDTU Design System**: Tông màu chủ đạo Xanh Navy `#003087`, Đỏ `#dc2626`, Nền trắng `#ffffff`, độ tương phản cao, giao diện tối giản chuẩn SaaS, loại bỏ hoàn toàn các chi tiết rườm rà.
- **Quy trình Khai báo Thực tập Thông minh (Dynamic Multi-Step Wizard)**: Phân nhánh 3 kịch bản rõ ràng:
  1. *Đã có nơi thực tập* (3 bước): Tự động tra cứu MST doanh nghiệp qua cổng dữ liệu quốc gia, cập nhật thông tin cán bộ hướng dẫn và cam kết học vụ.
  2. *Đang tìm / Chờ phỏng vấn* (2 bước): Lưu trữ doanh nghiệp đang ứng tuyển, theo dõi tiến độ phỏng vấn và kế hoạch dự phòng.
  3. *Cần Khoa hỗ trợ điều phối* (2 bước): Gửi nguyện vọng, vị trí mong muốn và đính kèm CV Drive để Khoa kết nối đối tác chiến lược.
- **Quản lý Chuẩn Ngoại ngữ CEFR**: Quản lý hồ sơ chứng chỉ tiếng Anh (TOEIC, IELTS, TOEFL iBT, Aptis ESOL, Cambridge), tự động quy đổi bậc CEFR (A1 -> C2) và kiểm tra chuẩn đầu ra tốt nghiệp ($B1+$).
- **Hệ thống Phân quyền Linh hoạt (Prime RBAC)**: Quản trị quyền hạn trên 12 phân hệ chức năng theo nguyên lý thừa số nguyên tố ($O(1)$ Modulo), cho phép tùy biến vai trò trực quan qua ma trận phân quyền.
- **Hỗ trợ Ra quyết định & Trích xuất Dữ liệu**:
  - Tự động bóc tách tin tuyển dụng từ email đối tác (Inbound Email JD Parser).
  - Nhập/xuất dữ liệu Excel hàng loạt đa sheet (SheetJS), tự động hợp nhất sinh viên học phần song song KTCN & TSNN.
  - Thống kê phân bố GPA, tỷ lệ tiếp nhận theo lĩnh vực và biểu đồ tiến độ toàn khóa thời gian thực.

---

## 🏗️ Bố cục Cấu trúc Thư mục Toàn Dự án (Clean Architecture)

Dự án được chuẩn hóa theo mô hình Fullstack phân lớp chuyên nghiệp:

```text
Dashoard_TSNN/                     # Thư mục gốc dự án
│
├── 📁 backend/                    # Máy chủ API (Node.js 22 + Native SQLite DatabaseSync)
│   ├── 📁 src/
│   │   ├── 📁 config/             # Cấu hình Môi trường, Port, Secrets (env.config.ts)
│   │   ├── 📁 controllers/        # Tiếp nhận request HTTP, điều hướng luồng dữ liệu
│   │   │   ├── auth.controller.ts
│   │   │   ├── students.controller.ts
│   │   │   ├── internship.controller.ts
│   │   │   ├── bulletin.controller.ts
│   │   │   ├── documents.controller.ts
│   │   │   ├── certificates.controller.ts
│   │   │   └── reporting.controller.ts
│   │   ├── 📁 models/             # Schema Database SQLite, Type definitions, Contracts
│   │   │   ├── sqlite.db.ts       # Database Schema & Seeder dữ liệu mẫu
│   │   │   ├── types.ts           # Claims, Request, Response Interfaces
│   │   │   └── reporting.contracts.ts # Hợp đồng Widget & Plugin biểu đồ
│   │   ├── 📁 services/           # Xử lý Logic nghiệp vụ (Business Logic) chính
│   │   │   ├── auth.service.ts
│   │   │   ├── students.service.ts
│   │   │   ├── internship.service.ts
│   │   │   ├── tax-lookup.adapter.ts    # Adapter tra cứu MST tự động
│   │   │   ├── bulletin.service.ts
│   │   │   ├── email-parser.ts          # Bóc tách JD từ Email chuyển tiếp
│   │   │   ├── documents.service.ts     # Quản lý biểu mẫu học vụ
│   │   │   ├── certificates.service.ts  # Chuẩn Ngoại ngữ & CEFR
│   │   │   ├── chart-router.ts          # Engine Chart Router động
│   │   │   ├── widget-registry.ts       # Registry quản lý các Widget
│   │   │   ├── company-data.adapter.ts  # Chuẩn hóa dữ liệu doanh nghiệp
│   │   │   └── 📁 charts/               # Plugin biểu đồ độc lập (Plug & Play)
│   │   │       ├── top-companies.plugin.ts
│   │   │       ├── status-pie.plugin.ts
│   │   │       ├── major-distribution.plugin.ts
│   │   │       └── salary-trend.plugin.ts
│   │   ├── 📁 middlewares/        # Bộ lọc trung gian (CORS, JWT Parser, Auth Guard)
│   │   │   ├── middleware.ts
│   │   │   └── prime-rbac.ts      # Engine phân quyền Prime RBAC
│   │   ├── 📁 routes/             # Cổng API Endpoints & HTTP Router
│   │   │   ├── api.router.ts
│   │   │   └── http-router.ts
│   │   ├── 📁 utils/              # Hàm tiện ích chuẩn hóa phản hồi (sendSuccess, sendError)
│   │   ├── 📁 data/               # File CSDL vật lý SQLite & File mẫu 91 SV
│   │   │   ├── db_cntt.sqlite
│   │   │   └── real-students.json
│   │   └── 📄 server.ts           # Entry point khởi chạy HTTP Server & SPA Host
│   ├── 📁 tests/                  # Bộ kiểm thử tự động (Unit & Integration Tests)
│   │   ├── api.test.ts
│   │   └── prime-rbac.test.ts
│   ├── 📄 package.json            # Quản lý cấu hình & scripts Backend
│   └── 📄 tsconfig.json           # Cấu hình TypeScript
│
├── 📁 frontend/                   # Mã nguồn Giao diện Người dùng (React Web Client)
│   ├── 📁 public/                 # Tài nguyên tĩnh công khai (Logo TDTU, Favicon)
│   ├── 📁 src/
│   │   ├── 📁 components/         # UI Components dùng chung
│   │   │   ├── 📁 common/         # Navbar, Sidebar điều hướng hệ thống
│   │   │   ├── 📁 student/        # Banner điều kiện thực tập sinh viên
│   │   │   └── AppHeader.tsx
│   │   ├── 📁 pages/              # 14 Màn hình chức năng chính của hệ thống
│   │   │   ├── LoginPage.jsx      # Đăng nhập Google SSO TDTU & Tài khoản hệ thống
│   │   │   ├── DashboardPage.jsx  # Bảng điều khiển phân tích số liệu & tiến độ
│   │   │   ├── StudentsPage.jsx   # Quản lý danh sách 1.248 sinh viên thực tập
│   │   │   ├── DeclarationPage.jsx# Khai báo nơi thực tập & rẽ nhánh nguyện vọng
│   │   │   ├── CertificatesPage.jsx # Quản lý chuẩn chứng chỉ ngoại ngữ toàn khóa
│   │   │   ├── DocumentsPage.jsx  # Thống kê & Báo cáo số liệu học kỳ
│   │   │   ├── BulletinPage.jsx   # Bảng tin tuyển dụng & Cơ hội thực tập
│   │   │   ├── EmailJdPage.jsx    # Duyệt JD bóc tách từ Email Forward
│   │   │   ├── ProfilePage.jsx    # Hồ sơ cá nhân sinh viên & Tiến trình hoàn thiện
│   │   │   ├── HandbookPage.jsx   # Sổ tay quy chế & Hướng dẫn thực tập
│   │   │   ├── ImportDataPage.jsx # Trung tâm Import Dữ liệu Excel/CSV
│   │   │   ├── ExportDataPage.jsx # Trung tâm Export Dữ liệu & Báo cáo
│   │   │   ├── SemestersPage.jsx  # Quản lý học kỳ & Thiết lập tiến độ
│   │   │   └── AccountsPage.jsx   # Quản trị tài khoản, Tùy chỉnh & Phân quyền
│   │   ├── 📁 services/           # REST Client kết nối Backend & Service Worker
│   │   │   ├── api.client.js      # Client gọi API Backend
│   │   │   └── prime-rbac.js      # Client thẩm định quyền giao diện
│   │   ├── 📁 config/             # Cấu hình Firebase SDK & Local Database
│   │   ├── 📄 App.jsx             # Root Component điều hướng SPA
│   │   └── 📄 main.jsx
│   ├── 📄 index.html              # HTML Single Page Application TDTU Portal
│   ├── 📄 package.json            # Dependencies giao diện
│   └── 📄 vite.config.js          # Cấu hình Vite Dev Server
│
├── 📁 deployment/                 # Cấu hình Triển khai Hệ thống (DevOps & Docker)
│   ├── 📄 docker-compose.yml      # Đồng bộ Backend, Frontend và Volume SQLite
│   ├── 🐳 backend.Dockerfile
│   └── 🐳 frontend.Dockerfile
│
├── 📁 docs/                       # Tài liệu thiết kế hệ thống, sơ đồ luồng dữ liệu
└── 📄 README.md                   # Hướng dẫn tổng thể dự án
```

---

## 🚀 Hướng Dẫn Khởi Chạy Dự Án

### Yêu cầu môi trường
- **Node.js**: Phiên bản 22.x trở lên (tận dụng tính năng Native TypeScript `--experimental-strip-types` và Native SQLite `node:sqlite`).
- **Hệ điều hành**: Windows, macOS hoặc Linux.

---

### Cách 1: Khởi chạy Máy chủ Tích hợp SPA (Khuyên dùng)
Backend hỗ trợ chế độ **All-in-One**, tự động phục vụ cả REST API và toàn bộ giao diện SPA trên cùng một cổng:

```bash
# 1. Di chuyển vào thư mục backend
cd backend

# 2. Khởi chạy máy chủ (sử dụng node --watch để tự động cập nhật khi đổi code)
npm run dev
# hoặc chạy trực tiếp bằng lệnh Node 22:
# node --experimental-strip-types src/server.ts
```

- Mở trình duyệt tại: **`http://localhost:3000`**
- Toàn bộ 14 trang chức năng sẽ hoạt động ngay lập tức với dữ liệu thực tế.

---

### Cách 2: Khởi chạy với Vite Dev Server (Dành cho Lập trình viên Giao diện)
Nếu cần tính năng Hot Module Replacement (HMR) cực nhanh của Vite:

```bash
# 1. Khởi chạy Backend trước (ở Terminal 1)
cd backend
npm run dev

# 2. Khởi chạy Frontend Vite (ở Terminal 2)
cd frontend
npm install
npm run dev
```

- Vite Dev Server sẽ chạy tại: **`http://localhost:5173`** (kết nối Backend qua Proxy tại port 3000).

---

### Cách 3: Khởi chạy bằng Docker Compose (Môi trường Triển khai Production)

```bash
cd deployment
docker compose up -d --build
```

---

## 🧪 Chạy Kiểm Thử Tự Động (Automated Tests)

Dự án tích hợp sẵn bộ kiểm thử chuẩn `node:test` không phụ thuộc thư viện bên ngoài:

```bash
cd backend

# Chạy kiểm thử toàn bộ API Endpoints
npm test

# Chạy kiểm thử thuật toán phân quyền số nguyên tố (Prime RBAC)
node --test tests/prime-rbac.test.ts
```

---

## 👥 Danh Sách Tài Khoản Thử Nghiệm

Hệ thống đã nạp sẵn dữ liệu mẫu thực tế của Khoa CNTT - ĐH Tôn Đức Thắng:

| Vai trò | Email đăng nhập | Họ và tên | Chức năng chính |
| :--- | :--- | :--- | :--- |
| **Admin Khoa** | `phamvanc@tdtu.edu.vn` | TS. Phạm Văn C | Toàn quyền Quản trị, Quản lý học kỳ, Duyệt JD, Import Excel, Phân quyền hệ thống |
| **Giảng viên Điều phối** | `nguyenvana@tdtu.edu.vn` | ThS. Nguyễn Văn A | Theo dõi 1.248 SV, Quản lý chứng chỉ ngoại ngữ toàn khóa, Báo cáo thống kê |
| **Giảng viên Hướng dẫn** | `tranthib@tdtu.edu.vn` | TS. Trần Thị B | Giám sát sinh viên được phân công, đối chiếu minh chứng thực tập |
| **Sinh viên (Đã có nơi)** | `522H0045@student.tdtu.edu.vn` | Nguyễn Hữu Nhân | Khai báo tiếp nhận MST, nộp chứng chỉ tiếng Anh, quản lý hồ sơ cá nhân |
| **Sinh viên (Cần hỗ trợ)**| `52000001@student.tdtu.edu.vn` | Sinh viên 52000001 | Đăng ký nguyện vọng thực tập, đính kèm CV gửi Khoa CNTT kết nối doanh nghiệp |
| **Đối tác Doanh nghiệp** | `hr@fpt.com` | Đối tác Tuyển dụng | Đăng tin tuyển dụng JD, xét duyệt hồ sơ sinh viên ứng tuyển |

---

## 🛡️ Thiết Kế Kỹ Thuật & Nghiệp Vụ Chuyên Sâu

1. **Kiến trúc Clean Architecture 3 lớp**:
   - `Controllers`: Tiếp nhận request HTTP, kiểm tra tham số, phân luồng logic.
   - `Services`: Đảm nhận toàn bộ nghiệp vụ xử lý dữ liệu, bóc tách email, adapter kết nối bên ngoài.
   - `Models`: Quản lý Schema CSDL SQLite bằng `DatabaseSync`, khóa ngoại và truy vấn tối ưu.
2. **Hệ thống Phân quyền Prime RBAC**:
   - Mỗi hành động cơ sở tương ứng một số nguyên tố: `Xem (2)`, `Thêm (3)`, `Sửa (5)`, `Xóa (7)`, `Scope All (11)`, `Import (13)`, `Export (17)`.
   - Độ phức tạp thẩm định quyền là $O(1)$ Modulo (`M % P === 0`).
   - Giao diện quản trị đã được tinh giản trực quan, hiển thị ma trận phân quyền sạch sẽ chuẩn SaaS.
3. **Tra cứu Doanh nghiệp Tự động**:
   - Tích hợp API cơ sở dữ liệu doanh nghiệp quốc gia thông qua MST để lấy tên công ty, địa chỉ trụ sở và người đại diện, đảm bảo tính chính xác tuyệt đối của hồ sơ thực tập.
4. **Học phần Song song KTCN - TSNN**:
   - Hợp nhất quản lý 2 học phần Kiến tập công nghiệp và Tập sự nghề nghiệp (`KTCN-TSNN`), theo dõi tiến độ hoàn thành theo quy chế đào tạo hiện hành của Khoa.

---

## 📄 Bản Quyền & Giấy Phép
Dự án được xây dựng và phát triển phục vụ công tác đào tạo và quản lý thực tập tại **Khoa Công nghệ Thông tin - Trường Đại học Tôn Đức Thắng (TDTU)**. Mọi quyền được bảo lưu.
