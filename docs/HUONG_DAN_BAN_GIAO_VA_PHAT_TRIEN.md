# TÀI LIỆU HƯỚNG DẪN BÀN GIAO & PHÁT TRIỂN HỆ THỐNG DB_CNTT
## HỆ THỐNG QUẢN LÝ THỰC TẬP, TỰ ĐỘNG HÓA JD & HỖ TRỢ RA QUYẾT ĐỊNH (100% TYPESCRIPT)
### KHOA CÔNG NGHỆ THÔNG TIN - TRƯỜNG ĐẠI HỌC TÔN ĐỨC THẮNG (TDTU)
*Phiên bản: v3.2.0 (Build v125) | Cập nhật hoàn thiện: 18/11/2026*

---

## 1. MỤC TIÊU VÀ ĐỊNH HƯỚNG THIẾT KẾ BỀN VỮNG

Dự án **DB_CNTT (`v3.2.0` — Build `v125`)** được thiết kế theo các tiêu chuẩn kỹ thuật nghiêm ngặt nhằm phục vụ mục tiêu **bàn giao trơn tru** cho các đội nhóm sinh viên, giảng viên và kỹ sư kế thừa (2026 – 2031):
1. **Đồng nhất 100% TypeScript (`.ts` & `.tsx`):** Toàn bộ Backend (`36` tệp `.ts` mã nguồn + `2` tệp kiểm thử), Frontend (`21` module `.ts`/`.tsx` đóng gói bằng `esbuild` + stylesheet `index.css`) và Gói minh chứng kiến trúc (`Adapter_Code/`) đều viết bằng TypeScript thuần.
2. **Module hóa triệt để (`ModuleRegistry`, SPA Router & Clean 3-Tier Architecture):** Tuyệt đối không nhồi nhét code vào một file duy nhất. Frontend quản lý module qua `module-registry.ts`, `TdtuStore` (`useSyncExternalStore`) và `SyncManager`; Backend tách rõ `routes/`, `middlewares/`, `controllers/`, `services/`, `models/`.
3. **Kiến trúc Cắm-và-Chạy (Plug-and-Play Engine):** Sử dụng mô hình **Chart Router** kết hợp với **Widget Registry** và **Adapter Pattern**, cho phép mở rộng thêm báo cáo mới mà không chạm vào mã nguồn lõi.
4. **Cốt lõi Node.js native & React 18 TypeScript + `esbuild` (Zero Bloatware):** Backend chạy Node.js native (`v22+` / `v24+`) với cờ `--experimental-strip-types` tốc độ cao, `esbuild` là devDependency duy nhất phục vụ đóng gói Frontend thành `dist/app.bundle.js` (<300ms). Giao diện chuẩn nhận diện đại học TDTU (`#003087`, `#dc2626`, `#ffffff`, `#1f2937`).
5. **Bảo mật kép & Phân quyền Toán học (Dual Auth + Prime RBAC):** Hỗ trợ Google Workspace SSO giới hạn nghiêm ngặt domain `@tdtu.edu.vn` (Giảng viên) và `@student.tdtu.edu.vn` (Sinh viên) kết hợp Firebase Auth, đồng bộ trạng thái **Trong kỳ / Ngoài kỳ** tự động theo dữ liệu học kỳ thực tế và Ma trận phân quyền tích số nguyên tố (`prime-rbac.ts`).

---

## 2. BẢNG DANH MỤC CÔNG NGHỆ CHÍNH XÁC (ZERO BLOATWARE)

> [!IMPORTANT]
> **Cam kết tính trung thực của mã nguồn:** Hệ thống chỉ sử dụng đúng các công nghệ lõi bên dưới, **tuyệt đối không sử dụng bất kỳ thư viện hoặc framework dư thừa nào** (không Express, không NestJS, không Next.js, không Redux, không Webpack/Vite, không Jest/Mocha, không CSDL bên ngoài như MySQL/PostgreSQL/MongoDB/Redis/Kafka).

| Thành phần | Công nghệ sử dụng | Chế độ / Phiên bản | Mục đích & Mô tả kỹ thuật |
| :--- | :--- | :--- | :--- |
| **Backend Runtime** | **Node.js** | `v22+` / `v24+` native | Chạy trực tiếp TypeScript bằng cờ `--experimental-strip-types`. Server HTTP tích hợp sẵn từ module chuẩn `node:http`. Zero third-party web framework. |
| **Cơ sở dữ liệu Backend** | **SQLite** (`node:sqlite`) | DatabaseSync (WAL mode) | Lưu trữ hồ sơ sinh viên cô lập theo học kỳ (`semester_enrollments`), trạng thái hệ thống (`system_state`), thông báo, JD, chứng chỉ cục bộ siêu nhẹ. |
| **Bộ kiểm thử tự động** | **Node.js Test Runner** (`node:test`) | Native Module | Kiểm thử đơn vị và tích hợp **36/36 tests pass** tự động (`14` API/Security/Semester + `7` Prime RBAC/480 assertions + `15` Reporting Adapter). |
| **Giao diện Frontend** | **React 18 & ReactDOM 18** | CDN Production | Xây dựng Single-Page Application (SPA) với `ModuleRegistry`, SPA Deep-Linking Router (`history.pushState`), `TdtuStore` và `TabErrorBoundary`. |
| **Đóng gói Frontend** | **`esbuild` Bundle Script** | `scripts/build-frontend.mjs` | Biên dịch trước `21` module `.ts`/`.tsx` thành tệp `dist/app.bundle.js` (~906.8 KB) trong <300ms, bỏ hoàn toàn phụ thuộc trình biên dịch Babel phía trình duyệt. |
| **Hệ thống Styling UI** | **Tailwind CSS** | CDN Engine | Utility-first CSS cấu hình bảng màu chuẩn đại học TDTU (`tdtu-primary: #003087`, `tdtu-red: #dc2626`, v.v.), tích hợp `@media print` xuất file A4 chuẩn. |
| **Xử lý Bảng tính Excel** | **SheetJS** (`xlsx`) | `v0.18.5` CDN | Đọc và ghi file Excel (`.xlsx`, `.xls`) trực tiếp trên trình duyệt phục vụ nhập danh sách sinh viên và xuất báo cáo kết quả thực tập. |
| **Nền tảng Cloud & Auth** | **Google Firebase** | Firebase Hosting & Auth | Lưu trữ web tĩnh tốc độ cao; xác thực Google SSO trường Đại học Tôn Đức Thắng (`@tdtu.edu.vn`, `@student.tdtu.edu.vn`). |
| **Cơ sở dữ liệu Realtime** | **Cloud Firestore** | Firebase Compat SDK `v10.13.0` | Đồng bộ đa thiết bị (`tdtu_students`, `tdtu_system/students_meta`, `tdtu_system/semesters`, `tdtu_declarations`, `tdtu_certificates`, `tdtu_student_cv`) kết hợp RAM Snapshot Cache & SWR. |
| **Đồng bộ Liên Tab** | **SyncManager 3 Tầng** | BroadcastChannel + Storage + EventBus | Kênh truyền `tdtu_realtime_sync` đồng bộ dữ liệu và học kỳ tức thì giữa các tab trình duyệt. |
| **Đóng gói Triển khai** | **Docker & Compose** (Tùy chọn) | `Dockerfile`, `docker-compose.yml` | Đóng gói môi trường Fullstack độc lập một lệnh `docker compose up -d` dành cho môi trường máy chủ Linux/Windows. |

---

## 3. CẤU TRÚC THƯ MỤC HỆ THỐNG CHUẨN DOANH NGHIỆP

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
│   │   │   ├── utils/
│   │   │   │   ├── response.ts
│   │   │   │   └── student-helper.ts
│   │   │   └── server.ts                        # Điểm khởi chạy HTTP Server (Port 3000)
│   │   └── tests/                               # Bộ kiểm thử tự động Backend & RBAC (21/21 Pass)
│   │       ├── api.test.ts                      # 14 tests API, Security P0/P1 & Cô lập Học kỳ
│   │       └── prime-rbac.test.ts               # 7 tests (kèm 480 assertions vét cạn Prime RBAC)
│   └── frontend/                                # Phân hệ giao diện React 18 TypeScript (.ts / .tsx)
│       ├── package.json
│       ├── tsconfig.json
│       ├── index.html                           # HTML Host nạp production bundle ./dist/app.bundle.js
│       ├── dist/app.bundle.js                   # Production bundle biên dịch từ 21 module qua esbuild
│       ├── data/                                # Dữ liệu gốc ban đầu (seed HK1) & Excel mẫu
│       └── src/
│           ├── config/
│           │   ├── firebase.config.ts           # Kết nối Firebase Auth & Cloud Firestore
│           │   └── module-registry.ts           # SPA Router, ModuleRegistry & 3-Tier SyncManager
│           ├── services/
│           │   ├── api.client.ts                # HTTP Client, Firestore Sync, Snapshot Store & SWR Cache
│           │   └── prime-rbac.ts                # Kiểm tra quyền nguyên tố phía Client
│           ├── components/
│           │   ├── common/                      # AdminNotificationModal.tsx, Navbar.tsx, Sidebar.tsx
│           │   └── student/                     # StudentEligibilityBanner.tsx
│           ├── pages/                           # 12 trang chức năng nghiệp vụ (.tsx)
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
│           │   ├── ProfilePage.tsx
│           │   └── AccountsPage.tsx
│           ├── App.tsx                          # Điều phối Routing, TdtuStore & Popup Thông báo
│           └── index.css                        # Stylesheet chuẩn TDTU & @media print A4
├── scripts/
│   └── build-frontend.mjs                       # Build script esbuild biên dịch 21 modules Frontend
├── Adapter_Code/reporting-adapter-demo/         # Gói Demo Độc lập Chart Router & Adapter (15/15 Pass)
├── docs/                                        # Tài liệu báo cáo, kiến trúc, API và hướng dẫn
├── Dockerfile & docker-compose.yml              # Container hóa Fullstack Node.js + React TypeScript
├── firebase.json & firestore.rules              # Cấu hình Firebase Hosting & Bảo mật Firestore
├── package.json                                 # Scripts điều khiển toàn dự án
├── start-local.bat                              # Phím tắt khởi chạy 1-Click trên Windows
└── README.md                                    # Hướng dẫn tổng thể dự án
```

---

## 4. HƯỚNG DẪN KHỞI CHẠY & KIỂM THỬ

### 4.1. Chạy Trực tiếp trên Máy tính Cá nhân (Local Run)
1. Nhấp đúp vào `start-local.bat` trên Windows, hoặc mở PowerShell / Terminal tại thư mục gốc `Dashoard_TSNN-main` và chạy:
   ```powershell
   npm start
   ```
2. Mở trình duyệt web truy cập:
   ```text
   http://localhost:3000
   ```

### 4.2. Chạy Bộ Kiểm thử Tự động (36/36 Automated Tests)
Để xác minh toàn bộ logic nghiệp vụ Backend API, cô lập học kỳ SQLite, phân quyền Prime RBAC, tra cứu MST, chống spam thông báo, bộ test an ninh P0/P1 và kiến trúc Chart Router / Adapter V1-V2:
```powershell
npm test
```
*Kết quả:* **36/36 Tests Pass (100%)** (`14 API, Security & Semester Isolation tests` + `7 Prime RBAC tests` + `15 Adapter & Chart Router tests`). Thời gian chạy ~1.4s không cần cài Jest/Mocha.

### 4.3. Biên dịch & Triển khai Lên Firebase Hosting (Production)
```powershell
npm run build
npm run deploy:firebase
```
Ứng dụng trực tuyến được cập nhật ngay tại: https://dashboard-39cf8.web.app

---

## 5. QUY TRÌNH KẾ THỪA VÀ PHÁT TRIỂN TIẾP THEO

### 5.1. Thêm một API Endpoint mới (Backend TypeScript)
1. Viết hàm xử lý nghiệp vụ trong `TDTU_DB_CNTT_System/backend/src/services/<ten-phan-he>.service.ts`.
2. Viết hàm xử lý HTTP Request/Response trong `TDTU_DB_CNTT_System/backend/src/controllers/<ten-phan-he>.controller.ts`.
3. Đăng ký route vào `TDTU_DB_CNTT_System/backend/src/routes/api.router.ts`.
4. Bổ sung test case vào `TDTU_DB_CNTT_System/backend/tests/api.test.ts` và chạy `npm test`.

### 5.2. Thêm một Trang Giao diện mới (Frontend TypeScript + `esbuild`)
1. Tạo component mới tại `TDTU_DB_CNTT_System/frontend/src/pages/MyNewPage.tsx` và gắn vào `(window as any).MyNewPage = MyNewPage;`.
2. Bổ sung đường dẫn `'src/pages/MyNewPage.tsx'` vào mảng `SOURCE_FILES` trong `scripts/build-frontend.mjs`.
3. Đăng ký module mới vào `MODULE_DEFINITIONS` trong `TDTU_DB_CNTT_System/frontend/src/config/module-registry.ts` (kèm route path & `featureKey`), thêm mục điều hướng trong `Sidebar.tsx` và render trong `App.tsx`.
4. Chạy `npm run build` để cập nhật `dist/app.bundle.js` (và tăng chuỗi `?v=...` trên `index.html`).

### 5.3. Thêm Biểu đồ Mới vào Dashboard (Chart Router Engine)
Xem hướng dẫn chi tiết từng bước tại [`HUONG_DAN_TAO_CHART_PLUGIN_MOI.md`](./HUONG_DAN_TAO_CHART_PLUGIN_MOI.md). Đội nhóm chỉ cần tạo duy nhất 01 file `.ts` trong `TDTU_DB_CNTT_System/backend/src/services/charts/`, hệ thống sẽ tự động hiển thị trên Dashboard mà không cần sửa code cũ.

---

## 6. CÁC QUY TẮC NGHIỆP VỤ MỚI NHẤT (PHIÊN BẢN v3.2.0)

Khi tiếp quản hoặc mở rộng mã nguồn, đội nhóm kỹ sư cần lưu ý các quy tắc nghiệp vụ quan trọng đã được đồng bộ hóa toàn hệ thống:

1. **Kho Lưu trữ Học kỳ Động (Dynamic Semesters Registry):**
   - Danh sách học kỳ không bị fix cứng trong code. Danh sách học kỳ được lưu trữ trên Firestore (`tdtu_system/semesters`) và đồng bộ xuống `localStorage`.
   - Bất kỳ khi nào Quản trị viên tạo học kỳ mới ở trang *Quản lý học kỳ* (`SemestersPage.tsx`), học kỳ đó lập tức xuất hiện trong tất cả dropdown của hệ thống (*Navbar*, *Bảng điều khiển*, *Quản lý sinh viên*, *Nhập file Excel*, *Báo cáo & Ra quyết định*).
   - Số lượng sinh viên trong từng thẻ học kỳ được đếm chính xác dựa trên danh sách sinh viên thực tế thuộc học kỳ đó (`students.filter(s => s.semester === sem.code)`), không hiển thị số ảo.

2. **Cách ly Hạn chót Sinh viên (Student Deadline Isolation):**
   - Giảng viên có thể chuyển đổi linh hoạt giữa các học kỳ trên thanh Header để quản lý sinh viên của các khóa khác nhau.
   - Phía Sinh viên: Hạn chót và thời gian hiển thị được ưu tiên trích xuất từ **học kỳ mà sinh viên đó thực sự có tên trong danh sách**. Việc Giảng viên kích hoạt xem học kỳ khác hoàn toàn không làm xáo trộn hoặc hiển thị sai hạn chót của sinh viên.

3. **Chính sách Chứng chỉ Ngoại ngữ Duy nhất (Single Certificate Replacement):**
   - Mỗi sinh viên chỉ duy trì tối đa **01 chứng chỉ tiếng Anh hợp lệ** trên hệ thống.
   - Khi sinh viên khai báo chứng chỉ mới, hồ sơ mới sẽ tự động **thay thế hoàn toàn** chứng chỉ cũ ở cả giao diện Sinh viên lẫn giao diện Giảng viên.
   - Sinh viên nộp hoặc cập nhật chứng chỉ không phát sinh thông báo rác gửi đến Giảng viên.

4. **Quy trình Duyệt Ứng tuyển JD 2 Bước (2-Step Application Review):**
   - Bảng tin tuyển dụng và danh sách hồ sơ ứng tuyển được dọn sạch dữ liệu giả định ban đầu.
   - Số lượng hồ sơ nộp hiển thị trên tab *Hồ sơ SV ứng tuyển* luôn phản ánh số lượng bản ghi thực tế.
   - Khi Giảng viên nhấn nút duyệt nhận thực tập: Hệ thống mở popup xác nhận hiển thị đầy đủ thông tin (Mã sinh viên, tên vị trí, doanh nghiệp ứng tuyển, thời gian nộp đơn). Khi Giảng viên phê duyệt, hệ thống tự động cập nhật trạng thái hồ sơ của sinh viên sang **"Đã có nơi TT"** theo thời gian thực.

5. **Chuẩn hóa Danh xưng Giảng viên & Tinh giản Giao diện UI:**
   - Chuẩn hóa toàn bộ danh xưng Giảng viên thành tiền tố duy nhất: **`GV. [Họ và tên]`** (ví dụ: `GV. Dương Hữu Phúc`), loại bỏ các học vị chưa xác định (`TS.`, `ThS.`).
   - Giao diện người dùng được tinh giản cô đọng: Loại bỏ các khung hướng dẫn rườm rà, cam kết rút ngắn thành 1 dòng, thông báo toast ngắn gọn, tập trung tối đa vào trải nghiệm làm việc thực tế.

6. **Cô lập Dữ liệu Khai báo Thực tập theo từng Học kỳ phía Sinh viên (Student Semester Declaration Isolation):**
   - Đảm bảo tính độc lập học vụ: Khi sinh viên đã khai báo thực tập ở Học kỳ 1, nếu chuyển sang Học kỳ 2 trên thanh điều hướng, màn hình khai báo sẽ khởi tạo form mới (trạng thái "Chưa khai báo", danh sách rỗng), không hiển thị thông tin của Học kỳ 1.
   - Cơ chế lưu trữ cục bộ có tiền tố học kỳ: Khóa LocalStorage được đặt theo mẫu `tdtu_decl_${activeSemester}_${studentId}`.
   - Khi sinh viên quay lại Học kỳ 1, toàn bộ thông tin đã đăng ký trước đó được nạp lại đầy đủ, đảm bảo an toàn dữ liệu và tính nhất quán.

7. **Kiến trúc `esbuild` Bundle & Quản lý Cache Phiên bản:**
   - Toàn bộ Frontend sử dụng tệp bundle duy nhất `dist/app.bundle.js` biên dịch qua `scripts/build-frontend.mjs`, luôn gắn tham số phiên bản (hiện tại `?v=20261117_v125_firestore_rules_import_fix`) trên `index.html`.
8. **Cô lập Danh sách Sinh viên Đa kỳ ở Tầng SQLite & Firestore (`v124`–`v125`):**
   - SQLite tách riêng bảng `semester_enrollments` và `system_state` (`students_meta_<sem>`); Cloud Firestore dùng khóa chuẩn `${semester}_${sid}` kết hợp `tdtu_system/students_meta` (`cleared`, `datasetVersion`, `count`) để không bao giờ quay về dữ liệu mẫu `/data/real-students.json` hay danh sách cũ khi thay thế hoặc xóa sạch danh sách.
   - Trong `importStudentsExcel(mode = 'replace')`, hệ thống đọc danh sách cũ từ server (`_deleteFirestoreStudentsForSemester`), xóa sạch cả bản chuẩn lẫn bản legacy không prefix `<sid>`, sau đó mới ghi từng batch `150` docs và cập nhật `recomputeAndSyncSemesterMeta()` — tuyệt đối không nuốt lỗi Firestore khi đang trực tuyến.
   - `_extractDocSemAndSid()` đảm bảo bản ghi có prefix học kỳ luôn được ưu tiên đè lên bản legacy nếu đồng tồn tại, đồng thời hỗ trợ cả MSSV có chứa ký tự `_` hoặc `/`.
9. **Xác định Sinh viên Trong kỳ / Ngoài kỳ Động (Live Enrollment Claim):**
   - Bỏ hoàn toàn mọi trạng thái `isEnrolledThisSemester` gắn cứng. Backend (`auth.service.ts` `resolveCurrentClaims` & `loginWithGoogle`) và Frontend (`ApiClient.isStudentEnrolledInSemester`, `PrimeRbac`, `ModuleRegistry`, `App.tsx`, `Sidebar.tsx`, `Navbar.tsx`, `DashboardPage.tsx`) đều đối chiếu trực tiếp với danh sách sinh viên của học kỳ active (`fail-closed` khi danh sách rỗng `[]`). Khi giảng viên xóa sinh viên khỏi kỳ, tài khoản sinh viên tự chuyển về `sv_ngoai_ky`.
10. **Tối ưu Tốc độ Tải Trang Quản lý Sinh viên & Firestore Rules (`StudentsPage.tsx`):**
    - `ApiClient` lưu Snapshot trong RAM (`_studentsSnapshotMap`, `_declsSnapshotMap`, `_certsSnapshotList`, `_cvSnapshotMap`, `_notesSnapshotMap`), khử trùng lặp request song song (`_liveStudentsInFlight`), phục vụ hiển thị tức thì theo **Stale-While-Revalidate** (`getCachedStudentsSync`) và `probeBackend()` qua `GET /api/health`.
    - `StudentsPage.tsx` debounce listener (120ms), tránh vòng lặp re-render ở modal chi tiết (`[selectedSid, activeSemester]` + `enrichedModalKeyRef`), dùng `fetchSeqRef` tránh race-condition khi đổi học kỳ nhanh, và sửa `firestore.rules` (`allow read: if true;`) để truy vấn toàn collection hoạt động ổn định cả khi đăng nhập bằng mật khẩu nội bộ.
