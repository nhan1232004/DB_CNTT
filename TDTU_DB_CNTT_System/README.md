# 🎓 TDTU KHOA CNTT — HỆ THỐNG QUẢN LÝ THỰC TẬP & DASHBOARD RA QUYẾT ĐỊNH (DB_CNTT)
### CỔNG THÔNG TIN HỌC PHẦN KIẾN TẬP CÔNG NGHIỆP (KTCN) & TẬP SỰ NGHỀ NGHIỆP (TSNN)
**Trường Đại học Tôn Đức Thắng (TDTU) · Khoa Công nghệ Thông tin**

[![Node.js Version](https://img.shields.io/badge/Node.js-v24.19.0-339933?logo=node.js)](https://nodejs.org/)
[![React Version](https://img.shields.io/badge/React-18.3.1-61DAFB?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Firebase](https://img.shields.io/badge/Firebase-v10_Hosting_%26_Auth-FFCA28?logo=firebase)](https://firebase.google.com/)
[![SQLite](https://img.shields.io/badge/SQLite-WAL_Mode-003B57?logo=sqlite)](https://www.sqlite.org/)
[![License](https://img.shields.io/badge/License-TDTU_IT_Faculty-003087)](#)

🌐 **Trang ứng dụng trực tuyến (Live Production):** [https://dashboard-39cf8.web.app](https://dashboard-39cf8.web.app)  
🖥️ **Máy chủ phát triển nội bộ (Local Server):** `http://localhost:3000`

---

## 📖 1. TỔNG QUAN DỰ ÁN

Hệ thống **DB_CNTT** là giải pháp phần mềm quản lý học vụ toàn diện, chuẩn hóa toàn bộ quy trình thực tập doanh nghiệp dành cho sinh viên và ban quản lý Khoa CNTT Trường Đại học Tôn Đức Thắng. Hệ thống giải quyết trọn vẹn bài toán quản lý hai học phần quan trọng: **Kiến tập công nghiệp (KTCN - 160 giờ)** và **Tập sự nghề nghiệp (TSNN - 320 giờ)**, phục vụ công tác điều hành, theo dõi tiến độ, bóc tách tin tuyển dụng tự động và hỗ trợ ra quyết định điều phối sinh viên đến các doanh nghiệp đối tác thân hữu.

### Điểm nhấn công nghệ cốt lõi:
1. **Kiến trúc Clean Architecture & Phân tầng rõ rệt (3-Tier Layered):** Tách bạch hoàn toàn giữa Định tuyến (`routes`), Kiểm soát truy cập (`middlewares`), Bộ điều khiển (`controllers`), Nghiệp vụ thuần (`services`) và CSDL (`models`).
2. **Kiến trúc Chart Router & Plug-and-Play Widgets (Open-Closed Principle):** Cho phép mở rộng thêm biểu đồ phân tích mới bằng 01 file plugin độc lập mà không cần chỉnh sửa mã nguồn cốt lõi của máy chủ.
3. **Cơ chế Xác thực Kép (Dual Authentication):** Kết hợp Google Workspace SSO bảo mật tên miền nội bộ (`@tdtu.edu.vn` & `@student.tdtu.edu.vn`) và Firebase Authentication.
4. **Bảng tin Tuyển dụng 2 Tầng & Inbound Email Parser:** Bóc tách tự động email chuyển tiếp từ giảng viên thành bản nháp JD tuyển dụng chỉ với 1-Click phê duyệt.
5. **Trung tâm In ấn Chuẩn A4 (Print Center):** Tích hợp xem trước và in 6 biểu mẫu văn bản hành chính theo đúng chuẩn thể thức văn bản Việt Nam (Nghị định 30/2020/NĐ-CP).

---

## 🏛️ 2. KIẾN TRÚC KỸ THUẬT HỆ THỐNG

### 2.1. Sơ đồ Luồng Hoạt động Tổng thể (System Architecture)

```
                           ┌────────────────────────────────────────┐
                           │      Trình duyệt Người dùng (Client)   │
                           │   React 18 SPA · TDTU Enterprise UI   │
                           └──────────────────┬─────────────────────┘
                                              │ HTTP / JSON API (Port 3000)
                                              ▼
                           ┌────────────────────────────────────────┐
                           │          HTTP Router & Pipeline        │
                           │   (CORS, BodyParser, AuthMiddleware)   │
                           └──────────────────┬─────────────────────┘
                                              │
                      ┌───────────────────────┴───────────────────────┐
                      ▼                                               ▼
         ┌─────────────────────────┐                     ┌─────────────────────────┐
         │   Controllers Domain    │                     │  Reporting Controller   │
         │ (Students, Decl, JDs)   │                     └────────────┬────────────┘
         └────────────┬────────────┘                                  │
                      ▼                                               ▼
         ┌─────────────────────────┐                     ┌─────────────────────────┐
         │  Service Business Logic │                     │       Chart Router      │
         │ (CRUD, Logic, Parsers)  │                     └────────────┬────────────┘
         └────────────┬────────────┘                                  │
                      │                                               ▼
                      │                                  ┌─────────────────────────┐
                      │                                  │     Widget Registry     │
                      │                                  │   (Singleton Catalog)   │
                      │                                  └────────────┬────────────┘
                      │                                               │
                      │                        ┌──────────────────────┴──────────────────────┐
                      │                        ▼                                             ▼
                      │             ┌──────────────────────┐                     ┌──────────────────────┐
                      │             │  Status Pie Plugin   │                     │ Top Companies Plugin │
                      │             └──────────┬───────────┘                     └──────────┬───────────┘
                      │                        │                                            │
                      ▼                        ▼                                            ▼
       ┌─────────────────────────────────────────────────────────────────────────────────────────────┐
       │                                  Tầng Dữ Liệu & Hợp Đồng                                    │
       │                   SQLite Database (WAL Mode) · Data Adapters (V1 / V2)                      │
       └─────────────────────────────────────────────────────────────────────────────────────────────┘
```

### 2.2. Chi tiết các Phân hệ & Đặc tả Kỹ thuật

* **Front-end Engine:**
  - React 18 (Production CDN), Babel Standalone (zero-build overhead cho môi trường kiểm thử trực tiếp).
  - Tailwind CSS với bảng màu doanh nghiệp: Trắng (`#ffffff`), Xanh TDTU Navy (`#003087`), Đỏ Accent/Alert (`#dc2626`).
  - SheetJS (XLSX) xử lý nạp/xuất file Excel đa sheet phía Client.
* **Back-end Server:**
  - Node.js 24 native với cờ `--experimental-strip-types` (chạy trực tiếp TypeScript không cần biên dịch qua bước trung gian).
  - CSDL SQLite hiệu năng cao qua `node:sqlite` tích hợp chế độ ghi nhật ký trước `PRAGMA journal_mode = WAL` và ràng buộc khóa ngoại `PRAGMA foreign_keys = ON`.
  - Bộ phân quyền toán học Prime RBAC (ma trận tích số nguyên tố $2, 3, 5, 7$) chống leo thang đặc quyền.

---

## 📁 3. CẤU TRÚC THƯ MỤC CHUẨN DOANH NGHIỆP

```
Dashoard_TSNN-main/
├── TDTU_DB_CNTT_System/                 # Phân hệ Chính thức Hoàn chỉnh của Hệ thống
│   ├── backend/                         # Node.js 24 RESTful API Service
│   │   ├── src/
│   │   │   ├── config/                  # Biến môi trường & cấu hình hệ thống
│   │   │   │   └── env.config.ts
│   │   │   ├── controllers/             # Tiếp nhận HTTP Request & gửi Response
│   │   │   │   ├── auth.controller.ts
│   │   │   │   ├── bulletin.controller.ts
│   │   │   │   ├── certificates.controller.ts
│   │   │   │   ├── documents.controller.ts
│   │   │   │   ├── internship.controller.ts
│   │   │   │   ├── notification.controller.ts
│   │   │   │   ├── reporting.controller.ts
│   │   │   │   └── students.controller.ts
│   │   │   ├── data/                    # CSDL SQLite & Master Dataset 91 SV
│   │   │   │   ├── db_cntt.sqlite
│   │   │   │   └── real-students.json
│   │   │   ├── middlewares/             # Middlewares bảo vệ & Phân quyền Prime RBAC
│   │   │   │   ├── middleware.ts
│   │   │   │   └── prime-rbac.ts
│   │   │   ├── models/                  # Interface, Contracts & Schema CSDL
│   │   │   │   ├── reporting.contracts.ts
│   │   │   │   ├── sqlite.db.ts
│   │   │   │   └── types.ts
│   │   │   ├── routes/                  # Định tuyến HTTP Router
│   │   │   │   ├── api.router.ts
│   │   │   │   └── http-router.ts
│   │   │   ├── services/                # Pure Business Logic
│   │   │   │   ├── charts/              # Plug-and-Play Chart Plugins
│   │   │   │   │   ├── major-distribution.plugin.ts
│   │   │   │   │   ├── salary-trend.plugin.ts
│   │   │   │   │   ├── status-pie.plugin.ts
│   │   │   │   │   └── top-companies.plugin.ts
│   │   │   │   ├── auth.service.ts
│   │   │   │   ├── bulletin.service.ts
│   │   │   │   ├── certificates.service.ts
│   │   │   │   ├── chart-router.ts      # BỘ ĐỊNH TUYẾN BIỂU ĐỒ (CHART ROUTER)
│   │   │   │   ├── company-data.adapter.ts # ADAPTER ĐA SCHEMA V1 / V2
│   │   │   │   ├── documents.service.ts
│   │   │   │   ├── email-parser.ts
│   │   │   │   ├── internship.service.ts
│   │   │   │   ├── notification.service.ts
│   │   │   │   ├── students.service.ts
│   │   │   │   ├── tax-lookup.adapter.ts
│   │   │   │   └── widget-registry.ts   # WIDGET REGISTRY TỰ ĐỘNG KHÁM PHÁ
│   │   │   ├── utils/                   # Phản hồi chuẩn & định dạng dữ liệu
│   │   │   │   └── response.ts
│   │   │   └── server.ts                # Entrypoint Backend HTTP Server (Port 3000)
│   │   ├── tests/                       # Bộ kiểm thử tự động API
│   │   │   └── api.test.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── frontend/                        # React 18 SPA (TDTU Design System)
│   │   ├── src/
│   │   │   ├── components/common/       # Navbar, Sidebar, AdminNotificationModal
│   │   │   ├── components/student/      # Banner kiểm tra điều kiện sinh viên
│   │   │   ├── features/                # Các khối chức năng đặc thù
│   │   │   ├── pages/                   # 12 Trang chức năng nghiệp vụ
│   │   │   │   ├── AccountsPage.jsx     # Quản lý tài khoản & Phân quyền đối tác
│   │   │   │   ├── BulletinPage.jsx     # Bảng tin tuyển dụng 2 tầng
│   │   │   │   ├── CertificatesPage.jsx # Hồ sơ chứng chỉ ngoại ngữ TDTU
│   │   │   │   ├── DashboardPage.jsx    # Bảng điều khiển ra quyết định
│   │   │   │   ├── DeclarationPage.jsx  # Khai báo thực tập & Tra cứu MST
│   │   │   │   ├── DocumentsPage.jsx    # Trung tâm In ấn A4 & Bộ Biểu mẫu
│   │   │   │   ├── EmailJdPage.jsx      # Tiếp nhận & Duyệt tin từ Email
│   │   │   │   ├── ExportDataPage.jsx   # Xuất báo cáo dữ liệu học vụ
│   │   │   │   ├── HandbookPage.jsx     # Cẩm nang & Quy chế học phần
│   │   │   │   ├── ImportDataPage.jsx   # Nạp dữ liệu Excel đầu kỳ
│   │   │   │   ├── LoginPage.jsx        # Đăng nhập SSO & Firebase
│   │   │   │   ├── ProfilePage.jsx      # Hồ sơ sinh viên cá nhân
│   │   │   │   └── SemestersPage.jsx    # Quản lý kế hoạch học kỳ
│   │   │   ├── services/                # API Gateway Client & Prime RBAC
│   │   │   │   ├── api.client.js
│   │   │   │   └── prime-rbac.js
│   │   │   ├── types/                   # Hợp đồng kiểu dữ liệu TypeScript
│   │   │   │   └── index.ts
│   │   │   ├── App.jsx                  # Điều phối Router trung tâm
│   │   │   └── index.css                # CSS Chuẩn TDTU & In ấn @media print
│   │   └── index.html                   # HTML Host cho Single Page Application
│   ├── deployment/                      # Dockerfile triển khai độc lập
│   │   ├── backend.Dockerfile
│   │   └── frontend.Dockerfile
│   └── docs/                            # Tài liệu kỹ thuật chi tiết
│       ├── architecture/                # Sơ đồ thiết kế Sequence & Router
│       ├── plans/                       # Kế hoạch phát triển dự án
│       ├── API_SPECIFICATION.md
│       ├── HUONG_DAN_TAO_CHART_PLUGIN_MOI.md
│       └── HUONG_DAN_BAN_GIAO_VA_PHAT_TRIEN.md
├── Adapter_Code/                        # Gói Demo Độc Lập Kiến Trúc Chart Router & Adapter
│   └── reporting-adapter-demo/
├── docs/                                # Thư mục tài liệu tổng thể dự án
├── .firebaserc                          # Cấu hình dự án Firebase Hosting
├── firebase.json                        # Quy tắc Rewrite & Hosting Cache
├── firestore.rules                      # Bảo mật Firestore Rules
├── Dockerfile                           # Docker build đa tầng cho toàn bộ dự án
├── docker-compose.yml                   # Khởi chạy Docker tiện lợi
├── package.json                         # Scripts quản lý vòng đời dự án
├── start-local.bat                      # Khởi chạy 1-Click trên Windows
└── start-demo.bat                       # Khởi chạy bản Demo thuyết trình
```

---

## ⚡ 4. HƯỚNG DẪN CÀI ĐẶT & KHỞI CHẠY HỆ THỐNG

### 4.1. Yêu cầu môi trường
* **Node.js:** Phiên bản `>= 22.16` hoặc `24.x` (khuyến nghị Node.js 24 để tận dụng cờ `--experimental-strip-types` và SQLite tích hợp sẵn).
* **Không yêu cầu cài thêm CSDL bên ngoài:** Hệ thống sử dụng engine SQLite tích hợp sẵn trong Node.js, không cần cấu hình MySQL/PostgreSQL phức tạp.

### 4.2. Khởi chạy Nhanh trên Máy tính Cá nhân (Windows / MacOS / Linux)

#### Cách 1: Khởi chạy 1-Click trên Windows
Nhấp đúp chuột vào tệp:
```bash
start-local.bat
```
Script sẽ tự động:
1. Kiểm tra môi trường Node.js.
2. Thực thi bộ kiểm thử tự động API backend (6/6 tests).
3. Mở trình duyệt Web tại địa chỉ `http://localhost:3000`.
4. Bật máy chủ backend phục vụ API và các tệp giao diện.

#### Cách 2: Khởi chạy bằng dòng lệnh (Terminal / PowerShell)
```bash
# Di chuyển vào thư mục dự án
cd D:\KTCN_TSNN\Dashoard_TSNN-main

# Chạy bộ kiểm thử tự động
npm test

# Khởi động máy chủ backend & frontend
npm start
```
Mở trình duyệt truy cập: **`http://localhost:3000`**

#### Cách 3: Khởi chạy với Docker Compose
```bash
docker compose up -d
```

---

## 🔑 5. DANH SÁCH TÀI KHOẢN TRUY CẬP KIỂM THỬ (TEST ACCOUNTS)

Hệ thống đã nạp sẵn danh sách người dùng mẫu tương ứng với từng vai trò kiểm thử chức năng và phân quyền RBAC:

| Vai trò (Role) | Email đăng nhập | Mật khẩu mặc định | Mô tả thẩm quyền |
| :--- | :--- | :---: | :--- |
| **Quản trị viên (Admin)** | `phamvanc@tdtu.edu.vn` | `Admin@123456` | Toàn quyền cấu hình học kỳ, duyệt thông báo toàn trường, cấp quyền tài khoản |
| **Giảng viên Cố vấn (Lecturer)** | `nguyenvana@tdtu.edu.vn` | `Lecturer@123456` | Thẩm duyệt hồ sơ thực tập, duyệt tin tuyển dụng email, xuất Giấy giới thiệu |
| **Giảng viên Điều phối (Lecturer)**| `tranvanb@tdtu.edu.vn` | `Lecturer@123456` | Quản lý tiến độ sinh viên, theo dõi cảnh báo học vụ, nộp danh sách sinh viên |
| **Sinh viên (KTCN + TSNN)** | `522H0045@student.tdtu.edu.vn` | `Student@123456` | Sinh viên học cả 2 môn song song, đã nạp minh chứng IELTS 6.5, có điểm GPA 8.12 |
| **Sinh viên (Cần hỗ trợ)** | `522H0001@student.tdtu.edu.vn` | `Student@123456` | Đã nộp đơn nhờ Khoa điều phối nơi thực tập |
| **Đối tác Doanh nghiệp (Partner)**| `hr@fpt.com` | `Partner@123456` | Xem danh sách hồ sơ sinh viên ứng tuyển, xác nhận tiếp nhận thực tập |

---

## 🖨️ 6. TRUNG TÂM IN ẤN & BỘ 6 BIỂU MẪU CHUẨN A4 DÀNH CHO GIẢNG VIÊN

Tại mục **Văn bản & Biểu mẫu** (`/documents`), Giảng viên có thể xem trước trực quan (A4 Live Preview) và in ấn/xuất file theo đúng chuẩn thể thức hành chính:

1. **Mẫu 1 (`mau_tong_ket`):** Báo cáo Tổng kết & Xét duyệt Đợt Thực tập (Phục vụ họp Ban Chủ nhiệm Khoa, có 7 chỉ tiêu thống kê, bảng danh sách xét duyệt chi tiết, chữ ký 3 bên).
2. **Mẫu 2 (`mau_phan_bo`):** Bảng Phân bổ Sinh viên theo Doanh nghiệp Tiếp nhận (Gửi FPT Software, VNG, Viettel, KMS... kèm thông tin mentor và danh sách SV).
3. **Mẫu 3 (`mau_bang_diem`):** Bảng Theo dõi & Đánh giá Điểm Thực tập Cuối kỳ (Tính điểm theo trọng số: Nhật ký 20%, Doanh nghiệp BM-03 40%, Báo cáo Giảng viên 40%, Điểm chữ và Đạt/Không đạt).
4. **Mẫu 4 (`mau_giay_gioi_thieu`):** Giấy Giới Thiệu Sinh viên Thực tập (Bản in A4 đứng có số công văn, quyết định và khung ký đóng dấu của Trưởng Khoa CNTT).
5. **Mẫu 5 (`mau_dieu_phoi`):** Danh sách Sinh viên Cần hỗ trợ Điều phối (Có GPA, xếp loại, kỹ năng, nguyện vọng, SĐT để Giảng viên gửi Hội đồng Doanh nghiệp tuyển dụng).
6. **Mẫu 6 (`mau_bieu_mau_bm`):** Bộ Biểu mẫu quy định chuẩn Khoa CNTT (BM-01 Phiếu tiếp nhận DN, BM-02 Nhật ký tuần, BM-03 Phiếu đánh giá DN, BM-04 Đề cương & Quy chế).

---

## 🔌 7. HƯỚNG DẪN THÊM BIỂU ĐỒ MỚI (PLUG AND PLAY CHART PLUGIN)

Nhờ áp dụng nguyên lý **Open-Closed Principle (OCP)**, khi cần bổ sung một biểu đồ thống kê mới vào Dashboard, lập trình viên **chỉ cần tạo đúng 01 file** trong thư mục `TDTU_DB_CNTT_System/backend/src/services/charts/ten-bieu-do.plugin.ts`:

```typescript
import { getDatabase } from '../../models/sqlite.db.ts';
import { widgetRegistry } from '../widget-registry.ts';
import type { IChartPlugin, WidgetMetadata, StandardChartPayload } from '../../models/reporting.contracts.ts';

export class CustomAcademicPlugin implements IChartPlugin {
  getMetadata(): WidgetMetadata {
    return {
      id: 'custom-academic-chart',
      name: 'Thống kê Kết quả Đánh giá Doanh nghiệp',
      category: 'academic',
      description: 'Phân loại kết quả đánh giá sinh viên từ Mentor doanh nghiệp',
      defaultSize: 'medium',
      supportedChartTypes: ['pie', 'bar']
    };
  }

  execute(): StandardChartPayload {
    const db = getDatabase();
    // Thực hiện truy vấn CSDL
    return {
      widgetId: 'custom-academic-chart',
      title: 'Tỷ lệ Đánh giá Doanh nghiệp',
      chartType: 'pie',
      categories: ['Xuất sắc', 'Giỏi', 'Khá', 'Đạt'],
      series: [{ name: 'Số lượng SV', type: 'pie', data: [35, 42, 12, 2], color: '#003087' }],
      generatedAt: new Date().toISOString(),
      schemaVersion: 'standard'
    };
  }
}

// Tự động đăng ký vào WidgetRegistry (Cắm và chạy)
const plugin = new CustomAcademicPlugin();
widgetRegistry.register(plugin);
export default plugin;
```
> Biểu đồ mới ngay lập tức xuất hiện trên API `GET /api/dashboard/widgets` mà **không cần sửa một dòng code nào trong `server.ts` hay `chart-router.ts`**.

---

## 🚢 8. TRIỂN KHAI LÊN FIREBASE HOSTING (PRODUCTION)

Để triển khai phiên bản giao diện mới nhất lên Firebase Hosting:
```bash
# Bước 1: Di chuyển vào thư mục hệ thống
cd D:\KTCN_TSNN\Dashoard_TSNN-main\TDTU_DB_CNTT_System

# Bước 2: Chạy lệnh deploy hosting
npx firebase deploy --only hosting
```
Kiểm tra kết quả tại: **[https://dashboard-39cf8.web.app](https://dashboard-39cf8.web.app)**

---

## 👥 9. ĐỘI NGŨ PHÁT TRIỂN & BẢN QUYỀN

* **Đơn vị chủ quản:** Khoa Công nghệ Thông tin — Trường Đại học Tôn Đức Thắng (TDTU)
* **Khóa đào tạo & Đề tài:** Đồ án Chuyên ngành / Thực tập tốt nghiệp ngành Kỹ thuật Phần mềm
* **Phiên bản hiện tại:** `v3.1.0 (Enterprise Release)`
* **Bản quyền:** © 2026 Khoa CNTT - Đại học Tôn Đức Thắng. Mọi quyền được bảo lưu.
