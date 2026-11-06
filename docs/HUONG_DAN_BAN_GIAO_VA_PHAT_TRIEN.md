# TÀI LIỆU HƯỚNG DẪN BÀN GIAO & PHÁT TRIỂN HỆ THỐNG DB_CNTT
## HỆ THỐNG QUẢN LÝ THỰC TẬP, TỰ ĐỘNG HÓA JD & HỖ TRỢ RA QUYẾT ĐỊNH (100% TYPESCRIPT)
### KHOA CÔNG NGHỆ THÔNG TIN - TRƯỜNG ĐẠI HỌC TÔN ĐỨC THẮNG (TDTU)
*Phiên bản: v3.2.0 | Cập nhật hoàn thiện: 06/11/2026*

---

## 1. MỤC TIÊU VÀ ĐỊNH HƯỚNG THIẾT KẾ BỀN VỮNG

Dự án **DB_CNTT (`v3.2.0`)** được thiết kế theo các tiêu chuẩn kỹ thuật nghiêm ngặt nhằm phục vụ mục tiêu **bàn giao trơn tru** cho các đội nhóm sinh viên, giảng viên và kỹ sư kế thừa (2026 – 2031):
1. **Đồng nhất 100% TypeScript (`.ts` & `.tsx`):** Toàn bộ Backend (19 tệp `.ts`), Frontend (14 trang `.tsx`, 4 components `.tsx`, 3 services/config `.ts`) và Gói minh chứng kiến trúc (`Adapter_Code/`) đều viết bằng TypeScript thuần.
2. **Module hóa triệt để (True Modularity & Clean 3-Tier Architecture):** Tuyệt đối không nhồi nhét code vào một file duy nhất. Mỗi trang (`pages/*.tsx`), thành phần (`components/**/*.tsx`), dịch vụ (`services/*.ts`), bộ điều khiển (`controllers/*.ts`) đều tách biệt rõ ràng.
3. **Kiến trúc Cắm-và-Chạy (Plug-and-Play Engine):** Sử dụng mô hình **Chart Router** kết hợp với **Widget Registry** và **Adapter Pattern**, cho phép mở rộng thêm báo cáo mới mà không chạm vào mã nguồn lõi.
4. **Cốt lõi Node.js native & React 18 TypeScript (Zero Bloatware):** Backend chạy Node.js native (`v22+` / `v24+`) với cờ `--experimental-strip-types` tốc độ cao, zero-dependency bên ngoài. Frontend React 18 với giao diện chuẩn nhận diện đại học TDTU (`#003087`, `#dc2626`, `#ffffff`, `#1f2937`).
5. **Bảo mật kép & Phân quyền Toán học (Dual Auth + Prime RBAC):** Hỗ trợ Google Workspace SSO giới hạn nghiêm ngặt domain `@tdtu.edu.vn` (Giảng viên) và `@student.tdtu.edu.vn` (Sinh viên) kết hợp Firebase Auth và Ma trận phân quyền tích số nguyên tố (`prime-rbac.ts`).

---

## 2. BẢNG DANH MỤC CÔNG NGHỆ CHÍNH XÁC (ZERO BLOATWARE)

> [!IMPORTANT]
> **Cam kết tính trung thực của mã nguồn:** Hệ thống chỉ sử dụng đúng các công nghệ lõi bên dưới, **tuyệt đối không sử dụng bất kỳ thư viện hoặc framework dư thừa nào** (không Express, không NestJS, không Next.js, không Redux, không Webpack/Vite, không Jest/Mocha, không CSDL bên ngoài như MySQL/PostgreSQL/MongoDB/Redis/Kafka).

| Thành phần | Công nghệ sử dụng | Chế độ / Phiên bản | Mục đích & Mô tả kỹ thuật |
| :--- | :--- | :--- | :--- |
| **Backend Runtime** | **Node.js** | `v22+` / `v24+` native | Chạy trực tiếp TypeScript bằng cờ `--experimental-strip-types`. Server HTTP tích hợp sẵn từ module chuẩn `node:http`. Zero third-party web framework. |
| **Cơ sở dữ liệu Backend** | **SQLite** (`node:sqlite`) | DatabaseSync (WAL mode) | Module SQLite chuẩn tích hợp sẵn trong Node.js. Lưu trữ hồ sơ sinh viên, thông báo, JD, cấu hình đợt thực tập cục bộ siêu nhẹ, không cần cài server CSDL rời. |
| **Bộ kiểm thử tự động** | **Node.js Test Runner** (`node:test`) | Native Module | Kiểm thử đơn vị và tích hợp 24/24 tests pass tự động (API, Prime RBAC, Reporting Adapter), thực thi trực tiếp không cần Jest/Mocha. |
| **Giao diện Frontend** | **React 18 & ReactDOM 18** | CDN Production | Xây dựng Single-Page Application (SPA) dạng component độc lập, quản lý state qua React Hooks (`useState`, `useEffect`, `useCallback`, `useMemo`). |
| **Trình chuyển ngữ TSX** | **Babel Standalone** (`@babel/standalone`) | CDN Runtime | Chuyển ngữ trực tiếp JSX/TSX trên trình duyệt với preset `tsx`, cho phép cập nhật code hiển thị ngay tức thì mà không cần bước build phức tạp. |
| **Hệ thống Styling UI** | **Tailwind CSS** | CDN Engine | Utility-first CSS cấu hình bảng màu chuẩn đại học TDTU (`tdtu-primary: #003087`, `tdtu-red: #dc2626`, v.v.), tích hợp `@media print` xuất file A4 chuẩn. |
| **Xử lý Bảng tính Excel** | **SheetJS** (`xlsx`) | `v0.18.5` CDN | Đọc và ghi file Excel (`.xlsx`, `.xls`) trực tiếp trên trình duyệt phục vụ nhập danh sách sinh viên và xuất báo cáo kết quả thực tập. |
| **Nền tảng Cloud & Auth** | **Google Firebase** | Firebase Hosting & Auth | Lưu trữ web tĩnh tốc độ cao; xác thực Google SSO trường Đại học Tôn Đức Thắng (`@tdtu.edu.vn`, `@student.tdtu.edu.vn`). |
| **Cơ sở dữ liệu Realtime** | **Cloud Firestore** | Firebase Compat SDK | Đồng bộ thời gian thực trạng thái nộp đơn, ứng tuyển JD, thông báo học vụ giữa Giảng viên và Sinh viên qua `onSnapshot`. |
| **Đồng bộ Liên Tab** | **BroadcastChannel API** | Web Standard API | Kênh truyền `tdtu_realtime_sync` đồng bộ dữ liệu giữa các tab trình duyệt cùng lúc không có độ trễ. |
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
│   │   │   ├── utils/response.ts
│   │   │   └── server.ts                        # Điểm khởi chạy HTTP Server (Port 3000)
│   │   └── tests/                               # Bộ kiểm thử tự động Backend & RBAC (9/9 Pass)
│   │       ├── api.test.ts
│   │       └── prime-rbac.test.ts
│   └── frontend/                                # Phân hệ giao diện React 18 TypeScript (.ts / .tsx)
│       ├── package.json
│       ├── tsconfig.json
│       ├── index.html                           # HTML Host cấu hình Babel Standalone TSX Runtime
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

### 4.2. Chạy Bộ Kiểm thử Tự động (24/24 Automated Tests)
Để xác minh toàn bộ logic nghiệp vụ Backend API, phân quyền Prime RBAC, tra cứu MST, chống spam thông báo và kiến trúc Chart Router / Adapter V1-V2:
```powershell
npm test
```
*Kết quả:* **24/24 Tests Pass (100%)** (`6 API tests` + `3 Prime RBAC tests` + `15 Adapter & Chart Router tests`). Thời gian chạy ~1.3s không cần cài Jest/Mocha.

### 4.3. Triển khai Lên Firebase Hosting (Production)
```powershell
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

### 5.2. Thêm một Trang Giao diện mới (Frontend TypeScript)
1. Tạo component mới tại `TDTU_DB_CNTT_System/frontend/src/pages/MyNewPage.tsx` và gắn vào `(window as any).MyNewPage = MyNewPage;`.
2. Khai báo thẻ `<script type="text/babel" data-presets="tsx" src="./src/pages/MyNewPage.tsx?v=..."></script>` trong `TDTU_DB_CNTT_System/frontend/index.html`.
3. Thêm mục điều hướng vào `Sidebar.tsx` và `App.tsx`.

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

7. **Nâng cấp Thẩm mỹ UI/UX & Cơ chế Quản lý Cache Động:**
   - Phiên bản Frontend mới nhất trên nhánh `522H0045` tích hợp phong cách giao diện hiện đại, bóng bẩy, trực quan hóa trạng thái và phản hồi nhanh.
   - Thẻ nhúng TypeScript trên `index.html` luôn đi kèm tham số phiên bản `?v=20261106_v119_ui_enhancements` ngăn ngừa việc trình duyệt người dùng giữ lại mã cũ sau khi cập nhật.
