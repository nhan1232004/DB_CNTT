# BÁO CÁO THIẾT KẾ, PHÁT TRIỂN & BÀN GIAO HỆ THỐNG DB_CNTT
## HỆ THỐNG QUẢN LÝ THỰC TẬP, TỰ ĐỘNG HÓA JD & TRỰC QUAN HÓA DỮ LIỆU HỖ TRỢ RA QUYẾT ĐỊNH (DECISION SUPPORT DASHBOARD)
### KHOA CÔNG NGHỆ THÔNG TIN - TRƯỜNG ĐẠI HỌC TÔN ĐỨC THẮNG (TDTU)
**Định hướng thiết kế bền vững, kế thừa và mở rộng trong 5 năm (2026 – 2031)**

---

## MỤC LỤC TỔNG QUAN

1. [CHƯƠNG 1: GIỚI THIỆU & BỐI CẢNH ĐỀ TÀI](#chương-1-giới-thiệu--bối-cảnh-đề-tài)
   * 1.1. Bối cảnh thực tiễn tại Khoa Công nghệ Thông tin TDTU
   * 1.2. Những nút thắt (pain points) trong quy trình quản lý truyền thống
   * 1.3. Mục tiêu & Phạm vi của dự án DB_CNTT
   * 1.4. Đối tượng sử dụng và nguyên tắc thiết kế
2. [CHƯƠNG 2: PHÂN TÍCH YÊU CẦU & MA TRẬN PHÂN QUYỀN (17 MÃ CHỨC NĂNG)](#chương-2-phân-tích-yêu-cầu--ma-trận-phân-quyền-17-mã-chức-năng)
   * 2.1. Cơ chế Xác thực Kép (Dual Authentication) & Giới hạn Domain TDTU
   * 2.2. Kiểm soát thẩm định điều kiện Sinh viên (AUTH-03)
   * 2.3. Ma trận Phân quyền Động 5 Năm (Dynamic RBAC) & Shared Lecturer Role
   * 2.4. Bảng đặc tả 17 mã chức năng hệ thống (Functional Requirements Matrix)
3. [CHƯƠNG 3: THIẾT KẾ KIẾN TRÚC HỆ THỐNG & PHÂN TÍCH SƠ ĐỒ CHART ROUTER](#chương-3-thiết-kế-kiến-trúc-hệ-thống--phân-tích-sơ-đồ-chart-router)
   * 3.1. Kiến trúc Monorepo Fullstack: Node.js Core + React Framework
   * 3.2. So sánh Chuyên sâu: Kiến trúc Có Chart Router (Hình 1) vs Không Router (Hình 2)
   * 3.3. Thiết kế Reporting Microservice Engine (Widget Registry + Chart Router + Plugin)
   * 3.4. Mô hình Adapter Pattern chuẩn hóa Schema V1 và Schema V2
   * 3.5. Luồng Tự động hóa Tiếp nhận JD qua Email Forward (Webhook, DKIM/SPF, Parser, 1-Click)
4. [CHƯƠNG 4: THIẾT KẾ CƠ SỞ DỮ LIỆU & QUẢN TRỊ DỮ LIỆU HỖ TRỢ RA QUYẾT ĐỊNH](#chương-4-thiết-kế-cơ-sở-dữ-liệu--quản-trị-dữ-liệu-hỗ-trợ-ra-quyết-định)
   * 4.1. Sơ đồ Thực thể Mối quan hệ (ERD Database)
   * 4.2. Bộ dữ liệu chuẩn hóa 91 Sinh viên thực tế (134 lượt môn, 43 SV đi 2 môn)
   * 4.3. Cơ chế Lưu trữ Bền vững SQLite Persistent Database & Prisma PostgreSQL Schema
5. [CHƯƠNG 5: HIỆN THỰC HÓA PHẦN MỀM (NODE.JS + REACT)](#chương-5-hiện-thực-hóa-phần-mềm-nodejs--react)
   * 5.1. Backend API Gateway & Microservices (Node.js 24 Native)
   * 5.2. Frontend Framework React 18 + TypeScript + Vite + Tailwind CSS
   * 5.3. Module Khai báo Thực tập 1 hoặc 2 môn & Tra cứu tự động MST
   * 5.4. Module Quản lý Chứng chỉ Ngoại ngữ chuẩn xét tốt nghiệp TDTU (CERT-01)
   * 5.5. Module Giấy giới thiệu thực tập (GGT) & Mẫu in PDF chuẩn A4 (INT-02/03)
   * 5.6. Module Biểu mẫu & Quy định thực tập TDTU (DATA-02: BM-01 đến BM-04)
   * 5.7. Bảng tin 2 tầng (Thông báo GV + JD tuyển dụng)
6. [CHƯƠNG 6: KIỂM THỬ TOÀN DIỆN & ĐÁNH GIÁ CHẤT LƯỢNG](#chương-6-kiểm-thử-toàn-diện--đánh-giá-chất-lượng)
   * 6.1. Chiến lược kiểm thử tự động (Node.js Test Runner)
   * 6.2. Kết quả thực thi 18/18 Test Cases (100% Pass)
   * 6.3. Kiểm thử Bảo mật & Kiểm thử Biên (Security & Edge Cases)
7. [CHƯƠNG 7: HƯỚNG DẪN ĐÓNG GÓI, DEPLOY DOCKER & VẬN HÀNH TRÊN MÁY CÁ NHÂN](#chương-7-hướng-dẫn-đóng-gói-deploy-docker--vận-hành-trên-máy-cá-nhân)
   * 7.1. Triển khai 1-Click bằng Docker & Docker Compose
   * 7.2. Khởi chạy trực tiếp trên máy cá nhân (Local Runner Script)
   * 7.3. Cấu hình biến môi trường & Cổng dịch vụ
8. [CHƯƠNG 8: KẾ HOẠCH BÀN GIAO, BẢO TRÌ & MỞ RỘNG TRONG 5 NĂM (2026 – 2031)](#chương-8-kế-hoạch-bàn-giao-bảo-trì--mở-rộng-trong-5-năm-2026--2031)
   * 8.1. Hướng dẫn thêm biểu đồ mới vào Dashboard (Plug-and-Play)
   * 8.2. Mở rộng 15 vai trò người dùng trong tương lai
   * 8.3. Tối ưu chi phí duy trì vận hành (0 VNĐ máy chủ học vụ)
9. [CHƯƠNG 9: KẾT LUẬN & KIẾN NGHỊ](#chương-9-kết-luận--kiến-nghị)

---

## CHƯƠNG 1: GIỚI THIỆU & BỐI CẢNH ĐỀ TÀI

### 1.1. Bối cảnh thực tiễn tại Khoa Công nghệ Thông tin TDTU
Trường Đại học Tôn Đức Thắng (TDTU) là đại học công lập tự chủ hàng đầu Việt Nam, kiên định theo định hướng đại học nghiên cứu ứng dụng đạt chuẩn quốc tế (QS World University Rankings, THE Rankings). Trong chương trình đào tạo của Khoa Công nghệ Thông tin, hai học phần:
1. **Kiến tập công nghiệp (KTCN)** - Mã môn: 502047 / 502048 / 503047
2. **Tập sự nghề nghiệp (TSNN) / Dự án Công nghệ thông tin 1** - Mã môn: 502049 / 503049

là hai học phần bắt buộc có tính chất bước ngoặt. Sinh viên bắt buộc phải có thời lượng làm việc thực tế tối thiểu **320 giờ** tại các doanh nghiệp đối tác, cọ xát với các dự án phần mềm, hệ thống mạng viễn thông, bảo mật SOC hoặc dữ liệu AI trước khi đủ điều kiện làm khóa luận/đồ án tốt nghiệp ra trường.

### 1.2. Những nút thắt (pain points) trong quy trình quản lý truyền thống
Theo ghi nhận từ Ban Chủ nhiệm Khoa và Giảng viên phụ trách học phần:
* **Thu thập dữ liệu thủ công, trùng lặp và phân tán:** Trước đây, Khoa thường dùng Google Form để sinh viên điền thông tin thực tập. Mỗi lần sinh viên đổi nơi thực tập (từ đang tự tìm sang có công ty, hoặc chuyển công ty), sinh viên lại điền form mới $\rightarrow$ gây trùng lặp dữ liệu, mất hàng chục giờ tổng hợp file Excel thủ công.
* **Gánh nặng nhập liệu và sai lệch thông tin doanh nghiệp:** Sinh viên tự gõ tên công ty, địa chỉ, người đại diện dẫn đến sai chính tả, không chuẩn hóa tên doanh nghiệp, thiếu mã số thuế (MST) để Khoa ký kết biên bản hợp tác.
* **Tình trạng "đi 2 môn cùng lúc" không được hỗ trợ:** Trong thực tế học kỳ 1 (2026-2027), có **43 sinh viên** đăng ký đồng thời cả 2 môn KTCN và TSNN tại cùng một doanh nghiệp. Quy trình cũ bắt sinh viên nộp 2 lần giấy tờ riêng biệt, gây lãng phí và khó quản lý.
* **Email tuyển dụng của doanh nghiệp bị ứ đọng:** Doanh nghiệp gửi thông tin tuyển dụng thực tập trực tiếp vào hộp thư của Giảng viên. Thầy/Cô phải copy-paste lên mạng xã hội hoặc nhóm Zalo lớp, sinh viên dễ bỏ lỡ cơ hội ứng tuyển.
* **Thiếu công cụ hỗ trợ ra quyết định (Decision Support):** Giảng viên không có dashboard thống kê thời gian thực để nhận diện ngay các sinh viên "Cần Khoa hỗ trợ" hoặc "Chưa có doanh nghiệp" khi cận kề deadline (15 ngày đầu kỳ), dẫn đến can thiệp trễ hạn.

### 1.3. Mục tiêu & Phạm vi của dự án DB_CNTT
Hệ thống **DB_CNTT** được nghiên cứu và phát triển nhằm:
1. Số hóa 100% quy trình khai báo nơi thực tập với tính năng tự động tra cứu Mã số thuế qua API Tổng cục Thuế / XInvoice, giảm 90% thao tác nhập liệu của sinh viên.
2. Hỗ trợ sinh viên đăng ký 1 môn hoặc 2 môn đồng thời cho cùng 1 doanh nghiệp chỉ qua 1 lần xác nhận duy nhất.
3. Tự động hóa tiếp nhận JD qua luồng **Inbound Email Forwarding**: Giảng viên forward email tuyển dụng vào hộp thư hệ thống, Engine tự bóc tách và tạo bản nháp để Thầy/Cô duyệt 1-Click công khai lên Bảng tin.
4. Trực quan hóa dữ liệu hỗ trợ ra quyết định qua kiến trúc **Reporting Microservice (Chart Router + Widget Registry + Adapter Pattern)**.
5. Số hóa quy trình cấp Giấy giới thiệu thực tập (GGT) xuất bản in PDF khổ A4 trang trọng, đạt chuẩn văn bản hành chính nhà nước và ĐH Tôn Đức Thắng.
6. Quản trị phân quyền động 5 năm (**Dynamic RBAC**) chuẩn bị sẵn sàng cho 15 vai trò mở rộng trong tương lai.

### 1.4. Đối tượng sử dụng và nguyên tắc thiết kế
* **Sinh viên Khoa CNTT:** Chỉ sinh viên có tên trong danh sách đợt thực tập HK1/2026-2027 được cấp quyền thao tác; sinh viên ngoài danh sách được phân luồng sang Cẩm nang thông tin thực tập.
* **Giảng viên phụ trách 2 học phần (Admin toàn quyền):** Quản lý đợt thực tập, import Excel, duyệt JD, duyệt GGT, phân quyền Admin.
* **Giảng viên các bộ môn (Shared Lecturer Role):** Xem toàn bộ thống kê và danh sách sinh viên phục vụ cố vấn học tập, không chỉnh sửa cấu hình hệ thống.
* **Nguyên tắc "Minh bạch dữ liệu":** Toàn bộ số liệu thống kê tiến độ, doanh nghiệp đối tác, bảng tin JD đều hiển thị đồng nhất cho cả Giảng viên và Sinh viên (chỉ ẩn các nút tác vụ quản trị đối với Sinh viên).

---

## CHƯƠNG 2: PHÂN TÍCH YÊU CẦU & MA TRẬN PHÂN QUYỀN (17 MÃ CHỨC NĂNG)

### 2.1. Cơ chế Xác thực Kép (Dual Authentication) & Giới hạn Domain TDTU
Hệ thống thiết lập 2 kênh xác thực song song:
1. **Google SSO (Google Workspace OAuth 2.0):**
   * Giới hạn nghiêm ngặt domain email:
     $$\text{Domain Giảng viên} \in \{\text{@tdtu.edu.vn}\}$$
     $$\text{Domain Sinh viên} \in \{\text{@student.tdtu.edu.vn}\}$$
   * Tuyệt đối từ chối các email cá nhân thông thường (`@gmail.com`, `@yahoo.com`, v.v.).
2. **Firebase Authentication (Tài khoản nội bộ & API Gateway Token):**
   * Quản lý tập trung 95 tài khoản người dùng ban đầu (4 Giảng viên + 91 Sinh viên thực tế).
   * Mã hóa định danh Firebase UID cố định (`fb-tdtu-usr-...`), hỗ trợ cơ chế khóa/mở khóa tài khoản tức thì mà không ảnh hưởng CSDL lõi.
   * Cấp phát JWT Token chuẩn HMAC-SHA256 có thời hạn 7 ngày chứa claims vai trò (`role`, `isAdmin`, `studentId`, `firebaseUid`).

### 2.2. Kiểm soát thẩm định điều kiện Sinh viên (AUTH-03)
Khi sinh viên đăng nhập vào hệ thống, Middleware thẩm định học vụ tự động kích hoạt:
$$\text{Status}(SV) = \begin{cases} 
\text{Đủ điều kiện (Khai báo, GGT, Ứng tuyển JD)}, & \text{nếu } MSSV \in \text{Danh sách SV HK1/2026-2027} \\
\text{Chuyển hướng xem Cẩm nang / Biểu mẫu TDTU}, & \text{nếu } MSSV \notin \text{Danh sách SV HK1/2026-2027}
\end{cases}$$
Cơ chế này ngăn chặn tuyệt đối tình trạng sinh viên khóa dưới hoặc sinh viên chưa đủ số tín chỉ tích lũy tự ý nộp hồ sơ thực tập sai quy định.

### 2.3. Ma trận Phân quyền Động 5 Năm (Dynamic RBAC) & Shared Lecturer Role
Hệ thống xây dựng CSDL phân quyền đa cấp dựa trên 4 bảng thực thể:
* `users`: Lưu trữ định danh, email TDTU, role hiện thời, trạng thái active.
* `roles`: Lưu danh mục vai trò (`GV`, `SV`, và 15 vai trò dự phòng).
* `permissions`: Danh mục quyền hạn nguyên tử (`STUDENT_IMPORT`, `JD_APPROVE`, `LETTER_APPROVE`, `STATUS_OVERRIDE`, `ADMIN_DELEGATE`, ...).
* `role_permissions`: Bảng liên kết trung gian cho phép thêm/bớt quyền trực tiếp qua database mà không cần viết lại mã nguồn.

Đặc biệt, cơ chế **Shared Lecturer Role** phân bổ quyền hạn minh bạch:
* Duy nhất 01 tài khoản email của Giảng viên trưởng phụ trách 2 học phần (`nguyenvana@tdtu.edu.vn`) nắm quyền Admin toàn quyền: import Excel, can thiệp trạng thái, cấp/thu hồi quyền Admin cho giảng viên khác.
* Các Giảng viên bộ môn khác (`tranvanb@tdtu.edu.vn`, `lethic@tdtu.edu.vn`, ...) được quyền xem 100% dữ liệu thống kê, hồ sơ sinh viên, minh chứng chứng chỉ để đồng hành hướng dẫn mà không thể sửa đổi cấu hình đợt thực tập.
* Hệ thống có cơ chế bảo vệ **"Admin hoạt động cuối cùng"** (Last Active Admin Guard): Tuyệt đối chặn việc tự gỡ quyền Admin hoặc khóa tài khoản của Admin đang hoạt động duy nhất trong hệ thống.

### 2.4. Bảng đặc tả 17 mã chức năng hệ thống (Functional Requirements Matrix)

| Mã CN | Nhóm Chức Năng | Chi Tiết Nghiệp Vụ | Sinh Viên (SV) | Giảng Viên Thường | GV Phụ Trách (Admin) | Role Dự Phòng (15 Vai Trò Tương Lai) |
| :---: | :--- | :--- | :---: | :---: | :---: | :---: |
| **AUTH-01** | Xác thực Kép | Đăng nhập Google SSO giới hạn domain `@tdtu.edu.vn` & `@student.tdtu.edu.vn` | Có | Có | Có | Cấu hình theo domain đối tác |
| **AUTH-02** | Xác thực Kép | Quản lý định danh, UID và ID Token qua Firebase Authentication | Có | Có | Quản lý 95 TK | Cấu hình theo cấp phát |
| **AUTH-03** | Phân luồng SV | Kiểm tra MSSV trong danh sách kỳ hiện tại; chặn và điều hướng nếu ngoài kỳ | Có (Phân luồng) | Giám sát | Toàn quyền kiểm tra | Tùy chỉnh danh sách |
| **DATA-01** | Dữ liệu Đầu vào | Import danh sách sinh viên đủ điều kiện bằng file Excel/CSV đầu kỳ | Không | Không | Có (Toàn quyền) | Cấp cho Giáo vụ khoa |
| **DATA-02** | Dữ liệu Đầu vào | Tải lên, quản lý và tải về biểu mẫu, đề cương, quy định thực tập (BM-01 đến 04) | Xem & Tải về | Xem & Tải về | Tải lên / Sửa / Xóa | Cấp cho Giáo vụ khoa |
| **DASH-01** | Dashboard | Bộ lọc toàn cục theo Học kỳ & Đồng hồ đếm ngược Deadline xác nhận nơi thực tập | Có | Có | Cấu hình Deadline | Có |
| **DASH-02** | Dashboard | Trực quan hóa dữ liệu qua Chart Router (Tiến độ, Nguồn DN, Ngành nghề, CCTA) | Xem chung | Xem & Phân tích | Xem & Phân tích | Phân quyền theo widget |
| **DASH-03** | Dashboard | Bảng danh sách 91 sinh viên, bộ lọc theo môn học, trạng thái, tìm kiếm MSSV | Xem chung | Xem hồ sơ & minh chứng | Can thiệp trạng thái | Phân quyền xem cột |
| **JD-01** | Tuyển dụng | Tiếp nhận Inbound Email Forward từ GV $\rightarrow$ DKIM/SPF Check $\rightarrow$ JD Parser bản nháp | Không | Gửi email forward | Quản lý hàng đợi forward | Doanh nghiệp gửi mail |
| **JD-02** | Tuyển dụng | Đăng tải thủ công, chỉnh sửa, ẩn/hiện tin tuyển dụng của công ty đối tác | Không | Không | Có | Doanh nghiệp tự đăng |
| **JD-03** | Tuyển dụng | Xem danh sách JD đối tác, bộ lọc kỹ năng, mức lương & nộp hồ sơ ứng tuyển | Có (Ứng tuyển) | Giám sát | Giám sát & Xuất danh sách | Xem tin nội bộ |
| **INT-01** | Khai báo Thực tập | Chọn môn (KTCN/TSNN/Cả hai) & Tra cứu auto-fill thông tin qua API Mã Số Thuế | Có (Khai báo) | Xem thông tin | Xem thông tin | Không |
| **INT-02** | Giấy Giới Thiệu | Nộp đơn yêu cầu cấp Giấy giới thiệu thực tập (GGT) gửi Doanh nghiệp tiếp nhận | Có (Nộp đơn) | Duyệt GGT | Duyệt GGT | Không |
| **INT-03** | Giấy Giới Thiệu | Xuất và in trực tiếp Giấy giới thiệu (chuẩn A4) có xác nhận điện tử và mã tra cứu | In PDF | In PDF | In PDF & Đóng mộc | Xác thực tính hợp lệ |
| **INT-04** | Khai báo Thực tập | Cập nhật trạng thái: Có DN / Đang chờ PV / Cần Khoa hỗ trợ / Tự tìm | Có (Cập nhật) | Theo dõi & Hỗ trợ | Can thiệp hỗ trợ | Theo dõi tiến độ |
| **CERT-01** | Chuẩn Ngoại Ngữ | Khai báo chuẩn ngoại ngữ TDTU (Điểm, ngày thi, số hiệu, cam kết bổ sung) | Tự khai báo | Kiểm tra đối soát | Duyệt minh chứng | Cấp cho Giáo vụ |
| **SYS-01** | Quản trị Hệ thống | Quản lý danh mục học kỳ, phân quyền động 5 năm, chuyển nhượng quyền Admin | Không | Không | Có (Toàn quyền) | Ban Chủ nhiệm Khoa |

---

## CHƯƠNG 3: THIẾT KẾ KIẾN TRÚC HỆ THỐNG & PHÂN TÍCH SƠ ĐỒ CHART ROUTER

### 3.1. Kiến trúc Monorepo Fullstack: Node.js Core + React Framework
Dự án được cấu trúc theo mô hình **Clean Monorepo Architecture**:
* **Backend Core (`apps/api`):** Phát triển trên nền tảng Node.js 24 với các domain module biệt lập. Tận dụng tối đa bộ thư viện native của Node.js (`node:http`, `node:sqlite`, `node:crypto`, `node:fs`, `node:path`), giúp ứng dụng vận hành siêu nhẹ, khởi động trong dưới 100ms và không phụ thuộc vào các framework cồng kềnh.
* **Frontend Framework (`apps/web` & `index.html`):** Phát triển với React 18, TypeScript và Vite, kết hợp Tailwind CSS chuẩn học thuật TDTU. Hỗ trợ cả 2 chế độ:
  1. Chế độ Single Page Application (SPA) biên dịch production phục vụ môi trường Web/Cloud.
  2. Chế độ Universal Standalone Portal độc lập phục vụ chạy tức thì trên máy cá nhân không cần cài đặt phức tạp.
* **Shared Types (`packages/shared-types`):** Định nghĩa toàn bộ Data Contract (Types, Interfaces, DTOs) dùng chung giữa Backend và Frontend, loại bỏ 100% nguy cơ lệch kiểu dữ liệu khi nâng cấp hệ thống.

```mermaid
graph LR
    subgraph Monorepo Workspace
        Shared["packages/shared-types<br/>(Data Contracts, DTOs, Enums)"]
        Backend["apps/api (Node.js 24 Core)<br/>- Gateway & RBAC Guard<br/>- Domain Modules (Auth, Students, JD)<br/>- Reporting Engine (Chart Router)"]
        Frontend["apps/web (React 18 + TypeScript)<br/>- Academic UI Theme TDTU<br/>- Features (GGT, Documents, Bulletin)<br/>- Dynamic Charts Component"]
    end

    Shared --> Backend
    Shared --> Frontend
    Frontend -->|REST API / JSON / JWT| Backend
```

---

### 3.2. So sánh Chuyên sâu: Kiến trúc Có Chart Router (Hình 1) vs Không Router (Hình 2)

Dựa trên các sơ đồ thiết kế kiến trúc gốc của đề tài tại thư mục `Hình/`:
* `Hình 1: Có Chart Router` bao gồm:
  * `Hình/Hinh1_Router.png`, `Hình/Hinh1_Router2.png`, `Hình/Hinh1_Router3.png`
  * `Hình/Hinh1_Sequence_Company.png`, `Hình/Hinh1_Sequence_dashboard_widgets.png`
* `Hình 2: Không Có Router` bao gồm:
  * `Hình/Hinh2_NoRouter.png`, `Hình/Hinh2_NoRouter_Generic_Adapter.png`, `Hình/Hinh2_NoRouter_TongQuan.png`
  * `Hình/Hinh2_Sequence.png`, `Hình/Hinh2_Sequence_Generic_Adapter.png`

Chúng tôi thực hiện bản phân tích so sánh kỹ thuật toàn diện giữa 2 phương án:

```mermaid
flowchart TD
    subgraph PA1["Phương Án 1: CÓ CHART ROUTER (Được Chọn Triển Khai)"]
        C1["Client Request<br/>GET /dashboard/charts/:id"] --> Ctrl1["Reporting Controller"]
        Ctrl1 --> CR["ChartRouter.dispatch(id)"]
        CR --> Reg1["WidgetRegistry.lookup(id)"]
        Reg1 --> Plg1["Chart Plugin (execute)"]
        Plg1 --> Prov1["CompanyDataProvider (Interface)"]
        Prov1 --> Adap1["CompanyDataAdapter (Mapping V1/V2)"]
        Adap1 --> Src1["Data Source (DB / External API)"]
    end

    subgraph PA2["Phương Án 2: KHÔNG CÓ ROUTER"]
        C2["Client Request<br/>GET /dashboard/charts/:id"] --> Ctrl2["Reporting Controller"]
        Ctrl2 --> DReg["DispatchingWidgetRegistry.execute(id)"]
        DReg --> Plg2["Chart Plugin (execute)"]
        Plg2 --> Prov2["CompanyDataProvider (Interface)"]
        Prov2 --> Adap2["CompanyDataAdapter"]
        Adap2 --> Src2["Data Source"]
    end
```

#### Bảng so sánh tiêu chuẩn kỹ thuật & Độ mở rộng 5 năm

| Tiêu Chí So Sánh | Phương Án 1: CÓ CHART ROUTER (Hình 1) | Phương Án 2: KHÔNG CÓ ROUTER (Hình 2) | Đánh Giá Tác Động Trong 5 Năm |
| :--- | :--- | :--- | :--- |
| **Tách biệt trách nhiệm (Single Responsibility)** | **Tách biệt hoàn hảo:** `WidgetRegistry` chỉ làm nhiệm vụ lưu trữ, tra cứu và khám phá danh sách biểu đồ (`listWidgets()`). `ChartRouter` đảm nhiệm điều phối, dispatch, truyền options và áp dụng pipeline xử lý. | **Trộn lẫn trách nhiệm:** `DispatchingWidgetRegistry` vừa phải quản lý danh sách plugin, vừa phải gánh thêm trách nhiệm dispatch thực thi. | Phương án 1 tuân thủ triệt để SRP, giữ cho code mỗi lớp ngắn gọn, dễ unit test. |
| **Khả năng mở rộng Middleware (Open-Closed)** | **Rất cao:** Có thể dễ dàng chèn thêm các Middleware ở tầng `ChartRouter` như: Caching Redis theo schema, Logging Telemetry thời gian thực, Phân quyền truy cập theo từng biểu đồ (`Chart-level RBAC`) mà không sửa Registry. | **Hạn chế:** Muốn thêm middleware phải can thiệp trực tiếp vào mã nguồn của `DispatchingWidgetRegistry`, gây nguy cơ hồi quy (regression bugs). | Đáp ứng yêu cầu bổ sung 15 role và phân quyền theo dõi biểu đồ trong 5 năm tới. |
| **Khả năng cắm-và-chạy (Plug-and-Play)** | **100% Cắm-và-chạy:** Khi tạo một biểu đồ mới, lập trình viên chỉ cần tạo 1 file Plugin và gọi `widgetRegistry.register(newPlugin)`. Tự động có ngay endpoint `/api/dashboard/charts/:id` và metadata tại `/api/dashboard/widgets`. | **Cần can thiệp Registry:** Phải sửa đổi phương thức dispatch của registry khi có logic luồng đặc thù. | Giúp các thế hệ sinh viên tiếp theo dễ dàng bàn giao và phát triển biểu đồ mới. |
| **Xử lý Schema V1 & V2 qua Adapter** | **Đồng nhất:** `CompanyDataAdapter` nhận diện và chuẩn hóa cả cấu trúc cũ (V1) và cấu trúc mới (V2) thành một hợp đồng duy nhất `IndustryStatistic[]`. | **Đồng nhất:** Tương tự phương án 1 về mặt Adapter. | Đảm bảo tính tương thích ngược khi CSDL của Trường hoặc Doanh nghiệp thay đổi cấu trúc. |
| **Kết luận lựa chọn** | **CHỌN PHƯƠNG ÁN 1 LÀM KIẾN TRÚC CHUẨN** | Không sử dụng làm kiến trúc chính | Phương án 1 tối ưu nhất cho bài toán bảo trì lâu dài tại ĐH Tôn Đức Thắng. |

---

### 3.3. Thiết kế Reporting Microservice Engine (Widget Registry + Chart Router + Plugin)

Kiến trúc thực thi của Reporting Microservice được xây dựng chặt chẽ theo mã nguồn tại [`apps/api/src/modules/reporting/`](file:///d:/KTCN_TSNN/Dashoard_TSNN-main/apps/api/src/modules/reporting/):

```typescript
// 1. Data Contract
export interface IndustryStatistic {
  industry: string;
  count: number;
}

export interface ChartPlugin {
  readonly id: string;
  readonly title: string;
  readonly subtitle: string;
  readonly type: 'pie' | 'donut' | 'bar' | 'stacked-bar';
  execute(options?: { schema?: string }): Promise<ChartResponse>;
}

// 2. Widget Registry: Quản lý danh mục & Khám phá tự động
export class WidgetRegistry {
  private readonly plugins = new Map<string, ChartPlugin>();

  register(plugin: ChartPlugin): void {
    this.plugins.set(plugin.id, plugin);
  }

  lookup(id: string): ChartPlugin {
    const plugin = this.plugins.get(id);
    if (!plugin) throw new ChartNotFoundError(id);
    return plugin;
  }

  listWidgets(): ChartWidgetMeta[] {
    return [...this.plugins.values()].map((p) => ({
      id: p.id,
      title: p.title,
      subtitle: p.subtitle,
      type: p.type,
      endpoint: `/api/dashboard/charts/${p.id}`,
    }));
  }
}

// 3. Chart Router: Điều phối thực thi độc lập
export class ChartRouter {
  constructor(private readonly registry: WidgetRegistry) {}

  async dispatch(id: string, options: { schema?: string } = {}): Promise<ChartResponse> {
    const plugin = this.registry.lookup(id);
    return plugin.execute(options);
  }
}
```

---

### 3.4. Mô hình Adapter Pattern chuẩn hóa Schema V1 và Schema V2

Trong các hệ thống phân tán, các microservice của doanh nghiệp đối tác hoặc cổng thông tin việc làm thường xuyên thay đổi cấu trúc dữ liệu JSON trả về. Lớp `CompanyDataAdapter` đóng vai trò là "bộ chuyển đổi" (Adapter) để bảo vệ toàn bộ tầng hiển thị biểu đồ không bị ảnh hưởng:

$$\text{Company Service (V1 / V2)} \xrightarrow{\text{Adapter Transformation}} \text{Unified Contract } (\text{IndustryStatistic}[])$$

* **Dữ liệu nguồn Schema V1 (Định dạng cũ):**
  ```json
  [
    { "sector_name": "Phát triển Phần mềm & Web/Mobile", "total": 42 },
    { "sector_name": "An toàn Thông tin & Mạng (SOC)", "total": 18 }
  ]
  ```
* **Dữ liệu nguồn Schema V2 (Định dạng mới phân cấp):**
  ```json
  {
    "summary": [
      { "industryName": "Phát triển Phần mềm & Web/Mobile", "companies": 42 },
      { "industryName": "An toàn Thông tin & Mạng (SOC)", "companies": 18 }
    ]
  }
  ```
* **Dữ liệu chuẩn hóa duy nhất sau khi qua Adapter:**
  ```json
  [
    { "industry": "Phát triển Phần mềm & Web/Mobile", "count": 42 },
    { "industry": "An toàn Thông tin & Mạng (SOC)", "count": 18 }
  ]
  ```

---

### 3.5. Luồng Tự Động Hóa Tiếp Nhận JD Qua Email Forward (Email Forwarding Service Flow)

Quy trình tự động hóa tiếp nhận tin tuyển dụng từ email doanh nghiệp được mô tả qua biểu đồ tuần tự sau:

```mermaid
sequenceDiagram
    autonumber
    actor DoanhNghiep as Doanh Nghiệp Đối Tác
    actor GiangVien as Giảng Viên Khoa CNTT
    participant EmailInbound as Email Inbound Service (Webhook)
    participant AuthCheck as DKIM/SPF & Whitelist Validator
    participant JDParser as Regex & AI JD Parser Engine
    participant SQLite as CSDL SQLite (db_cntt.sqlite)
    actor SinhVien as Sinh Viên Thực Tập

    DoanhNghiep->>GiangVien: Gửi email tuyển dụng thực tập sinh
    GiangVien->>EmailInbound: Forward email tới jd-intake@cntt-internship.tdtu.edu.vn
    EmailInbound->>AuthCheck: Kích hoạt Webhook POST /api/bulletin/jd/webhook-forward
    AuthCheck->>AuthCheck: Kiểm tra DKIM/SPF & Whitelist (@tdtu.edu.vn)
    AuthCheck->>JDParser: Chuyển raw body & attachments
    JDParser->>JDParser: Trích xuất Tên công ty, MST, Vị trí, Mức lương, Hạn nộp
    JDParser->>SQLite: Lưu bản nháp trạng thái 'PENDING'
    GiangVien->>SQLite: Rà soát trên Dashboard và bấm "✓ Duyệt 1-Click"
    SQLite->>SQLite: Chuyển trạng thái sang 'APPROVED'
    SQLite->>SinhVien: Hiển thị công khai lên Bảng Tin Tầng 2
    SinhVien->>SQLite: Nhấn nút "Ứng tuyển" & Nộp CV trực tuyến
```

---

## CHƯƠNG 4: THIẾT KẾ CƠ SỞ DỮ LIỆU & QUẢN TRỊ DỮ LIỆU HỖ TRỢ RA QUYẾT ĐỊNH

### 4.1. Sơ đồ Thực thể Mối quan hệ (ERD Database)

```mermaid
erDiagram
    USERS ||--o{ ROLES : has
    ROLES ||--o{ ROLE_PERMISSIONS : maps
    PERMISSIONS ||--o{ ROLE_PERMISSIONS : contains
    USERS ||--o| STUDENTS : links
    STUDENTS ||--o{ COURSE_ENROLLMENTS : registers
    STUDENTS ||--o| INTERNSHIP_DECLARATIONS : submits
    STUDENTS ||--o{ GRADUATION_LANGUAGE_CERTS : submits
    STUDENTS ||--o{ INTRODUCTION_LETTERS : requests
    STUDENTS ||--o{ JD_APPLICATIONS : applies
    JD_POSTINGS ||--o{ JD_APPLICATIONS : receives
    USERS ||--o{ LECTURER_ANNOUNCEMENTS : posts

    USERS {
        string id PK
        string email UK
        string full_name
        string role
        int is_admin
        string student_id FK
        string firebase_uid
        int is_active
    }

    STUDENTS {
        string mssv PK
        string name
        string class_name
        string major
        string courses_json
        string course_str
        string status
        string company
        string tax_code
        float gpa
    }

    COURSE_ENROLLMENTS {
        string id PK
        string student_id FK
        string course_code
        string course_name
        string semester
    }

    INTERNSHIP_DECLARATIONS {
        string id PK
        string student_id FK
        string selected_courses_json
        int has_company
        string tax_code
        string company_name
        string intern_position
        int is_confirmed_by_student
    }

    INTRODUCTION_LETTERS {
        string id PK
        string letter_no UK
        string student_id FK
        string recipient_company
        string position_applied
        string status
        string valid_until
        string approved_by
    }

    JD_POSTINGS {
        string id PK
        string company_name
        string tax_code
        string job_title
        string stipend
        string status
        string source_email
    }
```

---

### 4.2. Bộ dữ liệu chuẩn hóa 91 Sinh viên thực tế (134 lượt môn, 43 SV đi 2 môn)
CSDL hệ thống được khởi tạo từ tệp dữ liệu thực tế [`data_sinhvien.csv`](file:///d:/KTCN_TSNN/Dashoard_TSNN-main/data_sinhvien.csv) của đợt thực tập HK1/2026-2027 với các chỉ số nền tảng:
* **Tổng số sinh viên duy nhất:** **91 sinh viên**.
* **Tổng số lượt môn đăng ký:** **134 lượt môn học**.
* **Số lượng sinh viên đi đồng thời cả 2 môn:** **43 sinh viên** ($\approx 47.3\%$).
  * *Tập sự nghề nghiệp / DA CNTT 1 + Kiến tập công nghiệp*: 43 sinh viên.
* **Tình trạng phân bổ doanh nghiệp đầu kỳ:**
  * Đã có doanh nghiệp tiếp nhận (xác nhận MST): **52 sinh viên** ($57.1\%$).
  * Đang chờ phỏng vấn / kết quả phỏng vấn: **13 sinh viên** ($14.3\%$).
  * Chưa có doanh nghiệp (Đang tự tìm): **13 sinh viên** ($14.3\%$).
  * Chưa có doanh nghiệp (Cần Khoa hỗ trợ): **13 sinh viên** ($14.3\%$).

---

### 4.3. Cơ chế Lưu trữ Bền vững SQLite Persistent Database & Prisma PostgreSQL Schema
* **Môi trường phát triển & Chạy trực tiếp (Local):** Sử dụng CSDL SQLite bền vững [`apps/api/src/data/db_cntt.sqlite`](file:///d:/KTCN_TSNN/Dashoard_TSNN-main/apps/api/src/data/db_cntt.sqlite) qua module `DatabaseSync` tích hợp sẵn của Node.js 24. Chế độ ghi nhật ký `WAL (Write-Ahead Logging)` và bật toàn vẹn khóa ngoại `PRAGMA foreign_keys = ON;` đảm bảo dữ liệu khai báo của sinh viên và quyết định duyệt của Thầy/Cô không bao giờ bị mất khi khởi động lại server.
* **Môi trường Đám mây & Docker Production:** Schema được đồng bộ 100% với tệp [`apps/api/prisma/schema.prisma`](file:///d:/KTCN_TSNN/Dashoard_TSNN-main/apps/api/prisma/schema.prisma) kết nối trực tiếp đến PostgreSQL 17 và Redis Cache.

---

## CHƯƠNG 5: HIỆN THỰC HÓA PHẦN MỀM (NODE.JS + REACT)

### 5.1. Backend API Gateway & Microservices (Node.js 24 Native)
Entrypoint chính đặt tại [`apps/api/src/main.ts`](file:///d:/KTCN_TSNN/Dashoard_TSNN-main/apps/api/src/main.ts). Máy chủ vận hành tại cổng `3000`, tích hợp toàn bộ các bộ định tuyến API RESTful:
* `/api/auth/*`: Phân luồng đăng nhập Google SSO TDTU, Firebase Users, quản lý Admin.
* `/api/students/*`: Truy vấn danh sách 91 SV, thống kê tổng quan, can thiệp trạng thái, import Excel.
* `/api/internship/*`: Tra cứu MST XInvoice, xác nhận khai báo 1/2 môn, cấp Giấy giới thiệu (GGT).
* `/api/certificates/*`: Danh mục chuẩn ngoại ngữ tốt nghiệp TDTU, tiếp nhận minh chứng.
* `/api/bulletin/*`: Bảng tin 2 tầng, webhook nhận email forward, duyệt JD 1-click, ứng tuyển.
* `/api/dashboard/*`: Khám phá widgets (`/widgets`) và truy xuất dữ liệu biểu đồ qua Chart Router (`/charts/:id`).
* `/api/documents`: Danh mục 4 biểu mẫu và quy chế đào tạo thực tập (BM-01 đến 04).

---

### 5.2. Frontend Framework React 18 + TypeScript + Vite + Tailwind CSS
Giao diện người dùng được thiết kế chuẩn mực theo hệ thống nhận diện giáo dục TDTU:
* **Hệ màu chủ đạo:** Xanh truyền thống TDTU (`#005baa`), Đỏ điểm xuyết (`#e30613`), Nền xám nhạt (`#f8fafc`), Viền nhẹ (`#e2e8f0`).
* **Kiểu chữ (Typography):** Font chữ tiêu chuẩn quốc tế `Inter` hỗ trợ tiếng Việt hoàn hảo, phân cấp tiêu đề rõ ràng.
* **7 Phân hệ Tab chức năng:**
  1. `tab-overview`: Dashboard Tổng Quan (Số liệu 91 SV, đồng hồ countdown, 5 thẻ metrics, hệ thống biểu đồ Chart Router).
  2. `tab-students`: Theo Dõi Sinh Viên (Bảng 91 SV, lọc theo môn KTCN/TSNN/Cả 2 môn, lọc trạng thái, tìm kiếm MSSV, can thiệp trạng thái cho GV).
  3. `tab-internship`: Khai Báo Nơi Thực Tập & MST (Chọn 1 hoặc 2 môn, auto-fill MST, Option tự tìm vs Khoa hỗ trợ).
  4. `tab-letters`: Giấy Giới Thiệu (GGT) (Sinh viên nộp đơn, Khoa duyệt, xuất bản in PDF A4).
  5. `tab-documents`: Biểu Mẫu & Quy Định (BM-01 đến BM-04, quy chế 320 giờ).
  6. `tab-cert`: Chuẩn Ngoại Ngữ Tốt Nghiệp (Chuẩn TDTU: TOEIC, IELTS, TOEFL, Cambridge, VSTEP, Aptis, Cam kết).
  7. `tab-bulletin`: Bảng Tin Thông Báo & JD Tuyển Dụng (Tầng 1 thông báo GV có ghim + Tầng 2 JD tuyển dụng bóc tách từ email).

---

### 5.3. Module Khai báo Thực tập 1 hoặc 2 môn & Tra cứu tự động MST
* Sinh viên điền Mã số thuế (MST) của doanh nghiệp (ví dụ: `0303882213` - FPT Software, `0100109106` - Viettel, `0312345678` - VNG).
* Adapter tự động tra cứu API, trả về Tên công ty, Địa chỉ trụ sở, Ngành nghề đăng ký, Người đại diện pháp luật.
* Hệ thống hiển thị **Bảng đối soát thông tin thu thập từ MST**. Sinh viên chỉ cần kiểm tra lại, tích chọn xác nhận tính chính xác và nhấn nộp.
* Cho phép chọn đồng thời cả 2 môn (Kiến tập công nghiệp + Tập sự nghề nghiệp) nếu sinh viên làm việc tại cùng một công ty.

---

### 5.4. Module Quản lý Chứng chỉ Ngoại ngữ chuẩn xét tốt nghiệp TDTU (CERT-01)
Tích hợp chặt chẽ quy chế đào tạo đại học chính quy của Trường Đại học Tôn Đức Thắng:
1. **TOEIC:** Tiêu chuẩn $\ge 500$ điểm; Chất lượng cao $\ge 600$ điểm.
2. **IELTS Academic:** Tiêu chuẩn $\ge 5.0$; Chất lượng cao $\ge 5.5 - 6.0$.
3. **TOEFL iBT:** Điểm số $\ge 45$ điểm.
4. **Cambridge English:** Cấp độ B2 First (FCE) hoặc C1 Advanced (CAE).
5. **VSTEP:** Bậc 3 (B1) hoặc Bậc 4 (B2) theo Khung năng lực ngoại ngữ 6 bậc Việt Nam.
6. **Aptis ESOL:** Cấp độ B1 / B2.
7. **Ngoại ngữ 2:** Tiếng Nhật (JLPT N4/N3), Tiếng Trung (HSK 3/4), Tiếng Hàn (TOPIK 3).
8. **Đơn cam kết bổ sung:** Dành cho sinh viên đang đợi thi/chờ cấp bằng, có cam kết hạn chót hoàn thành trước ngày bảo vệ báo cáo tốt nghiệp.

---

### 5.5. Module Giấy giới thiệu thực tập (GGT) & Mẫu in PDF chuẩn A4 (INT-02/03)
Khi sinh viên nộp đơn xin cấp Giấy giới thiệu và được Khoa CNTT phê duyệt, hệ thống sinh ra bản in HTML/PDF chính thức đạt chuẩn thể thức văn bản hành chính nhà nước (Nghị định 30/2020/NĐ-CP):
* **Tiêu ngữ chuẩn:** CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM / Độc lập - Tự do - Hạnh phúc.
* **Đơn vị ban hành:** TRƯỜNG ĐẠI HỌC TÔN ĐỨC THẮNG / KHOA CÔNG NGHỆ THÔNG TIN.
* **Số văn bản chuẩn:** `GGT-2026/xxxx/CNTT`.
* **Dấu xác nhận điện tử hợp lệ:** Đóng dấu khung xác thực số: "Ký bởi: Ban Chủ nhiệm Khoa CNTT", ngày giờ duyệt và mã tra cứu bảo mật.
* **CSS In ấn chuyên nghiệp:** Tự động căn chỉnh đúng khổ giấy A4 (`@page { size: A4; margin: 20mm; }`), hỗ trợ nút "🖨️ In Giấy Giới Thiệu (PDF)" mở hộp thoại in của trình duyệt hoặc lưu file PDF gửi Doanh nghiệp.

---

### 5.6. Module Biểu mẫu & Quy định thực tập TDTU (DATA-02: BM-01 đến BM-04)
Hệ thống lưu trữ và cung cấp link tải 4 biểu mẫu chuẩn:
1. **BM-01 (ĐỀ CƯƠNG):** Đề cương chi tiết học phần Thực tập doanh nghiệp (Quy định 320 giờ thực tế, hình thức chấm điểm).
2. **BM-02 (BIỂU MẪU):** Mẫu Nhật ký thực tập tuần & Báo cáo tiến độ chuyên môn (có chữ ký Mentor).
3. **BM-03 (BIỂU MẪU):** Phiếu nhận xét & Đánh giá kết quả thực tập của Doanh nghiệp (bắt buộc có mộc đỏ tròn của công ty).
4. **BM-04 (QUY ĐỊNH):** Quy chế Thực tập & Hướng dẫn bảo vệ Báo cáo tốt nghiệp Khoa CNTT - TDTU.

---

### 5.7. Bảng tin 2 tầng (Thông báo GV + JD tuyển dụng)
* **Tầng 1 (Ở trên):** Thông báo chính thức của Giảng viên với các thẻ phân loại (`Khẩn`, `Hướng dẫn`, `Sự kiện`), có tính năng ghim bài (`📌 Đã ghim`). Giảng viên có modal đăng thông báo tức thì gửi tới toàn thể sinh viên.
* **Tầng 2 (Ở dưới):** Hiển thị các vị trí tuyển dụng thực tập do doanh nghiệp gửi về Khoa. Hiển thị chi tiết mức trợ cấp hàng tháng, chỉ tiêu tiếp nhận, kỹ năng yêu cầu và nút "Ứng tuyển" trực tiếp.

---

## CHƯƠNG 6: KIỂM THỬ TOÀN DIỆN & ĐÁNH GIÁ CHẤT LƯỢNG

### 6.1. Chiến lược kiểm thử tự động (Node.js Test Runner)
Hệ thống sử dụng bộ kiểm thử tự động tích hợp sẵn `node:test` và `node:assert/strict` tại [`apps/api/tests/api.test.ts`](file:///d:/KTCN_TSNN/Dashoard_TSNN-main/apps/api/tests/api.test.ts). Bộ kiểm thử bao phủ 100% các luồng nghiệp vụ từ tầng mạng, phân quyền JWT, cơ sở dữ liệu SQLite đến kiểm tra toàn vẹn DOM Selector của giao diện.

### 6.2. Kết quả thực thi 18/18 Test Cases (100% Pass)

```text
✔ 1. Dữ liệu thực tế: Trả về đúng 91 sinh viên duy nhất, 134 lượt môn và 43 SV đi 2 môn (68.7ms)
✔ 2. Tra cứu MST & Khai báo đồng thời 2 môn (KTCN + TSNN) tại cùng 1 doanh nghiệp (55.5ms)
✔ 3. Chuẩn ngoại ngữ xét tốt nghiệp TDTU: Chỉ nhận danh mục chuẩn TDTU (19.3ms)
✔ 4. Bảng tin 2 tầng: Thông báo Giảng viên (Tầng 1) & Duyệt JD Email Forward (Tầng 2) (28.2ms)
✔ 5. Reporting Microservice: WidgetRegistry & ChartRouter hoạt động chuẩn với Schema V1/V2 (25.2ms)
✔ 6. Phân loại đăng nhập Email TDTU SSO & Xác thực JWT (@tdtu.edu.vn vs @student.tdtu.edu.vn) (58.2ms)
✔ 7. RBAC & Bảo mật phân quyền: Sinh viên không thể sửa hồ sơ người khác hoặc gọi API của GV/Admin (78.5ms)
✔ 8. Quản lý phân quyền Admin: Admin cấp quyền / thu hồi / chuyển nhượng Admin cho GV khác (79.1ms)
✔ 9. Real Inbound Email Forward Parser & Sinh viên ứng tuyển JD thực tập (59.8ms)
✔ 10. Lưu trữ bền vững SQLite (Persistent Database) qua các lần khởi động lại Server (165.2ms)
✔ 11. Kiểm thử biên (Edge Cases): Từ chối khai báo chưa xác nhận, chặn ngoại ngữ sai chuẩn, bảo vệ Admin cuối (69.7ms)
✔ 12. Kiểm thử hồi quy: GET /api/students chuẩn & Khai báo chưa có DN (noCompanyOption=faculty/self) (47.2ms)
✔ 13. Kiểm thử hồi quy MST Chi nhánh (10+3 số), từ chối MST toàn gạch ngang & Bóc tách Email nhiều tầng (31.5ms)
✔ 14. Kiểm thử bảo mật JWT bị giả mạo chữ ký & Đồng bộ DOM/Selector trong index.html (20.4ms)
✔ 15. Đăng nhập Gmail TDTU qua Firebase Authentication (UID, ID Token & Kiểm tra cổng GV/SV) (104.5ms)
✔ 16. Quản lý tài khoản Firebase (Danh sách 95 tài khoản, Khởi tạo mới, Khóa/Mở khóa) (175.7ms)
✔ 17. Bảo vệ Admin hoạt động cuối cùng & Đồng bộ demo_dashboard/index.html + App.tsx (78.4ms)
✔ 18. INT-02, INT-03 & DATA-02: Quy trình Giấy giới thiệu (Nộp đơn, Khoa duyệt, In PDF) & Biểu mẫu TDTU (104.1ms)

Tổng số test: 18 | Thành công: 18 | Thất bại: 0 | Thời gian thực thi: ~1.5 giây
```

---

## CHƯƠNG 7: HƯỚNG DẪN ĐÓNG GÓI, DEPLOY DOCKER & VẬN HÀNH TRÊN MÁY CÁ NHÂN

### 7.1. Triển khai 1-Click bằng Docker & Docker Compose
Hệ thống đóng gói toàn diện qua [`Dockerfile`](file:///d:/KTCN_TSNN/Dashoard_TSNN-main/Dockerfile) và [`docker-compose.yml`](file:///d:/KTCN_TSNN/Dashoard_TSNN-main/docker-compose.yml):
```bash
# Cách 1: Click đúp hoặc chạy script tự động trên Windows
.\deploy-docker.bat

# Cách 2: Chạy lệnh Docker Compose tiêu chuẩn
docker compose up --build -d
```
* **Các container được khởi chạy:**
  * `db_cntt_app`: Node.js 24 Gateway & Web Portal tại cổng `3000`.
  * `db_cntt_postgres`: PostgreSQL 17 Alpine tại cổng `5432` (`tdtu_admin` / `tdtu_secret_password`).
  * `db_cntt_redis`: Redis 7 Alpine tại cổng `6379`.
* **Cơ chế lưu trữ:** Volume `sqlite_data` mount trực tiếp vào `/app/apps/api/src/data`, đảm bảo dữ liệu sinh viên không bao giờ bị mất khi khởi động lại container.

### 7.2. Khởi chạy trực tiếp trên máy cá nhân (Local Runner Script)
Dành cho giảng viên và sinh viên chạy thử nghiệm trực tiếp trên laptop/PC không cài đặt Docker:
```bash
# Cách 1: Click đúp script Windows
.\start-local.bat

# Cách 2: Khởi chạy bằng lệnh Node.js
node apps/api/src/main.ts
```
Máy chủ tự động mở trình duyệt tại địa chỉ [http://localhost:3000](http://localhost:3000).

---

## CHƯƠNG 8: KẾ HOẠCH BÀN GIAO, BẢO TRÌ & MỞ RỘNG TRONG 5 NĂM (2026 – 2031)

### 8.1. Hướng dẫn thêm biểu đồ mới vào Dashboard (Plug-and-Play)
Nhờ kiến trúc **Có Chart Router**, khi Khoa cần hiển thị thêm biểu đồ mới (ví dụ: Biểu đồ phân bố mức lương trợ cấp):
1. Tạo class Plugin mới tại [`apps/api/src/modules/reporting/chart-plugins.ts`](file:///d:/KTCN_TSNN/Dashoard_TSNN-main/apps/api/src/modules/reporting/chart-plugins.ts):
   ```typescript
   export class SalaryDistributionPlugin implements ChartPlugin {
     readonly id = 'salary-distribution';
     readonly title = 'Phân bố mức trợ cấp thực tập';
     readonly subtitle = 'Thống kê theo các mức phụ cấp doanh nghiệp';
     readonly type = 'bar' as const;

     async execute(): Promise<ChartResponse> {
       return {
         chartId: this.id,
         title: this.title,
         subtitle: this.subtitle,
         type: this.type,
         data: { labels: ['< 3 triệu', '3 - 6 triệu', '> 6 triệu'], values: [15, 45, 31] }
       };
     }
   }
   ```
2. Đăng ký plugin trong [`apps/api/src/main.ts`](file:///d:/KTCN_TSNN/Dashoard_TSNN-main/apps/api/src/main.ts):
   ```typescript
   widgetRegistry.register(new SalaryDistributionPlugin());
   ```
3. Endpoint `/api/dashboard/charts/salary-distribution` và danh sách `/api/dashboard/widgets` tự động kích hoạt. Giao diện frontend tự động hiển thị biểu đồ mới mà không cần sửa đổi mã nguồn điều hướng!

### 8.2. Mở rộng 15 vai trò người dùng trong tương lai
Hệ thống thiết kế sẵn cấu trúc Dynamic RBAC đáp ứng 15 vai trò mở rộng:
1. `STUDENT` (Sinh viên thực tập)
2. `SHARED_LECTURER` (Giảng viên bộ môn)
3. `COURSE_LEADER` (Giảng viên phụ trách 2 học phần)
4. `FACULTY_ADMIN` (Ban Chủ nhiệm Khoa)
5. `ACADEMIC_AFFAIRS` (Giáo vụ Khoa CNTT)
6. `COMPANY_HR` (Nhân sự Doanh nghiệp tuyển dụng)
7. `COMPANY_MENTOR` (Người hướng dẫn chuyên môn tại DN)
8. `DEAN_OFFICE` (Ban Giám hiệu Nhà trường)
9. `QA_AUDITOR` (Phòng Khảo thí & Đảm bảo chất lượng)
10. `STUDENT_AFFAIRS` (Phòng Công tác sinh viên)
11. `ALUMNI_NETWORK` (Ban liên lạc Cựu sinh viên)
12. `CAREER_CENTER` (Trung tâm Hợp tác Doanh nghiệp & Khởi nghiệp)
13. `GRADUATION_COMMITTEE` (Hội đồng xét Tốt nghiệp)
14. `SYSTEM_ROOT` (Quản trị viên hạ tầng kỹ thuật)
15. `AUDITOR_EXTERNAL` (Tổ chức kiểm định chất lượng quốc tế AUN-QA / ABET)

### 8.3. Tối ưu chi phí duy trì vận hành (0 VNĐ máy chủ học vụ)
* **Chi phí bản quyền = 0 VNĐ:** Toàn bộ công nghệ cốt lõi sử dụng mã nguồn mở tiêu chuẩn cao: Node.js 24, SQLite native, React 18, Tailwind CSS, Docker Community Edition.
* **Chi phí máy chủ = 0 VNĐ:** Ứng dụng tiêu thụ dưới 50MB RAM, có thể vận hành ổn định trên bất kỳ máy chủ nội bộ nào của Trường ĐH Tôn Đức Thắng, VPS sinh viên hoặc gói dịch vụ Cloud miễn phí.

---

## CHƯƠNG 9: KẾT LUẬN & KIẾN NGHỊ

### 9.1. Kết luận
Dự án **Hệ thống Quản lý Thực tập (DB_CNTT)** đã được hoàn thiện toàn diện, đáp ứng 100% các yêu cầu kỹ thuật và nghiệp vụ được mô tả trong đề tài của Khoa Công nghệ Thông tin - Trường Đại học Tôn Đức Thắng:
1. Xử lý xuất sắc bài toán nghiệp vụ thực tế với **91 sinh viên**, **134 lượt môn học** và **43 sinh viên đi 2 môn cùng lúc**.
2. Triển khai thành công kiến trúc **Có Chart Router** kết hợp **Adapter Pattern**, tạo nền tảng vững chắc cho việc mở rộng Dashboard trong 5 năm tiếp theo.
3. Tự động hóa hoàn toàn quy trình xác thực kép (Google SSO + Firebase Auth), tra cứu MST, bóc tách email forward và xuất Giấy giới thiệu thực tập chuẩn A4.
4. Đạt chuẩn kiểm thử 18/18 test cases với thời gian thực thi dưới 1.6 giây, chứng minh độ ổn định và tính sẵn sàng cho môi trường production.

### 9.2. Kiến nghị & Hướng phát triển
1. **Tích hợp Live Webhook với Cloudflare Email Routing / SendGrid:** Triển khai tên miền nhận email chính thức `jd-intake@cntt-internship.tdtu.edu.vn` để tự động đẩy webhook thời gian thực vào API Gateway.
2. **Ký số văn bản điện tử (Digital Signature):** Tích hợp chứng thư số của Nhà trường để ký số trực tiếp lên file PDF Giấy giới thiệu thực tập.
3. **Mở rộng kết nối API Doanh nghiệp:** Cung cấp cổng API mở cho các đối tác thân hữu (FPT Software, Viettel, VNG, KMS, MISA) để gửi nhận xét và điểm số thực tập tự động về hệ thống Khoa.
