# KHOA CÔNG NGHỆ THÔNG TIN — ĐẠI HỌC TÔN ĐỨC THẮNG
## HỆ THỐNG QUẢN LÝ THỰC TẬP VÀ DASHBOARD HỖ TRỢ RA QUYẾT ĐỊNH (DB_CNTT)
### CỔNG THÔNG TIN HỌC PHẦN KIẾN TẬP CÔNG NGHIỆP (KTCN) VÀ TẬP SỰ NGHỀ NGHIỆP (TSNN)

[![Node.js Version](https://img.shields.io/badge/Node.js-v24.19.0-339933?logo=node.js)](https://nodejs.org/)
[![React Version](https://img.shields.io/badge/React-18.3.1-61DAFB?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-100%25_.ts_%2F_.tsx-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Firebase](https://img.shields.io/badge/Firebase-v10_Hosting_%26_Auth-FFCA28?logo=firebase)](https://firebase.google.com/)
[![SQLite](https://img.shields.io/badge/SQLite-WAL_Mode-003B57?logo=sqlite)](https://www.sqlite.org/)
[![Automated Tests](https://img.shields.io/badge/Automated_Tests-24%2F24_Passed-16a34a)](#)
[![Git Branch](https://img.shields.io/badge/Git_Branch-522H0045-003087)](#)

- **Địa chỉ ứng dụng trực tuyến (Live Production):** https://dashboard-39cf8.web.app
- **Máy chủ phát triển cục bộ (Local Server):** `http://localhost:3000`
- **Nhánh mã nguồn chính thức:** `522H0045`
- **Phiên bản phát hành:** `v3.2.0 (Bản cập nhật hoàn thiện: 05/11/2026 · 100% TypeScript)`

---

## 1. TỔNG QUAN DỰ ÁN

Hệ thống **DB_CNTT** là giải pháp phần mềm quản lý học vụ chuyên nghiệp được xây dựng **100% bằng ngôn ngữ TypeScript (`.ts` và `.tsx`)**, chuẩn hóa toàn diện quy trình tổ chức, quản lý và giám sát thực tập doanh nghiệp tại Khoa Công nghệ Thông tin, Trường Đại học Tôn Đức Thắng (TDTU).

Hệ thống giải quyết tập trung các nghiệp vụ quản lý cho hai học phần đào tạo cốt lõi:
1. **Kiến tập Công nghiệp (KTCN):** 160 giờ tiếp cận và thực hành thực tế tại doanh nghiệp.
2. **Tập sự Nghề nghiệp (TSNN):** 320 giờ thực tập chuyên sâu và làm việc tại đơn vị tiếp nhận.
3. **Học phần Song song:** Hỗ trợ sinh viên đủ điều kiện học tập đăng ký đồng thời cả hai học phần trong cùng một học kỳ.

### Mục tiêu chiến lược:
- **Số hóa quy trình học vụ:** Xóa bỏ hoàn toàn quy trình xử lý giấy tờ thủ công, chuyển đổi sang khai báo trực tuyến, tra cứu pháp lý doanh nghiệp qua Mã số thuế (MST), nộp và thẩm định chứng chỉ ngoại ngữ tốt nghiệp, tiếp nhận tin tuyển dụng (JD) và cấp Giấy giới thiệu tự động.
- **Hỗ trợ ra quyết định (Decision Support System):** Cung cấp Bảng điều khiển trực quan giúp Ban Chủ nhiệm Khoa và Giảng viên cố vấn nhận diện sớm các sinh viên gặp khó khăn (chưa có đơn vị tiếp nhận, cần Khoa hỗ trợ điều phối, chưa đạt chuẩn ngoại ngữ B1) để phân bổ doanh nghiệp thân hữu kịp thời.
- **Kiến trúc hướng dịch vụ bền vững:** Thiết kế theo mô hình Modular Monolith hướng Service-Oriented (SOA), áp dụng cơ chế Chart Router và Adapter Pattern bảo đảm hệ thống có khả năng mở rộng, bảo trì và dễ dàng bàn giao trong giai đoạn 2026 – 2031.

---

## 2. KIẾN TRÚC HỆ THỐNG VÀ NGUYÊN TẮC THIẾT KẾ

### 2.1. Sơ đồ Luồng Hoạt động Tổng thể

```text
+-----------------------------------------------------------------------------+
|                           TRÌNH DUYỆT KHÁCH (CLIENT)                        |
|        React 18 Single Page Application (100% TypeScript: 22 Modules)       |
|   Tailwind CSS Enterprise DS + TabErrorBoundary + LocalStorage / In-Memory  |
+-----------------------------------------------------------------------------+
               |                                            ^
               | HTTP / JSON API (Port 3000)                | Đồng bộ Real-time
               v                                            v (onSnapshot)
+---------------------------------------------+  +----------------------------+
|            NODE.JS API GATEWAY              |  |   CLOUD FIRESTORE SYNC     |
|       HTTP Router Pipeline & CORS           |  | Multi-Device Notification  |
| Prime RBAC (Tích số nguyên tố: 2,3,5,7,...) |  | Live Declarations & Certs  |
+---------------------------------------------+  +----------------------------+
       |                               |
       v                               v
+-----------------------------+  +--------------------------------------------+
|     DOMAIN CONTROLLERS      |  |         REPORTING DECISION ENGINE          |
| - Auth Controller           |  |            (CHART ROUTER)                  |
| - Students Controller       |  |  ChartRouter.dispatch(widgetId, options)   |
| - Internship Controller     |  +--------------------------------------------+
| - Certificates Controller   |                        |
| - Documents Controller      |                        v
| - Bulletin Controller       |          +----------------------------+
+-----------------------------+          |      WIDGET REGISTRY       |
               |                         |    (Singleton Catalog)     |
               v                         +----------------------------+
+-----------------------------+                        |
|      DOMAIN SERVICES        |          +-------------+--------------+
| - auth.service.ts           |          |                            |
| - students.service.ts       |          v                            v
| - internship.service.ts     |  +----------------+          +----------------+
| - notification.service.ts   |  | StatusPieChart |          | TopCompanies   |
| - email-parser.ts           |  |     Plugin     |          |  Chart Plugin  |
| - documents.service.ts      |  +----------------+          +----------------+
+-----------------------------+          |                            |
       |               |                 +-------------+--------------+
       |               |                               |
       v               v                               v
+--------------+ +--------------------+ +-------------------------------------+
|  SQLite DB   | | Tax Lookup Adapter | |         COMPANY DATA ADAPTER        |
|  (WAL Mode)  | | Tra cứu MST DN     | |      Anti-Corruption Layer          |
| db_cntt.db   | | Phòng Chuyên trách | | Chuẩn hóa Schema V1 và Schema V2    |
+--------------+ +--------------------+ +-------------------------------------+
```

### 2.2. Các Nguyên tắc Kiến trúc Cốt lõi

1. **Kiến trúc 3 tầng sạch (Clean 3-Tier Architecture):**
   - Hệ thống được phân tách nghiêm ngặt qua các tầng: `routes/` -> `middlewares/` -> `controllers/` -> `services/` -> `models/`.
   - Controller chỉ đảm nhận việc đọc request và trả response; Service chỉ chứa pure business logic; Model chỉ định nghĩa schema và hợp đồng dữ liệu.

2. **Kiến trúc Chart Router & Widget Registry (Plug-and-Play Engine):**
   - Tuân thủ triệt để nguyên lý Open-Closed Principle (OCP): Hệ thống mở cho việc mở rộng (thêm biểu đồ mới) nhưng đóng với việc sửa đổi mã nguồn cốt lõi.
   - Khi bổ sung một báo cáo mới, lập trình viên chỉ cần thêm 01 file plugin `.ts` độc lập trong thư mục `services/charts/`. Server tự động phát hiện và frontend tự động hiển thị thẻ biểu đồ trên Dashboard mà không cần can thiệp controller hay router.

3. **Mẫu thiết kế Adapter (Anti-Corruption Layer):**
   - Cách ly sự biến động về định dạng dữ liệu nguồn từ các phòng ban hoặc đối tác bên ngoài.
   - `CompanyDataAdapter` tự động nhận diện và chuẩn hóa cả dữ liệu kiểu cũ (Schema V1: `sector_name`, `total`) và kiểu mới (Schema V2: `summary.industryName`, `companies`) về một kiểu hợp đồng thống nhất duy nhất `IndustryStatistic[]`.

4. **Phân quyền Toán học Prime Product RBAC:**
   - Ứng dụng Định lý Cơ bản của Số học: Mỗi quyền hạn được đại diện bằng một số nguyên tố độc lập (`Read=2`, `Create=3`, `Update=5`, `Delete=7`, `ScopeAll=11`, `Import=13`, `Export=17`, `Approve=19`).
   - Phân quyền cho một vai trò là phép Nhân các thừa số nguyên tố. Kiểm tra quyền là phép Chia hết (Modulo 0). Phương pháp này mang lại tốc độ xử lý 0ms và khả năng mở rộng không giới hạn mà không gây xung đột ma trận quyền.

5. **Hệ thống Đồng bộ Đa thiết bị & Bộ nhớ đệm 2 tầng:**
   - Kết hợp Cache In-Memory (<0.5ms) và LocalStorage với Firestore Real-time listener (`onSnapshot`).
   - Khi sinh viên khai báo trên thiết bị di động, giảng viên xem trên máy tính để bàn được cập nhật ngay lập tức mà không cần tải lại trang.

6. **Khả năng Cách ly Lỗi Giao diện (TabErrorBoundary):**
   - Vùng nội dung giao diện được bảo vệ bởi bộ đệm `TabErrorBoundary`. Nếu một tab gặp sự cố tạm thời khi tải dữ liệu mạng, thanh menu Sidebar và Navbar vẫn hoạt động 100%, tuyệt đối không gây sập ứng dụng hoặc hủy phiên đăng nhập của người dùng.

---

## 3. NGĂN XẾP CÔNG NGHỆ CHÍNH XÁC (EXACT TECHNOLOGY STACK)

> [!NOTE]
> Hệ thống được thiết kế theo triết lý **Zero Bloatware & Pure Architecture**: Chỉ sử dụng đúng các công nghệ cốt lõi phục vụ bài toán nghiệp vụ, tuyệt đối không dùng thư viện ngoài dư thừa (không Express, không NestJS, không Redux, không ORM cồng kềnh, không Jest/Mocha).

| Phân hệ / Tầng chức năng | Công nghệ sử dụng | Nguồn / Phân phối | Mục đích và vai trò thực tế trong hệ thống |
| :--- | :--- | :---: | :--- |
| **Backend Runtime** | Node.js (`v22+` / `v24+`) | Native Engine | Thực thi trực tiếp TypeScript bằng cờ `--experimental-strip-types`, HTTP server tích hợp sẵn qua module chuẩn `node:http`. Hoàn toàn không phụ thuộc Express/NestJS. |
| **Ngôn ngữ chủ đạo** | TypeScript (`.ts` / `.tsx`) | `v5.5+` | Chuẩn hóa Type an toàn 100% cho cả Backend APIs, Frontend Views, Prime RBAC và Adapter Code. |
| **Cơ sở dữ liệu cục bộ** | SQLite (`node:sqlite`) | Embedded Native | Sử dụng module `node:sqlite` tích hợp sẵn trong Node.js (DatabaseSync), chế độ WAL (Write-Ahead Logging), lưu trữ file `db_cntt.sqlite` tốc độ cao. |
| **Cơ sở dữ liệu thời gian thực** | Google Cloud Firestore | `v10.13.0` Compat | Đồng bộ dữ liệu real-time qua listener `onSnapshot` giữa Giảng viên và Sinh viên (học kỳ, thông báo, khai báo nơi thực tập, chứng chỉ, đơn ứng tuyển JD). |
| **Xác thực người dùng** | Google Workspace SSO & Firebase Auth | `v10.13.0` Compat | Xác thực Google SSO bảo mật cao, bắt buộc tên miền nội bộ `@tdtu.edu.vn` (Giảng viên) và `@student.tdtu.edu.vn` (Sinh viên). |
| **Frontend Framework** | React 18 & ReactDOM 18 | CDN Production | Xây dựng giao diện Single Page Application (SPA) dạng Component-driven, quản lý State cục bộ linh hoạt. |
| **Trình thông dịch Frontend** | Babel Standalone (`@babel/standalone`) | CDN Runtime | Thông dịch trực tiếp mã nguồn TSX/TypeScript tại trình duyệt với preset `tsx`, cho phép sửa code chạy ngay không cần bước build phức tạp (không cần Vite/Webpack). |
| **Định dạng giao diện** | Tailwind CSS Enterprise | CDN | Bộ nhận diện chuẩn Khoa CNTT - ĐH Tôn Đức Thắng: Navy `#003087`, Red `#dc2626`, Dark Gray `#1f2937`, White `#ffffff`. |
| **Xử lý Bảng tính Excel** | SheetJS (`xlsx`) | `v0.18.5` CDN | Phân tích file Excel (.xlsx, .xls, .csv), tự động nhận diện đa sheet môn học (KTCN & TSNN) và xuất báo cáo học vụ trực tiếp tại Client. |
| **Đồng bộ đa Tab** | HTML5 BroadcastChannel API | Native Browser | Đồng bộ trạng thái tức thì giữa các tab trình duyệt (`tdtu_realtime_sync`). |
| **Lưu trữ & Triển khai Web** | Firebase Hosting | Google Cloud | Triển khai Frontend SPA toàn cầu với chứng chỉ SSL tự động tại `https://dashboard-39cf8.web.app`. |
| **Kiểm thử tự động** | Node.js Test Runner (`node --test`) | Native Runner | Bộ test suite 24 tests tự động hóa (Backend API, Prime RBAC, Reporting Adapter) chạy cực nhanh trong ~1.3s, không cần Jest/Mocha. |
| **Mẫu kiến trúc mở rộng** | Chart Router & Adapter Pattern | In-House Architecture | Cơ chế cắm-và-chạy (Plug-and-Play) theo nguyên lý OCP, hỗ trợ thêm mới biểu đồ độc lập và chuẩn hóa đa định dạng dữ liệu (Schema V1 / Schema V2). |

---

## 4. CẤU TRÚC THƯ MỤC CHUẨN DOANH NGHIỆP

```text
Dashoard_TSNN-main/
|-- TDTU_DB_CNTT_System/
|   |-- backend/
|   |   |-- src/
|   |   |   |-- config/
|   |   |   |   `-- env.config.ts                  # Biến môi trường và cấu hình cổng mạng
|   |   |   |-- controllers/                       # 8 Controllers tiếp nhận và phản hồi HTTP
|   |   |   |   |-- auth.controller.ts
|   |   |   |   |-- bulletin.controller.ts
|   |   |   |   |-- certificates.controller.ts
|   |   |   |   |-- documents.controller.ts
|   |   |   |   |-- internship.controller.ts
|   |   |   |   |-- notification.controller.ts
|   |   |   |   |-- reporting.controller.ts
|   |   |   |   `-- students.controller.ts
|   |   |   |-- data/                              # CSDL SQLite và tập dữ liệu 91 sinh viên
|   |   |   |   |-- db_cntt.sqlite
|   |   |   |   `-- real-students.json
|   |   |   |-- middlewares/                       # Middleware xác thực và Prime RBAC
|   |   |   |   |-- middleware.ts
|   |   |   |   `-- prime-rbac.ts
|   |   |   |-- models/                            # Schema dữ liệu và hợp đồng kiến trúc
|   |   |   |   |-- reporting.contracts.ts
|   |   |   |   |-- sqlite.db.ts
|   |   |   |   `-- types.ts
|   |   |   |-- routes/                            # Định tuyến RESTful API
|   |   |   |   |-- api.router.ts
|   |   |   |   `-- http-router.ts
|   |   |   |-- services/                          # Các phân hệ dịch vụ nghiệp vụ độc lập
|   |   |   |   |-- charts/                        # Thư mục chứa các Plugin Biểu đồ (OCP)
|   |   |   |   |   |-- major-distribution.plugin.ts
|   |   |   |   |   |-- salary-trend.plugin.ts
|   |   |   |   |   |-- status-pie.plugin.ts
|   |   |   |   |   `-- top-companies.plugin.ts
|   |   |   |   |-- auth.service.ts
|   |   |   |   |-- bulletin.service.ts
|   |   |   |   |-- certificates.service.ts
|   |   |   |   |-- chart-router.ts                # Bộ định tuyến biểu đồ (Chart Router)
|   |   |   |   |-- company-data.adapter.ts        # Adapter chuẩn hóa đa Schema V1 / V2
|   |   |   |   |-- documents.service.ts
|   |   |   |   |-- email-parser.ts                # Bóc tách tin tuyển dụng từ email forward
|   |   |   |   |-- internship.service.ts
|   |   |   |   |-- notification.service.ts        # Phát thông báo học vụ và chống Spam
|   |   |   |   |-- students.service.ts
|   |   |   |   |-- tax-lookup.adapter.ts          # Tra cứu pháp lý doanh nghiệp qua MST
|   |   |   |   `-- widget-registry.ts             # Danh mục biểu đồ Singleton
|   |   |   |-- utils/
|   |   |   |   `-- response.ts
|   |   |   `-- server.ts                          # Điểm khởi chạy Backend Server (Port 3000)
|   |   |-- tests/                                 # Bộ kiểm thử tự động API và Prime RBAC (9/9 Pass)
|   |   |   |-- api.test.ts
|   |   |   `-- prime-rbac.test.ts
|   |   |-- package.json
|   |   `-- tsconfig.json
|   `-- frontend/                                  # React 18 TypeScript Single Page Application
|       |-- src/
|       |   |-- assets/                            # Logo TDTU và hình ảnh hệ thống
|       |   |-- components/
|       |   |   |-- common/                        # AdminNotificationModal, Navbar, Sidebar
|       |   |   `-- student/                       # StudentEligibilityBanner
|       |   |-- config/
|       |   |   `-- firebase.config.ts             # Kết nối Firebase Auth và Cloud Firestore
|       |   |-- pages/                             # 14 Trang chức năng nghiệp vụ (.tsx)
|       |   |   |-- AccountsPage.tsx               # Cài đặt hệ thống và Prime RBAC
|       |   |   |-- BulletinPage.tsx               # Bảng tin tuyển dụng và Thông báo học vụ
|       |   |   |-- CertificatesPage.tsx           # Hồ sơ chứng chỉ ngoại ngữ tốt nghiệp B1
|       |   |   |-- DashboardPage.tsx              # Bảng điều khiển ra quyết định
|       |   |   |-- DeclarationPage.tsx            # Khai báo thực tập 3 nhánh và tra cứu MST
|       |   |   |-- DocumentsPage.tsx              # Trung tâm in ấn A4 (Bộ 6 biểu mẫu)
|       |   |   |-- EmailJdPage.tsx                # Phê duyệt JD tự động từ Email
|       |   |   |-- ExportDataPage.tsx             # Xuất báo cáo học vụ Excel
|       |   |   |-- HandbookPage.tsx               # Cẩm nang thực tập và quy chế 320 giờ
|       |   |   |-- ImportDataPage.tsx             # Nạp danh sách sinh viên Excel đầu kỳ
|       |   |   |-- LoginPage.tsx                  # Đăng nhập Google SSO và Firebase
|       |   |   |-- ProfilePage.tsx                # Hồ sơ cá nhân sinh viên và link CV
|       |   |   |-- SemestersPage.tsx              # Quản lý kế hoạch học kỳ và hạn chót
|       |   |   `-- StudentsPage.tsx               # Quản lý danh sách 91 sinh viên thực tế
|       |   |-- services/
|       |   |   |-- api.client.ts                  # HTTP Client, Firestore Sync và Cache
|       |   |   `-- prime-rbac.ts                  # Kiểm tra quyền phía Client
|       |   |-- types/
|       |   |   `-- index.ts                       # Định nghĩa Type hợp đồng dùng chung
|       |   |-- App.tsx                            # Bộ định tuyến tổng và TabErrorBoundary
|       |   `-- index.css                          # Stylesheet chuẩn TDTU và Media Print A4
|       |-- index.html                             # Host HTML nạp 22 TypeScript Modules
|       |-- package.json
|       `-- tsconfig.json
|-- Adapter_Code/
|   `-- reporting-adapter-demo/                    # Gói Demo kiến trúc Chart Router và Adapter
|       |-- src/
|       |   |-- chart-plugins.ts                   # Các biểu đồ Pie và Bar dùng chung Provider
|       |   |-- chart-router.ts                    # Luồng có Chart Router (Port 3102)
|       |   |-- company-adapter.ts                 # Adapter xử lý Schema V1 và Schema V2
|       |   |-- contracts.ts                       # Interface Provider và Chart
|       |   |-- demo-page.ts                       # Giao diện so sánh trực quan 2 luồng
|       |   |-- main.ts                            # Entrypoint khởi chạy 3 services
|       |   |-- mock-company-service.ts            # Server upstream giả lập (Port 3200)
|       |   |-- reporting-server.ts                # Server reporting (Port 3101 và 3102)
|       |   |-- shared-http-client.ts              # Http client hỗ trợ timeout và lỗi mạng
|       |   `-- widget-registry.ts                 # Luồng không Router (Port 3101)
|       |-- tests/
|       |   `-- demo.test.ts                       # 15 Bài kiểm thử tự động Adapter
|       `-- README.md
|-- docs/                                          # Hệ thống tài liệu kỹ thuật và bàn giao
|   |-- architecture/                              # Sơ đồ thiết kế Sequence và Routing Flow
|   |-- plans/                                     # Kế hoạch phát triển dự án
|   |-- API_SPECIFICATION.md                       # Đặc tả toàn bộ 25+ RESTful API Endpoints
|   |-- BAO_CAO_CHI_TIET_DU_AN_TONG_THE_DB_CNTT.md # Báo cáo tiến độ chi tiết các giai đoạn
|   |-- HUONG_DAN_BAN_GIAO_VA_PHAT_TRIEN.md        # Tài liệu bàn giao kỹ thuật 2026 - 2031
|   |-- HUONG_DAN_TAO_CHART_PLUGIN_MOI.md          # Hướng dẫn từng bước tạo Chart Plugin
|   `-- TAI_KHOAN_KIEM_THU.md                      # Hướng dẫn đăng nhập các vai trò
|-- .firebaserc                                    # Cấu hình định danh dự án Firebase
|-- firebase.json                                  # Quy tắc Rewrite và Hosting Headers
|-- firestore.rules                                # Luật bảo mật Cloud Firestore
|-- Dockerfile                                     # Dockerfile đa tầng (Multi-stage build)
|-- docker-compose.yml                             # Khởi chạy container nhanh
|-- package.json                                   # Script điều khiển toàn bộ repository
|-- start-local.bat                                # Script khởi chạy 1-Click trên Windows
|-- TAI_KHOAN_KIEM_THU.txt                         # Danh sách tài khoản test sẵn sàng
`-- README.md                                      # Tài liệu giới thiệu tổng thể dự án
```

---

## 5. HƯỚNG DẪN CÀI ĐẶT VÀ KHỞI CHẠY

### 5.1. Yêu cầu hệ thống
- **Node.js:** Phiên bản `>= 22.16.0` hoặc `v24.x` (Khuyến nghị Node.js 24 để sử dụng tính năng `--experimental-strip-types` và module CSDL `node:sqlite` tích hợp sẵn).
- **Không cần cài đặt thêm CSDL bên ngoài:** Hệ thống sử dụng tệp SQLite cục bộ được quản lý tự động bởi Node.js, không cần cài MySQL, PostgreSQL hoặc Redis.

### 5.2. Cách 1: Khởi chạy 1-Click trên hệ điều hành Windows
Người dùng nhấp đúp chuột vào tệp tại thư mục gốc của dự án:
```cmd
start-local.bat
```
Tệp lệnh sẽ thực hiện các bước tự động:
1. Kiểm tra phiên bản Node.js hiện tại của máy tính.
2. Thực thi toàn bộ 24 bài kiểm thử tự động (Unit Tests).
3. Khởi động Backend Server tại cổng 3000 phục vụ cả API và Giao diện Web.
4. Tự động mở trình duyệt mặc định tại địa chỉ `http://localhost:3000`.

### 5.3. Cách 2: Khởi chạy bằng Dòng lệnh (Terminal / PowerShell)
```bash
# Bước 1: Chuyển vào thư mục gốc của dự án
cd Dashoard_TSNN-main

# Bước 2: Chạy toàn bộ bộ kiểm thử tự động (Backend API, Prime RBAC, Chart Adapter)
npm test

# Bước 3: Khởi chạy máy chủ ứng dụng
npm start
```
Mở trình duyệt và truy cập địa chỉ: **`http://localhost:3000`**

### 5.4. Cách 3: Khởi chạy bằng Docker Compose
```bash
docker compose up -d --build
```
Hệ thống sẽ được container hóa hoàn toàn và mở cổng 3000 để truy cập.

---

## 6. DANH SÁCH TÀI KHOẢN KIỂM THỬ THEO 4 VAI TRÒ

Hệ thống áp dụng nghiêm ngặt cơ chế phân quyền Prime RBAC và ngăn chặn tuyệt đối việc sử dụng email ngoài tên miền nhà trường. Dưới đây là danh sách tài khoản đã được nạp sẵn vào hệ thống để phục vụ công tác đánh giá và kiểm thử:

| Nhóm Vai trò | Họ và Tên | Email đăng nhập (@tdtu.edu.vn / @student.tdtu.edu.vn) | Mật khẩu mặc định | Phạm vi thẩm quyền trên hệ thống |
| :--- | :--- | :--- | :---: | :--- |
| **1. Admin / BCN Khoa** | GV. Dương Hữu Phúc | `duonghuuphuc@tdtu.edu.vn` | `Admin@123456` | Toàn quyền hệ thống: quản lý học kỳ, cấu hình hạn chót, duyệt thông báo toàn trường, quản lý biểu đồ Dashboard, phân quyền Prime RBAC, in 6 biểu mẫu A4 |
| **1. Admin phụ** | GV. Phạm Văn C | `phamvanc@tdtu.edu.vn` | `Admin@123456` | Toàn quyền quản trị học vụ và xuất báo cáo |
| **2. Giảng viên Cố vấn** | GV. Nguyễn Văn A | `nguyenvana@tdtu.edu.vn` | `Lecturer@123456` | Quản lý 91 sinh viên, xem tiến độ và nơi thực tập SV khai báo, tra cứu chứng chỉ tiếng Anh, mở link CV, duyệt JD từ email, xuất 6 mẫu in A4 |
| **2. Giảng viên Cố vấn** | GV. Trần Minh Lan | `tranminhlan@tdtu.edu.vn` | `Lecturer@123456` | Thẩm định hồ sơ sinh viên theo chuyên ngành Hệ thống thông tin và Mạng |
| **3. Sinh viên trong kỳ** | Nguyễn Hữu Nhân | `522h0045@student.tdtu.edu.vn` | `Student@123456` | Sinh viên đủ điều kiện học song song 2 học phần KTCN và TSNN, khai báo nơi thực tập và tra cứu MST, nộp chứng chỉ B1, xem Cẩm nang |
| **3. Sinh viên thực tế** | Võ Duy Trí | `51900839@student.tdtu.edu.vn` | `Student@123456` | Sinh viên thực tế thuộc tập dữ liệu 91 SV (Lớp 19050402 - Ngành HTTT) |
| **3. Sinh viên cần hỗ trợ** | Nguyễn Minh Anh | `522h0001@student.tdtu.edu.vn` | `Student@123456` | Đã chọn nhánh "Cần Khoa hỗ trợ điều phối", gửi nguyện vọng và link CV |
| **4. Sinh viên ngoài kỳ** | Nguyễn Văn Ngoài Kỳ | `52100999@student.tdtu.edu.vn` | `Student@123456` | Sinh viên chưa có tên trong danh sách học phần kỳ này; hệ thống tự động tinh gọn giao diện chỉ còn 3 mục: Bảng điều khiển, Hồ sơ cá nhân, Bảng tin |

---

## 7. TRUNG TÂM IN ẤN VÀ BỘ 6 BIỂU MẪU A4 THEO NGHỊ ĐỊNH 30/2020/NĐ-CP

Tại phân hệ **Văn bản và Biểu mẫu** (`/documents`), hệ thống cung cấp công cụ xem trước trực quan (A4 Live Preview) và xuất in ấn trực tiếp ra khổ giấy A4 theo đúng quy cách thể thức văn bản hành chính nhà nước:

1. **Mẫu 1 (`mau_tong_ket`):** Báo cáo Tổng kết và Xét duyệt Đợt Thực tập Doanh nghiệp (Phục vụ cuộc họp Ban Chủ nhiệm Khoa, tổng hợp 7 chỉ số KPI cốt lõi, danh sách chi tiết và khung ký 3 bên: Người lập, Trưởng Bộ môn, Trưởng Khoa).
2. **Mẫu 2 (`mau_phan_bo`):** Bảng Phân bổ Sinh viên theo Đơn vị Tiếp nhận (Gửi các doanh nghiệp đối tác như FPT Software, VNG, Viettel, TMA, KMS kèm thông tin mentor và vị trí tiếp nhận).
3. **Mẫu 3 (`mau_bang_diem`):** Bảng Tổng hợp Điểm Đánh giá Kết quả Thực tập (Tổng hợp điểm số theo công thức trọng số: Nhật ký 20%, Đánh giá Doanh nghiệp BM-03 40%, Báo cáo Giảng viên 40%, quy đổi hệ 10, hệ 4 và điểm chữ).
4. **Mẫu 4 (`mau_giay_gioi_thieu`):** Giấy Giới thiệu Sinh viên Thực tập Doanh nghiệp (Văn bản hành chính trang trọng có số công văn, thông tin pháp lý của Khoa và khung ký đóng dấu giấy của lãnh đạo Khoa).
5. **Mẫu 5 (`mau_dieu_phoi`):** Danh sách Sinh viên Đề nghị Khoa Hỗ trợ Kết nối Doanh nghiệp (Tổng hợp GPA, chuyên ngành, kỹ năng, nguyện vọng khu vực và số điện thoại để Khoa gửi tới Hội đồng Doanh nghiệp đối tác).
6. **Mẫu 6 (`mau_bieu_mau_bm`):** Bộ Tài liệu Quy định và Hướng dẫn Thực tập (Tích hợp biểu mẫu BM-01 Phiếu tiếp nhận, BM-02 Nhật ký thực tập tuần, BM-03 Phiếu đánh giá doanh nghiệp và đề cương quy định 320 giờ làm việc thực tế).

---

## 8. HƯỚNG DẪN MỞ RỘNG: TẠO PLUGIN BIỂU ĐỒ MỚI (PLUG-AND-PLAY)

Nhờ kiến trúc **Chart Router** và **Widget Registry**, bất kỳ đội ngũ kỹ sư kế thừa nào cũng có thể bổ sung thêm biểu đồ mới mà không cần can thiệp vào server router hay controller.

### Quy trình 3 bước:
1. Tạo 01 file plugin mới tại thư mục `TDTU_DB_CNTT_System/backend/src/services/charts/ten-bieu-do.plugin.ts`.
2. Triển khai interface `IChartPlugin` gồm 2 hàm: `getMetadata()` và `execute()`.
3. Đăng ký instance vào `widgetRegistry.register(plugin)`.

```typescript
import { getDatabase } from '../../models/sqlite.db.ts';
import { widgetRegistry } from '../widget-registry.ts';
import type { IChartPlugin, WidgetMetadata, StandardChartPayload } from '../../models/reporting.contracts.ts';

export class EvaluationResultPlugin implements IChartPlugin {
  // 1. Khai báo metadata cho danh mục Widget
  getMetadata(): WidgetMetadata {
    return {
      id: 'evaluation-result-chart',
      name: 'Thống kê Kết quả Đánh giá Thực tập (BM-03)',
      category: 'academic',
      description: 'Phân bổ xếp loại thực tập từ cán bộ hướng dẫn doanh nghiệp',
      defaultSize: 'medium',
      supportedChartTypes: ['pie', 'bar']
    };
  }

  // 2. Logic truy vấn dữ liệu và đóng gói theo hợp đồng StandardChartPayload
  async execute(options: Record<string, any> = {}): Promise<StandardChartPayload> {
    const db = getDatabase();
    
    // Thực hiện truy vấn SQLite hoặc gọi dịch vụ khách
    const categories = ['Xuất sắc', 'Giỏi', 'Khá', 'Trung bình'];
    const data = [38, 42, 10, 1];

    return {
      widgetId: 'evaluation-result-chart',
      title: 'Xếp loại Thực tập từ Doanh nghiệp',
      chartType: 'pie',
      categories,
      series: [
        {
          name: 'Số lượng sinh viên',
          type: 'pie',
          data,
          color: '#003087'
        }
      ],
      summaryStats: {
        totalEvaluated: 91,
        excellentRate: '41.8%'
      },
      generatedAt: new Date().toISOString(),
      schemaVersion: 'standard'
    };
  }
}

// 3. Tự động đăng ký vào Widget Registry (Plug and Play)
const plugin = new EvaluationResultPlugin();
widgetRegistry.register(plugin);
export default plugin;
```

Sau khi tạo xong file, biểu đồ mới sẽ ngay lập tức xuất hiện trên endpoint `GET /api/dashboard/widgets` và được hiển thị tự động trên Dashboard giảng viên mà không cần khởi động lại toàn bộ hệ thống.

---

## 9. BỘ KIỂM THỬ TỰ ĐỘNG (AUTOMATED TEST SUITES)

Hệ thống tích hợp sẵn 24 bài kiểm thử tự động (Unit Tests và Integration Tests) chạy trực tiếp qua Node.js native test runner:

```bash
npm test
```

### Kết quả kiểm thử thực tế (24/24 Tests Passed):
- **Phân hệ Reporting Adapter Demo (15 tests):**
  - Kiểm tra widget discovery và tra cứu registry.
  - Kiểm tra tính đồng nhất dữ liệu giữa Schema V1 và Schema V2 khi đi qua Adapter.
  - Kiểm tra khả năng tái sử dụng Adapter cho cả hai loại biểu đồ Pie và Bar.
  - Kiểm tra cơ chế xử lý mã lỗi: 404 Not Found, 502 Bad Gateway khi upstream sai định dạng, 503 Service Unavailable, và 504 Gateway Timeout.
  - Kiểm tra sự tương đồng về kết quả Chart JSON giữa mô hình Có Router và Không Router.
- **Phân hệ Backend API Core (6 tests):**
  - Test 1: API Summary thống kê tổng quan đợt thực tập.
  - Test 2: API Tra cứu pháp lý Mã số thuế doanh nghiệp (MST VNG `0303882213`).
  - Test 3: API Bảng tin tuyển dụng và thông báo học vụ.
  - Test 4: API Widget Registry và Chart Router dispatch.
  - Test 5: API Notification Anti-Spam (Bỏ qua thông báo trùng lặp trong 20 giây).
  - Test 6: API Notification Admin Broadcast và xem trước số lượng người nhận.
- **Phân hệ Phân quyền Prime RBAC (3 tests):**
  - Test 1: Kiểm tra khớp 100% ma trận số nguyên tố chuẩn của BCN Khoa CNTT.
  - Test 2: Phép toán Cấp quyền (Nhân số nguyên tố) và Gỡ quyền (Chia số nguyên tố).
  - Test 3: Giải mã mặt nạ quyền (Explain Permission Mask).

---

## 10. TRIỂN KHAI VÀ VẬN HÀNH HỆ THỐNG (DEPLOYMENT)

### 10.1. Triển khai lên Firebase Hosting (Môi trường Static Production)
Giao diện Frontend TypeScript được triển khai trực tiếp trên hạ tầng mạng phân phối toàn cầu của Google Firebase:
```bash
# Cài đặt công cụ Firebase CLI nếu chưa có
npm install -g firebase-tools

# Thực hiện build và deploy lên môi trường trực tuyến
npm run deploy:firebase
# Hoặc chạy lệnh:
npx firebase-tools deploy --only hosting
```
Truy cập kiểm tra trực tiếp: **https://dashboard-39cf8.web.app**

### 10.2. Triển khai nội bộ trên Máy chủ Nhà trường (On-Premises Production)
Khi đưa hệ thống về vận hành trên hạ tầng server riêng của Khoa CNTT hoặc Trung tâm Máy tính TDTU:
1. Sử dụng Docker Compose đã được cấu hình sẵn trong file `docker-compose.yml`.
2. Thiết lập Nginx Reverse Proxy phía trước để điều phối luồng:
   - `http://thuctap.cntt.tdtu.edu.vn/api/` -> chuyển tiếp vào Node.js Backend Server tại cổng 3000.
   - `http://thuctap.cntt.tdtu.edu.vn/` -> phục vụ thư mục `TDTU_DB_CNTT_System/frontend/` với fallback rewrite về `index.html`.

---

## 11. DANH MỤC TÀI LIỆU BÀN GIAO LIÊN QUAN

Để hỗ trợ công tác bàn giao trơn tru và định hướng phát triển tiếp nối trong giai đoạn 2026 - 2031, các tài liệu chuyên sâu đã được biên soạn đầy đủ tại thư mục `docs/`:

1. [HUONG_DAN_BAN_GIAO_VA_PHAT_TRIEN.md](file:///d:/KTCN_TSNN/Dashoard_TSNN-main/docs/HUONG_DAN_BAN_GIAO_VA_PHAT_TRIEN.md): Tài liệu hướng dẫn bàn giao, bản đồ kiến trúc và quy trình tiếp nhận code.
2. [HUONG_DAN_TAO_CHART_PLUGIN_MOI.md](file:///d:/KTCN_TSNN/Dashoard_TSNN-main/docs/HUONG_DAN_TAO_CHART_PLUGIN_MOI.md): Cẩm nang lập trình viên mở rộng thêm các biểu đồ trực quan hóa mới.
3. [API_SPECIFICATION.md](file:///d:/KTCN_TSNN/Dashoard_TSNN-main/docs/API_SPECIFICATION.md): Bản đặc tả chi tiết toàn bộ các endpoint RESTful API kèm ví dụ request/response JSON.
4. [BAO_CAO_CHI_TIET_DU_AN_TONG_THE_DB_CNTT.md](file:///d:/KTCN_TSNN/Dashoard_TSNN-main/docs/BAO_CAO_CHI_TIET_DU_AN_TONG_THE_DB_CNTT.md): Báo cáo tổng kết tiến độ và kết quả thực hiện 6 giai đoạn dự án.
5. [TAI_KHOAN_KIEM_THU.md](file:///d:/KTCN_TSNN/Dashoard_TSNN-main/docs/TAI_KHOAN_KIEM_THU.md) và [TAI_KHOAN_KIEM_THU.txt](file:///d:/KTCN_TSNN/Dashoard_TSNN-main/TAI_KHOAN_KIEM_THU.txt): Danh sách chi tiết tài khoản, mật khẩu và phân quyền phục vụ nghiệm thu hệ thống.

---

## 12. ĐƠN VỊ QUẢN LÝ VÀ BẢN QUYỀN

- **Đơn vị chủ quản:** Khoa Công nghệ Thông tin — Trường Đại học Tôn Đức Thắng (TDTU)
- **Chủ đề đề tài:** Hệ thống Quản lý Thực tập & Dashboard Hỗ trợ Ra Quyết định (DB_CNTT)
- **Giảng viên hướng dẫn & Chỉ đạo kiến trúc:** GV. Dương Hữu Phúc
- **Nhánh mã nguồn thực hiện:** `522H0045`
- **Bản quyền mã nguồn:** © 2026 Khoa CNTT, Trường Đại học Tôn Đức Thắng. Mọi quyền được bảo lưu theo quy định sở hữu trí tuệ của nhà trường.
