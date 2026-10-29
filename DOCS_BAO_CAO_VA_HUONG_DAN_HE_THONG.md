# 📘 TÀI LIỆU BÁO CÁO KỸ THUẬT & HƯỚNG DẪN VẬN HÀNH HỆ THỐNG
## HỆ THỐNG QUẢN LÝ THỰC TẬP & DASHBOARD TSNN (DB_CNTT)
### KHOA CÔNG NGHỆ THÔNG TIN — TRƯỜNG ĐẠI HỌC TÔN ĐỨC THẮNG (TDTU)

> **Dành cho:** Giảng viên phụ trách, Ban chủ nhiệm Khoa, Hội đồng đánh giá và các thế hệ lập trình viên/sinh viên kế thừa và phát triển dự án trong 5 năm tới.

---

## 1. TỔNG QUAN HỆ THỐNG & CẤU TRÚC MONOREPO

Hệ thống được thiết kế theo cấu trúc **Monorepo tiêu chuẩn công nghiệp**, phân tách rạch ròi giữa Hợp đồng dữ liệu chung (`packages/shared-types`), Dịch vụ Backend & Reporting Engine (`apps/api`) và Ứng dụng Giao diện Frontend (`apps/web` & `index.html`).

```
d:\KTCN_TSNN\Dashoard_TSNN-main/
├── 📁 apps/
│   ├── 📁 api/                                  # Dịch vụ Backend & Reporting Microservice
│   │   ├── 📁 prisma/
│   │   │   └── schema.prisma                    # Schema CSDL PostgreSQL 17 chuẩn hóa
│   │   ├── 📁 src/
│   │   │   ├── 📁 data/
│   │   │   │   ├── real-students.json           # 91 sinh viên thực tế (134 lượt đăng ký môn)
│   │   │   │   └── db_cntt.sqlite               # CSDL SQLite lưu trữ bền vững (Persistent DB)
│   │   │   ├── 📁 database/
│   │   │   │   └── sqlite.db.ts                 # Quản trị kết nối & khởi tạo bảng CSDL
│   │   │   ├── 📁 modules/
│   │   │   │   ├── 📁 auth/                     # Xác thực Google SSO TDTU + Firebase Auth
│   │   │   │   ├── 📁 students/                 # Quản lý 91 sinh viên & Import Excel 14 cột
│   │   │   │   ├── 📁 internship/               # Adapter tra cứu MST + Khai báo 1 hoặc 2 môn
│   │   │   │   ├── 📁 certificates/             # Thẩm định Chuẩn Ngoại Ngữ Tốt Nghiệp TDTU
│   │   │   │   ├── 📁 bulletin/                 # Bảng tin 2 tầng + Inbound Email Forward Parser
│   │   │   │   └── 📁 reporting/                # Reporting Microservice (WidgetRegistry + ChartRouter)
│   │   │   └── main.ts                          # API Gateway điều phối RESTful & Static Web SPA
│   │   ├── 📁 tests/
│   │   │   └── api.test.ts                      # Bộ kiểm thử tự động 17 Test Suites (PASS 100%)
│   │   └── package.json
│   │
│   └── 📁 web/                                  # Ứng dụng Frontend React 19 + TypeScript
│       ├── 📁 src/
│       │   ├── 📁 components/layout/            # AppHeader, Navigation
│       │   ├── 📁 features/
│       │   │   ├── 📁 dashboard/                # Thẻ Metric & Biểu đồ tương tác thời gian thực
│       │   │   ├── 📁 students/                 # Bảng dữ liệu theo dõi 91 SV + Bộ lọc tức thì
│       │   │   ├── 📁 internship/               # Form chọn 1 hoặc 2 môn + Bảng đối soát MST
│       │   │   ├── 📁 certificates/             # Khai báo chứng chỉ ngoại ngữ chuẩn TDTU
│       │   │   └── 📁 bulletin/                 # Bảng tin Tầng 1 (Tin GV) & Tầng 2 (JD tuyển dụng)
│       │   ├── 📁 services/api.client.ts        # Client kết nối API Backend
│       │   ├── App.tsx                          # Root Component React
│       │   └── main.tsx
│       └── package.json
│
├── 📁 packages/
│   └── 📁 shared-types/                         # Hợp đồng dữ liệu TypeScript dùng chung FE ↔ BE
│       ├── src/index.ts                         # Interface: Student, Declaration, Tax, Cert, Bulletin
│       └── package.json
│
├── 📁 demo_dashboard/                           # Bản phân phối kiểm thử Web
│   ├── enhanced_students.json
│   └── index.html
│
├── 📁 Hình/                                     # Sơ đồ kiến trúc kỹ thuật & Mockup hệ thống
├── data_sinhvien.csv                            # Dữ liệu gốc 91 sinh viên từ Khoa CNTT
├── DSSV KTCN - TSNN HK1_2026-2027.xlsx          # File Excel danh sách gốc HK1
├── Ke_Hoach_Phat_Trien_DB_CNTT.docx             # Đề cương kế hoạch nghiên cứu gốc
├── docker-compose.yml                           # Đóng gói Production (PostgreSQL 17 + Redis 7)
├── index.html                                   # Giao diện Web SPA tích hợp đầy đủ
├── package.json                                 # Cấu hình Monorepo gốc
├── project-master-plan-6weeks.md                # Bản kế hoạch tổng thể chi tiết
├── start-demo.bat                               # Khởi động 1-Click mở web & chạy máy chủ
└── DOCS_BAO_CAO_VA_HUONG_DAN_HE_THONG.md        # Tài liệu hướng dẫn này
```

---

## 2. HƯỚNG DẪN KHỞI CHẠY HỆ THỐNG (CHỈ MẤT 10 GIÂY)

### Cách 1: Khởi động 1-Click bằng file Batch (Khuyên dùng trên Windows)
1. Mở thư mục dự án `d:\KTCN_TSNN\Dashoard_TSNN-main`.
2. Click đúp vào file **`start-demo.bat`**.
3. Hệ thống sẽ tự động:
   * Khởi chạy Backend API Gateway & Reporting Microservice tại cổng `3000`.
   * Tự động mở trình duyệt web tại địa chỉ: **`http://localhost:3000`**.

### Cách 2: Khởi động bằng dòng lệnh qua Node.js
Mở PowerShell hoặc Command Prompt tại thư mục dự án và chạy:
```bash
npm start
# Hoặc: node apps/api/src/main.ts
```
Truy cập trình duyệt: **`http://localhost:3000`**.

### Cách 3: Đóng gói và chạy bằng Docker Compose (Môi trường Production)
```bash
docker compose up -d
```
Hệ thống sẽ tự động dựng cụm container PostgreSQL 17 và Redis 7 kết hợp với Backend service.

---

## 3. HƯỚNG DẪN CHẠY KIỂM THỬ TỰ ĐỘNG (AUTOMATED TEST SUITE)

Hệ thống được trang bị bộ kiểm thử tích hợp và bảo mật gồm **17 kịch bản kiểm thử toàn diện** (Unit, Integration, Security, Edge Cases & Regression Tests) bằng `node:test` tích hợp sẵn của Node.js:

```bash
node --test apps/api/tests/api.test.ts
```

### Danh mục 17 bài kiểm thử đã được bảo đảm PASS 100%:
1. **Dữ liệu thực tế:** Trả về đúng 91 sinh viên duy nhất, 134 lượt đăng ký môn và 43 SV đi cả 2 môn.
2. **Khai báo 2 môn & Tra cứu MST:** Khai báo đồng thời KTCN + TSNN tại FPT Software (`0303882213`).
3. **Chuẩn ngoại ngữ TDTU:** Thẩm định danh mục chứng chỉ chuẩn đầu ra tốt nghiệp TDTU.
4. **Bảng tin 2 tầng:** Thông báo của Giảng viên (Tầng 1) và Tin tuyển dụng JD (Tầng 2).
5. **Reporting Microservice:** `WidgetRegistry` và `ChartRouter` xử lý linh hoạt Schema V1 và V2.
6. **Xác thực Google SSO TDTU:** Phân loại `@tdtu.edu.vn` (GV/Admin), `@student.tdtu.edu.vn` (SV) và chặn email ngoài.
7. **Bảo mật phân quyền (RBAC):** Sinh viên không thể sửa hồ sơ người khác hoặc gọi API đặc quyền.
8. **Phân quyền Admin:** Cấp quyền, thu hồi và chuyển nhượng quyền Admin giữa các Giảng viên.
9. **Inbound Email Forward Parser:** Bóc tách email tuyển dụng tự động và hỗ trợ sinh viên ứng tuyển.
10. **Lưu trữ bền vững SQLite:** Dữ liệu được bảo toàn nguyên vẹn qua các lần tắt/mở máy chủ.
11. **Kiểm thử biên (Edge Cases):** Chặn khai báo chưa xác nhận, chặn chứng chỉ lạ, chặn gỡ Admin cuối cùng.
12. **Kiểm thử hồi quy sinh viên:** Kiểm tra cấu trúc `data.items`, trạng thái `"Cần Khoa hỗ trợ"`.
13. **Kiểm thử MST Chi nhánh:** Tra cứu MST 13 số (`0303882213-001`), chặn MST rác (`--------`).
14. **Bảo mật chữ ký JWT:** Từ chối token bị can thiệp và kiểm tra đồng bộ giao diện HTML.
15. **Firebase Authentication:** Đồng bộ Firebase UID, xác thực ID Token và kiểm tra cổng truy cập.
16. **Quản lý Tài khoản Firebase:** Quản lý danh sách 95 tài khoản, tạo mới, khóa và mở khóa tài khoản.
17. **Bảo vệ tài khoản quản trị:** Chống hạ quyền Admin hoạt động duy nhất và đồng bộ mã nguồn giao diện.

---

## 4. HƯỚNG DẪN SỬ DỤNG CHI TIẾT TỪNG TÍNH NĂNG NGHIỆP VỤ

### 4.1. Đăng nhập & Chuyển đổi vai trò qua Trang Đăng Nhập
1. Truy cập `http://localhost:3000`. Nếu chưa đăng nhập hoặc khi bấm nút **"Trang Đăng Nhập"** ở góc trên, màn hình đăng nhập toàn diện sẽ xuất hiện.
2. Chọn **Cổng Giảng Viên / Admin** hoặc **Cổng Sinh Viên**.
3. Nhập email hoặc bấm vào bảng **"Chọn Nhanh Tài Khoản Mẫu TDTU"**:
   * *Admin toàn quyền:* `nguyenvana@tdtu.edu.vn`
   * *Giảng viên bộ môn:* `tranvanb@tdtu.edu.vn`
   * *Sinh viên đi 2 môn:* `51900839@student.tdtu.edu.vn` (Võ Duy Trí)
   * *Sinh viên chưa có công ty:* `519H0230@student.tdtu.edu.vn` (Trần Thiên Tấn)
4. Hệ thống sẽ cấp phát phiên làm việc JWT và mở khóa đúng các chức năng tương ứng với vai trò.

### 4.2. Khai báo Thực tập: Chọn 1 môn HOẶC 2 môn cùng lúc & Tra cứu MST tự động
1. Chuyển sang Tab **"Khai Báo Thực Tập & MST"**.
2. **Chọn môn học:** Sinh viên có thể tích chọn *Kiến tập công nghiệp*, *Tập sự nghề nghiệp* hoặc **tích chọn cả hai cùng lúc** nếu thực tập tại cùng 1 công ty.
3. **Nhập Mã Số Thuế (MST):** Nhập MST (ví dụ: `0303882213` - FPT, `0100109106` - Viettel, `0312345678` - VNG, `0309876543` - KMS...) và bấm **"Tra cứu MST"**.
4. **Đọc bảng đối soát thông tin:** Hệ thống tự động thu thập từ API và hiển thị Tên pháp lý công ty, Địa chỉ trụ sở, Người đại diện, Ngành nghề.
5. Sinh viên đọc kỹ, bổ sung Vị trí chuyên môn và Người hướng dẫn, tích chọn ô *"Tôi cam đoan thông tin chính xác"* và bấm **"Xác Nhận Thông Tin Chính Xác & Nộp Lại Hồ Sơ"**.
6. Nếu chưa có công ty, sinh viên chọn nút *"Chưa có nơi thực tập"* $\rightarrow$ Chọn *"Cần Khoa hỗ trợ"* và chọn lĩnh vực mong muốn để Thầy/Cô điều phối.

### 4.3. Chuẩn Ngoại Ngữ Tốt Nghiệp ĐH Tôn Đức Thắng
1. Chuyển sang Tab **"Chuẩn Ngoại Ngữ Tốt Nghiệp"**.
2. Chọn loại chứng chỉ trong danh mục được TDTU công nhận:
   * **TOEIC:** L&R $\ge 500$ (Tiêu chuẩn) hoặc $\ge 600$ (CLC).
   * **IELTS Academic:** $\ge 5.0$ (Tiêu chuẩn) hoặc $\ge 5.5 - 6.0$ (CLC).
   * **TOEFL iBT:** $\ge 45$ điểm.
   * **Cambridge English:** B2 First (FCE) hoặc C1 Advanced (CAE).
   * **VSTEP:** Bậc 3 (B1) hoặc Bậc 4 (B2).
   * **Aptis ESOL:** Cấp độ B1 / B2.
   * **Ngoại ngữ 2:** Tiếng Nhật (JLPT N4/N3), Tiếng Trung (HSK 3/4), Tiếng Hàn (TOPIK 3).
   * **Giấy cam kết nộp bổ sung:** Dành cho sinh viên đang ôn thi hoặc chờ cấp bằng.
3. Điền điểm số, số hiệu văn bằng, ngày thi và bấm **"Lưu & Gửi Minh Chứng Xét Duyệt"**.

### 4.4. Bảng Tin 2 Tầng: Thông báo Giảng viên (Tầng 1) & Tuyển dụng JD (Tầng 2)
1. Chuyển sang Tab **"Bảng Tin Giảng Viên & JD"**.
2. **Tầng 1 (Ở trên):** Hiển thị các thông báo chính thức, mốc thời hạn quan trọng có ghim (`📌 Đã ghim`). Giảng viên có nút **"+ Đăng Thông Báo Mới"** để gửi thông báo tức thì đến toàn thể sinh viên.
3. **Tầng 2 (Ở dưới):** Hiển thị tin tuyển dụng JD từ các doanh nghiệp đối tác thân hữu.
   * *Mô phỏng Email Forward:* Giảng viên bấm nút **"📬 Mô Phỏng Forward Email JD Mới"** để thử nghiệm luồng trích xuất tự động từ email Thầy/Cô chuyển tiếp.
   * *Duyệt 1-Click:* Giảng viên rà soát bản bóc tách trong hàng đợi và bấm **"✓ Duyệt 1-Click & Công Khai"** để đưa JD lên Bảng tin.
   * *Ứng tuyển:* Sinh viên xem quyền lợi/trợ cấp và bấm nút **"Ứng tuyển"** trực tiếp.

### 4.5. Quản lý Tài khoản Firebase (Dành cho Giảng viên / Admin)
1. Đăng nhập với vai trò Giảng viên (`@tdtu.edu.vn`).
2. Bấm nút **"🔥 Quản Lý TK Firebase"** trên thanh Header.
3. Modal quản trị hiển thị đầy đủ **95 tài khoản Firebase** (4 Giảng viên + 91 Sinh viên thực tế):
   * Tìm kiếm theo Họ tên, MSSV, Email hoặc Firebase UID.
   * Lọc theo vai trò (`GV` / `SV`) hoặc trạng thái (`Hoạt động` / `Đang bị khóa`).
   * Thao tác **"Khóa tài khoản"** hoặc **"Mở khóa"** (tài khoản bị khóa sẽ bị chặn đăng nhập ngay lập tức).
   * Khởi tạo tài khoản Firebase mới đồng bộ vào hệ thống.

### 4.6. Quy trình Giấy Giới Thiệu Thực Tập (GGT) - INT-02 & INT-03
1. **Sinh viên nộp đơn:** Chuyển sang Tab **"Giấy Giới Thiệu (GGT)"**.
   * Hệ thống tự động điền MSSV, Họ tên, Lớp, Ngành và Học phần đăng ký (1 hoặc 2 môn).
   * Điền Tên doanh nghiệp tiếp nhận, Địa chỉ, Người đại diện/Phòng nhân sự, Vị trí ứng tuyển và Mục đích.
   * Bấm **"Nộp Đơn Yêu Cầu Cấp GGT"** (Tạo bản ghi mã định dạng `GGT-2026/xxxx/CNTT` trạng thái `Chờ duyệt`).
2. **Khoa CNTT phê duyệt:** Giảng viên đăng nhập xem danh sách các đơn GGT của sinh viên và bấm **"Duyệt"**. Trạng thái chuyển thành `Đã duyệt` kèm thông tin người ký duyệt điện tử.
3. **In văn bản chuẩn A4:** Cả sinh viên và Thầy/Cô đều có thể bấm nút **"🖨️ In PDF"** để mở bản in Giấy giới thiệu trang trọng chuẩn quốc gia và ĐH Tôn Đức Thắng (có dấu xác nhận điện tử hợp lệ, mã tra cứu bảo mật, CSS in tự động căn chỉnh khổ giấy A4).

### 4.7. Danh mục Biểu mẫu, Quy định & Đề cương Thực tập - DATA-02
Chuyển sang Tab **"Biểu Mẫu & Quy Định"** để tra cứu và tải về 4 biểu mẫu chuẩn của Khoa CNTT - TDTU:
* **BM-01 (ĐỀ CƯƠNG):** Đề cương chi tiết học phần Thực tập doanh nghiệp (KTCN & TSNN) - Quy định khối lượng tối thiểu 320 giờ làm việc thực tế (PDF).
* **BM-02 (BIỂU MẪU):** Mẫu Nhật ký thực tập tuần & Báo cáo tiến độ chuyên môn có xác nhận của Mentor (DOCX).
* **BM-03 (BIỂU MẪU):** Phiếu nhận xét & Đánh giá kết quả thực tập của Doanh nghiệp (bắt buộc có chữ ký và mộc đỏ) (DOCX).
* **BM-04 (QUY ĐỊNH):** Quy chế Thực tập & Hướng dẫn bảo vệ Báo cáo tốt nghiệp Khoa CNTT - TDTU (PDF).

### 4.8. Kiểm tra Điều kiện Sinh viên (Student Eligibility) - AUTH-03
* Khi Sinh viên đăng nhập bằng Gmail TDTU (`@student.tdtu.edu.vn`), hệ thống tự động đối soát với danh sách 91 sinh viên đủ điều kiện làm học phần trong học kỳ.
* **Nếu hợp lệ:** Hiển thị thẻ thông báo xanh thẩm định hợp lệ, hiển thị rõ số môn đăng ký (1 môn hoặc 2 môn cùng lúc) và nút điều hướng nhanh đến Giấy giới thiệu.
* **Nếu chưa có tên trong danh sách:** Hiển thị thẻ cảnh báo học vụ màu vàng/cam hướng dẫn sinh viên xem quy chế tại Tab Biểu Mẫu hoặc liên hệ Văn phòng Khoa (Phòng C.003) để làm thủ tục phúc khảo đợt thực tập.

---

## 5. HƯỚNG DẪN TRIỂN KHAI, DEPLOY DOCKER & VẬN HÀNH

### 5.1. Triển khai 1-Click bằng Docker & Docker Compose
Hệ thống đã được đóng gói container hóa hoàn chỉnh qua [`Dockerfile`](file:///d:/KTCN_TSNN/Dashoard_TSNN-main/Dockerfile) và [`docker-compose.yml`](file:///d:/KTCN_TSNN/Dashoard_TSNN-main/docker-compose.yml):
```bash
# Cách 1: Chạy file script tự động trên Windows
.\deploy-docker.bat

# Cách 2: Lệnh Docker Compose thủ công
docker compose up --build -d
```
* **Dịch vụ được khởi chạy:**
  * `db_cntt_app`: Node.js 24 Alpine Gateway Server & Web Dashboard tại cổng `3000`.
  * `db_cntt_postgres`: PostgreSQL 17 Alpine tại cổng `5432`.
  * `db_cntt_redis`: Redis 7 Alpine tại cổng `6379`.
* **Cơ chế lưu trữ:** Thư mục CSDL SQLite `apps/api/src/data` được mount vào Docker Volume `sqlite_data`, đảm bảo dữ liệu sinh viên và khai báo không bị mất khi container restart.

### 5.2. Khởi động Trực tiếp trên Máy cá nhân (Local Runner)
```bash
# Cách 1: Chạy file script tự động trên Windows
.\start-local.bat

# Cách 2: Lệnh npm/node thủ công
node apps/api/src/main.ts
```
* Ứng dụng tự động khởi động tại `http://localhost:3000` và mở trình duyệt web.

### 5.3. Bộ Kiểm Thử Tự Động (18/18 Test Cases - 100% Pass)
Chạy bộ kiểm thử tự động với Node.js Test Runner:
```bash
node --test apps/api/tests/api.test.ts
```
Danh sách 18 kịch bản kiểm thử:
1. `Dữ liệu thực tế`: 91 sinh viên, 134 lượt môn, 43 SV đi 2 môn.
2. `Tra cứu MST & Khai báo 2 môn cùng lúc` tại cùng 1 doanh nghiệp.
3. `Chuẩn ngoại ngữ tốt nghiệp TDTU`: TOEIC, IELTS, TOEFL, Cambridge, VSTEP, Aptis.
4. `Bảng tin 2 tầng`: Thông báo Giảng viên (Tầng 1) & Tuyển dụng JD (Tầng 2).
5. `Reporting Microservice`: WidgetRegistry & ChartRouter (V1/V2).
6. `Phân loại đăng nhập Email TDTU SSO & JWT`: `@tdtu.edu.vn` vs `@student.tdtu.edu.vn`.
7. `RBAC Guard`: Bảo mật phân quyền, SV không can thiệp hồ sơ người khác hoặc API Giảng viên.
8. `Quản lý phân quyền Admin`: Cấp quyền, thu hồi, chuyển nhượng Admin cho Giảng viên khác.
9. `Inbound Email Forward Parser`: Bóc tách thông tin tuyển dụng & SV ứng tuyển JD.
10. `Lưu trữ bền vững SQLite`: Dữ liệu duy trì toàn vẹn qua các lần khởi động lại server.
11. `Kiểm thử biên (Edge Cases)`: Chặn khai báo chưa xác nhận, chặn ngoại ngữ sai chuẩn, bảo vệ Admin cuối.
12. `Kiểm thử hồi quy (Regression)`: Endpoint sinh viên, khai báo không có doanh nghiệp.
13. `Hồi quy MST Chi nhánh (10+3 số)` & Bóc tách Email nhiều tầng From.
14. `Bảo mật JWT bị giả mạo` & Kiểm tra đồng bộ DOM Selector `index.html`.
15. `Đăng nhập Gmail TDTU qua Firebase Authentication` (UID, ID Token, kiểm tra cổng GV/SV).
16. `Quản lý tài khoản Firebase`: 95 tài khoản, tạo mới, khóa/mở khóa tài khoản.
17. `Bảo vệ Admin hoạt động cuối cùng` qua Firebase Users API.
18. `INT-02, INT-03 & DATA-02`: Quy trình Giấy giới thiệu thực tập (Nộp đơn, Khoa duyệt, In PDF) & Biểu mẫu quy định TDTU.

---

## 6. HƯỚNG DẪN KẾ THỪA, BẢO TRÌ & MỞ RỘNG TRONG 5 NĂM TỚI

### 6.1. Thêm một Biểu đồ mới vào Dashboard (Kiến trúc Plug-and-Play)
Hệ thống sử dụng **WidgetRegistry & ChartRouter** độc lập. Để thêm một biểu đồ mới, lập trình viên không cần sửa đổi các file lõi:
1. Tạo một class Plugin mới thực thi interface `ChartPlugin` tại [`apps/api/src/modules/reporting/chart-plugins.ts`](file:///d:/KTCN_TSNN/Dashoard_TSNN-main/apps/api/src/modules/reporting/chart-plugins.ts):
   ```typescript
   export class SalaryDistributionPlugin implements ChartPlugin {
     readonly id = 'salary-distribution';
     readonly title = 'Phân bố mức trợ cấp thực tập';
     readonly subtitle = 'Thống kê theo các mức phụ cấp doanh nghiệp';
     readonly type = 'bar' as const;

     async execute(): Promise<ChartResponse> {
       return { chartId: this.id, title: this.title, subtitle: this.subtitle, type: this.type, data: { labels: ['< 3tr', '3-6tr', '> 6tr'], values: [15, 45, 31] } };
     }
   }
   ```
2. Đăng ký plugin vào `WidgetRegistry` trong [`apps/api/src/main.ts`](file:///d:/KTCN_TSNN/Dashoard_TSNN-main/apps/api/src/main.ts):
   ```typescript
   widgetRegistry.register(new SalaryDistributionPlugin());
   ```
3. Endpoint `/api/dashboard/charts/salary-distribution` và danh sách `/api/dashboard/widgets` sẽ tự động hiển thị biểu đồ mới trên giao diện mà không cần cấu hình thêm!

### 6.2. Mở rộng thêm Vai trò Người dùng mới (Dynamic RBAC)
Khi Khoa có nhu cầu bổ sung thêm vai trò **Doanh nghiệp tuyển dụng** hoặc **Giáo vụ khoa**:
1. Khai báo enum hoặc quyền hạn mới trong [`packages/shared-types/src/index.ts`](file:///d:/KTCN_TSNN/Dashoard_TSNN-main/packages/shared-types/src/index.ts).
2. Thêm ánh xạ quyền trong CSDL SQLite/Prisma (`roles`, `permissions`, `role_permissions`).
3. Cấu hình middleware kiểm tra permission tương ứng trong `AuthService`. Toàn bộ giao diện và API sẽ tự động áp dụng phân quyền mới.

### 6.3. Tối ưu Chi phí Vận hành & Duy trì Lâu dài
* **Chi phí máy chủ = 0 VNĐ trong giai đoạn học vụ:** Dự án chạy hoàn toàn trên môi trường Node.js bản địa (Node 20/24), CSDL SQLite tích hợp sẵn không tiêu tốn tài nguyên máy chủ riêng biệt, có thể deploy dễ dàng lên bất kỳ VPS sinh viên, Docker server của Trường hoặc server đám mây miễn phí/giá rẻ.
* **Không phụ thuộc thư viện bên ngoài rườm rà:** Backend tự điều phối HTTP và xử lý bóc tách email mà không cần cài đặt các gói nặng nề, đảm bảo tính bảo mật và dễ bàn giao giữa các thế hệ sinh viên.
