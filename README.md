# TDTU KHOA CNTT — HỆ THỐNG QUẢN LÝ THỰC TẬP & DASHBOARD RA QUYẾT ĐỊNH (DB_CNTT)
### CỔNG THÔNG TIN HỌC PHẦN KIẾN TẬP CÔNG NGHIỆP (KTCN) & TẬP SỰ NGHỀ NGHIỆP (TSNN)
**Trường Đại học Tôn Đức Thắng (TDTU) · Khoa Công nghệ Thông tin**

[![Node.js Version](https://img.shields.io/badge/Node.js-v24.19.0-339933?logo=node.js)](https://nodejs.org/)
[![React Version](https://img.shields.io/badge/React-18.3.1-61DAFB?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-100%25_.ts_%2F_.tsx-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Firebase](https://img.shields.io/badge/Firebase-v10_Hosting_%26_Auth-FFCA28?logo=firebase)](https://firebase.google.com/)
[![SQLite](https://img.shields.io/badge/SQLite-WAL_Mode-003B57?logo=sqlite)](https://www.sqlite.org/)
[![Tests](https://img.shields.io/badge/Automated_Tests-24%2F24_Passed-16a34a)](#)

- **Trang ứng dụng trực tuyến (Live Production):** https://dashboard-39cf8.web.app  
- **Máy chủ phát triển nội bộ (Local Server):** `http://localhost:3000`  
- **Nhánh mã nguồn chính thức (Git Branch):** `522H0045`

---

## 1. TỔNG QUAN DỰ ÁN

Hệ thống **DB_CNTT** là giải pháp phần mềm quản lý học vụ toàn diện được viết **100% bằng TypeScript (`.ts` & `.tsx`)**, chuẩn hóa toàn bộ quy trình thực tập doanh nghiệp dành cho Sinh viên và Ban Chủ nhiệm / Giảng viên Khoa CNTT Trường Đại học Tôn Đức Thắng. Hệ thống giải quyết trọn vẹn bài toán quản lý hai học phần quan trọng: **Kiến tập công nghiệp (KTCN - 160 giờ)** và **Tập sự nghề nghiệp (TSNN - 320 giờ)**, phục vụ công tác điều hành, theo dõi tiến độ theo từng học kỳ, đối soát pháp lý doanh nghiệp qua Mã số thuế, bóc tách tin tuyển dụng tự động và hỗ trợ ra quyết định điều phối sinh viên.

### Điểm nhấn công nghệ & tính năng mới nhất (`v3.2.0`):
1. **Chuẩn hóa 100% TypeScript (`.ts` / `.tsx`):** Toàn bộ Backend (`TDTU_DB_CNTT_System/backend/`), Frontend (`TDTU_DB_CNTT_System/frontend/` - 22 tệp `.ts`/`.tsx`) và Gói minh chứng kiến trúc (`Adapter_Code/`) đều sử dụng TypeScript đồng nhất, loại bỏ hoàn toàn các tệp `.js`/`.jsx` dư thừa.
2. **Kiến trúc Clean Architecture & Micro-modular 3 lớp:** Tách bạch hoàn toàn giữa Định tuyến (`routes`), Kiểm soát truy cập (`middlewares`), Bộ điều khiển (`controllers`), Nghiệp vụ thuần (`services`) và CSDL (`models`).
3. **Kiến trúc Chart Router, Widget Registry & Plug-and-Play (Open-Closed Principle):** Cho phép mở rộng thêm biểu đồ phân tích mới bằng đúng 01 file plugin `.ts` độc lập mà không cần chỉnh sửa mã nguồn cốt lõi của máy chủ; ẩn quyền cấu hình biểu đồ đối với vai trò Sinh viên.
4. **Đồng bộ Real-time Đa chiều (Sinh viên ↔ Giảng viên):** Khi sinh viên khai báo nơi thực tập (Tên công ty, Mã số thuế, Địa chỉ, Người đại diện, Vị trí thực tập, Mentor hướng dẫn, SĐT Mentor), dữ liệu được đồng bộ tức thì sang tab **Doanh nghiệp & Tiến độ** trong Hồ sơ sinh viên phía Giảng viên (qua SQLite + Cloud Firestore + LocalStorage + BroadcastChannel).
5. **Quản lý Học kỳ Chặt chẽ & Popup Thông báo Real-time cho Sinh viên:**
   - Lọc danh sách sinh viên chính xác theo từng học kỳ (`hk1_2026_2027`, `hk2_2026_2027`, `hk3_2026_2027`), không hiển thị lẫn sinh viên giữa các kỳ.
   - Khi Giảng viên đăng thông báo học vụ mới, Sinh viên đăng nhập sẽ nhận được **Popup thông báo nổi ở góc dưới bên phải màn hình** kèm nút xem chi tiết.
6. **Tối ưu Trải nghiệm Người dùng (Phóng to Popup 150% & Trung tâm In ấn A4):**
   - Các hộp thoại chi tiết (Hồ sơ sinh viên, Thẩm định chứng chỉ ngoại ngữ, Chi tiết phiếu khai báo) được phóng đại kích thước hiển thị lên **150%** giúp Giảng viên và Sinh viên dễ quan sát và thao tác.
   - Tích hợp **Trung tâm In ấn Chuẩn A4** với 6 biểu mẫu văn bản hành chính theo đúng chuẩn thể thức văn bản Việt Nam (Nghị định 30/2020/NĐ-CP).

---

## 2. KIẾN TRÚC KỸ THUẬT HỆ THỐNG

### 2.1. Sơ đồ Luồng Hoạt động Tổng thể (System Architecture)

```text
                           ┌────────────────────────────────────────┐
                           │      Trình duyệt Người dùng (Client)   │
                           │  React 18 TypeScript SPA (.ts / .tsx)  │
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
                      │                        │                                             │
                      ▼                        ▼                                             ▼
       ┌─────────────────────────────────────────────────────────────────────────────────────────────┐
       │                                  Tầng Dữ Liệu & Hợp Đồng                                    │
       │                   SQLite Database (WAL Mode) · Data Adapters (V1 / V2)                      │
       └─────────────────────────────────────────────────────────────────────────────────────────────┘
```

### 2.2. Chi tiết các Phân hệ Kỹ thuật

* **Frontend TypeScript Engine (`TDTU_DB_CNTT_System/frontend`):**
  - React 18 kết hợp Babel Standalone (`preset-typescript` với `ignoreExtensions: true` & `preset-react` với `runtime: 'classic'`) nạp trực tiếp 22 tệp `.ts` và `.tsx`.
  - Tailwind CSS tuân thủ nghiêm ngặt TDTU Enterprise Design System: Trắng (`#ffffff`), Xanh TDTU Navy (`#003087`), Đỏ Accent/Alert (`#dc2626`), chữ Đen/Xám đậm (`#1f2937`), không sử dụng icon emoji.
  - SheetJS (`XLSX`) xử lý nạp/xuất file Excel đa sheet phía Client.
* **Backend TypeScript Server (`TDTU_DB_CNTT_System/backend`):**
  - Node.js 24 native với cờ `--experimental-strip-types` thực thi trực tiếp mã nguồn TypeScript.
  - CSDL SQLite tích hợp sẵn (`node:sqlite`) bật chế độ `PRAGMA journal_mode = WAL` và `PRAGMA foreign_keys = ON`.
  - Bộ phân quyền toán học Prime RBAC (`prime-rbac.ts` sử dụng tích các số nguyên tố `2, 3, 5, 7, 11, 13, 17, 19`).

---

## 3. CẤU TRÚC THƯ MỤC CHUẨN DOANH NGHIỆP (100% TYPESCRIPT)

```text
Dashoard_TSNN-main/
├── TDTU_DB_CNTT_System/                 # Phân hệ Chính thức Hoàn chỉnh của Hệ thống
│   ├── backend/                         # Node.js 24 RESTful API Service (TypeScript)
│   │   ├── src/
│   │   │   ├── config/
│   │   │   │   └── env.config.ts        # Biến môi trường & cấu hình hệ thống
│   │   │   ├── controllers/             # Tiếp nhận HTTP Request & trả Response
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
│   │   │   ├── middlewares/             # Middlewares xác thực & Phân quyền Prime RBAC
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
│   │   │   │   ├── charts/              # Plug-and-Play Chart Plugins (.ts)
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
│   │   │   ├── utils/
│   │   │   │   └── response.ts
│   │   │   └── server.ts                # Entrypoint Backend HTTP Server (Port 3000)
│   │   ├── tests/                       # Bộ kiểm thử tự động API & Prime RBAC (9/9 Tests)
│   │   │   ├── api.test.ts
│   │   │   └── prime-rbac.test.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── frontend/                        # React 18 TypeScript SPA (TDTU Design System)
│       ├── data/                        # Dữ liệu mẫu JSON & File Excel mẫu GPA
│       │   ├── DSSV_KTCN_TSNN_HK1_2026-2027_GPA.xlsx
│       │   └── real-students.json
│       ├── src/
│       │   ├── assets/                  # Tài nguyên hình ảnh & Logo TDTU
│       │   ├── components/
│       │   │   ├── common/              # AdminNotificationModal.tsx, Navbar.tsx, Sidebar.tsx
│       │   │   └── student/             # StudentEligibilityBanner.tsx
│       │   ├── config/
│       │   │   └── firebase.config.ts   # Cấu hình Firebase Auth & Firestore
│       │   ├── pages/                   # 14 Trang chức năng nghiệp vụ (.tsx)
│       │   │   ├── AccountsPage.tsx     # Quản lý tài khoản & Phân quyền Prime RBAC
│       │   │   ├── BulletinPage.tsx     # Bảng tin tuyển dụng & Thông báo 2 tầng
│       │   │   ├── CertificatesPage.tsx # Hồ sơ chứng chỉ ngoại ngữ TDTU
│       │   │   ├── DashboardPage.tsx    # Bảng điều khiển ra quyết định & Chart Router
│       │   │   ├── DeclarationPage.tsx  # Khai báo thực tập & Tra cứu MST
│       │   │   ├── DocumentsPage.tsx    # Trung tâm In ấn A4 & Bộ Biểu mẫu Khoa CNTT
│       │   │   ├── EmailJdPage.tsx      # Tiếp nhận & Duyệt tin từ Email
│       │   │   ├── ExportDataPage.tsx   # Xuất báo cáo dữ liệu học vụ Excel
│       │   │   ├── HandbookPage.tsx     # Cẩm nang & Quy chế học phần
│       │   │   ├── ImportDataPage.tsx   # Nạp dữ liệu Excel đầu kỳ
│       │   │   ├── LoginPage.tsx        # Đăng nhập SSO & Firebase
│       │   │   ├── ProfilePage.tsx      # Hồ sơ sinh viên cá nhân
│       │   │   ├── SemestersPage.tsx    # Quản lý kế hoạch học kỳ
│       │   │   └── StudentsPage.tsx     # Quản lý & Thẩm định danh sách sinh viên
│       │   ├── services/                # API Gateway Client & Prime RBAC (.ts)
│       │   │   ├── api.client.ts
│       │   │   └── prime-rbac.ts
│       │   ├── types/                   # Hợp đồng kiểu dữ liệu TypeScript
│       │   │   └── index.ts
│       │   ├── App.tsx                  # Điều phối Router trung tâm & Popup Thông báo SV
│       │   └── index.css                # CSS Chuẩn TDTU & In ấn @media print
│       ├── index.html                   # HTML Host cho Single Page Application
│       ├── package.json
│       └── tsconfig.json
├── Adapter_Code/                        # Gói Demo Độc Lập Kiến Trúc Chart Router & Adapter (15/15 Tests)
│   └── reporting-adapter-demo/
├── docs/                                # Thư mục tài liệu kỹ thuật & báo cáo tổng thể
│   ├── architecture/                    # Sơ đồ thiết kế Sequence & Router
│   ├── plans/                           # Kế hoạch phát triển dự án
│   ├── API_SPECIFICATION.md
│   ├── BAO_CAO_CHI_TIET_DU_AN_TONG_THE_DB_CNTT.md
│   ├── HUONG_DAN_BAN_GIAO_VA_PHAT_TRIEN.md
│   └── HUONG_DAN_TAO_CHART_PLUGIN_MOI.md
├── .firebaserc                          # Cấu hình dự án Firebase Hosting
├── firebase.json                        # Quy tắc Rewrite & Hosting Headers (.ts/.tsx)
├── firestore.rules                      # Bảo mật Firestore Rules
├── Dockerfile                           # Docker build đa tầng cho toàn bộ dự án
├── docker-compose.yml                   # Khởi chạy Docker tiện lợi
├── package.json                         # Scripts quản lý vòng đời dự án
└── start-local.bat                      # Khởi chạy 1-Click trên Windows
```

---

## 4. HƯỚNG DẪN CÀI ĐẶT & KHỞI CHẠY HỆ THỐNG

### 4.1. Yêu cầu môi trường
* **Node.js:** Phiên bản `>= 22.16` hoặc `24.x` (khuyến nghị Node.js 24 để tận dụng cờ `--experimental-strip-types` và SQLite tích hợp sẵn).
* **Không yêu cầu cài thêm CSDL bên ngoài:** Hệ thống sử dụng engine SQLite tích hợp sẵn trong Node.js (`node:sqlite`), không cần cài đặt MySQL/PostgreSQL phức tạp.

### 4.2. Khởi chạy Nhanh trên Máy tính Cá nhân (Windows / macOS / Linux)

#### Cách 1: Khởi chạy 1-Click trên Windows
Nhấp đúp chuột vào tệp tại thư mục gốc dự án:
```bash
start-local.bat
```
Script sẽ tự động:
1. Kiểm tra môi trường Node.js.
2. Thực thi bộ kiểm thử tự động TypeScript (`api.test.ts` & `prime-rbac.test.ts`).
3. Mở trình duyệt Web tại địa chỉ `http://localhost:3000`.
4. Khởi chạy máy chủ Backend phục vụ đồng thời RESTful API và giao diện Frontend TypeScript SPA.

#### Cách 2: Khởi chạy bằng dòng lệnh (Terminal / PowerShell)
```bash
# 1. Di chuyển vào thư mục gốc của dự án
cd D:\KTCN_TSNN\Dashoard_TSNN-main

# 2. Chạy toàn bộ 24 bài kiểm thử tự động (API + Prime RBAC + Adapter Demo)
npm test

# 3. Khởi động máy chủ Backend & Frontend tại cổng 3000
npm start
```
Mở trình duyệt truy cập: **`http://localhost:3000`**

#### Cách 3: Khởi chạy với Docker Compose
```bash
docker compose up -d --build
```

---

## 5. DANH SÁCH TÀI KHOẢN TRUY CẬP KIỂM THỬ (TEST ACCOUNTS)

Hệ thống đã nạp sẵn danh sách người dùng mẫu tương ứng với từng vai trò kiểm thử chức năng và phân quyền Prime RBAC:

| Vai trò (Role) | Email đăng nhập | Mật khẩu mặc định | Mô tả thẩm quyền |
| :--- | :--- | :---: | :--- |
| **Ban Chủ nhiệm / Admin** | `phamvanc@tdtu.edu.vn` | `Admin@123456` | Toàn quyền cấu hình học kỳ, duyệt thông báo toàn trường, quản lý biểu đồ, cấp quyền tài khoản |
| **Giảng viên Cố vấn** | `nguyenvana@tdtu.edu.vn` | `Lecturer@123456` | Thẩm duyệt hồ sơ thực tập, xem thông tin doanh nghiệp SV khai báo, duyệt JD email, xuất 6 mẫu in A4 |
| **Giảng viên Điều phối** | `tranvanb@tdtu.edu.vn` | `Lecturer@123456` | Quản lý tiến độ sinh viên theo kỳ, theo dõi cảnh báo học vụ, nạp/xuất danh sách sinh viên |
| **Sinh viên (KTCN + TSNN)** | `522H0045@student.tdtu.edu.vn` | `Student@123456` | Sinh viên học cả 2 môn song song, khai báo nơi thực tập & MST, nộp chứng chỉ ngoại ngữ, nhận popup thông báo |
| **Sinh viên (Cần hỗ trợ)** | `522H0001@student.tdtu.edu.vn` | `Student@123456` | Đã nộp đơn nhờ Khoa điều phối nơi thực tập |

---

## 6. TRUNG TÂM IN ẤN & BỘ 6 BIỂU MẪU CHUẨN A4 DÀNH CHO GIẢNG VIÊN

Tại mục **Văn bản & Biểu mẫu** (`/documents`), Giảng viên có thể xem trước trực quan (A4 Live Preview) và in ấn/xuất file theo đúng chuẩn thể thức hành chính:

1. **Mẫu 1 (`mau_tong_ket`):** Báo cáo Tổng kết & Xét duyệt Đợt Thực tập (Phục vụ họp Ban Chủ nhiệm Khoa, có 7 chỉ tiêu thống kê, bảng danh sách xét duyệt chi tiết, chữ ký 3 bên).
2. **Mẫu 2 (`mau_phan_bo`):** Bảng Phân bổ Sinh viên theo Doanh nghiệp Tiếp nhận (Gửi FPT Software, VNG, Viettel, KMS... kèm thông tin mentor và danh sách SV).
3. **Mẫu 3 (`mau_bang_diem`):** Bảng Theo dõi & Đánh giá Điểm Thực tập Cuối kỳ (Tính điểm theo trọng số: Nhật ký 20%, Doanh nghiệp BM-03 40%, Báo cáo Giảng viên 40%, Điểm chữ và Đạt/Không đạt).
4. **Mẫu 4 (`mau_giay_gioi_thieu`):** Giấy Giới Thiệu Sinh viên Thực tập (Bản in A4 đứng có số công văn, quyết định và khung ký đóng dấu của Trưởng Khoa CNTT).
5. **Mẫu 5 (`mau_dieu_phoi`):** Danh sách Sinh viên Cần hỗ trợ Điều phối (Có GPA, xếp loại, kỹ năng, nguyện vọng, SĐT để Giảng viên gửi Hội đồng Doanh nghiệp tuyển dụng).
6. **Mẫu 6 (`mau_bieu_mau_bm`):** Bộ Biểu mẫu quy định chuẩn Khoa CNTT (BM-01 Phiếu tiếp nhận DN, BM-02 Nhật ký tuần, BM-03 Phiếu đánh giá DN, BM-04 Đề cương & Quy chế).

---

## 7. HƯỚNG DẪN THÊM BIỂU ĐỒ MỚI (PLUG AND PLAY CHART PLUGIN)

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

## 8. TRIỂN KHAI LÊN FIREBASE HOSTING (PRODUCTION)

Để triển khai phiên bản giao diện TypeScript mới nhất lên Firebase Hosting:
```bash
# Bước 1: Di chuyển vào thư mục gốc dự án
cd D:\KTCN_TSNN\Dashoard_TSNN-main

# Bước 2: Chạy lệnh deploy hosting (hoặc npm run deploy:firebase)
npx firebase-tools deploy --only hosting
```
Kiểm tra kết quả trực tuyến tại: **https://dashboard-39cf8.web.app**

---

## 9. ĐỘI NGŨ PHÁT TRIỂN & BẢN QUYỀN

* **Đơn vị chủ quản:** Khoa Công nghệ Thông tin — Trường Đại học Tôn Đức Thắng (TDTU)
* **Khóa đào tạo & Đề tài:** Đồ án Chuyên ngành / Thực tập tốt nghiệp ngành Kỹ thuật Phần mềm
* **Phiên bản hiện tại:** `v3.2.0 (100% TypeScript Enterprise Release)`
* **Bản quyền:** © 2026 Khoa CNTT - Đại học Tôn Đức Thắng. Mọi quyền được bảo lưu.
